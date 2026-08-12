import { fetchApi } from "@/lib/utils";

export const revalidate = 3600; // Revalidate sitemap every hour
export const dynamic = "force-dynamic";

export default async function sitemap() {
  const baseUrl = "https://www.indianpharmazee.com";
  const currentDate = new Date().toISOString();

  // Static routes
  const staticRoutes = [
    { url: `${baseUrl}/`, lastModified: currentDate, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/products`, lastModified: currentDate, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/categories`, lastModified: currentDate, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/faqs`, lastModified: currentDate, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/why-us`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/shipping-policy`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/return-policy`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacy-policy`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/terms`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.6 },
  ];

  let categoryRoutes = [];
  let subcategoryRoutes = [];
  let productRoutes = [];

  // Fetch categories and subcategories
  try {
    const catRes = await fetchApi("/public/categories-with-subcategories");
    const categories = catRes?.data?.categories || catRes?.categories || [];

    if (Array.isArray(categories)) {
      categories.forEach((cat) => {
        if (cat.slug) {
          categoryRoutes.push({
            url: `${baseUrl}/category/${cat.slug}`,
            lastModified: cat.updatedAt ? new Date(cat.updatedAt).toISOString() : currentDate,
            changeFrequency: "daily",
            priority: 0.9,
          });
        }

        if (cat.subCategories && Array.isArray(cat.subCategories)) {
          cat.subCategories.forEach((sub) => {
            if (sub.slug) {
              subcategoryRoutes.push({
                url: `${baseUrl}/subcategory/${sub.slug}`,
                lastModified: sub.updatedAt ? new Date(sub.updatedAt).toISOString() : currentDate,
                changeFrequency: "daily",
                priority: 0.8,
              });
            }
          });
        }
      });
    }
  } catch (err) {
    console.error("Sitemap category fetch error:", err);
  }

  // Fetch all products
  try {
    const prodRes = await fetchApi("/public/products?limit=10000");
    const products = prodRes?.data?.products || prodRes?.products || prodRes?.data || [];

    if (Array.isArray(products)) {
      products.forEach((prod) => {
        if (prod.slug) {
          productRoutes.push({
            url: `${baseUrl}/products/${prod.slug}`,
            lastModified: prod.updatedAt ? new Date(prod.updatedAt).toISOString() : currentDate,
            changeFrequency: "daily",
            priority: 0.9,
          });
        }
      });
    }
  } catch (err) {
    console.error("Sitemap product fetch error:", err);
  }

  return [...staticRoutes, ...categoryRoutes, ...subcategoryRoutes, ...productRoutes];
}
