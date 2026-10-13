
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
import { getServerJson } from "@/lib/server-api";

export const metadata = {
  title: "Indian Pharmazee | Trusted Specialty Medicines Across India",
  description: "Genuine branded medicines, oncology care, IVF solutions, chronic care, transplant medicines with temp-controlled delivery across India.",
  alternates: {
    canonical: "https://www.indianpharmazee.com/",
  },
};

// Re-generate at most once a minute so admin edits (banners, products, FAQs…)
// show up quickly. The data below is fetched here, on the server, so the
// hero image, categories and products are already in the HTML instead of
// being fetched in the browser after the page has loaded.
export const revalidate = 60;

const PRODUCT_LISTS = ["featured", "latest", "bestseller", "trending", "new"];
const BRAND_TAGS = ["HOT", "TOP", "NEW"];

export default async function Home() {
  const [banners, categories, ...rest] = await Promise.all([
    getServerJson("/public/banners"),
    getServerJson("/public/categories"),
    ...PRODUCT_LISTS.map((type) => getServerJson(`/public/products/type/${type}?limit=12`)),
    ...BRAND_TAGS.map((tag) => getServerJson(`/public/brands-by-tag?tag=${tag}`)),
  ]);

  // Only pass what loaded: a part that failed is simply fetched in the browser
  const initialProducts = {};
  PRODUCT_LISTS.forEach((type, index) => {
    const products = rest[index]?.data?.products;
    if (Array.isArray(products)) initialProducts[type] = products;
  });

  const initialBrands = {};
  BRAND_TAGS.forEach((tag, index) => {
    const brands = rest[PRODUCT_LISTS.length + index]?.data?.brands;
    if (Array.isArray(brands)) initialBrands[tag] = brands;
  });

  return (
    <>
      <main>
        {/* Hero */}
        <HeroSection initialBanners={banners?.data?.banners ?? null} />



        {/* Announcement */}
        <AnnouncementBanner />
        {/* Featured Healthcare Offers */}
        {/* <FeaturedOffers /> */}
        <CategoryGrid initialCategories={categories?.data?.categories ?? null} />

        {/* Dynamic product sections */}
        <HomePageContent initialProducts={initialProducts} initialBrands={initialBrands} />

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
