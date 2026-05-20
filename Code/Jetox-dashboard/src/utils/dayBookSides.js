/** Keep in sync with `resolveDayBookAmounts` in Jitox-api `dayBookLogger.ts`. */

function toAmountString(value) {
  if (value === undefined || value === null) return "0";
  const str = typeof value === "number" ? String(value) : String(value).trim();
  return str.length > 0 ? str : "0";
}

export function resolveDayBookAmounts(voucherType, debitAmount, creditAmount) {
  const d = toAmountString(debitAmount);
  const c = toAmountString(creditAmount);
  const amt = d !== "0" ? d : c !== "0" ? c : "0";

  if (d !== c || amt === "0") {
    return { debitAmount: d, creditAmount: c };
  }

  const t = String(voucherType || "").trim().toLowerCase();

  if (t === "receipt" || t === "sales" || t === "sales return") {
    return { debitAmount: "0", creditAmount: amt };
  }
  if (t === "purchase return") {
    return { debitAmount: "0", creditAmount: amt };
  }
  if (t === "payment" || t === "purchase" || t === "expense") {
    return { debitAmount: amt, creditAmount: "0" };
  }

  return { debitAmount: amt, creditAmount: "0" };
}

export function formatDayBookAmountCell(value) {
  const x = Number(String(value ?? "").replace(/,/g, ""));
  if (!Number.isFinite(x) || x === 0) return "—";
  return x.toLocaleString("en-IN");
}
