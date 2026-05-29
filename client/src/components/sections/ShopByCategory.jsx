"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const categories = [
  {
    name: "Amplifier",
    slug: "amplifier",
    description: "Professional sound systems",
    image: "/GenuineGrocery.jpg",
    products: "25+ Products"
  },
  {
    name: "Crossover Network",
    slug: "crossover-network",
    description: "Power-packed performance",
    image: "/hero-slide-1.png",
    products: "15+ Products"
  },
  {
    name: "Driver Unit",
    slug: "driver-unit",
    description: "Public address systems",
    image: "/hero-slide-2.jpg",
    products: "20+ Products"
  },
  {
    name: "Megaphone",
    slug: "megaphone",
    description: "High-power amplification",
    image: "/hero-slide-3.png",
    products: "30+ Products"
  },
  {
    name: "Mixer",
    slug: "mixer",
    description: "Next-gen technology",
    image: "/GenuineGrocery.jpg",
    products: "12+ Products"
  },
  {
    name: "NEO Speaker",
    slug: "neo-speaker",
    description: "Portable solutions",
    image:  "/hero-slide-1.png",
    products: "18+ Products"
  }
];

export const ShopByCategory = () => {
  return (
    <section className="section-padding bg-white">
      <div className="section-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-2">
              Shop by Category
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Find Your Sound
            </h2>
          </div>
          <Link 
            href="/products" 
            className="inline-flex items-center gap-2 text-foreground font-medium hover:text-primary transition-colors group"
          >
            View All Products
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className={`group relative overflow-hidden rounded-2xl bg-muted ${
                index === 0 ? 'col-span-2 lg:col-span-1 aspect-[2/1] lg:aspect-square' : 'aspect-square'
              }`}
            >
              {/* Background Image */}
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                <p className="text-white/70 text-sm font-medium mb-1">
                  {category.products}
                </p>
                <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-1">
                  {category.name}
                </h3>
                <p className="text-white/80 text-sm hidden md:block">
                  {category.description}
                </p>
                
                {/* Arrow */}
                <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-5 w-5 text-white" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
