/**
 * Delhivery (B2C / Express API) service
 *
 * Docs: https://delhivery-express-api-doc.readme.io
 * Auth: a single static API token sent as `Authorization: Token <token>`.
 *
 * Production host: https://track.delhivery.com
 * Staging host:    https://staging-express.delhivery.com
 * (override with the DELHIVERY_API_URL environment variable)
 */

import { prisma } from "../config/db.js";
import { decrypt } from "./encryption.js";
import { getStoreConfig } from "./storeConfig.js";
import { escapeHtml, formatMoney, printableDocument } from "./html.js";
import { code128Svg } from "./barcode128.js";
import {
    upsertTrackingFromShiprocket,
    sendShipmentEmail,
    canMoveOrderStatus,
    normalizeShiprocketStatus,
} from "./shiprocket.js";

const DEFAULT_BASE_URL = "https://track.delhivery.com";
const REQUEST_TIMEOUT_MS = 30000;

export const SPEEDS = {
    SURFACE: { mode: "Surface", code: "S", label: "Surface" },
    EXPRESS: { mode: "Express", code: "E", label: "Express" },
};

export const normalizeSpeed = (value) =>
    String(value ?? "").toUpperCase() === "EXPRESS" ? "EXPRESS" : "SURFACE";

const baseUrl = () => (process.env.DELHIVERY_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

/** Customer-facing tracking page for a waybill */
export function buildDelhiveryTrackingUrl(waybill) {
    return waybill
        ? `https://www.delhivery.com/track-v2/package/${encodeURIComponent(waybill)}`
        : null;
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export async function getDelhiverySettings() {
    let settings = await prisma.delhiverySettings.findFirst();
    if (!settings) {
        settings = await prisma.delhiverySettings.create({ data: {} });
    }
    return settings;
}

export function readApiToken(settings) {
    if (!settings?.apiToken) return null;
    return settings.apiToken.startsWith("enc:")
        ? decrypt(settings.apiToken.slice(4))
        : settings.apiToken;
}

/* ------------------------------------------------------------------ */
/* HTTP                                                                */
/* ------------------------------------------------------------------ */

// Pull a readable sentence out of the many shapes Delhivery uses for errors
function describeError(data, fallback) {
    const parts = [];
    const add = (value) => {
        if (!value || typeof value === "boolean") return;
        if (Array.isArray(value)) value.forEach(add);
        else if (typeof value === "object") Object.values(value).forEach(add);
        else parts.push(String(value));
    };

    add(data?.rmk);
    add(data?.error);
    add(data?.remark);
    add(data?.message);
    add(data?.Error);
    add(data?.packages?.[0]?.remarks);

    const unique = [...new Set(parts.map((part) => part.trim()).filter(Boolean))];
    return unique.length > 0 ? unique.join(" | ") : fallback;
}

async function delhiveryRequest(path, { method = "GET", query, json, rawBody, settings } = {}) {
    const config = settings ?? (await getDelhiverySettings());
    const token = readApiToken(config);
    if (!token) {
        throw new Error("Delhivery API token is not configured");
    }

    const url = new URL(baseUrl() + path);
    for (const [key, value] of Object.entries(query ?? {})) {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, String(value));
        }
    }

    const headers = { Authorization: `Token ${token}`, Accept: "application/json" };
    let body;
    if (rawBody !== undefined) {
        body = rawBody;
        headers["Content-Type"] = "application/json";
    } else if (json !== undefined) {
        body = JSON.stringify(json);
        headers["Content-Type"] = "application/json";
    }

    let response;
    try {
        response = await fetch(url, {
            method,
            headers,
            body,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
    } catch (error) {
        if (error?.name === "TimeoutError") {
            throw new Error("Delhivery did not respond in time. Please try again.");
        }
        throw error;
    }

    // Read as text first: some failures are plain text, not JSON
    const text = await response.text();
    let data = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { message: text.slice(0, 200) };
    }

    if (response.status === 401 || response.status === 403 || /couldn'?t be authenticated/i.test(text)) {
        throw new Error(
            "Delhivery rejected the API token. Check the token, and that it belongs to the same (live / test) environment."
        );
    }

    return { ok: response.ok, status: response.status, data };
}

/* ------------------------------------------------------------------ */
/* Connection, serviceability, rates                                   */
/* ------------------------------------------------------------------ */

export async function testDelhiveryConnection(settings) {
    // A cheap authenticated call: look up a well known pincode
    const { ok, data } = await delhiveryRequest("/c/api/pin-codes/json/", {
        query: { filter_codes: "110001" },
        settings,
    });

    if (!ok || !Array.isArray(data?.delivery_codes)) {
        throw new Error(describeError(data, "Delhivery did not accept the request"));
    }
    return true;
}

export async function checkPincodeServiceability(pin, settings) {
    const { ok, data } = await delhiveryRequest("/c/api/pin-codes/json/", {
        query: { filter_codes: pin },
        settings,
    });

    if (!ok) throw new Error(describeError(data, "Could not check the pincode with Delhivery"));

    const entry = data?.delivery_codes?.[0]?.postal_code;
    if (!entry) return { serviceable: false };

    return {
        serviceable: true,
        prepaid: entry.pre_paid === "Y",
        cod: entry.cod === "Y",
        sortCode: entry.sort_code || null,
        isOda: entry.is_oda === "Y",
    };
}

const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Estimated charge for one speed (Surface / Express).
 * Weight is in grams. Returns { total, gross, zone, chargedWeight } in rupees.
 */
export async function estimateDelhiveryCharges(
    { originPin, destPin, weightGrams, speed, paymentMode, codAmount },
    settings
) {
    const config = settings ?? (await getDelhiverySettings());
    const mode = SPEEDS[normalizeSpeed(speed)];
    const isCod = paymentMode === "COD";

    const { ok, data } = await delhiveryRequest("/api/kinko/v1/invoice/charges/.json", {
        query: {
            md: mode.code,
            ss: "Delivered",
            d_pin: destPin,
            o_pin: originPin,
            cgm: Math.max(Math.round(weightGrams), 1),
            pt: isCod ? "COD" : "Pre-paid",
            cod: isCod ? Math.round(codAmount || 0) : undefined,
            cl: config.clientName || undefined,
        },
        settings: config,
    });

    const row = Array.isArray(data) ? data[0] : data;
    const total = Number(row?.total_amount);

    if (!ok || !Number.isFinite(total)) {
        throw new Error(describeError(data, `Delhivery has no ${mode.label} rate for this route`));
    }

    const gross = Number(row?.gross_amount);
    return {
        total: round2(total),
        gross: round2(Number.isFinite(gross) ? gross : total),
        zone: row?.zone || null,
        chargedWeight: Number(row?.charged_weight) || null,
    };
}

/* ------------------------------------------------------------------ */
/* Warehouses                                                          */
/* ------------------------------------------------------------------ */

const lastTenDigits = (phone) => {
    const digits = String(phone ?? "").replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
};

/**
 * Register a saved pickup address as a Delhivery warehouse. The warehouse
 * name (our "nickname") must match exactly when booking, so it is used as is.
 */
export async function syncAddressToDelhivery(address, settings) {
    if (address.delhiverySynced) return address;

    const name = (address.nickname || "").trim() || address.name;
    const fullAddress = [address.address, address.address2].filter(Boolean).join(", ");
    const country = address.country || "India";

    const { ok, data } = await delhiveryRequest("/api/backend/clientwarehouse/create/", {
        method: "POST",
        json: {
            name,
            registered_name: name,
            email: address.email,
            phone: lastTenDigits(address.phone),
            address: fullAddress,
            city: address.city,
            country,
            pin: String(address.pincode),
            return_address: fullAddress,
            return_pin: String(address.pincode),
            return_city: address.city,
            return_state: address.state,
            return_country: country,
        },
        settings,
    });

    const errorText = typeof data?.error === "string" ? data.error : JSON.stringify(data?.error ?? "");
    // Only a genuine duplicate counts as registered. (A bare "exist" would also match
    // "Pincode doesn't exist in system", which is a real rejection.)
    const alreadyThere = /already exist|already registered|duplicate/i.test(errorText);

    if ((!ok || data?.success === false) && !alreadyThere) {
        throw new Error(
            `Delhivery could not register the warehouse "${name}": ${describeError(data, "unknown error")}`
        );
    }

    await prisma.shiprocketPickupAddress.update({
        where: { id: address.id },
        data: { delhiverySynced: true },
    });
    address.delhiverySynced = true;
    return address;
}

/* ------------------------------------------------------------------ */
/* Shipment payload                                                    */
/* ------------------------------------------------------------------ */

// Delhivery rejects & # % ; \ in text fields
const clean = (value) =>
    String(value ?? "")
        .replace(/[&#%;\\]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

/** Weight (grams) and box dimensions (cm) of an order, using defaults where a variant has none */
export function measureOrder(order, settings) {
    let weightKg = 0;
    let length = Number(settings.defaultLength) || 10;
    let breadth = Number(settings.defaultBreadth) || 10;
    let height = 0;
    let quantity = 0;

    for (const item of order.items ?? []) {
        const variant = item.variant || {};
        const itemQuantity = Number(item.quantity) || 1;

        weightKg += Number(variant.shippingWeight || settings.defaultWeight || 0.5) * itemQuantity;
        length = Math.max(length, Number(variant.shippingLength || 0));
        breadth = Math.max(breadth, Number(variant.shippingBreadth || 0));
        height += Number(variant.shippingHeight || settings.defaultHeight || 10) * itemQuantity;
        quantity += itemQuantity;
    }

    return {
        weightGrams: Math.max(Math.round(weightKg * 1000), 100),
        length: Math.max(length, 1),
        breadth: Math.max(breadth, 1),
        height: Math.max(Math.min(height, 100), 1),
        quantity: Math.max(quantity, 1),
    };
}

export const paymentModeFor = (order) => (order.paymentMethod === "CASH" ? "COD" : "Prepaid");

const formatOrderDate = (value) => {
    const date = new Date(value);
    const safe = Number.isNaN(date.getTime()) ? new Date() : date;
    return safe.toISOString().slice(0, 19).replace("T", " ");
};

/** The body for POST /api/cmu/create.json */
export function buildDelhiveryShipment(order, { warehouse, speed, settings }) {
    const address = order.shippingAddress;
    if (!address) throw new Error("This order has no shipping address");

    const phone = lastTenDigits(address.phone || order.user?.phone);
    if (phone.length !== 10) {
        throw new Error(
            `Customer phone "${phone || "missing"}" is not a valid 10 digit number. Fix the shipping address and try again.`
        );
    }
    if (!/^\d{6}$/.test(String(address.postalCode ?? ""))) {
        throw new Error("The delivery pincode must be 6 digits. Fix the shipping address and try again.");
    }

    const { storeName } = getStoreConfig();
    const mode = SPEEDS[normalizeSpeed(speed)];
    const paymentMode = paymentModeFor(order);
    const size = measureOrder(order, settings);

    const productsDescription = (order.items ?? [])
        .map((item) => `${clean(item.product?.name || "Item")} x${item.quantity}`)
        .join(", ")
        .slice(0, 250);

    const warehouseAddress = clean([warehouse.address, warehouse.address2].filter(Boolean).join(", "));
    const warehouseCountry = warehouse.country || "India";

    const shipment = {
        name: clean(address.name || order.user?.name || "Customer"),
        add: clean([address.street, address.address2].filter(Boolean).join(", ")),
        pin: String(address.postalCode),
        city: clean(address.city),
        state: clean(address.state),
        country: clean(address.country || "India"),
        phone,
        order: clean(order.orderNumber),
        payment_mode: paymentMode,
        cod_amount: paymentMode === "COD" ? Number(order.total) : 0,
        total_amount: Number(order.total),
        products_desc: productsDescription,
        quantity: size.quantity,
        weight: size.weightGrams,
        shipment_length: size.length,
        shipment_width: size.breadth,
        shipment_height: size.height,
        shipping_mode: mode.mode,
        address_type: "home",
        order_date: formatOrderDate(order.createdAt),
        // Where an undeliverable parcel goes back to
        return_name: clean(warehouse.name),
        return_add: warehouseAddress,
        return_pin: String(warehouse.pincode),
        return_city: clean(warehouse.city),
        return_state: clean(warehouse.state),
        return_country: clean(warehouseCountry),
        return_phone: lastTenDigits(warehouse.phone),
        seller_name: clean(settings.clientName || storeName),
        seller_add: warehouseAddress,
        seller_inv: clean(order.orderNumber),
        seller_gst_tin: settings.sellerGstTin || undefined,
        hsn_code: settings.defaultHsnCode || undefined,
    };

    // Drop empty values so Delhivery applies its own defaults
    for (const key of Object.keys(shipment)) {
        if (shipment[key] === undefined || shipment[key] === null || shipment[key] === "") {
            delete shipment[key];
        }
    }

    return shipment;
}

/* ------------------------------------------------------------------ */
/* Booking                                                             */
/* ------------------------------------------------------------------ */

async function loadOrderForShipping(orderId) {
    return prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            shippingAddress: true,
            items: { include: { product: true, variant: true } },
        },
    });
}

async function pickWarehouse(warehouseId) {
    if (warehouseId) {
        const chosen = await prisma.shiprocketPickupAddress.findUnique({ where: { id: warehouseId } });
        if (!chosen) throw new Error("The selected warehouse no longer exists. Pick another one.");
        return chosen;
    }

    const fallback =
        (await prisma.shiprocketPickupAddress.findFirst({ where: { isDefault: true } })) ??
        (await prisma.shiprocketPickupAddress.findFirst({}));
    if (!fallback) throw new Error("Add a pickup address (warehouse) first");
    return fallback;
}

/**
 * Create the shipment in Delhivery (the waybill is assigned automatically),
 * save it on the order, give the customer a tracking record and email them
 * the tracking link.
 */
export async function bookDelhiveryShipment(orderId, { warehouseId, speed, notify = true } = {}) {
    const settings = await getDelhiverySettings();

    if (!settings.isEnabled) {
        throw new Error("Delhivery is turned off. Enable it in Delhivery settings first.");
    }
    if (!readApiToken(settings)) {
        throw new Error("Delhivery API token is not configured");
    }

    const order = await loadOrderForShipping(orderId);
    if (!order) throw new Error("Order not found");
    if (order.courierProvider === "DELHIVERY" && order.awbCode) {
        throw new Error("This order is already booked with Delhivery");
    }
    if (order.shiprocketOrderId) {
        throw new Error("This order was already sent through Shiprocket");
    }

    try {
        const warehouse = await pickWarehouse(warehouseId);
        await syncAddressToDelhivery(warehouse, settings);

        const bookedSpeed = normalizeSpeed(speed || settings.shippingSpeed);
        const shipment = buildDelhiveryShipment(order, { warehouse, speed: bookedSpeed, settings });

        // Delhivery wants a raw "format=json&data=<json>" body
        const { data } = await delhiveryRequest("/api/cmu/create.json", {
            method: "POST",
            rawBody: `format=json&data=${JSON.stringify({
                shipments: [shipment],
                pickup_location: { name: (warehouse.nickname || "").trim() || warehouse.name },
            })}`,
            settings,
        });

        const result = data?.packages?.[0];
        const booked = data?.success !== false && result && /success/i.test(String(result.status)) && result.waybill;

        if (!booked) {
            const remarks = [].concat(result?.remarks ?? []).filter(Boolean).join("; ");
            throw new Error(remarks || describeError(data, "Delhivery rejected the shipment"));
        }

        const waybill = String(result.waybill);

        await prisma.order.update({
            where: { id: orderId },
            data: {
                awbCode: waybill,
                courierName: "Delhivery",
                courierProvider: "DELHIVERY",
                courierStatus: "MANIFESTED",
                courierSpeed: bookedSpeed,
                courierWarehouseId: warehouse.id,
            },
        });

        await upsertTrackingFromShiprocket(orderId, { awb: waybill, courier: "Delhivery" });

        if (notify) {
            try {
                await sendShipmentEmail(order, waybill, "Delhivery", buildDelhiveryTrackingUrl(waybill));
            } catch (error) {
                console.error("Shipment email failed:", error.message);
            }
        }

        return {
            awbCode: waybill,
            courierName: "Delhivery",
            speed: bookedSpeed,
            warehouseId: warehouse.id,
            trackingUrl: buildDelhiveryTrackingUrl(waybill),
        };
    } catch (error) {
        console.error("Delhivery booking failed:", error.message);

        // Leave a visible trace so the admin can see it failed and retry
        try {
            await prisma.order.update({
                where: { id: orderId },
                data: { courierStatus: "BOOKING_FAILED" },
            });
        } catch (statusError) {
            console.error("Could not record booking failure:", statusError.message);
        }
        throw error;
    }
}

/* ------------------------------------------------------------------ */
/* Tracking                                                            */
/* ------------------------------------------------------------------ */

// Delhivery times are IST without an offset ("2019-01-09T17:10:42.767").
// Hand them over in the "YYYY-MM-DD HH:mm:ss" form the tracking helper treats as IST.
const toTrackingDate = (value) => {
    if (!value) return null;
    const text = String(value).trim();
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(text)) return text;
    return text.replace("T", " ").replace(/\.\d+$/, "");
};

/** Delhivery status -> our shipment / order status */
export function mapDelhiveryStatus(label, type) {
    const key = normalizeShiprocketStatus(label);
    const statusType = String(type ?? "").toUpperCase();

    let shipmentStatus = null;
    let orderStatus = null;

    if (statusType === "DL" || key === "DELIVERED") {
        shipmentStatus = "DELIVERED";
        orderStatus = "DELIVERED";
    } else if (statusType === "RT" || statusType === "DTO" || key === "RTO" || key === "DTO" || key.startsWith("RTO_")) {
        // Returning to the seller: record it, but never auto-cancel the order
        shipmentStatus = "RETURNED";
    } else if (key === "DISPATCHED" || key.includes("OUT_FOR_DELIVERY")) {
        shipmentStatus = "OUT_FOR_DELIVERY";
        orderStatus = "SHIPPED";
    } else if (key === "PICKED_UP") {
        shipmentStatus = "SHIPPED";
        orderStatus = "SHIPPED";
    } else if (key === "IN_TRANSIT" || key === "PENDING") {
        shipmentStatus = "IN_TRANSIT";
        orderStatus = "SHIPPED";
    } else if (key === "LOST" || key === "DAMAGED" || key === "UNDELIVERED") {
        shipmentStatus = "FAILED";
    }

    return { key, shipmentStatus, orderStatus };
}

/** Live tracking for a waybill, normalised (scans newest first) */
export async function trackDelhiveryShipment(waybill, settings) {
    const { ok, data } = await delhiveryRequest("/api/v1/packages/json/", {
        query: { waybill, verbose: 2 },
        settings,
    });

    if (data?.Error) throw new Error(String(data.Error));

    const shipment = data?.ShipmentData?.[0]?.Shipment;
    if (!ok || !shipment) {
        throw new Error("Delhivery has no tracking information for this waybill yet");
    }

    const status = shipment.Status ?? {};

    const scans = (shipment.Scans ?? [])
        .map((entry) => entry?.ScanDetail ?? entry ?? {})
        .map((scan) => ({
            date: scan.ScanDateTime ?? scan.StatusDateTime ?? null,
            status: scan.Scan ?? scan.Status ?? null,
            activity: scan.Instructions || scan.Scan || null,
            location: scan.ScannedLocation ?? scan.StatusLocation ?? null,
        }))
        .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));

    return {
        waybill: shipment.AWB ?? waybill,
        statusLabel: status.Status ?? null,
        statusType: status.StatusType ?? null,
        location: status.StatusLocation ?? null,
        timestamp: status.StatusDateTime ?? null,
        instructions: status.Instructions ?? null,
        expectedDelivery: shipment.ExpectedDeliveryDate ?? shipment.PromisedDeliveryDate ?? null,
        scans,
    };
}

/**
 * Apply a Delhivery status (from a refresh or the webhook) to the order and
 * the customer's tracking record.
 */
export async function applyDelhiveryStatus(
    order,
    { statusLabel, statusType, location, instructions, timestamp, expectedDelivery }
) {
    const { key, shipmentStatus, orderStatus } = mapDelhiveryStatus(statusLabel, statusType);

    const data = {};
    if (key) data.courierStatus = key;
    if (orderStatus && canMoveOrderStatus(order.status, orderStatus)) data.status = orderStatus;

    if (Object.keys(data).length > 0) {
        await prisma.order.update({ where: { id: order.id }, data });
    }

    await upsertTrackingFromShiprocket(order.id, {
        awb: order.awbCode,
        courier: "Delhivery",
        shipmentStatus,
        etd: toTrackingDate(expectedDelivery),
        location,
        description: instructions || statusLabel,
        timestamp: toTrackingDate(timestamp),
    });

    return { statusKey: key, orderStatus: data.status ?? order.status };
}

/* ------------------------------------------------------------------ */
/* Cancel                                                              */
/* ------------------------------------------------------------------ */

export async function cancelDelhiveryShipment(waybill, settings) {
    const { ok, data } = await delhiveryRequest("/api/p/edit", {
        method: "POST",
        json: { waybill, cancellation: "true" },
        settings,
    });

    const refused = data?.status === false || data?.status === "false";
    if (!ok || refused) {
        throw new Error(
            describeError(
                data,
                "Delhivery could not cancel this shipment. It may already be picked up."
            )
        );
    }
    return data;
}

/* ------------------------------------------------------------------ */
/* Shipping label                                                      */
/* ------------------------------------------------------------------ */

export function buildDelhiveryLabelHtml({ order, awb, speed, warehouse, sortCode, settings }) {
    const address = order.shippingAddress ?? {};
    const mode = SPEEDS[normalizeSpeed(speed)];
    const paymentMode = paymentModeFor(order);
    const size = measureOrder(order, settings ?? {});

    const itemsText = (order.items ?? [])
        .map((item) => `${item.product?.name || "Item"} x${item.quantity}`)
        .join(", ");

    const shipFrom = warehouse
        ? [
              warehouse.nickname || warehouse.name,
              [warehouse.address, warehouse.address2].filter(Boolean).join(", "),
              `${warehouse.city}, ${warehouse.state} - ${warehouse.pincode}`,
              warehouse.phone ? `Phone: ${warehouse.phone}` : "",
          ].filter(Boolean)
        : [];

    const css = `
  @page { size: 4in 6in; margin: 0; }
  .label { width: 4in; min-height: 6in; margin: 16px auto; background: #fff; border: 2px solid #111827; padding: 10px; font-size: 12px; line-height: 1.35; }
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111827; padding-bottom: 6px; }
  .brand { font-size: 20px; font-weight: bold; }
  .speed { border: 2px solid #111827; padding: 2px 10px; font-weight: bold; font-size: 14px; }
  .barcode { margin-top: 10px; text-align: center; }
  .barcode svg { width: 100%; height: 70px; }
  .awb { text-align: center; font-size: 15px; letter-spacing: .12em; font-weight: bold; margin: 4px 0 8px; }
  .pay { text-align: center; font-size: 22px; font-weight: bold; border: 2px solid #111827; padding: 4px; margin-bottom: 8px; }
  .block { border-top: 1px solid #9ca3af; padding: 6px 0; }
  .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; }
  .to { font-size: 14px; }
  .meta { display: flex; justify-content: space-between; border-top: 1px solid #9ca3af; padding-top: 6px; font-size: 11px; }
  .sort { text-align: center; font-weight: bold; font-size: 16px; border-top: 1px solid #9ca3af; padding-top: 6px; margin-top: 6px; }
  @media print { .label { margin: 0; } }`;

    const body = `
<div class="label">
  <div class="head">
    <div class="brand">Delhivery</div>
    <div class="speed">${escapeHtml(mode.label)}</div>
  </div>
  <div class="barcode">${code128Svg(awb, { height: 60 })}</div>
  <div class="awb">${escapeHtml(awb)}</div>
  <div class="pay">${paymentMode === "COD" ? `COD &#8377; ${escapeHtml(formatMoney(order.total))}` : "PREPAID"}</div>
  <div class="block to">
    <div class="lbl">Ship to</div>
    <strong>${escapeHtml(address.name || order.user?.name || "")}</strong><br>
    ${escapeHtml([address.street, address.address2].filter(Boolean).join(", "))}<br>
    ${escapeHtml(`${address.city ?? ""}, ${address.state ?? ""} - ${address.postalCode ?? ""}`)}<br>
    ${address.phone ? `Phone: ${escapeHtml(address.phone)}` : ""}
  </div>
  ${shipFrom.length ? `<div class="block"><div class="lbl">Ship from</div>${shipFrom.map(escapeHtml).join("<br>")}</div>` : ""}
  <div class="block"><div class="lbl">Contents</div>${escapeHtml(itemsText)}</div>
  <div class="meta">
    <span>Order ${escapeHtml(order.orderNumber)}</span>
    <span>${escapeHtml((size.weightGrams / 1000).toFixed(2))} kg</span>
    <span>${escapeHtml(new Date(order.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }))}</span>
  </div>
  ${sortCode ? `<div class="sort">${escapeHtml(sortCode)}</div>` : ""}
</div>`;

    return printableDocument({ title: `Delhivery label ${awb}`, css, body });
}

/**
 * The label for a booked order: Delhivery's own PDF link when the packing
 * slip API gives one, otherwise a printable label we build from the order.
 * Returns { url } or { html }.
 */
export async function getDelhiveryLabel(order, settings) {
    const config = settings ?? (await getDelhiverySettings());
    let sortCode = null;

    try {
        const { ok, data } = await delhiveryRequest("/api/p/packing_slip", {
            query: { wbns: order.awbCode, pdf: "true", pdf_size: "A4" },
            settings: config,
        });
        const slip = ok ? data?.packages?.[0] : null;

        if (typeof slip?.pdf_download_link === "string" && /^https:\/\//i.test(slip.pdf_download_link)) {
            return { url: slip.pdf_download_link };
        }
        sortCode = slip?.sort_code || slip?.sortcode || null;
    } catch (error) {
        // The label only needs data we already hold, so carry on without the slip
        console.error("Delhivery packing slip unavailable:", error.message);
    }

    const warehouse = order.courierWarehouseId
        ? await prisma.shiprocketPickupAddress.findUnique({ where: { id: order.courierWarehouseId } })
        : null;

    return {
        html: buildDelhiveryLabelHtml({
            order,
            awb: order.awbCode,
            speed: order.courierSpeed,
            warehouse,
            sortCode,
            settings: config,
        }),
    };
}
