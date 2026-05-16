/**
 * Persist user-added scheme dropdown options (type / audience / offer) in localStorage
 * so they still appear after closing and reopening the Add/Edit Scheme modal.
 */

export const SCHEME_FORM_PERSIST_KEYS = {
  schemeTypes: "jitox.schemeMaster.customSchemeTypes",
  targetAudiences: "jitox.schemeMaster.customTargetAudiences",
  offerDetails: "jitox.schemeMaster.customOfferDetails",
};

export function loadPersistedSchemeOptions(storageKey) {
  if (typeof window === "undefined" || !storageKey) return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.value === "string")
      .map((x) => ({
        label: String(x.label ?? x.value).trim(),
        value: String(x.value).trim(),
      }))
      .filter((x) => x.value);
  } catch {
    return [];
  }
}

/**
 * @param {{ label: string; value: string }[]} defaults
 * @param {string} storageKey
 */
export function mergeDefaultsWithPersistedCustom(defaults, storageKey) {
  const base = Array.isArray(defaults) ? [...defaults] : [];
  const customs = loadPersistedSchemeOptions(storageKey);
  const seen = new Set(base.map((o) => String(o.value).toLowerCase()));
  for (const c of customs) {
    const k = String(c.value).toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    base.push(c);
  }
  return base;
}

/**
 * Save a user-added option (not already in shipped defaults).
 *
 * @param {string} storageKey
 * @param {{ label: string; value: string }} opt
 * @param {{ label: string; value: string }[]} defaultOptions
 */
export function appendPersistedSchemeOption(storageKey, opt, defaultOptions) {
  if (typeof window === "undefined" || !storageKey || !opt?.value) return;
  const v = String(opt.value).toLowerCase();
  const defSet = new Set(
    (defaultOptions || []).map((o) => String(o.value).toLowerCase())
  );
  if (defSet.has(v)) return;

  const list = loadPersistedSchemeOptions(storageKey);
  if (list.some((o) => String(o.value).toLowerCase() === v)) return;

  list.push({
    label: String(opt.label ?? opt.value).trim(),
    value: String(opt.value).trim(),
  });
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(list));
  } catch {
    /* quota / private mode */
  }
}
