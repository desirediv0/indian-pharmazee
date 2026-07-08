import slugify from "slugify";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { processAndUploadImage } from "../middlewares/multer.middlerware.js";
import { prisma } from "../config/db.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { deleteFromS3 } from "../utils/deleteFromS3.js";

// Helper function to insert a brand at a specific position and shift others
const adjustPositions = async (targetId, targetNewPosition) => {
  // 1. Get all brands excluding the target, sorted by current position
  const otherBrands = await prisma.brand.findMany({
    where: {
      id: { not: targetId }
    },
    orderBy: { position: "asc" }
  });

  // 2. Determine index to insert at
  let index = parseInt(targetNewPosition);
  if (isNaN(index) || index < 0) index = 0;
  if (index > otherBrands.length) index = otherBrands.length;

  // 3. Insert target brand ID into the array at that index
  const newOrder = [...otherBrands];
  newOrder.splice(index, 0, { id: targetId });

  // 4. Update all brands in the database with their new index as position
  for (let i = 0; i < newOrder.length; i++) {
    await prisma.brand.update({
      where: { id: newOrder[i].id },
      data: { position: i }
    });
  }
};

// Helper function to normalize positions (0, 1, 2...)
const normalizePositions = async () => {
  const allBrands = await prisma.brand.findMany({
    orderBy: { position: "asc" }
  });
  for (let i = 0; i < allBrands.length; i++) {
    await prisma.brand.update({
      where: { id: allBrands[i].id },
      data: { position: i }
    });
  }
};

// Create Brand
export const createBrand = asyncHandler(async (req, res) => {
  const { name, tags, position } = req.body;
  if (!name) throw new ApiError(400, "Brand name is required");
  const slug = slugify(name, { lower: true });
  let image = null;
  if (req.file) {
    image = await processAndUploadImage(req.file, "brands");
  } else {
    throw new ApiError(400, "Brand image is required");
  }

  // Create brand with a temporary position
  const brand = await prisma.brand.create({
    data: {
      name,
      slug,
      image,
      position: 999999, // Temp position
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
    },
  });

  // Determine target position
  let targetPosition;
  if (position !== undefined && position !== null && position !== "") {
    targetPosition = parseInt(position);
  } else {
    // Default to the end of the list
    const otherBrandsCount = await prisma.brand.count({
      where: { id: { not: brand.id } }
    });
    targetPosition = otherBrandsCount;
  }

  // Adjust all brand positions
  await adjustPositions(brand.id, targetPosition);

  // Fetch the fully updated brand to return
  const createdBrand = await prisma.brand.findUnique({
    where: { id: brand.id }
  });

  res.status(201).json(new ApiResponsive(201, { brand: createdBrand }, "Brand created"));
});

// Update Brand
export const updateBrand = asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const { name, tags, position } = req.body;
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) throw new ApiError(404, "Brand not found");

  let updateData = {};
  if (name) {
    updateData.name = name;
    updateData.slug = slugify(name, { lower: true });
  }
  if (tags) {
    updateData.tags = Array.isArray(tags) ? tags : [tags];
  }
  if (req.file) {
    if (brand.image) await deleteFromS3(brand.image);
    updateData.image = await processAndUploadImage(req.file, "brands");
  }

  // Update base fields first
  const updatedBrandBasic = await prisma.brand.update({
    where: { id: brandId },
    data: updateData,
  });

  // If position was provided, adjust the positions list
  if (position !== undefined && position !== null && position !== "") {
    await adjustPositions(brandId, position);
  } else {
    await normalizePositions();
  }

  // Fetch the fully updated brand to return
  const finalBrand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { products: true }
  });

  res
    .status(200)
    .json(new ApiResponsive(200, { brand: finalBrand }, "Brand updated"));
});

// Delete Brand
export const deleteBrand = asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { products: true },
  });
  if (!brand) throw new ApiError(404, "Brand not found");

  // Unlink all products from this brand
  await prisma.product.updateMany({
    where: { brandId },
    data: { brandId: null },
  });

  // Delete brand image from S3 if exists
  if (brand.image) await deleteFromS3(brand.image);

  // Delete the brand
  await prisma.brand.delete({ where: { id: brandId } });

  // Reorder remaining brands to normalize their positions
  await normalizePositions();

  res.status(200).json(new ApiResponsive(200, {}, "Brand deleted"));
});

// Get All Brands (with tag filter)
export const getAllBrands = asyncHandler(async (req, res) => {
  const { tag } = req.query;
  const where = tag ? { tags: { has: tag } } : {};
  const brands = await prisma.brand.findMany({
    where,
    include: { products: true },
    orderBy: {
      position: "asc",
    },
  });
  res.status(200).json(new ApiResponsive(200, { brands }, "Brands fetched"));
});

// Get Brand By Id
export const getBrandById = asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { products: true },
  });
  if (!brand) throw new ApiError(404, "Brand not found");
  res.status(200).json(new ApiResponsive(200, { brand }, "Brand fetched"));
});

// Remove a product from a brand
export const removeProductFromBrand = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  await prisma.product.update({
    where: { id: productId },
    data: { brandId: null },
  });
  res
    .status(200)
    .json(new ApiResponsive(200, {}, "Product removed from brand"));
});
