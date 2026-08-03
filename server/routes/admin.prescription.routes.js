import express from "express";
import {
  getPrescriptions,
  updatePrescriptionStatus,
  deletePrescription,
} from "../controllers/prescription.controller.js";
import { verifyAdminJWT } from "../middlewares/admin.middleware.js";

const router = express.Router();

// Admin Prescriptions management routes
router.get("/", verifyAdminJWT, getPrescriptions);
router.patch("/:id/status", verifyAdminJWT, updatePrescriptionStatus);
router.delete("/:id", verifyAdminJWT, deletePrescription);

export default router;
