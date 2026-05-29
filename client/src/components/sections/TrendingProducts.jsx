"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/utils";
import { ProductCard } from "@/components/products/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

// Skeleton loader
const ProductSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden animate-pulse border border-gray-100">
    <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200"></div>
    <div className="p-4">
      <div className="h-3 w-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
      <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
      <div className="h-4 w-3/4 mx-auto bg-gray-100 rounded mb-3"></div>
      <div className="h-6 w-20 bg-gray-200 rounded-full mx-auto"></div>
    </div>
  </div>
);

export const TrendingProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [api, setApi] = useState(null);

  // Auto-scroll carousel every 2.5 seconds
  useEffect(() => {
    if (!api) return;

    const scrollInterval = setInterval(() => {
      api.scrollNext();
    }, 2500);

    return () => clearInterval(scrollInterval);
  }, [api]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Try trending type first
        let response = await fetchApi("/public/products/type/trending?limit=12");

        if (!response?.data?.products?.length) {
          // Fallback to recent products
          response = await fetchApi("/public/products?sort=createdAt&order=desc&limit=12");
        }

        setProducts(response?.data?.products || []);
      } catch (err) {
        console.error("Error fetching trending products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (error) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-10 md:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-3">
              <TrendingUp className="w-4 h-4" />
              Trending Now
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Popular This Week</h2>
            <p className="text-gray-600 max-w-xl mx-auto text-sm">What professionals are buying right now</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-3">
            <TrendingUp className="w-4 h-4" />
            Trending Now
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Popular This Week</h2>
          <p className="text-gray-600 max-w-xl mx-auto text-sm">What professionals are buying right now</p>
        </div>

        {/* Products Carousel */}
        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {products.map((product, index) => (
                <CarouselItem
                  key={product.id || product.slug || index}
                  className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 py-4"
                >
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation Controls */}
            <CarouselPrevious className="absolute -left-2 md:left-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-white hover:bg-white hover:text-primary border-gray-200 text-gray-700 shadow-lg z-10" />
            <CarouselNext className="absolute -right-2 md:right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-white hover:bg-white hover:text-primary border-gray-200 text-gray-700 shadow-lg z-10" />
          </Carousel>
        </div>

        {/* View All Button */}
        <div className="text-center mt-6">
          <Link href="/products?productType=trending">
            <Button
              variant="outline"
              size="lg"
              className="font-medium border-primary text-primary hover:bg-primary hover:text-white group rounded-full px-8"
            >
              View All Trending
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TrendingProducts;
