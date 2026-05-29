import { Instagram, Facebook, Youtube, ArrowUpRight } from "lucide-react";

const SOCIALS = [
  {
    name: "Instagram",
    handle: "@indianpharmazee",
    url: "https://www.instagram.com/",
    icon: Instagram,
    accent: "#E1306C",
    accentBg: "rgba(225, 48, 108, 0.08)",
    desc: "Medicine updates, health tips & pharma news",
    stats: "12K+ Followers"
  },
  {
    name: "Facebook",
    handle: "Indian Pharmazee",
    url: "https://www.facebook.com/",
    icon: Facebook,
    accent: "#1877F2",
    accentBg: "rgba(24, 119, 242, 0.08)",
    desc: "Patient stories, medicine availability & offers",
    stats: "25K+ Likes"
  },
  {
    name: "YouTube",
    handle: "@indianpharmazee",
    url: "https://youtube.com/",
    icon: Youtube,
    accent: "#FF0000",
    accentBg: "rgba(255, 0, 0, 0.08)",
    desc: "Cold chain demos, medicine sourcing & health guides",
    stats: "8K+ Subscribers"
  },
];

export const SocialMediaSection = () => {
  return (
    <section className="relative bg-white py-20 overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-[11px] font-bold uppercase tracking-wider mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Join Our Community
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight">
              We&apos;re active online. <br />
              <span className="text-primary">Connect with us.</span>
            </h2>
          </div>
          <p className="text-gray-500 max-w-xs md:text-right text-base leading-relaxed">
            Get your daily dose of freshness. Follow us for farm updates, healthy tips, and exclusive community offers.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SOCIALS.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-white p-8 rounded-[32px] border border-gray-100 transition-all duration-500 hover:border-transparent hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              {/* Hover Background Accent */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${s.accentBg} 0%, transparent 100%)` }}
              />

              {/* Icon & Arrow */}
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                  style={{ background: s.accentBg }}
                >
                  <s.icon className="h-7 w-7" style={{ color: s.accent }} />
                </div>
                <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-gray-900 group-hover:border-gray-900 transition-all duration-300">
                  <ArrowUpRight
                    className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors"
                  />
                </div>
              </div>

              {/* Text Content */}
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{s.name}</h3>
                <p className="text-sm font-semibold mb-4 transition-colors" style={{ color: s.accent }}>
                  {s.handle}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed mb-6 group-hover:text-gray-600 transition-colors">
                  {s.desc}
                </p>
                
                {/* Stats Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-[11px] font-bold text-gray-400 group-hover:bg-white group-hover:text-gray-500 transition-colors border border-transparent group-hover:border-gray-100">
                  {s.stats}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialMediaSection;