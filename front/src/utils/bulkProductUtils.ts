import { v4 as uuidv4 } from "uuid";
import {
  products,
  categories,
  attributes,
  attributeValues,
} from "@/api/adminService";
import { stripHtmlToPlain } from "@/config/joditEditorConfig";

export const MAX_BULK_PRODUCTS = 100;
export const BULK_API_DELAY_MS = 400;
export const BULK_VARIANT_IMAGE_DELAY_MS = 150;

export interface BulkVariantRow {
  id: string;
  attributePairs: { attributeName: string; value: string }[];
  attributeValueIds: string[];
  price: string;
  salePrice: string;
  quantity: string;
  sku: string;
  images: File[];
  isActive: boolean;
}

export interface BulkAttributeConfig {
  name: string;
  values: string[];
}

export interface BulkValidationIssue {
  field: string;
  message: string;
}

export interface BulkProductRow {
  id: string;
  name: string;
  description: string;
  categoryIds: string[];
  newCategoryNames: string[];
  primaryCategoryId: string;
  subCategoryIds: string[];
  brandId: string;
  productType: string[];
  hasVariants: boolean;
  featured: boolean;
  isActive: boolean;
  ourProduct: boolean;
  price: string;
  salePrice: string;
  quantity: string;
  images: File[];
  attributeConfigs: BulkAttributeConfig[];
  variants: BulkVariantRow[];
  /** Set after validation */
  validationErrors?: BulkValidationIssue[];
}

export interface ResolveCache {
  categories: Map<string, string>;
  attributes: Map<string, string>;
  attributeValues: Map<string, string>;
}

export interface BulkSubmitResult {
  success: boolean;
  productId?: string;
  error?: string;
  rowIndex: number;
  productName: string;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function extractApiError(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    "Unknown error"
  );
}

/** Client-side validation before API calls */
export function validateBulkProduct(
  row: BulkProductRow,
  rowIndex: number,
  labels: {
    nameRequired: string;
    categoryRequired: string;
    priceRequired: string;
    stockRequired: string;
    variantRequired: string;
    variantPrice: string;
    variantStock: string;
    variantLabel: (n: number) => string;
  }
): BulkValidationIssue[] {
  const issues: BulkValidationIssue[] = [];
  const prefix = `Product ${rowIndex + 1}`;

  if (!row.name.trim()) {
    issues.push({ field: "name", message: `${prefix}: ${labels.nameRequired}` });
  }

  const hasCategory =
    row.categoryIds.length > 0 ||
    row.newCategoryNames.some((n) => n.trim().length > 0);
  if (!hasCategory) {
    issues.push({
      field: "category",
      message: `${prefix}: ${labels.categoryRequired}`,
    });
  }

  if (!row.hasVariants) {
    const price = parseFloat(row.price);
    if (row.price === "" || isNaN(price) || price < 0) {
      issues.push({ field: "price", message: `${prefix}: ${labels.priceRequired}` });
    }
    const qty = parseInt(row.quantity, 10);
    if (row.quantity === "" || isNaN(qty) || qty < 0) {
      issues.push({ field: "quantity", message: `${prefix}: ${labels.stockRequired}` });
    }
  } else {
    if (row.variants.length === 0) {
      issues.push({
        field: "variants",
        message: `${prefix}: ${labels.variantRequired}`,
      });
    }
    row.variants.forEach((v, vi) => {
      const price = parseFloat(v.price);
      if (v.price === "" || isNaN(price) || price < 0) {
        issues.push({
          field: `variant-${vi}-price`,
          message: `${prefix} ${labels.variantLabel(vi + 1)}: ${labels.variantPrice}`,
        });
      }
      const qty = parseInt(v.quantity, 10);
      if (v.quantity === "" || isNaN(qty) || qty < 0) {
        issues.push({
          field: `variant-${vi}-quantity`,
          message: `${prefix} ${labels.variantLabel(vi + 1)}: ${labels.variantStock}`,
        });
      }
    });
  }

  return issues;
}

export function createSimpleProductExample(): BulkProductRow {
  return {
    id: uuidv4(),
    name: "Organic Turmeric Powder 200g",
    description: "<p>Pure organic haldi powder for daily cooking.</p>",
    categoryIds: [],
    newCategoryNames: ["Spices"],
    primaryCategoryId: "",
    subCategoryIds: [],
    brandId: "",
    productType: ["new"],
    hasVariants: false,
    featured: false,
    isActive: true,
    ourProduct: true,
    price: "199",
    salePrice: "149",
    quantity: "100",
    images: [],
    attributeConfigs: [],
    variants: [],
  };
}

export function createVariantProductExample(): BulkProductRow {
  const attributeConfigs: BulkAttributeConfig[] = [
    { name: "Weight", values: ["500g", "1kg"] },
  ];
  const combos = cartesianVariants(attributeConfigs);
  const variants: BulkVariantRow[] = combos.map((pairs, i) => ({
    id: uuidv4(),
    attributePairs: pairs,
    attributeValueIds: [],
    price: i === 0 ? "120" : "220",
    salePrice: i === 0 ? "99" : "199",
    quantity: i === 0 ? "50" : "30",
    sku: "",
    images: [],
    isActive: true,
  }));

  return {
    id: uuidv4(),
    name: "Premium Basmati Rice",
    description: "<p>Long grain basmati rice — choose pack size.</p>",
    categoryIds: [],
    newCategoryNames: ["Grains", "Rice"],
    primaryCategoryId: "",
    subCategoryIds: [],
    brandId: "",
    productType: ["featured"],
    hasVariants: true,
    featured: true,
    isActive: true,
    ourProduct: false,
    price: "",
    salePrice: "",
    quantity: "0",
    images: [],
    attributeConfigs,
    variants,
  };
}

export function createEmptyProductRow(): BulkProductRow {
  return {
    id: uuidv4(),
    name: "",
    description: "",
    categoryIds: [],
    newCategoryNames: [],
    primaryCategoryId: "",
    subCategoryIds: [],
    brandId: "",
    productType: [],
    hasVariants: false,
    featured: false,
    isActive: true,
    ourProduct: false,
    price: "",
    salePrice: "",
    quantity: "0",
    images: [],
    attributeConfigs: [],
    variants: [],
  };
}

export function createEmptyVariantRow(
  attributePairs: { attributeName: string; value: string }[] = []
): BulkVariantRow {
  return {
    id: uuidv4(),
    attributePairs,
    attributeValueIds: [],
    price: "",
    salePrice: "",
    quantity: "0",
    sku: "",
    images: [],
    isActive: true,
  };
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function cartesianVariants(
  configs: BulkAttributeConfig[]
): { attributeName: string; value: string }[][] {
  const active = configs.filter((c) => c.name.trim() && c.values.length > 0);
  if (active.length === 0) return [];

  return active.reduce<{ attributeName: string; value: string }[][]>(
    (acc, config) => {
      const pairs = config.values
        .map((v) => v.trim())
        .filter(Boolean)
        .map((value) => ({ attributeName: config.name.trim(), value }));
      if (acc.length === 0) return pairs.map((p) => [p]);
      return acc.flatMap((combo) => pairs.map((p) => [...combo, p]));
    },
    []
  );
}

export async function resolveCategoryId(
  name: string,
  cache: ResolveCache,
  allCategories: { id: string; name: string }[]
): Promise<string> {
  const key = normalizeKey(name);
  if (cache.categories.has(key)) return cache.categories.get(key)!;

  const existing = allCategories.find((c) => normalizeKey(c.name) === key);
  if (existing) {
    cache.categories.set(key, existing.id);
    return existing.id;
  }

  const formData = new FormData();
  formData.append("name", name.trim());
  formData.append("description", `Auto-created from bulk upload`);

  try {
    const res = await categories.createCategory(formData);
    const id = res.data?.data?.category?.id;
    if (id) {
      cache.categories.set(key, id);
      allCategories.push({ id, name: name.trim() });
      return id;
    }
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 409) {
      const refreshed = await categories.getCategories();
      const list = refreshed.data?.data?.categories || [];
      const found = list.find((c: { name: string }) => normalizeKey(c.name) === key);
      if (found) {
        cache.categories.set(key, found.id);
        allCategories.push({ id: found.id, name: found.name });
        return found.id;
      }
    }
    throw err;
  }

  throw new Error(`Failed to resolve category: ${name}`);
}

export async function resolveAttributeValueId(
  attributeName: string,
  value: string,
  cache: ResolveCache,
  allAttributes: {
    id: string;
    name: string;
    values: { id: string; value: string }[];
  }[]
): Promise<string> {
  const cacheKey = `${normalizeKey(attributeName)}::${normalizeKey(value)}`;
  if (cache.attributeValues.has(cacheKey)) {
    return cache.attributeValues.get(cacheKey)!;
  }

  let attr = allAttributes.find(
    (a) => normalizeKey(a.name) === normalizeKey(attributeName)
  );

  if (!attr) {
    const res = await attributes.createAttribute({
      name: attributeName.trim(),
      inputType: "select",
    });
    const newAttr = res.data?.data?.attribute;
    attr = {
      id: newAttr.id,
      name: newAttr.name,
      values: [],
    };
    allAttributes.push(attr);
    cache.attributes.set(normalizeKey(attributeName), attr.id);
  } else {
    cache.attributes.set(normalizeKey(attributeName), attr.id);
  }

  let attrValue = attr.values.find(
    (v) => normalizeKey(v.value) === normalizeKey(value)
  );

  if (!attrValue) {
    const res = await attributeValues.createAttributeValue(attr.id, {
      value: value.trim(),
    });
    const created = res.data?.data?.attributeValue || res.data?.data?.value;
    if (!created?.id) {
      throw new Error(`Failed to resolve attribute value: ${attributeName} - ${value}`);
    }
    attrValue = { id: created.id, value: created.value };
    attr.values.push(attrValue);
  }

  cache.attributeValues.set(cacheKey, attrValue.id);
  return attrValue.id;
}

async function resolveAllCategoryIds(
  row: BulkProductRow,
  cache: ResolveCache,
  allCategories: { id: string; name: string }[]
): Promise<string[]> {
  const ids = new Set<string>(row.categoryIds);

  for (const name of row.newCategoryNames) {
    if (!name.trim()) continue;
    const id = await resolveCategoryId(name, cache, allCategories);
    ids.add(id);
  }

  if (ids.size === 0) {
    const id = await resolveCategoryId("Uncategorized", cache, allCategories);
    ids.add(id);
  }

  return Array.from(ids);
}

export async function submitBulkProduct(
  row: BulkProductRow,
  options: {
    autoSku: boolean;
    cache: ResolveCache;
    allCategories: { id: string; name: string }[];
    allAttributes: {
      id: string;
      name: string;
      values: { id: string; value: string }[];
    }[];
  }
): Promise<{ success: boolean; productId?: string; error?: string }> {
  const categoryIds = await resolveAllCategoryIds(
    row,
    options.cache,
    options.allCategories
  );

  let primaryCategoryId = row.primaryCategoryId;
  if (!primaryCategoryId || !categoryIds.includes(primaryCategoryId)) {
    primaryCategoryId = categoryIds[0];
  }

  const productTypes = [...row.productType];
  if (row.featured && !productTypes.includes("featured")) {
    productTypes.push("featured");
  }

  const plainDescription = stripHtmlToPlain(row.description, 160);
  const metaDescription =
    plainDescription || `Buy ${row.name.trim()} online at Genuine Grocery.`;

  const formData = new FormData();
  formData.append("name", row.name.trim());
  formData.append("description", row.description || "");
  formData.append("categoryIds", JSON.stringify(categoryIds));
  formData.append("primaryCategoryId", primaryCategoryId);
  formData.append("featured", String(row.featured || productTypes.includes("featured")));
  formData.append("ourProduct", String(row.ourProduct));
  formData.append("productType", JSON.stringify(productTypes));
  formData.append("isActive", String(row.isActive));
  formData.append("hasVariants", String(row.hasVariants));
  formData.append("metaTitle", row.name.trim());
  formData.append("metaDescription", metaDescription);
  formData.append("keywords", "");
  formData.append("tags", JSON.stringify([]));
  formData.append("topBrandIds", JSON.stringify([]));
  formData.append("newBrandIds", JSON.stringify([]));
  formData.append("hotBrandIds", JSON.stringify([]));

  if (row.brandId) {
    formData.append("brandId", row.brandId);
  }

  if (row.subCategoryIds && row.subCategoryIds.length > 0) {
    formData.append("subCategoryIds", JSON.stringify(row.subCategoryIds));
  }

  if (!row.hasVariants) {
    formData.append("price", row.price || "0");
    if (row.salePrice) formData.append("salePrice", row.salePrice);
    formData.append("quantity", row.quantity || "0");

    row.images.forEach((file) => formData.append("images", file));
    if (row.images.length > 0) formData.append("primaryImageIndex", "0");
  } else {
    const processedVariants = [];
    for (const variant of row.variants) {
      const valueIds: string[] = [];
      for (const pair of variant.attributePairs) {
        const id = await resolveAttributeValueId(
          pair.attributeName,
          pair.value,
          options.cache,
          options.allAttributes
        );
        valueIds.push(id);
      }

      processedVariants.push({
        attributeValueIds: valueIds,
        sku: options.autoSku ? "" : variant.sku || "",
        price: String(variant.price || 0),
        salePrice: variant.salePrice ? String(variant.salePrice) : "",
        quantity: String(variant.quantity || 0),
        isActive: variant.isActive,
      });
    }

    formData.append("variants", JSON.stringify(processedVariants));
  }

  const response = await products.createProduct(formData as never);
  if (!response.data?.success) {
    return {
      success: false,
      error: response.data?.message || "Failed to create product",
    };
  }

  const productId = response.data.data?.product?.id;
  const serverVariants = response.data.data?.product?.variants || [];

  if (row.hasVariants && productId && serverVariants.length > 0) {
    for (let i = 0; i < row.variants.length; i++) {
      const localVariant = row.variants[i];
      const serverVariant = serverVariants[i];
      if (!serverVariant || localVariant.images.length === 0) continue;

      for (let j = 0; j < localVariant.images.length; j++) {
        try {
          const isPrimary = j === 0 ? true : undefined;
          await products.uploadVariantImage(
            serverVariant.id,
            localVariant.images[j],
            isPrimary
          );
          if (j < localVariant.images.length - 1) {
            await delay(BULK_VARIANT_IMAGE_DELAY_MS);
          }
        } catch (imgErr) {
          console.warn(`Variant image upload failed for variant ${i + 1}:`, imgErr);
        }
      }
    }
  }

  return { success: true, productId };
}

/** Process many products sequentially — safe for 100+ without overloading server */
export async function submitBulkProductsSequential(
  rows: BulkProductRow[],
  options: {
    autoSku: boolean;
    cache: ResolveCache;
    allCategories: { id: string; name: string }[];
    allAttributes: {
      id: string;
      name: string;
      values: { id: string; value: string }[];
    }[];
    onProgress?: (current: number, total: number) => void;
  }
): Promise<BulkSubmitResult[]> {
  const results: BulkSubmitResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    options.onProgress?.(i + 1, rows.length);

    try {
      const result = await submitBulkProduct(row, options);
      results.push({
        rowIndex: i,
        productName: row.name,
        success: result.success,
        productId: result.productId,
        error: result.error,
      });
    } catch (err) {
      results.push({
        rowIndex: i,
        productName: row.name,
        success: false,
        error: extractApiError(err),
      });
    }

    if (i < rows.length - 1) {
      await delay(BULK_API_DELAY_MS);
    }
  }

  return results;
}
