/**
 * Builds a publicly fetchable URL for an `uploads/...` path that the
 * backend persists from multer (`req.file.path`). Handles:
 *  - Windows backslashes (`uploads\\foo.jpg`)
 *  - Already-absolute URLs (passes them through unchanged)
 *  - Trailing slash on `VITE_API_BASE_URL`
 */
const DEFAULT_BASE = "http://localhost:4000";

export function buildUploadUrl(storedPath) {
  if (!storedPath) return "";
  const raw = String(storedPath).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "");
  const withoutUploadsPrefix = normalized.replace(/^uploads\//i, "");
  const base = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE).replace(
    /\/+$/,
    ""
  );
  return `${base}/uploads/${withoutUploadsPrefix}`;
}
