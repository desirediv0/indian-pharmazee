import { Truck, Package, Thermometer, Clock, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Shipping & Delivery Policy | Indian Pharmazee",
  description: "Learn about Indian Pharmazee's cold chain delivery, temperature-controlled shipping, transit protocols, and pan-India coverage for specialty medicines.",
};

const SHIPPING_CARDS = [
  {
    icon: Thermometer,
    color: "#16C7D9",
    title: "Cold Chain 2°C–8°C",
    description: "Specialized thermal insulation for temperature-sensitive IVF medicines, vaccines, oncology injectables, and biologics.",
  },
  {
    icon: Truck,
    color: "#005EB8",
    title: "Pan-India Express Network",
    description: "Expedited shipping covering metros, Tier 2, and Tier 3 cities via professional medical logistics partners.",
  },
  {
    icon: Clock,
    color: "#005EB8",
    title: "Delivery Timeline",
    description: "Metro cities: 24–48 hours. Tier 2/3 locations: 3–5 business days. Express overnight available in select hubs.",
  },
  {
    icon: Package,
    color: "#16C7D9",
    title: "Clinical-Grade Packaging",
    description: "Dual-walled EPS thermal containers with medical phase-change gel packs — temperature compliance guaranteed throughout transit.",
  },
];

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F7FAFC" }}>

      {/* ── Hero ── */}
      <section
        className="relative py-14 md:py-18 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A2540 0%, #005EB8 60%, #0074e4 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #16C7D9, transparent 70%)" }} />
          <div className="absolute bottom-0 left-10 w-60 h-60 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #16C7D9, transparent 70%)" }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/70">Shipping Policy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="text-white/65 max-w-xl text-base">
            Clinical-grade transport protocols for life-saving and temperature-controlled medical logistics across India.
          </p>
        </div>
      </section>

      {/* ── Cards grid ── */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-5 mb-12">
            {SHIPPING_CARDS.map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                style={{ borderColor: "#DCE7F2" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${card.color}12` }}
                >
                  <card.icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: "#0A2540" }}>{card.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>

          {/* ── Policy prose ── */}
          <div className="bg-white rounded-3xl p-8 md:p-12 border space-y-10" style={{ borderColor: "#DCE7F2" }}>

            {/* Section 1 */}
            <div>
              <h2 className="text-xl font-bold mb-4 pb-2 border-b flex items-center gap-2.5" style={{ color: "#0A2540", borderColor: "#DCE7F2" }}>
                <span className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ background: "#005EB8" }} />
                Delivery Logistics &amp; Shipping Fees
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                We use premier clinical courier networks (Blue Dart Express, Delhivery, and specialty pharmaceutical transporters) for all dispatches to ensure medicine integrity.
              </p>
              <ul className="space-y-2.5 pl-5 list-disc text-sm text-gray-600">
                <li><strong className="text-gray-800">Orders above ₹999:</strong> Free expedited shipping across all deliverable PIN codes in India.</li>
                <li><strong className="text-gray-800">Orders below ₹999:</strong> Flat shipping charge of ₹99 applies.</li>
                <li><strong className="text-gray-800">Cold Chain Surcharges:</strong> Highly sensitive biologics requiring dry ice replenishment during transit may incur minor custom packaging charges — notified before dispatch.</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="text-xl font-bold mb-4 pb-2 border-b flex items-center gap-2.5" style={{ color: "#0A2540", borderColor: "#DCE7F2" }}>
                <span className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ background: "#16C7D9" }} />
                Cold Chain Compliance Protocols
              </h2>
              <div
                className="p-5 rounded-2xl mb-4 border"
                style={{ background: "rgba(22,199,217,0.04)", borderColor: "rgba(22,199,217,0.2)" }}
              >
                <p className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "#0A2540" }}>
                  <Thermometer className="w-4 h-4" style={{ color: "#16C7D9" }} />
                  Keep Cool Guard (2°C – 8°C)
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We strictly enforce cold chain distribution guidelines. Products like IVF hormones, insulin, and oncology injections are maintained at 2°C–8°C from storage until handover — ensuring maximum therapeutic value.
                </p>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Each shipment is packed in a dual-walled EPS thermal container with medical phase-change refrigerant gel packs. Dispatches are scheduled to avoid weekend transit halts, minimizing risk of temperature excursion.
              </p>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="text-xl font-bold mb-4 pb-2 border-b flex items-center gap-2.5" style={{ color: "#0A2540", borderColor: "#DCE7F2" }}>
                <span className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ background: "#005EB8" }} />
                Tracking &amp; Transit Updates
              </h2>
              <ul className="space-y-2.5 pl-5 list-disc text-sm text-gray-600">
                <li>On dispatch, a secure tracking link is sent to your registered mobile via WhatsApp and SMS.</li>
                <li>Real-time status updates — including package arrival at city hubs — viewable live.</li>
                <li>For cold chain shipments, a delivery representative coordinates via phone before arrival to ensure someone is present to immediately refrigerate the package.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="text-xl font-bold mb-4 pb-2 border-b flex items-center gap-2.5" style={{ color: "#0A2540", borderColor: "#DCE7F2" }}>
                <span className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ background: "#f59e0b" }} />
                Verification &amp; Delivery Delays
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                In rare cases of transit delays due to atmospheric disruptions, natural disasters, or logistical holds — our support team actively tracks shipments and keeps you updated. If a cold chain parcel gets delayed beyond its thermal limit, Indian Pharmazee will immediately replace the consignment at no additional charge.
              </p>
            </div>

            {/* CTA row */}
            <div
              className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-5"
              style={{ borderColor: "#DCE7F2" }}
            >
              <div>
                <p className="text-sm font-bold" style={{ color: "#0A2540" }}>Have specific courier requirements?</p>
                <p className="text-xs text-gray-500 mt-0.5">Contact our logistics team for tailored dispatch schedules.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:indianpharmazee@gmail.com"
                  className="text-xs font-bold px-4 py-2.5 rounded-xl border transition-colors hover:opacity-90 text-center"
                  style={{ color: "#005EB8", background: "rgba(0,94,184,0.06)", borderColor: "#DCE7F2" }}
                >
                  indianpharmazee@gmail.com
                </a>
                <a
                  href="https://wa.me/919560247619"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold px-4 py-2.5 rounded-xl transition-colors hover:opacity-90 text-center text-white"
                  style={{ background: "#25D366" }}
                >
                  📱 WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
