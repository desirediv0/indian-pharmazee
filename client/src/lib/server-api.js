import { API_URL } from "@/lib/utils";

/**
 * Fetch JSON from the API on the server (for pages that are cached and
 * re-generated in the background, so the content is already in the HTML and
 * does not have to be fetched again after the page loads in the browser).
 *
 * Never throws: it returns null when the API is slow, down or answers an
 * error, and the page falls back to loading that part in the browser.
 */
export async function getServerJson(path, { revalidate = 60, timeoutMs = 5000 } = {}) {
  try {
    const base = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;
    const response = await fetch(`${base}${path}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;

    const json = await response.json();
    return json?.success === false ? null : json;
  } catch (error) {
    console.error(`Server fetch failed for ${path}:`, error?.message || error);
    return null;
  }
}
