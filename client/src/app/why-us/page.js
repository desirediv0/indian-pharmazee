import {
  BadgeCheck, Thermometer, Truck, ShieldCheck,
  HeartHandshake, IndianRupee, Star, ArrowRight,
  FlaskConical, Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Why Choose Us | Indian Pharmazee — Trusted Specialty Medicines",
  description: "Discover why patients and doctors across India trust Indian Pharmazee for genuine branded medicines, cold chain delivery, IVF, oncology, and specialty healthcare.",
};

const REASONS = [
  {
    icon: BadgeCheck,
    color: "#005EB8",
    title: "100% Genuine Branded Medicines",
    description: "Every product sourced from authorised distributors and verified manufacturers. No counterfeits, no grey market — guaranteed authenticity on every order.",
  },
  {
    icon: Thermometer,
    color: "#16C7D9",
    title: "Cold Chain 2°C–8°C Delivery",
    description: "Specialist handling for temperature-sensitive biologics, IVF hormones, oncology injectables, and vaccines requiring continuous cold chain from warehouse to doorstep.",
  },
  {
    icon: Truck,
    color: "#005EB8",
    title: "Pan-India Express Delivery",
    description: "Reliable courier partnerships across all Indian states. Express overnight slots for urgent medical needs. Real-time tracking and WhatsApp delivery updates.",
  },
  {
    icon: ShieldCheck,
    color: "#16C7D9",
    title: "Verified Supplier Network",
    description: "Long-standing relationships with licensed pharmaceutical distributors ensure consistent availability of specialty medicines — even rare and high-value drugs.",
  },
  {
    icon: IndianRupee,
    color: "#005EB8",
    title: "Affordable & Transparent Pricing",
    description: "Competitive pricing on specialty medicines with no hidden charges. Free shipping on orders above ₹999. Making quality healthcare accessible for every patient.",
  },
  {
    icon: HeartHandshake,
    color: "#16C7D9",
    title: "Dedicated WhatsApp Support",
    description: "Get prescription guidance, medicine availability checks, bulk order quotes, and delivery coordination — all via WhatsApp for fast, personal assistance.",
  },
];

const REVIEWS = [
  { name: "Dr. Anita Sharma", role: "IVF Specialist, Delhi", rating: 5, text: "Reliable cold chain delivery for my patients' IVF medications. Never had a temperature excursion issue. Highly recommended." },
  { name: "Ramesh Iyer", role: "Cancer Patient, Mumbai", rating: 5, text: "Got my oncology medicines delivered overnight. Genuine products, proper packaging. Indian Pharmazee saved me a lot of stress." },
  { name: "Priya Nair", role: "Caregiver, Kochi", rating: 5, text: "Transplant medicines delivered on time with proper cold chain. The WhatsApp support team is extremely helpful and responsive." },
  { name: "Arun Gupta", role: "Patient, Jaipur", rating: 5, text: "Affordable pricing on specialty medicines I couldn't find elsewhere. Fast delivery and 100% genuine products." },
  { name: "Dr. Sunil Mehta", role: "Gynaecologist, Pune", rating: 5, text: "Trust Indian Pharmazee for my patients' specialty prescriptions. Consistent stock availability and professional service." },
  { name: "Kavitha Reddy", role: "Patient, Hyderabad", rating: 5, text: "Ordered IVF medicines with same-day dispatch. Cold chain perfectly maintained. Will always order from here." },
];

const STATS = [
  { value: "12+", label: "Specialty Categories" },
  { value: "Pan-India", label: "Delivery Network" },
  { value: "100%", label: "Genuine Products" },
  { value: "24/7", label: "WhatsApp Support" },
];

export default function WhyUsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F7FAFC" }}>

      {/* ── Hero ── */}
      <section
        className="relative py-16 md:py-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A2540 0%, #005EB8 60%, #0074e4 100%)" }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #16C7D9, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #16C7D9, transparent 70%)" }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5 border border-white/20" style={{ background: "rgba(22,199,217,0.15)", color: "#16C7D9" }}>
            <Stethoscope className="h-4 w-4" />
            Trusted by Patients & Doctors Across India
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Why Choose<br />
            <span style={{ color: "#16C7D9" }}>Indian Pharmazee?</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Genuine branded medicines, specialist cold chain delivery, and dedicated support — making specialty healthcare accessible for every patient.
          </p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-b" style={{ background: "white", borderColor: "#DCE7F2" }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((stat, i) => (
              <div key={i}>
                <p className="text-3xl md:text-4xl font-black mb-1" style={{ color: "#005EB8" }}>{stat.value}</p>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reasons grid ── */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#0A2540" }}>
              What Sets Us Apart
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Not just another pharma platform — here&apos;s why patients and healthcare professionals choose Indian Pharmazee.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REASONS.map((reason, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ borderColor: "#DCE7F2" }}
              >
                <div
                  className="w-13 h-13 w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${reason.color}12` }}
                >
                  <reason.icon className="h-6 w-6" style={{ color: reason.color }} />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: "#0A2540" }}>{reason.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Specialties banner ── */}
      <section className="py-12" style={{ background: "white", borderTop: "1px solid #DCE7F2", borderBottom: "1px solid #DCE7F2" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,94,184,0.08)" }}>
                <FlaskConical className="h-6 w-6" style={{ color: "#005EB8" }} />
              </div>
              <div>
                <p className="font-bold text-lg" style={{ color: "#0A2540" }}>Specialty Medicine Categories</p>
                <p className="text-sm text-gray-500">IVF · Oncology · Transplant · Sexual Wellness · Paediatric · Ayurvedic & more</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["IVF Medicines", "Anti-Cancer", "Transplants", "Cold Chain", "Biologics", "HGH"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                  style={{ background: "rgba(0,94,184,0.06)", borderColor: "#DCE7F2", color: "#005EB8" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="py-16 md:py-20" style={{ background: "#F7FAFC" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#0A2540" }}>
              What Our Patients Say
            </h2>
            <p className="text-gray-500">Real experiences from patients and healthcare professionals across India.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map((review, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg" style={{ borderColor: "#DCE7F2" }}>
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5">&quot;{review.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
                    style={{ background: "linear-gradient(135deg, #005EB8, #16C7D9)" }}
                  >
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#0A2540" }}>{review.name}</p>
                    <p className="text-xs text-gray-400">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16" style={{ background: "#0A2540" }}>
        <div className="max-w-7xl mx-auto px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 50%, rgba(22,199,217,0.08), transparent 70%)" }} />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Experience the Difference?
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
              Shop genuine specialty medicines with cold chain delivery, transparent pricing, and 24/7 WhatsApp support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button
                  size="lg"
                  className="h-13 px-10 font-bold text-white rounded-xl"
                  style={{ background: "#005EB8" }}
                >
                  Shop Medicines <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a
                href="https://wa.me/919560247619"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-13 px-10 rounded-xl font-bold text-white border-2 transition-all hover:opacity-90"
                style={{ borderColor: "#16C7D9", color: "#16C7D9", height: "3.25rem" }}
              >
                Message on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
