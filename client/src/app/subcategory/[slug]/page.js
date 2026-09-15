import { fetchApi } from "@/lib/utils";
import SubCategoryContent from "./SubCategoryContent";

const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

export async function generateMetadata({ params }) {
    const { slug } = params;
    let title = "Sub-category | Indian Pharmazee";
    let description =
        "Genuine branded medicines and specialty healthcare products. IVF, oncology, transplant, temp-controlled delivery across India. Trusted by patients and doctors.";
    let image = null;

    try {
        const response = await fetchApi(
            `/public/subcategories/${slug}/products?page=1&limit=1`,
            { cache: "no-store" }
        );
        const subCategory = response?.data?.subCategory;

        if (subCategory) {
            title = subCategory.metaTitle || `${subCategory.name} | Indian Pharmazee`;
            description =
                subCategory.metaDescription || subCategory.description || description;

            if (subCategory.image) {
                image = getImageUrl(subCategory.image);
            }
        }
    } catch (error) {
        console.error("Error fetching subcategory metadata:", error);
    }

    return {
        title,
        description,
        alternates: {
            canonical: `https://www.indianpharmazee.com/subcategory/${slug}`,
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

export default function SubCategoryPage() {
    return <SubCategoryContent />;
}
