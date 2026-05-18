/** Internal dropdown value for the Cash ledger (API receives label `Cash`). */
export const CASH_LEDGER_OPTION = {
  value: "__cash_ledger__",
  label: "Cash",
};

/** Party accounts only (for bank side of cash ↔ bank transfers). */
export function buildAccountPartyOptions(parties = []) {
  return (parties || [])
    .filter((p) => p?.value != null && String(p.value).trim() !== "")
    .map((p) => ({
      value: String(p.value),
      label: String(p.label ?? p.value).trim(),
    }))
    .filter((o) => o.label.toLowerCase() !== "cash");
}

/**
 * All account parties plus Cash (legacy / generic pickers).
 */
export function buildCashBankPartyOptions(parties = []) {
  const accountOpts = buildAccountPartyOptions(parties);
  return [CASH_LEDGER_OPTION, ...accountOpts];
}

/** Resolve dropdown value → name sent as debitFrom / creditTo on the API. */
export function partyLabelFromOptions(options, selectedValue) {
  if (selectedValue == null || String(selectedValue).trim() === "") return "";
  const v = String(selectedValue);
  const hit = (options || []).find((o) => String(o.value) === v);
  if (hit) return String(hit.label ?? hit.value).trim();
  if (v === CASH_LEDGER_OPTION.value) return CASH_LEDGER_OPTION.label;
  return v.trim();
}
