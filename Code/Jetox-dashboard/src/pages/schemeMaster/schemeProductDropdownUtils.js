import { DEFAULT_APPLICABLE_OPTIONS } from "./schemeFormDropdownOptions";

/** Demo seed uses this prefix on `productName`; hide it in scheme Applicable value/label. */
const JITOX_DEMO_PRODUCT_NAME_PREFIX = /^JITOX-DEMO\s+/i;

/**
 * @param {unknown} name
 * @returns {string}
 */
export function stripJitoxDemoProductNamePrefix(name) {
  const s = String(name ?? "").trim();
  if (!s) return "";
  const stripped = s.replace(JITOX_DEMO_PRODUCT_NAME_PREFIX, "").trim();
  return stripped || s;
}

/**
 * Turn purchase-form-meta `products` rows into `{ value, label }` for scheme "Applicable".
 * Uses product **name** for both (matches existing `appliedProducts` string storage).
 * Strips demo-seed `JITOX-DEMO ` prefix so Applied Products stays a clean display name.
 *
 * @param {Array<{ value?: string; label?: string }>} products
 * @returns {{ value: string; label: string }[]}
 */
export function schemeApplicableOptionsFromProducts(products) {
  if (!Array.isArray(products) || !products.length) return [];
  const out = [];
  const seen = new Set();
  for (const p of products) {
    const raw = String(p.label ?? "").trim();
    if (!raw) continue;
    const label = stripJitoxDemoProductNamePrefix(raw);
    if (!label) continue;
    const k = label.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ value: label, label });
  }
  return out;
}

/**
 * Default scopes (All products, …) first, then product master names, deduped by value.
 *
 * @param {Array<{ value?: string; label?: string }>} products — from `usePurchaseFormMeta().data.products`
 */
export function mergeApplicableDefaultsAndProducts(products) {
  const fromProducts = schemeApplicableOptionsFromProducts(products);
  const seen = new Set();
  const out = [];
  for (const o of [...DEFAULT_APPLICABLE_OPTIONS, ...fromProducts]) {
    const k = String(o.value ?? "").trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push({
      value: String(o.value).trim(),
      label: String(o.label ?? o.value).trim(),
    });
  }
  return out;
}
