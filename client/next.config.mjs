/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // WebP only: AVIF is much slower to encode on the first request of every image
        formats: ["image/webp"],
        // Default cache is 60s, so optimized images were re-created again and again
        minimumCacheTTL: 2592000,
        deviceSizes: [640, 750, 828, 1080, 1200, 1254, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1254],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "desirediv-storage.blr1.digitaloceanspaces.com",
            },
            {
                protocol: "https",
                hostname: "desirediv-storage.blr1.cdn.digitaloceanspaces.com",
            },
            {
                protocol: "https",
                hostname: "pub-67f953912205445f932ab892164f22e5.r2.dev",
            },
        ],
    },
    experimental: {
        webpackBuildWorker: false,
    },
};

export default nextConfig;
