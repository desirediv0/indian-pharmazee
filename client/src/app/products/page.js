import ProductsListContent from "./ProductsListContent";

export const metadata = {
    title: "All Medicines | Indian Pharmazee",
    description:
        "Browse genuine branded medicines and specialty healthcare products — IVF, oncology, transplant, sexual wellness, chronic care, temp-controlled delivery across India.",
    alternates: {
        canonical: "https://www.indianpharmazee.com/products",
    },
    openGraph: {
        title: "All Medicines | Indian Pharmazee",
        description:
            "Browse genuine branded medicines and specialty healthcare products across India.",
        type: "website",
    },
};

export default function ProductsPage() {
    return <ProductsListContent />;
}
