export const THEME_STORAGE_KEY = "jitox-theme";

/** @returns {"light" | "dark"} */
export function readInitialTheme() {
  if (typeof window === "undefined") return "light";
  try {
    const s = localStorage.getItem(THEME_STORAGE_KEY);
    if (s === "dark" || s === "light") return s;
  } catch {
    /* ignore */
  }
  try {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    /* ignore */
  }
  return "light";
}
