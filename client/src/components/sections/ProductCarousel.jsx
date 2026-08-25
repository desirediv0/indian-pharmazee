"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Star, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { formatPrice, getCategoryName } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";

export const ProductCarousel = ({ products, title, subtitle, viewAllLink = "/products", badge }) => {
    const { addToCart, isInCart } = useCart();
    const [addedItems, setAddedItems] = useState({});

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product.id, 1);
        setAddedItems(prev => ({ ...prev, [product.id]: true }));
        setTimeout(() => {
            setAddedItems(prev => ({ ...prev, [product.id]: false }));
        }, 1500);
    };

    return (
        <section className="section-padding bg-background">
            <div className="section-container">
                {/* Header */}
                <div className="flex items-end justify-between mb-8">
                    <div>
                        {badge && (
                            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-3">
                                {badge}
                            </span>
                        )}
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-muted-foreground mt-1">{subtitle}</p>
                        )}
                    </div>
                    <Link href={viewAllLink}>
                        <Button variant="outline" className="gap-2 hidden sm:flex">
                            View All
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {/* Carousel */}
                <Carousel
                    opts={{ align: "start", loop: true }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {products.map((product) => (
                            <CarouselItem key={product.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                <div className="group relative bg-card rounded-2xl overflow-hidden card-shadow hover:shadow-2xl transition-all duration-300 border border-border hover:border-primary/30">
                                    {/* Image */}
                                    <Link href={`/products/${product.slug}`}>
                                        <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-24 h-24 bg-muted-foreground/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                    <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                                                </div>
                                            </div>
                                            
                                            {/* Category Badge */}
                                            <div className="absolute top-3 left-3">
                                                <span className="px-2.5 py-1 bg-foreground/90 text-background text-xs font-medium rounded-full backdrop-blur-sm">
                                                    {getCategoryName(product.category)}
                                                </span>
                                            </div>

                                            {/* Quick Add Button on Hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <button
                                                        onClick={(e) => handleAddToCart(e, product)}
                                                        className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                                                            addedItems[product.id] || isInCart(product.id)
                                                                ? "bg-green-500 text-white"
                                                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                                                        }`}
                                                    >
                                                        {addedItems[product.id] ? (
                                                            <>
                                                                <Check className="h-4 w-4" />
                                                                Added!
                                                            </>
                                                        ) : isInCart(product.id) ? (
                                                            <>
                                                                <Check className="h-4 w-4" />
                                                                In Cart
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="h-4 w-4" />
                                                                Quick Add
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Info */}
                                    <div className="p-4">
                                        <Link href={`/products/${product.slug}`}>
                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                {product.name}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                            {product.power && `${product.power}`} {product.size && `• ${product.size}`}
                                        </p>
                                        
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-lg font-bold text-primary">
                                                {formatPrice(product.price)}
                                            </span>
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span className="text-xs font-medium text-muted-foreground">4.5</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden md:flex -left-4 w-10 h-10 bg-card border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary" />
                    <CarouselNext className="hidden md:flex -right-4 w-10 h-10 bg-card border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary" />
                </Carousel>

                {/* Mobile View All */}
                <div className="mt-6 text-center sm:hidden">
                    <Link href={viewAllLink}>
                        <Button variant="outline" className="gap-2">
                            View All
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};
