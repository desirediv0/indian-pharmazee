"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, sortCategories } from "@/lib/utils";
import { AlertCircle, ArrowRight, Stethoscope, BadgeCheck, Thermometer, Truck } from "lucide-react";
import { getPharmaIcon } from "@/lib/pharma-icons";

const getImageUrl = (image) => {
  if (!image) return "/placeholder.jpg";
  if (image.startsWith("http")) return image;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

const CategoryCard = ({ category, index }) => {
  const { Icon, color } = getPharmaIcon(category.name, category.slug);
  const productCount = category._count?.products || 0;

  return (
    <Link href={`/category/${category.slug}`} className="group block">
      <div
        className="relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full flex flex-col"
        style={{ borderColor: "#DCE7F2" }}
      >
        {/* Image area */}
        <div className="relative h-40 w-full overflow-hidden flex-shrink-0" style={{ background: `${color}08` }}>
          {category.image ? (
            <Image
              src={getImageUrl(category.image)}
              alt={category.name}
              fill
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center transition-colors duration-300"
              style={{ background: `${color}08` }}
            >
              <Icon size={52} style={{ color }} className="group-hover:scale-110 transition-transform duration-300 opacity-80" />
            </div>
          )}
          {/* Product count badge */}
          {productCount > 0 && (
            <div
              className="absolute top-3 right-3 text-white px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: color }}
            >
              {productCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 border-t flex flex-col flex-1" style={{ borderColor: "#DCE7F2" }}>
          <h3 className="text-sm font-bold mb-1 transition-colors group-hover:text-primary line-clamp-1" style={{ color: "#0A2540" }}>
            {category.name}
          </h3>
          <p className="text-gray-500 text-xs mb-3 line-clamp-2 flex-1">
            {category.description || "Genuine specialty medicines and healthcare products"}
          </p>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs text-gray-400">{productCount} products</span>
            <span className="flex items-center text-xs font-semibold gap-1 group-hover:gap-2 transition-all" style={{ color }}>
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const CategoryCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden animate-pulse border" style={{ borderColor: "#DCE7F2" }}>
    <div className="h-40 w-full" style={{ background: "#EBF4FF" }} />
    <div className="p-4 border-t" style={{ borderColor: "#DCE7F2" }}>
      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-full mb-1" />
      <div className="h-3 bg-gray-100 rounded w-5/6 mb-3" />
      <div className="flex justify-between">
        <div className="h-3 bg-gray-100 rounded w-1/4" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  </div>
);

const STATS = [
  { icon: Stethoscope, label: "Categories", dynamic: true, key: "categories", color: "#005EB8" },
  { icon: BadgeCheck, label: "Genuine Products", value: "100%", color: "#16C7D9" },
  { icon: Thermometer, label: "Temp-Controlled Support", value: "2°C–8°C", color: "#005EB8" },
  { icon: Truck, label: "Pan-India Delivery", value: "Express", color: "#16C7D9" },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApi("/public/categories")
      .then((res) => setCategories(sortCategories(res.data?.categories || [])))
      .catch((err) => setError(err.message || "Failed to load categories"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#F7FAFC" }}>

      {/* Hero */}
      <section
        className="relative py-12 md:py-16 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A2540 0%, #005EB8 60%, #0074e4 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #16C7D9, transparent 70%)" }} />
          <div className="absolute bottom-0 left-10 w-60 h-60 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #16C7D9, transparent 70%)" }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 border"
            style={{ background: "rgba(22,199,217,0.15)", borderColor: "rgba(22,199,217,0.3)", color: "#16C7D9" }}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            Specialty Pharmaceutical Categories
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Browse Medicine Categories
          </h1>
          <p className="text-white/65 max-w-xl mx-auto text-sm">
            Genuine specialty medicines across IVF, oncology, transplant, sexual wellness, paediatric care, and more.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-white/40 mt-4">
            <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/60">Categories</span>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b" style={{ background: "white", borderColor: "#DCE7F2" }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(({ icon: Icon, label, value, dynamic, key, color }) => (
              <div key={label}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: `${color}12` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="text-2xl font-black mb-0.5" style={{ color: "#0A2540" }}>
                  {dynamic ? categories.length || "—" : value}
                </div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 w-5 h-5 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 mb-1">Error Loading Categories</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10 pb-16">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => <CategoryCardSkeleton key={i} />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,94,184,0.08)" }}>
              <Stethoscope className="w-8 h-8" style={{ color: "#005EB8" }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#0A2540" }}>No Categories Found</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">Categories will appear here once added from admin panel.</p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 rounded-xl text-white font-semibold transition-colors hover:opacity-90"
              style={{ background: "#005EB8" }}
            >
              Browse All Medicines
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {categories.map((cat, i) => <CategoryCard key={cat.id} category={cat} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
