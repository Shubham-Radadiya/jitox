/**
 * Normalize Axios / fetch errors for user-facing messages.
 */
export function getApiErrorMessage(error, fallback = "Something went wrong") {
  const msg = error?.response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (Array.isArray(msg) && msg.length) return String(msg[0]);
  if (error?.response?.status === 404) return "Not found.";
  if (error?.response?.status === 401) return "Session expired. Please sign in again.";
  if (error?.response?.status >= 500) return "Server error. Please try again later.";
  if (error?.code === "ERR_NETWORK") return "Network error. Check your connection.";
  return error?.message || fallback;
}

/** Treat backend "empty list" 404 as success with []. */
export function isEmptyListNotFound(error) {
  return error?.response?.status === 404;
}
