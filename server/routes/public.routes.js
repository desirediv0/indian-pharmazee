import express from "express";
import {
  getAllCategories,
  getProductsByCategory,
  getCategoriesWithSubCategories,
  getProductsBySubCategory,
} from "../controllers/category.controller.js";
import {
  getAllProducts,
  getProductBySlug,
  getProductVariant,
  getProductVariantById,
  getMaxPrice,
  getProductsByType,
} from "../controllers/product.controller.js";
import { trackProductView } from "../middlewares/tracking.middleware.js";
import {
  getBrandsByTag,
  getBrandBySlug,
  getFilterAttributes,
  getPriceVisibilitySettings,
  getSitemapXml,
} from "../controllers/public.controller.js";
import { getPublishedBanners } from "../controllers/admin.banner.controller.js";
import { getActiveFlashSales, getActiveProductSections } from "../controllers/public.controller.js";

const router = express.Router();

// Sitemap
router.get("/sitemap.xml", getSitemapXml);
router.get("/sitemap", getSitemapXml);

// Categories
router.get("/categories", getAllCategories);
router.get("/categories-with-subcategories", getCategoriesWithSubCategories);
router.get("/categories/:slug/products", getProductsByCategory);
router.get("/subcategories/:slug/products", getProductsBySubCategory);

// Products
router.get("/products", getAllProducts);
router.get("/products/max-price", getMaxPrice);
router.get("/products/type/:productType", getProductsByType);
router.get("/products/:slug", trackProductView, getProductBySlug);
router.get("/product-variant", getProductVariant);
router.get("/products/variants/:id", getProductVariantById);

// Brands
router.get("/brands-by-tag", getBrandsByTag);
router.get("/brand/:slug", getBrandBySlug);

// Banners
router.get("/banners", getPublishedBanners);

// Flash Sales
router.get("/flash-sales", getActiveFlashSales);

// Product Sections
router.get("/product-sections", getActiveProductSections);

// Filter Attributes (Colors and Sizes)
router.get("/filter-attributes", getFilterAttributes);

// Price Visibility Settings
router.get("/price-visibility-settings", getPriceVisibilitySettings);

import { uploadPrescription } from "../controllers/prescription.controller.js";
import { uploadFiles } from "../middlewares/multer.middlerware.js";

// Prescription Upload Route
router.post("/prescriptions", uploadFiles.single("file"), uploadPrescription);

export default router;

