/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "desirediv-storage.blr1.digitaloceanspaces.com",
            },
            {
                protocol: "https",
                hostname: "pub-67f953912205445f932ab892164f22e5.r2.dev",
            },
        ]
    },
    experimental: {
        webpackBuildWorker: false,
    },
    async redirects() {
        // Old category slug -> new SEO-friendly slug (301 permanent).
        // Keep this in sync with slug changes made in the admin panel.
        const categorySlugMap = {
            "ivf---in-vitro-fertilization": "ivf-medicines",
            "anti-cancer": "anti-cancer-medicines",
            "antibiotics--vaccine-": "antibiotics-vaccines",
            "anemia": "anemia-medicines",
            "anti-cloting-enoxaparins-": "enoxaparin",
            "antifungal": "antifungal-medicines",
            "transplant": "transplant-medicines",
            "diabetes--heart-health-": "diabetes-heart-health",
            "sexual-wellness-": "sexual-wellness",
            "osteoporosis": "osteoporosis-medicines",
            "arthritis": "arthritis-medicines",
            "other-medicine": "other-medicines",
        };

        return Object.entries(categorySlugMap).map(([oldSlug, newSlug]) => ({
            source: `/category/${oldSlug}`,
            destination: `/category/${newSlug}`,
            permanent: true,
        }));
    },
    async rewrites() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.indianpharmazee.com/api";
        const cleanApiUrl = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;
        return [
            {
                source: "/sitemap.xml",
                destination: `${cleanApiUrl}/public/sitemap.xml`,
            },
        ];
    },
};

export default nextConfig;
