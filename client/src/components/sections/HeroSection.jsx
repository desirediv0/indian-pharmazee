"use client";

import { useEffect, useState } from "react";
import { getImageProps } from "next/image";
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

const toSlide = (banner) => ({
  img: banner.desktopImage,
  smimg: banner.mobileImage || banner.desktopImage,
  ctaLink: banner.link || "/products",
  showOnMobile: banner.showOnMobile !== false,
});

// Turn the banners from the API into the main slides + the two side banners
function parseBanners(banners) {
  const list = Array.isArray(banners) ? banners : [];

  const main = list.filter((b) => b.type === "MAIN" || !b.type);
  const side1 = list.find((b) => b.type === "SIDE_1");
  const side2 = list.find((b) => b.type === "SIDE_2");

  return {
    slides: main.length > 0 ? main.map(toSlide) : FALLBACK_SLIDES,
    side1: side1 ? toSlide(side1) : null,
    side2: side2 ? toSlide(side2) : null,
  };
}

/**
 * One banner with a separate image for phones and for larger screens.
 * A <picture> lets the browser pick the right file straight from the HTML,
 * so a phone never downloads the desktop image first (and the image can
 * start loading before any JavaScript has run).
 */
function BannerPicture({ desktopSrc, mobileSrc, alt, sizes, priority = false, className }) {
  const options = { alt, fill: true, sizes, priority };
  const { props: desktop } = getImageProps({ ...options, src: desktopSrc });
  const { props: mobile } = getImageProps({ ...options, src: mobileSrc });
  const { srcSet: mobileSrcSet, ...imgProps } = mobile;

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktop.srcSet} />
      <source media="(max-width: 767px)" srcSet={mobileSrcSet} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...imgProps} alt={alt} className={className} />
    </picture>
  );
}

export default function HeroSection({ initialBanners = null }) {
  const router = useRouter();

  const [api, setApi] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState(() =>
    initialBanners
      ? parseBanners(initialBanners)
      : { slides: FALLBACK_SLIDES, side1: null, side2: null }
  );
  // The server already supplied the banners: nothing to wait for
  const [isLoading, setIsLoading] = useState(!initialBanners);
  const [autoplay] = useState(true);

  const { slides, side1, side2 } = banners;

  // Only needed when the server could not load the banners
  useEffect(() => {
    if (initialBanners) return;

    const fetchBanners = async () => {
      try {
        const response = await fetchApi("/public/banners");
        if (Array.isArray(response?.data?.banners)) {
          setBanners(parseBanners(response.data.banners));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, [initialBanners]);

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
    if (!link) {
      router.push("/products");
      return;
    }
    if (link.startsWith("http://") || link.startsWith("https://")) {
      window.location.href = link;
    } else {
      router.push(link);
    }
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
                  className={`relative aspect-[16/9] w-full overflow-hidden rounded-2xl ${side1 ? 'cursor-pointer' : ''} ${(!side1 || !side1.showOnMobile) ? 'hidden lg:block' : ''}`}
                  onClick={() => side1 && handleBannerClick(side1.ctaLink)}
                >
                  <BannerPicture
                    desktopSrc={side1 ? side1.img : "/left-banner-1.jpeg"}
                    mobileSrc={side1 ? side1.smimg : "/left-banner-1.jpeg"}
                    alt="Medicine Banner"
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-fill"
                  />
                </div>

                <div
                  className={`relative aspect-[16/9] w-full overflow-hidden rounded-2xl ${side2 ? 'cursor-pointer' : ''} ${(!side2 || !side2.showOnMobile) ? 'hidden lg:block' : ''}`}
                  onClick={() => side2 && handleBannerClick(side2.ctaLink)}
                >
                  <BannerPicture
                    desktopSrc={side2 ? side2.img : "/left-banner-2.jpeg"}
                    mobileSrc={side2 ? side2.smimg : "/left-banner-2.jpeg"}
                    alt="Quality Banner"
                    sizes="(min-width: 1024px) 33vw, 100vw"
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
                          {/* Only the first slide is on screen at load: it is the page's
                              main image, so it is fetched with high priority. */}
                          <BannerPicture
                            desktopSrc={slide.img}
                            mobileSrc={slide.smimg}
                            alt={`Banner ${index + 1}`}
                            sizes="(min-width: 1024px) 66vw, 100vw"
                            priority={index === 0}
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
                        aria-label={`Go to banner ${index + 1}`}
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
