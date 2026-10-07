/**
 * Delhivery Admin Routes (mounted at /api/admin/delhivery)
 */

import express from "express";
import { isAdmin, hasPermission } from "../middlewares/auth.middleware.js";
import {
    getSettings,
    updateSettings,
    testConnection,
    syncPickupAddress,
    estimateRates,
    bookOrder,
    getOrderTracking,
    cancelOrder,
    getOrderLabel,
} from "../controllers/admin.delhivery.controller.js";
// Warehouses are shared by every courier, so the same handlers serve this page
import {
    getPickupAddresses,
    createPickupAddress,
    updatePickupAddress,
    deletePickupAddress,
} from "../controllers/admin.shiprocket.controller.js";

const router = express.Router();

const canEditSettings = hasPermission("settings", "update");

// Settings
router.get("/settings", isAdmin, canEditSettings, getSettings);
router.put("/settings", isAdmin, canEditSettings, updateSettings);
router.post("/test-connection", isAdmin, canEditSettings, testConnection);

// Warehouses (shared with Shiprocket)
router.get("/pickup-addresses", isAdmin, canEditSettings, getPickupAddresses);
router.post("/pickup-addresses", isAdmin, canEditSettings, createPickupAddress);
router.post("/pickup-addresses/:id/sync", isAdmin, canEditSettings, syncPickupAddress);
router.put("/pickup-addresses/:id", isAdmin, canEditSettings, updatePickupAddress);
router.delete("/pickup-addresses/:id", isAdmin, canEditSettings, deletePickupAddress);

// Order operations
router.post("/orders/:orderId/estimate", isAdmin, hasPermission("orders", "read"), estimateRates);
router.post("/orders/:orderId/book", isAdmin, hasPermission("orders", "update"), bookOrder);
router.get("/orders/:orderId/tracking", isAdmin, hasPermission("orders", "read"), getOrderTracking);
router.post("/orders/:orderId/cancel", isAdmin, hasPermission("orders", "update"), cancelOrder);
router.get("/orders/:orderId/label", isAdmin, hasPermission("orders", "read"), getOrderLabel);

export default router;
