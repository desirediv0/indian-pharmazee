/**
 * Courier selection shared by Shiprocket and Delhivery:
 * which courier new orders go to, tracking links and warehouse syncing.
 */

import { prisma } from "../config/db.js";
import {
    processOrderForShipping,
    buildTrackingUrl,
    ensurePickupAddressSynced,
} from "./shiprocket.js";
import {
    getDelhiverySettings,
    readApiToken,
    bookDelhiveryShipment,
    cancelDelhiveryShipment,
    buildDelhiveryTrackingUrl,
    syncAddressToDelhivery,
} from "./delhivery.js";

export const COURIERS = ["SHIPROCKET", "DELHIVERY"];

/** Which courier new orders are sent to automatically */
export async function getDefaultCourier() {
    const settings = await prisma.shiprocketSettings.findFirst();
    return COURIERS.includes(settings?.defaultCourier) ? settings.defaultCourier : "SHIPROCKET";
}

/**
 * Send a freshly placed order to the default courier.
 * Returns null when nothing was done (courier off / manual booking).
 */
export async function autoShipOrder(orderId) {
    const courier = await getDefaultCourier();

    if (courier === "DELHIVERY") {
        const settings = await getDelhiverySettings();

        if (!settings.isEnabled) {
            console.warn(
                "Default courier is Delhivery but it is turned off: order was not sent to any courier"
            );
            return null;
        }
        if (settings.bookingMode !== "AUTO") {
            console.log("Delhivery booking mode is manual: waiting for the admin to book this order");
            return null;
        }
        return bookDelhiveryShipment(orderId);
    }

    return processOrderForShipping(orderId);
}

/** Public tracking page for an order, whichever courier carries it */
export function buildCourierTrackingUrl(order) {
    if (!order?.awbCode) return null;
    return order.courierProvider === "DELHIVERY"
        ? buildDelhiveryTrackingUrl(order.awbCode)
        : buildTrackingUrl(order.awbCode);
}

/**
 * Register a saved warehouse with every courier that is set up.
 * Never throws: problems come back as readable warnings.
 */
export async function syncAddressToCouriers(address) {
    const warnings = [];

    const shiprocket = await prisma.shiprocketSettings.findFirst();
    if (shiprocket?.email && shiprocket?.password) {
        try {
            await ensurePickupAddressSynced(address);
        } catch (error) {
            warnings.push(`Shiprocket: ${error.message}`);
        }
    }

    const delhivery = await prisma.delhiverySettings.findFirst();
    if (readApiToken(delhivery)) {
        try {
            await syncAddressToDelhivery(address, delhivery);
        } catch (error) {
            warnings.push(`Delhivery: ${error.message}`);
        }
    }

    return warnings;
}

/**
 * Best-effort: cancel a Delhivery shipment when its order is cancelled.
 * Only talks to Delhivery (callers may be inside a transaction) and returns
 * true when it was cancelled so the caller can record courierStatus.
 */
export async function cancelDelhiveryForOrder(order) {
    if (order?.courierProvider !== "DELHIVERY" || !order.awbCode) return false;

    try {
        const settings = await getDelhiverySettings();
        if (!settings.isEnabled || !readApiToken(settings)) return false;

        await cancelDelhiveryShipment(order.awbCode, settings);
        return true;
    } catch (error) {
        console.error("Failed to cancel Delhivery shipment:", error.message);
        return false;
    }
}
