import {
  ShieldCheck, Package, Truck, Thermometer,
  BadgeCheck, IndianRupee, HeartHandshake, ArrowRight, CheckCircle2
} from "lucide-react";
import Link from "next/link";

const STATS = [
  { value: "100%", label: "Genuine Medicines" },
  { value: "Pan-India", label: "Delivery Network" },
  { value: "2°C–8°C", label: "Temp-Controlled Support" },
  { value: "24/7", label: "WhatsApp Support" },
];

const PROMISES = [
  {
    icon: BadgeCheck,
    title: "Genuine Branded Medicines",
    body: "Every product sourced directly from authorised distributors and manufacturers. Guaranteed authenticity — no counterfeits, no grey market.",
  },
  {
    icon: Package,
    title: "Secure & Safe Packaging",
    body: "Temperature-controlled packaging for temperature-sensitive products. Tamper-proof sealing and professional logistics for safe, damage-free delivery.",
  },
  {
    icon: Truck,
    title: "Fast Pan-India Delivery",
    body: "Reliable courier partnerships across India. Express delivery for urgent medical needs with real-time tracking support.",
  },
  {
    icon: Thermometer,
    title: "Temp-Controlled Delivery (2°C–8°C)",
    body: "Specialist handling for temperature-sensitive biologics, IVF medicines, and oncology products requiring temp-controlled maintenance.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted Supplier Network",
    body: "Long-standing relationships with verified pharmaceutical suppliers ensure consistent availability of specialty medicines.",
  },
  {
    icon: IndianRupee,
    title: "Affordable Pricing",
    body: "Competitive pricing on specialty medicines with no hidden charges. Making quality healthcare accessible for every patient.",
  },
];

export const WhyBuySection = () => {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden" style={{ background: "#F7FAFC" }}>

      {/* Background glow */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-25 pointer-events-none"
        style={{ background: "radial-gradient(circle, #16C7D9, transparent)" }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-[100px] opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #005EB8, transparent)" }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <div className="max-w-xl">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-5 border"
              style={{ background: "rgba(0,94,184,0.06)", borderColor: "rgba(0,94,184,0.15)", color: "#005EB8" }}
            >
              <HeartHandshake className="h-3.5 w-3.5" />
              The Indian Pharmazee Difference
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight" style={{ color: "#0A2540" }}>
              Why Patients &amp; Doctors
              <br />
              <span style={{ color: "#005EB8" }}>Trust Us.</span>
            </h2>
          </div>
          <p className="text-gray-500 max-w-xs text-sm leading-relaxed lg:text-right">
            Dedicated to making specialty healthcare accessible, affordable, and trustworthy for every patient across India.
          </p>
        </div>

        {/* ── Main grid ── */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Left — stats + CTA */}
          <div className="lg:col-span-4 flex flex-col gap-4">

            {/* Stats 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              {STATS.map((stat, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl border flex flex-col justify-center text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-white"
                  style={{ borderColor: "#DCE7F2" }}
                >
                  <p className="text-xl md:text-2xl font-black mb-1" style={{ color: "#005EB8" }}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA card */}
            <div
              className="p-7 rounded-3xl text-white relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #005EB8 0%, #0074e4 60%, #0d8aff 100%)" }}
            >
              {/* decorative circles */}
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-15" style={{ background: "rgba(22,199,217,0.6)" }} />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.5)" }} />

              <div className="relative z-10">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <HeartHandshake className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-bold mb-2">Healthcare for All</h4>
                <p className="text-white/75 text-sm leading-relaxed mb-5">
                  Specialty medicines made accessible for every patient, anywhere in India.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 text-sm font-bold bg-white px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  style={{ color: "#005EB8" }}
                >
                  Shop Medicines <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right — promise cards 2-col grid */}
          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
            {PROMISES.map((item, i) => (
              <div
                key={i}
                className="group bg-white p-6 rounded-2xl border flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                style={{ borderColor: "#DCE7F2" }}
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{ background: "rgba(0,94,184,0.08)" }}
                >
                  <item.icon className="w-5 h-5" style={{ color: "#005EB8" }} />
                </div>

                {/* Text */}
                <div>
                  <h3 className="text-sm font-bold mb-1.5 flex items-center gap-1.5" style={{ color: "#0A2540" }}>
                    {item.title}
                    <CheckCircle2
                      className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{ color: "#16C7D9" }}
                    />
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA bar ── */}
        <div
          className="mt-16 p-8 md:p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
          style={{ background: "#0A2540" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(circle at 20% 50%, rgba(22,199,217,0.1), transparent 60%)" }}
          />
          <div className="relative z-10 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Need Medicine Help?</h3>
            <p className="text-slate-400 text-sm max-w-md">
              Prescription queries, bulk orders, temp-controlled requirements — message us on WhatsApp for fast assistance.
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <a
              href="https://wa.me/919560247619"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
              style={{ background: "#25D366" }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Message on WhatsApp
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all hover:bg-white/10"
              style={{ borderColor: "#16C7D9", color: "#16C7D9" }}
            >
              Contact Us
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WhyBuySection;
