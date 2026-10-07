/**
 * Shiprocket Admin Controller
 * Handles admin operations for Shiprocket integration
 */

import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import {
    authenticate,
    getShiprocketSettings,
    checkServiceability,
    processOrderForShipping,
    assignAwbForOrder,
    trackShipment,
    trackByOrderId,
    trackByShipmentId,
    buildTrackingUrl,
    cancelShiprocketOrder,
    generateLabel,
    printInvoice,
    getPickupLocations,
    addPickupLocation,
    listShiprocketPickupLocations,
    ensurePickupAddressSynced,
    applyShiprocketStatus,
    parseShiprocketDate,
} from "../utils/shiprocket.js";
import { syncAddressToCouriers } from "../utils/courier.js";

// Run a Shiprocket call and report its failure as a readable 400.
// (A plain Error would become a 500, which the admin panel hides behind a
// generic "Server error" toast.)
const shiprocketCall = async (fn) => {
    try {
        return await fn();
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(400, error?.message || "Shiprocket request failed");
    }
};

// Get Shiprocket settings
export const getSettings = asyncHandler(async (req, res) => {
    const settings = await getShiprocketSettings();

    // Mask password for security
    const maskedSettings = {
        ...settings,
        password: settings.password ? "********" : null,
        token: settings.token ? "********" : null,
    };

    res.status(200).json(
        new ApiResponsive(200, { settings: maskedSettings }, "Settings fetched successfully")
    );
});

// Update Shiprocket settings
export const updateSettings = asyncHandler(async (req, res) => {
    const {
        isEnabled,
        email,
        password,
        defaultLength,
        defaultBreadth,
        defaultHeight,
        defaultWeight,
        shippingCharge,
        freeShippingThreshold,
    } = req.body;

    const settings = await getShiprocketSettings();

    const updateData = {};

    if (typeof isEnabled === "boolean") {
        updateData.isEnabled = isEnabled;
    }

    if (email !== undefined) {
        updateData.email = email.trim();
    }

    if (password && password !== "********") {
        // Encrypt password before storing
        updateData.password = "enc:" + encrypt(password.trim());
        // Clear token to force re-authentication
        updateData.token = null;
        updateData.tokenExpiry = null;
    }

    if (defaultLength !== undefined) {
        updateData.defaultLength = parseFloat(defaultLength);
    }
    if (defaultBreadth !== undefined) {
        updateData.defaultBreadth = parseFloat(defaultBreadth);
    }
    if (defaultHeight !== undefined) {
        updateData.defaultHeight = parseFloat(defaultHeight);
    }
    if (defaultWeight !== undefined) {
        updateData.defaultWeight = parseFloat(defaultWeight);
    }

    if (shippingCharge !== undefined) {
        const parsed = parseFloat(shippingCharge);
        if (isNaN(parsed) || parsed < 0) {
            throw new ApiError(400, "Shipping charge must be a valid non-negative number");
        }
        updateData.shippingCharge = parsed;
    }

    if (freeShippingThreshold !== undefined) {
        const parsed = parseFloat(freeShippingThreshold);
        if (isNaN(parsed) || parsed < 0) {
            throw new ApiError(400, "Free shipping threshold must be a valid non-negative number");
        }
        updateData.freeShippingThreshold = parsed;
    }

    updateData.updatedBy = req.admin?.id;

    const updatedSettings = await prisma.shiprocketSettings.update({
        where: { id: settings.id },
        data: updateData,
    });

    // Mask sensitive data
    const maskedSettings = {
        ...updatedSettings,
        password: updatedSettings.password ? "********" : null,
        token: updatedSettings.token ? "********" : null,
    };

    res.status(200).json(
        new ApiResponsive(200, { settings: maskedSettings }, "Settings updated successfully")
    );
});

// Test Shiprocket connection
export const testConnection = asyncHandler(async (req, res) => {
    try {
        const token = await authenticate();

        if (token) {
            res.status(200).json(
                new ApiResponsive(200, { connected: true }, "Connection successful")
            );
        } else {
            throw new Error("Failed to get authentication token");
        }
    } catch (error) {
        throw new ApiError(400, `Connection failed: ${error.message}`);
    }
});

// ---------------------------------------------------------------------------
// Pickup addresses (warehouses)
// ---------------------------------------------------------------------------

const PICKUP_LIMITS = {
    nickname: 60,
    name: 100,
    email: 150,
    phone: 20,
    address: 300,
    address2: 300,
    city: 100,
    state: 100,
    country: 100,
    pincode: 10,
};

const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");

// Read + validate the pickup address fields from a request body. Only known
// fields are returned, so a request can never set anything else on the row
// (id, shiprocketPickupId, timestamps…).
const readPickupFields = (body = {}, { requireAll }) => {
    const fields = {};

    for (const [key, max] of Object.entries(PICKUP_LIMITS)) {
        const value = body[key];
        if (value === undefined || value === null) continue;
        if (typeof value !== "string") {
            throw new ApiError(400, `${key} must be text`);
        }
        const text = value.trim();
        if (text.length > max) {
            throw new ApiError(400, `${key} must be at most ${max} characters`);
        }
        fields[key] = text;
    }

    if (requireAll) {
        for (const key of ["name", "email", "phone", "address", "city", "state", "pincode"]) {
            if (!fields[key]) {
                throw new ApiError(400, "All required fields must be provided");
            }
        }
    }

    if (fields.email !== undefined && fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
        throw new ApiError(400, "Enter a valid email address");
    }

    if (fields.phone !== undefined && fields.phone) {
        const phone = digitsOnly(fields.phone).slice(-10);
        if (phone.length !== 10) {
            throw new ApiError(400, "Phone must be a 10 digit mobile number");
        }
        fields.phone = phone;
    }

    if (fields.pincode !== undefined && fields.pincode && !/^\d{6}$/.test(fields.pincode)) {
        throw new ApiError(400, "Pincode must be 6 digits");
    }

    return fields;
};

// Get all pickup addresses
export const getPickupAddresses = asyncHandler(async (req, res) => {
    const addresses = await prisma.shiprocketPickupAddress.findMany({
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    res.status(200).json(
        new ApiResponsive(200, { addresses }, "Pickup addresses fetched successfully")
    );
});

// Create pickup address
export const createPickupAddress = asyncHandler(async (req, res) => {
    const fields = readPickupFields(req.body, { requireAll: true });
    const isDefault = typeof req.body.isDefault === "boolean" ? req.body.isDefault : true;

    // If setting as default, unset other defaults
    if (isDefault) {
        await prisma.shiprocketPickupAddress.updateMany({
            where: { isDefault: true },
            data: { isDefault: false },
        });
    }

    const pickupAddress = await prisma.shiprocketPickupAddress.create({
        data: {
            ...fields,
            nickname: fields.nickname || "Warehouse",
            address2: fields.address2 || null,
            country: fields.country || "India",
            isDefault,
        },
    });

    // Link it to (or create it in) each courier account that is set up, so any
    // problem shows up here instead of on the first customer order.
    const warnings = await syncAddressToCouriers(pickupAddress);
    const syncWarning = warnings.length > 0 ? warnings.join(" | ") : null;
    if (syncWarning) {
        console.error("Pickup address saved but not synced everywhere:", syncWarning);
    }

    const address = await prisma.shiprocketPickupAddress.findUnique({
        where: { id: pickupAddress.id },
    });

    res.status(201).json(
        new ApiResponsive(201, { address, syncWarning }, "Pickup address created successfully")
    );
});

// Update pickup address
export const updatePickupAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.shiprocketPickupAddress.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new ApiError(404, "Pickup address not found");
    }

    const fields = readPickupFields(req.body, { requireAll: false });
    const updateData = { ...fields };

    if (fields.address2 !== undefined) updateData.address2 = fields.address2 || null;
    if (typeof req.body.isDefault === "boolean") updateData.isDefault = req.body.isDefault;

    // The warehouse name is what Shiprocket matches on: a new name must be
    // looked up / created again on the next sync.
    if (fields.nickname && fields.nickname !== existing.nickname) {
        updateData.shiprocketPickupId = null;
        updateData.delhiverySynced = false;
    }

    // If setting as default, unset other defaults
    if (updateData.isDefault) {
        await prisma.shiprocketPickupAddress.updateMany({
            where: { isDefault: true, id: { not: id } },
            data: { isDefault: false },
        });
    }

    const updated = await prisma.shiprocketPickupAddress.update({
        where: { id },
        data: updateData,
    });

    res.status(200).json(
        new ApiResponsive(200, { address: updated }, "Pickup address updated successfully")
    );
});

// Delete pickup address
export const deletePickupAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.shiprocketPickupAddress.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new ApiError(404, "Pickup address not found");
    }

    await prisma.shiprocketPickupAddress.delete({
        where: { id },
    });

    res.status(200).json(
        new ApiResponsive(200, null, "Pickup address deleted successfully")
    );
});

// Import the warehouses that already exist in the Shiprocket account
export const importPickupLocations = asyncHandler(async (req, res) => {
    const remote = await shiprocketCall(() => listShiprocketPickupLocations());

    const existing = await prisma.shiprocketPickupAddress.findMany();
    const hasDefault = existing.some((address) => address.isDefault);

    let created = 0;
    let updated = 0;

    for (const location of remote) {
        if (!location.nickname) continue;

        const data = {
            nickname: location.nickname,
            name: location.name || location.nickname,
            email: location.email || "",
            phone: location.phone || "",
            address: location.address || "",
            address2: location.address2 || null,
            city: location.city || "",
            state: location.state || "",
            country: location.country || "India",
            pincode: location.pincode || "",
            shiprocketPickupId: Number.parseInt(location.id, 10) || null,
        };

        const match = existing.find(
            (address) =>
                (data.shiprocketPickupId && address.shiprocketPickupId === data.shiprocketPickupId) ||
                address.nickname === location.nickname
        );

        if (match) {
            await prisma.shiprocketPickupAddress.update({ where: { id: match.id }, data });
            updated += 1;
        } else {
            await prisma.shiprocketPickupAddress.create({
                data: { ...data, isDefault: !hasDefault && created === 0 },
            });
            created += 1;
        }
    }

    const addresses = await prisma.shiprocketPickupAddress.findMany({
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    res.status(200).json(
        new ApiResponsive(
            200,
            { addresses, created, updated, found: remote.length },
            remote.length === 0
                ? "No warehouses found in your Shiprocket account"
                : `Imported ${created} new and refreshed ${updated} existing warehouse(s)`
        )
    );
});

// Link one saved address to the Shiprocket account (creates the warehouse if missing)
export const syncPickupAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const address = await prisma.shiprocketPickupAddress.findUnique({ where: { id } });
    if (!address) {
        throw new ApiError(404, "Pickup address not found");
    }

    await shiprocketCall(() => ensurePickupAddressSynced(address));

    const updated = await prisma.shiprocketPickupAddress.findUnique({ where: { id } });

    res.status(200).json(
        new ApiResponsive(200, { address: updated }, "Warehouse is linked to your Shiprocket account")
    );
});

// ---------------------------------------------------------------------------
// Serviceability
// ---------------------------------------------------------------------------

// Check serviceability for an order
export const checkOrderServiceability = asyncHandler(async (req, res) => {
    const { pickupPincode, deliveryPincode, weight, cod } = req.body;

    if (!pickupPincode || !deliveryPincode || !weight) {
        throw new ApiError(400, "Pickup pincode, delivery pincode, and weight are required");
    }

    const result = await shiprocketCall(() =>
        checkServiceability({
            pickupPincode,
            deliveryPincode,
            weight: parseFloat(weight),
            cod: cod || false,
        })
    );

    res.status(200).json(
        new ApiResponsive(200, { serviceability: result }, "Serviceability checked successfully")
    );
});

// ---------------------------------------------------------------------------
// Order actions
// ---------------------------------------------------------------------------

const ORDER_SHIPPING_FIELDS = {
    shiprocketOrderId: true,
    shiprocketShipmentId: true,
    awbCode: true,
    courierName: true,
    shiprocketStatus: true,
};

// Sync order to Shiprocket
export const syncOrderToShiprocket = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.shiprocketOrderId) {
        throw new ApiError(400, "Order already synced to Shiprocket");
    }

    if (order.courierProvider === "DELHIVERY" && order.awbCode) {
        throw new ApiError(400, "This order is already booked with Delhivery");
    }

    const warehouseId =
        typeof req.body?.warehouseId === "string" && req.body.warehouseId
            ? req.body.warehouseId
            : undefined;

    const result = await shiprocketCall(() => processOrderForShipping(orderId, { warehouseId }));

    if (!result) {
        throw new ApiError(400, "Shiprocket is disabled. Enable it in Shiprocket settings first.");
    }

    // Fetch updated order
    const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: ORDER_SHIPPING_FIELDS,
    });

    const message = result.awbAssigned
        ? "Order sent to Shiprocket and AWB assigned"
        : `Order sent to Shiprocket, but the AWB could not be assigned: ${result.awbError}`;

    res.status(200).json(
        new ApiResponsive(
            200,
            {
                order: updatedOrder,
                awb: {
                    assigned: Boolean(result.awbAssigned),
                    error: result.awbError ?? null,
                    pickupScheduled: Boolean(result.pickupScheduled),
                    pickupError: result.pickupError ?? null,
                },
                shiprocketResponse: result,
            },
            message
        )
    );
});

// Assign the AWB (and schedule pickup) for an order that is already in Shiprocket
export const assignOrderAwb = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { shiprocketShipmentId: true },
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (!order.shiprocketShipmentId) {
        throw new ApiError(400, "Send the order to Shiprocket first");
    }

    const awb = await shiprocketCall(() => assignAwbForOrder(orderId));

    const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: ORDER_SHIPPING_FIELDS,
    });

    res.status(200).json(
        new ApiResponsive(
            200,
            { order: updatedOrder, awb },
            awb.pickupError
                ? `AWB ready, but pickup could not be scheduled: ${awb.pickupError}`
                : "AWB assigned and pickup scheduled"
        )
    );
});

// Get live tracking info for an order (and refresh our copy of it)
export const getOrderTracking = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (!order.awbCode && !order.shiprocketShipmentId) {
        throw new ApiError(400, "Order not yet synced to Shiprocket");
    }

    const raw = await shiprocketCall(() =>
        order.awbCode
            ? trackShipment(order.awbCode)
            : trackByShipmentId(order.shiprocketShipmentId)
    );

    const trackingData = raw?.tracking_data ?? {};
    const track = Array.isArray(trackingData.shipment_track)
        ? trackingData.shipment_track[0] ?? null
        : null;

    // Newest first, as Shiprocket returns them
    const activities = (trackingData.shipment_track_activities ?? []).map((activity) => ({
        date: activity.date ?? null,
        status: activity["sr-status-label"] ?? activity.status ?? null,
        activity: activity.activity ?? null,
        location: activity.location ?? null,
    }));

    const currentStatus = track?.current_status ?? null;

    // Keep the order + customer tracking record in step with what we just read
    if (currentStatus) {
        const latest = activities[0];
        await applyShiprocketStatus(order, {
            statusLabel: currentStatus,
            courier: track?.courier_name || undefined,
            awb: order.awbCode,
            etd: trackingData.etd,
            location: latest?.location,
            description: latest?.activity,
            timestamp: latest?.date,
        });
    }

    res.status(200).json(
        new ApiResponsive(
            200,
            {
                tracking: {
                    awbCode: order.awbCode,
                    courierName: track?.courier_name || order.courierName,
                    currentStatus,
                    trackUrl: trackingData.track_url || buildTrackingUrl(order.awbCode),
                    etd: trackingData.etd ?? null,
                    activities,
                    message: trackingData.error ?? null,
                },
            },
            "Tracking info fetched successfully"
        )
    );
});

// Cancel Shiprocket shipment
export const cancelShipment = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            shiprocketOrderId: true,
            shiprocketStatus: true,
        },
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (!order.shiprocketOrderId) {
        throw new ApiError(400, "Order not synced to Shiprocket");
    }

    const result = await shiprocketCall(() => cancelShiprocketOrder(order.shiprocketOrderId));

    await prisma.order.update({
        where: { id: orderId },
        data: {
            shiprocketStatus: "CANCELLED",
        },
    });

    res.status(200).json(
        new ApiResponsive(200, { result }, "Shipment cancelled successfully")
    );
});

// Get shipping label for order
export const getShippingLabel = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            shiprocketShipmentId: true,
            awbCode: true,
        },
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (!order.shiprocketShipmentId) {
        throw new ApiError(400, "Order not synced to Shiprocket");
    }

    if (!order.awbCode) {
        throw new ApiError(400, "No AWB yet. Assign an AWB first, then download the label.");
    }

    const result = await shiprocketCall(() => generateLabel(order.shiprocketShipmentId));

    // Shiprocket answers 200 even when no label was made, so check for the link
    if (!result?.label_url) {
        throw new ApiError(
            400,
            (typeof result?.response === "string" && result.response) ||
            result?.message ||
            "Shiprocket could not generate the label"
        );
    }

    res.status(200).json(
        new ApiResponsive(200, { url: result.label_url, label: result }, "Shipping label generated successfully")
    );
});

// Get invoice for order
export const getOrderInvoice = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            shiprocketOrderId: true,
        },
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (!order.shiprocketOrderId) {
        throw new ApiError(400, "Order not synced to Shiprocket");
    }

    const result = await shiprocketCall(() => printInvoice(order.shiprocketOrderId));

    if (!result?.invoice_url) {
        throw new ApiError(
            400,
            result?.message || "Shiprocket could not generate the invoice for this order"
        );
    }

    res.status(200).json(
        new ApiResponsive(200, { url: result.invoice_url, invoice: result }, "Invoice generated successfully")
    );
});

// ---------------------------------------------------------------------------
// Webhook (tracking updates pushed by Shiprocket)
// ---------------------------------------------------------------------------

let warnedAboutMissingWebhookToken = false;

// Shiprocket sends the token you configure for the webhook in the
// `x-api-key` header. Set SHIPROCKET_WEBHOOK_TOKEN to the same value.
const assertWebhookToken = (req) => {
    const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN;

    if (!expected) {
        if (!warnedAboutMissingWebhookToken) {
            warnedAboutMissingWebhookToken = true;
            console.warn(
                "SHIPROCKET_WEBHOOK_TOKEN is not set: the tracking webhook accepts unauthenticated calls."
            );
        }
        return;
    }

    const received = Buffer.from(String(req.headers["x-api-key"] ?? ""));
    const wanted = Buffer.from(expected);

    if (received.length !== wanted.length || !crypto.timingSafeEqual(received, wanted)) {
        throw new ApiError(401, "Invalid webhook token");
    }
};

// Webhook handler for Shiprocket tracking updates
export const handleWebhook = asyncHandler(async (req, res) => {
    assertWebhookToken(req);

    const body = req.body && typeof req.body === "object" ? req.body : {};

    const awb = body.awb ? String(body.awb) : null;
    const srOrderId = Number.parseInt(body.sr_order_id, 10);
    const channelOrderId = body.order_id ? String(body.order_id) : null;
    const statusLabel = body.current_status || body.shipment_status || "";

    console.log("Shiprocket webhook received:", {
        awb,
        current_status: statusLabel,
        order_id: channelOrderId,
    });

    // Shiprocket pings the URL (empty body) when the webhook is saved
    if (!awb && !channelOrderId && Number.isNaN(srOrderId)) {
        return res.status(200).json({ status: "ok" });
    }

    // Updates about a return pickup must not change the original order
    if (Number(body.is_return) === 1) {
        return res.status(200).json({ status: "ok" });
    }

    // Find order by AWB code, Shiprocket order ID or our order number
    let order = null;

    if (awb) {
        order = await prisma.order.findFirst({ where: { awbCode: awb } });
    }

    if (!order && !Number.isNaN(srOrderId)) {
        order = await prisma.order.findFirst({ where: { shiprocketOrderId: srOrderId } });
    }

    if (!order && channelOrderId) {
        order = await prisma.order.findUnique({ where: { orderNumber: channelOrderId } });

        // Older orders were sent as "<orderNumber>_<shiprocketId>"
        if (!order && channelOrderId.includes("_")) {
            order = await prisma.order.findUnique({
                where: { orderNumber: channelOrderId.split("_")[0] },
            });
        }
    }

    if (!order) {
        console.log("Order not found for webhook:", { awb, order_id: channelOrderId, sr_order_id: srOrderId });
        // Return success anyway to prevent retries
        return res.status(200).json({ status: "ok" });
    }

    // Use the newest scan for the timeline entry
    const scans = Array.isArray(body.scans) ? body.scans : [];
    const latestScan =
        scans.reduce((latest, scan) => {
            if (!latest) return scan;
            const a = parseShiprocketDate(scan?.date)?.getTime() ?? 0;
            const b = parseShiprocketDate(latest?.date)?.getTime() ?? 0;
            return a >= b ? scan : latest;
        }, null) ?? null;

    await applyShiprocketStatus(order, {
        statusLabel,
        courier: body.courier_name || undefined,
        awb,
        etd: body.etd,
        location: latestScan?.location,
        description: latestScan?.activity || latestScan?.status,
        timestamp: latestScan?.date || body.current_timestamp,
    });

    res.status(200).json({ status: "ok" });
});
