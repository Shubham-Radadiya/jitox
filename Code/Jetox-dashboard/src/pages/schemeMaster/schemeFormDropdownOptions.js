/** Default `{ label, value }` lists for Add / Edit Scheme — values match API display strings (e.g. seed rows). */

export const DEFAULT_SCHEME_TYPE_OPTIONS = [
  { label: "Cashback", value: "Cashback" },
  { label: "Discount", value: "Discount" },
  { label: "Combo offer", value: "Combo offer" },
];

export const DEFAULT_TARGET_AUDIENCE_OPTIONS = [
  { label: "Farmer", value: "Farmer" },
  { label: "Dealer", value: "Dealer" },
  { label: "Distributor", value: "Distributor" },
];

export const DEFAULT_APPLICABLE_OPTIONS = [
  { label: "All Products", value: "All Products" },
];

export const DEFAULT_OFFER_DETAILS_OPTIONS = [
  { label: "Buy 2 Get 1 Free", value: "Buy 2 Get 1 Free" },
];

/**
 * @param {string} label
 * @returns {{ label: string; value: string } | null}
 */
export function schemeOptionFromLabel(label) {
  const t = String(label ?? "").trim();
  if (!t) return null;
  return { label: t, value: t };
}

/**
 * @param {{ label: string; value: string }[]} prev
 * @param {{ label: string; value: string }} opt
 */
export function mergeSchemeSelectOption(prev, opt) {
  const exists = prev.find(
    (o) => String(o.value).toLowerCase() === String(opt.value).toLowerCase()
  );
  if (exists) {
    return { next: prev, value: exists.value, isNew: false };
  }
  return { next: [...prev, opt], value: opt.value, isNew: true };
}
