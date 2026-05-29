"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const OFFERS = [
  {
    image: "/ivf-offer.png",
    title: "IVF Excellence",
    subtitle: "Advanced Fertility Solutions",
    href: "/category/ivf-medicines",
  },
  {
    image: "/womens-health-offer.png",
    title: "Women's Wellness",
    subtitle: "Specialized Healthcare",
    href: "/category/gynaecology",
  },
  {
    image: "/anti-cancer-offer.png",
    title: "Cancer Care",
    subtitle: "Oncology Solutions",
    href: "/category/anti-cancer",
  },
  {
    image: "/wellness-offer.png",
    title: "Wellness Care",
    subtitle: "Daily Health Essentials",
    href: "/products",
  },
];

export default function FeaturedOffers() {
  return (
    <section
      className="w-full"
      style={{
        paddingTop: "60px",
        paddingBottom: "60px",
        background: "#F7FAFC",
      }}
    >
      <div
        className="mx-auto px-4 sm:px-6"
        style={{ maxWidth: "1400px" }}
      >
        {/* Section header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 border"
            style={{
              background: "rgba(0,94,184,0.06)",
              borderColor: "rgba(0,94,184,0.18)",
              color: "#005EB8",
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Exclusive Categories
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 tracking-tight"
            style={{ color: "#0A2540" }}
          >
            Featured Healthcare Offers
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-lg">
            Exclusive healthcare solutions and special categories
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {OFFERS.map((offer) => (
            <Link
              key={offer.title}
              href={offer.href}
              className="group relative rounded-3xl overflow-hidden cursor-pointer block"
              style={{
                boxShadow: "0 4px 20px rgba(0,94,184,0.08)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-8px)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  "0 16px 40px rgba(0,94,184,0.18)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  "0 4px 20px rgba(0,94,184,0.08)";
              }}
            >
              {/* Image */}
              <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-gray-100">
                <Image
                  src={offer.image}
                  alt={offer.title}
                  fill
                  loading="lazy"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.08]"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 350px"
                />

                {/* Bottom gradient overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(10,37,64,0.80) 0%, rgba(10,37,64,0.35) 45%, transparent 70%)",
                  }}
                />

                {/* Text content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-10">
                  <p
                    className="text-white/75 text-[11px] sm:text-xs font-semibold uppercase tracking-widest mb-1"
                    style={{ color: "#16C7D9" }}
                  >
                    {offer.subtitle}
                  </p>
                  <div className="flex items-end justify-between gap-2">
                    <h3 className="text-white font-bold text-base sm:text-lg leading-tight">
                      {offer.title}
                    </h3>
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0"
                      style={{ background: "rgba(22,199,217,0.85)" }}
                    >
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
