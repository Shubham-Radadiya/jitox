export const PURCHASE_PAYMENT_STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "Paid", label: "Paid" },
  { value: "Unpaid", label: "Unpaid" },
];

/** Party name from a purchase list row (for pay / payment-request actions). */
export function purchaseRowPartyName(row) {
  const raw = row?._raw || {};
  return String(raw.partyName || row?.["Party Name"] || "").trim();
}

export function purchaseRowHasParty(row) {
  const name = purchaseRowPartyName(row);
  return Boolean(name && name !== "—");
}

/** List + detail view: use saved status, else Pending (not payment mode). */
export function resolvePurchasePaymentStatusDisplay(doc) {
  const explicit = String(doc?.paymentStatus || "").trim();
  if (["Pending", "Paid", "Unpaid"].includes(explicit)) return explicit;
  return "Pending";
}
