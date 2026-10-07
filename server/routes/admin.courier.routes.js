/**
 * Courier-neutral admin routes (mounted at /api/admin/couriers)
 */

import express from "express";
import { isAdmin, hasPermission } from "../middlewares/auth.middleware.js";
import {
    getCourierOverview,
    setDefaultCourier,
    getOrderInvoice,
} from "../controllers/admin.courier.controller.js";

const router = express.Router();

// Used by the order page to offer a courier + warehouse choice (no secrets in it)
router.get("/overview", isAdmin, getCourierOverview);
router.put("/default", isAdmin, hasPermission("settings", "update"), setDefaultCourier);
router.get("/orders/:orderId/invoice", isAdmin, hasPermission("orders", "read"), getOrderInvoice);

export default router;
