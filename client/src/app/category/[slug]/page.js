import { fetchApi } from "@/lib/utils";
import CategoryContent from "./CategoryContent";

// Helper function to format image URLs correctly
const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

export async function generateMetadata({ params }) {
    const { slug } = params;
    let title = "Category | Indian Pharmazee";
    let description =
        "Genuine branded medicines and specialty healthcare products. IVF, oncology, transplant, temp-controlled delivery across India. Trusted by patients and doctors.";
    let keywords = "";
    let image = null;

    try {
        // Fetch category details from API
        const response = await fetchApi(`/public/categories/${slug}/products?page=1&limit=1`);
        const category = response?.data?.category;

        if (category) {
            title = category.metaTitle || `${category.name} | Indian Pharmazee`;
            description = category.metaDescription || category.description || description;
            keywords = category.keywords || "";

            if (category.image) {
                image = getImageUrl(category.image);
            }
        }
    } catch (error) {
        console.error("Error fetching category metadata:", error);
    }

    return {
        title,
        description,
        keywords: keywords || undefined,
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

export default function CategoryPage() {
    return <CategoryContent />;
}
