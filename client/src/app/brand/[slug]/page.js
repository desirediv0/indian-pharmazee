"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { fetchApi } from "@/lib/utils";
import {
    AlertCircle,
    ChevronLeft, ChevronRight, SlidersHorizontal,
    Zap
} from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import CategoriesCarousel from "@/components/sections/CategoriesCarousel";
import { ClientOnly } from "@/components/client-only";

/* ─────────────────────────────────────────────
   SKELETON
   Matching the premium ProductCard layout
───────────────────────────────────────────── */
function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-100" />
            <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                <div className="flex justify-between items-center pt-1">
                    <div className="h-4 bg-gray-100 rounded-full w-16" />
                    <div className="h-7 bg-gray-100 rounded-lg w-14" />
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   BRAND PAGE CONTENT
───────────────────────────────────────────── */
function BrandPageContent({ slug }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const sortParam = searchParams.get("sort") || "createdAt";
    const orderParam = searchParams.get("order") || "desc";
    const pageParam = parseInt(searchParams.get("page")) || 1;

    const [brand, setBrand] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [pagination, setPagination] = useState({
        page: pageParam,
        limit: 15,
        total: 0,
        pages: 0,
    });

    const [filters, setFilters] = useState({
        sort: sortParam,
        order: orderParam,
    });

    /* ── Sync URL → Filters ── */
    useEffect(() => {
        setFilters({ sort: sortParam, order: orderParam });
    }, [sortParam, orderParam]);

    /* ── URL Builder ── */
    const updateURL = (f, p = 1) => {
        const params = new URLSearchParams();
        if (f.sort !== "createdAt" || f.order !== "desc") {
            params.set("sort", f.sort);
            params.set("order", f.order);
        }
        if (p > 1) params.set("page", p);

        const newURL = params.toString()
            ? `?${params.toString()}`
            : window.location.pathname;
        router.push(newURL, { scroll: false });
    };

    /* ── Fetch Brand Data ── */
    useEffect(() => {
        const fetchBrandData = async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams();
                queryParams.append("page", pagination.page);
                queryParams.append("limit", pagination.limit);

                const validSortFields = ["createdAt", "updatedAt", "name", "featured"];
                let sortField = filters.sort;
                if (!validSortFields.includes(sortField)) sortField = "createdAt";

                queryParams.append("sort", sortField);
                queryParams.append("order", filters.order);

                const res = await fetchApi(`/public/brand/${slug}?${queryParams.toString()}`);

                if (res.success) {
                    setBrand(res.data.brand);
                    setProducts(res.data.brand.products || []);
                    setPagination(res.data.pagination || { page: 1, limit: 15, total: 0, pages: 0 });
                } else {
                    throw new Error(res.message || "Failed to load brand");
                }
            } catch (err) {
                setError(err.message);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBrandData();
    }, [slug, filters, pagination.page, pagination.limit]);

    /* ── Handlers ── */
    const handleSortChange = (e) => {
        const map = {
            newest: ["createdAt", "desc"],
            oldest: ["createdAt", "asc"],
            "price-low": ["createdAt", "asc"],
            "price-high": ["createdAt", "desc"],
            "name-asc": ["name", "asc"],
            "name-desc": ["name", "desc"],
        };
        const [sort, order] = map[e.target.value] || ["createdAt", "desc"];
        const nf = { sort, order };
        setFilters(nf);
        updateURL(nf, 1);
        setPagination(p => ({ ...p, page: 1 }));
    };

    const handlePageChange = (p) => {
        if (p < 1 || p > pagination.pages) return;
        setPagination(prev => ({ ...prev, page: p }));
        updateURL(filters, p);

        // Smooth scroll to top of grid
        document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const currentSort = () => {
        if (filters.sort === "name" && filters.order === "asc") return "name-asc";
        if (filters.sort === "name" && filters.order === "desc") return "name-desc";
        if (filters.sort === "createdAt" && filters.order === "asc") return "oldest";
        return "newest";
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
                <p className="text-gray-500 mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div id="products-grid">
            {/* Categories Carousel */}
            <div className="hidden lg:block mb-8">
                <CategoriesCarousel />
            </div>

            {/* Brand Hero Banner */}
            <div className="relative w-full h-[180px] sm:h-[240px] rounded-3xl overflow-hidden mb-8 bg-gray-900 shadow-xl border border-white/10">
                <Image
                    src={brand?.image ? `https://desirediv-storage.blr1.digitaloceanspaces.com/${brand.image}` : "/banner-background.jpg"}
                    alt={brand?.name || "Brand"}
                    fill
                    className="object-cover opacity-60 transition-transform duration-700 hover:scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-transparent flex items-center">
                    <div className="px-8 md:px-12 max-w-2xl">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/30 border border-primary/40 text-primary text-[11px] font-bold uppercase tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-2">
                            Brand Showcase
                        </span>
                        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-2 drop-shadow-md">
                            {brand?.name || "Our Brand"}
                        </h1>
                        <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-md line-clamp-2">
                            {brand?.description || "Experience the pure essence of farm-fresh nutrition from our premium brand collections."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between gap-4 mb-6 sticky top-24 z-30 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-500">
                        {loading ? (
                            <span className="inline-block h-4 w-20 bg-gray-100 rounded animate-pulse" />
                        ) : (
                            <><span className="font-bold text-gray-900">{pagination.total}</span> items found</>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <span className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-r border-gray-200">
                        Sort
                    </span>
                    <select
                        value={currentSort()}
                        onChange={handleSortChange}
                        disabled={loading}
                        className="px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none bg-white cursor-pointer"
                    >
                        <option value="newest">Latest First</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="name-asc">Name: A–Z</option>
                        <option value="name-desc">Name: Z–A</option>
                        <option value="oldest">Date: Old to New</option>
                    </select>
                </div>
            </div>

            {/* Products Grid */}
            {loading && products.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="h-8 w-8 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h2>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        We couldn&apos;t find any products in this brand. Please check back later or explore other brands.
                    </p>
                </div>
            ) : (
                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 transition-all duration-300 ${loading ? "opacity-50" : "opacity-100"}`}>
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-12 mb-8">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1 || loading}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-gray-300 disabled:opacity-40 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    {[...Array(pagination.pages)].map((_, i) => {
                        const p = i + 1;
                        if (p === 1 || p === pagination.pages || (p >= pagination.page - 1 && p <= pagination.page + 1)) {
                            return (
                                <button
                                    key={p}
                                    onClick={() => handlePageChange(p)}
                                    disabled={loading}
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${pagination.page === p
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                        : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                        }`}
                                >
                                    {p}
                                </button>
                            );
                        }
                        if ((p === 2 && pagination.page > 3) || (p === pagination.pages - 1 && pagination.page < pagination.pages - 2)) {
                            return <span key={p} className="w-8 text-center text-gray-400 font-bold">···</span>;
                        }
                        return null;
                    }).filter(Boolean)}

                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages || loading}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-gray-300 disabled:opacity-40 transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   EXPORTS
───────────────────────────────────────────── */
export default function BrandPage({ params }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="max-w-7xl mx-auto px-4 py-8 pb-16">
                <ClientOnly fallback={<div className="h-64 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                        <BrandPageContent slug={params.slug} />
                    </Suspense>
                </ClientOnly>
            </div>
        </div>
    );
}
