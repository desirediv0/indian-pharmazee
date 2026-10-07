/**
 * Public webhook for Delhivery scan updates (mounted at /api/webhooks/delhivery).
 * Give this URL to Delhivery when they set up the push; optionally protect it
 * with DELHIVERY_WEBHOOK_TOKEN.
 */

import express from "express";
import { handleWebhook } from "../controllers/admin.delhivery.controller.js";

const router = express.Router();

router.post("/", handleWebhook);

export default router;
