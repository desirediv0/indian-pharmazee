/**
 * Shiprocket Admin Routes
 */

import express from "express";
import { isAdmin, hasPermission } from "../middlewares/auth.middleware.js";
import {
    getSettings,
    updateSettings,
    testConnection,
    getPickupAddresses,
    createPickupAddress,
    updatePickupAddress,
    deletePickupAddress,
    importPickupLocations,
    syncPickupAddress,
    checkOrderServiceability,
    syncOrderToShiprocket,
    assignOrderAwb,
    getOrderTracking,
    cancelShipment,
    getShippingLabel,
    getOrderInvoice,
    handleWebhook,
} from "../controllers/admin.shiprocket.controller.js";

const router = express.Router();

// Settings routes (reading stays open to any admin: the product form needs it)
router.get("/settings", isAdmin, getSettings);
router.put("/settings", isAdmin, hasPermission("settings", "update"), updateSettings);
router.post("/test-connection", isAdmin, hasPermission("settings", "update"), testConnection);

// Pickup address routes
router.get("/pickup-addresses", isAdmin, getPickupAddresses);
router.post("/pickup-addresses/import", isAdmin, hasPermission("settings", "update"), importPickupLocations);
router.post("/pickup-addresses", isAdmin, hasPermission("settings", "update"), createPickupAddress);
router.post("/pickup-addresses/:id/sync", isAdmin, hasPermission("settings", "update"), syncPickupAddress);
router.put("/pickup-addresses/:id", isAdmin, hasPermission("settings", "update"), updatePickupAddress);
router.delete("/pickup-addresses/:id", isAdmin, hasPermission("settings", "update"), deletePickupAddress);

// Serviceability check
router.post("/serviceability", isAdmin, checkOrderServiceability);

// Order operations
router.post("/orders/:orderId/sync", isAdmin, hasPermission("orders", "update"), syncOrderToShiprocket);
router.post("/orders/:orderId/assign-awb", isAdmin, hasPermission("orders", "update"), assignOrderAwb);
router.post("/orders/:orderId/cancel", isAdmin, hasPermission("orders", "update"), cancelShipment);
router.get("/orders/:orderId/tracking", isAdmin, hasPermission("orders", "read"), getOrderTracking);
router.get("/orders/:orderId/label", isAdmin, hasPermission("orders", "read"), getShippingLabel);
router.get("/orders/:orderId/invoice", isAdmin, hasPermission("orders", "read"), getOrderInvoice);

// Webhook (public - no login, protected by the x-api-key token in the controller)
router.post("/webhook", handleWebhook);

export default router;
