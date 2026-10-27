import ExcelJS from "exceljs";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { getFileUrl } from "../utils/deleteFromS3.js";

// Admin: download products as an Excel file (.xlsx; or .csv with format=csv).
// GET /api/admin/products/export
//   scope=all | limit   (limit -> use `limit`, newest first)
//   limit=<n>           (1..MAX_EXPORT_ROWS products)
//   search, categoryIds, subCategoryIds, brandIds (comma separated), isActive,
//   featured, ourProduct, stock=in|out|low, minPrice, maxPrice,
//   createdFrom, createdTo (YYYY-MM-DD) - all optional, combined with AND
//   fields=a,b,c        (columns to include; default: every column)
//
// The file has one row per variant (product columns repeat), and one row for a
// product that has no variants.

const MAX_EXPORT_PRODUCTS = 50000;
const BATCH_SIZE = 500;

const plainText = (value) =>
  String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const yesNo = (value) => (value ? "Yes" : "No");
const isoDate = (value) => (value ? new Date(value).toISOString() : "");
const imageUrls = (images = []) =>
  images.map((image) => getFileUrl(image.url)).join(" | ");

// key -> { label, group, value(product, variant|null) }
export const EXPORT_COLUMNS = {
  productId: { label: "Product ID", group: "product", value: (p) => p.id },
  name: { label: "Product Name", group: "product", value: (p) => p.name },
  slug: { label: "Slug", group: "product", value: (p) => p.slug },
  brandName: {
    label: "Brand",
    group: "product",
    value: (p) => p.brand?.name || p.brandName || "",
  },
  composition: {
    label: "Composition",
    group: "product",
    value: (p) => p.composition || "",
  },
  categories: {
    label: "Categories",
    group: "product",
    value: (p) => p.categories.map((c) => c.category.name).join(" | "),
  },
  subCategories: {
    label: "Sub Categories",
    group: "product",
    value: (p) => p.subCategories.map((s) => s.subCategory.name).join(" | "),
  },
  description: {
    label: "Description",
    group: "product",
    value: (p) => plainText(p.description),
  },
  isActive: {
    label: "Active",
    group: "product",
    value: (p) => yesNo(p.isActive),
  },
  featured: {
    label: "Featured",
    group: "product",
    value: (p) => yesNo(p.featured),
  },
  ourProduct: {
    label: "Our Product",
    group: "product",
    value: (p) => yesNo(p.ourProduct),
  },
  hasVariants: {
    label: "Has Variants",
    group: "product",
    value: (p) => yesNo(p.hasVariants),
  },
  tags: {
    label: "Tags",
    group: "product",
    value: (p) => (p.tags || []).join(" | "),
  },
  flags: {
    label: "Badges",
    group: "product",
    value: (p) =>
      [
        p.isColdChain && "Cold chain",
        p.isGenuineMedicine && "Genuine medicine",
        p.isTempControlled && "Temp controlled",
        p.isVerifiedSupplier && "Verified supplier",
        p.isPanIndiaDelivery && "Pan India delivery",
      ]
        .filter(Boolean)
        .join(" | "),
  },
  metaTitle: {
    label: "Meta Title",
    group: "product",
    value: (p) => p.metaTitle || "",
  },
  metaDescription: {
    label: "Meta Description",
    group: "product",
    value: (p) => p.metaDescription || "",
  },
  keywords: {
    label: "Keywords",
    group: "product",
    value: (p) => p.keywords || "",
  },
  productImages: {
    label: "Product Image URLs",
    group: "product",
    value: (p) => imageUrls(p.images),
  },
  createdAt: {
    label: "Created At",
    group: "product",
    value: (p) => isoDate(p.createdAt),
  },
  updatedAt: {
    label: "Updated At",
    group: "product",
    value: (p) => isoDate(p.updatedAt),
  },

  variantId: {
    label: "Variant ID",
    group: "variant",
    value: (p, v) => v?.id ?? "",
  },
  sku: { label: "SKU", group: "variant", value: (p, v) => v?.sku ?? "" },
  variantAttributes: {
    label: "Variant Options",
    group: "variant",
    value: (p, v) =>
      (v?.attributes || [])
        .map(
          (a) => `${a.attributeValue.attribute.name}: ${a.attributeValue.value}`
        )
        .join("; "),
  },
  price: {
    label: "Price",
    group: "variant",
    value: (p, v) => (v ? Number(v.price) : ""),
  },
  salePrice: {
    label: "Sale Price",
    group: "variant",
    value: (p, v) => (v?.salePrice != null ? Number(v.salePrice) : ""),
  },
  quantity: {
    label: "Stock Quantity",
    group: "variant",
    value: (p, v) => (v ? v.quantity : ""),
  },
  variantActive: {
    label: "Variant Active",
    group: "variant",
    value: (p, v) => (v ? yesNo(v.isActive) : ""),
  },
  shippingLength: {
    label: "Shipping Length (cm)",
    group: "variant",
    value: (p, v) => v?.shippingLength ?? "",
  },
  shippingBreadth: {
    label: "Shipping Breadth (cm)",
    group: "variant",
    value: (p, v) => v?.shippingBreadth ?? "",
  },
  shippingHeight: {
    label: "Shipping Height (cm)",
    group: "variant",
    value: (p, v) => v?.shippingHeight ?? "",
  },
  shippingWeight: {
    label: "Shipping Weight (kg)",
    group: "variant",
    value: (p, v) => v?.shippingWeight ?? "",
  },
  variantImages: {
    label: "Variant Image URLs",
    group: "variant",
    value: (p, v) => (v ? imageUrls(v.images) : ""),
  },
};

const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const csvLine = (cells) => cells.map(csvCell).join(",") + "\r\n";

const WIDTHS = {
  description: 60,
  metaDescription: 50,
  productImages: 50,
  variantImages: 50,
  name: 36,
  categories: 28,
  subCategories: 28,
  productId: 38,
  variantId: 38,
};

const LOW_STOCK_LIMIT = 10;

const asList = (value) =>
  typeof value === "string"
    ? [...new Set(value.split(",").map((v) => v.trim()).filter(Boolean))]
    : [];

const asBoolean = (value) =>
  value === "true" ? true : value === "false" ? false : undefined;

const asDate = (value, field, endOfDay = false) => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(
    `${value.trim()}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
  );
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `${field} must be a date like 2026-01-31`);
  }
  return date;
};

const asMoney = (value, field) => {
  if (value === undefined || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new ApiError(400, `${field} must be a number`);
  }
  return number;
};

// Pickers for the filters in the export dialog
export const getProductExportOptions = asyncHandler(async (req, res) => {
  const [categories, subCategories, brands] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.subCategory.findMany({
      select: { id: true, name: true, category: { select: { name: true } } },
      orderBy: [{ categoryId: "asc" }, { name: "asc" }],
    }),
    prisma.brand.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Export options",
    data: {
      columns: Object.entries(EXPORT_COLUMNS).map(([key, c]) => ({
        key,
        label: c.label,
        group: c.group,
      })),
      categories,
      subCategories: subCategories.map((s) => ({
        id: s.id,
        name: `${s.category.name} > ${s.name}`,
      })),
      brands,
      lowStockLimit: LOW_STOCK_LIMIT,
    },
  });
});

export const exportProducts = asyncHandler(async (req, res) => {
  const q = req.query;
  const scope = q.scope || "all";
  if (!["all", "limit"].includes(scope)) {
    throw new ApiError(400, "scope must be all or limit");
  }
  const format = q.format || "xlsx";
  if (!["xlsx", "csv"].includes(format)) {
    throw new ApiError(400, "format must be xlsx or csv");
  }

  let maxProducts = MAX_EXPORT_PRODUCTS;
  if (scope === "limit") {
    maxProducts = Number.parseInt(q.limit, 10);
    if (!Number.isInteger(maxProducts) || maxProducts < 1) {
      throw new ApiError(400, "limit must be a number greater than 0");
    }
    maxProducts = Math.min(maxProducts, MAX_EXPORT_PRODUCTS);
  }

  let keys = Object.keys(EXPORT_COLUMNS);
  if (typeof q.fields === "string" && q.fields.trim()) {
    keys = asList(q.fields);
    const unknown = keys.filter((k) => !EXPORT_COLUMNS[k]);
    if (unknown.length > 0) {
      throw new ApiError(400, `Unknown column: ${unknown[0]}`);
    }
  }
  if (keys.length === 0) {
    throw new ApiError(400, "Select at least one column");
  }

  // ---- filters (all optional, combined with AND) ----
  const search = typeof q.search === "string" ? q.search.trim() : "";
  const categoryIds = asList(q.categoryIds);
  const subCategoryIds = asList(q.subCategoryIds);
  const brandIds = asList(q.brandIds);
  const isActive = asBoolean(q.isActive);
  const featured = asBoolean(q.featured);
  const ourProduct = asBoolean(q.ourProduct);
  const stock = q.stock || "";
  if (stock && !["in", "out", "low"].includes(stock)) {
    throw new ApiError(400, "stock must be in, out or low");
  }
  const minPrice = asMoney(q.minPrice, "minPrice");
  const maxPrice = asMoney(q.maxPrice, "maxPrice");
  const createdFrom = asDate(q.createdFrom, "createdFrom");
  const createdTo = asDate(q.createdTo, "createdTo", true);

  // Conditions on a variant (price / stock). They decide which products match
  // AND which variant rows are written, so "out of stock" lists only those.
  const variantWhere = {
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      price: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    }),
    ...(stock === "in" && { quantity: { gt: 0 } }),
    ...(stock === "out" && { quantity: { lte: 0 } }),
    ...(stock === "low" && { quantity: { gt: 0, lte: LOW_STOCK_LIMIT } }),
  };
  const hasVariantFilter = Object.keys(variantWhere).length > 0;

  const and = [];
  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brandName: { contains: search, mode: "insensitive" } },
        {
          variants: {
            some: { sku: { contains: search, mode: "insensitive" } },
          },
        },
      ],
    });
  }
  if (hasVariantFilter) and.push({ variants: { some: variantWhere } });
  if (categoryIds.length > 0) {
    and.push({ categories: { some: { categoryId: { in: categoryIds } } } });
  }
  if (subCategoryIds.length > 0) {
    and.push({
      subCategories: { some: { subCategoryId: { in: subCategoryIds } } },
    });
  }
  if (brandIds.length > 0) and.push({ brandId: { in: brandIds } });
  if (isActive !== undefined) and.push({ isActive });
  if (featured !== undefined) and.push({ featured });
  if (ourProduct !== undefined) and.push({ ourProduct });
  if (createdFrom || createdTo) {
    and.push({
      createdAt: {
        ...(createdFrom && { gte: createdFrom }),
        ...(createdTo && { lte: createdTo }),
      },
    });
  }
  const where = and.length > 0 ? { AND: and } : {};

  const needsVariants = keys.some((k) => EXPORT_COLUMNS[k].group === "variant");
  const include = {
    brand: { select: { name: true } },
    ...(keys.includes("categories") && {
      categories: { include: { category: { select: { name: true } } } },
    }),
    ...(keys.includes("subCategories") && {
      subCategories: { include: { subCategory: { select: { name: true } } } },
    }),
    ...(keys.includes("productImages") && {
      images: { orderBy: { order: "asc" } },
    }),
    ...(needsVariants && {
      variants: {
        ...(hasVariantFilter && { where: variantWhere }),
        orderBy: { createdAt: "asc" },
        include: {
          ...(keys.includes("variantAttributes") && {
            attributes: {
              include: { attributeValue: { include: { attribute: true } } },
            },
          }),
          ...(keys.includes("variantImages") && {
            images: { orderBy: { order: "asc" } },
          }),
        },
      },
    }),
  };

  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader(
    "Content-Type",
    format === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv; charset=utf-8"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="products-${stamp}.${format}"`
  );
  res.setHeader("Cache-Control", "no-store");

  const headers = keys.map((k) => EXPORT_COLUMNS[k].label);

  // One sink for both formats: addRow(cells) and finish()
  let addRow;
  let finish;
  if (format === "xlsx") {
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true,
      useSharedStrings: false,
    });
    const sheet = workbook.addWorksheet("Products", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    sheet.columns = keys.map((k, index) => ({
      header: headers[index],
      key: k,
      width: WIDTHS[k] || 18,
    }));
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF175C98" },
    };
    headerRow.commit();
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: keys.length },
    };
    addRow = (cells) => sheet.addRow(cells).commit();
    finish = async () => {
      sheet.commit();
      await workbook.commit();
    };
  } else {
    res.write("﻿"); // so Excel reads non-English text correctly
    res.write(csvLine(headers));
    addRow = (cells) => res.write(csvLine(cells));
    finish = async () => res.end();
  }

  // Read in small batches so a large catalog never sits in memory at once
  let exported = 0;
  let rowsWritten = 0;
  let cursor;
  try {
    while (exported < maxProducts) {
      const take = Math.min(BATCH_SIZE, maxProducts - exported);
      const batch = await prisma.product.findMany({
        where,
        include,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });
      if (batch.length === 0) break;

      for (const product of batch) {
        const variants =
          needsVariants && product.variants?.length ? product.variants : [null];
        for (const variant of variants) {
          addRow(keys.map((k) => EXPORT_COLUMNS[k].value(product, variant)));
          rowsWritten += 1;
        }
      }

      exported += batch.length;
      cursor = batch[batch.length - 1].id;
      if (batch.length < take) break;
    }
  } catch (error) {
    // Headers are already sent, so this cannot become a JSON error response
    console.error("Product export failed:", error);
    addRow(["EXPORT INCOMPLETE - an error occurred, please export again"]);
    rowsWritten += 1;
  }

  if (rowsWritten === 0) {
    addRow(["No products matched these filters"]);
  }
  await finish();
});
