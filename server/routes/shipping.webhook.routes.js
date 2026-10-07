/**
 * Public webhook endpoint for courier / tracking updates.
 *
 * Mounted at /api/webhooks/shipping-updates (and, so existing setups keep
 * working, at the old /api/webhooks/shiprocket). Only the webhook lives here:
 * the old setup mounted the whole admin router on this public path.
 *
 * Shiprocket does not accept a webhook URL that contains "shiprocket", "sr",
 * "kr" or "kartrocket", so register the neutral /shipping-updates URL there.
 */

import express from "express";
import { handleWebhook } from "../controllers/admin.shiprocket.controller.js";

const router = express.Router();

router.post("/", handleWebhook);
router.post("/webhook", handleWebhook);

export default router;
