/**
 * Courier-neutral admin endpoints: what is set up, which courier is the
 * default, and the order invoice.
 */

import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { getShiprocketSettings } from "../utils/shiprocket.js";
import { getDelhiverySettings } from "../utils/delhivery.js";
import { COURIERS, getDefaultCourier } from "../utils/courier.js";
import { buildInvoiceHtml } from "../utils/invoice.js";

// Everything the order page needs to offer a courier + warehouse choice
export const getCourierOverview = asyncHandler(async (req, res) => {
    const [shiprocket, delhivery, defaultCourier, warehouses] = await Promise.all([
        prisma.shiprocketSettings.findFirst(),
        getDelhiverySettings(),
        getDefaultCourier(),
        prisma.shiprocketPickupAddress.findMany({
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        }),
    ]);

    res.status(200).json(
        new ApiResponsive(
            200,
            {
                defaultCourier,
                shiprocket: {
                    enabled: Boolean(shiprocket?.isEnabled),
                    configured: Boolean(shiprocket?.email && shiprocket?.password),
                },
                delhivery: {
                    enabled: Boolean(delhivery.isEnabled && delhivery.apiToken),
                    configured: Boolean(delhivery.apiToken),
                    bookingMode: delhivery.bookingMode,
                    shippingSpeed: delhivery.shippingSpeed,
                },
                warehouses: warehouses.map((warehouse) => ({
                    id: warehouse.id,
                    nickname: warehouse.nickname,
                    name: warehouse.name,
                    city: warehouse.city,
                    state: warehouse.state,
                    pincode: warehouse.pincode,
                    isDefault: warehouse.isDefault,
                    shiprocketLinked: Boolean(warehouse.shiprocketPickupId),
                    delhiverySynced: Boolean(warehouse.delhiverySynced),
                })),
            },
            "Courier overview fetched successfully"
        )
    );
});

// Choose which courier new orders go to automatically
export const setDefaultCourier = asyncHandler(async (req, res) => {
    const courier = String(req.body?.defaultCourier ?? "").toUpperCase();

    if (!COURIERS.includes(courier)) {
        throw new ApiError(400, `defaultCourier must be one of: ${COURIERS.join(", ")}`);
    }

    const settings = await getShiprocketSettings();
    await prisma.shiprocketSettings.update({
        where: { id: settings.id },
        data: { defaultCourier: courier, updatedBy: req.admin?.id },
    });

    let warning = null;
    if (courier === "DELHIVERY") {
        const delhivery = await getDelhiverySettings();
        if (!delhivery.isEnabled || !delhivery.apiToken) {
            warning = "Delhivery is not turned on yet, so new orders will not be sent to any courier until you enable it.";
        }
    } else if (!settings.isEnabled) {
        warning = "Shiprocket is not turned on yet, so new orders will not be sent to any courier until you enable it.";
    }

    res.status(200).json(
        new ApiResponsive(200, { defaultCourier: courier, warning }, "Default courier updated")
    );
});

// Printable invoice for any order (opened in a new tab, print / save as PDF)
export const getOrderInvoice = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            shippingAddress: true,
            items: { include: { product: true, variant: true } },
        },
    });

    if (!order) throw new ApiError(404, "Order not found");

    const delhivery = await getDelhiverySettings();
    const html = buildInvoiceHtml(order, { sellerGstTin: delhivery.sellerGstTin });

    res.status(200).json(new ApiResponsive(200, { html }, "Invoice ready"));
});
