import express from "express";
import {
  getSubCategoriesByCategory,
  getSubCategoryById,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from "../controllers/admin.subcategory.controller.js";
import {
  verifyAdminJWT,
  hasPermission,
} from "../middlewares/admin.middleware.js";
import { uploadFiles } from "../middlewares/multer.middlerware.js";
import { prisma } from "../config/db.js";
import { isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get all sub-categories for a category
router.get(
  "/categories/:categoryId/sub-categories",
  verifyAdminJWT,
  hasPermission("products", "read"),
  getSubCategoriesByCategory
);

// Get sub-category by ID
router.get(
  "/sub-categories/:id",
  verifyAdminJWT,
  hasPermission("products", "read"),
  getSubCategoryById
);

// Create sub-category
router.post(
  "/categories/:categoryId/sub-categories",
  verifyAdminJWT,
  hasPermission("products", "create"),
  uploadFiles.single("image"),
  createSubCategory
);

// Update sub-category
router.put(
  "/sub-categories/:id",
  verifyAdminJWT,
  hasPermission("products", "update"),
  uploadFiles.single("image"),
  updateSubCategory
);

// Delete sub-category
router.delete(
  "/sub-categories/:id",
  verifyAdminJWT,
  hasPermission("products", "delete"),
  deleteSubCategory
);

// Bulk update product positions within a subcategory
router.put("/:subCategoryId/products/reorder", isAdmin, async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const { productOrders } = req.body;

    if (!Array.isArray(productOrders)) {
      return res.status(400).json({
        success: false,
        message: "productOrders must be an array",
      });
    }

    // Verify subcategory exists
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "SubCategory not found",
      });
    }

    // Update positions in bulk
    const updatePromises = productOrders.map(({ productId, position }) =>
      prisma.productSubCategory.update({
        where: {
          productId_subCategoryId: { productId, subCategoryId },
        },
        data: { position: position || 0 },
      })
    );

    await Promise.all(updatePromises);

    return res.status(200).json({
      success: true,
      message: "Product positions updated successfully",
    });
  } catch (error) {
    console.error("Error reordering products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reorder products",
      error: error.message,
    });
  }
});

// Get products in a subcategory with their positions
router.get("/:subCategoryId/products", isAdmin, async (req, res) => {
  try {
    const { subCategoryId } = req.params;

    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "SubCategory not found",
      });
    }

    const products = await prisma.productSubCategory.findMany({
      where: { subCategoryId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            images: {
              select: { url: true },
              take: 1,
              orderBy: { isPrimary: "desc" },
            },
          },
        },
      },
      orderBy: { position: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: {
        products: products.map((psc) => ({
          ...psc.product,
          position: psc.position,
          productSubCategoryId: psc.id,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching subcategory products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subcategory products",
      error: error.message,
    });
  }
});

export default router;








