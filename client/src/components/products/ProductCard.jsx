"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Loader2, ShoppingCart, Zap, Star, Check } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { fetchApi, formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";

/* ── utils ── */
const getImageUrl = (image) => {
  if (!image) return "/placeholder.jpg";
  if (image.startsWith("http")) return image;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

const calculateDiscountPercentage = (regularPrice, salePrice) => {
  if (!regularPrice || !salePrice || regularPrice <= salePrice) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
};

const parsePrice = (value) => {
  if (value === null || value === undefined) return null;
  if (value === 0) return 0;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(parsed) ? null : parsed;
};

/* ════════════════════════════════════════════
   PRODUCT CARD
════════════════════════════════════════════ */
export const ProductCard = ({ product, viewMode = "grid" }) => {
  const isList = viewMode === "list";
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [wishlistItems, setWishlistItems] = useState({});
  const [isAddingToWishlist, setIsAddingToWishlist] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [priceSettings, setPriceSettings] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;
    fetchApi("/users/wishlist", { credentials: "include" })
      .then((res) => {
        const map = res.data?.wishlistItems?.reduce((acc, item) => {
          acc[item.productId] = true;
          return acc;
        }, {}) || {};
        setWishlistItems(map);
      })
      .catch(console.error);
  }, [isAuthenticated]);

  useEffect(() => {
    fetchApi("/public/price-visibility-settings")
      .then((res) => { if (res.success) setPriceSettings(res.data); })
      .catch(() => setPriceSettings({ hidePricesForGuests: false }));
  }, []);

  const getAllProductImages = useMemo(() => {
    const images = [];
    const imageUrls = new Set();
    const push = (raw) => {
      const url = raw?.url || raw;
      if (!url) return;
      const full = getImageUrl(url);
      if (!imageUrls.has(full)) { imageUrls.add(full); images.push(full); }
    };
    product.variants?.forEach((v) => v.images?.forEach(push));
    product.images?.forEach(push);
    if (images.length === 0 && product.image) push(product.image);
    if (images.length === 0) images.push("/placeholder.jpg");
    return images;
  }, [product]);

  useEffect(() => {
    if (!isHovered || getAllProductImages.length <= 1) { setCurrentImageIndex(0); return; }
    const t = setInterval(() => setCurrentImageIndex((p) => (p + 1) % getAllProductImages.length), 2000);
    return () => clearInterval(t);
  }, [isHovered, getAllProductImages.length]);

  /* ── Price calc ── */
  const basePriceField = parsePrice(product.basePrice);
  const regularPriceField = parsePrice(product.regularPrice);
  const priceField = parsePrice(product.price);
  const salePriceField = parsePrice(product.salePrice);

  const hasFlashSale = product.flashSale?.isActive === true;
  const flashSalePrice = hasFlashSale ? parsePrice(product.flashSale.flashSalePrice) : null;
  const flashSaleDiscountPercent = hasFlashSale ? product.flashSale.discountPercentage : 0;

  let hasSale = product.hasSale !== undefined && product.hasSale !== null ? Boolean(product.hasSale) : false;
  if (!hasSale && salePriceField !== null && salePriceField > 0) {
    if ((regularPriceField && salePriceField < regularPriceField) || (priceField && salePriceField < priceField))
      hasSale = true;
  }

  let originalPrice = null;
  let currentPrice = 0;
  if (basePriceField !== null && regularPriceField !== null) {
    currentPrice = basePriceField;
    originalPrice = hasSale && basePriceField < regularPriceField ? regularPriceField : null;
  } else if (salePriceField !== null && hasSale) {
    currentPrice = salePriceField;
    originalPrice = priceField || basePriceField || regularPriceField || null;
  } else {
    currentPrice = basePriceField || regularPriceField || priceField || salePriceField || 0;
  }
  if (!currentPrice || isNaN(currentPrice)) currentPrice = 0;

  let displayPrice = currentPrice;
  let showFlashSaleBadge = false;
  if (hasFlashSale && flashSalePrice !== null) {
    if (!originalPrice) originalPrice = currentPrice;
    displayPrice = flashSalePrice;
    showFlashSaleBadge = true;
  }

  const discountPercent = showFlashSaleBadge
    ? flashSaleDiscountPercent
    : hasSale && originalPrice && currentPrice
      ? calculateDiscountPercentage(originalPrice, currentPrice)
      : 0;

  const showPrice = !priceSettings?.hidePricesForGuests || isAuthenticated;
  const inWishlist = wishlistItems[product.id];

  /* ── Handlers ── */
  const handleAddToWishlist = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { router.push(`/auth?redirect=/products/${product.slug}`); return; }
    setIsAddingToWishlist((p) => ({ ...p, [product.id]: true }));
    try {
      if (inWishlist) {
        const res = await fetchApi("/users/wishlist", { credentials: "include" });
        const item = res.data?.wishlistItems?.find((i) => i.productId === product.id);
        if (item) {
          await fetchApi(`/users/wishlist/${item.id}`, { method: "DELETE", credentials: "include" });
          setWishlistItems((p) => { const n = { ...p }; delete n[product.id]; return n; });
        }
      } else {
        await fetchApi("/users/wishlist", {
          method: "POST", credentials: "include",
          body: JSON.stringify({ productId: product.id }),
        });
        setWishlistItems((p) => ({ ...p, [product.id]: true }));
      }
    } catch { toast.error("Failed to update wishlist"); }
    finally { setIsAddingToWishlist((p) => ({ ...p, [product.id]: false })); }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!showPrice) { toast.error("Please login to purchase items"); return; }
    const variantId = product.variants?.[0]?.id;
    if (!variantId) {
      toast.error("Select options on product page");
      router.push(`/products/${product.slug}`);
      return;
    }
    setIsAddingToCart(true);
    try {
      await addToCart(variantId, 1);
      setAddedToCart(true);
      toast.success("Added to cart!");
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) { console.error(err); }
    finally { setIsAddingToCart(false); }
  };

  /* ── LIST MODE ── */
  if (isList) {
    return (
      <div
        className="group relative bg-white rounded-2xl overflow-hidden flex flex-row transition-all duration-300 hover:shadow-xl border"
        style={{ borderColor: "#DCE7F2", minHeight: "140px" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image — fixed size, no fill */}
        <Link
          href={`/products/${product.slug}`}
          className="flex-shrink-0 bg-gray-50 flex items-center justify-center overflow-hidden"
          style={{ width: "140px", minHeight: "140px" }}
        >
          <Image
            src={getAllProductImages[currentImageIndex] || "/placeholder.jpg"}
            alt={product.name}
            width={120}
            height={120}
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            style={{ width: "100%", height: "auto", maxHeight: "120px", padding: "10px" }}
          />
        </Link>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 justify-between min-w-0">
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">{product.category?.name || "Medicine"}</span>
            <Link href={`/products/${product.slug}`}>
              <h3 className="text-base font-semibold mb-1 line-clamp-2 group-hover:text-primary transition-colors" style={{ color: "#0A2540" }}>{product.name}</h3>
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {showPrice ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold" style={{ color: "#005EB8" }}>{formatCurrency(displayPrice)}</span>
                {originalPrice && <span className="text-sm text-gray-400 line-through">{formatCurrency(originalPrice)}</span>}
                {discountPercent > 0 && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{discountPercent}% off</span>}
              </div>
            ) : (
              <Link href="/auth" className="text-sm font-bold text-primary">Login for Price</Link>
            )}
            <button
              onClick={handleAddToCart}
              disabled={!showPrice || isAddingToCart}
              className="ml-auto flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 whitespace-nowrap"
              style={{ background: addedToCart ? "#16C7D9" : "linear-gradient(135deg, #005EB8, #0074e4)" }}
            >
              {isAddingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> : addedToCart ? <><Check className="w-4 h-4" /><span>Added</span></> : <><ShoppingCart className="w-4 h-4" /><span>Add to Cart</span></>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── GRID MODE — matches screenshot exactly ── */
  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border"
      style={{ borderColor: "#e8f0fb" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Image section ── */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block overflow-hidden bg-gray-50"
        style={{ aspectRatio: "1/1" }}
      >
        {/* Top-left badge */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5">
          {showFlashSaleBadge && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-wide"
              style={{ background: "linear-gradient(135deg, #005EB8, #16C7D9)" }}
            >
              FLASH {discountPercent}% OFF
            </span>
          )}
          {!showFlashSaleBadge && discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded text-[10px] font-black text-white uppercase" style={{ background: "#005EB8" }}>
              {discountPercent}% OFF
            </span>
          )}
          {product.isNew && !discountPercent && (
            <span className="px-2 py-0.5 rounded text-[10px] font-black text-white" style={{ background: "#16C7D9" }}>
              NEW
            </span>
          )}
        </div>

        {/* Top-right % off chip (like screenshot "36% OFF") */}
        {!showFlashSaleBadge && discountPercent > 0 && (
          <span className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600 bg-white border" style={{ borderColor: "#DCE7F2" }}>
            {discountPercent}% OFF
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={handleAddToWishlist}
          disabled={isAddingToWishlist[product.id]}
          className={cn(
            "absolute z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow",
            discountPercent > 0 ? "top-2.5 right-2.5" : "top-2.5 right-2.5",
            inWishlist ? "bg-red-500 text-white" : "bg-white text-gray-400 hover:text-red-500"
          )}
          style={discountPercent > 0 ? { top: "2.5rem", right: "0.625rem" } : {}}
        >
          {isAddingToWishlist[product.id]
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Heart className={cn("h-3.5 w-3.5", inWishlist && "fill-current")} />}
        </button>

        {/* Product image */}
        <Image
          src={getAllProductImages[currentImageIndex] || "/placeholder.jpg"}
          alt={product.name}
          fill
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Image dots */}
        {getAllProductImages.length > 1 && (
          <div className={cn("absolute bottom-2 inset-x-0 flex justify-center gap-1 transition-opacity duration-300", isHovered ? "opacity-100" : "opacity-0")}>
            {getAllProductImages.map((_, idx) => (
              <div key={idx} className={cn("h-1 rounded-full transition-all duration-300", idx === currentImageIndex ? "w-4 bg-primary" : "w-1 bg-gray-300")} />
            ))}
          </div>
        )}
      </Link>

      {/* ── Info section ── */}
      <div className="flex flex-col flex-1 px-3 pt-3 pb-0">

        {/* Category */}
        <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
          {product.category?.name || "Medicine"}
        </span>

        {/* Name */}
        <Link href={`/products/${product.slug}`} className="block mb-2">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-primary" style={{ color: "#0A2540" }}>
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.avgRating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={cn("w-3 h-3", s <= Math.round(product.avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200")} />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">({product.avgRating})</span>
          </div>
        )}

        {/* Price row */}
        {showPrice ? (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold" style={{ color: "#005EB8" }}>
              {formatCurrency(displayPrice)}
            </span>
            {originalPrice && (
              <span className="text-xs text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
            )}
            {discountPercent > 0 && (
              <span className="text-[10px] font-bold text-green-600">{discountPercent}% off</span>
            )}
          </div>
        ) : (
          <div className="mb-3">
            <Link href="/auth" className="text-xs font-bold text-primary hover:underline">Login for Price</Link>
          </div>
        )}
      </div>

      {/* ── Full-width Add to Cart button ── */}
      <button
        onClick={handleAddToCart}
        disabled={!showPrice || isAddingToCart}
        className="w-full py-3 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 mt-auto"
        style={{
          background: addedToCart
            ? "#16C7D9"
            : isHovered
              ? "linear-gradient(135deg, #0052a3, #0068cc)"
              : "linear-gradient(135deg, #005EB8, #0074e4)",
          borderRadius: "0 0 1rem 1rem",
        }}
      >
        {isAddingToCart ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : addedToCart ? (
          <><Check className="w-4 h-4" /> Added!</>
        ) : (
          <>Add to Cart +</>
        )}
      </button>
    </div>
  );
};

export default ProductCard;
