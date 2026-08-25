"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchApi, sortCategories } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    SlidersHorizontal, X, ChevronDown, ChevronUp,
    ChevronRight, AlertCircle, Search, ChevronLeft,
    Zap, Grid, List
} from "lucide-react";
import { ClientOnly } from "@/components/client-only";
import { toast } from "sonner";
import { ProductCard } from "@/components/products/ProductCard";
import CategoriesCarousel from "@/components/sections/CategoriesCarousel";

/* ─────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────── */
function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse shadow-sm">
            <div className="aspect-square bg-gray-50 relative">
                <div className="absolute top-2 right-2 w-10 h-4 bg-gray-100 rounded-full" />
            </div>
            <div className="p-3.5 space-y-3">
                <div className="space-y-1.5">
                    <div className="h-4 bg-gray-100 rounded-full w-full" />
                    <div className="h-3 bg-gray-50 rounded-full w-2/3" />
                </div>
                <div className="flex justify-between items-center pt-2">
                    <div className="space-y-1">
                        <div className="h-4 bg-gray-100 rounded-full w-14" />
                        <div className="h-3 bg-gray-50 rounded-full w-10" />
                    </div>
                    <div className="h-8 bg-gray-100 rounded-xl w-16" />
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   FILTER SECTION (accordion item)
───────────────────────────────────────────── */
function FilterSection({ title, isOpen, onToggle, children }) {
    return (
        <div className="border-b border-gray-100 last:border-b-0">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{title}</span>
                {isOpen
                    ? <ChevronUp className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    : <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                }
            </button>
            <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-80 pb-3" : "max-h-0"}`}>
                <div className="px-4">{children}</div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   ACTIVE FILTER CHIP
───────────────────────────────────────────── */
function FilterChip({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-primary/8 text-primary border border-primary/20 rounded-full text-[11px] font-medium">
            {label}
            <button onClick={onRemove} className="w-3.5 h-3.5 rounded-full hover:bg-primary/20 flex items-center justify-center transition-colors">
                <X className="h-2.5 w-2.5" />
            </button>
        </span>
    );
}

/* ─────────────────────────────────────────────
   MAIN CONTENT
───────────────────────────────────────────── */
function ProductsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const decodePlus = (s) => (s ? s.replace(/\+/g, " ") : "");
    const searchQuery = decodePlus(searchParams.get("search") || "");
    const categorySlug = searchParams.get("category") || "";
    const subCategorySlug = searchParams.get("subCategory") || "";
    const productType = searchParams.get("productType") || "";
    const colorId = searchParams.get("color") || "";
    const sizeId = searchParams.get("size") || "";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const sortParam = searchParams.get("sort") || "createdAt";
    const orderParam = searchParams.get("order") || "desc";
    const pageParam = parseInt(searchParams.get("page")) || 1;

    /* ── State ── */
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [allAttributes, setAllAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [viewMode, setViewMode] = useState("grid");
    const [selectedColors, setSelectedColors] = useState(colorId ? [colorId] : []);
    const [selectedSizes, setSelectedSizes] = useState(sizeId ? [sizeId] : []);
    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [openSections, setOpenSections] = useState({ search: true, categories: true });
    const [searchInput, setSearchInput] = useState(searchQuery);
    const [pagination, setPagination] = useState({ page: pageParam, limit: 20, total: 0, pages: 0 });

    const [filters, setFilters] = useState({
        search: searchQuery, category: categorySlug, subCategory: subCategorySlug, productType,
        color: colorId, size: sizeId, minPrice, maxPrice,
        sort: sortParam, order: orderParam,
    });

    /* ── Sync searchInput with filters.search ── */
    useEffect(() => { setSearchInput(filters.search || ""); }, [filters.search]);

    /* ── Sync URL → filters ── */
    useEffect(() => {
        const fromURL = {
            search: searchQuery, category: categorySlug, subCategory: subCategorySlug, productType,
            color: colorId, size: sizeId, minPrice, maxPrice,
            sort: sortParam, order: orderParam, page: pageParam
        };
        const same = Object.keys(fromURL).every((k) => String(filters[k] || (k === 'page' ? pagination.page : "")) === String(fromURL[k] || ""));
        if (!same) {
            setFilters(fromURL);
            setSelectedColors(colorId ? [colorId] : []);
            setSelectedSizes(sizeId ? [sizeId] : []);
            if (pageParam !== pagination.page) {
                setPagination((p) => ({ ...p, page: pageParam }));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, categorySlug, subCategorySlug, productType, colorId, sizeId, minPrice, maxPrice, sortParam, orderParam]);

    /* ── URL builder ── */
    const updateURL = (f) => {
        const pairs = [];
        const add = (k, v) => {
            if (v !== undefined && v !== null && v !== "")
                pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v)).replace(/%20/g, "+")}`);
        };
        add("search", f.search); add("category", f.category); add("subCategory", f.subCategory); add("productType", f.productType);
        add("color", f.color); add("size", f.size);
        add("minPrice", f.minPrice); add("maxPrice", f.maxPrice);
        if (f.sort !== "createdAt" || f.order !== "desc") { add("sort", f.sort); add("order", f.order); }
        if (f.page > 1) add("page", f.page);
        router.push(pairs.length ? `?${pairs.join("&")}` : window.location.pathname, { scroll: false });
    };

    /* ── Fetch products ── */
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                let response;
                if (filters.productType) {
                    const q = new URLSearchParams({ limit: String(pagination.limit * pagination.page) });
                    response = await fetchApi(`/public/products/type/${filters.productType}?${q}`);
                    const all = response.data?.products || [];
                    const s = (pagination.page - 1) * pagination.limit;
                    setProducts(all.slice(s, s + pagination.limit));
                    setPagination((p) => ({ ...p, total: all.length, pages: Math.ceil(all.length / p.limit) }));
                } else {
                    const q = new URLSearchParams({
                        page: String(pagination.page), limit: String(pagination.limit),
                        sort: ["createdAt", "updatedAt", "name", "featured"].includes(filters.sort) ? filters.sort : "createdAt",
                        order: filters.order,
                    });
                    if (filters.search) q.append("search", filters.search);
                    if (filters.category) q.append("category", filters.category);
                    if (filters.subCategory) q.append("subCategory", filters.subCategory);
                    if (filters.minPrice) q.append("minPrice", filters.minPrice);
                    if (filters.maxPrice) q.append("maxPrice", filters.maxPrice);

                    const attrIds = new Set();
                    if (selectedColors.length > 0) { q.append("color", selectedColors[0]); selectedColors.forEach((id) => attrIds.add(id)); }
                    if (selectedSizes.length > 0) { q.append("size", selectedSizes[0]); selectedSizes.forEach((id) => attrIds.add(id)); }
                    Object.keys(selectedAttributes).forEach((k) => {
                        if (k !== "color" && k !== "size") (selectedAttributes[k] || []).forEach((id) => attrIds.add(id));
                    });
                    if (attrIds.size > 0) q.append("attributeValueIds", [...attrIds].join(","));

                    response = await fetchApi(`/public/products?${q}`);
                    setProducts(response.data.products || []);
                    setPagination(response.data.pagination || {});
                }
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }, 60);
            }
        };
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, pagination.page, pagination.limit, selectedColors, selectedSizes, selectedAttributes]);

    /* ── Fetch filter options ── */
    useEffect(() => {
        Promise.all([
            fetchApi("/public/categories"),
            fetchApi("/public/filter-attributes"),
        ]).then(([catRes, attrRes]) => {
            setCategories(sortCategories(catRes.data.categories || []));
            setColors(attrRes.data.colors || []);
            setSizes(attrRes.data.sizes || []);
            if (Array.isArray(attrRes.data.attributes)) {
                setAllAttributes(attrRes.data.attributes);
            } else {
                const attrs = [];
                if (attrRes.data.colors?.length) attrs.push({ id: "color-attr", name: "Color", values: attrRes.data.colors });
                if (attrRes.data.sizes?.length) attrs.push({ id: "size-attr", name: "Size", values: attrRes.data.sizes });
                setAllAttributes(attrs);
            }
        }).catch(console.error);
    }, []);

    useEffect(() => { if (error) toast.error("Error loading products. Please try again."); }, [error]);

    /* ── Scroll top on page change ── */
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [pagination.page, products]);

    /* ── Handlers ── */
    const handleFilterChange = (name, value) => {
        if ((name === "minPrice" || name === "maxPrice") && value !== "") {
            const n = parseFloat(value);
            if (isNaN(n)) return;
            value = n.toString();
        }
        const nf = { ...filters, [name]: value };
        setFilters(nf);
        updateURL(nf);
        if (pagination.page !== 1) setPagination((p) => ({ ...p, page: 1 }));
        if (drawerOpen && window.innerWidth < 768 && !["minPrice", "maxPrice", "search"].includes(name))
            setDrawerOpen(false);
    };

    const handleAttrChange = (attrName, valueId) => {
        const k = attrName.toLowerCase();
        const cur = selectedAttributes[k] || [];
        const updated = cur.includes(valueId) ? cur.filter((id) => id !== valueId) : [valueId];
        setSelectedAttributes((p) => ({ ...p, [k]: updated }));
        if (k === "color") { setSelectedColors(updated); handleFilterChange("color", updated[0] || ""); }
        else if (k === "size") { setSelectedSizes(updated); handleFilterChange("size", updated[0] || ""); }
    };

    const clearFilters = () => {
        const cf = { search: "", category: "", productType: "", color: "", size: "", minPrice: "", maxPrice: "", sort: "createdAt", order: "desc" };
        setFilters(cf); setSelectedColors([]); setSelectedSizes([]); setSelectedAttributes({});
        updateURL(cf); setPagination((p) => ({ ...p, page: 1 }));
    };

    const handleSortChange = (e) => {
        const map = {
            newest: ["createdAt", "desc"],
            oldest: ["createdAt", "asc"],
            "price-low": ["price", "asc"],
            "price-high": ["price", "desc"],
            "name-asc": ["name", "asc"],
            "name-desc": ["name", "desc"],
        };
        const [sort, order] = map[e.target.value] || ["createdAt", "desc"];
        const nf = { ...filters, sort, order };
        setFilters(nf);
        updateURL(nf);
    };

    const handlePageChange = (p) => {
        if (p < 1 || p > pagination.pages) return;
        setPagination((prev) => ({ ...prev, page: p }));
        const params = new URLSearchParams(searchParams.toString());
        p > 1 ? params.set("page", p) : params.delete("page");
        router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    /* ── Active filter count ── */
    const activeCount = [
        filters.search, filters.category,
        selectedColors.length > 0, selectedSizes.length > 0,
        filters.minPrice, filters.maxPrice,
    ].filter(Boolean).length;

    /* ── Current sort value ── */
    const currentSort = () => {
        if (filters.sort === "price" && filters.order === "asc") return "price-low";
        if (filters.sort === "price" && filters.order === "desc") return "price-high";
        if (filters.sort === "name" && filters.order === "asc") return "name-asc";
        if (filters.sort === "name" && filters.order === "desc") return "name-desc";
        if (filters.sort === "createdAt" && filters.order === "asc") return "oldest";
        return "newest";
    };

    /* ── Sidebar panel (shared desktop + drawer) ── */
    const SidebarContent = () => (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-900">Filters</span>
                {activeCount > 0 && (
                    <button onClick={clearFilters} className="text-[11px] font-medium text-primary hover:underline">
                        Clear all ({activeCount})
                    </button>
                )}
            </div>

            {/* Search */}
            <FilterSection title="Search" isOpen={!!openSections.search} onToggle={() => setOpenSections((p) => ({ ...p, search: !p.search }))}>
                <form onSubmit={(e) => { e.preventDefault(); handleFilterChange("search", searchInput); }} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                    <input
                        placeholder="Search products..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full h-8 pl-8 pr-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                </form>
            </FilterSection>

            {/* Categories */}
            <FilterSection title="Categories" isOpen={!!openSections.categories} onToggle={() => setOpenSections((p) => ({ ...p, categories: !p.categories }))}>
                <div className="space-y-0.5 max-h-56 overflow-y-auto">
                    {categories.map((cat) => (
                        <div key={cat.id}>
                            <button
                                onClick={() => handleFilterChange("category", filters.category === cat.slug ? "" : cat.slug)}
                                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${filters.category === cat.slug ? "bg-primary/8 text-primary font-medium" : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <ChevronRight className={`h-3 w-3 flex-shrink-0 transition-transform ${filters.category === cat.slug ? "rotate-90 text-primary" : "text-gray-400"}`} />
                                {cat.name}
                            </button>
                            {cat.children?.length > 0 && (
                                <div className="ml-5 mt-0.5 space-y-0.5">
                                    {cat.children.map((child) => (
                                        <button
                                            key={child.id}
                                            onClick={() => handleFilterChange("category", filters.category === child.slug ? "" : child.slug)}
                                            className={`w-full text-left px-2 py-1 rounded-lg text-xs transition-colors ${filters.category === child.slug ? "text-primary font-medium bg-primary/8" : "text-gray-500 hover:bg-gray-50"
                                                }`}
                                        >
                                            {child.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </FilterSection>

            {/* Dynamic attribute filters */}
            {allAttributes.map((attr) => {
                const k = attr.name.toLowerCase();
                const sKey = `attr_${k}`;
                const selectedVals = k === "color" ? selectedColors : k === "size" ? selectedSizes : (selectedAttributes[k] || []);
                return (
                    <FilterSection
                        key={attr.id}
                        title={attr.name}
                        isOpen={!!openSections[sKey]}
                        onToggle={() => setOpenSections((p) => ({ ...p, [sKey]: !p[sKey] }))}
                    >
                        <div className="space-y-0.5 max-h-52 overflow-y-auto">
                            {attr.values.map((val) => {
                                const active = selectedVals.includes(val.id);
                                return (
                                    <button
                                        key={val.id}
                                        onClick={() => handleAttrChange(attr.name, val.id)}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${active ? "bg-primary/8 text-primary font-medium" : "text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        {/* Checkbox */}
                                        <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${active ? "bg-primary border-primary" : "border-gray-300"
                                            }`}>
                                            {active && <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}><path d="M2 6l3 3 5-5" /></svg>}
                                        </span>
                                        {/* Color swatch */}
                                        {val.hexCode && (
                                            <span className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0" style={{ background: val.hexCode }} />
                                        )}
                                        {val.image && (
                                            <span className="w-3.5 h-3.5 rounded-full overflow-hidden flex-shrink-0">
                                                <Image src={val.image} alt={val.name} width={14} height={14} />
                                            </span>
                                        )}
                                        {val.display || val.name}
                                    </button>
                                );
                            })}
                        </div>
                    </FilterSection>
                );
            })}
        </div>
    );

    /* ── Loading initial - Handled by skeleton grid in main render ── */

    /* ── Render ── */
    return (
        <div id="products-main">
            {/* Categories Carousel — desktop */}
            <div className="hidden lg:block mb-4">
                <CategoriesCarousel />
            </div>

            {/* Hero Banner */}
            <div
                className="relative w-full h-[130px] sm:h-[170px] md:h-[210px] mb-6 rounded-2xl overflow-hidden flex items-center"
                style={{ background: "linear-gradient(135deg, #0A2540 0%, #005EB8 60%, #0074e4 100%)" }}
            >
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-10 right-10 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #16C7D9, transparent 70%)" }} />
                    <svg className="absolute right-8 top-1/2 -translate-y-1/2 opacity-5 hidden md:block" width="120" height="120" viewBox="0 0 120 120" fill="none">
                        <rect x="48" y="10" width="24" height="100" rx="6" fill="white"/>
                        <rect x="10" y="48" width="100" height="24" rx="6" fill="white"/>
                    </svg>
                </div>
                <div className="relative z-10 px-6 md:px-10 max-w-2xl">
                    <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-3 border"
                        style={{ background: "rgba(22,199,217,0.15)", borderColor: "rgba(22,199,217,0.3)", color: "#16C7D9" }}
                    >
                        <Zap className="w-3 h-3" />
                        Genuine Branded Medicines
                    </span>
                    <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-1.5">All Medicines</h1>
                    <p className="text-sm text-white/60 leading-relaxed hidden sm:block">
                        IVF · Oncology · Transplant · Sexual Wellness · Temp-Controlled 2°C–8°C · Pan-India Delivery
                    </p>
                </div>
            </div>

            {/* ── Top bar: mobile filter toggle + sort ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                    {/* Mobile filter button */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors flex-shrink-0"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                        {activeCount > 0 && (
                            <span className="w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {activeCount}
                            </span>
                        )}
                    </button>

                    {/* Result count */}
                    <p className="text-sm text-gray-500 whitespace-nowrap">
                        {loading
                            ? <span className="inline-block h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
                            : <><span className="font-semibold text-gray-900">{pagination.total || 0}</span> products</>
                        }
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 flex-shrink-0 shadow-sm">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                            title="Grid View"
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden bg-white flex-shrink-0 max-w-[150px] sm:max-w-none">
                        <span className="hidden xs:inline-block px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-r border-gray-200">
                            Sort
                        </span>
                        <select
                            value={currentSort()}
                            onChange={handleSortChange}
                            disabled={loading}
                            className="px-2 sm:px-3 py-2 text-xs text-gray-700 focus:outline-none bg-white cursor-pointer w-full"
                        >
                            <option value="newest">Featured</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="name-asc">Name A–Z</option>
                            <option value="name-desc">Name Z–A</option>
                            <option value="oldest">Oldest first</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Active filter chips ── */}
            {activeCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    {filters.search && (
                        <FilterChip label={`"${filters.search}"`} onRemove={() => handleFilterChange("search", "")} />
                    )}
                    {filters.category && (
                        <FilterChip
                            label={categories.find((c) => c.slug === filters.category)?.name || filters.category}
                            onRemove={() => handleFilterChange("category", "")}
                        />
                    )}
                    {selectedColors.map((cId) => (
                        <FilterChip key={cId}
                            label={colors.find((c) => c.id === cId)?.name || "Color"}
                            onRemove={() => { setSelectedColors([]); handleFilterChange("color", ""); }}
                        />
                    ))}
                    {selectedSizes.map((sId) => (
                        <FilterChip key={sId}
                            label={sizes.find((s) => s.id === sId)?.display || sizes.find((s) => s.id === sId)?.name || "Size"}
                            onRemove={() => { setSelectedSizes([]); handleFilterChange("size", ""); }}
                        />
                    ))}
                    {(filters.minPrice || filters.maxPrice) && (
                        <FilterChip
                            label={`₹${filters.minPrice || "0"} – ₹${filters.maxPrice || "∞"}`}
                            onRemove={() => { handleFilterChange("minPrice", ""); handleFilterChange("maxPrice", ""); }}
                        />
                    )}
                    <button onClick={clearFilters} className="text-[11px] text-gray-400 hover:text-primary transition-colors">
                        Clear all
                    </button>
                </div>
            )}

            {/* ── Layout: sidebar + grid ── */}
            <div className="flex gap-6">

                {/* Desktop sidebar */}
                <aside className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
                    <div className="sticky top-24">
                        <SidebarContent />
                    </div>
                </aside>

                {/* Product grid */}
                <div className="flex-1 min-w-0">
                    {loading && products.length === 0 ? (
                        <div id="products-grid-anchor" className={`grid gap-3 ${viewMode === "list" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-2 sm:grid-cols-4 xl:grid-cols-5"}`}>
                            {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : products.length === 0 ? (
                        <EmptyState
                            filters={filters}
                            selectedColors={selectedColors}
                            selectedSizes={selectedSizes}
                            onClear={clearFilters}
                            onClearColors={() => { setSelectedColors([]); handleFilterChange("color", ""); }}
                            onClearSizes={() => { setSelectedSizes([]); handleFilterChange("size", ""); }}
                        />
                    ) : (
                        <div className={`grid gap-2 transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"} ${viewMode === "list" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-2 sm:grid-cols-4 xl:grid-cols-5"}`}>
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} viewMode={viewMode} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <Pagination
                            current={pagination.page}
                            total={pagination.pages}
                            loading={loading}
                            onChange={handlePageChange}
                        />
                    )}
                </div>
            </div>

            {/* ── Mobile Drawer ── */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-[80%] max-w-[320px] bg-gray-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between px-4 py-3.5 bg-white border-b border-gray-100">
                            <span className="font-bold text-gray-900">Filters</span>
                            <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3">
                            <SidebarContent />
                        </div>
                        <div className="p-3 border-t border-gray-100 bg-white">
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold"
                            >
                                Show {pagination.total || 0} results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
function EmptyState({ filters, selectedColors, selectedSizes, onClear, onClearColors, onClearSizes }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
                {selectedColors.length > 0 && selectedSizes.length > 0
                    ? "No products match this color and size combination."
                    : selectedColors.length > 0 ? "No products with this color."
                        : selectedSizes.length > 0 ? "No products with this size."
                            : filters.minPrice || filters.maxPrice ? "No products in this price range."
                                : "Try adjusting your filters or search term."}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
                <button onClick={onClear} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors">
                    Clear all filters
                </button>
                {selectedColors.length > 0 && (
                    <button onClick={onClearColors} className="px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                        Clear color
                    </button>
                )}
                {selectedSizes.length > 0 && (
                    <button onClick={onClearSizes} className="px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                        Clear size
                    </button>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   PAGINATION
───────────────────────────────────────────── */
function Pagination({ current, total, loading, onChange }) {
    const pages = [];
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - 1 && i <= current + 1))
            pages.push(i);
        else if ((i === 2 && current > 3) || (i === total - 1 && current < total - 2))
            pages.push("...");
    }
    // Deduplicate consecutive "..."
    const deduped = pages.filter((p, i, arr) => p !== "..." || arr[i - 1] !== "...");

    return (
        <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 mt-12 mb-4">
            <button
                onClick={() => onChange(current - 1)}
                disabled={current === 1 || loading}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {deduped.map((p, i) =>
                p === "..." ? (
                    <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-gray-400">
                        ···
                    </span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        disabled={loading}
                        className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95 ${p === current
                            ? "bg-primary text-white scale-105"
                            : "border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
                            }`}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                onClick={() => onChange(current + 1)}
                disabled={current === total || loading}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

/* ─────────────────────────────────────────────
   PAGE WRAPPER
───────────────────────────────────────────── */
const FALLBACK = (
    <div className="flex gap-6 animate-pulse">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:block w-64 space-y-6">
            <div className="h-10 bg-white rounded-2xl border border-gray-100" />
            <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded-full w-1/2" />
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 bg-white rounded-xl border border-gray-50" />
                ))}
            </div>
        </div>
        {/* Grid Skeleton */}
        <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="aspect-square bg-gray-50" />
                        <div className="p-3.5 space-y-3">
                            <div className="h-4 bg-gray-100 rounded-full w-full" />
                            <div className="h-3 bg-gray-50 rounded-full w-2/3" />
                            <div className="flex justify-between items-center pt-2">
                                <div className="h-4 bg-gray-100 rounded-full w-14" />
                                <div className="h-8 bg-gray-100 rounded-xl w-16" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default function ProductsPage() {
    return (
        <div className="min-h-screen" style={{ background: "#F7FAFC" }}>
            <div className="max-w-7xl mx-auto xl:px-4 py-5 pb-24 md:pb-8">
                <ClientOnly fallback={FALLBACK}>
                    <Suspense fallback={FALLBACK}>
                        <ProductsContent />
                    </Suspense>
                </ClientOnly>
            </div>
        </div>
    );
}