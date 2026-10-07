import { Router } from "express";
import {
  getAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  getFaqById,
  bulkUpdateFaqOrder,
  getFaqCategories,
  getFaqTargetCategories,
  getFaqTargetProducts,
} from "../controllers/faq.controller.js";
import {
  verifyAdminJWT,
  hasPermission,
} from "../middlewares/admin.middleware.js";

const router = Router();

// All admin FAQ routes are protected
router.use(verifyAdminJWT);

// Permissions mirror what the admin panel already asks for (faqs:read/create/update/delete)
router.get("/", hasPermission("faqs", "read"), getAllFaqs);
router.post("/", hasPermission("faqs", "create"), createFaq);
router.get("/categories", hasPermission("faqs", "read"), getFaqCategories);

// Pickers for "where to show this FAQ" — keep above "/:id"
router.get(
  "/targets/categories",
  hasPermission("faqs", "read"),
  getFaqTargetCategories
);
router.get(
  "/targets/products",
  hasPermission("faqs", "read"),
  getFaqTargetProducts
);

router.put(
  "/bulk-update-order",
  hasPermission("faqs", "update"),
  bulkUpdateFaqOrder
);
router.get("/:id", hasPermission("faqs", "read"), getFaqById);
router.put("/:id", hasPermission("faqs", "update"), updateFaq);
router.delete("/:id", hasPermission("faqs", "delete"), deleteFaq);

export default router;
