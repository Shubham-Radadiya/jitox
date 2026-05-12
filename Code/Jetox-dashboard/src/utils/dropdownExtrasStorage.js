/**
 * Persist dropdown option lists beyond built-in defaults (localStorage).
 * Used by Add Product and Purchase Invoice GST / payment terms quick-add.
 */

export function readStoredExtras(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const p = JSON.parse(raw);
    if (!Array.isArray(p)) return [];
    return p
      .filter(
        (x) =>
          x &&
          typeof x === "object" &&
          String(x.value ?? "").length &&
          String(x.label ?? "").length
      )
      .map((x) => ({
        value: String(x.value),
        label: String(x.label ?? x.value),
      }));
  } catch {
    return [];
  }
}

export function writeStoredExtras(key, extras) {
  try {
    localStorage.setItem(key, JSON.stringify(extras));
  } catch {
    /* ignore quota */
  }
}

/** Defaults first, then stored extras whose `value` is not already in defaults. */
export function mergeDefaultAndStoredExtras(defaults, storedExtras) {
  const base = [...defaults];
  const seen = new Set(defaults.map((d) => String(d.value)));
  for (const o of storedExtras) {
    const v = String(o.value);
    if (!v || seen.has(v)) continue;
    seen.add(v);
    base.push({ value: v, label: String(o.label ?? v) });
  }
  return base;
}

/** Save only options not in built-in defaults so code updates to defaults still apply. */
export function persistFullOptions(key, defaults, fullOptions) {
  const defVals = new Set(defaults.map((d) => String(d.value)));
  const extras = fullOptions.filter((o) => !defVals.has(String(o.value)));
  writeStoredExtras(key, extras);
}
