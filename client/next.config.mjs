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
