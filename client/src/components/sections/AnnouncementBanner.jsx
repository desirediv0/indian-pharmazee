"use client";

import React from 'react';

const MESSAGES = [
  "💊 Genuine Branded Medicines — Verified Sources",
  "❄️ Temp-Controlled 2°C–8°C Delivery Available",
  "🚚 Pan-India Delivery — Fast & Reliable",
  "💬 Message us on WhatsApp for Medicine Enquiries",
  "✅ IVF · Oncology · Transplant · Sexual Wellness · Ayurvedic",
];

const AnnouncementBanner = () => {
  return (
    <div
      className="py-2.5 overflow-hidden relative group"
      style={{ background: "linear-gradient(90deg, #005EB8, #0074e4, #16C7D9, #0074e4, #005EB8)" }}
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="whitespace-nowrap flex animate-marquee hover:pause-marquee">
        <div className="flex items-center gap-10 px-6">
          {[...Array(3)].map((_, repeat) =>
            MESSAGES.map((msg, i) => (
              <div key={`${repeat}-${i}`} className="flex items-center gap-3 text-white">
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                <span className="text-[12px] font-bold uppercase tracking-wider">{msg}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
          width: max-content;
        }
        .pause-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default AnnouncementBanner;
