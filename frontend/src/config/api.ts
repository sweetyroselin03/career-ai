export const API_URL = import.meta.env.VITE_API_URL || "";

if (!API_URL) {
  console.warn(
    "WARNING: VITE_API_URL environment variable is not defined! " +
    "Frontend API connections will fail. Please verify your Vercel or local environment settings."
  );
}