import slugify from "slugify";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { processAndUploadImage } from "../middlewares/multer.middlerware.js";
import { prisma } from "../config/db.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { deleteFromS3 } from "../utils/deleteFromS3.js";

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

  // Auto-calculate position if not provided
  let brandPosition = 0;
  if (position !== undefined && position !== null && position !== "") {
    brandPosition = parseInt(position) || 0;
  } else {
    // Get the highest position and add 1
    const maxPositionBrand = await prisma.brand.findFirst({
      orderBy: { position: "desc" },
      select: { position: true },
    });
    brandPosition = maxPositionBrand ? maxPositionBrand.position + 1 : 0;
  }

  // Reorder existing brands if new position conflicts
  // Shift all brands at or after the new position down by 1
  const brandsToShift = await prisma.brand.findMany({
    where: {
      position: {
        gte: brandPosition,
      },
    },
  });

  for (const existingBrand of brandsToShift) {
    await prisma.brand.update({
      where: { id: existingBrand.id },
      data: {
        position: existingBrand.position + 1,
      },
    });
  }

  const brand = await prisma.brand.create({
    data: {
      name,
      slug,
      image,
      position: brandPosition,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
    },
  });
  res.status(201).json(new ApiResponsive(201, { brand }, "Brand created"));
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

  let newPosition = null;
  if (position !== undefined && position !== null && position !== "") {
    newPosition = parseInt(position) || 0;
    updateData.position = newPosition;
  }

  // Handle position reordering if position is being changed
  if (newPosition !== null) {
    const oldPosition = brand.position;

    if (newPosition !== oldPosition) {
      if (newPosition < oldPosition) {
        // Shift all brands from newPosition to oldPosition-1 down by 1 (position + 1)
        const brandsToShift = await prisma.brand.findMany({
          where: {
            position: {
              gte: newPosition,
              lt: oldPosition,
            },
            id: {
              not: brandId,
            },
          },
        });

        for (const b of brandsToShift) {
          await prisma.brand.update({
            where: { id: b.id },
            data: {
              position: b.position + 1,
            },
          });
        }
      } else {
        // Shift all brands from oldPosition+1 to newPosition up by 1 (position - 1)
        const brandsToShift = await prisma.brand.findMany({
          where: {
            position: {
              gt: oldPosition,
              lte: newPosition,
            },
            id: {
              not: brandId,
            },
          },
        });

        for (const b of brandsToShift) {
          await prisma.brand.update({
            where: { id: b.id },
            data: {
              position: b.position - 1,
            },
          });
        }
      }
    } else {
      // Position is same, check conflicts
      const conflictingBrand = await prisma.brand.findFirst({
        where: {
          position: newPosition,
          id: {
            not: brandId,
          },
        },
      });

      if (conflictingBrand) {
        const brandsToShift = await prisma.brand.findMany({
          where: {
            position: {
              gte: newPosition,
            },
            id: {
              not: brandId,
            },
          },
        });

        for (const b of brandsToShift) {
          await prisma.brand.update({
            where: { id: b.id },
            data: {
              position: b.position + 1,
            },
          });
        }
      }
    }
  }

  const updatedBrand = await prisma.brand.update({
    where: { id: brandId },
    data: updateData,
  });
  res
    .status(200)
    .json(new ApiResponsive(200, { brand: updatedBrand }, "Brand updated"));
});

// Delete Brand
export const deleteBrand = asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { products: true },
  });
  if (!brand) throw new ApiError(404, "Brand not found");

  const deletedPosition = brand.position;

  // Unlink all products from this brand
  await prisma.product.updateMany({
    where: { brandId },
    data: { brandId: null },
  });

  // Delete brand image from S3 if exists
  if (brand.image) await deleteFromS3(brand.image);

  // Delete the brand
  await prisma.brand.delete({ where: { id: brandId } });

  // Reorder remaining brands - decrease position of brands after deleted one
  const brandsToUpdate = await prisma.brand.findMany({
    where: {
      position: {
        gt: deletedPosition,
      },
    },
  });

  for (const b of brandsToUpdate) {
    await prisma.brand.update({
      where: { id: b.id },
      data: {
        position: b.position - 1,
      },
    });
  }

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
