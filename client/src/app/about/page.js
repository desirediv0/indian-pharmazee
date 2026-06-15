import {
  HeartHandshake, Users, ShieldCheck, Target, CheckCircle,
  ArrowRight, Stethoscope, Thermometer, FlaskConical, Leaf, BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getPharmaIcon } from "@/lib/pharma-icons";

export const metadata = {
  title: "About Us | Indian Pharmazee — Trusted Specialty Medicines",
  description: "Indian Pharmazee is a trusted platform providing genuine branded medicines and specialty healthcare products across India with cold chain delivery support.",
};

const stats = [
  { value: "12+", label: "Specialty Categories", icon: <Stethoscope className="w-5 h-5" /> },
  { value: "Pan-India", label: "Delivery Network", icon: <Users className="w-5 h-5" /> },
  { value: "100%", label: "Genuine Products", icon: <BadgeCheck className="w-5 h-5" /> },
  { value: "2°C–8°C", label: "Cold Chain Support", icon: <Thermometer className="w-5 h-5" /> },
];

const values = [
  {
    icon: BadgeCheck,
    title: "Genuine Medicines Only",
    description: "Every product is sourced exclusively from authorised distributors. We guarantee absolute authenticity — no grey market items or counterfeits.",
  },
  {
    icon: Target,
    title: "Affordable Accessibility",
    description: "Competitive prices on critical specialty medicines to make life-saving and life-enhancing care affordable for everyone across the country.",
  },
  {
    icon: Users,
    title: "Patient-First Commitment",
    description: "Our services are designed around the user. We are dedicated to providing support, clear guidance, and unmatched service reliability.",
  },
  {
    icon: ShieldCheck,
    title: "Cold Chain Excellence",
    description: "End-to-end temperature preservation (2°C–8°C) using validation-tested cold boxes for biologics, oncology, and fertility medicines.",
  },
];

const CATEGORIES = [
  "IVF Medicines",
  "Gynaecology",
  "Anti Cancer (Oncology)",
  "Antibiotics & Supplements",
  "Transplant Medicines",
  "Sexual Wellness & HGH",
  "Osteoporosis Care",
  "Paediatric Care",
  "Antifungal",
  "Anemia Care",
  "Arthritis Care",
  "Ayurvedic Medicines",
  "Hormonal Therapies",
  "Chronic Care",
];

const features = [
  "Genuine Branded Medicines",
  "Cold Chain Delivery (2°C–8°C)",
  "Pan-India Coverage",
  "Authorized Suppliers Only",
  "Active WhatsApp Support",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-hero-brand">
        {/* Fine background grid and ambient glows */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(0,94,184,0.06)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-80" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #16C7D9, transparent)" }} />
          <div className="absolute bottom-10 left-20 w-80 h-80 rounded-full blur-3xl opacity-15" style={{ background: "radial-gradient(circle, #005EB8, transparent)" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 max-w-3xl">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border animate-fade-in"
                style={{ background: "rgba(0,94,184,0.06)", borderColor: "rgba(0,94,184,0.15)", color: "#005EB8" }}
              >
                <Stethoscope className="w-3.5 h-3.5 text-[#16C7D9]" />
                Trusted Pharmaceutical Platform
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display tracking-tight mb-6 leading-[1.1] text-slate-900">
                Specialty Medicines, <br />
                <span className="bg-gradient-to-r from-[#005EB8] to-[#16C7D9] bg-clip-text text-transparent">
                  Trusted Across India
                </span>
              </h1>
              <p className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed">
                Indian Pharmazee provides a secure, fully authorized digital portal offering authentic branded medicines and specialist healthcare products. We ensure professional logistics, patient privacy, and competitive pricing for all essential healthcare needs.
              </p>
              
              {/* Bullet Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 flex-shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <Button
                    size="lg"
                    className="text-white px-8 h-12 rounded-xl font-semibold gap-2 bg-[#005EB8] hover:bg-[#004b93] shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all"
                  >
                    Browse Medicines <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href="https://wa.me/919560247619"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 h-12 rounded-xl font-semibold border border-[#DCE7F2] text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                  >
                    Contact Expert Team
                  </Button>
                </a>
              </div>
            </div>

            {/* Hero Right: Trust & Quality Assurance Panel */}
            <div className="lg:col-span-5 relative">
              <div className="relative bg-white/90 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-[#DCE7F2] shadow-2xl hover:shadow-3xl transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#DCE7F2]">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Transit Quality Control</span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Cold Chain Active
                  </span>
                </div>

                {/* Temperature Indicator Block */}
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                      <Thermometer className="w-4.5 h-4.5 text-[#16C7D9]" /> Live Storage Temp
                    </span>
                    <span className="font-extrabold text-[#005EB8] text-base">4.2 °C</span>
                  </div>
                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-[25%] right-[45%] bg-gradient-to-r from-[#16C7D9] to-[#005EB8] rounded-full" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold px-0.5">
                    <span>0°C</span>
                    <span className="text-[#005EB8]">2°C (Min)</span>
                    <span className="text-[#005EB8]">8°C (Max)</span>
                    <span>15°C</span>
                  </div>
                </div>

                {/* Verification Checkmarks */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-[#005EB8]/20 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#005EB8] flex items-center justify-center flex-shrink-0">
                      <BadgeCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">100% Sourced Direct</p>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5">Every package has traceable batch numbers from certified drug manufacturers.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-[#16C7D9]/20 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#16C7D9] flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">Tamper-Proof Packaging</p>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5">Shipped in heavy-duty insulated coolers with phase-change clinical gel packs.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Floating Statistics Section */}
      <section className="relative -mt-10 z-20 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border border-[#DCE7F2] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-[#005EB8] flex-shrink-0">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-extrabold font-display text-slate-900">{stat.value}</p>
                  <p className="text-slate-500 text-xs font-bold tracking-tight">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy & Medicine Categories */}
      <section className="py-20 md:py-28 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Core Mission Copy */}
            <div className="lg:col-span-5">
              <span
                className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full mb-4"
                style={{ background: "rgba(0,94,184,0.06)", color: "#005EB8" }}
              >
                Who We Are
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold font-display text-slate-950 mb-6 leading-tight">
                Making Specialty Healthcare Accessible & Secure
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6 text-sm md:text-base">
                At Indian Pharmazee, we bridge the gap between critical specialty pharmaceutical therapy and patients across India. We recognize that sourcing genuine prescription medication for critical diseases, infertility, or chronic conditions can be stressful and complex.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6 text-sm md:text-base">
                Our platform provides fully licensed drug sourcing, guaranteeing authentic origin records, strict cold storage control in transit, and confidential home delivery.
              </p>
              
              {/* Clinical features list */}
              <div className="space-y-4 mt-8 pt-6 border-t border-[#DCE7F2]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-[#16C7D9]">
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">Certified 2°C – 8°C Clinical Logistics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#005EB8]">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">Critical & Specialty Care Portfolios</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">Premium Herbal & Ayurvedic Care</span>
                </div>
              </div>
            </div>

            {/* Specialty Categories Grid with Dynamic Icons */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-[#DCE7F2] shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold font-display text-slate-900">Medicine & Healthcare Range</h3>
                <p className="text-xs text-slate-500 mt-1">Specialized portfolio catering to direct-to-patient pharmacy requirements.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {CATEGORIES.map((cat, index) => {
                  const { Icon, color } = getPharmaIcon(cat);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#005EB8]/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: `${color}12`, color: color }}
                      >
                        {Icon && <Icon className="w-4.5 h-4.5" />}
                      </div>
                      <span className="text-sm font-bold text-slate-800">{cat}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pillars of Integrity (Values) */}
      <section className="py-20 md:py-24 bg-white border-y border-[#DCE7F2] px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span
              className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full mb-4 animate-fade-in"
              style={{ background: "rgba(0,94,184,0.06)", color: "#005EB8" }}
            >
              Our Core Philosophy
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-slate-950 mb-4">
              Why Healthcare Experts Choose Us
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              We stand by our medical delivery standards. Excellence, authenticity, and precision are integrated into every package we dispatch.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="group bg-slate-50/40 rounded-2xl p-6 border border-[#DCE7F2] transition-all duration-300 hover:bg-white hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-blue-50 text-[#005EB8] group-hover:bg-[#005EB8] group-hover:text-white transition-all duration-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold font-display text-slate-900 mb-2">{value.title}</h3>
                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action (CTA) Panel */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden py-16 px-8 md:px-16 text-center shadow-2xl bg-[#0A2540]">
            {/* Ambient medical blue & cyan glowing spheres */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #16C7D9, transparent)" }} />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #005EB8, transparent)" }} />
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white font-display mb-4">
                Need Specialty Medicines?
              </h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed text-sm md:text-base">
                Get real-time answers for specialized oncology drugs, IVF medication support, clinical imports, or secure cold chain shipment tracking anywhere in India.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/products" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-white px-8 h-12 rounded-xl font-semibold bg-[#005EB8] hover:bg-[#004b93] transition-colors shadow-lg shadow-blue-500/20 border-0"
                  >
                    Browse Portfolio
                  </Button>
                </Link>
                <a
                  href="https://wa.me/919560247619"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-8 h-12 rounded-xl font-semibold border-2 border-[#16C7D9] text-[#16C7D9] hover:bg-[#16C7D9]/10 hover:text-[#16C7D9] transition-all bg-transparent"
                  >
                    Message on WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
