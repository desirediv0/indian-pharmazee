import ExcelJS from "exceljs";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import {
  IMPORT_FIELDS,
  IMPORT_MODES,
  MAX_IMPORT_ROWS,
  applyPlan,
  buildPlan,
  readSheetRows,
} from "../utils/productImport.js";

// Admin: add / update products from an Excel (.xlsx) or CSV file.
//   GET  /api/admin/products/import/template   -> the Excel template
//   POST /api/admin/products/import            -> multipart: file, mode, dryRun

export const uploadImportFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (/\.(xlsx|csv)$/i.test(file.originalname)) return cb(null, true);
    cb(new ApiError(400, "Please upload an .xlsx or .csv file"));
  },
}).single("file");

/* ------------------------------------------------------------------ */
/* Template                                                            */
/* ------------------------------------------------------------------ */

const REQUIRED = new Set(["name", "price"]);

// Column order of the template (same order as the export)
const TEMPLATE_KEYS = [
  "productId",
  "name",
  "brandName",
  "composition",
  "categories",
  "subCategories",
  "description",
  "isActive",
  "featured",
  "ourProduct",
  "tags",
  "flags",
  "metaTitle",
  "metaDescription",
  "keywords",
  "variantId",
  "sku",
  "variantAttributes",
  "price",
  "salePrice",
  "quantity",
  "variantActive",
  "shippingLength",
  "shippingBreadth",
  "shippingHeight",
  "shippingWeight",
];

const COLUMN_NOTES = {
  productId: "Leave EMPTY for a new product. Fill it only to update an existing product (copy it from an export).",
  name: "Required. All rows with the same Product Name belong to one product.",
  brandName: "Must already exist in Brands. See the Lists sheet.",
  categories: "Names separated by |   Example: IVF - In Vitro Fertilization | Other Medicine\nSee the Lists sheet. Empty = Uncategorized.",
  subCategories: "Names separated by |   Example: Other Medicine > Tablets\nSee the Lists sheet.",
  description: "Plain text or HTML.",
  isActive: "Yes or No. Empty = Yes for a new product.",
  featured: "Yes or No. Empty = No.",
  ourProduct: "Yes or No. Empty = No.",
  tags: "Separated by |   Example: ivf | injection",
  flags: "Separated by |   Choose from: Cold chain, Genuine medicine, Temp controlled, Verified supplier, Pan India delivery",
  variantId: "Leave EMPTY for a new variant. Fill it only to update an existing variant.",
  sku: "Leave EMPTY to create the SKU automatically. If the SKU already exists, that variant is updated.",
  variantAttributes: "Only for products with options (for example strength or pack size).\nFormat:  Name: Value; Name: Value\nExample: Strength: 300mg; Pack: 10 tablets\nThe option name must exist (see the Lists sheet). New values are added automatically.",
  price: "Required for every new variant. Numbers only, for example 1250.50",
  salePrice: "Optional. Must be lower than Price.",
  quantity: "Stock quantity, whole number. Empty = 0 for a new variant.",
  variantActive: "Yes or No. Empty = Yes.",
};

// Built from real names in this store, so the example matches the Lists sheet
const buildExampleRows = ({ categories, attribute }) => [
  // A simple product: one row, no options
  {
    name: "Example Paracetamol 500mg Tablet",
    brandName: "",
    composition: "Paracetamol 500mg",
    categories: categories[0] || "",
    description: "Used to reduce fever and relieve mild pain.",
    isActive: "Yes",
    featured: "No",
    ourProduct: "No",
    tags: "fever | pain",
    flags: "Genuine medicine",
    sku: "",
    price: 35,
    salePrice: 30,
    quantity: 200,
    variantActive: "Yes",
    shippingWeight: 0.1,
  },
  // A product with 2 variants: one row per variant, same name
  {
    name: "Example Folic Acid Tablet",
    composition: "Folic Acid",
    categories: categories.slice(0, 2).join(" | "),
    description: "Supplement tablet.",
    isActive: "Yes",
    variantAttributes: `${attribute.name}: ${attribute.values[0]}`,
    price: 50,
    quantity: 100,
  },
  {
    name: "Example Folic Acid Tablet",
    variantAttributes: `${attribute.name}: ${attribute.values[1]}`,
    price: 140,
    salePrice: 125,
    quantity: 60,
  },
];

const INSTRUCTIONS = [
  ["HOW TO IMPORT PRODUCTS", ""],
  ["", ""],
  ["1", "Open the sheet called 'Products'. Row 1 is the header row. Do not rename, move or delete the headers."],
  ["2", "Write ONE ROW for every variant (every price / pack / strength). A product with no options needs only ONE row."],
  ["3", "If a product has several variants, repeat the same Product Name on each row. Product details (brand, categories, description...) are read from the first row of that product."],
  ["4", "Required columns: Product Name and Price (red headers). Everything else is optional."],
  ["5", "Look at the sheet called 'Example' to see exactly how to fill it. Do NOT copy the example rows into 'Products' unless you really want them added."],
  ["6", "Brands, categories, sub categories and options must already exist. The sheet 'Lists' shows the exact spelling to use."],
  ["7", "Use | (a vertical bar) to separate several values in one cell, for example  Categories:  IVF - In Vitro Fertilization | Other Medicine"],
  ["8", "In the admin panel go to Products > Import, choose the file and click 'Check file'. Nothing is saved yet: you will see how many products will be added / updated, and any mistakes with their row numbers."],
  ["9", "Fix the mistakes in Excel, check again, then click 'Import'. Products with mistakes are skipped; the correct ones are saved."],
  ["10", "Images are NOT imported. After the import, open each product and add its images."],
  ["", ""],
  ["UPDATING EXISTING PRODUCTS", ""],
  ["", "Export the products first (Products > Export), change the cells you want, and import the file again. The Product ID / SKU columns tell the importer which product / variant to update."],
  ["", "An EMPTY cell never erases the current value: it is simply left as it is."],
  ["", "Categories / Sub Categories: if filled, they REPLACE the product's current ones."],
  ["", "Nothing is ever deleted by an import. To remove a product or variant, do it in the admin panel."],
  ["", ""],
  ["TIPS", ""],
  ["", `Up to ${MAX_IMPORT_ROWS} rows per file. For 100-200 products it takes a few seconds. Start with 10 rows to be sure you have the format right.`],
  ["", "Yes / No columns: type Yes or No (a drop-down is provided)."],
  ["", "Prices and quantities: numbers only, no currency symbol."],
];

export const downloadImportTemplate = asyncHandler(async (req, res) => {
  const [categories, subCategories, brands, attributes] = await Promise.all([
    prisma.category.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.subCategory.findMany({
      select: { name: true, category: { select: { name: true } } },
      orderBy: [{ categoryId: "asc" }, { name: "asc" }],
    }),
    prisma.brand.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.attribute.findMany({
      include: { values: { orderBy: { value: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Indian Pharmazee";

  // ---- Instructions ----
  const help = workbook.addWorksheet("Instructions");
  help.columns = [{ width: 8 }, { width: 120 }];
  for (const [a, b] of INSTRUCTIONS) {
    const row = help.addRow([a, b]);
    row.alignment = { vertical: "top", wrapText: true };
    if (a && !b) row.font = { bold: true, size: 14 };
    else if (!a && b && /^[A-Z ]+$/.test(b)) row.font = { bold: true };
  }
  help.getRow(1).font = { bold: true, size: 16, color: { argb: "FF175C98" } };

  const columnsFor = (sheet) => {
    sheet.columns = TEMPLATE_KEYS.map((key) => ({
      header: IMPORT_FIELDS[key],
      key,
      width: ["description", "metaDescription", "variantAttributes", "categories"].includes(key)
        ? 38
        : ["name"].includes(key)
        ? 34
        : 20,
    }));
    const header = sheet.getRow(1);
    header.height = 22;
    TEMPLATE_KEYS.forEach((key, index) => {
      const cell = header.getCell(index + 1);
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: REQUIRED.has(key) ? "FFC0392B" : "FF175C98" },
      };
      if (COLUMN_NOTES[key]) cell.note = COLUMN_NOTES[key];
    });
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  };

  // ---- Products (empty, ready to fill) ----
  const products = workbook.addWorksheet("Products");
  columnsFor(products);
  const yesNoColumns = ["isActive", "featured", "ourProduct", "variantActive"];
  for (const key of yesNoColumns) {
    const letter = products.getColumn(key).letter;
    products.dataValidations.add(`${letter}2:${letter}${MAX_IMPORT_ROWS + 1}`, {
      type: "list",
      allowBlank: true,
      formulae: ['"Yes,No"'],
    });
  }

  // ---- Example ----
  const example = workbook.addWorksheet("Example");
  columnsFor(example);
  const firstAttribute = attributes.find((a) => a.values.length >= 2);
  const exampleRows = buildExampleRows({
    categories: categories.map((c) => c.name.trim()),
    attribute: firstAttribute
      ? { name: firstAttribute.name, values: firstAttribute.values.map((v) => v.value) }
      : { name: "Size", values: ["100ml", "200ml"] },
  });
  for (const row of exampleRows) example.addRow(row);
  example.addRow({});
  example.addRow({
    name: "^ Rows 2: a simple product (one row).  Rows 3-4: one product with 2 variants (same name on both rows).",
  }).font = { italic: true, color: { argb: "FF6B7280" } };
  example.getColumn("name").width = 60;

  // ---- Lists ----
  const lists = workbook.addWorksheet("Lists");
  const attributeValueRows = attributes.flatMap((a) =>
    a.values.length > 0 ? a.values.map((v) => [a.name, v.value]) : [[a.name, ""]]
  );
  const blocks = [
    ["Categories", categories.map((c) => [c.name])],
    ["Sub Categories (Category > Sub category)", subCategories.map((s) => [`${s.category.name} > ${s.name}`])],
    ["Brands", brands.map((b) => [b.name])],
    ["Option name", attributeValueRows.map((r) => [r[0]]) ],
    ["Option value", attributeValueRows.map((r) => [r[1]])],
  ];
  blocks.forEach(([title, values], index) => {
    const col = lists.getColumn(index + 1);
    col.width = 42;
    const head = lists.getCell(1, index + 1);
    head.value = title;
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF175C98" } };
    values.forEach((row, i) => {
      lists.getCell(i + 2, index + 1).value = row[0];
    });
  });
  lists.views = [{ state: "frozen", ySplit: 1 }];

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="product-import-template.xlsx"');
  res.setHeader("Cache-Control", "no-store");
  await workbook.xlsx.write(res);
  res.end();
});

/* ------------------------------------------------------------------ */
/* Import                                                              */
/* ------------------------------------------------------------------ */

const MAX_REPORTED = 200;

export const importProducts = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Please choose a file to import");

  const mode = req.body.mode || "both";
  if (!IMPORT_MODES.includes(mode)) throw new ApiError(400, "Unknown import mode");
  const dryRun = req.body.dryRun !== "false";

  // Updating needs the update permission as well
  const isSuper = req.admin?.role === "SUPER_ADMIN";
  const canUpdate = isSuper || req.admin?.permissions?.includes("products:update");
  if (!dryRun && mode !== "create" && !canUpdate) {
    throw new ApiError(403, "You can only add new products (no permission to update)");
  }

  let rows;
  try {
    ({ rows } = await readSheetRows(req.file.buffer, req.file.originalname));
  } catch (error) {
    throw new ApiError(400, error.message);
  }
  if (rows.length === 0) {
    throw new ApiError(400, "The file has no product rows. Fill the 'Products' sheet below the header row.");
  }

  const { plans, errors, warnings, summary } = await buildPlan(prisma, rows, mode);
  const sortRows = (a, b) => a.row - b.row;

  const response = {
    dryRun,
    mode,
    summary,
    errors: errors.sort(sortRows).slice(0, MAX_REPORTED),
    errorCount: errors.length,
    warnings: warnings.sort(sortRows).slice(0, MAX_REPORTED),
    preview: plans.slice(0, 100).map((p) => ({
      row: p.firstRow,
      name: p.name,
      action: p.hasError ? "error" : p.skipped ? "skip" : p.action,
      variants: p.variants.length,
    })),
  };

  if (!dryRun) {
    const result = await applyPlan(prisma, plans);
    response.result = {
      created: result.created,
      updated: result.updated,
      variantsCreated: result.variantsCreated,
      variantsUpdated: result.variantsUpdated,
      failed: result.failed,
      createdProductIds: result.createdProductIds,
    };
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: dryRun ? "File checked" : "Import finished",
    data: response,
  });
});
