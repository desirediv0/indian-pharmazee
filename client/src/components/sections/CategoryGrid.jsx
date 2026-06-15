"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, sortCategories } from "@/lib/utils";
import Headtext from "../layout/Headtext";
import {
  FaBoxOpen,
  FaCapsules,
  FaSeedling,
} from "react-icons/fa";
import {
  GiCheeseWedge,
  GiMasonJar,
  GiButter,
  GiCow,
  GiGrain,
  GiSpoon,
  GiCupcake,
} from "react-icons/gi";
import { LuMilk } from "react-icons/lu";
import {
  MdOutlineIcecream,
  MdOutlineShoppingBasket,
  MdOutlineLocalDrink,
} from "react-icons/md";
import { BsTagFill } from "react-icons/bs";
import { TbMilk } from "react-icons/tb";

/* ─── fallback solid bg per category (when no image) ─────────────────── */
const getCategoryBg = (category) => {
  const n = category.name?.toLowerCase() || "";
  const s = category.slug?.toLowerCase() || "";

  if (n.includes("offer") || s.includes("offer"))   return "bg-gradient-to-br from-orange-400 to-red-500";
  if (n.includes("milk") || s.includes("milk"))     return "bg-gradient-to-br from-sky-400 to-indigo-500";
  if (n.includes("beverages") || s.includes("beverages")) return "bg-gradient-to-br from-cyan-400 to-emerald-500";
  if (n.includes("sweets") || s.includes("sweets")) return "bg-gradient-to-br from-pink-400 to-purple-500";
  if (n.includes("ghee") || s.includes("ghee"))     return "bg-gradient-to-br from-amber-300 to-orange-400";
  if (n.includes("paneer") || s.includes("paneer") || n.includes("cheese")) return "bg-gradient-to-br from-lime-300 to-green-400";
  if (n.includes("butter") || s.includes("butter")) return "bg-gradient-to-br from-yellow-300 to-amber-400";
  if (n.includes("curd") || s.includes("curd") || n.includes("yogurt")) return "bg-gradient-to-br from-violet-400 to-indigo-500";
  if (n.includes("ice cream") || s.includes("ice-cream")) return "bg-gradient-to-br from-rose-300 to-fuchsia-400";
  if (n.includes("turmeric") || s.includes("haldi")) return "bg-gradient-to-br from-yellow-400 to-orange-500";
  if (n.includes("calf") || n.includes("cow feed") || n.includes("supplement")) return "bg-gradient-to-br from-green-400 to-teal-500";
  if (n.includes("cow") || s.includes("cow") || n.includes("dairy")) return "bg-gradient-to-br from-blue-400 to-violet-500";

  return "bg-gradient-to-br from-slate-500 to-indigo-600";
};

/* ─── fallback icon ───────────────────────────────────────────────────── */
const getCategoryIcon = (category) => {
  const n = category.name?.toLowerCase() || "";
  const s = category.slug?.toLowerCase() || "";
  const size = 64;
  const cls = "text-white/80";

  if (n.includes("milk powder")) return <FaBoxOpen size={size} className={cls} />;
  if (n.includes("milk") || s.includes("milk")) return <LuMilk size={size} className={cls} />;
  if (n.includes("beverages") || s.includes("beverages")) return <MdOutlineLocalDrink size={size} className={cls} />;
  if (n.includes("sweets") || s.includes("sweets")) return <GiCupcake size={size} className={cls} />;
  if (n.includes("ghee") || s.includes("ghee")) return <GiMasonJar size={size} className={cls} />;
  if (n.includes("paneer") || s.includes("paneer") || n.includes("cheese")) return <GiCheeseWedge size={size} className={cls} />;
  if (n.includes("butter") || s.includes("butter")) return <GiButter size={size} className={cls} />;
  if (n.includes("curd") || s.includes("curd") || n.includes("yogurt")) return <TbMilk size={size} className={cls} />;
  if (n.includes("ice cream") || s.includes("ice-cream")) return <MdOutlineIcecream size={size} className={cls} />;
  if (n.includes("turmeric") || s.includes("haldi")) return <GiSpoon size={size} className={cls} />;
  if (n.includes("calf feed")) return <FaSeedling size={size} className={cls} />;
  if (n.includes("cow feed")) return <GiGrain size={size} className={cls} />;
  if (n.includes("supplement")) return <FaCapsules size={size} className={cls} />;
  if (n.includes("cow") || s.includes("cow") || n.includes("dairy")) return <GiCow size={size} className={cls} />;
  if (n.includes("offer") || s.includes("offer")) return <BsTagFill size={size} className={cls} />;

  return <MdOutlineShoppingBasket size={size} className={cls} />;
};

/* ─── card: full-bleed image + text overlay bottom-left ──────────────── */
const CategoryCard = ({ category }) => {
  const bgCls = getCategoryBg(category);

  return (
    <div
      className={`
        relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer
        group shadow-md hover:shadow-2xl
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:scale-[1.02]
        ${bgCls}
      `}
    >
      {/* full-bleed image */}
      {category.image && (
        <Image
          src={category.image}
          alt={category.name || "Category"}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      )}

      {/* no image fallback — icon centered */}
      {!category.image && (
        <div className="absolute inset-0 flex items-center justify-center">
          {getCategoryIcon(category)}
        </div>
      )}

      {/* gradient scrim — bottom to transparent */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* text bottom-left */}
      <div className="absolute bottom-0 left-0 p-3 sm:p-4">
        <h3 className="text-white font-bold text-sm sm:text-base md:text-lg leading-tight drop-shadow-sm">
          {category.name}
        </h3>
        {category.count > 0 && (
          <p className="text-white/75 text-xs sm:text-sm font-medium mt-0.5">
            {category.count} Items
          </p>
        )}
      </div>
    </div>
  );
};

/* ─── skeleton ────────────────────────────────────────────────────────── */
const SkeletonLoader = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse"
      />
    ))}
  </div>
);

/* ─── main ────────────────────────────────────────────────────────────── */
const CategoryGrid = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchApi("/public/categories");
        if (response.success && response.data?.categories) {
          setCategories(sortCategories(response.data.categories));
        } else {
          setError(response.message || "Failed to fetch categories");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch categories"
        );
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  const sectionCls = `relative py-8 md:py-12 my-3 md:my-4 bg-[#f4f6f9] overflow-hidden`;

  const Header = () => (
    <div className="text-center mb-8 sm:mb-10">
      <Headtext text="SHOP BY CATEGORY" />
      <p className="mt-5 text-slate-500 text-sm sm:text-[15px] font-medium tracking-wide">
        Genuine specialty medicines and healthcare products, delivered safely
      </p>
    </div>
  );

  if (loading) {
    return (
      <section className={sectionCls}>
        <div className="container max-w-7xl mx-auto px-4">
          <Header />
          <SkeletonLoader />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={sectionCls}>
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center py-14">
            <p className="text-red-500 font-medium mb-4">Error: {error}</p>
            <button
              onClick={handleRetry}
              className="px-5 py-2.5 bg-[#175C98] text-white text-sm font-semibold rounded-xl hover:bg-[#134d82] transition-colors shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <section className={sectionCls}>
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center py-14">
            <p className="text-slate-400 font-medium">
              No categories available at the moment
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={sectionCls}>
      <div className="container max-w-7xl mx-auto px-4">
        <Header />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {categories.map((category) => (
            <Link
              href={`/category/${category.slug}`}
              key={category.id}
              className="block"
            >
              <CategoryCard category={category} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
