"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function normalizeSlide(slide) {
  return {
    img: slide.img || slide.desktopImage || "",
    smimg: slide.smimg || slide.mobileImage || slide.desktopImage || slide.img || "",
    title: slide.title || slide.headline || "",
    subtitle: slide.subtitle || slide.subheadline || "",
    ctaLink: slide.ctaLink || slide.link || "/products",
  };
}

function bannerToSlide(banner) {
  return normalizeSlide({
    img: banner.desktopImage || "",
    smimg: banner.mobileImage || banner.desktopImage || "",
    title: banner.title || "",
    subtitle: banner.subtitle || "",
    ctaLink: banner.link || "/products",
  });
}

/* ─────────────────────────────────────────────
   FALLBACK DATA
   Desktop → 1600 × 700  (aspect 16/7)
   Mobile  → 800  × 1000 (aspect 4/5)
───────────────────────────────────────────── */
const FALLBACK_SLIDES = [
  {
    img: "/banner-1.svg",
    smimg: "/banner-sm1.svg",
    title: "Trusted Specialty Medicines Across India",
    subtitle: "Genuine branded medicines · IVF · Oncology · Transplant · Temp-Controlled",
    ctaLink: "/products",
  },
  {
    img: "/banner-2.svg",
    smimg: "/banner-sm2.svg",
    title: "Temp-Controlled Delivery Ready",
    subtitle: "Temperature-sensitive medicines shipped at 2°C–8°C pan-India",
    ctaLink: "/products",
  },
];

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function HeroSection() {
  const [api, setApi] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  /* ── Responsive check ── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Fetch banners ── */
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetchApi("/public/banners");
        const bannersArray = response?.data?.banners;
        if (Array.isArray(bannersArray) && bannersArray.length > 0) {
          setSlides(bannersArray.map(bannerToSlide));
        }
      } catch (err) {
        console.error("Error fetching banners:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanners();
  }, []);

  /* ── Autoplay ── */
  useEffect(() => {
    if (!api || !autoplay) return;
    const interval = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [api, autoplay]);

  /* ── Dot sync ── */
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => api.off("select", onSelect);
  }, [api]);

  const handleSlideClick = (ctaLink) => router.push(ctaLink || "/products");

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="relative w-full overflow-hidden">
        {/* Desktop skeleton: 19/4 | Mobile skeleton: 20/9 */}
        <div className="w-full aspect-[20/9] md:aspect-[19/5] animate-pulse flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EBF4FF, #F0FAFC)" }}>
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#005EB8", borderTopColor: "transparent" }} />
        </div>
      </div>
    );
  }

  if (slides.length === 0) return null;

  return (
    <div className="w-full flex justify-center py-3">
      <div className="w-[85%] relative overflow-hidden rounded-2xl">
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: "start" }}
          className="w-full"
        >
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={index} className="p-0">
                <div
                  className="
relative
w-full
cursor-pointer
overflow-hidden
h-[260px]
sm:h-[320px]
md:h-[420px]
"
                  onClick={() => handleSlideClick(slide.ctaLink)}
                >
                  <Image
                    src={isMobile ? slide.smimg : slide.img}
                    alt={slide.title || `Slide ${index + 1}`}
                    fill
                    className="object-cover object-center
                             transition-transform duration-[2000ms] group-hover:scale-110"
                    priority={index === 0}
                    sizes="(max-width: 767px) 1000px, 1900px"
                  />

                  {/* Text Overlay */}
                  {/* <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex items-center">
                  <div className="section-container w-full">
                    <div className="max-w-2xl text-white">
                      <div className="overflow-hidden mb-2">
                        <p className="text-primary font-bold uppercase tracking-[0.2em] text-xs md:text-sm animate-slide-up opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards]">
                          {index === 0 ? "Pure & Fresh" : "Farm to Table"}
                        </p>
                      </div>
                      <div className="overflow-hidden mb-4 md:mb-6">
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] animate-slide-up opacity-0 [animation-delay:400ms] [animation-fill-mode:forwards]">
                          {slide.title}
                        </h2>
                      </div>
                      <div className="overflow-hidden mb-8 md:mb-10">
                        <p className="text-base md:text-xl text-white/80 leading-relaxed max-w-lg animate-slide-up opacity-0 [animation-delay:600ms] [animation-fill-mode:forwards]">
                          {slide.subtitle}
                        </p>
                      </div>
                      <div className="animate-slide-up opacity-0 [animation-delay:800ms] [animation-fill-mode:forwards]">
                        <button className="group/btn relative px-8 py-4 bg-primary text-white font-bold rounded-xl overflow-hidden transition-all hover:pr-12">
                          <span className="relative z-10">Explore Products</span>
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/btn:opacity-100 transition-all duration-300">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div> */}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* ── Arrows (desktop only) ── */}
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex
                                     h-10 w-10 z-30
                                     bg-white/20 hover:bg-white/50 border-white/30
                                     text-white backdrop-blur-sm transition-all" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex
                                     h-10 w-10 z-30
                                     bg-white/20 hover:bg-white/50 border-white/30
                                     text-white backdrop-blur-sm transition-all" />

          {/* ── Dot indicators ── */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`rounded-full transition-all duration-300 ${index === currentSlide
                  ? "w-6 h-2 bg-white shadow-md"
                  : "w-2 h-2 bg-white/50 hover:bg-white/80"
                  }`}
              />
            ))}
          </div>

          {/* ── Autoplay toggle (desktop only) ── */}
          <button
            onClick={() => setAutoplay((p) => !p)}
            aria-label={autoplay ? "Pause slideshow" : "Play slideshow"}
            className="absolute top-3 right-3 z-30 hidden md:flex
                     items-center justify-center h-8 w-8 rounded-full
                     bg-black/25 hover:bg-black/45 text-white
                     backdrop-blur-sm transition-all"
          >
            {autoplay ? (
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <rect x="3" y="2" width="4" height="12" rx="1" />
                <rect x="9" y="2" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
              </svg>
            )}
          </button>
        </Carousel>
      </div>
    </div>
  );
}