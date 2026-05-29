import { prisma } from "../config/db.js";
import { createSlug } from "../helper/Slug.js";
import { generateSKU } from "../utils/generateSKU.js";

const productNames = [
  "Bulk Demo Organic Turmeric Powder",
  "Bulk Demo Cold Pressed Mustard Oil",
  "Bulk Demo Premium Basmati Rice",
  "Bulk Demo Almond Butter",
];

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

async function getSeedCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    take: 2,
  });

  if (categories.length >= 2) return categories;

  const requiredNames = ["Grocery Essentials", "Pantry Staples"];
  for (const name of requiredNames) {
    const existing = await prisma.category.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (!existing) {
      await prisma.category.create({
        data: {
          name,
          slug: createSlug(name),
          description: "Seed category for bulk demo products",
        },
      });
    }
  }

  return prisma.category.findMany({
    where: { name: { in: requiredNames } },
    orderBy: { name: "asc" },
  });
}

async function getOrCreateAttribute(name, values) {
  let attribute = await prisma.attribute.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    include: { values: true },
  });

  if (!attribute) {
    attribute = await prisma.attribute.create({
      data: {
        name,
        inputType: "select",
        values: { create: values.map((value) => ({ value })) },
      },
      include: { values: true },
    });
    return attribute;
  }

  for (const value of values) {
    const exists = attribute.values.some(
      (item) => item.value.toLowerCase() === value.toLowerCase()
    );
    if (!exists) {
      await prisma.attributeValue.create({
        data: {
          attributeId: attribute.id,
          value,
        },
      });
    }
  }

  return prisma.attribute.findUnique({
    where: { id: attribute.id },
    include: { values: true },
  });
}

async function cleanupOldDemoProducts() {
  await prisma.product.deleteMany({
    where: {
      name: { in: productNames },
    },
  });
}

async function createSimpleProduct({
  name,
  description,
  categories,
  price,
  salePrice,
  quantity,
  productType = ["new"],
}) {
  const primaryCategory = categories[0];
  const seo = seoFor(name, description);

  return prisma.product.create({
    data: {
      name,
      description,
      slug: createSlug(name),
      hasVariants: false,
      featured: productType.includes("featured"),
      productType,
      isActive: true,
      primaryCategoryId: primaryCategory.id,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      keywords: "",
      tags: [],
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
            basePrice: price,
          }),
          price,
          salePrice,
          quantity,
          isActive: true,
        },
      },
    },
    include: {
      categories: { include: { category: true } },
      variants: {
        include: {
          attributes: {
            include: {
              attributeValue: { include: { attribute: true } },
            },
          },
        },
      },
    },
  });
}

async function createVariantProduct({
  name,
  description,
  categories,
  variants,
  productType = ["featured"],
}) {
  const primaryCategory = categories[0];
  const seo = seoFor(name, description);

  return prisma.product.create({
    data: {
      name,
      description,
      slug: createSlug(name),
      hasVariants: true,
      featured: productType.includes("featured"),
      productType,
      isActive: true,
      primaryCategoryId: primaryCategory.id,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      keywords: "",
      tags: [],
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
            variant.attributeValues.map((value) => value.value).join("-"),
            index + 1
          ),
          price: variant.price,
          salePrice: variant.salePrice,
          quantity: variant.quantity,
          isActive: true,
          attributes: {
            create: variant.attributeValues.map((value) => ({
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
              attributeValue: { include: { attribute: true } },
            },
          },
        },
      },
    },
  });
}

function valueByName(attribute, value) {
  const match = attribute.values.find(
    (item) => item.value.toLowerCase() === value.toLowerCase()
  );
  if (!match) throw new Error(`${attribute.name} value missing: ${value}`);
  return match;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function verifyProduct(product, { hasVariants, variantCount, attributesPerVariant }) {
  assert(product.hasVariants === hasVariants, `${product.name}: hasVariants mismatch`);
  assert(product.categories.length >= 1, `${product.name}: category missing`);
  assert(
    product.categories.filter((category) => category.isPrimary).length === 1,
    `${product.name}: primary category missing`
  );
  assert(product.variants.length === variantCount, `${product.name}: variant count mismatch`);
  assert(product.metaTitle === product.name, `${product.name}: SEO title mismatch`);
  assert(
    product.metaDescription && !product.metaDescription.includes("<"),
    `${product.name}: SEO description should be plain text`
  );

  for (const variant of product.variants) {
    assert(
      variant.attributes.length === attributesPerVariant,
      `${product.name} / ${variant.sku}: attribute count mismatch`
    );
  }
}

async function main() {
  console.log("Preparing 4 clean bulk demo products...");
  await cleanupOldDemoProducts();

  const categories = await getSeedCategories();
  if (categories.length < 1) {
    throw new Error("At least one category is required for bulk demo seed");
  }

  const weight = await getOrCreateAttribute("Weight", ["250g", "500g", "1kg"]);
  const packType = await getOrCreateAttribute("Pack Type", ["Pouch", "Glass Jar"]);

  const seedCategories = categories.slice(0, Math.min(categories.length, 2));

  const products = [];
  products.push(
    await createSimpleProduct({
      name: productNames[0],
      description:
        "<p>Pure organic turmeric powder for daily cooking and grocery use.</p>",
      categories: seedCategories,
      price: 199,
      salePrice: 149,
      quantity: 100,
      productType: ["new"],
    })
  );

  products.push(
    await createSimpleProduct({
      name: productNames[1],
      description:
        "<p>Cold pressed mustard oil with rich aroma for traditional recipes.</p>",
      categories: seedCategories,
      price: 349,
      salePrice: 299,
      quantity: 60,
      productType: ["bestseller"],
    })
  );

  products.push(
    await createVariantProduct({
      name: productNames[2],
      description:
        "<p>Premium long grain basmati rice available in multiple pack sizes.</p>",
      categories: seedCategories,
      variants: [
        {
          attributeValues: [
            valueByName(weight, "500g"),
            valueByName(packType, "Pouch"),
          ],
          price: 120,
          salePrice: 99,
          quantity: 50,
        },
        {
          attributeValues: [
            valueByName(weight, "1kg"),
            valueByName(packType, "Pouch"),
          ],
          price: 220,
          salePrice: 199,
          quantity: 35,
        },
      ],
      productType: ["featured"],
    })
  );

  products.push(
    await createVariantProduct({
      name: productNames[3],
      description:
        "<p>Creamy almond butter in convenient pack options for breakfast and snacks.</p>",
      categories: seedCategories,
      variants: [
        {
          attributeValues: [
            valueByName(weight, "250g"),
            valueByName(packType, "Glass Jar"),
          ],
          price: 299,
          salePrice: 249,
          quantity: 45,
        },
        {
          attributeValues: [
            valueByName(weight, "500g"),
            valueByName(packType, "Glass Jar"),
          ],
          price: 549,
          salePrice: 499,
          quantity: 25,
        },
      ],
      productType: ["trending"],
    })
  );

  verifyProduct(products[0], {
    hasVariants: false,
    variantCount: 1,
    attributesPerVariant: 0,
  });
  verifyProduct(products[1], {
    hasVariants: false,
    variantCount: 1,
    attributesPerVariant: 0,
  });
  verifyProduct(products[2], {
    hasVariants: true,
    variantCount: 2,
    attributesPerVariant: 2,
  });
  verifyProduct(products[3], {
    hasVariants: true,
    variantCount: 2,
    attributesPerVariant: 2,
  });

  console.log("Bulk demo seed passed.");
  console.log("Categories used:");
  seedCategories.forEach((category) => console.log(`- ${category.name}`));
  console.log("Attributes used:");
  console.log(`- ${weight.name}: ${weight.values.map((value) => value.value).join(", ")}`);
  console.log(`- ${packType.name}: ${packType.values.map((value) => value.value).join(", ")}`);
  console.log("Products created:");
  products.forEach((product) => {
    console.log(
      `- ${product.name}: ${product.hasVariants ? "attribute product" : "non-attribute product"} (${product.variants.length} variant${product.variants.length === 1 ? "" : "s"})`
    );
  });
}

main()
  .catch((error) => {
    console.error("Bulk demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
