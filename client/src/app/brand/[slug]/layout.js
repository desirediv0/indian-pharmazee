import { fetchApi } from "@/lib/utils";

export async function generateMetadata({ params }) {
    const { slug } = params;
    let title = "Brand | Indian Pharmazee";
    let description =
        "Genuine branded medicines and specialty healthcare products from trusted pharmaceutical brands, available across India with temp-controlled delivery.";

    try {
        const response = await fetchApi(
            `/public/brands/${slug}?page=1&limit=1`,
            { cache: "no-store" }
        );
        const brand = response?.data?.brand;

        if (brand) {
            title = `${brand.name} Medicines | Indian Pharmazee`;
            description = `Buy genuine ${brand.name} medicines and healthcare products online at Indian Pharmazee, with reliable pan-India delivery.`;
        }
    } catch (error) {
        console.error("Error fetching brand metadata:", error);
    }

    return {
        title,
        description,
        alternates: {
            canonical: `https://www.indianpharmazee.com/brand/${slug}`,
        },
        openGraph: {
            title,
            description,
            type: "website",
        },
    };
}

export default function BrandLayout({ children }) {
    return children;
}
