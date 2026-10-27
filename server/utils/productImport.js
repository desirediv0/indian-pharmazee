import ExcelJS from "exceljs";
import { Readable } from "stream";
import { createSlug } from "../helper/Slug.js";
import { generateSKU } from "./generateSKU.js";
import { generateSKUSuffixFromAttributes } from "./variant-attributes.js";

// Reads a product spreadsheet (.xlsx / .csv), checks every row against the
// database, and (when asked) writes the products. The sheet layout is the same
// as the product export, so an exported file can be edited and imported back.

export const MAX_IMPORT_ROWS = 5000;
export const IMPORT_MODES = ["both", "create", "update"];

// Headers the importer reads (case-insensitive; a trailing * is ignored).
// Anything else in the sheet (images, dates, slug...) is ignored.
export const IMPORT_FIELDS = {
  productId: "Product ID",
  name: "Product Name",
  brandName: "Brand",
  composition: "Composition",
  categories: "Categories",
  subCategories: "Sub Categories",
  description: "Description",
  isActive: "Active",
  featured: "Featured",
  ourProduct: "Our Product",
  tags: "Tags",
  flags: "Badges",
  metaTitle: "Meta Title",
  metaDescription: "Meta Description",
  keywords: "Keywords",
  variantId: "Variant ID",
  sku: "SKU",
  variantAttributes: "Variant Options",
  price: "Price",
  salePrice: "Sale Price",
  quantity: "Stock Quantity",
  variantActive: "Variant Active",
  shippingLength: "Shipping Length (cm)",
  shippingBreadth: "Shipping Breadth (cm)",
  shippingHeight: "Shipping Height (cm)",
  shippingWeight: "Shipping Weight (kg)",
};

export const BADGES = {
  "cold chain": "isColdChain",
  "genuine medicine": "isGenuineMedicine",
  "temp controlled": "isTempControlled",
  "verified supplier": "isVerifiedSupplier",
  "pan india delivery": "isPanIndiaDelivery",
};

const normalizeHeader = (value) =>
  String(value ?? "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const HEADER_TO_KEY = Object.fromEntries(
  Object.entries(IMPORT_FIELDS).map(([key, label]) => [normalizeHeader(label), key])
);

/* ------------------------------------------------------------------ */
/* Reading the file                                                    */
/* ------------------------------------------------------------------ */

// ExcelJS cells can hold rich text, formulas, links or dates: reduce to plain values
const plainValue = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if (Array.isArray(value.richText)) return value.richText.map((r) => r.text).join("");
    if ("result" in value) return plainValue(value.result);
    if ("text" in value) return plainValue(value.text);
    if ("error" in value) return "";
    return "";
  }
  return value;
};

export async function readSheetRows(buffer, filename = "") {
  const workbook = new ExcelJS.Workbook();
  const isCsv = /\.csv$/i.test(filename);
  try {
    if (isCsv) {
      await workbook.csv.read(Readable.from([buffer]));
    } else {
      await workbook.xlsx.load(buffer);
    }
  } catch {
    throw new Error(
      isCsv
        ? "This CSV file could not be read."
        : "This file could not be read. Please upload the .xlsx file from the template."
    );
  }

  const sheet =
    workbook.worksheets.find((s) => normalizeHeader(s.name) === "products") ||
    workbook.worksheets[0];
  if (!sheet) throw new Error("The file has no sheet.");

  const columns = new Map(); // column number -> field key
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const key = HEADER_TO_KEY[normalizeHeader(plainValue(cell.value))];
    if (key && ![...columns.values()].includes(key)) columns.set(colNumber, key);
  });

  const found = new Set(columns.values());
  if (!found.has("name")) {
    throw new Error(
      'The first row must be the header row and must contain "Product Name". Please start from the template.'
    );
  }
  if (!found.has("price")) {
    throw new Error('The header row must contain "Price". Please start from the template.');
  }

  const rows = [];
  for (let r = 2; r <= sheet.rowCount; r += 1) {
    const row = sheet.getRow(r);
    const values = {};
    let hasData = false;
    for (const [colNumber, key] of columns) {
      const value = plainValue(row.getCell(colNumber).value);
      values[key] = typeof value === "string" ? value.trim() : value;
      if (values[key] !== "") hasData = true;
    }
    if (hasData) rows.push({ rowNumber: r, values });
    if (rows.length > MAX_IMPORT_ROWS) {
      throw new Error(`Too many rows. Import at most ${MAX_IMPORT_ROWS} rows at a time.`);
    }
  }

  return { rows, headers: [...found] };
}

/* ------------------------------------------------------------------ */
/* Cell parsers (each returns { value } or { error })                  */
/* ------------------------------------------------------------------ */

const text = (v) => String(v ?? "").trim();

const parseBool = (v) => {
  const t = text(v).toLowerCase();
  if (t === "") return { value: undefined };
  if (["yes", "y", "true", "1", "active"].includes(t)) return { value: true };
  if (["no", "n", "false", "0", "inactive"].includes(t)) return { value: false };
  return { error: `"${v}" is not Yes or No` };
};

const parseNumber = (v, { integer = false, min = 0 } = {}) => {
  if (v === "" || v === undefined || v === null) return { value: undefined };
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, "").trim());
  if (!Number.isFinite(n)) return { error: `"${v}" is not a number` };
  if (n < min) return { error: `"${v}" cannot be less than ${min}` };
  if (integer && !Number.isInteger(n)) return { error: `"${v}" must be a whole number` };
  return { value: n };
};

const parseList = (v) =>
  text(v)
    .split(/[|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

// "Strength: 300mg; Pack: 10 tablets" -> [{ attribute, value }]
const parseOptions = (v) => {
  const t = text(v);
  if (!t) return { value: [] };
  const out = [];
  for (const part of t.split(";")) {
    const piece = part.trim();
    if (!piece) continue;
    const at = piece.indexOf(":");
    if (at < 1 || at === piece.length - 1) {
      return { error: `"${piece}" must look like  Name: Value  (for example Strength: 500mg)` };
    }
    out.push({ attribute: piece.slice(0, at).trim(), value: piece.slice(at + 1).trim() });
  }
  return { value: out };
};

const lower = (s) => String(s).trim().toLowerCase();

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

async function loadLookups(prisma, groups) {
  const [categories, subCategories, brands, attributes] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.subCategory.findMany({
      select: { id: true, name: true, categoryId: true, category: { select: { name: true } } },
    }),
    prisma.brand.findMany({ select: { id: true, name: true } }),
    prisma.attribute.findMany({ include: { values: true } }),
  ]);

  const ids = new Set();
  const slugs = new Set();
  const skus = new Set();
  for (const g of groups) {
    if (g.productId) ids.add(g.productId);
    slugs.add(g.slug);
    for (const r of g.rows) {
      if (text(r.values.sku)) skus.add(text(r.values.sku));
    }
  }
  const variantIds = new Set();
  for (const g of groups) {
    for (const r of g.rows) {
      if (text(r.values.variantId)) variantIds.add(text(r.values.variantId));
    }
  }

  const existingProducts = await prisma.product.findMany({
    where: { OR: [{ id: { in: [...ids] } }, { slug: { in: [...slugs] } }] },
    select: { id: true, slug: true, name: true },
  });
  const existingVariants = await prisma.productVariant.findMany({
    where: { OR: [{ sku: { in: [...skus] } }, { id: { in: [...variantIds] } }] },
    select: { id: true, sku: true, productId: true },
  });

  return {
    categories: new Map(categories.map((c) => [lower(c.name), c])),
    subCategories,
    brands: new Map(brands.map((b) => [lower(b.name), b])),
    attributes: new Map(
      attributes.map((a) => [
        lower(a.name),
        { id: a.id, name: a.name, values: new Map(a.values.map((v) => [lower(v.value), v.id])) },
      ])
    ),
    productsById: new Map(existingProducts.map((p) => [p.id, p])),
    productsBySlug: new Map(existingProducts.map((p) => [p.slug, p])),
    variantsBySku: new Map(existingVariants.map((v) => [v.sku, v])),
    variantsById: new Map(existingVariants.map((v) => [v.id, v])),
  };
}

/* ------------------------------------------------------------------ */
/* Checking the rows -> a plan                                         */
/* ------------------------------------------------------------------ */

function groupRows(rows) {
  const groups = new Map();
  const orphans = [];
  for (const row of rows) {
    const name = text(row.values.name);
    if (!name) {
      orphans.push(row);
      continue;
    }
    const productId = text(row.values.productId);
    const slug = createSlug(name);
    const key = productId ? `id:${productId}` : `slug:${slug}`;
    if (!groups.has(key)) groups.set(key, { key, productId, name, slug, rows: [] });
    groups.get(key).rows.push(row);
  }
  return { groups: [...groups.values()], orphans };
}

export async function buildPlan(prisma, rows, mode = "both") {
  const errors = [];
  const warnings = [];
  const { groups, orphans } = groupRows(rows);

  for (const row of orphans) {
    errors.push({ row: row.rowNumber, product: "", message: "Product Name is empty" });
  }

  const ctx = await loadLookups(prisma, groups);
  const plans = [];
  const seenSkus = new Map(); // sku -> row number
  const targetedProducts = new Map(); // existing product id -> group name

  for (const group of groups) {
    const err = (row, message) =>
      errors.push({ row: row.rowNumber ?? row, product: group.name, message });
    const errorsBefore = errors.length;

    // ---- which product is this? ----
    let existing = null;
    if (group.productId) {
      existing = ctx.productsById.get(group.productId) || null;
      if (!existing) err(group.rows[0], `Product ID ${group.productId} was not found`);
    } else {
      existing = ctx.productsBySlug.get(group.slug) || null;
    }
    if (existing) {
      if (targetedProducts.has(existing.id)) {
        err(group.rows[0], `This product is listed twice (also as "${targetedProducts.get(existing.id)}")`);
      }
      targetedProducts.set(existing.id, group.name);
    }

    const first = group.rows[0];
    const v = first.values;
    const isNew = !existing;
    const fields = {};

    // ---- product level fields (first row of the product is used) ----
    const description = text(v.description);
    if (description) fields.description = description;
    const composition = text(v.composition);
    if (composition) fields.composition = composition;
    for (const key of ["metaTitle", "metaDescription", "keywords"]) {
      if (text(v[key])) fields[key] = text(v[key]);
    }

    for (const key of ["isActive", "featured", "ourProduct"]) {
      const parsed = parseBool(v[key]);
      if (parsed.error) err(first, `${IMPORT_FIELDS[key]}: ${parsed.error}`);
      else if (parsed.value !== undefined) fields[key] = parsed.value;
    }
    if (isNew) {
      fields.isActive ??= true;
      fields.featured ??= false;
      fields.ourProduct ??= false;
    }

    const tags = parseList(v.tags);
    if (tags.length > 0) fields.tags = tags;

    if (text(v.flags)) {
      const wanted = new Set(parseList(v.flags).map(lower));
      for (const name of wanted) {
        if (!BADGES[name]) {
          err(first, `Badges: "${name}" is not valid. Use: Cold chain, Genuine medicine, Temp controlled, Verified supplier, Pan India delivery`);
        }
      }
      for (const [label, column] of Object.entries(BADGES)) fields[column] = wanted.has(label);
    }

    // brand
    if (text(v.brandName)) {
      const brand = ctx.brands.get(lower(v.brandName));
      if (!brand) err(first, `Brand "${text(v.brandName)}" does not exist (create it in Brands first)`);
      else {
        fields.brandId = brand.id;
        fields.brandName = brand.name;
      }
    }

    // categories / sub categories
    const categoryIds = [];
    for (const name of parseList(v.categories)) {
      const category = ctx.categories.get(lower(name));
      if (!category) err(first, `Category "${name}" does not exist (check the Lists sheet)`);
      else if (!categoryIds.includes(category.id)) categoryIds.push(category.id);
    }
    const subCategoryIds = [];
    for (const name of parseList(v.subCategories)) {
      const [maybeCategory, maybeSub] = name.includes(">")
        ? name.split(">").map((s) => s.trim())
        : [null, name];
      const matches = ctx.subCategories.filter(
        (s) =>
          lower(s.name) === lower(maybeSub) &&
          (maybeCategory === null || lower(s.category.name) === lower(maybeCategory))
      );
      if (matches.length === 0) {
        err(first, `Sub category "${name}" does not exist (check the Lists sheet)`);
      } else if (matches.length > 1) {
        err(first, `Sub category "${name}" exists in more than one category: write it as  Category > Sub category`);
      } else if (!subCategoryIds.includes(matches[0].id)) {
        subCategoryIds.push(matches[0].id);
      }
    }

    // ---- variants (one per row) ----
    const variants = [];
    let anyOptions = false;
    for (const row of group.rows) {
      const r = row.values;
      const variant = { rowNumber: row.rowNumber };
      const rowErr = (message) => err(row, message);

      const price = parseNumber(r.price);
      if (price.error) rowErr(`Price: ${price.error}`);
      else variant.price = price.value;
      const salePrice = parseNumber(r.salePrice);
      if (salePrice.error) rowErr(`Sale Price: ${salePrice.error}`);
      else variant.salePrice = salePrice.value;
      const quantity = parseNumber(r.quantity, { integer: true });
      if (quantity.error) rowErr(`Stock Quantity: ${quantity.error}`);
      else variant.quantity = quantity.value;
      const active = parseBool(r.variantActive);
      if (active.error) rowErr(`Variant Active: ${active.error}`);
      else variant.isActive = active.value;

      for (const key of ["shippingLength", "shippingBreadth", "shippingHeight", "shippingWeight"]) {
        const n = parseNumber(r[key]);
        if (n.error) rowErr(`${IMPORT_FIELDS[key]}: ${n.error}`);
        else if (n.value !== undefined) variant[key] = n.value;
      }

      // existing variant?
      const sku = text(r.sku);
      const variantId = text(r.variantId);
      let existingVariant = null;
      if (variantId) {
        existingVariant = ctx.variantsById.get(variantId) || null;
        if (!existingVariant) rowErr(`Variant ID ${variantId} was not found`);
      } else if (sku) {
        existingVariant = ctx.variantsBySku.get(sku) || null;
      }
      if (existingVariant) {
        if (existing && existingVariant.productId !== existing.id) {
          rowErr(`SKU ${existingVariant.sku} belongs to a different product`);
        } else if (!existing) {
          rowErr(`SKU ${existingVariant.sku} already belongs to another product`);
        }
        variant.existingId = existingVariant.id;
        variant.sku = existingVariant.sku;
      } else {
        variant.sku = sku || undefined;
      }

      if (variant.sku) {
        if (seenSkus.has(variant.sku)) {
          rowErr(`SKU ${variant.sku} is repeated (also in row ${seenSkus.get(variant.sku)})`);
        }
        seenSkus.set(variant.sku, row.rowNumber);
      }

      if (!variant.existingId) {
        if (variant.price === undefined && !price.error) rowErr("Price is required for a new variant");
        variant.quantity ??= 0;
      }
      if (
        variant.salePrice !== undefined &&
        variant.price !== undefined &&
        variant.salePrice > variant.price
      ) {
        rowErr("Sale Price cannot be higher than Price");
      }

      // options
      const options = parseOptions(r.variantAttributes);
      if (options.error) rowErr(`Variant Options: ${options.error}`);
      variant.options = [];
      for (const option of options.value || []) {
        const attribute = ctx.attributes.get(lower(option.attribute));
        if (!attribute) {
          rowErr(`Option "${option.attribute}" does not exist (check the Lists sheet)`);
          continue;
        }
        const valueId = attribute.values.get(lower(option.value));
        variant.options.push({
          attributeId: attribute.id,
          attributeName: attribute.name,
          value: option.value,
          valueId: valueId || null,
        });
        if (!valueId) {
          warnings.push({
            row: row.rowNumber,
            product: group.name,
            message: `New value "${option.value}" will be added to "${attribute.name}"`,
          });
        }
      }
      if (variant.options.length > 0) anyOptions = true;
      variants.push(variant);
    }

    const action = isNew ? "create" : "update";
    const hasVariants = anyOptions || variants.length > 1;
    const hasError = errors.length > errorsBefore;
    // "Only add new" / "Only update existing" leave the other products untouched
    const skipped =
      !hasError &&
      ((action === "create" && mode === "update") ||
        (action === "update" && mode === "create"));

    plans.push({
      name: group.name,
      slug: group.slug,
      action,
      skipped,
      hasError,
      existingId: existing?.id,
      fields,
      categoryIds,
      subCategoryIds,
      hasVariants,
      variants,
      firstRow: first.rowNumber,
    });
  }

  const ready = plans.filter((p) => !p.hasError && !p.skipped);
  return {
    plans,
    errors,
    warnings,
    summary: {
      totalRows: rows.length,
      products: plans.length,
      toCreate: ready.filter((p) => p.action === "create").length,
      toUpdate: ready.filter((p) => p.action === "update").length,
      variantsToCreate: ready.reduce(
        (n, p) => n + p.variants.filter((v) => !v.existingId).length,
        0
      ),
      variantsToUpdate: ready.reduce(
        (n, p) => n + p.variants.filter((v) => v.existingId).length,
        0
      ),
      skipped: plans.filter((p) => p.skipped).length,
      withErrors: plans.filter((p) => p.hasError).length + orphans.length,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Writing the products                                                */
/* ------------------------------------------------------------------ */

const stripHtml = (value = "", max = 160) => {
  const plain = String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length <= max ? plain : `${plain.slice(0, max)}...`;
};

async function uniqueSku(tx, info, suffix, used) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = generateSKU(info, suffix, attempt);
    if (used.has(candidate)) continue;
    if (!(await tx.productVariant.findUnique({ where: { sku: candidate } }))) {
      used.add(candidate);
      return candidate;
    }
  }
  throw new Error("Could not generate a unique SKU");
}

// Finds or creates the attribute values a variant needs; returns their ids
async function resolveOptionIds(tx, options) {
  const ids = [];
  for (const option of options) {
    let valueId = option.valueId;
    if (!valueId) {
      const found = await tx.attributeValue.findFirst({
        where: {
          attributeId: option.attributeId,
          value: { equals: option.value, mode: "insensitive" },
        },
      });
      valueId =
        found?.id ??
        (
          await tx.attributeValue.create({
            data: { attributeId: option.attributeId, value: option.value },
          })
        ).id;
      option.valueId = valueId;
    }
    ids.push(valueId);
  }
  return ids;
}

const variantData = (variant) => ({
  ...(variant.price !== undefined && { price: variant.price }),
  ...(variant.salePrice !== undefined && { salePrice: variant.salePrice }),
  ...(variant.quantity !== undefined && { quantity: variant.quantity }),
  ...(variant.isActive !== undefined && { isActive: variant.isActive }),
  ...(variant.shippingLength !== undefined && { shippingLength: variant.shippingLength }),
  ...(variant.shippingBreadth !== undefined && { shippingBreadth: variant.shippingBreadth }),
  ...(variant.shippingHeight !== undefined && { shippingHeight: variant.shippingHeight }),
  ...(variant.shippingWeight !== undefined && { shippingWeight: variant.shippingWeight }),
});

async function defaultCategoryId(tx) {
  let category = await tx.category.findFirst({ where: { name: "Uncategorized" } });
  if (!category) {
    category = await tx.category.create({
      data: {
        name: "Uncategorized",
        slug: "uncategorized",
        description: "DEFAULT_CATEGORY - Products without a specific category",
      },
    });
  }
  return category.id;
}

async function writeProduct(tx, plan, usedSkus) {
  let productId = plan.existingId;
  const categoryIds = plan.categoryIds;

  if (plan.action === "create") {
    const seoTitle = plan.fields.metaTitle || plan.name;
    const seoDescription =
      plan.fields.metaDescription ||
      stripHtml(plan.fields.description) ||
      `Buy ${plan.name} online at Indian Pharmazee.`;

    const created = await tx.product.create({
      data: {
        name: plan.name,
        slug: plan.slug,
        productType: [],
        hasVariants: plan.hasVariants,
        ...plan.fields,
        metaTitle: seoTitle,
        metaDescription: seoDescription,
      },
    });
    productId = created.id;

    const ids = categoryIds.length > 0 ? categoryIds : [await defaultCategoryId(tx)];
    for (const [index, categoryId] of ids.entries()) {
      await tx.productCategory.create({
        data: { productId, categoryId, isPrimary: index === 0 },
      });
    }
    for (const subCategoryId of plan.subCategoryIds) {
      await tx.productSubCategory.create({ data: { productId, subCategoryId } });
    }
  } else {
    const data = { ...plan.fields, name: plan.name };
    if (plan.hasVariants) data.hasVariants = true;
    await tx.product.update({ where: { id: productId }, data });

    if (categoryIds.length > 0) {
      await tx.productCategory.deleteMany({ where: { productId } });
      for (const [index, categoryId] of categoryIds.entries()) {
        await tx.productCategory.create({
          data: { productId, categoryId, isPrimary: index === 0 },
        });
      }
    }
    if (plan.subCategoryIds.length > 0) {
      await tx.productSubCategory.deleteMany({ where: { productId } });
      for (const subCategoryId of plan.subCategoryIds) {
        await tx.productSubCategory.create({ data: { productId, subCategoryId } });
      }
    }
  }

  // SKU generation info
  const primaryCategory = categoryIds[0]
    ? await tx.category.findUnique({ where: { id: categoryIds[0] }, select: { name: true } })
    : null;

  let createdVariants = 0;
  let updatedVariants = 0;
  for (const variant of plan.variants) {
    const optionIds = await resolveOptionIds(tx, variant.options);

    if (variant.existingId) {
      await tx.productVariant.update({
        where: { id: variant.existingId },
        data: variantData(variant),
      });
      if (optionIds.length > 0) {
        await tx.variantAttributeValue.deleteMany({ where: { variantId: variant.existingId } });
        await tx.variantAttributeValue.createMany({
          data: optionIds.map((attributeValueId) => ({
            variantId: variant.existingId,
            attributeValueId,
          })),
        });
      }
      updatedVariants += 1;
    } else {
      let sku = variant.sku;
      if (!sku) {
        const suffix = optionIds.length > 0
          ? (await generateSKUSuffixFromAttributes(optionIds, tx)).replace(/^-/, "")
          : "DEFAULT";
        sku = await uniqueSku(
          tx,
          {
            name: plan.name,
            categoryName: primaryCategory?.name || "",
            basePrice: variant.price ?? 0,
          },
          suffix,
          usedSkus
        );
      }
      await tx.productVariant.create({
        data: {
          productId,
          sku,
          price: variant.price,
          salePrice: variant.salePrice ?? null,
          quantity: variant.quantity ?? 0,
          isActive: variant.isActive ?? true,
          shippingLength: variant.shippingLength ?? null,
          shippingBreadth: variant.shippingBreadth ?? null,
          shippingHeight: variant.shippingHeight ?? null,
          shippingWeight: variant.shippingWeight ?? null,
          ...(optionIds.length > 0 && {
            attributes: { create: optionIds.map((attributeValueId) => ({ attributeValueId })) },
          }),
        },
      });
      createdVariants += 1;
    }
  }

  return { productId, createdVariants, updatedVariants };
}

// Writes every checked product. Each product is its own transaction, so one
// bad product never stops (or half-saves) the others.
export async function applyPlan(prisma, plans) {
  const result = { created: 0, updated: 0, variantsCreated: 0, variantsUpdated: 0, failed: [], createdProductIds: [] };
  const usedSkus = new Set();

  for (const plan of plans) {
    if (plan.hasError || plan.skipped) continue;
    try {
      const done = await prisma.$transaction((tx) => writeProduct(tx, plan, usedSkus));
      if (plan.action === "create") {
        result.created += 1;
        result.createdProductIds.push(done.productId);
      } else {
        result.updated += 1;
      }
      result.variantsCreated += done.createdVariants;
      result.variantsUpdated += done.updatedVariants;
    } catch (error) {
      console.error(`Import failed for "${plan.name}":`, error);
      result.failed.push({
        row: plan.firstRow,
        product: plan.name,
        message: "Could not be saved (nothing was changed for this product)",
      });
    }
  }
  return result;
}
