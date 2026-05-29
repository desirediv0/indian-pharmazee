
import HeroSection from "@/components/sections/HeroSection";
import AnnouncementBanner from "@/components/sections/AnnouncementBanner";
import HomePageContent from "@/components/sections/HomePageContent";
import { WhyBuySection } from "@/components/sections/WhyBuySection";
import FeaturedOffers from "@/components/sections/FeaturedOffers";
import {
  ColdChainBanner,
} from "@/components/sections/PharmaHomeSections";

export const metadata = {
  title: "Indian Pharmazee | Trusted Specialty Medicines Across India",
  description: "Genuine branded medicines, oncology care, IVF solutions, chronic care, transplant medicines with cold chain delivery across India.",
};

export default function Home() {
  return (
    <>
      <main>
        {/* Hero */}
        <HeroSection />



        {/* Announcement */}
        <AnnouncementBanner />
        {/* Featured Healthcare Offers */}
        <FeaturedOffers />

        {/* Dynamic product sections */}
        <HomePageContent />

        {/* Cold chain delivery banner */}
        <ColdChainBanner />

        {/* Why Choose Us */}
        <WhyBuySection />
      </main>
    </>
  );
}
