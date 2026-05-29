"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, formatCurrency } from "@/lib/utils";
import { Clock, Zap, ChevronRight, Loader2, Flame, Timer, ShoppingBag, Sparkles, ArrowRight } from "lucide-react";

const getImageUrl = (image) => {
    if (!image) return "/placeholder.jpg";
    if (image.startsWith("http")) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

const CountdownTimer = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(endTime).getTime() - new Date().getTime();
            if (difference > 0) {
                return {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / (1000 * 60)) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [endTime]);

    const TimeBlock = ({ value, label }) => (
        <div className="flex flex-col items-center">
            <div className="bg-white text-gray-900 rounded-xl px-4 py-3 min-w-[60px] shadow-sm border border-gray-100 group-hover:border-primary/30 transition-colors">
                <span className="text-2xl md:text-3xl font-black font-mono text-gray-900">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
            <span className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">{label}</span>
        </div>
    );

    return (
        <div className="flex items-center gap-3">
            {timeLeft.days > 0 && (
                <>
                    <TimeBlock value={timeLeft.days} label="Days" />
                    <span className="text-2xl font-bold text-primary/30 mb-6">:</span>
                </>
            )}
            <TimeBlock value={timeLeft.hours} label="Hours" />
            <span className="text-2xl font-bold text-primary/30 mb-6">:</span>
            <TimeBlock value={timeLeft.minutes} label="Mins" />
            <span className="text-2xl font-bold text-primary/30 mb-6">:</span>
            <TimeBlock value={timeLeft.seconds} label="Secs" />
        </div>
    );
};

const FlashSaleProductCard = ({ product, discountPercentage }) => {
    return (
        <Link href={`/products/${product.slug}`} className="group block h-full">
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 h-full border border-gray-100 flex flex-col group-hover:-translate-y-2">
                {/* Discount Badge */}
                <div className="absolute top-4 left-4 z-10">
                    <div className="bg-orange-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 fill-white animate-pulse" />
                        <span className="text-sm font-black italic">{discountPercentage}% OFF</span>
                    </div>
                </div>

                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden bg-gray-50 p-4">
                    <Image
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        fill
                        className="object-contain p-6 group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                        <div className="bg-white text-primary px-6 py-3 rounded-xl font-bold shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <ShoppingBag className="w-5 h-5" />
                            Grab Deal
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 line-clamp-2 text-base mb-4 group-hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                    
                    <div className="mt-auto">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl font-black text-primary">
                                {formatCurrency(product.salePrice)}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                                {formatCurrency(product.priceBeforeFlashSale || product.originalPrice)}
                            </span>
                        </div>
                        
                        {/* Savings */}
                        <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-3 py-1 rounded-lg text-xs font-bold w-fit">
                            <Sparkles className="w-3 h-3" />
                            Save {formatCurrency((product.priceBeforeFlashSale || product.originalPrice) - product.salePrice)}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export function FlashSaleSection() {
    const [flashSales, setFlashSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFlashSales = async () => {
            try {
                setLoading(true);
                const response = await fetchApi("/public/flash-sales");
                if (response.success && response.data.flashSales?.length > 0) {
                    setFlashSales(response.data.flashSales);
                }
            } catch (err) {
                console.error("Error fetching flash sales:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFlashSales();
    }, []);

    if (loading) {
        return (
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                </div>
            </section>
        );
    }

    if (!flashSales.length || error) return null;

    const currentSale = flashSales[0];

    return (
        <section className="py-24 bg-gray-50 relative overflow-hidden">
            {/* Background Aesthetics */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(22,163,74,0.05),transparent_50%)]" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.05),transparent_50%)]" />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-12 mb-20">
                    <div className="text-center lg:text-left max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[11px] font-bold uppercase tracking-wider mb-6 animate-bounce">
                            <Zap className="w-3.5 h-3.5 fill-orange-600" />
                            Flash Sale Live Now
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
                            Limited Time <br />
                            <span className="text-primary italic">Nutrition Deals.</span>
                        </h2>
                        <p className="text-gray-500 text-lg">
                            Freshness is fleet! Grab these exclusive discounts on your daily favorites before they expire.
                        </p>
                    </div>

                    {/* Timer */}
                    <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-primary/5 border border-gray-100 flex flex-col items-center gap-6 group hover:border-primary/20 transition-all duration-500">
                        <div className="flex items-center gap-3">
                            <Timer className="w-6 h-6 text-orange-500" />
                            <span className="font-black text-gray-900 tracking-tight">SALE ENDS IN:</span>
                        </div>
                        <CountdownTimer endTime={currentSale.endTime} />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                    {currentSale.products.slice(0, 10).map((product) => (
                        <FlashSaleProductCard
                            key={product.id}
                            product={product}
                            discountPercentage={currentSale.discountPercentage}
                        />
                    ))}
                </div>

                {/* CTA */}
                {currentSale.products.length > 5 && (
                    <div className="text-center mt-16">
                        <Link
                            href="/products?flashSale=true"
                            className="inline-flex items-center gap-4 bg-gray-900 hover:bg-primary text-white px-10 py-5 rounded-xl font-black text-lg transition-all duration-500 shadow-xl shadow-gray-900/10 hover:shadow-primary/20 hover:-translate-y-1"
                        >
                            View All Flash Deals
                            <ArrowRight className="w-6 h-6" />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}

export default FlashSaleSection;
