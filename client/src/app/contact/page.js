"use client";

import { useState } from "react";
import { 
  Phone, Mail, Send, Loader2, MessageSquare, 
  ShieldCheck, Thermometer, ArrowRight, BadgeCheck, Stethoscope, Clock
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { fetchApi } from "@/lib/utils";
import { toast } from "sonner";

export default function ContactPage() {
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Specialty Medicine Sourcing",
    message: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const response = await fetchApi("/content/contact", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      toast.success(response.data?.message || "Your enquiry has been received successfully!");
      setFormData({ name: "", email: "", phone: "", subject: "Specialty Medicine Sourcing", message: "" });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.message || "Failed to submit enquiry. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#F8FAFC]">

      {/* Premium Hero Section */}
      <section
        className="relative py-16 md:py-24 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A2540 0%, #004B93 50%, #00366D 100%)" }}
      >
        {/* Fine grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(22,199,217,0.15)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60" />
        
        {/* Glow circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 right-10 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #16C7D9, transparent)" }} />
          <div className="absolute bottom-10 -left-10 w-80 h-80 rounded-full blur-3xl opacity-15" style={{ background: "radial-gradient(circle, #005EB8, transparent)" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border"
            style={{ background: "rgba(22,199,217,0.12)", borderColor: "rgba(22,199,217,0.25)", color: "#16C7D9" }}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Direct Sourcing Support
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.15] font-display">
            Connect With <span className="bg-gradient-to-r from-[#16C7D9] to-white bg-clip-text text-transparent">Our Sourcing Experts</span>
          </h1>
          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Submit a sourcing enquiry or contact our patient coordinators on WhatsApp for direct medicine queries.
          </p>
        </div>
      </section>

      {/* Main Grid Content */}
      <section className="py-16 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Essential Contacts & Quality Indicators */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* About Card */}
            <div className="bg-white rounded-3xl p-8 border border-[#E2E8F0] shadow-sm">
              <h3 className="text-lg font-bold font-display text-slate-900 mb-4 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#005EB8]">
                  <Stethoscope className="w-5 h-5" />
                </div>
                About Our Platform
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                At Indian Pharmazee, we provide a trusted platform offering genuine branded medicines and healthcare products at affordable prices, ensuring reliable service. Our extensive range includes specialty medicines across categories such as IVF care, oncology (anti-cancer medicines), sexual wellness, orthopedic care, chronic care, and many more healthcare segments.
              </p>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5 hover:bg-white hover:border-[#005EB8]/20 transition-all duration-300">
                  <Thermometer className="w-5 h-5 text-[#16C7D9] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Temp-Controlled Delivery</p>
                    <p className="text-xs text-slate-500 leading-normal mt-0.5">
                      We deliver temperature-sensitive products safely at <span className="text-[#005EB8] font-bold">2°C – 8°C</span> with professional courier partners across India.
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5 hover:bg-white hover:border-[#005EB8]/20 transition-all duration-300">
                  <Clock className="w-5 h-5 text-[#005EB8] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Working Hours</p>
                    <p className="text-xs text-slate-500 leading-normal mt-0.5">
                      10:30 AM to 7:00 PM (Daily active response team)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Cards Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              
              {/* WhatsApp Card */}
              <a
                href="https://wa.me/919560247619"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-3xl p-6 border border-[#E2E8F0] hover:border-emerald-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                  <FaWhatsapp className="h-6 w-6" />
                </div>
                <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">WhatsApp Sourcing</h4>
                <p className="text-sm font-extrabold text-slate-800 mb-2">+91 95602 47619</p>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 group-hover:bg-emerald-500/10 transition-all duration-300">Click to Message</span>
              </a>

              {/* Call Card */}
              <a
                href="tel:+919560247619"
                className="group bg-white rounded-3xl p-6 border border-[#E2E8F0] hover:border-blue-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 bg-blue-50 text-[#005EB8] border border-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#005EB8] group-hover:text-white transition-all duration-300">
                  <Phone className="h-5 w-5" />
                </div>
                <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Call Coordinators</h4>
                <p className="text-sm font-extrabold text-slate-800 mb-2">+91 95602 47619</p>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-100 group-hover:bg-[#005EB8]/10 transition-all duration-300">Click to Call</span>
              </a>

              {/* Email Card */}
              <a
                href="mailto:indianpharmazee@gmail.com"
                className="group bg-white rounded-3xl p-6 border border-[#E2E8F0] hover:border-teal-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center sm:col-span-2"
              >
                <div className="w-12 h-12 bg-teal-50 text-[#16C7D9] border border-teal-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#16C7D9] group-hover:text-white transition-all duration-300">
                  <Mail className="h-5 w-5" />
                </div>
                <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Corporate Email</h4>
                <p className="text-sm font-extrabold text-[#005EB8] break-all mb-1">indianpharmazee@gmail.com</p>
                <p className="text-xs text-slate-400">Response within 12-24 hours</p>
              </a>

            </div>

          </div>

          {/* Right Column: Contact / Enquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-8 border border-[#E2E8F0] shadow-sm">
              <div className="mb-6">
                <span
                  className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full mb-3"
                  style={{ background: "rgba(0,94,184,0.06)", color: "#005EB8" }}
                >
                  Secure Sourcing Intake
                </span>
                <h2 className="text-2xl font-bold font-display text-slate-900">
                  Submit Sourcing Request
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Complete this secure form to enquire about specialty medications, IVF, or oncology drugs.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Amit Kumar"
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#005EB8]/10 focus:border-[#005EB8] focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+91 95602 47619"
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#005EB8]/10 focus:border-[#005EB8] focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="amit.kumar@example.com"
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#005EB8]/10 focus:border-[#005EB8] focus:outline-none transition-all text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Inquiry Category</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#005EB8]/10 focus:border-[#005EB8] focus:outline-none transition-all text-sm font-semibold text-slate-700"
                  >
                    <option>Specialty Medicine Sourcing</option>
                    <option>IVF & Infertility Medicines</option>
                    <option>Oncology / Anti-Cancer Sourcing</option>
                    <option>Transplant Medicines</option>
                    <option>Sexual Wellness & HGH</option>
                    <option>Chronic Care & Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Medication Details & Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    placeholder="Please include medicine name, strength (e.g. 50mg), and quantity needed."
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#005EB8]/10 focus:border-[#005EB8] focus:outline-none transition-all text-sm font-semibold resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 rounded-xl font-semibold gap-2 bg-[#005EB8] hover:bg-[#004b93] text-white transition-all shadow-md shadow-blue-500/10 border-0"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Submitting Enquiry...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

        </div>
      </section>

      {/* WhatsApp Banner */}
      <section className="py-12 px-6 sm:px-8 lg:px-12 bg-slate-50 border-t border-[#DCE7F2]">
        <div
          className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden p-8 md:p-12 border flex flex-col md:flex-row items-center justify-between gap-6"
          style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 50%, #E9D5FF 100%)",
            borderColor: "#D8B4FE",
            boxShadow: "0 10px 30px rgba(126, 34, 206, 0.05)"
          }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 pointer-events-none"
            style={{ background: "radial-gradient(circle, #C084FC, transparent)" }}
          />
          <div className="relative z-10 text-center md:text-left">
            <h3 className="text-xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2" style={{ color: "#5B21B6" }}>
              <FaWhatsapp className="w-6 h-6" style={{ color: "#7E22CE" }} />
              Message us on WhatsApp to know more
            </h3>
            <p className="text-gray-600 text-sm">
              Send your prescription for direct pricing quotes and temp-controlled shipping options.
            </p>
          </div>
          <a
            href="https://wa.me/919560247619"
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 flex-shrink-0 w-full md:w-auto"
          >
            <Button
              size="lg"
              className="w-full md:w-auto text-white px-8 h-12 rounded-xl font-bold gap-2 border-0 shadow-lg shadow-purple-200"
              style={{ background: "#7E22CE" }}
            >
              Start WhatsApp Chat <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </section>
      
    </div>
  );
}
