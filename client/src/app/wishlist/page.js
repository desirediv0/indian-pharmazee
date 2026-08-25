"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/client-only";
import { fetchApi } from "@/lib/utils";
import { Trash2, Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";

export default function WishlistPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/auth?redirect=/wishlist");
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingItems(true);
    fetchApi("/users/wishlist", { credentials: "include" })
      .then((res) => setWishlistItems(res.data?.wishlistItems || []))
      .catch(() => setError("Failed to load wishlist. Please try again."))
      .finally(() => setLoadingItems(false));
  }, [isAuthenticated]);

  const removeFromWishlist = async (wishlistItemId) => {
    try {
      await fetchApi(`/users/wishlist/${wishlistItemId}`, { method: "DELETE", credentials: "include" });
      setWishlistItems((cur) => cur.filter((item) => item.wishlistItemId !== wishlistItemId));
    } catch {
      setError("Failed to remove item. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7FAFC" }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#005EB8", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <ClientOnly>
      <div className="min-h-screen" style={{ background: "#F7FAFC" }}>

        {/* Hero */}
        <section
          className="py-10 md:py-14"
          style={{ background: "linear-gradient(135deg, #0A2540 0%, #005EB8 60%, #0074e4 100%)" }}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(22,199,217,0.15)" }}>
                <Heart className="h-5 w-5" style={{ color: "#16C7D9" }} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">My Wishlist</h1>
            </div>
            {!loadingItems && wishlistItems.length > 0 && (
              <p className="text-white/55 text-sm mt-2 ml-13">
                {wishlistItems.length} saved {wishlistItems.length === 1 ? "medicine" : "medicines"}
              </p>
            )}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 py-10 pb-24">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Loading skeletons */}
          {loadingItems ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border animate-pulse overflow-hidden" style={{ borderColor: "#DCE7F2" }}>
                  <div className="aspect-[9/16]" style={{ background: "#EBF4FF" }} />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-blue-50 rounded w-1/2" />
                  </div>
                  <div className="h-10" style={{ background: "#EBF4FF" }} />
                </div>
              ))}
            </div>
          ) : wishlistItems.length === 0 ? (

            /* Empty state */
            <div
              className="rounded-3xl p-14 text-center max-w-lg mx-auto border"
              style={{ background: "white", borderColor: "#DCE7F2" }}
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(0,94,184,0.06)" }}
              >
                <Heart className="h-10 w-10 opacity-30" style={{ color: "#005EB8" }} />
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: "#0A2540" }}>Wishlist is Empty</h2>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                Save medicines for later. Browse our specialty medicines and tap the heart icon to save them here.
              </p>
              <Link href="/products">
                <Button
                  className="text-white px-8 h-12 rounded-xl font-semibold gap-2"
                  style={{ background: "#005EB8" }}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Browse Medicines
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

          ) : (

            /* Wishlist grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {wishlistItems.map((product) => (
                <div key={product.id} className="relative group">
                  <ProductCard product={product} />
                  <button
                    onClick={(e) => { e.preventDefault(); removeFromWishlist(product.wishlistItemId); }}
                    className="absolute top-10 right-2 z-30 w-7 h-7 bg-white rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 shadow border border-red-100 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

          )}
        </div>
      </div>
    </ClientOnly>
  );
}
