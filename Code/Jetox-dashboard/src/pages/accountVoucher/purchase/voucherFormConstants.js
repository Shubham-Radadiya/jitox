import dayjs from "dayjs";

export function parseNum(v) {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function fmtInr(n) {
  return `₹${Math.round(Number(n) || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

/** Party column from list rows is the account business name (API). */
export function partyValueFromPartyNameLabel(label) {
  return String(label || "").trim();
}

export function nextRevoucherNumber(current) {
  const s = String(current || "V000");
  const digits = s.match(/(\d+)/);
  const n = digits ? parseInt(digits[1], 10) : 0;
  const next = (Number.isFinite(n) ? n : 0) + 1;
  return `V${String(next).padStart(3, "0")}`;
}

/**
 * @param {Record<string, unknown>} row — list row
 * @param {"edit"|"revoucher"} mode
 */
export function buildPurchasePrefill(row, mode) {
  if (!row) return null;
  const party = partyValueFromPartyNameLabel(row["Party Name"] || "");
  const rawDate = row["Date"];
  const purchaseDate =
    rawDate && dayjs(rawDate).isValid()
      ? dayjs(rawDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");
  const voucherBase = row["Voucher No."] || row["Voucher No"] || "V001";
  const voucherNo =
    mode === "revoucher" ? nextRevoucherNumber(voucherBase) : String(voucherBase);
  const raw = row._raw;
  const narrationFromApi =
    raw?.narration ?? raw?.remarks ?? row["Narration"] ?? row["Remarks"];
  const out = {
    partyName: party,
    purchaseDate,
    voucherNo,
  };
  if (narrationFromApi != null && String(narrationFromApi).trim()) {
    out.narration = String(narrationFromApi).trim();
  }
  return out;
}
