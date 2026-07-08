import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { processAndUploadImage } from "../middlewares/multer.middlerware.js";
import { deleteFromS3, getFileUrl } from "../utils/deleteFromS3.js";
import slugify from "slugify";

// Resequence sub-category positions within a category to be contiguous 1..N
const resequenceSubCategories = async (categoryId) => {
  const subCategories = await prisma.subCategory.findMany({
    where: { categoryId },
    orderBy: [
      { position: "asc" },
      { name: "asc" }
    ],
  });
  for (let i = 0; i < subCategories.length; i++) {
    const targetPos = i + 1;
    if (subCategories[i].position !== targetPos) {
      await prisma.subCategory.update({
        where: { id: subCategories[i].id },
        data: { position: targetPos },
      });
    }
  }
};

// Adjust positions when inserting or moving a subcategory
const adjustSubCategoryPositions = async (subCategoryId, categoryId, newPosition) => {
  if (subCategoryId) {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });
    if (!subCategory) return;
    const oldPosition = subCategory.position;
    if (oldPosition === newPosition) return;

    if (oldPosition > 0) {
      if (oldPosition < newPosition) {
        await prisma.subCategory.updateMany({
          where: {
            categoryId,
            position: {
              gt: oldPosition,
              lte: newPosition,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });
      } else {
        await prisma.subCategory.updateMany({
          where: {
            categoryId,
            position: {
              gte: newPosition,
              lt: oldPosition,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });
      }
    }
  } else {
    await prisma.subCategory.updateMany({
      where: {
        categoryId,
        position: {
          gte: newPosition,
        },
      },
      data: {
        position: {
          increment: 1,
        },
      },
    });
  }
};

// Get all sub-categories for a category
export const getSubCategoriesByCategory = asyncHandler(
  async (req, res, next) => {
    const { categoryId } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    const subCategories = await prisma.subCategory.findMany({
      where: { categoryId },
      orderBy: [
        { position: "asc" },
        { name: "asc" }
      ],
    });

    // Format with image URLs
    const formattedSubCategories = subCategories.map((sub) => ({
      ...sub,
      image: sub.image ? getFileUrl(sub.image) : null,
    }));

    res
      .status(200)
      .json(
        new ApiResponsive(
          200,
          { subCategories: formattedSubCategories },
          "Sub-categories fetched successfully"
        )
      );
  }
);

// Get sub-category by ID
export const getSubCategoryById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const subCategory = await prisma.subCategory.findUnique({
    where: { id },
    include: {
      category: true,
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!subCategory) {
    throw new ApiError(404, "Sub-category not found");
  }

  // Format with image URL
  const formattedSubCategory = {
    ...subCategory,
    image: subCategory.image ? getFileUrl(subCategory.image) : null,
  };

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { subCategory: formattedSubCategory },
        "Sub-category fetched successfully"
      )
    );
});

// Create sub-category
export const createSubCategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const { name, description, position } = req.body;

  if (!name) {
    throw new ApiError(400, "Name is required");
  }

  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Generate slug
  const slug = slugify(name, { lower: true, strict: true });

  // Check if slug already exists for this category
  const existingSubCategory = await prisma.subCategory.findUnique({
    where: {
      categoryId_slug: {
        categoryId,
        slug,
      },
    },
  });

  if (existingSubCategory) {
    throw new ApiError(409, "Sub-category with this name already exists in this category");
  }

  // Handle image upload if provided
  let imageUrl = null;
  if (req.file) {
    try {
      imageUrl = await processAndUploadImage(req.file, "sub-categories");
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new ApiError(500, "Failed to upload image");
    }
  }

  // Determine target position
  let targetPosition = parseInt(position);
  if (isNaN(targetPosition) || targetPosition < 1) {
    const maxSubCategory = await prisma.subCategory.findFirst({
      where: { categoryId },
      orderBy: { position: "desc" },
    });
    targetPosition = maxSubCategory ? maxSubCategory.position + 1 : 1;
  } else {
    // Shift others to make room
    await adjustSubCategoryPositions(null, categoryId, targetPosition);
  }

  const subCategory = await prisma.subCategory.create({
    data: {
      categoryId,
      name,
      description,
      slug,
      image: imageUrl,
      position: targetPosition,
    },
    include: {
      category: true,
    },
  });

  // Resequence subcategories to keep positions clean
  await resequenceSubCategories(categoryId);

  // Fetch created subcategory to get correct resequenced position
  const finalSubCategory = await prisma.subCategory.findUnique({
    where: { id: subCategory.id },
    include: { category: true }
  });

  // Format with image URL
  const formattedSubCategory = {
    ...finalSubCategory,
    image: finalSubCategory.image ? getFileUrl(finalSubCategory.image) : null,
  };

  res
    .status(201)
    .json(
      new ApiResponsive(
        201,
        { subCategory: formattedSubCategory },
        "Sub-category created successfully"
      )
    );
});

// Update sub-category
export const updateSubCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, isActive, position } = req.body;

  const existingSubCategory = await prisma.subCategory.findUnique({
    where: { id },
  });

  if (!existingSubCategory) {
    throw new ApiError(404, "Sub-category not found");
  }

  // Generate new slug if name is being updated
  let slug = existingSubCategory.slug;
  if (name && name !== existingSubCategory.name) {
    slug = slugify(name, { lower: true, strict: true });

    // Check if new slug already exists for this category
    const slugExists = await prisma.subCategory.findUnique({
      where: {
        categoryId_slug: {
          categoryId: existingSubCategory.categoryId,
          slug,
        },
      },
    });

    if (slugExists && slugExists.id !== id) {
      throw new ApiError(409, "Sub-category with this name already exists in this category");
    }
  }

  // Handle image upload if provided
  let imageUrl = existingSubCategory.image;
  if (req.file) {
    try {
      // Delete old image if exists
      if (existingSubCategory.image) {
        await deleteFromS3(existingSubCategory.image);
      }
      imageUrl = await processAndUploadImage(req.file, "sub-categories");
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new ApiError(500, "Failed to upload image");
    }
  }

  // Prepare update data
  const updateData = {
    ...(name && { name }),
    ...(description !== undefined && { description }),
    ...(slug && { slug }),
    ...(isActive !== undefined && { isActive }),
    ...(imageUrl !== null && { image: imageUrl }),
  };

  // Handle position change
  if (position !== undefined && position !== null) {
    const targetPosition = parseInt(position);
    if (!isNaN(targetPosition) && targetPosition > 0 && targetPosition !== existingSubCategory.position) {
      await adjustSubCategoryPositions(id, existingSubCategory.categoryId, targetPosition);
      updateData.position = targetPosition;
    }
  }

  const subCategory = await prisma.subCategory.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
    },
  });

  // Resequence subcategories to keep positions clean
  await resequenceSubCategories(existingSubCategory.categoryId);

  // Fetch updated subcategory to get correct resequenced position
  const finalSubCategory = await prisma.subCategory.findUnique({
    where: { id },
    include: { category: true }
  });

  // Format with image URL
  const formattedSubCategory = {
    ...finalSubCategory,
    image: finalSubCategory.image ? getFileUrl(finalSubCategory.image) : null,
  };

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { subCategory: formattedSubCategory },
        "Sub-category updated successfully"
      )
    );
});

// Delete sub-category
export const deleteSubCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const subCategory = await prisma.subCategory.findUnique({
    where: { id },
    include: {
      products: true,
    },
  });

  if (!subCategory) {
    throw new ApiError(404, "Sub-category not found");
  }

  // Check if sub-category is being used by any products
  if (subCategory.products.length > 0) {
    throw new ApiError(
      400,
      "Cannot delete sub-category. It is being used by products."
    );
  }

  // Delete image if exists
  if (subCategory.image) {
    await deleteFromS3(subCategory.image);
  }

  await prisma.subCategory.delete({
    where: { id },
  });

  // Resequence subcategories to fill the gap
  await resequenceSubCategories(subCategory.categoryId);

  res
    .status(200)
    .json(new ApiResponsive(200, null, "Sub-category deleted successfully"));
});
