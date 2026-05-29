"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Plus, Minus, Star, X, CheckCircle, Zap } from "lucide-react";
import { toast } from "sonner";

/* ─────────────────────────────────────────────
   UTIL
───────────────────────────────────────────── */
const getImageUrl = (image) => {
  if (!image) return "/placeholder.jpg";
  if (typeof image === "string" && image.startsWith("http")) return image;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

const calcDiscount = (original, sale) => {
  if (!original || !sale || original <= sale) return 0;
  return Math.round(((original - sale) / original) * 100);
};

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function ProductQuickView({ product, open, onOpenChange }) {
  const { addToCart, loading: cartLoading } = useCart();

  const [selectedFlavorId, setSelectedFlavorId] = useState(null);
  const [selectedWeightId, setSelectedWeightId] = useState(null);
  const [quantity,         setQuantity]         = useState(1);
  const [activeImageIdx,   setActiveImageIdx]   = useState(0);
  const [addSuccess,       setAddSuccess]       = useState(false);

  /* ── Reset when dialog closes ── */
  useEffect(() => {
    if (!open) {
      setQuantity(1);
      setActiveImageIdx(0);
      setAddSuccess(false);
    }
  }, [open]);

  /* ── Parse variants ── */
  const variants = useMemo(() => product?.variants || [], [product]);

  /* ── Unique flavors ── */
  const flavors = useMemo(() => {
    const seen = new Map();
    variants.forEach((v) => {
      if (v.flavor?.id && !seen.has(v.flavor.id)) seen.set(v.flavor.id, v.flavor);
    });
    return [...seen.values()];
  }, [variants]);

  /* ── Unique weights ── */
  const weights = useMemo(() => {
    const seen = new Map();
    variants.forEach((v) => {
      if (v.weight?.id && !seen.has(v.weight.id)) seen.set(v.weight.id, v.weight);
    });
    return [...seen.values()];
  }, [variants]);

  /* ── Default selections on open ── */
  useEffect(() => {
    if (!open || !variants.length) return;
    const first = variants.find((v) => v.isActive !== false && (v.quantity ?? 1) > 0) || variants[0];
    setSelectedFlavorId(first?.flavor?.id ?? null);
    setSelectedWeightId(first?.weight?.id ?? null);
    setActiveImageIdx(0);
  }, [open, variants]);

  /* ── Active variant ── */
  const activeVariant = useMemo(() => {
    if (!variants.length) return null;
    const hasFlavors = flavors.length > 0;
    const hasWeights = weights.length > 0;
    if (hasFlavors && hasWeights)
      return variants.find((v) => v.flavor?.id === selectedFlavorId && v.weight?.id === selectedWeightId) || null;
    if (hasFlavors) return variants.find((v) => v.flavor?.id === selectedFlavorId) || null;
    if (hasWeights) return variants.find((v) => v.weight?.id === selectedWeightId) || null;
    return variants[0];
  }, [variants, selectedFlavorId, selectedWeightId, flavors.length, weights.length]);

  /* ── Is a flavor+weight combo in stock? ── */
  const comboInStock = (fId, wId) =>
    variants.some((v) => v.flavor?.id === fId && v.weight?.id === wId && v.isActive !== false && (v.quantity ?? 1) > 0);

  /* ── Flavor select — auto-adjust weight if needed ── */
  const handleFlavorSelect = (fId) => {
    setSelectedFlavorId(fId);
    if (selectedWeightId && !comboInStock(fId, selectedWeightId)) {
      const next = variants.find((v) => v.flavor?.id === fId && v.isActive !== false && (v.quantity ?? 1) > 0);
      setSelectedWeightId(next?.weight?.id ?? null);
    }
  };

  /* ── Weight select — auto-adjust flavor if needed ── */
  const handleWeightSelect = (wId) => {
    setSelectedWeightId(wId);
    if (selectedFlavorId && !comboInStock(selectedFlavorId, wId)) {
      const next = variants.find((v) => v.weight?.id === wId && v.isActive !== false && (v.quantity ?? 1) > 0);
      setSelectedFlavorId(next?.flavor?.id ?? null);
    }
  };

  /* ── Images: prioritise active variant, fallback to product ── */
  const images = useMemo(() => {
    const list = [];
    const seen = new Set();
    const push = (raw) => {
      const url = getImageUrl(raw?.url || raw);
      if (url && !seen.has(url)) { seen.add(url); list.push(url); }
    };
    if (activeVariant?.images?.length) activeVariant.images.forEach(push);
    product?.images?.forEach(push);
    variants.forEach((v) => v.images?.forEach(push));
    if (!list.length && product?.image) push(product.image);
    if (!list.length) list.push("/placeholder.jpg");
    return list;
  }, [activeVariant, product, variants]);

  useEffect(() => { setActiveImageIdx(0); }, [activeVariant?.id]);

  /* ── Price ── */
  const price        = parseFloat(activeVariant?.salePrice || activeVariant?.price || product?.basePrice || product?.price || 0);
  const originalP    = parseFloat(activeVariant?.price || product?.regularPrice || product?.price || 0);
  const hasDiscount  = originalP > price && price > 0;
  const hasFlashSale = product?.flashSale?.isActive === true;
  const flashPrice   = hasFlashSale ? parseFloat(product.flashSale.flashSalePrice) : null;
  const displayPrice = hasFlashSale && flashPrice ? flashPrice : price;
  const showOriginal = hasFlashSale ? price : (hasDiscount ? originalP : null);
  const discountPct  = calcDiscount(showOriginal, displayPrice);

  /* ── Stock ── */
  const stock   = activeVariant?.quantity ?? null;
  const inStock = stock === null || stock > 0;
  const maxQty  = stock ?? 99;

  const changeQty = (d) => setQuantity((q) => Math.min(Math.max(1, q + d), maxQty));

  /* ── Add to cart ── */
  const handleAddToCart = async () => {
    const variantId = activeVariant?.id || variants[0]?.id;
    if (!variantId) { toast.error("Please select a variant"); return; }
    try {
      await addToCart(variantId, quantity);
      setAddSuccess(true);
      toast.success(`${product.name} added to cart!`);
      setTimeout(() => { setAddSuccess(false); onOpenChange(false); }, 1600);
    } catch (err) {
      toast.error(err?.message || "Failed to add to cart");
    }
  };

  if (!product) return null;

  /* ── Label helpers ── */
  const activeFlavor = flavors.find((f) => f.id === selectedFlavorId);
  const activeWeight = weights.find((w) => w.id === selectedWeightId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 rounded-2xl shadow-2xl overflow-hidden w-[95vw] max-w-[700px] max-h-[92vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        {/* Close btn */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-50 w-7 h-7 rounded-full bg-white/90 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 transition-colors shadow-sm"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex flex-col md:flex-row overflow-y-auto md:overflow-hidden max-h-[92vh]">

          {/* ══ LEFT: Image ══ */}
          <div className="md:w-[44%] bg-gray-50 flex flex-col flex-shrink-0">
            <div className="relative" style={{ aspectRatio: "1 / 1" }}>
              {/* Badge */}
              {hasFlashSale && (
                <span className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-500 text-white shadow-sm">
                  <Zap className="h-2.5 w-2.5" /> FLASH SALE
                </span>
              )}
              {!hasFlashSale && discountPct > 0 && (
                <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-sm">
                  -{discountPct}% OFF
                </span>
              )}

              <Image
                src={images[activeImageIdx]}
                alt={product.name}
                fill
                className="object-contain p-5 transition-opacity duration-200"
                sizes="(max-width: 768px) 95vw, 308px"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 px-3 pb-3 overflow-x-auto">
                {images.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-11 h-11 rounded-lg flex-shrink-0 overflow-hidden border-2 transition-all duration-150 ${
                      idx === activeImageIdx ? "border-primary shadow-sm" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="44px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ══ RIGHT: Info ══ */}
          <div className="flex-1 flex flex-col min-h-0">

            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-[15px] font-bold text-gray-900 leading-snug pr-7 line-clamp-3">
                {product.name}
              </h2>

              {product.avgRating > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(product.avgRating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{product.avgRating} · {product.reviewCount || 0} reviews</span>
                </div>
              )}

              <div className="flex items-baseline gap-2 mt-3">
                <span className={`text-2xl font-bold ${hasFlashSale ? "text-orange-600" : "text-primary"}`}>
                  {formatCurrency(displayPrice)}
                </span>
                {showOriginal && showOriginal > displayPrice && (
                  <span className="text-sm text-gray-400 line-through">{formatCurrency(showOriginal)}</span>
                )}
                {discountPct > 0 && (
                  <span className="text-[10px] font-bold bg-red-50 text-red-500 px-1.5 py-0.5 rounded-md">-{discountPct}%</span>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* ── Flavor ── */}
              {flavors.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Flavor
                    {activeFlavor && (
                      <span className="ml-1.5 text-gray-600 font-medium normal-case tracking-normal">
                        — {activeFlavor.name}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {flavors.map((flavor) => {
                      const available = variants.some(
                        (v) =>
                          v.flavor?.id === flavor.id &&
                          v.isActive !== false &&
                          (v.quantity ?? 1) > 0 &&
                          (weights.length === 0 || !selectedWeightId || v.weight?.id === selectedWeightId)
                      );
                      const active = selectedFlavorId === flavor.id;
                      return (
                        <button
                          key={flavor.id}
                          onClick={() => available && handleFlavorSelect(flavor.id)}
                          disabled={!available}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                            active
                              ? "border-primary bg-blue-50 text-primary shadow-sm"
                              : available
                                ? "border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                                : "border-gray-100 text-gray-300 cursor-not-allowed line-through"
                          }`}
                        >
                          {flavor.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Weight ── */}
              {weights.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Weight
                    {activeWeight && (
                      <span className="ml-1.5 text-gray-600 font-medium normal-case tracking-normal">
                        — {activeWeight.value} {activeWeight.unit}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {weights.map((weight) => {
                      const available = variants.some(
                        (v) =>
                          v.weight?.id === weight.id &&
                          v.isActive !== false &&
                          (v.quantity ?? 1) > 0 &&
                          (flavors.length === 0 || !selectedFlavorId || v.flavor?.id === selectedFlavorId)
                      );
                      const active = selectedWeightId === weight.id;
                      return (
                        <button
                          key={weight.id}
                          onClick={() => available && handleWeightSelect(weight.id)}
                          disabled={!available}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                            active
                              ? "border-primary bg-blue-50 text-primary shadow-sm"
                              : available
                                ? "border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                                : "border-gray-100 text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          {weight.value} {weight.unit}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock */}
              <div>
                {inStock ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
                    {stock !== null ? `In Stock · ${stock} left` : "In Stock"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Description */}
              {(product.shortDescription || product.description) && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 border-t border-gray-50 pt-3">
                  {product.shortDescription || product.description}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-3 flex-shrink-0">

              {/* Quantity */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Qty</span>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => changeQty(-1)} disabled={quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-9 h-8 flex items-center justify-center text-sm font-bold text-gray-900 border-x border-gray-200">
                    {quantity}
                  </span>
                  <button onClick={() => changeQty(1)} disabled={quantity >= maxQty}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                {stock !== null && stock <= 5 && stock > 0 && (
                  <span className="text-[10px] text-orange-500 font-semibold">Only {stock} left!</span>
                )}
              </div>

              {/* CTA buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={cartLoading || addSuccess || !inStock || !activeVariant}
                  className={`flex-1 h-11 rounded-xl font-semibold text-sm gap-2 transition-all ${addSuccess ? "bg-green-600 hover:bg-green-600" : ""}`}
                >
                  {addSuccess ? (
                    <><CheckCircle className="h-4 w-4" /> Added!</>
                  ) : cartLoading ? (
                    <><div className="h-4 w-4 border-2 border-white/60 border-t-white rounded-full animate-spin" /> Adding...</>
                  ) : (
                    <><ShoppingCart className="h-4 w-4" /> Add to Cart</>
                  )}
                </Button>

                <Link href={`/products/${product.slug}`} onClick={() => onOpenChange(false)} className="flex-shrink-0">
                  <Button variant="outline" className="h-11 px-4 rounded-xl text-xs font-medium border-gray-200 hover:border-gray-300 text-gray-700">
                    Full Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}