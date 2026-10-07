import { Router } from "express";
import {
  getAllPublishedFaqs,
  getFaqsForPage,
  getFaqById,
  getFaqCategories,
} from "../controllers/faq.controller.js";

const router = Router();

router.get("/", getAllPublishedFaqs);
router.get("/categories", getFaqCategories);
// Must stay above "/:id" or "for-page" would be read as an id
router.get("/for-page", getFaqsForPage);
router.get("/:id", getFaqById);

export default router;
