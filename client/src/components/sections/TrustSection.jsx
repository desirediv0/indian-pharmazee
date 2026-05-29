"use client"
import { Star, ChevronLeft, ChevronRight, CheckCircle2, Quote, Users, Clock, ShoppingBasket } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────
   DATA
 ───────────────────────────────────────────── */
const STATS = [
  { value: "12+",      label: "Specialty Categories", icon: ShoppingBasket },
  { value: "Pan-India", label: "Delivery Network",    icon: Users },
  { value: "100%",     label: "Genuine Medicines",    icon: CheckCircle2 },
  { value: "24/7",     label: "WhatsApp Support",     icon: Clock },
];

const TESTIMONIALS = [
  {
    name: "Dr. Anita Sharma",
    role: "IVF Specialist",
    city: "Delhi",
    text: "Reliable cold chain delivery for my patients' IVF medications. Never had a temperature excursion. Indian Pharmazee is the only platform I trust for specialty pharma.",
    rating: 5,
    verified: true
  },
  {
    name: "Ramesh Iyer",
    role: "Cancer Patient",
    city: "Mumbai",
    text: "Got my oncology medicines delivered overnight with proper cold packaging. Genuine products, transparent pricing. Indian Pharmazee saved me so much stress.",
    rating: 5,
    verified: true
  },
  {
    name: "Priya Nair",
    role: "Caregiver",
    city: "Kochi",
    text: "Transplant medicines delivered on time with proper cold chain. The WhatsApp support team is extremely responsive and helpful. Highly recommended.",
    rating: 5,
    verified: true
  },
  {
    name: "Dr. Sunil Mehta",
    role: "Gynaecologist",
    city: "Pune",
    text: "I trust Indian Pharmazee for my patients' specialty prescriptions. Consistent stock availability, genuine brands, and professional delivery every time.",
    rating: 5,
    verified: true
  },
  {
    name: "Kavitha Reddy",
    role: "Patient",
    city: "Hyderabad",
    text: "Ordered IVF medicines with same-day dispatch. Cold chain perfectly maintained. Pricing is very fair compared to local pharmacies. Will always order from here.",
    rating: 5,
    verified: true
  },
];

/* ─────────────────────────────────────────────
   CAROUSEL COMPONENT
 ───────────────────────────────────────────── */
const TestimonialCarousel = () => {
  const [visibleCount, setVisibleCount] = useState(3);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollRef = useRef(null);

  useEffect(() => {
    const update = () => {
      setVisibleCount(window.innerWidth < 768 ? 1 : 3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const cloned = [
    ...TESTIMONIALS.slice(-visibleCount),
    ...TESTIMONIALS,
    ...TESTIMONIALS.slice(0, visibleCount),
  ];

  const total = TESTIMONIALS.length;
  const offset = visibleCount;
  const [trackIndex, setTrackIndex] = useState(offset);

  const goTo = useCallback(
    (direction) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setTrackIndex((prev) => prev + direction);
    },
    [isTransitioning]
  );

  const handleTransitionEnd = () => {
    setIsTransitioning(false);
    setTrackIndex((prev) => {
      if (prev <= offset - 1) return offset + total - 1;
      if (prev >= offset + total) return offset;
      return prev;
    });
  };

  useEffect(() => {
    if (isPaused) return;
    autoScrollRef.current = setInterval(() => {
      goTo(1);
    }, 4000);
    return () => clearInterval(autoScrollRef.current);
  }, [isPaused, goTo]);

  const dotIndex = ((trackIndex - offset) % total + total) % total;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden py-4">
        <div
          className="flex transition-transform duration-500"
          style={{
            transform: `translateX(-${(trackIndex * 100) / cloned.length}%)`,
            transition: isTransitioning ? "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
            width: `${(cloned.length / visibleCount) * 100}%`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {cloned.map((t, i) => (
            <div
              key={i}
              style={{ width: `${100 / cloned.length}%` }}
              className="px-3"
            >
              <div className="group relative bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col">
                <div className="absolute top-6 right-8 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity duration-500">
                  <Quote className="w-12 h-12 text-primary" />
                </div>
                
                <div className="flex gap-1 mb-6 relative z-10">
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${s <= t.rating ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-100"}`}
                    />
                  ))}
                </div>

                <p className="text-gray-600 leading-relaxed italic mb-8 relative z-10 flex-1">
                  &quot;{t.text}&quot;
                </p>

                <div className="flex items-center gap-4 pt-6 border-t border-gray-50 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors duration-500">
                    <span className="text-sm font-bold text-primary">
                      {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="font-bold text-gray-900 leading-none">{t.name}</p>
                      {t.verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">
                      {t.role} · {t.city}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-12">
        <div className="flex gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (isTransitioning) return;
                setIsTransitioning(true);
                setTrackIndex(offset + i);
              }}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === dotIndex ? "w-8 bg-primary" : "w-2 bg-gray-200 hover:bg-gray-300"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => goTo(-1)}
            disabled={isTransitioning}
            className="w-12 h-12 rounded-full border border-gray-100 bg-white text-gray-400 shadow-sm hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => goTo(1)}
            disabled={isTransitioning}
            className="w-12 h-12 rounded-full border border-gray-100 bg-white text-gray-400 shadow-sm hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const TrustSection = () => {
  return (
    <section className="bg-white py-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.15]" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {STATS.map((s, i) => (
            <div key={i} className="group bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <s.icon className="w-6 h-6" />
              </div>
              <p className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
                {s.value}
              </p>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-[11px] font-bold uppercase tracking-wider mb-5">
              Success Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight">
              Trusted by Patients &amp; <br />
              <span className="text-primary">Doctors Across India.</span>
            </h2>
          </div>
          <p className="text-gray-500 max-w-xs md:text-right text-base leading-relaxed">
            From IVF specialists to cancer patients — Indian Pharmazee is the trusted choice for specialty medicines.
          </p>
        </div>

        <TestimonialCarousel />
      </div>
    </section>
  );
};

export default TrustSection;