"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/utils";
import {
  HandshakeIcon,
  TrendingUp,
  Ticket,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Zap,
  Users,
  Star,
  Truck,
} from "lucide-react";

const translations = {
  hero_badge: "Join Our Partner Network",
  hero_title: "Become an Indian Pharmazee Partner",
  hero_subtitle:
    "Partner with India's trusted specialty pharma platform. Distribution, retail, or sourcing — let's grow together.",
  btn_apply: "Join the Family",
  btn_login: "Partner Login",
  benefits_title: "Why Join Indian Pharmazee?",
  b1_title: "Supply Chain Excellence",
  b1_desc: "Access our state-of-the-art supply chain infrastructure for fresh daily deliveries.",
  b2_title: "Live Inventory",
  b2_desc: "Real-time tracking of batches, expiry dates, and stock levels via your dashboard.",
  b3_title: "Marketing Support",
  b3_desc: "Get premium branding materials and local marketing support for your outlet.",
  b4_title: "Ethical Sourcing",
  b4_desc: "We ensure fair pay to farmers and 100% purity for our customers.",
  form_title: "Partner with Us",
  form_name: "Full Name",
  form_email: "Email Address",
  form_phone: "Phone Number",
  form_city: "City",
  form_state: "State",
  form_message: "Tell us about your retail business or interest",
  form_submit: "Send Application",
  form_submitting: "Sending...",
  success_title: "Application Received!",
  success_msg:
    "Thank you for your interest in Indian Pharmazee. Our partnership team will reach out to you within 48 hours.",
  success_back: "Back to Home",
  err_required: "All fields are required.",
  err_duplicate: "An application with this email already exists.",
  err_generic: "Something went wrong. Please try again.",
  note: "By submitting, you agree to our partnership terms & conditions.",
};

const PARTNER_PORTAL_URL = "#"; // Assuming logic pending for partner portal

/* ─── tiny animated counter ─── */
function Counter({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        let start = 0;
        const step = Math.ceil(to / 60);
        const t = setInterval(() => {
          start += step;
          if (start >= to) { setVal(to); clearInterval(t); }
          else setVal(start);
        }, 20);
      },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

export default function BecomePartnerPage() {
  const t = translations;
  const [form, setForm] = useState({ name: "", email: "", number: "", city: "", state: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, number, city, state, message } = form;
    if (!name || !email || !number || !city || !state || !message) {
      setError(t.err_required); return;
    }
    try {
      setLoading(true); setError("");
      const res = await fetchApi("/partner/register", {
        method: "POST",
        body: JSON.stringify({ name, email, number, city, state, message }),
      });
      if (res.success || res.statusCode === 201) {
        setSuccess(true);
      } else {
        const msg = res.message || "";
        if (msg.toLowerCase().includes("already") || res.statusCode === 409) setError(t.err_duplicate);
        else setError(msg || t.err_generic);
      }
    } catch (err) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("already") || msg.includes("409")) setError(t.err_duplicate);
      else setError(msg || t.err_generic);
    } finally { setLoading(false); }
  };

  const benefits = [
    { icon: Truck, title: t.b1_title, desc: t.b1_desc, accent: "#16A34A", num: "100", numSuffix: "%", label: "Temp-Controlled" },
    { icon: TrendingUp, title: t.b2_title, desc: t.b2_desc, accent: "#3b82f6", num: "24", numSuffix: "/7", label: "Inventory Tracking" },
    { icon: HandshakeIcon, title: t.b3_title, desc: t.b3_desc, accent: "#a855f7", num: "Brand", numSuffix: " Support", label: "Marketing Kit" },
    { icon: CheckCircle, title: t.b4_title, desc: t.b4_desc, accent: "#22c55e", num: "Purity", numSuffix: " First", label: "Ethical Sourcing" },
  ];

  const stats = [
    { icon: Users, value: 200, suffix: "+", label: "Retail Partners" },
    { icon: DollarSign, value: 12, suffix: " Cr+", label: "Partner Revenue" },
    { icon: Star, value: 99, suffix: "%", label: "Freshness Rate" },
    { icon: Zap, value: 24, suffix: " hrs", label: "Onboarding" },
  ];

  return (
    <>
      {/* Google Font */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        .partner-root { font-family: 'DM Sans', sans-serif; }
        .font-display  { font-family: 'Syne', sans-serif; }

        /* Grid bg */
        .hero-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* Floating blobs */
        @keyframes blob {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(30px,-20px) scale(1.05); }
          66%      { transform: translate(-20px,15px) scale(.95); }
        }
        .blob { animation: blob 8s ease-in-out infinite; }
        .blob2 { animation: blob 10s ease-in-out infinite reverse; animation-delay: -3s; }
        .blob3 { animation: blob 12s ease-in-out infinite; animation-delay: -6s; }

        /* Diagonal stripe accent */
        .stripe-bg {
          background: repeating-linear-gradient(
            -55deg,
            transparent,
            transparent 10px,
            rgba(24,97,160,.04) 10px,
            rgba(24,97,160,.04) 20px
          );
        }

        /* Card hover lift */
        .benefit-card {
          transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease;
        }
        .benefit-card:hover {
          transform: translateY(-8px) scale(1.01);
          box-shadow: 0 24px 48px rgba(0,0,0,.1);
        }

        /* Input focus */
        .partner-input {
          transition: border-color .2s, box-shadow .2s;
        }
        .partner-input:focus {
          border-color: #1861A0;
          box-shadow: 0 0 0 3px rgba(24,97,160,.15);
          outline: none;
        }

        /* Glow btn */
        .glow-btn {
          position: relative;
          overflow: hidden;
          transition: transform .2s, box-shadow .2s;
        }
        .glow-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent);
          transform: translateX(-100%);
          transition: transform .6s;
        }
        .glow-btn:hover::before { transform: translateX(100%); }
        .glow-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 0 32px rgba(24,97,160,.5);
        }

        /* Tag pill */
        .tag-pill {
          background: linear-gradient(135deg, rgba(24,97,160,.15), rgba(24,97,160,.05));
          border: 1px solid rgba(24,97,160,.3);
        }

        /* Fade-up on load */
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up-1 { animation: fadeUp .7s ease both; }
        .fade-up-2 { animation: fadeUp .7s .15s ease both; }
        .fade-up-3 { animation: fadeUp .7s .3s ease both; }
        .fade-up-4 { animation: fadeUp .7s .45s ease both; }

        /* Stat card */
        .stat-card {
          transition: transform .25s ease, background .25s ease;
        }
        .stat-card:hover { transform: translateY(-4px); background: rgba(24,97,160,.08) !important; }

        /* Success pulse */
        @keyframes successPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,.4); }
          50%      { box-shadow: 0 0 0 16px rgba(34,197,94,0); }
        }
        .success-icon { animation: successPulse 2s ease infinite; }

        /* Divider line */
        .divider { height:1px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent); }

        /* Number accent */
        .num-accent {
          font-family: 'Syne', sans-serif;
          background: linear-gradient(135deg, #16A34A, #1D4ED8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}} />

      <div className="partner-root min-h-screen bg-[#f8f7f4]">

        {/* ───── HERO ───── */}
        <section className="relative bg-[#0f0f0f] text-white overflow-hidden">
          {/* grid overlay */}
          <div className="absolute inset-0 hero-grid pointer-events-none" />

          {/* blobs */}
          <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.12] blob"
            style={{ background: "radial-gradient(circle, #1861A0, transparent 70%)" }} />
          <div className="absolute bottom-[-20%] right-[-5%] w-[450px] h-[450px] rounded-full opacity-[0.10] blob2"
            style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />
          <div className="absolute top-[40%] right-[25%] w-[250px] h-[250px] rounded-full opacity-[0.07] blob3"
            style={{ background: "radial-gradient(circle, #a855f7, transparent 70%)" }} />

          <div className="relative max-w-5xl mx-auto px-6 py-28 text-center">
            {/* Badge */}
            <div className="fade-up-1 inline-flex items-center gap-2 tag-pill px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase text-primary mb-8">
              <HandshakeIcon className="h-3.5 w-3.5" />
              {t.hero_badge}
            </div>

            {/* Title */}
            <h1 className="fade-up-2 font-display text-5xl md:text-7xl font-extrabold leading-[1.05] mb-6 tracking-tight">
              Become a{" "}
              <span className="relative inline-block">
                <span className="relative z-10" style={{
                  background: "linear-gradient(135deg, #1861A0 0%, #3b82f6 50%, #60a5fa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  Indian Pharmazee
                </span>
              </span>
              <br />
              Partner
            </h1>

            <p className="fade-up-3 text-[#a1a1aa] text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
              {t.hero_subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="fade-up-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#apply"
                className="glow-btn inline-flex items-center gap-2.5 px-9 py-4 bg-primary text-white font-display font-bold text-base rounded-xl shadow-2xl shadow-primary/30">
                {t.btn_apply}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href={PARTNER_PORTAL_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-9 py-4 rounded-xl font-medium text-base text-white/70 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all duration-300">
                {t.btn_login}
              </a>
            </div>

            {/* Quick stats strip */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/5 bg-white/5">
              {stats.map((s, i) => (
                <div key={i} className="stat-card flex flex-col items-center gap-1 py-6 bg-transparent">
                  <s.icon className="h-5 w-5 text-primary mb-1" />
                  <p className="font-display text-2xl font-bold text-white">
                    <Counter to={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-xs text-white/40 tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── BENEFITS ───── */}
        <section className="py-24 px-6 stripe-bg">
          <div className="max-w-5xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-bold tracking-widest uppercase text-primary mb-3">
                ✦ Benefits ✦
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[#0f0f0f] leading-tight">
                {t.benefits_title}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {benefits.map((b, i) => (
                <div key={i} className="benefit-card bg-white rounded-2xl p-7 border border-gray-100 shadow-sm flex flex-col">
                  {/* Top: icon + number */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center"
                      style={{ background: b.accent + "15" }}>
                      <b.icon className="h-5 w-5" style={{ color: b.accent }} />
                    </div>
                    <div className="text-right">
                      <p className="num-accent text-2xl font-extrabold leading-none">{b.num}{b.numSuffix}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{b.label}</p>
                    </div>
                  </div>
                  <div className="divider mb-5" />
                  <h3 className="font-display font-bold text-[#0f0f0f] text-lg mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── HOW IT WORKS (new section) ───── */}
        <section className="py-20 px-6 bg-[#0f0f0f] overflow-hidden relative">
          <div className="absolute inset-0 hero-grid opacity-50 pointer-events-none" />
          <div className="relative max-w-4xl mx-auto text-center">
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-primary mb-3">
              ✦ Process ✦
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white mb-14">
              3 Steps to Start Earning
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Apply", desc: "Fill the form below with your details. Takes less than 2 minutes." },
                { step: "02", title: "Get Approved", desc: "Our team reviews your application within 2-3 business days." },
                { step: "03", title: "Start Earning", desc: "Receive your exclusive coupon and start earning commissions immediately." },
              ].map((s, i) => (
                <div key={i} className="relative text-left p-7 rounded-2xl border border-white/8 bg-white/4 hover:bg-white/7 transition-colors">
                  <p className="font-display text-6xl font-extrabold leading-none mb-4"
                    style={{ color: "rgba(24,97,160,0.18)" }}>
                    {s.step}
                  </p>
                  <div className="absolute top-7 right-7 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                  {i < 2 && (
                    <ArrowRight className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-10 h-5 w-5 text-primary/40" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── APPLICATION FORM ───── */}
        <section id="apply" className="py-24 px-6 bg-[#f8f7f4]">
          <div className="max-w-2xl mx-auto">
            {success ? (
              <div className="text-center py-16">
                <div className="success-icon w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h2 className="font-display text-3xl font-extrabold text-[#0f0f0f] mb-3">{t.success_title}</h2>
                <p className="text-gray-500 mb-10 max-w-sm mx-auto leading-relaxed">{t.success_msg}</p>
                <Link href="/"
                  className="glow-btn inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-display font-bold rounded-xl shadow-lg shadow-primary/25">
                  {t.success_back}
                </Link>
              </div>
            ) : (
              <>
                {/* Form header */}
                <div className="text-center mb-12">
                  <span className="inline-block text-xs font-bold tracking-widest uppercase text-primary mb-3">
                    ✦ Apply Now ✦
                  </span>
                  <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[#0f0f0f] leading-tight">
                    {t.form_title}
                  </h2>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}

                {/* Form card */}
                <div className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50 p-8 md:p-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-2">{t.form_name}</label>
                        <input type="text" name="name" value={form.name} onChange={handleChange}
                          placeholder="Rahul Sharma"
                          className="partner-input w-full px-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-[#0f0f0f] text-sm font-medium placeholder:text-gray-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-2">{t.form_email}</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange}
                          placeholder="rahul@email.com"
                          className="partner-input w-full px-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-[#0f0f0f] text-sm font-medium placeholder:text-gray-300" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-2">{t.form_phone}</label>
                        <input type="tel" name="number" value={form.number} onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className="partner-input w-full px-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-[#0f0f0f] text-sm font-medium placeholder:text-gray-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-2">{t.form_city}</label>
                        <input type="text" name="city" value={form.city} onChange={handleChange}
                          placeholder="Mumbai"
                          className="partner-input w-full px-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-[#0f0f0f] text-sm font-medium placeholder:text-gray-300" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-2">{t.form_state}</label>
                      <input type="text" name="state" value={form.state} onChange={handleChange}
                        placeholder="Maharashtra"
                        className="partner-input w-full px-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-[#0f0f0f] text-sm font-medium placeholder:text-gray-300" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-2">{t.form_message}</label>
                      <textarea name="message" value={form.message} onChange={handleChange}
                        placeholder="Tell us about your business, audience size, platforms you use..."
                        rows={4}
                        className="partner-input w-full px-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-[#0f0f0f] text-sm font-medium placeholder:text-gray-300 resize-none" />
                    </div>

                    <button type="submit" disabled={loading}
                      className="glow-btn w-full py-4 bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-display font-bold text-base rounded-xl transition-all duration-300 shadow-lg shadow-primary/25 flex items-center justify-center gap-2.5">
                      {loading ? (
                        <>
                          <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t.form_submitting}
                        </>
                      ) : (
                        <>
                          {t.form_submit}
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-gray-400 leading-relaxed">{t.note}</p>
                  </form>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}