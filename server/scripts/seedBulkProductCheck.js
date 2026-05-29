import { prisma } from "../config/db.js";
import { createSlug } from "../helper/Slug.js";
import { generateSKU } from "../utils/generateSKU.js";

const runId = new Date()
  .toISOString()
  .replace(/[-:.TZ]/g, "")
  .slice(0, 14);

const prefix = `Bulk Check ${runId}`;
const testNamePrefix = "Bulk Check ";

const createdIds = {
  products: [],
  categories: [],
  attributes: [],
};

const stripHtmlToPlain = (value = "", maxLength = 160) => {
  const plain = String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.substring(0, maxLength)}...`;
};

const seoFor = (name, description) => ({
  metaTitle: name,
  metaDescription:
    stripHtmlToPlain(description) || `Buy ${name} online at Genuine Grocery.`,
});

async function createCategory(name) {
  const category = await prisma.category.create({
    data: {
      name,
      slug: createSlug(name),
      description: "Seeded by bulk product check script",
    },
  });
  createdIds.categories.push(category.id);
  return category;
}

async function createAttribute(name, values) {
  const attribute = await prisma.attribute.create({
    data: {
      name,
      inputType: "select",
      values: {
        create: values.map((value) => ({ value })),
      },
    },
    include: { values: true },
  });
  createdIds.attributes.push(attribute.id);
  return attribute;
}

async function createSimpleProduct(categories) {
  const name = `${prefix} Simple Turmeric`;
  const description = "<p>Simple non-attribute seed product for bulk page check.</p>";
  const seo = seoFor(name, description);
  const primaryCategory = categories[0];

  const product = await prisma.product.create({
    data: {
      name,
      description,
      slug: createSlug(name),
      hasVariants: false,
      featured: false,
      productType: ["new"],
      isActive: true,
      primaryCategoryId: primaryCategory.id,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      keywords: "",
      ourProduct: true,
      categories: {
        create: categories.map((category) => ({
          categoryId: category.id,
          isPrimary: category.id === primaryCategory.id,
        })),
      },
      variants: {
        create: {
          sku: generateSKU({
            name,
            categoryName: primaryCategory.name,
            basePrice: 149,
          }),
          price: 199,
          salePrice: 149,
          quantity: 25,
          isActive: true,
        },
      },
    },
    include: {
      categories: { include: { category: true } },
      variants: { include: { attributes: true } },
    },
  });
  createdIds.products.push(product.id);
  return product;
}

async function createVariantProduct(categories, attributes) {
  const name = `${prefix} Variant Rice`;
  const description = "<p>Attribute seed product with weight and pack type variants.</p>";
  const seo = seoFor(name, description);
  const primaryCategory = categories[0];
  const weight500 = attributes.weight.values.find((value) => value.value === "500g");
  const weight1kg = attributes.weight.values.find((value) => value.value === "1kg");
  const pouch = attributes.pack.values.find((value) => value.value === "Pouch");
  const jar = attributes.pack.values.find((value) => value.value === "Jar");

  const variants = [
    { values: [weight500, pouch], price: 120, salePrice: 99, quantity: 40 },
    { values: [weight1kg, jar], price: 220, salePrice: 199, quantity: 30 },
  ];

  const product = await prisma.product.create({
    data: {
      name,
      description,
      slug: createSlug(name),
      hasVariants: true,
      featured: true,
      productType: ["featured"],
      isActive: true,
      primaryCategoryId: primaryCategory.id,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      keywords: "",
      ourProduct: false,
      categories: {
        create: categories.map((category) => ({
          categoryId: category.id,
          isPrimary: category.id === primaryCategory.id,
        })),
      },
      variants: {
        create: variants.map((variant, index) => ({
          sku: generateSKU(
            {
              name,
              categoryName: primaryCategory.name,
              basePrice: variant.price,
            },
            variant.values.map((value) => value.value).join("-"),
            index + 1
          ),
          price: variant.price,
          salePrice: variant.salePrice,
          quantity: variant.quantity,
          isActive: true,
          attributes: {
            create: variant.values.map((value) => ({
              attributeValueId: value.id,
            })),
          },
        })),
      },
    },
    include: {
      categories: { include: { category: true } },
      variants: {
        include: {
          attributes: {
            include: {
              attributeValue: {
                include: { attribute: true },
              },
            },
          },
        },
      },
    },
  });
  createdIds.products.push(product.id);
  return product;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verifySimpleProduct(product) {
  assert(product.categories.length === 2, "Simple product should have 2 categories");
  assert(
    product.categories.filter((category) => category.isPrimary).length === 1,
    "Simple product should have exactly 1 primary category"
  );
  assert(product.variants.length === 1, "Simple product should have 1 default variant");
  assert(
    product.variants[0].attributes.length === 0,
    "Simple product default variant should not have attributes"
  );
  assert(product.metaTitle === product.name, "Simple product SEO title mismatch");
  assert(
    product.metaDescription?.includes("Simple non-attribute seed product"),
    "Simple product SEO description mismatch"
  );
}

function verifyVariantProduct(product) {
  assert(product.hasVariants === true, "Variant product should have hasVariants=true");
  assert(product.categories.length === 2, "Variant product should have 2 categories");
  assert(
    product.categories.filter((category) => category.isPrimary).length === 1,
    "Variant product should have exactly 1 primary category"
  );
  assert(product.variants.length === 2, "Variant product should have 2 variants");
  for (const variant of product.variants) {
    assert(
      variant.attributes.length === 2,
      `Variant ${variant.sku} should have 2 attribute values`
    );
    const attributeNames = variant.attributes.map(
      (item) => item.attributeValue.attribute.name
    );
    assert(attributeNames.includes(`${prefix} Weight`), "Weight attribute missing");
    assert(attributeNames.includes(`${prefix} Pack`), "Pack attribute missing");
  }
  assert(product.metaTitle === product.name, "Variant product SEO title mismatch");
  assert(
    product.metaDescription?.includes("Attribute seed product"),
    "Variant product SEO description mismatch"
  );
}

async function cleanupBulkCheckData() {
  await prisma.product.deleteMany({
    where: {
      name: { startsWith: testNamePrefix },
    },
  });

  await prisma.attribute.deleteMany({
    where: {
      name: { startsWith: testNamePrefix },
    },
  });

  await prisma.category.deleteMany({
    where: {
      name: { startsWith: testNamePrefix },
    },
  });
}

async function cleanupCurrentRun() {
  await prisma.product.deleteMany({
    where: {
      id: { in: createdIds.products },
    },
  });

  await prisma.attribute.deleteMany({
    where: {
      id: { in: createdIds.attributes },
    },
  });

  await prisma.category.deleteMany({
    where: {
      id: { in: createdIds.categories },
    },
  });
}

async function main() {
  console.log(`Starting bulk product seed check: ${prefix}`);
  await cleanupBulkCheckData();

  const categories = await Promise.all([
    createCategory(`${prefix} Grocery`),
    createCategory(`${prefix} Staples`),
  ]);

  const [weight, pack] = await Promise.all([
    createAttribute(`${prefix} Weight`, ["500g", "1kg"]),
    createAttribute(`${prefix} Pack`, ["Pouch", "Jar"]),
  ]);

  const simpleProduct = await createSimpleProduct(categories);
  const variantProduct = await createVariantProduct(categories, { weight, pack });

  verifySimpleProduct(simpleProduct);
  verifyVariantProduct(variantProduct);

  console.log("Seed check passed.");
  console.log("Created categories:");
  categories.forEach((category) => console.log(`- ${category.name} (${category.id})`));
  console.log("Created attributes:");
  console.log(`- ${weight.name}: ${weight.values.map((value) => value.value).join(", ")}`);
  console.log(`- ${pack.name}: ${pack.values.map((value) => value.value).join(", ")}`);
  console.log("Created products:");
  console.log(`- ${simpleProduct.name} (${simpleProduct.id})`);
  console.log(`- ${variantProduct.name} (${variantProduct.id})`);

  if (process.env.KEEP_BULK_CHECK_SEED === "true") {
    console.log("KEEP_BULK_CHECK_SEED=true, leaving seed data in database.");
  } else {
    await cleanupCurrentRun();
    console.log("Cleaned up bulk check seed data.");
  }
}

main()
  .catch((error) => {
    console.error("Seed check failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
