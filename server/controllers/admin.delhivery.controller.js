/**
 * Delhivery admin controller: settings, warehouses, rate estimate, booking,
 * tracking, cancellation, shipping label and the tracking webhook.
 */

import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { encrypt } from "../utils/encryption.js";
import {
    SPEEDS,
    normalizeSpeed,
    getDelhiverySettings,
    readApiToken,
    testDelhiveryConnection,
    checkPincodeServiceability,
    estimateDelhiveryCharges,
    syncAddressToDelhivery,
    bookDelhiveryShipment,
    trackDelhiveryShipment,
    applyDelhiveryStatus,
    cancelDelhiveryShipment,
    getDelhiveryLabel,
    buildDelhiveryTrackingUrl,
    measureOrder,
    paymentModeFor,
} from "../utils/delhivery.js";

// Report a Delhivery failure as a readable 400 (a plain Error would become a
// 500, which the admin panel hides behind a generic "Server error" toast)
const delhiveryCall = async (fn) => {
    try {
        return await fn();
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(400, error?.message || "Delhivery request failed");
    }
};

const MASK = "********";

const maskSettings = (settings) => ({
    ...settings,
    apiToken: settings.apiToken ? MASK : null,
});

/* ------------------------------------------------------------------ */
/* Input helpers                                                       */
/* ------------------------------------------------------------------ */

const readText = (value, field, max) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== "string") throw new ApiError(400, `${field} must be text`);
    const text = value.trim();
    if (text.length > max) throw new ApiError(400, `${field} must be at most ${max} characters`);
    return text || null;
};

const readNumber = (value, field, min, max) => {
    if (value === undefined) return undefined;
    const number = Number(value);
    if (value === "" || value === null || !Number.isFinite(number) || number < min || number > max) {
        throw new ApiError(400, `${field} must be a number between ${min} and ${max}`);
    }
    return number;
};

const readChoice = (value, field, allowed) => {
    if (value === undefined) return undefined;
    const upper = String(value).toUpperCase();
    if (!allowed.includes(upper)) {
        throw new ApiError(400, `${field} must be one of: ${allowed.join(", ")}`);
    }
    return upper;
};

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const getSettings = asyncHandler(async (req, res) => {
    const settings = await getDelhiverySettings();

    res.status(200).json(
        new ApiResponsive(200, { settings: maskSettings(settings) }, "Settings fetched successfully")
    );
});

export const updateSettings = asyncHandler(async (req, res) => {
    const body = req.body || {};
    const current = await getDelhiverySettings();

    const data = {};

    if (body.isEnabled !== undefined) {
        if (typeof body.isEnabled !== "boolean") {
            throw new ApiError(400, "isEnabled must be true or false");
        }
        data.isEnabled = body.isEnabled;
    }

    const clientName = readText(body.clientName, "Client name", 100);
    if (clientName !== undefined) data.clientName = clientName;

    if (body.apiToken !== undefined && body.apiToken !== null) {
        if (typeof body.apiToken !== "string") throw new ApiError(400, "API token must be text");
        const token = body.apiToken.trim();
        // The panel sends back the mask when the token was not touched
        if (token && token !== MASK) {
            if (token.length > 500) throw new ApiError(400, "API token is too long");
            data.apiToken = "enc:" + encrypt(token);
        }
    }

    const gstin = readText(body.sellerGstTin, "Seller GST number", 20);
    if (gstin !== undefined) {
        if (gstin && !/^[0-9A-Za-z]{15}$/.test(gstin)) {
            throw new ApiError(400, "A GST number has 15 letters and digits");
        }
        data.sellerGstTin = gstin ? gstin.toUpperCase() : null;
    }

    const hsn = readText(body.defaultHsnCode, "HSN code", 10);
    if (hsn !== undefined) {
        if (hsn && !/^\d{4,8}$/.test(hsn)) {
            throw new ApiError(400, "An HSN code has 4 to 8 digits");
        }
        data.defaultHsnCode = hsn;
    }

    const length = readNumber(body.defaultLength, "Length", 0.5, 200);
    const breadth = readNumber(body.defaultBreadth, "Breadth", 0.5, 200);
    const height = readNumber(body.defaultHeight, "Height", 0.5, 200);
    const weight = readNumber(body.defaultWeight, "Weight", 0.01, 50);
    if (length !== undefined) data.defaultLength = length;
    if (breadth !== undefined) data.defaultBreadth = breadth;
    if (height !== undefined) data.defaultHeight = height;
    if (weight !== undefined) data.defaultWeight = weight;

    const bookingMode = readChoice(body.bookingMode, "Booking mode", ["AUTO", "MANUAL"]);
    if (bookingMode !== undefined) data.bookingMode = bookingMode;

    const shippingSpeed = readChoice(body.shippingSpeed, "Shipping speed", ["SURFACE", "EXPRESS"]);
    if (shippingSpeed !== undefined) data.shippingSpeed = shippingSpeed;

    const willHaveToken = Boolean(data.apiToken || current.apiToken);
    if (data.isEnabled === true && !willHaveToken) {
        throw new ApiError(400, "Add your Delhivery API token before turning Delhivery on");
    }

    data.updatedBy = req.admin?.id;

    const updated = await prisma.delhiverySettings.update({
        where: { id: current.id },
        data,
    });

    res.status(200).json(
        new ApiResponsive(200, { settings: maskSettings(updated) }, "Settings updated successfully")
    );
});

export const testConnection = asyncHandler(async (req, res) => {
    const settings = await getDelhiverySettings();

    if (!readApiToken(settings)) {
        throw new ApiError(400, "Add your Delhivery API token first");
    }

    try {
        await testDelhiveryConnection(settings);
    } catch (error) {
        throw new ApiError(400, `Connection failed: ${error.message}`);
    }

    res.status(200).json(new ApiResponsive(200, { connected: true }, "Connection successful"));
});

/* ------------------------------------------------------------------ */
/* Warehouses                                                          */
/* ------------------------------------------------------------------ */

// Register one saved warehouse with Delhivery
export const syncPickupAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const address = await prisma.shiprocketPickupAddress.findUnique({ where: { id } });
    if (!address) throw new ApiError(404, "Pickup address not found");

    const settings = await getDelhiverySettings();
    if (!readApiToken(settings)) {
        throw new ApiError(400, "Add your Delhivery API token first");
    }

    await delhiveryCall(() => syncAddressToDelhivery(address, settings));

    const updated = await prisma.shiprocketPickupAddress.findUnique({ where: { id } });

    res.status(200).json(
        new ApiResponsive(200, { address: updated }, "Warehouse is registered with Delhivery")
    );
});

/* ------------------------------------------------------------------ */
/* Order actions                                                       */
/* ------------------------------------------------------------------ */

const COURIER_FIELDS = {
    awbCode: true,
    courierName: true,
    courierProvider: true,
    courierStatus: true,
    courierSpeed: true,
    courierWarehouseId: true,
};

const readWarehouseId = (value) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value !== "string" || value.length > 100) {
        throw new ApiError(400, "warehouseId is not valid");
    }
    return value;
};

async function warehouseFor(warehouseId) {
    if (warehouseId) {
        const chosen = await prisma.shiprocketPickupAddress.findUnique({ where: { id: warehouseId } });
        if (!chosen) throw new ApiError(404, "Warehouse not found");
        return chosen;
    }
    const fallback =
        (await prisma.shiprocketPickupAddress.findFirst({ where: { isDefault: true } })) ??
        (await prisma.shiprocketPickupAddress.findFirst({}));
    if (!fallback) throw new ApiError(400, "Add a pickup address (warehouse) first");
    return fallback;
}

// Rates for Surface and Express from the chosen warehouse
export const estimateRates = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const warehouseId = readWarehouseId(req.body?.warehouseId);

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { shippingAddress: true, items: { include: { variant: true } } },
    });
    if (!order) throw new ApiError(404, "Order not found");
    if (!order.shippingAddress?.postalCode) {
        throw new ApiError(400, "This order has no delivery pincode");
    }

    const settings = await getDelhiverySettings();
    if (!readApiToken(settings)) throw new ApiError(400, "Add your Delhivery API token first");

    const warehouse = await warehouseFor(warehouseId);
    const size = measureOrder(order, settings);
    const paymentMode = paymentModeFor(order);

    const input = (speed) => ({
        originPin: warehouse.pincode,
        destPin: order.shippingAddress.postalCode,
        weightGrams: size.weightGrams,
        speed,
        paymentMode,
        codAmount: Number(order.total),
    });

    const [surface, express, serviceability] = await Promise.allSettled([
        estimateDelhiveryCharges(input("SURFACE"), settings),
        estimateDelhiveryCharges(input("EXPRESS"), settings),
        checkPincodeServiceability(order.shippingAddress.postalCode, settings),
    ]);

    // A rejected token fails every call: say so instead of showing empty prices
    const tokenProblem = [surface, express, serviceability].find(
        (result) => result.status === "rejected" && /rejected the API token/i.test(result.reason?.message ?? "")
    );
    if (tokenProblem) throw new ApiError(400, tokenProblem.reason.message);

    const fulfilled = (result) => (result.status === "fulfilled" ? result.value : null);
    const failure = (result) => (result.status === "rejected" ? result.reason?.message : null);

    res.status(200).json(
        new ApiResponsive(
            200,
            {
                warehouseId: warehouse.id,
                weightGrams: size.weightGrams,
                paymentMode,
                surface: fulfilled(surface),
                express: fulfilled(express),
                errors: { surface: failure(surface), express: failure(express) },
                serviceability: fulfilled(serviceability),
            },
            "Rates fetched successfully"
        )
    );
});

// Book the shipment with Delhivery
export const bookOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const warehouseId = readWarehouseId(req.body?.warehouseId);
    const speed = req.body?.speed === undefined ? undefined : readChoice(req.body.speed, "Speed", ["SURFACE", "EXPRESS"]);

    const exists = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
    if (!exists) throw new ApiError(404, "Order not found");

    const booking = await delhiveryCall(() => bookDelhiveryShipment(orderId, { warehouseId, speed }));

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: COURIER_FIELDS });

    res.status(200).json(
        new ApiResponsive(
            200,
            { order, booking },
            `Booked with Delhivery (${SPEEDS[booking.speed].label}). Waybill ${booking.awbCode}`
        )
    );
});

const loadDelhiveryOrder = async (orderId, extra = {}) => {
    const order = await prisma.order.findUnique({ where: { id: orderId }, ...extra });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.courierProvider !== "DELHIVERY" || !order.awbCode) {
        throw new ApiError(400, "This order is not booked with Delhivery");
    }
    return order;
};

// Live tracking (and refresh our copy of it)
export const getOrderTracking = asyncHandler(async (req, res) => {
    const order = await loadDelhiveryOrder(req.params.orderId);
    const settings = await getDelhiverySettings();

    const tracking = await delhiveryCall(() => trackDelhiveryShipment(order.awbCode, settings));

    if (tracking.statusLabel) {
        await applyDelhiveryStatus(order, tracking);
    }

    res.status(200).json(
        new ApiResponsive(
            200,
            {
                tracking: {
                    awbCode: order.awbCode,
                    courierName: "Delhivery",
                    currentStatus: tracking.statusLabel,
                    trackUrl: buildDelhiveryTrackingUrl(order.awbCode),
                    etd: tracking.expectedDelivery,
                    activities: tracking.scans,
                    message: tracking.scans.length === 0 ? tracking.instructions : null,
                },
            },
            "Tracking info fetched successfully"
        )
    );
});

export const cancelOrder = asyncHandler(async (req, res) => {
    const order = await loadDelhiveryOrder(req.params.orderId);
    const settings = await getDelhiverySettings();

    await delhiveryCall(() => cancelDelhiveryShipment(order.awbCode, settings));

    await prisma.order.update({
        where: { id: order.id },
        data: { courierStatus: "CANCELLED" },
    });

    res.status(200).json(new ApiResponsive(200, null, "Shipment cancelled successfully"));
});

// Shipping label: { url } (Delhivery PDF) or { html } (printable label)
export const getOrderLabel = asyncHandler(async (req, res) => {
    const order = await loadDelhiveryOrder(req.params.orderId, {
        include: {
            user: true,
            shippingAddress: true,
            items: { include: { product: true, variant: true } },
        },
    });
    const settings = await getDelhiverySettings();

    const label = await delhiveryCall(() => getDelhiveryLabel(order, settings));

    res.status(200).json(new ApiResponsive(200, label, "Shipping label ready"));
});

/* ------------------------------------------------------------------ */
/* Webhook (scan updates pushed by Delhivery)                          */
/* ------------------------------------------------------------------ */

let warnedAboutMissingWebhookToken = false;

// Delhivery can send an agreed header with every push. Set
// DELHIVERY_WEBHOOK_TOKEN to that value (sent as x-api-key or Authorization).
const assertWebhookToken = (req) => {
    const expected = process.env.DELHIVERY_WEBHOOK_TOKEN;

    if (!expected) {
        if (!warnedAboutMissingWebhookToken) {
            warnedAboutMissingWebhookToken = true;
            console.warn(
                "DELHIVERY_WEBHOOK_TOKEN is not set: the Delhivery webhook accepts unauthenticated calls."
            );
        }
        return;
    }

    const header = String(req.headers["x-api-key"] ?? req.headers.authorization ?? "")
        .replace(/^(Bearer|Token)\s+/i, "")
        .trim();
    const received = Buffer.from(header);
    const wanted = Buffer.from(expected);

    if (received.length !== wanted.length || !crypto.timingSafeEqual(received, wanted)) {
        throw new ApiError(401, "Invalid webhook token");
    }
};

export const handleWebhook = asyncHandler(async (req, res) => {
    assertWebhookToken(req);

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const shipment = body.Shipment ?? body.shipment ?? body;
    const status = shipment?.Status ?? {};

    const awb = shipment?.AWB ? String(shipment.AWB) : null;
    const reference = shipment?.ReferenceNo ? String(shipment.ReferenceNo) : null;

    console.log("Delhivery webhook received:", { awb, reference, status: status.Status });

    if (!awb && !reference) {
        return res.status(200).json({ status: "ok" });
    }

    let order = null;
    if (awb) order = await prisma.order.findFirst({ where: { awbCode: awb } });
    if (!order && reference) order = await prisma.order.findUnique({ where: { orderNumber: reference } });

    // Only touch orders that really ship with Delhivery
    if (!order || order.courierProvider !== "DELHIVERY") {
        return res.status(200).json({ status: "ok" });
    }

    await applyDelhiveryStatus(order, {
        statusLabel: status.Status,
        statusType: status.StatusType,
        location: status.StatusLocation,
        instructions: status.Instructions,
        timestamp: status.StatusDateTime,
        expectedDelivery: shipment.ExpectedDeliveryDate,
    });

    res.status(200).json({ status: "ok" });
});
