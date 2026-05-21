/** Order workflow statuses (quotation → order, Order List & drawer). */
export const ORDER_STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "Dispatched", label: "Dispatched" },
  { value: "Processing", label: "Processing" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Approved", label: "Approved" },
];

export const ORDER_STATUS_VALUES = ORDER_STATUS_OPTIONS.map((o) => o.value);

/** Status while still a quote (not on Order List). */
export const QUOTATION_ONLY_STATUS = "Quotation";

/** Quotation status column — not the same as Order List workflow status. */
export const QUOTATION_LIST_STATUS = {
  PENDING: "Pending",
  NOT_ON_ORDER_LIST: "Not on order list",
  ON_ORDER_LIST: "On order list",
};

/** Strict check — avoids `"false"` string being truthy in Boolean(). */
/** User already chose add or remove — hide both action buttons. */
export function hasOrderListDecisionMade(doc) {
  if (doc?.orderListDecisionMade === true) return true;
  if (
    doc?.orderListDecisionMade == null &&
    isQuotationOnOrderList(doc)
  ) {
    return true;
  }
  return false;
}

export function isQuotationOnOrderList(doc) {
  if (doc == null || typeof doc !== "object") return false;
  const v = doc.addedToOrder;
  if (v === true) return true;
  if (v === false || v === 0 || v === null) return false;
  if (typeof v === "string") return v.trim().toLowerCase() === "true";
  return false;
}

export function displayQuotationListStatus(doc) {
  if (isQuotationOnOrderList(doc)) return QUOTATION_LIST_STATUS.ON_ORDER_LIST;
  if (hasOrderListDecisionMade(doc)) return QUOTATION_LIST_STATUS.NOT_ON_ORDER_LIST;
  return QUOTATION_LIST_STATUS.PENDING;
}

export function normalizeOrderStatus(value) {
  const s = String(value ?? "").trim();
  if (!s) return "";
  const hit = ORDER_STATUS_VALUES.find(
    (v) => v.toLowerCase() === s.toLowerCase()
  );
  return hit || "";
}

/** Maps order status → Order List tab (`dashboardTab`). */
export function dashboardTabForOrderStatus(status) {
  const n = normalizeOrderStatus(status);
  if (n === "Dispatched") return "dispatched";
  if (n === "Cancelled") return "cancelled";
  return "pending";
}

/** Read-only label for UI (handles legacy values like "Order"). */
export function displayOrderStatus(value, { isQuotation = false } = {}) {
  const n = normalizeOrderStatus(value);
  if (n) return n;
  const raw = String(value ?? "").trim();
  if (raw.toLowerCase() === "order") return "Pending";
  if (isQuotation || raw.toLowerCase() === "quotation") return QUOTATION_ONLY_STATUS;
  return raw || (isQuotation ? QUOTATION_ONLY_STATUS : "Pending");
}
