import Link from "next/link";
import { fetchApi } from "@/lib/utils";

export const metadata = {
  title: "HTML Sitemap | Indian Pharmazee",
  description: "Browse all product categories, specialty medicines, subcategories and pages on Indian Pharmazee.",
};

export const revalidate = 3600;

export default async function HTMLSitemapPage() {
  let categories = [];
  let products = [];

  try {
    const catRes = await fetchApi("/public/categories-with-subcategories");
    categories = catRes?.data?.categories || catRes?.categories || [];
  } catch (e) {
    console.error("HTML sitemap category fetch error:", e);
  }

  try {
    const prodRes = await fetchApi("/public/products?limit=100");
    products = prodRes?.data?.products || prodRes?.products || prodRes?.data || [];
  } catch (e) {
    console.error("HTML sitemap product fetch error:", e);
  }

  const staticPages = [
    { title: "Home", href: "/" },
    { title: "All Products", href: "/products" },
    { title: "All Categories", href: "/categories" },
    { title: "About Us", href: "/about" },
    { title: "Contact Us", href: "/contact" },
    { title: "FAQs", href: "/faqs" },
    { title: "Why Choose Us", href: "/why-us" },
    { title: "Shipping & Delivery Policy", href: "/shipping-policy" },
    { title: "Return & Refund Policy", href: "/return-policy" },
    { title: "Privacy Policy", href: "/privacy-policy" },
    { title: "Terms & Conditions", href: "/terms" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-emerald-700 rounded-2xl p-8 md:p-10 text-white shadow-xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Website Sitemap
          </h1>
          <p className="text-teal-100 text-sm md:text-base max-w-3xl">
            Overview of all healthcare categories, specialty medicines, subcategories, and pages available on Indian Pharmazee.
          </p>
        </div>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Quick Pages */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
              Main Pages
            </h2>
            <ul className="space-y-2.5 text-sm">
              {staticPages.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="text-slate-600 hover:text-teal-700 hover:translate-x-1 transition-all inline-block font-medium"
                  >
                    → {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories & Subcategories */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
            <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              Categories &amp; Subcategories
            </h2>
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {categories.map((cat) => (
                  <div key={cat.id || cat.slug} className="space-y-2">
                    <Link
                      href={`/category/${cat.slug}`}
                      className="font-semibold text-teal-800 hover:text-teal-600 text-base block"
                    >
                      📁 {cat.name}
                    </Link>
                    {cat.subCategories && cat.subCategories.length > 0 && (
                      <ul className="pl-4 space-y-1.5 border-l-2 border-slate-100 text-xs">
                        {cat.subCategories.map((sub) => (
                          <li key={sub.id || sub.slug}>
                            <Link
                              href={`/subcategory/${sub.slug}`}
                              className="text-slate-500 hover:text-teal-700"
                            >
                              └─ {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Loading categories...</p>
            )}
          </div>
        </div>

        {/* Products Section */}
        {products.length > 0 && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                Products Catalog
              </h2>
              <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-3 py-1 rounded-full">
                {products.length} Products Listed
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
              {products.map((prod) => (
                <Link
                  key={prod.id || prod.slug}
                  href={`/products/${prod.slug}`}
                  className="p-2.5 bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 rounded-lg text-slate-700 hover:text-teal-800 transition-colors truncate block"
                  title={prod.name}
                >
                  💊 {prod.name}
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
