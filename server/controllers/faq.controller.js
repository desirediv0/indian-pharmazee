import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";

// Prisma exposes the FAQ model as `fAQ` (lower-cased first letter). `FAQ` is
// kept as a fallback because older code in this repo used that spelling.
const faqModel = (client = prisma) => client.fAQ ?? client.FAQ;

const MAX_QUESTION_LENGTH = 500;
const MAX_ANSWER_LENGTH = 20000;
const MAX_CATEGORY_LENGTH = 100;
const MAX_TARGETS = 200;

/* ------------------------------------------------------------------ */
/* Input helpers                                                       */
/* ------------------------------------------------------------------ */

const readText = (value, field, { max, required = false } = {}) => {
  if (value === undefined) {
    if (required) throw new ApiError(400, `${field} is required`);
    return undefined;
  }
  if (typeof value !== "string") {
    throw new ApiError(400, `${field} must be text`);
  }
  const text = value.trim();
  if (required && !text) throw new ApiError(400, `${field} is required`);
  if (text.length > max) {
    throw new ApiError(400, `${field} must be at most ${max} characters`);
  }
  return text;
};

const readBoolean = (value, field) => {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new ApiError(400, `${field} must be true or false`);
  }
  return value;
};

const readIdList = (value, field) => {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new ApiError(400, `${field} must be an array`);
  }
  if (value.length > MAX_TARGETS) {
    throw new ApiError(400, `${field} can have at most ${MAX_TARGETS} items`);
  }
  const ids = value.map((id) => {
    if (typeof id !== "string" || !id.trim() || id.length > 100) {
      throw new ApiError(400, `${field} contains an invalid id`);
    }
    return id.trim();
  });
  return [...new Set(ids)];
};

// Reads the placement fields shared by create + update. Only fields that were
// actually sent are returned, so a partial update never resets the others.
const readPlacement = (body) => {
  const placement = {
    showOnFaqPage: readBoolean(body.showOnFaqPage, "showOnFaqPage"),
    showOnHome: readBoolean(body.showOnHome, "showOnHome"),
    showOnAllCategories: readBoolean(
      body.showOnAllCategories,
      "showOnAllCategories"
    ),
    showOnAllProducts: readBoolean(body.showOnAllProducts, "showOnAllProducts"),
    categoryIds: readIdList(body.categoryIds, "categoryIds"),
    productIds: readIdList(body.productIds, "productIds"),
  };
  return Object.fromEntries(
    Object.entries(placement).filter(([, v]) => v !== undefined)
  );
};

/* ------------------------------------------------------------------ */
/* Public                                                              */
/* ------------------------------------------------------------------ */

// Published FAQs for the standalone /faqs page
export const getAllPublishedFaqs = asyncHandler(async (req, res) => {
  const faqs = await faqModel().findMany({
    where: { isPublished: true, showOnFaqPage: true },
    orderBy: { order: "asc" },
  });

  res
    .status(200)
    .json(new ApiResponsive(200, { faqs }, "FAQs fetched successfully"));
});

// Published FAQs for one page: home, a category page or a product page.
// GET /api/faqs/for-page?type=home|category|product&slug=<slug>
export const getFaqsForPage = asyncHandler(async (req, res) => {
  const type = typeof req.query.type === "string" ? req.query.type : "";
  const slug =
    typeof req.query.slug === "string" ? req.query.slug.trim() : "";

  if (!["home", "category", "product"].includes(type)) {
    throw new ApiError(400, "type must be home, category or product");
  }
  if (type !== "home" && (!slug || slug.length > 200)) {
    throw new ApiError(400, "A valid slug is required");
  }

  let placementFilter;

  if (type === "home") {
    placementFilter = { showOnHome: true };
  } else if (type === "category") {
    let category = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });

    // Old slugs keep resolving after a rename
    if (!category) {
      try {
        const history = await prisma.categorySlugHistory.findUnique({
          where: { slug },
          select: { categoryId: true },
        });
        if (history) category = { id: history.categoryId };
      } catch {
        // slug history not available yet — treat as not found
      }
    }

    if (!category) {
      return res
        .status(200)
        .json(new ApiResponsive(200, { faqs: [] }, "FAQs fetched successfully"));
    }

    placementFilter = {
      OR: [
        { showOnAllCategories: true },
        { categoryIds: { has: category.id } },
      ],
    };
  } else {
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      select: { id: true },
    });

    if (!product) {
      return res
        .status(200)
        .json(new ApiResponsive(200, { faqs: [] }, "FAQs fetched successfully"));
    }

    placementFilter = {
      OR: [{ showOnAllProducts: true }, { productIds: { has: product.id } }],
    };
  }

  const faqs = await faqModel().findMany({
    where: { isPublished: true, ...placementFilter },
    orderBy: { order: "asc" },
    select: { id: true, question: true, answer: true },
  });

  res.set("Cache-Control", "public, max-age=60, s-maxage=60");
  res
    .status(200)
    .json(new ApiResponsive(200, { faqs }, "FAQs fetched successfully"));
});

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

// Admin: Get all FAQs (published and unpublished)
export const getAllFaqs = asyncHandler(async (req, res) => {
  const faqs = await faqModel().findMany({
    orderBy: [{ order: "asc" }],
  });

  res
    .status(200)
    .json(new ApiResponsive(200, { faqs }, "All FAQs fetched successfully"));
});

// Admin: Create a new FAQ
export const createFaq = asyncHandler(async (req, res) => {
  const body = req.body || {};

  const question = readText(body.question, "Question", {
    max: MAX_QUESTION_LENGTH,
    required: true,
  });
  const answer = readText(body.answer, "Answer", {
    max: MAX_ANSWER_LENGTH,
    required: true,
  });
  const category = readText(body.category === null ? "" : body.category, "Category", {
    max: MAX_CATEGORY_LENGTH,
  });
  const isPublished = readBoolean(body.isPublished, "isPublished");
  const placement = readPlacement(body);

  const faq = await prisma.$transaction(async (tx) => {
    // New FAQs go to the end of the list
    const last = await faqModel(tx).findFirst({ orderBy: { order: "desc" } });

    return faqModel(tx).create({
      data: {
        question,
        answer,
        category: category || null,
        order: last ? last.order + 1 : 1,
        isPublished: isPublished ?? true,
        ...placement,
      },
    });
  });

  res
    .status(201)
    .json(new ApiResponsive(201, { faq }, "FAQ created successfully"));
});

// Admin: Update an existing FAQ (only the fields that are sent are changed)
export const updateFaq = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};

  const existingFaq = await faqModel().findUnique({ where: { id } });
  if (!existingFaq) {
    throw new ApiError(404, "FAQ not found");
  }

  const question = readText(body.question, "Question", {
    max: MAX_QUESTION_LENGTH,
  });
  const answer = readText(body.answer, "Answer", { max: MAX_ANSWER_LENGTH });
  const category = readText(body.category === null ? "" : body.category, "Category", {
    max: MAX_CATEGORY_LENGTH,
  });
  const isPublished = readBoolean(body.isPublished, "isPublished");
  const placement = readPlacement(body);

  if (question !== undefined && !question) {
    throw new ApiError(400, "Question and answer are required");
  }
  if (answer !== undefined && !answer) {
    throw new ApiError(400, "Question and answer are required");
  }

  const updateData = { ...placement };
  if (question !== undefined) updateData.question = question;
  if (answer !== undefined) updateData.answer = answer;
  if (category !== undefined) updateData.category = category || null;
  if (isPublished !== undefined) updateData.isPublished = isPublished;

  if (body.order !== undefined) {
    const order = Number.parseInt(body.order, 10);
    if (Number.isNaN(order) || order < 0) {
      throw new ApiError(400, "order must be a non-negative number");
    }
    updateData.order = order;
  }

  const updatedFaq = await faqModel().update({
    where: { id },
    data: updateData,
  });

  res
    .status(200)
    .json(
      new ApiResponsive(200, { faq: updatedFaq }, "FAQ updated successfully")
    );
});

// Admin: Delete an FAQ
export const deleteFaq = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.$transaction(async (tx) => {
    const existingFaq = await faqModel(tx).findUnique({ where: { id } });
    if (!existingFaq) {
      throw new ApiError(404, "FAQ not found");
    }

    await faqModel(tx).delete({ where: { id } });

    // Close the gap so ordering stays sequential
    await faqModel(tx).updateMany({
      where: { order: { gt: existingFaq.order } },
      data: { order: { decrement: 1 } },
    });
  });

  res.status(200).json(new ApiResponsive(200, null, "FAQ deleted successfully"));
});

// Get FAQ by ID. Drafts are only visible to admins.
export const getFaqById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const faq = await faqModel().findUnique({ where: { id } });

  if (!faq || (!req.admin && !faq.isPublished)) {
    throw new ApiError(404, "FAQ not found");
  }

  res
    .status(200)
    .json(new ApiResponsive(200, { faq }, "FAQ fetched successfully"));
});

// Bulk update order of FAQs (the array position becomes the new order)
export const bulkUpdateFaqOrder = asyncHandler(async (req, res) => {
  const { faqs } = req.body || {};

  if (!Array.isArray(faqs) || faqs.length === 0) {
    throw new ApiError(400, "faqs must be a non-empty array");
  }
  if (faqs.length > 1000) {
    throw new ApiError(400, "Too many FAQs in one request");
  }

  const faqIds = faqs.map((faq) => {
    if (!faq || typeof faq.id !== "string" || !faq.id) {
      throw new ApiError(400, "Every FAQ needs a valid id");
    }
    return faq.id;
  });

  const existingCount = await faqModel().count({
    where: { id: { in: faqIds } },
  });
  if (existingCount !== new Set(faqIds).size) {
    throw new ApiError(404, "Some FAQs not found");
  }

  // Parameterised updates inside one transaction (all-or-nothing)
  await prisma.$transaction(
    faqIds.map((faqId, index) =>
      faqModel().update({ where: { id: faqId }, data: { order: index + 1 } })
    )
  );

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { success: true },
        "FAQ order updated successfully"
      )
    );
});

// Get FAQ categories (public callers only see categories of live FAQs)
export const getFaqCategories = asyncHandler(async (req, res) => {
  const categories = await faqModel().groupBy({
    by: ["category"],
    where: req.admin ? {} : { isPublished: true, showOnFaqPage: true },
    _count: { id: true },
  });

  const formattedCategories = categories
    .filter((cat) => cat.category)
    .map((cat) => ({
      name: cat.category,
      count: cat._count.id,
    }));

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { categories: formattedCategories },
        "FAQ categories fetched successfully"
      )
    );
});

/* ------------------------------------------------------------------ */
/* Admin: pickers for the "where to show" controls                     */
/* ------------------------------------------------------------------ */

// All categories (id / name / slug only) so FAQ editors need no extra permission
export const getFaqTargetCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });

  res
    .status(200)
    .json(
      new ApiResponsive(200, { categories }, "Categories fetched successfully")
    );
});

// Products by name search, or by a list of ids (to show already-selected ones)
export const getFaqTargetProducts = asyncHandler(async (req, res) => {
  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim().slice(0, 100)
      : "";
  const ids =
    typeof req.query.ids === "string"
      ? req.query.ids
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
          .slice(0, MAX_TARGETS)
      : [];

  let where = null;
  let take = 20;

  if (ids.length > 0) {
    where = { id: { in: ids } };
    take = ids.length;
  } else if (search.length >= 2) {
    where = { name: { contains: search, mode: "insensitive" } };
  }

  const products = where
    ? await prisma.product.findMany({
        where,
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
        take,
      })
    : [];

  res
    .status(200)
    .json(
      new ApiResponsive(200, { products }, "Products fetched successfully")
    );
});
