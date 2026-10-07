
import HeroSection from "@/components/sections/HeroSection";
import AnnouncementBanner from "@/components/sections/AnnouncementBanner";
import HomePageContent from "@/components/sections/HomePageContent";
import { WhyBuySection } from "@/components/sections/WhyBuySection";
// import FeaturedOffers from "@/components/sections/FeaturedOffers";
import {
  ColdChainBanner,
} from "@/components/sections/PharmaHomeSections";
import CategoryGrid from "@/components/sections/CategoryGrid";
import PageFaqs from "@/components/sections/PageFaqs";

export const metadata = {
  title: "Indian Pharmazee | Trusted Specialty Medicines Across India",
  description: "Genuine branded medicines, oncology care, IVF solutions, chronic care, transplant medicines with temp-controlled delivery across India.",
  alternates: {
    canonical: "https://www.indianpharmazee.com/",
  },
};

// Re-generate at most once a minute so FAQ edits in the admin show up quickly
export const revalidate = 60;

export default function Home() {
  return (
    <>
      <main>
        {/* Hero */}
        <HeroSection />



        {/* Announcement */}
        <AnnouncementBanner />
        {/* Featured Healthcare Offers */}
        {/* <FeaturedOffers /> */}
        <CategoryGrid />

        {/* Dynamic product sections */}
        <HomePageContent />

        {/* Cold chain delivery banner */}
        <ColdChainBanner />

        {/* Why Choose Us */}
        <WhyBuySection />

        {/* FAQs chosen for the home page in the admin panel */}
        <PageFaqs type="home" />
      </main>
    </>
  );
}
