// API base URL configuration
export const API_URL =
  import.meta.env.MODE === "production"
    ? "https://www.indianpharmazee.com/api"
    : "http://localhost:4004/api";
