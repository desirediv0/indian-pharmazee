"use client";

import Image from "next/image";
import { FaWhatsapp } from "react-icons/fa";

export const FloatingWhatsApp = () => {
  const phoneNumber = "919560247619";
  const message = encodeURIComponent("Hello Indian Pharmazee, I would like to enquire about specialty medicines.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group hidden md:flex items-center gap-4 bg-gradient-to-r from-[#03360E] to-[#0A5618] hover:from-[#022409] hover:to-[#073c10] border border-white/20 px-4 py-2 rounded-full shadow-2xl hover:shadow-emerald-950/20 hover:scale-105 transition-all duration-300 cursor-pointer"
      aria-label="Chat on WhatsApp"
    >
      {/* Pulse Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse pointer-events-none" />

      {/* Text on Left */}
      <div className="flex flex-col items-start leading-tight">
        <span className="font-extrabold text-white text-base tracking-wider uppercase font-display">
          CHAT WITH US
        </span>
        <span className="text-xs text-white/95 font-medium tracking-widest italic uppercase mt-0.5">
          ON WHATSAPP
        </span>
      </div>

      {/* Icon on Right */}
      <Image src="/whatsapp.png" alt="WhatsApp Icon"
        width={40}
        height={40}
        className="w-11 h-11 object-contain" />
    </a>
  );
};

export default FloatingWhatsApp;
