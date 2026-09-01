// API base URL configuration
const base =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production"
    ? "https://api.indianpharmazee.com"
    : "http://localhost:4004");

export const API_URL = base.endsWith("/api") ? base : `${base}/api`;
