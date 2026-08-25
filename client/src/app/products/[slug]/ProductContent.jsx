"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, formatCurrency } from "@/lib/utils";
import {
  Star, Minus, Plus, AlertCircle, ShoppingCart,
  Heart, ChevronRight, CheckCircle, Zap,
  Truck, ShieldCheck, Thermometer, BadgeCheck,
  X, ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import ReviewSection from "./ReviewSection";
import { useAddVariantToCart } from "@/lib/cart-utils";
import { ProductCard } from "@/components/products/ProductCard";

/* ─────────────────────────────────────────────
   UTIL
───────────────────────────────────────────── */
const getImageUrl = (img) => {
  if (!img) return "/fallback.png";
  if (img.startsWith("http")) return img;
  return `https://desirediv-storage.blr1.cdn.digitaloceanspaces.com/${img}`;
};


const TRUST_CONFIG = [
  { key: "isGenuineMedicine", icon: BadgeCheck,   label: "100% Genuine Medicine" },
  { key: "isTempControlled",  icon: Thermometer,  label: "Temp-Controlled 2°C–8°C" },
  { key: "isVerifiedSupplier", icon: ShieldCheck,  label: "Verified Supplier" },
  { key: "isPanIndiaDelivery", icon: Truck,        label: "Pan-India Delivery" },
];

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function ProductContent({ slug }) {
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [effectivePriceInfo, setEffectivePriceInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [availableCombinations, setAvailableCombinations] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [priceSettings, setPriceSettings] = useState(null);

  // Zoom & Lightbox States
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { addVariantToCart } = useAddVariantToCart();

  // Prevent background scrolling when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen]);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const openLightbox = () => {
    if (!images?.length) return;
    const index = images.findIndex((img) => img.url === primary?.url);
    setLightboxIndex(index >= 0 ? index : 0);
    setIsLightboxOpen(true);
  };

  /* ── Slab pricing ── */
  const getEffectivePrice = (variant, qty) => {
    if (!variant) return null;
    const salePrice = variant.salePrice ? parseFloat(variant.salePrice) : null;
    const regPrice = variant.price ? parseFloat(variant.price) : 0;

    let price = salePrice && salePrice < regPrice ? salePrice : regPrice;
    let originalPrice = salePrice && salePrice < regPrice ? regPrice : null;

    if (variant.pricingSlabs?.length > 0) {
      const sorted = [...variant.pricingSlabs].sort((a, b) => b.minQty - a.minQty);
      for (const slab of sorted) {
        if (qty >= slab.minQty && (slab.maxQty === null || qty <= slab.maxQty)) {
          return { price: parseFloat(slab.price), originalPrice: price, source: "SLAB", slab };
        }
      }
    }
    return { price, originalPrice, source: "DEFAULT", slab: null };
  };


  /* ── Fetch product ── */
  useEffect(() => {
    if (!slug) return;
    setLoading(true); setInitialLoading(true);
    fetchApi(`/public/products/${slug}`)
      .then((res) => {
        const pd = res.data.product;
        setProduct(pd);
        setRelatedProducts(res.data.relatedProducts || []);
        if (pd.images?.length) setMainImage(pd.images[0]);
        if (pd.variants?.length) {
          const combos = pd.variants
            .filter((v) => v.isActive && (v.stock > 0 || v.quantity > 0))
            .map((v) => ({ attributeValueIds: v.attributes?.map((a) => a.attributeValueId) || [], variant: v }));
          setAvailableCombinations(combos);
          if (pd.attributeOptions?.length) {
            const defaults = {};
            pd.attributeOptions.forEach((a) => { if (a.values?.length) defaults[a.id] = a.values[0].id; });
            setSelectedAttributes(defaults);
            const match = combos.find((c) => {
              const cIds = c.attributeValueIds.sort().join(",");
              return cIds === Object.values(defaults).sort().join(",");
            });
            const v = match?.variant || pd.variants[0];
            setSelectedVariant(v);
            const moq = v.moq || 1;
            setQuantity(moq);
            setEffectivePriceInfo(getEffectivePrice(v, moq));
          } else {
            const v = pd.variants[0];
            setSelectedVariant(v);
            const moq = v.moq || 1;
            setQuantity(moq);
            setEffectivePriceInfo(getEffectivePrice(v, moq));
          }
        }
      })
      .catch((err) => { console.error(err); setError(err.message); })
      .finally(() => { setLoading(false); setInitialLoading(false); });
  }, [slug]);

  /* ── Price visibility ── */
  useEffect(() => {
    fetchApi("/public/price-visibility-settings")
      .then((r) => { if (r.success) setPriceSettings(r.data); })
      .catch(() => setPriceSettings({ hidePricesForGuests: false }));
  }, []);

  /* ── Wishlist status ── */
  useEffect(() => {
    if (!isAuthenticated || !product) return;
    fetchApi("/users/wishlist", { credentials: "include" })
      .then((r) => setIsInWishlist(r.data.wishlistItems?.some((i) => i.productId === product.id)))
      .catch(console.error);
  }, [isAuthenticated, product]);

  /* ── Attribute select ── */
  const handleAttributeChange = (attrId, valueId) => {
    const next = { ...selectedAttributes, [attrId]: valueId };
    setSelectedAttributes(next);
    const selIds = Object.values(next).sort();
    const match = availableCombinations.find((c) => {
      const cIds = c.attributeValueIds.sort();
      return cIds.length === selIds.length && cIds.every((id, i) => id === selIds[i]);
    });
    if (match) {
      setSelectedVariant(match.variant);
      const moq = match.variant.moq || 1;
      const qty = quantity < moq ? moq : quantity;
      if (quantity < moq) setQuantity(qty);
      setEffectivePriceInfo(getEffectivePrice(match.variant, qty));
    } else {
      setSelectedVariant(null); setEffectivePriceInfo(null);
    }
  };

  const getAvailableValues = (attrId) => {
    if (!product?.attributeOptions) return [];
    const attr = product.attributeOptions.find((a) => a.id === attrId);
    if (!attr?.values) return [];
    const others = { ...selectedAttributes }; delete others[attrId];
    const available = new Set();
    availableCombinations.forEach((c) => {
      const othIds = Object.values(others);
      if (othIds.length === 0 || othIds.every((id) => c.attributeValueIds.includes(id)))
        c.variant.attributes?.forEach((a) => { if (a.attributeId === attrId) available.add(a.attributeValueId); });
    });
    return attr.values.filter((v) => available.has(v.id));
  };

  /* ── Quantity ── */
  const handleQuantityChange = (delta) => {
    const moq = selectedVariant?.moq || 1;
    const stock = selectedVariant?.stock || selectedVariant?.quantity || 0;
    const next = quantity + delta;
    if (next < moq) return;
    if (stock > 0 && next > stock) return;
    setQuantity(next);
    if (selectedVariant) setEffectivePriceInfo(getEffectivePrice(selectedVariant, next));
  };

  /* ── Add to cart ── */
  const handleAddToCart = async () => {
    const v = selectedVariant || product?.variants?.[0];
    if (!v) return;
    setIsAddingToCart(true); setCartSuccess(false);
    try {
      const result = await addVariantToCart(v, quantity, product.name);
      if (result.success) { setCartSuccess(true); setTimeout(() => setCartSuccess(false), 3000); }
    } catch (err) { console.error(err); }
    finally { setIsAddingToCart(false); }
  };

  /* ── Wishlist ── */
  const handleWishlist = async () => {
    if (!isAuthenticated) { router.push(`/auth?redirect=/products/${slug}`); return; }
    setIsAddingToWishlist(true);
    try {
      if (isInWishlist) {
        const r = await fetchApi("/users/wishlist", { credentials: "include" });
        const item = r.data.wishlistItems.find((i) => i.productId === product.id);
        if (item) { await fetchApi(`/users/wishlist/${item.id}`, { method: "DELETE", credentials: "include" }); setIsInWishlist(false); }
      } else {
        await fetchApi("/users/wishlist", { method: "POST", credentials: "include", body: JSON.stringify({ productId: product.id }) });
        setIsInWishlist(true);
      }
    } catch (err) { console.error(err); }
    finally { setIsAddingToWishlist(false); }
  };

  /* ── Images ── */
  const getImages = () => {
    if (selectedVariant?.images?.length) return selectedVariant.images;
    if (product?.images?.length) return product.images;
    const vwi = product?.variants?.find((v) => v.images?.length);
    return vwi?.images || [];
  };

  /* ── Price display ── */
  const PriceDisplay = () => {
    if (initialLoading)
      return <div className="h-14 w-48 bg-gray-100 rounded-xl animate-pulse" />;

    const hidePrices = priceSettings?.hidePricesForGuests && !isAuthenticated;
    if (hidePrices || priceSettings === null)
      return (
        <div>
          <p className="text-2xl font-bold text-gray-400">Login to view price</p>
          <Link href={`/auth?redirect=/products/${slug}`}
            className="mt-1.5 inline-block text-sm text-primary underline underline-offset-2">
            Sign in
          </Link>
        </div>
      );

    if (product?.flashSale?.isActive) {
      const flashPrice = parseFloat(product.flashSale.flashSalePrice);
      const regPrice = parseFloat(product.basePrice);
      const savings = regPrice - flashPrice;
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-3xl font-black tracking-tight">
              {formatCurrency(flashPrice)}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            MRP{" "}
            <span className="line-through">{formatCurrency(regPrice)}</span>
            {" "}(incl. of all taxes){" "}
            {savings > 0 && <span className="text-green-600 font-semibold">{formatCurrency(savings)} OFF</span>}
            {" "}
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <Zap className="h-3 w-3 fill-amber-500" /> Flash Sale
            </span>
          </p>
        </div>
      );
    }

    if (selectedVariant) {
      const info = effectivePriceInfo || getEffectivePrice(selectedVariant, quantity);
      if (!info) return <p className="text-2xl font-bold text-gray-400">Price unavailable</p>;
      const mrp = info.originalPrice ? parseFloat(info.originalPrice) : null;
      const saleP = parseFloat(info.price);
      const hasDiff = mrp && mrp > saleP;
      const savings = hasDiff ? mrp - saleP : 0;
      const discPct = hasDiff ? Math.round((savings / mrp) * 100) : 0;
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-3xl font-black tracking-tight">
              {formatCurrency(saleP)}
            </span>
            {hasDiff && discPct > 0 && (
              <span className="text-sm font-bold text-primary bg-blue-50 px-2 py-1 rounded-md">{discPct}% off</span>
            )}
          </div>
          {hasDiff ? (
            <p className="text-sm text-gray-500">
              MRP <span className="line-through">{formatCurrency(mrp)}</span>
              {" "}(incl. of all taxes){" "}
              <span className="text-green-600 font-semibold">Save {formatCurrency(savings)}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-400">(incl. of all taxes)</p>
          )}
          {info.source === "SLAB" && (
            <p className="text-sm text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-lg inline-block">
              Bulk Discount: {formatCurrency(mrp - saleP)} saved per unit
            </p>
          )}
        </div>
      );
    }

    const bp = parseFloat(product?.basePrice) || 0;
    const rp = parseFloat(product?.regularPrice) || 0;
    const currentPrice = (product?.hasSale && rp > bp) ? bp : (bp || rp);
    const originalPrice = (product?.hasSale && rp > bp) ? rp : null;
    const savings = originalPrice ? originalPrice - currentPrice : 0;
    const discPct = originalPrice ? Math.round((savings / originalPrice) * 100) : 0;

    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-3xl font-black tracking-tight">
            {formatCurrency(currentPrice)}
          </span>
          {originalPrice && discPct > 0 && (
            <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">{discPct}% off</span>
          )}
        </div>
        {originalPrice ? (
          <p className="text-sm text-gray-500">
            MRP <span className="line-through">{formatCurrency(originalPrice)}</span>
            {" "}(incl. of all taxes){" "}
            <span className="text-green-600 font-semibold">Save {formatCurrency(savings)}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-400">(incl. of all taxes)</p>
        )}
      </div>
    );
  };

  /* ── Loading / Error / Not found states ── */
  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-20 flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-base text-gray-400">Loading product…</p>
    </div>
  );

  if (error) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load product</h2>
      <p className="text-sm text-gray-500 mb-6">{error}</p>
      <Link href="/products"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
        Browse Products <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );

  if (!product) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-yellow-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Product not found</h2>
      <p className="text-sm text-gray-500 mb-6">This product doesn&apos;t exist or has been removed.</p>
      <Link href="/products"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
        Browse Products <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );

  const images = getImages();
  const primary = mainImage && images.some((i) => i.url === mainImage.url)
    ? mainImage : (images.find((i) => i.isPrimary) || images[0]);
  const stock = selectedVariant?.stock || selectedVariant?.quantity || 0;
  const outOfStock = selectedVariant && stock === 0;
  const isPrescriptionRequired = product?.categories?.some(
    c => c.name?.toLowerCase().includes("prescription") || 
         c.slug?.toLowerCase().includes("prescription") ||
         c.category?.name?.toLowerCase().includes("prescription") ||
         c.category?.slug?.toLowerCase().includes("prescription")
  ) || product?.tags?.some(t => t.toLowerCase().includes("prescription")) || false;

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: "#F7FAFC" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8 flex-wrap">
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          <Link href="/products" className="hover:text-gray-700 transition-colors">Products</Link>
          {(product.category || product.categories?.[0]?.category) && (
            <>
              <ChevronRight className="h-3 w-3 flex-shrink-0" />
              <Link
                href={`/category/${product.category?.slug || product.categories[0].category.slug}`}
                className="hover:text-gray-700 transition-colors"
              >
                {product.category?.name || product.categories[0].category.name}
              </Link>
            </>
          )}
          {product.subCategories?.length > 0 && (
            <>
              <ChevronRight className="h-3 w-3 flex-shrink-0" />
              <Link
                href={`/subcategory/${product.subCategories[0].slug}`}
                className="hover:text-gray-700 transition-colors"
              >
                {product.subCategories[0].name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          <span className="text-gray-700 font-medium truncate max-w-[180px] sm:max-w-sm">{product.name}</span>
        </nav>

        {/* ─── Main product grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 mb-16">

          {/* ── LEFT: Image gallery ── */}
          <div>
            {/* Desktop: thumbnails left + main image right */}
            <div className="hidden sm:flex gap-3">
              {/* Vertical thumbnails */}
              {images.length > 1 && (
                <div className="flex flex-col gap-2 flex-shrink-0 max-h-[480px] overflow-y-auto">
                  {images.map((img, idx) => {
                    const active = primary?.url === img.url;
                    return (
                      <button
                        key={idx}
                        onClick={() => setMainImage(img)}
                        className={`relative flex-shrink-0 w-[64px] h-[64px] rounded-xl overflow-hidden border-2 transition-all duration-150 bg-gray-50 ${active ? "border-primary shadow-sm" : "border-gray-200 hover:border-gray-400"}`}
                      >
                        <Image src={getImageUrl(img.url)} alt="" fill className="object-contain p-1" sizes="64px" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Main image */}
              <div
                className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-white border cursor-zoom-in group"
                style={{ borderColor: "#DCE7F2", aspectRatio: "1/1" }}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
                onClick={openLightbox}
              >
                {images.length > 0 ? (
                  <Image
                    src={getImageUrl(primary?.url)}
                    alt={product.name}
                    fill
                    className="object-contain p-6 transition-transform duration-75 ease-out"
                    priority
                    sizes="(max-width: 1024px) 80vw, 45vw"
                    style={{
                      transform: isZoomed ? "scale(2.2)" : "scale(1)",
                      transformOrigin: isZoomed ? `${zoomPos.x}% ${zoomPos.y}%` : "center",
                    }}
                  />
                ) : (
                  <Image src="/fallback.png" alt={product.name} fill className="object-contain" />
                )}
                {product.flashSale?.isActive && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-[10px] font-extrabold uppercase tracking-widest pointer-events-none">
                    <Zap className="h-3 w-3 fill-white animate-pulse" />
                    FLASH SALE — {product.flashSale.discountPercentage}% OFF
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWishlist();
                  }}
                  disabled={isAddingToWishlist}
                  className={`absolute top-3 right-3 w-9 h-9 rounded-full shadow-sm flex items-center justify-center transition-all ${isInWishlist ? "bg-red-50 text-red-500" : "bg-white/90 text-gray-400 hover:text-red-400"}`}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist ? "fill-red-500" : ""}`} />
                </button>
              </div>
            </div>

            {/* Mobile: main image top + horizontal thumbnails below */}
            <div className="sm:hidden">
              <div
                className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border mb-3 cursor-pointer"
                style={{ borderColor: "#DCE7F2", aspectRatio: "1/1" }}
                onClick={openLightbox}
              >
                {images.length > 0 ? (
                  <Image src={getImageUrl(primary?.url)} alt={product.name} fill className="object-contain p-6 transition-all duration-300" priority sizes="95vw" />
                ) : (
                  <Image src="/fallback.png" alt={product.name} fill className="object-contain" />
                )}
                {product.flashSale?.isActive && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-[10px] font-extrabold uppercase tracking-widest pointer-events-none">
                    <Zap className="h-3 w-3 fill-white animate-pulse" />
                    {product.flashSale.discountPercentage}% OFF
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWishlist();
                  }}
                  disabled={isAddingToWishlist}
                  className={`absolute top-3 right-3 w-9 h-9 rounded-full shadow-sm flex items-center justify-center transition-all ${isInWishlist ? "bg-red-50 text-red-500" : "bg-white/90 text-gray-400 hover:text-red-400"}`}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist ? "fill-red-500" : ""}`} />
                </button>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => {
                    const active = primary?.url === img.url;
                    return (
                      <button key={idx} onClick={() => setMainImage(img)} className={`relative flex-shrink-0 w-[60px] h-[60px] rounded-xl overflow-hidden border-2 transition-all bg-gray-50 ${active ? "border-primary" : "border-gray-200"}`}>
                        <Image src={getImageUrl(img.url)} alt="" fill className="object-contain p-1" sizes="60px" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Product info ── */}
          <div className="flex flex-col">

            {/* Brand */}
            {product.brand && (
              <Link
                href={`/brand/${product.brand.slug}`}
                className="text-xs font-bold tracking-[0.12em] uppercase text-primary mb-2.5"
              >
                {product.brand?.name ?? product.brand ?? product.brandName ?? ""}
              </Link>
            )}

            {/* Product name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-4">
              {product.name}
            </h1>

            {/* Category + SubCategories + Brand + Composition */}
            <div className="mb-6 pb-6 border-b border-gray-100 space-y-2">
              {product.category && (
                <div className="flex gap-3 text-sm">
                  <span className="w-28 font-bold text-black flex-shrink-0">Category</span>
                  <Link href={`/category/${product.category.slug}`} className="text-primary hover:underline font-medium">
                    {product.category.name}
                  </Link>
                </div>
              )}
              {product.subCategories?.length > 0 && (
                <div className="flex gap-3 text-sm">
                  <span className="w-28 font-bold text-black flex-shrink-0">Sub-category</span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.subCategories.map((sc) => (
                      <Link
                        key={sc.id}
                        href={`/subcategory/${sc.slug}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {sc.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {(product.brandName || product.brand?.name) && (
                <div className="flex gap-3 text-sm">
                  <span className="w-28 font-bold text-black flex-shrink-0">Brand</span>
                  <span className="text-gray-700 font-medium">{product.brandName || product.brand?.name}</span>
                </div>
              )}
              {product.composition && (
                <div className="flex gap-3 text-sm">
                  <span className="w-28 font-bold text-black flex-shrink-0">Composition</span>
                  <span className="text-gray-700 font-medium">{product.composition}</span>
                </div>
              )}
            </div>

            {/* Prescription & Similar Products Section */}
            <div className="mb-6 p-4 rounded-xl border border-gray-200 bg-[#F8FAFC]">
              {isPrescriptionRequired && (
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 pb-3 border-b border-gray-200/60 mb-3">
                  <span>Prescription Required:</span>
                  <span className="text-green-600 font-bold">Yes</span>
                </div>
              )}
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Similar Products</span>
                  {product.subCategories?.length > 0 && (
                    <Link 
                      href={`/subcategory/${product.subCategories[0].slug}`} 
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      See All
                    </Link>
                  )}
                </div>
                {relatedProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {relatedProducts.slice(0, 2).map((p) => (
                      <Link 
                        key={p.id} 
                        href={`/products/${p.slug}`} 
                        className="group flex gap-2.5 p-2 rounded-lg border border-gray-150 hover:border-primary/20 transition-all bg-white"
                      >
                        <div className="relative w-12 h-12 flex-shrink-0 bg-white rounded border border-gray-100 p-0.5 flex items-center justify-center overflow-hidden">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="object-contain max-h-full max-w-full" />
                          ) : (
                            <div className="bg-gray-150 w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Image</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <span className="text-[11px] font-semibold text-gray-800 line-clamp-1 group-hover:text-primary transition-colors leading-tight">{p.name}</span>
                          {p.basePrice !== null && (
                            <span className="text-xs font-bold text-gray-900 mt-0.5">
                              {formatCurrency ? formatCurrency(p.basePrice) : `₹${p.basePrice}`}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No similar products found</p>
                )}
              </div>
            </div>

            {/* Flash sale banner */}
            {product.flashSale?.isActive && (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-2xl mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-900">{product.flashSale.name || "Flash Sale"}</p>
                    <p className="text-xs text-blue-600 mt-0.5">Limited time offer</p>
                  </div>
                </div>
                <span className="text-xl font-black text-primary">{product.flashSale.discountPercentage}% OFF</span>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <PriceDisplay />
            </div>

            {/* Highlights table */}
            {(() => {
              const rows = [];
              if (product.brand?.name) rows.push(["Brand", product.brand.name]);
              const pt = product.productType && typeof product.productType === "object" ? product.productType : null;
              if (pt) {
                Object.entries(pt).forEach(([k, v]) => {
                  // skip numeric keys (junk array-like data) and empty values
                  if (v && isNaN(Number(k))) rows.push([k, String(v)]);
                });
              }
              if (selectedVariant?.attributes?.length) {
                selectedVariant.attributes.forEach((a) => {
                  // formatVariantWithAttributes returns { attribute: "Name", value: "Val" }
                  const label = a.attribute?.name ?? a.attribute;
                  const val = a.attributeValue?.value ?? a.value;
                  if (label && val) rows.push([label, val]);
                });
              }
              if (!rows.length) return null;
              return (
                <div className="mb-6 pb-6 border-b" style={{ borderColor: "#DCE7F2" }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: "#0A2540" }}>Highlights</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {rows.map(([label, value]) => (
                        <tr key={label} className="border-b last:border-0" style={{ borderColor: "#DCE7F2" }}>
                          <td className="py-2 pr-4 text-gray-400 w-36 align-top capitalize">{label}</td>
                          <td className="py-2 text-gray-800 font-medium">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-base text-gray-600 leading-relaxed mb-6 pb-6 border-b border-gray-100">
                {product.shortDescription}
              </p>
            )}

            {/* Attributes */}
            {product.attributeOptions?.map((attr) => {
              const values = getAvailableValues(attr.id);
              const selId = selectedAttributes[attr.id];
              const selVal = values.find((v) => v.id === selId);
              return (
                <div key={attr.id} className="mb-6">
                  <p className="text-sm font-semibold text-gray-800 mb-3">
                    {attr.name}
                    {selVal && (
                      <span className="ml-2 text-sm font-normal text-gray-500">— {selVal.value}</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {values.length > 0 ? (
                      values.map((v) => {
                        const active = selId === v.id;
                        return (
                          <button
                            key={v.id}
                            onClick={() => handleAttributeChange(attr.id, v.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-150 ${active
                                ? "border-primary bg-primary text-white shadow-sm"
                                : "border-gray-200 text-gray-700 bg-white hover:border-gray-400"
                              }`}
                          >
                            {v.value}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-400">No {attr.name.toLowerCase()} available</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Stock / MOQ indicators */}
            {(selectedVariant || outOfStock !== undefined) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedVariant && stock > 0 && (
                  <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-green-50 border border-green-100 text-sm font-medium text-green-700">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                    In Stock
                  </span>
                )}
                {outOfStock && (
                  <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 border border-red-100 text-sm font-medium text-red-600">
                    <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    Out of Stock
                  </span>
                )}
                {selectedVariant?.moq > 1 && (
                  <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-100 text-sm font-medium text-blue-700">
                    Min. order: {selectedVariant.moq} units
                  </span>
                )}
              </div>
            )}

            {/* Cart success */}
            {cartSuccess && (
              <div className="flex items-center gap-2.5 p-3.5 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700 mb-5 font-medium">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                Added to your bag!
              </div>
            )}

            {/* Quantity + Add to Cart + Wishlist */}
            <div className="space-y-3 mb-8">
              {/* Row 1: quantity stepper */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600 w-20 flex-shrink-0">Quantity</span>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= (selectedVariant?.moq || 1) || isAddingToCart}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center text-base font-bold text-gray-900 border-x-2 border-gray-200">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={(stock > 0 && quantity >= stock) || isAddingToCart}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Row 2: Add to Cart + Wishlist */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || outOfStock || (!selectedVariant && !product?.variants?.length)}
                  className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-xl text-base font-bold transition-all active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed ${cartSuccess ? "bg-green-600 text-white" : "bg-primary text-white hover:bg-primary/90"}`}
                >
                  {isAddingToCart ? (
                    <><div className="h-4 w-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />Adding…</>
                  ) : cartSuccess ? (
                    <><CheckCircle className="h-5 w-5" />Added!</>
                  ) : (
                    <><ShoppingCart className="h-5 w-5" />Add to Cart</>
                  )}
                </button>
                <button
                  onClick={handleWishlist}
                  disabled={isAddingToWishlist}
                  className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl border-2 transition-all ${isInWishlist ? "border-red-200 bg-red-50 text-red-500" : "border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400"}`}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist ? "fill-red-500" : ""}`} />
                </button>
              </div>
            </div>

            {/* WhatsApp enquiry button */}
            <a
              href={`https://wa.me/919560247619?text=Hello%2C%20I%20want%20to%20enquire%20about%20${encodeURIComponent(product.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 flex items-center justify-center gap-2.5 rounded-xl font-semibold text-sm mb-3 transition-all hover:opacity-90"
              style={{ background: "#25D366", color: "white" }}
            >
              <img src="/whatsapp.png" alt="WhatsApp" className="h-5 w-5 object-contain" />
              Enquire on WhatsApp
            </a>

            {/* Cold Chain Badge */}
            {product.isColdChain && (
              <div className="w-full h-10 flex items-center justify-center gap-2 rounded-xl font-semibold text-sm mb-5 border-2" style={{ background: "#E3F2FD", borderColor: "#2196F3", color: "#1565C0" }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  <path d="M2 12h20" />
                  <path d="M4.93 4.93l14.14 14.14" />
                  <path d="M19.07 4.93L4.93 19.07" />
                </svg>
                Cold Chain Product
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {TRUST_CONFIG
                .filter(({ key }) => product[key])
                .map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl border" style={{ background: "rgba(0,94,184,0.04)", borderColor: "#DCE7F2" }}>
                    <Icon className="h-4 w-4 flex-shrink-0" style={{ color: "#005EB8" }} />
                    <span className="text-xs text-gray-600 font-semibold">{label}</span>
                  </div>
                ))}
            </div>

            {/* Rating + Net Qty */}
            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
              {(() => {
                // find a "qty" or "weight" or "unit" type attribute for Net Qty display
                const qtyAttr = selectedVariant?.attributes?.find((a) => {
                  const name = (a.attribute?.name ?? a.attribute ?? "").toLowerCase();
                  return name.includes("qty") || name.includes("unit") || name.includes("net");
                });
                const qtyVal = qtyAttr ? (qtyAttr.attributeValue?.value ?? qtyAttr.value) : null;
                return qtyVal ? (
                  <span className="text-sm text-gray-500">Net Qty: {qtyVal}</span>
                ) : null;
              })()}
              {(() => {
                const qtyAttr = selectedVariant?.attributes?.find((a) => {
                  const name = (a.attribute?.name ?? a.attribute ?? "").toLowerCase();
                  return name.includes("qty") || name.includes("unit") || name.includes("net");
                });
                return qtyAttr ? <span className="text-gray-300">•</span> : null;
              })()}
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(product.avgRating || 0) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {product.avgRating ? `${product.avgRating} (${product.reviewCount}k)` : "No reviews yet"}
              </span>
            </div>

          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="mb-16">
          <div className="flex gap-0 border-b-2 border-gray-100 overflow-x-auto mb-8">
            {[
              { key: "description", label: "Description" },
              { key: "reviews", label: `Reviews (${product.reviewCount || 0})` },
              { key: "shipping", label: "Shipping & Returns" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-[2px] transition-all ${activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <div className="max-w-3xl">
              <div
                className="prose prose-base text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.description || "" }}
              />
              {product.directions && (
                <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <h3 className="text-base font-bold text-blue-900 mb-2">Directions for Use</h3>
                  <p className="text-base text-blue-800 leading-relaxed">{product.directions}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && <ReviewSection product={product} />}

          {activeTab === "shipping" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
              {[
                {
                  title: "Shipping & Delivery",
                  icon: Truck,
                  rows: [
                    ["Metro cities", "24–48 hours"],
                    ["Tier 2 / Tier 3", "3–5 business days"],
                    ["Express overnight", "Select hubs — enquire on WhatsApp"],
                    ["Free shipping", "On orders above ₹999"],
                  ],
                },
                {
                  title: "Temp-Controlled Delivery",
                  icon: Thermometer,
                  rows: [
                    ["Temperature", "2°C – 8°C maintained throughout transit"],
                    ["Packaging", "Dual-walled EPS thermal box + gel packs"],
                    ["Tracking", "WhatsApp + SMS tracking link on dispatch"],
                    ["Delay policy", "Replacement at no charge if temperature control broken"],
                  ],
                },
              ].map(({ title, icon: Icon, rows }) => (
                <div key={title} className="rounded-2xl p-6 border" style={{ background: "rgba(0,94,184,0.03)", borderColor: "#DCE7F2" }}>
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "#0A2540" }}>
                    <Icon className="h-4 w-4" style={{ color: "#005EB8" }} />
                    {title}
                  </h3>
                  <dl className="space-y-3">
                    {rows.map(([dt, dd]) => (
                      <div key={dt}>
                        <dt className="text-xs font-bold uppercase tracking-wide" style={{ color: "#005EB8" }}>{dt}</dt>
                        <dd className="text-sm text-gray-600 mt-0.5">{dd}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Related Products ─── */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#0A2540" }}>Related Medicines</h2>
              {product.subCategories?.length > 0 ? (
                <Link href={`/subcategory/${product.subCategories[0].slug}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link href="/products" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

      </div>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && images.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 p-4 md:p-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between text-white w-full max-w-6xl mx-auto py-2">
            <span className="text-sm font-semibold truncate pr-4">{product.name}</span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Visual Workspace */}
          <div className="relative flex-1 flex items-center justify-center max-w-6xl w-full mx-auto my-4 group">
            {/* Prev Button */}
            {images.length > 1 && (
              <button
                onClick={() => setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                className="absolute left-2 md:left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Image Frame */}
            <div className="relative w-full h-full max-h-[70vh] flex items-center justify-center">
              <Image
                src={getImageUrl(images[lightboxIndex]?.url)}
                alt={product.name}
                width={1200}
                height={1200}
                className="object-contain max-w-full max-h-full"
                priority
              />
            </div>

            {/* Next Button */}
            {images.length > 1 && (
              <button
                onClick={() => setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                className="absolute right-2 md:right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Bottom Controls & Thumbnails */}
          <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-4 pb-4">
            <span className="text-xs text-gray-400">
              {lightboxIndex + 1} / {images.length}
            </span>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto max-w-full pb-1">
                {images.map((img, idx) => {
                  const active = idx === lightboxIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => setLightboxIndex(idx)}
                      className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all bg-gray-900 ${
                        active ? "border-primary" : "border-transparent hover:border-gray-500"
                      }`}
                    >
                      <Image src={getImageUrl(img.url)} alt="" fill className="object-contain p-0.5" sizes="56px" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}