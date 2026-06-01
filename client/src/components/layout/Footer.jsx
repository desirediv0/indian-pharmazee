"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Mail, Phone, MapPin, Instagram, Facebook, Youtube,
  ArrowUpRight, Thermometer, ShieldCheck, Truck, BadgeCheck,
} from "lucide-react";
import { fetchApi } from "@/lib/utils";

const WA = "919560247619";

const QUICK_LINKS = [
  { label: "All Medicines", href: "/products" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Why Choose Us", href: "/why-us" },
  { label: "FAQs", href: "/faqs" },
];

const POLICY_LINKS = [
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Return Policy", href: "/return-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use", href: "/terms" },
];

const SPECIALTIES = [
  "IVF Medicines",
  "Oncology / Anti-Cancer",
  "Transplant Medicines",
  "Sexual Wellness & HGH",
  "Paediatric Care",
  "Ayurvedic Medicines",
];

const SOCIALS = [
  { name: "Instagram", href: "https://www.instagram.com/indianpharmazee/", icon: Instagram },
  { name: "Facebook", href: "https://www.facebook.com/indianpharmazee/", icon: Facebook },
  { name: "YouTube", href: "https://youtube.com/@indianpharmazee", icon: Youtube },
];

const TRUST = [
  { icon: BadgeCheck, label: "100% Genuine" },
  { icon: ShieldCheck, label: "Verified Sources" },
  { icon: Thermometer, label: "Cold Chain 2°C–8°C" },
  { icon: Truck, label: "Pan-India Delivery" },
];

export const Footer = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchApi("/public/categories")
      .then((res) => setCategories((res.data?.categories || []).slice(0, 7)))
      .catch(console.error);
  }, []);

  return (
    <footer className="relative overflow-hidden" style={{ background: "#07182e" }}>

      {/* ── Top trust bar ── */}
      <div style={{ background: "linear-gradient(90deg, #005EB8 0%, #0074e4 50%, #005EB8 100%)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-white text-sm font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Decorative glows ── */}
      <div className="absolute top-20 left-0 w-72 h-72 rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ background: "#16C7D9" }} />
      <div className="absolute bottom-20 right-0 w-60 h-60 rounded-full blur-[100px] opacity-8 pointer-events-none" />

      {/* ── Main footer grid ── */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">

          {/* ── Brand col (4 cols) ── */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/logo.png"
                alt="Indian Pharmazee"
                width={180}
                height={60}
                className="h-6 w-auto object-contain "
              />
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-[300px]">
              India&apos;s trusted platform for genuine branded medicines and specialty healthcare products — with professional cold chain delivery across all states.
            </p>

            {/* Contact */}
            <ul className="space-y-3 mb-7">
              <li>
                <a href="mailto:indianpharmazee@gmail.com" className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-blue-600/30" style={{ background: "rgba(0,94,184,0.15)" }}>
                    <Mail className="h-3.5 w-3.5 text-blue-400" />
                  </span>
                  indianpharmazee@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+919560247619" className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-blue-600/30" style={{ background: "rgba(0,94,184,0.15)" }}>
                    <Phone className="h-3.5 w-3.5 text-blue-400" />
                  </span>
                  +91 95602 47619
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${WA}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-sm text-green-400 hover:text-green-300 transition-colors"
                >
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-green-600/20" style={{ background: "rgba(37,211,102,0.12)" }}>
                    <svg className="h-3.5 w-3.5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </span>
                  Message us on WhatsApp
                </a>
              </li>
            </ul>

            {/* Socials */}
            <div className="flex gap-2.5">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,94,184,0.3)"; e.currentTarget.style.borderColor = "rgba(0,94,184,0.5)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                >
                  <s.icon className="h-4 w-4 text-slate-400" />
                </a>
              ))}
            </div>
          </div>

          {/* ── Categories col (3 cols) ── */}
          <div className="lg:col-span-3">
            <FooterHeading>Medicine Categories</FooterHeading>
            <ul className="space-y-2.5">
              {(categories.length > 0 ? categories.map(c => ({ label: c.name, href: `/category/${c.slug}` })) : SPECIALTIES.map(s => ({ label: s, href: "/products" }))).map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    <span className="w-1 h-1 rounded-full flex-shrink-0 group-hover:scale-150 transition-transform" style={{ background: "#16C7D9" }} />
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: "#16C7D9" }}
                >
                  View All <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Quick Links col (2 cols) ── */}
          <div className="lg:col-span-2">
            <FooterHeading>Quick Links</FooterHeading>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                    <span className="w-1 h-1 rounded-full flex-shrink-0 group-hover:scale-150 transition-transform" style={{ background: "#16C7D9" }} />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Policies + Payments col (3 cols) ── */}
          <div className="lg:col-span-3">
            <FooterHeading>Policies</FooterHeading>
            <ul className="space-y-2.5 mb-8">
              {POLICY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                    <span className="w-1 h-1 rounded-full flex-shrink-0 group-hover:scale-150 transition-transform" style={{ background: "#16C7D9" }} />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <FooterHeading>We Accept</FooterHeading>
            <div className="flex flex-wrap gap-2 mt-3">
              {["UPI", "Visa", "Mastercard", "COD", "Net Banking", "Razorpay"].map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {m}
                </span>
              ))}
            </div>

            {/* Cold chain badge */}
            <div
              className="mt-6 p-4 rounded-2xl border flex items-start gap-3"
              style={{ background: "rgba(22,199,217,0.05)", borderColor: "rgba(22,199,217,0.2)" }}
            >
              <Thermometer className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#16C7D9" }} />
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "#16C7D9" }}>Cold Chain Delivery</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Temperature-sensitive products shipped at 2°C–8°C via professional courier partners.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(22,199,217,0.15) 50%, rgba(255,255,255,0.08) 70%, transparent)" }} />

      {/* ── Bottom bar ── */}
      <div className="max-w-7xl mx-auto px-6 py-5 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} <span className="text-slate-500 font-medium">Indian Pharmazee</span>. All rights reserved.
          </p>
          <p className="text-xs text-slate-700 text-center">
            Prescription medicines require a valid prescription. Always consult a qualified physician.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="text-xs text-slate-600 hover:text-slate-300 transition-colors">Privacy</Link>
            <span className="text-slate-800 text-xs">·</span>
            <Link href="/terms" className="text-xs text-slate-600 hover:text-slate-300 transition-colors">Terms</Link>
            <span className="text-slate-800 text-xs">·</span>
            <Link href="/shipping-policy" className="text-xs text-slate-600 hover:text-slate-300 transition-colors">Shipping</Link>
          </div>
        </div>
      </div>

    </footer>
  );
};

function FooterHeading({ children }) {
  return (
    <p
      className="text-[11px] font-bold tracking-[0.16em] uppercase mb-5"
      style={{ color: "#16C7D9" }}
    >
      {children}
    </p>
  );
}

export default Footer;
