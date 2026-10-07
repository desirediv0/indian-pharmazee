/**
 * Shiprocket API Service
 * Handles all communication with Shiprocket's shipping API
 *
 * API Documentation: https://apidocs.shiprocket.in
 * Base URL: https://apiv2.shiprocket.in
 */

import { prisma } from "../config/db.js";
import { decrypt } from "./encryption.js";
import sendEmail from "./sendEmail.js";
import { getStoreConfig } from "./storeConfig.js";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

// Token validity: 10 days (240 hours)
const TOKEN_EXPIRY_HOURS = 240;

/**
 * Get Shiprocket settings from database
 */
export async function getShiprocketSettings() {
    let settings = await prisma.shiprocketSettings.findFirst();

    if (!settings) {
        // Create default settings if none exist
        settings = await prisma.shiprocketSettings.create({
            data: {
                isEnabled: false,
                defaultLength: 10,
                defaultBreadth: 10,
                defaultHeight: 10,
                defaultWeight: 0.5,
            },
        });
    }

    return settings;
}

/**
 * Check if token is valid or needs refresh
 */
function isTokenValid(settings) {
    if (!settings.token || !settings.tokenExpiry) {
        return false;
    }
    // Check if token expires in less than 1 hour (buffer time)
    const now = new Date();
    const expiryWithBuffer = new Date(settings.tokenExpiry);
    expiryWithBuffer.setHours(expiryWithBuffer.getHours() - 1);

    return now < expiryWithBuffer;
}

/**
 * Authenticate with Shiprocket and get token
 */
export async function authenticate({ force = false } = {}) {
    const settings = await getShiprocketSettings();

    if (!settings.email || !settings.password) {
        throw new Error("Shiprocket credentials not configured");
    }

    // Reuse the saved token while it is valid (unless a fresh login is forced)
    if (!force && isTokenValid(settings)) {
        return settings.token;
    }

    try {
        // Decrypt password before using
        const decryptedPassword = settings.password.startsWith("enc:")
            ? decrypt(settings.password.replace("enc:", ""))
            : settings.password;

        const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: settings.email,
                password: decryptedPassword,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Authentication failed");
        }

        // Calculate token expiry
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + TOKEN_EXPIRY_HOURS);

        // Update token in database
        await prisma.shiprocketSettings.update({
            where: { id: settings.id },
            data: {
                token: data.token,
                tokenExpiry: tokenExpiry,
            },
        });

        return data.token;
    } catch (error) {
        console.error("Shiprocket authentication error:", error);
        throw error;
    }
}

/**
 * Make authenticated request to Shiprocket API
 */
const REQUEST_TIMEOUT_MS = 30000;

// Turn a Shiprocket error body into one readable sentence.
// Validation failures come back as { message, errors: { field: ["reason"] } }.
function describeShiprocketError(data, status) {
    const parts = [];
    if (data?.message) parts.push(String(data.message));
    if (data?.errors && typeof data.errors === "object") {
        for (const [field, messages] of Object.entries(data.errors)) {
            const text = Array.isArray(messages) ? messages.join(", ") : String(messages);
            parts.push(`${field}: ${text}`);
        }
    }
    return parts.length > 0 ? parts.join(" | ") : `Shiprocket API error: ${status}`;
}

async function shiprocketRequest(endpoint, method = "GET", body = null, isRetry = false) {
    // After a 401 we log in again instead of reusing the saved token
    const token = await authenticate({ force: isRetry });

    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    };

    if (body && method !== "GET") {
        options.body = JSON.stringify(body);
    }

    const url =
        method === "GET" && body
            ? `${SHIPROCKET_BASE_URL}${endpoint}?${new URLSearchParams(body)}`
            : `${SHIPROCKET_BASE_URL}${endpoint}`;

    let response;
    try {
        response = await fetch(url, options);
    } catch (error) {
        if (error?.name === "TimeoutError") {
            throw new Error("Shiprocket did not respond in time. Please try again.");
        }
        throw error;
    }

    // Read as text first: some failures are not JSON
    const text = await response.text();
    let data = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { message: text.slice(0, 200) };
    }

    // Saved token rejected (password changed / revoked): log in once more and retry
    if (response.status === 401 && !isRetry) {
        return shiprocketRequest(endpoint, method, body, true);
    }

    if (!response.ok) {
        throw new Error(describeShiprocketError(data, response.status));
    }

    return data;
}

/**
 * Check courier serviceability for a shipment
 */
export async function checkServiceability({
    pickupPincode,
    deliveryPincode,
    weight,
    cod = false,
}) {
    const params = {
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        weight: weight,
        cod: cod ? 1 : 0,
    };

    return shiprocketRequest("/courier/serviceability/", "GET", params);
}

/**
 * Create order in Shiprocket
 */
export async function createShiprocketOrder(orderData) {
    return shiprocketRequest("/orders/create/adhoc", "POST", orderData);
}

/**
 * Assign AWB (Air Waybill) to shipment
 */
export async function assignAWB(shipmentId, courierId = null) {
    const body = {
        shipment_id: shipmentId,
    };

    if (courierId) {
        body.courier_id = courierId;
    }

    const result = await shiprocketRequest("/courier/assign/awb", "POST", body);

    // Shiprocket answers HTTP 200 even when it could not assign an AWB
    // (low wallet balance, unverified pickup location, no courier…): read the body.
    const failedByFlag =
        result?.awb_assign_status !== undefined && Number(result.awb_assign_status) !== 1;
    const failedByCode = typeof result?.status_code === "number" && result.status_code >= 300;

    if (failedByFlag || failedByCode) {
        throw new Error(
            result?.response?.data?.awb_assign_error ||
            result?.message ||
            "Shiprocket could not assign an AWB (check wallet balance and the pickup location)"
        );
    }

    return result;
}

/**
 * Schedule pickup for shipment
 */
export async function schedulePickup(shipmentId) {
    return shiprocketRequest("/courier/generate/pickup", "POST", {
        shipment_id: [shipmentId],
    });
}

/**
 * Generate shipping label
 */
export async function generateLabel(shipmentId) {
    return shiprocketRequest("/courier/generate/label", "POST", {
        shipment_id: [shipmentId],
    });
}

/**
 * Generate manifest
 */
export async function generateManifest(shipmentId) {
    return shiprocketRequest("/manifests/generate", "POST", {
        shipment_id: [shipmentId],
    });
}

/**
 * Print manifest (get PDF URL)
 */
export async function printManifest(orderId) {
    return shiprocketRequest("/manifests/print", "POST", {
        order_ids: [orderId],
    });
}

/**
 * Print invoice (get PDF URL)
 */
export async function printInvoice(orderId) {
    return shiprocketRequest("/orders/print/invoice", "POST", {
        ids: [orderId],
    });
}

/**
 * Track shipment by AWB code
 */
export async function trackShipment(awbCode) {
    return shiprocketRequest(`/courier/track/awb/${awbCode}`, "GET");
}

/**
 * Track shipment by Shiprocket order ID
 */
export async function trackByOrderId(shiprocketOrderId) {
    return shiprocketRequest(`/courier/track?order_id=${shiprocketOrderId}`, "GET");
}

/**
 * Track shipment by Shiprocket shipment ID (works before an AWB exists)
 */
export async function trackByShipmentId(shipmentId) {
    return shiprocketRequest(`/courier/track/shipment/${shipmentId}`, "GET");
}

/**
 * Customer-facing tracking page for an AWB
 */
export function buildTrackingUrl(awbCode) {
    return awbCode ? `https://shiprocket.co/tracking/${encodeURIComponent(awbCode)}` : null;
}

/**
 * Cancel order in Shiprocket
 */
export async function cancelShiprocketOrder(shiprocketOrderId) {
    return shiprocketRequest("/orders/cancel", "POST", {
        ids: [shiprocketOrderId],
    });
}

/**
 * Create return order in Shiprocket
 * This initiates a reverse pickup for the return
 */
export async function createShiprocketReturnOrder(returnData) {
    return shiprocketRequest("/orders/create/return", "POST", returnData);
}

/**
 * Process return for Shiprocket order
 * Creates a return order in Shiprocket for reverse pickup
 */
export async function processShiprocketReturn(orderId, returnReason = "Customer Return") {
    const settings = await getShiprocketSettings();

    if (!settings.isEnabled) {
        console.log("Shiprocket is disabled, skipping return processing");
        return null;
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            shippingAddress: true,
            items: {
                include: {
                    product: true,
                    variant: true,
                },
            },
        },
    });

    if (!order || !order.shiprocketOrderId) {
        console.log("Order not found or no Shiprocket order ID");
        return null;
    }

    try {
        const pickupAddress = await getDefaultPickupAddress();
        if (!pickupAddress) {
            throw new Error("No pickup address configured");
        }

        // Build return order payload
        const returnPayload = {
            order_id: order.shiprocketOrderId,
            order_date: new Date(order.createdAt).toISOString().split('T')[0],
            pickup_customer_name: order.shippingAddress.name || order.user.name,
            pickup_last_name: "",
            company_name: "",
            pickup_address: order.shippingAddress.address1 || order.shippingAddress.street,
            pickup_address_2: order.shippingAddress.address2 || "",
            pickup_city: order.shippingAddress.city,
            pickup_state: order.shippingAddress.state,
            pickup_country: order.shippingAddress.country || "India",
            pickup_pincode: order.shippingAddress.postalCode || order.shippingAddress.pincode,
            pickup_email: order.user.email,
            pickup_phone: order.shippingAddress.phone || order.user.phone,
            pickup_isd_code: "91",
            shipping_customer_name: pickupAddress.name,
            shipping_last_name: "",
            shipping_address: pickupAddress.address,
            shipping_address_2: pickupAddress.address2 || "",
            shipping_city: pickupAddress.city,
            shipping_state: pickupAddress.state,
            shipping_country: pickupAddress.country || "India",
            shipping_pincode: pickupAddress.pincode,
            shipping_email: pickupAddress.email,
            shipping_phone: pickupAddress.phone,
            shipping_isd_code: "91",
            order_items: order.items.map(item => ({
                name: item.product.name,
                sku: item.variant?.sku || item.product.sku || `SKU-${item.id.slice(-8)}`,
                units: item.quantity,
                selling_price: parseFloat(item.price),
                discount: 0,
                qc_enable: false,
            })),
            payment_method: "PREPAID",
            total_discount: 0,
            sub_total: parseFloat(order.subTotal),
            length: settings.defaultLength || 10,
            breadth: settings.defaultBreadth || 10,
            height: settings.defaultHeight || 10,
            weight: settings.defaultWeight || 0.5,
        };

        const response = await createShiprocketReturnOrder(returnPayload);

        // Update order with return info
        await prisma.order.update({
            where: { id: orderId },
            data: {
                shiprocketStatus: "RETURN_INITIATED",
                shiprocketReturnId: response.order_id?.toString() || null,
            },
        });

        console.log(`Shiprocket return created for order ${order.orderNumber}`);
        return response;
    } catch (error) {
        console.error("Failed to create Shiprocket return:", error.message);
        // Update status even if API fails
        await prisma.order.update({
            where: { id: orderId },
            data: { shiprocketStatus: "RETURN_APPROVED" },
        });
        return null;
    }
}

/**
 * Get pickup locations
 */
export async function getPickupLocations() {
    return shiprocketRequest("/settings/company/pickup", "GET");
}

/**
 * Add pickup location
 */
export async function addPickupLocation(locationData) {
    return shiprocketRequest("/settings/company/addpickup", "POST", locationData);
}

/**
 * Get default pickup address from database
 */
export async function getDefaultPickupAddress() {
    return prisma.shiprocketPickupAddress.findFirst({
        where: { isDefault: true },
    });
}

/**
 * Ensure pickup address is synced to Shiprocket
 */
// Digits only, last 10 (Shiprocket wants a 10 digit mobile number)
function cleanPhoneNumber(phone) {
    const digits = String(phone ?? "").replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Warehouses (pickup locations) that really exist in the Shiprocket account
 */
export async function listShiprocketPickupLocations() {
    const data = await getPickupLocations();
    const rows = data?.data?.shipping_address ?? data?.shipping_address ?? [];

    return rows.map((row) => ({
        id: row.id,
        nickname: row.pickup_location,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        address2: row.address_2 || "",
        city: row.city,
        state: row.state,
        country: row.country || "India",
        pincode: String(row.pin_code ?? ""),
        phoneVerified: Number(row.phone_verified) === 1,
    }));
}

async function linkPickupId(pickupAddress, shiprocketId) {
    const parsed = Number.parseInt(shiprocketId, 10);
    if (Number.isNaN(parsed)) return pickupAddress;

    await prisma.shiprocketPickupAddress.update({
        where: { id: pickupAddress.id },
        data: { shiprocketPickupId: parsed },
    });
    pickupAddress.shiprocketPickupId = parsed;
    return pickupAddress;
}

/**
 * Make sure the pickup address exists in the Shiprocket account.
 * Shiprocket only accepts orders whose `pickup_location` matches a warehouse
 * name it already knows, so we look it up and create it when missing.
 */
export async function ensurePickupAddressSynced(pickupAddress) {
    // Already linked to a Shiprocket warehouse
    if (pickupAddress.shiprocketPickupId) {
        return pickupAddress;
    }

    const nickname = (pickupAddress.nickname || "").trim() || pickupAddress.name;

    // 1) Shiprocket may already have a warehouse with this name
    const existing = (await listShiprocketPickupLocations()).find(
        (location) => location.nickname === nickname
    );
    if (existing) {
        console.log(`Using existing Shiprocket warehouse "${nickname}" (id ${existing.id})`);
        return linkPickupId(pickupAddress, existing.id);
    }

    // 2) Not there yet: create it
    try {
        const response = await addPickupLocation({
            pickup_location: nickname,
            name: pickupAddress.name,
            email: pickupAddress.email,
            phone: cleanPhoneNumber(pickupAddress.phone),
            address: pickupAddress.address,
            address_2: pickupAddress.address2 || "",
            city: pickupAddress.city,
            state: pickupAddress.state,
            country: pickupAddress.country || "India",
            pin_code: pickupAddress.pincode,
        });

        if (response?.success === false) {
            throw new Error(response.message || "Shiprocket rejected the warehouse");
        }

        const pickupId =
            response?.pickup_id ??
            response?.address?.id ??
            response?.data?.pickup_id ??
            response?.pickup_location_id ??
            response?.id ??
            response?.data?.id;

        console.log(`Warehouse "${nickname}" added to Shiprocket (id ${pickupId ?? "unknown"})`);
        return linkPickupId(pickupAddress, pickupId);
    } catch (error) {
        throw new Error(
            `Warehouse "${nickname}" is not in your Shiprocket account and could not be added: ${error.message}`
        );
    }
}

/**
 * Build order payload for Shiprocket from our Order
 */
export async function buildShiprocketOrderPayload(order, { warehouseId } = {}) {
    const settings = await getShiprocketSettings();
    const pickupAddress = warehouseId
        ? await prisma.shiprocketPickupAddress.findUnique({ where: { id: warehouseId } })
        : await getDefaultPickupAddress();

    if (!pickupAddress) {
        throw new Error(
            warehouseId
                ? "The selected warehouse no longer exists. Pick another one."
                : "No pickup address configured"
        );
    }

    // Ensure pickup address is synced to Shiprocket
    const syncedPickupAddress = await ensurePickupAddressSynced(pickupAddress);

    // Get shipping address
    const shippingAddress = order.shippingAddress;
    if (!shippingAddress) {
        throw new Error("No shipping address for order");
    }

    // Calculate total weight and dimensions
    let totalWeight = 0;
    let maxLength = settings.defaultLength;
    let maxBreadth = settings.defaultBreadth;
    let totalHeight = 0;

    const orderItems = [];

    for (const item of order.items) {
        const variant = item.variant || {};

        // Use variant dimensions or defaults
        const length = Number(variant.shippingLength || settings.defaultLength);
        const breadth = Number(variant.shippingBreadth || settings.defaultBreadth);
        const height = Number(variant.shippingHeight || settings.defaultHeight);
        const weight = Number(variant.shippingWeight || settings.defaultWeight);

        totalWeight += weight * item.quantity;
        maxLength = Math.max(maxLength, length);
        maxBreadth = Math.max(maxBreadth, breadth);
        totalHeight += height * item.quantity;

        orderItems.push({
            name: item.product.name,
            sku: variant.sku || item.product?.sku || item.productId,
            units: item.quantity,
            selling_price: parseFloat(item.price),
            discount: 0,
            tax: 0,
            hsn: "", // HSN code - can be added later
        });
    }

    // Helper to split name
    const splitName = (fullName) => {
        if (!fullName) return { first: "Customer", last: "Name" };
        const parts = fullName.trim().split(" ");
        if (parts.length === 1) return { first: parts[0], last: "Customer" }; // Default last name
        const first = parts.slice(0, -1).join(" ");
        const last = parts[parts.length - 1];
        return { first, last };
    };

    // Helper to clean phone number (10 digits)
    const cleanPhone = (phone) => {
        if (!phone) return "";
        const digits = phone.replace(/\D/g, "");
        if (digits.length > 10) return digits.slice(-10); // Take last 10 digits
        return digits;
    };

    const billingName = splitName(shippingAddress.name || order.user.name);
    const cleanedPhone = cleanPhone(shippingAddress.phone || order.user.phone || "");

    // Fail early with a readable reason instead of a vague Shiprocket validation error
    if (cleanedPhone.length !== 10) {
        throw new Error(
            `Customer phone "${cleanedPhone || "missing"}" is not a valid 10 digit number. Fix the shipping address phone and sync again.`
        );
    }

    // Build the payload
    // Helper to format date as YYYY-MM-DD HH:mm
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    // Build the payload
    const payload = {
        order_id: order.orderNumber,
        order_date: formatDate(order.createdAt),
        pickup_location: syncedPickupAddress.nickname,
        comment: order.notes || "",

        // Billing details
        billing_customer_name: billingName.first,
        billing_last_name: billingName.last,
        billing_address: shippingAddress.street,
        billing_city: shippingAddress.city,
        billing_pincode: shippingAddress.postalCode,
        billing_state: shippingAddress.state,
        billing_country: shippingAddress.country || "India",
        billing_email: order.user.email,
        billing_phone: cleanedPhone,

        // Shipping details
        shipping_is_billing: false,
        shipping_customer_name: billingName.first,
        shipping_last_name: billingName.last,
        shipping_address: shippingAddress.street,
        shipping_city: shippingAddress.city,
        shipping_pincode: shippingAddress.postalCode,
        shipping_country: shippingAddress.country || "India",
        shipping_state: shippingAddress.state,
        shipping_email: order.user.email,
        shipping_phone: cleanedPhone,

        // Order items
        order_items: orderItems,

        // Payment
        payment_method: order.paymentMethod === "CASH" ? "COD" : "Prepaid",
        // Include shipping cost in sub_total for Shiprocket
        // Shiprocket calculates: sub_total - total_discount = final amount
        // So we need: (subTotal + shipping) - discount = total
        sub_total: parseFloat(order.subTotal) + parseFloat(order.shippingCost || 0),
        total_discount: parseFloat(order.discount) || 0,

        // Dimensions
        // Shiprocket rejects zero / tiny values
        length: Math.max(maxLength, 0.5),
        breadth: Math.max(maxBreadth, 0.5),
        height: Math.max(Math.min(totalHeight, 100), 0.5),
        weight: Math.max(totalWeight, 0.1),
    };

    // Add optional fields
    if (shippingAddress.address2) {
        payload.billing_address_2 = shippingAddress.address2;
        payload.shipping_address_2 = shippingAddress.address2;
    }

    // Recursively remove empty strings and nulls
    const cleanPayload = (obj) => {
        Object.keys(obj).forEach(key => {
            if (obj[key] && typeof obj[key] === 'object') {
                cleanPayload(obj[key]);
            } else if (
                obj[key] === null ||
                obj[key] === undefined ||
                (typeof obj[key] === 'string' && obj[key].trim() === "")
            ) {
                delete obj[key];
            }
        });
        return obj;
    };

    cleanPayload(payload);

    return payload;
}

/* ------------------------------------------------------------------ */
/* Status + tracking helpers (shared by webhook, refresh and AWB flow) */
/* ------------------------------------------------------------------ */

// "In Transit" / "IN TRANSIT" / "in-transit" -> "IN_TRANSIT"
export function normalizeShiprocketStatus(label) {
    return String(label ?? "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

// Shiprocket status -> our ShipmentStatus enum (used by the Tracking table)
const SHIPMENT_STATUS_BY_KEY = {
    PICKED_UP: "SHIPPED",
    SHIPPED: "SHIPPED",
    IN_TRANSIT: "IN_TRANSIT",
    REACHED_AT_DESTINATION_HUB: "IN_TRANSIT",
    MISROUTED: "IN_TRANSIT",
    DELAYED: "IN_TRANSIT",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    UNDELIVERED: "FAILED",
    LOST: "FAILED",
    DAMAGED: "FAILED",
    RTO_INITIATED: "RETURNED",
    RTO_IN_TRANSIT: "RETURNED",
    RTO_DELIVERED: "RETURNED",
};

// Only these move the *order* itself. Cancellations / RTO are recorded on the
// shipment but never auto-cancel the order (that needs a refund decision).
const ORDER_SHIPPED_KEYS = new Set([
    "PICKED_UP",
    "SHIPPED",
    "IN_TRANSIT",
    "REACHED_AT_DESTINATION_HUB",
    "OUT_FOR_DELIVERY",
    "DELAYED",
    "MISROUTED",
]);

export function mapShiprocketStatus(label) {
    const key = normalizeShiprocketStatus(label);
    let orderStatus = null;
    if (ORDER_SHIPPED_KEYS.has(key)) orderStatus = "SHIPPED";
    else if (key === "DELIVERED") orderStatus = "DELIVERED";

    return { key, shipmentStatus: SHIPMENT_STATUS_BY_KEY[key] ?? null, orderStatus };
}

// Never move cancelled / refunded / returned orders, and never go backwards
export function canMoveOrderStatus(current, next) {
    if (next === "SHIPPED") return ["PENDING", "PROCESSING", "PAID"].includes(current);
    if (next === "DELIVERED") return ["PENDING", "PROCESSING", "PAID", "SHIPPED"].includes(current);
    return false;
}

// Shiprocket dates: "2023-05-23 11:43:52" or "23 05 2023 11:43:52" (IST)
export function parseShiprocketDate(value) {
    if (!value) return null;
    const text = String(value).trim();

    let match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(text);
    if (match) {
        const [, y, mo, d, h, mi, s = "00"] = match;
        return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}+05:30`);
    }

    match = /^(\d{2}) (\d{2}) (\d{4}) (\d{2}):(\d{2})(?::(\d{2}))?$/.exec(text);
    if (match) {
        const [, d, mo, y, h, mi, s = "00"] = match;
        return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}+05:30`);
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Keep the customer-facing Tracking record (carrier, AWB, status, timeline)
 * in step with Shiprocket. Safe to call repeatedly.
 */
export async function upsertTrackingFromShiprocket(
    orderId,
    { awb, courier, shipmentStatus, etd, location, description, timestamp } = {}
) {
    const existing = await prisma.tracking.findUnique({ where: { orderId } });
    const estimatedDelivery = parseShiprocketDate(etd) ?? undefined;
    const when = parseShiprocketDate(timestamp) ?? new Date();
    const hasTimelineEvent = Boolean(shipmentStatus && (description || location));

    if (!existing) {
        // Nothing worth showing until we have an AWB
        if (!awb) return null;

        return prisma.tracking.create({
            data: {
                orderId,
                trackingNumber: String(awb),
                carrier: courier || "Courier",
                status: shipmentStatus || "PROCESSING",
                estimatedDelivery,
                shippedAt:
                    shipmentStatus && shipmentStatus !== "PROCESSING" ? when : null,
                deliveredAt: shipmentStatus === "DELIVERED" ? when : null,
                ...(hasTimelineEvent && {
                    updates: {
                        create: {
                            status: shipmentStatus,
                            location: location || null,
                            description: description || null,
                            timestamp: when,
                        },
                    },
                }),
            },
        });
    }

    const data = {};
    if (awb && existing.trackingNumber !== String(awb)) data.trackingNumber = String(awb);
    if (courier && existing.carrier !== courier) data.carrier = courier;
    if (estimatedDelivery) data.estimatedDelivery = estimatedDelivery;

    // Webhooks can arrive out of order: never move a delivered shipment backwards
    const alreadyDelivered = existing.status === "DELIVERED";
    if (shipmentStatus && shipmentStatus !== existing.status && !alreadyDelivered) {
        data.status = shipmentStatus;
        if (shipmentStatus === "DELIVERED") data.deliveredAt = when;
        if (!existing.shippedAt && shipmentStatus !== "PROCESSING") data.shippedAt = when;
    }

    if (Object.keys(data).length > 0) {
        await prisma.tracking.update({ where: { orderId }, data });
    }

    // Add a timeline entry unless it repeats the latest one
    if (hasTimelineEvent && !alreadyDelivered) {
        const latest = await prisma.trackingUpdate.findFirst({
            where: { trackingId: existing.id },
            orderBy: { timestamp: "desc" },
        });
        const isRepeat =
            latest &&
            latest.status === shipmentStatus &&
            (latest.description ?? "") === (description ?? "") &&
            (latest.location ?? "") === (location ?? "");

        if (!isRepeat) {
            await prisma.trackingUpdate.create({
                data: {
                    trackingId: existing.id,
                    status: shipmentStatus,
                    location: location || null,
                    description: description || null,
                    timestamp: when,
                },
            });
        }
    }

    return prisma.tracking.findUnique({ where: { orderId } });
}

/**
 * Apply a Shiprocket status (from the webhook or a manual refresh) to the
 * order + its tracking record.
 */
export async function applyShiprocketStatus(
    order,
    { statusLabel, courier, awb, etd, location, description, timestamp }
) {
    const { key, shipmentStatus, orderStatus } = mapShiprocketStatus(statusLabel);

    const data = {};
    if (key) data.shiprocketStatus = key;
    if (courier) data.courierName = courier;
    if (awb && !order.awbCode) data.awbCode = String(awb);
    if (orderStatus && canMoveOrderStatus(order.status, orderStatus)) data.status = orderStatus;

    if (Object.keys(data).length > 0) {
        await prisma.order.update({ where: { id: order.id }, data });
    }

    await upsertTrackingFromShiprocket(order.id, {
        awb: awb || order.awbCode,
        courier: courier || order.courierName,
        shipmentStatus,
        etd,
        location,
        description: description || statusLabel,
        timestamp,
    });

    return { statusKey: key, orderStatus: data.status ?? order.status };
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Tell the customer their order is on its way, with the tracking link.
// Used for every courier (Shiprocket and Delhivery).
export async function sendShipmentEmail(
    order,
    awbCode,
    courierName,
    trackingUrl = buildTrackingUrl(awbCode)
) {
    const email = order.user?.email;
    if (!email || !awbCode) return;

    const { storeName, storePhone, supportEmail } = getStoreConfig();

    // Items + address for the summary (callers do not always load them)
    const full = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: { include: { product: true } }, shippingAddress: true },
    });
    const items = full?.items ?? [];
    const address = full?.shippingAddress;

    const itemRows = items
        .map(
            (item) =>
                `<tr><td style="padding:8px 0;border-bottom:1px solid #eef0f3">${escapeHtml(item.product?.name || "Item")}</td><td style="padding:8px 0;border-bottom:1px solid #eef0f3;text-align:right;white-space:nowrap;color:#6b7280">Qty ${escapeHtml(item.quantity)}</td></tr>`
        )
        .join("");

    const addressHtml = address
        ? [address.name, address.street, `${address.city}, ${address.state} - ${address.postalCode}`]
              .filter(Boolean)
              .map(escapeHtml)
              .join("<br>")
        : "";

    await sendEmail({
        email,
        subject: `Your order #${order.orderNumber} is on its way`,
        html: `
            <div style="background:#f4f6f8;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
              <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
                <div style="background:#005EB8;color:#ffffff;padding:20px 24px">
                  <div style="font-size:13px;opacity:.85">${escapeHtml(storeName)}</div>
                  <div style="font-size:22px;font-weight:bold;margin-top:4px">Your order is on its way</div>
                </div>
                <div style="padding:24px">
                  <p style="margin:0 0 12px">Hi ${escapeHtml(order.user?.name || "there")},</p>
                  <p style="margin:0 0 16px">Good news: your order <strong>#${escapeHtml(order.orderNumber)}</strong> has been handed over to our courier partner.</p>

                  <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;margin:0 0 20px">
                    <tr><td style="padding:10px 14px;color:#6b7280">Courier</td><td style="padding:10px 14px;text-align:right"><strong>${escapeHtml(courierName || "Courier partner")}</strong></td></tr>
                    <tr><td style="padding:10px 14px;color:#6b7280">Tracking number</td><td style="padding:10px 14px;text-align:right"><strong>${escapeHtml(awbCode)}</strong></td></tr>
                  </table>

                  <p style="text-align:center;margin:0 0 8px">
                    <a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#005EB8;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Track your order</a>
                  </p>
                  <p style="text-align:center;margin:0 0 24px;color:#6b7280;font-size:12px;word-break:break-all">Or open: ${escapeHtml(trackingUrl)}</p>

                  ${itemRows ? `<div style="font-weight:bold;margin:0 0 6px">In this shipment</div><table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:14px">${itemRows}</table>` : ""}
                  ${addressHtml ? `<div style="font-weight:bold;margin:0 0 6px">Delivering to</div><p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#374151">${addressHtml}</p>` : ""}

                  <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5">Questions about your delivery? Write to ${escapeHtml(supportEmail)} or call ${escapeHtml(storePhone)}.<br>Thank you for shopping with ${escapeHtml(storeName)}.</p>
                </div>
              </div>
            </div>`,
    });
}

/* ------------------------------------------------------------------ */
/* Order processing                                                    */
/* ------------------------------------------------------------------ */

// States where it is still correct to move the shipment status forward
const PRE_PICKUP_STATUSES = [null, "CREATED", "AWB_FAILED", "AWB_PENDING", "AWB_ASSIGNED"];

/**
 * Assign an AWB for an order that already exists in Shiprocket, schedule the
 * pickup, make sure the customer has a tracking record and (the first time)
 * email them the tracking link. Used right after sync and for "retry AWB".
 */
export async function assignAwbForOrder(orderId, { notify = true } = {}) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
    });

    if (!order) throw new Error("Order not found");
    if (!order.shiprocketShipmentId) {
        throw new Error("This order has not been sent to Shiprocket yet");
    }

    let awbCode = order.awbCode;
    let courierName = order.courierName;
    let freshlyAssigned = false;

    if (!awbCode) {
        let awbResponse;
        try {
            awbResponse = await assignAWB(order.shiprocketShipmentId);
        } catch (error) {
            await prisma.order.update({
                where: { id: orderId },
                data: { shiprocketStatus: "AWB_FAILED" },
            });
            throw error;
        }

        const awbData = awbResponse?.response?.data ?? {};
        awbCode = awbData.awb_code ? String(awbData.awb_code) : null;
        courierName = awbData.courier_name || null;

        if (!awbCode) {
            await prisma.order.update({
                where: { id: orderId },
                data: { shiprocketStatus: "AWB_FAILED" },
            });
            throw new Error("Shiprocket did not return an AWB code");
        }

        freshlyAssigned = true;
        await prisma.order.update({
            where: { id: orderId },
            data: { awbCode, courierName, shiprocketStatus: "AWB_ASSIGNED" },
        });
    }

    // Pickup (non-critical: an "already scheduled" answer is fine)
    let pickupScheduled = false;
    let pickupError = null;
    try {
        await schedulePickup(order.shiprocketShipmentId);
        pickupScheduled = true;
    } catch (error) {
        if (/already/i.test(error.message)) {
            pickupScheduled = true;
        } else {
            pickupError = error.message;
            console.error("Failed to schedule pickup:", error.message);
        }
    }

    if (pickupScheduled) {
        const current = await prisma.order.findUnique({
            where: { id: orderId },
            select: { shiprocketStatus: true },
        });
        if (PRE_PICKUP_STATUSES.includes(current?.shiprocketStatus ?? null)) {
            await prisma.order.update({
                where: { id: orderId },
                data: { shiprocketStatus: "PICKUP_SCHEDULED" },
            });
        }
    }

    // The customer's order page reads the Tracking record
    await upsertTrackingFromShiprocket(orderId, { awb: awbCode, courier: courierName });

    if (freshlyAssigned && notify) {
        try {
            await sendShipmentEmail(order, awbCode, courierName);
        } catch (error) {
            console.error("Shipment email failed:", error.message);
        }
    }

    return {
        awbCode,
        courierName,
        pickupScheduled,
        pickupError,
        trackingUrl: buildTrackingUrl(awbCode),
    };
}

/**
 * Process order for Shiprocket (create order + assign AWB + schedule pickup)
 */
export async function processOrderForShipping(orderId, { warehouseId } = {}) {
    // Check if Shiprocket is enabled FIRST before doing anything
    const settings = await getShiprocketSettings();

    if (!settings.isEnabled) {
        console.log("Shiprocket is disabled, skipping shipping integration");
        return null;
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            shippingAddress: true,
            items: {
                include: {
                    product: true,
                    variant: true,
                },
            },
        },
    });

    if (!order) {
        throw new Error("Order not found");
    }

    let createdInShiprocket = false;

    try {
        // Build and send order to Shiprocket
        const payload = await buildShiprocketOrderPayload(order, { warehouseId });
        const shiprocketResponse = await createShiprocketOrder(payload);

        if (!shiprocketResponse?.order_id || !shiprocketResponse?.shipment_id) {
            throw new Error(
                shiprocketResponse?.message ||
                "Shiprocket did not return an order id / shipment id"
            );
        }

        // Update order with Shiprocket details
        await prisma.order.update({
            where: { id: orderId },
            data: {
                shiprocketOrderId: shiprocketResponse.order_id,
                shiprocketShipmentId: shiprocketResponse.shipment_id,
                shiprocketStatus: "CREATED",
                courierProvider: "SHIPROCKET",
                courierWarehouseId:
                    warehouseId || (await getDefaultPickupAddress())?.id || null,
            },
        });
        createdInShiprocket = true;

        // AWB + pickup are best effort here; the admin can retry from the order page
        let awbResult = { awbAssigned: false, awbError: null };
        try {
            const assigned = await assignAwbForOrder(orderId);
            awbResult = { awbAssigned: true, awbError: null, ...assigned };
        } catch (awbError) {
            console.error("Failed to assign AWB:", awbError.message);
            awbResult = { awbAssigned: false, awbError: awbError.message };
        }

        return { ...shiprocketResponse, ...awbResult };
    } catch (error) {
        console.error("Failed to process order for Shiprocket:", error.message);

        // Leave a visible trace so the admin can see it failed and retry
        if (!createdInShiprocket) {
            try {
                await prisma.order.update({
                    where: { id: orderId },
                    data: { shiprocketStatus: "SYNC_FAILED" },
                });
            } catch (statusError) {
                console.error("Could not record sync failure:", statusError.message);
            }
        }
        throw error;
    }
}
