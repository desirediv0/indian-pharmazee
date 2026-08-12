import { API_URL } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const fixedApiUrl = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;
    const response = await fetch(`${fixedApiUrl}/public/sitemap.xml`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap from server: ${response.statusText}`);
    }

    const xml = await response.text();

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error fetching sitemap.xml from backend server:", error);
    return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"><url><loc>https://www.indianpharmazee.com/</loc></url></urlset>", {
      status: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}
