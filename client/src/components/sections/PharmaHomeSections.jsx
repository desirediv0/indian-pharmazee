"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/utils";
import { Stethoscope, Thermometer } from "lucide-react";
import { getPharmaIcon } from "@/lib/pharma-icons";

const WHATSAPP_NUMBER = "919560247619";

// Fallback static categories if API empty
const FALLBACK_CATEGORIES = [
  { name: "IVF Medicines",             slug: "ivf-medicines" },
  { name: "Gynaecology",               slug: "gynaecology" },
  { name: "Anti Cancer",               slug: "anti-cancer" },
  { name: "Antibiotics & Supplements", slug: "antibiotics-supplements" },
  { name: "Transplants",               slug: "transplants" },
  { name: "Sexual Wellness & HGH",     slug: "sexual-wellness-hgh" },
  { name: "Osteoporosis",              slug: "osteoporosis" },
  { name: "Paediatric Care",           slug: "paediatric-care" },
  { name: "Antifungal",                slug: "antifungal" },
  { name: "Anemia Care",               slug: "anemia-care" },
  { name: "Arthritis Care",            slug: "arthritis-care" },
  { name: "Ayurvedic Medicines",       slug: "ayurvedic-medicines" },
];

/* ─────────────────────────────────────────────
   FEATURED CATEGORIES SECTION
───────────────────────────────────────────── */
export function FeaturedCategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/public/categories")
      .then((res) => setCategories((res.data?.categories || []).slice(0, 12)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const displayCats = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <section className="py-14 md:py-16" style={{ background: "#F7FAFC" }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 border"
            style={{ background: "rgba(0,94,184,0.06)", borderColor: "rgba(0,94,184,0.15)", color: "#005EB8" }}
          >
            <Stethoscope className="h-4 w-4" />
            Medicine Categories
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#0A2540" }}>
            Browse by Specialty
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">
            Explore our comprehensive range of specialty medicines and healthcare products.
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white animate-pulse border" style={{ borderColor: "#DCE7F2" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {displayCats.map((cat) => {
              const { Icon, color } = getPharmaIcon(cat.name, cat.slug || "");
              return (
                <Link
                  key={cat.id || cat.slug}
                  href={cat.slug ? `/category/${cat.slug}` : "/products"}
                  className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-center"
                  style={{ borderColor: "#DCE7F2" }}
                >
                  {/* Image or icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-110 flex-shrink-0"
                    style={{ background: `${color}12`, border: `1.5px solid ${color}25` }}
                  >
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        width={56}
                        height={56}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <Icon size={26} style={{ color }} />
                    )}
                  </div>
                  <span
                    className="text-[11px] font-semibold leading-tight line-clamp-2 transition-colors group-hover:text-primary"
                    style={{ color: "#0A2540" }}
                  >
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 transition-all hover:-translate-y-0.5 hover:shadow-md text-sm"
            style={{ borderColor: "#005EB8", color: "#005EB8" }}
          >
            View All Categories
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   COLD CHAIN BANNER
───────────────────────────────────────────── */
export function ColdChainBanner() {
  return (
    <section className="py-12 md:py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div
          className="relative rounded-3xl overflow-hidden p-8 md:p-12 border"
          style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 50%, #E9D5FF 100%)", borderColor: "#D8B4FE", boxShadow: "0 10px 30px rgba(126, 34, 206, 0.05)" }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
            style={{ background: "radial-gradient(circle, #C084FC, transparent)" }} />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-start gap-5 text-left">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.2)" }}
              >
                <Thermometer className="h-8 w-8" style={{ color: "#7E22CE" }} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#5B21B6" }}>
                  Temp-Controlled Delivery Support
                </h3>
                <p className="text-gray-600 leading-relaxed max-w-xl text-sm">
                  Temperature-sensitive medicines shipped safely at{" "}
                  <span className="font-semibold" style={{ color: "#7E22CE" }}>2°C – 8°C</span>{" "}
                  via professional courier partners. IVF medicines, biologics, and specialty products handled with care.
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/products"
                className="px-6 py-3 rounded-xl font-bold text-white text-sm text-center transition-all hover:opacity-90 shadow-md shadow-purple-200"
                style={{ background: "#7E22CE" }}
              >
                Shop Medicines
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl font-bold text-sm text-center transition-all hover:bg-white/80 border"
                style={{ borderColor: "#C084FC", color: "#7E22CE" }}
              >
                Enquire on WhatsApp
              </a>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-8 border-t grid grid-cols-2 sm:grid-cols-4 gap-6" style={{ borderColor: "#E9D5FF" }}>
            {[
              { value: "2°C–8°C", label: "Controlled Temp" },
              { value: "Pan-India", label: "Delivery Coverage" },
              { value: "Genuine", label: "Brand Sourcing" },
              { value: "24/7", label: "WhatsApp Support" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-bold mb-1" style={{ color: "#7E22CE" }}>{value}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FLOATING WHATSAPP
───────────────────────────────────────────── */
export function WhatsAppSticky() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%2C%20I%20want%20to%20know%20more%20about%20your%20medicines.`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-5 z-50 lg:bottom-8 flex items-center gap-3 pl-5 pr-4 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-green-500/30"
      style={{ background: "#25D366" }}
      aria-label="Chat with us on WhatsApp"
    >
      {/* Text */}
      <div className="hidden sm:block text-left leading-tight">
        <p className="text-white text-xs font-black uppercase tracking-wider">Chat With Us</p>
        <p className="text-white/80 text-[10px] font-semibold uppercase tracking-widest">On WhatsApp</p>
      </div>

      {/* whatsapp.png in circle */}
      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        <img
          src="/whatsapp.png"
          alt="WhatsApp"
          className="w-5 h-5 object-contain"
        />
      </div>
    </a>
  );
}
