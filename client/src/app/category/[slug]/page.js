import { permanentRedirect } from "next/navigation";
import { fetchApi } from "@/lib/utils";
import CategoryContent from "./CategoryContent";

// Helper function to format image URLs correctly
const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

// Fetch a category once per request (no-store so admin SEO / slug edits reflect
// immediately). Returns the API payload or null.
async function getCategory(slug) {
    try {
        const response = await fetchApi(
            `/public/categories/${slug}/products?page=1&limit=1`,
            { cache: "no-store" }
        );
        return response?.data || null;
    } catch (error) {
        console.error("Error fetching category:", error);
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = params;
    let title = "Category | Indian Pharmazee";
    let description =
        "Genuine branded medicines and specialty healthcare products. IVF, oncology, transplant, temp-controlled delivery across India. Trusted by patients and doctors.";
    let keywords = "";
    let image = null;

    const data = await getCategory(slug);
    const category = data?.category;
    // Old slugs resolve to the current category; canonical points at the new URL
    const canonicalSlug = data?.canonicalSlug || slug;

    if (category) {
        title = category.metaTitle || `${category.name} | Indian Pharmazee`;
        description = category.metaDescription || category.description || description;
        keywords = category.keywords || "";

        if (category.image) {
            image = getImageUrl(category.image);
        }
    }

    return {
        title,
        description,
        keywords: keywords || undefined,
        alternates: {
            canonical: `https://www.indianpharmazee.com/category/${canonicalSlug}`,
        },
        openGraph: {
            title,
            description,
            images: image ? [image] : [],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: image ? [image] : [],
        },
    };
}

export default async function CategoryPage({ params }) {
    const { slug } = params;
    const data = await getCategory(slug);

    // The requested slug is an old one — send the visitor (and crawlers) to the
    // current URL with a permanent redirect.
    if (data?.slugChanged && data?.canonicalSlug) {
        permanentRedirect(`/category/${data.canonicalSlug}`);
    }

    return <CategoryContent />;
}
