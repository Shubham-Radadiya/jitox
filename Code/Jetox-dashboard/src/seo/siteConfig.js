/** Public site origin — must match production (see .env VITE_SITE_URL). */
export const SITE_NAME = "Jitox";


export function getSiteUrl() {
  const raw = import.meta.env.VITE_SITE_URL || "https://jitox.com";
  return String(raw).replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p === "//") return `${base}/`;
  return `${base}${p}`;
}

export const DEFAULT_OG_IMAGE_PATH = "/jitox-logo.png";

export function getOgImageAbsolute() {
  return absoluteUrl(DEFAULT_OG_IMAGE_PATH.replace(/^\//, ""));
}

export function getGaMeasurementId() {
  return import.meta.env.VITE_GA_MEASUREMENT_ID || "";
}

export function getGscVerification() {
  return import.meta.env.VITE_GSC_VERIFICATION || "";
}
