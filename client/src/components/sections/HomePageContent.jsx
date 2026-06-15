"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/utils";
import Headtext from "@/components/ui/headtext";
import BrandCarousel from "@/components/sections/BrandCarousel";
import { ProductCard } from "@/components/products/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Image from "next/image";

/* ─────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────── */
const ProductSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden animate-pulse border border-gray-100">
    <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200" />
    <div className="p-4 space-y-2">
      <div className="h-3 w-16 bg-gray-200 rounded-full mx-auto" />
      <div className="h-4 w-full bg-gray-100 rounded" />
      <div className="h-4 w-3/4 mx-auto bg-gray-100 rounded" />
      <div className="h-6 w-20 bg-gray-200 rounded-full mx-auto" />
    </div>
  </div>
);

/* ─────────────────────────────────────
   REUSABLE PRODUCTS CAROUSEL
───────────────────────────────────── */
function FeaturedProductsCarousel({ products, isLoading }) {
  const [api, setApi] = useState(null);

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => api.scrollNext(), 3000);
    return () => clearInterval(interval);
  }, [api]);

  if (!isLoading && products.length === 0) return null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
        {[...Array(5)].map((_, i) => <ProductSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="relative mt-3">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {products.map((product, index) => (
            <CarouselItem
              key={product.id || product.slug || index}
              className="pl-3 basis-1/2 md:basis-1/4 lg:basis-1/6 py-2"
            >
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute -left-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-white border-gray-200 shadow-md hover:bg-primary hover:text-white hover:border-primary transition-all z-10" />
        <CarouselNext className="absolute -right-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-white border-gray-200 shadow-md hover:bg-primary hover:text-white hover:border-primary transition-all z-10" />
      </Carousel>
    </div>
  );
}

/* ─────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────── */
export default function HomePageContent() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState({
    featured: [],
    latest: [],
    bestseller: [],
    trending: [],
    new: [],
    protein: [],
    gainer: [],
    preWorkout: [],
    postWorkout: [],
    amino: [],
    creatine: [],
    fatBurner: [],
    vitamin: [],
    snack: [],
    drink: [],
    combo: [],
    elite: [],
  });

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const endpoints = [
          { key: "featured", url: "/public/products/type/featured?limit=12" },
          { key: "latest", url: "/public/products/type/latest?limit=12" },
          { key: "bestseller", url: "/public/products/type/bestseller?limit=12" },
          { key: "trending", url: "/public/products/type/trending?limit=12" },
          { key: "new", url: "/public/products/type/new?limit=12" },
        ];

        const results = await Promise.allSettled(
          endpoints.map(({ url }) => fetchApi(url))
        );

        const updated = { ...products };
        results.forEach((result, index) => {
          const key = endpoints[index].key;
          if (result.status === "fulfilled") {
            updated[key] = result.value?.data?.products || [];
          }
        });
        setProducts(updated);
      } catch (err) {
        console.error("Error fetching home products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderSection = (key, title, description, bgClass = "bg-white") => {
    const sectionProducts = products[key];
    if (!loading && sectionProducts.length === 0) return null;

    return (
      <section className={`py-8 md:py-10 ${bgClass}`} style={{ borderBottom: "1px solid #DCE7F2" }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-6">
            <div>
              <Headtext text={title} />
              <p className="text-gray-500 text-sm mt-3 max-w-xl">{description}</p>
            </div>
          </div>
          <FeaturedProductsCarousel products={sectionProducts} isLoading={loading} />
        </div>
      </section>
    );
  };

  return (
    <>
      {/* FEATURED MEDICINES */}
      {renderSection(
        "featured",
        "FEATURED MEDICINES",
        "Handpicked genuine branded medicines across specialty healthcare segments",
        "bg-white"
      )}

      {/* BRANDS */}
      <BrandCarousel tag="HOT" title="TRUSTED BRANDS" />

      {/* LATEST */}
      {renderSection(
        "latest",
        "LATEST ADDITIONS",
        "Newly added specialty medicines and healthcare products",
        "bg-white"
      )}
      <div className="max-w-7xl mx-auto px-4">
        <Image src="/banner-1.svg" alt="Temp-Controlled Delivery" width={1200} height={400} className="w-full h-auto rounded-lg my-8 " />
      </div>


      {/* BEST SELLERS */}
      {renderSection(
        "bestseller",
        "BEST SELLERS",
        "Most ordered medicines trusted by patients across India",
        "bg-white"
      )}



      {/* TRENDING */}
      {renderSection(
        "trending",
        "TRENDING NOW",
        "Most enquired medicines and healthcare products this week",
        "bg-white"
      )}


      {/* NEW BRANDS */}
      <BrandCarousel tag="NEW" title="NEW BRANDS" />

      {/* NEW ARRIVALS */}
      {renderSection(
        "new",
        "NEW ARRIVALS",
        "Fresh stock of specialty medicines just added to our platform",
        "bg-white"
      )}
    </>
  );
}
