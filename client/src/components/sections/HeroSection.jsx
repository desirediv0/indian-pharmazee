"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/utils";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";



const FALLBACK_SLIDES = [
  {
    img: "/fallback.png",
    smimg: "/fallback.png",
    ctaLink: "/products",
  },
  {
    img: "/fallback-2.jpeg",
    smimg: "/fallback-2.jpeg",
    ctaLink: "/products",
  },

];

export default function HeroSection() {
  const router = useRouter();

  const [api, setApi] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [side1, setSide1] = useState(null);
  const [side2, setSide2] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreen();

    window.addEventListener("resize", checkScreen);

    return () => {
      window.removeEventListener("resize", checkScreen);
    };
  }, []);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetchApi("/public/banners");

        const banners = response?.data?.banners;

        if (Array.isArray(banners)) {
          // Filter main banners
          const mainBanners = banners.filter(b => b.type === "MAIN" || !b.type);
          if (mainBanners.length > 0) {
            setSlides(
              mainBanners.map((banner) => ({
                img: banner.desktopImage,
                smimg: banner.mobileImage || banner.desktopImage,
                ctaLink: banner.link || "/products",
              }))
            );
          } else {
            setSlides(FALLBACK_SLIDES);
          }

          // Find side_1 and side_2
          const side1Banner = banners.find(b => b.type === "SIDE_1");
          const side2Banner = banners.find(b => b.type === "SIDE_2");

          if (side1Banner) {
            setSide1({
              img: side1Banner.desktopImage,
              smimg: side1Banner.mobileImage || side1Banner.desktopImage,
              ctaLink: side1Banner.link || "/products",
              showOnMobile: side1Banner.showOnMobile !== false,
            });
          } else {
            setSide1(null);
          }

          if (side2Banner) {
            setSide2({
              img: side2Banner.desktopImage,
              smimg: side2Banner.mobileImage || side2Banner.desktopImage,
              ctaLink: side2Banner.link || "/products",
              showOnMobile: side2Banner.showOnMobile !== false,
            });
          } else {
            setSide2(null);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (!api || !autoplay) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api, autoplay]);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };

    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const handleBannerClick = (link) => {
    router.push(link || "/products");
  };

  if (isLoading) {
    return (
      <section className="w-full py-6">
        <div className="max-w-[1650px] mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-4">

            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="h-[250px] rounded-2xl bg-gray-100 animate-pulse" />
              <div className="h-[250px] rounded-2xl bg-gray-100 animate-pulse" />
            </div>

            <div className="lg:col-span-8">
              <div className="h-[516px] rounded-2xl bg-gray-100 animate-pulse" />
            </div>

          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-4">
      <div className="max-w-[1600px] mx-auto px-3 lg:px-6">
        <section className="w-full py-6 bg-white">
          <div className="max-w-[1650px] mx-auto px-4">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* LEFT STATIC BANNERS */}
              <div className="lg:col-span-4 flex flex-col gap-4">

                <div 
                  className={`relative aspect-[16/9] w-full overflow-hidden rounded-2xl ${side1 ? 'cursor-pointer' : ''} ${side1 && !side1.showOnMobile ? 'hidden lg:block' : ''}`}
                  onClick={() => side1 && handleBannerClick(side1.ctaLink)}
                >
                  <Image
                    src={side1 ? (isMobile ? side1.smimg : side1.img) : "/left-banner-1.jpeg"}
                    alt="Medicine Banner"
                    fill
                    priority
                    className="object-fill"
                  />
                </div>

                <div 
                  className={`relative aspect-[16/9] w-full overflow-hidden rounded-2xl ${side2 ? 'cursor-pointer' : ''} ${side2 && !side2.showOnMobile ? 'hidden lg:block' : ''}`}
                  onClick={() => side2 && handleBannerClick(side2.ctaLink)}
                >
                  <Image
                    src={side2 ? (isMobile ? side2.smimg : side2.img) : "/left-banner-2.jpeg"}
                    alt="Quality Banner"
                    fill
                    priority
                    className="object-fill"
                  />
                </div>

              </div>

              {/* RIGHT API SLIDER */}
              <div className="lg:col-span-8">

                <Carousel
                  setApi={setApi}
                  opts={{
                    loop: true,
                    align: "start",
                  }}
                  className="w-full relative aspect-[16/9] rounded-2xl overflow-hidden"
                >
                  <CarouselContent className="h-full">

                    {slides.map((slide, index) => (
                      <CarouselItem key={index} className="h-full">
                        <div
                          onClick={() =>
                            handleBannerClick(slide.ctaLink)
                          }
                          className="
                    relative
                    w-full
                    h-full
                    cursor-pointer
                  "
                        >
                          <Image
                            src={
                              isMobile
                                ? slide.smimg
                                : slide.img
                            }
                            alt={`Banner ${index + 1}`}
                            fill
                            priority={index === 0}
                            sizes="100vw"
                            className="object-fill"
                          />
                        </div>
                      </CarouselItem>
                    ))}

                  </CarouselContent>

                  <CarouselPrevious
                    className="
              hidden lg:flex
              left-4
              z-20
              bg-white
              shadow-lg
              border-0
            "
                  />

                  <CarouselNext
                    className="
              hidden lg:flex
              right-4
              z-20
              bg-white
              shadow-lg
              border-0
            "
                  />

                  {/* DOTS */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          api?.scrollTo(index)
                        }
                        className={`transition-all rounded-full ${currentSlide === index
                          ? "w-8 h-2 bg-[#6c63ff]"
                          : "w-2 h-2 bg-gray-300"
                          }`}
                      />
                    ))}
                  </div>

                </Carousel>

              </div>

            </div>

          </div>
        </section>
      </div>
    </section>
  );
}