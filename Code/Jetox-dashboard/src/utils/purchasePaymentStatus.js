export const PURCHASE_PAYMENT_STATUS_OPTIONS = [

  { value: "Pending", label: "Pending" },

  { value: "Partial", label: "Partial" },

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



/** True when no more payment is needed on this purchase row. */

/** Party on a purchase return list row. */
export function purchaseReturnRowPartyName(row) {
  const raw = row?._raw || {};
  return String(raw.partyName || row?.["Party Name"] || "").trim();
}

export function purchaseReturnRowHasParty(row) {
  const name = purchaseReturnRowPartyName(row);
  return Boolean(name && name !== "—");
}

/** Refund status on purchase return list (from linked receipt vouchers). */
export function resolvePurchaseReturnRefundStatusDisplay(doc) {
  const explicit = String(doc?.refundStatus || "").trim();
  if (["Pending", "Partial", "Received"].includes(explicit)) {
    return explicit;
  }
  const total = Number(doc?.totalAmount) || 0;
  const refunded = Number(doc?.refundedAmount) || 0;
  if (total > 0 && refunded >= total) return "Received";
  if (refunded > 0) return "Partial";
  if (doc?.refundRequestId) return "Pending";
  return "Pending";
}

/** True when a refund receipt was already created from this return row. */
export function purchaseReturnRowHasRefund(row) {
  return Boolean(row?._raw?.refundRequestId);
}

/** Party on a sales return list row. */
export function salesReturnRowPartyName(row) {
  const raw = row?._raw || {};
  return String(raw.partyName || row?.["Client Name"] || "").trim();
}

export function salesReturnRowHasParty(row) {
  const name = salesReturnRowPartyName(row);
  return Boolean(name && name !== "—");
}

export function resolveSalesReturnRefundStatusDisplay(doc) {
  const explicit = String(doc?.refundStatus || "").trim();
  if (["Pending", "Processing", "Partial", "Refunded"].includes(explicit)) {
    return explicit;
  }
  const total = Number(doc?.totalAmount) || 0;
  const refunded = Number(doc?.refundedAmount) || 0;
  if (total > 0 && refunded >= total) return "Refunded";
  if (refunded > 0) return "Partial";
  if (doc?.refundRequestId) return "Processing";
  return "Pending";
}

export function salesReturnRowHasRefund(row) {
  return Boolean(row?._raw?.refundRequestId);
}

/** Cash refund only when the linked sale had money received from the customer. */
export function salesReturnRowNeedsRefund(row) {
  const raw = row?._raw || {};
  if (
    String(
      raw.approvalStatus ||
        row?.["Refund Order Status"] ||
        row?.Status ||
        ""
    ) !== "Approved"
  ) {
    return false;
  }
  const saleStatus = String(raw.salePaymentStatus || "").trim();
  const salePaid = Number(raw.salePaidAmount) || 0;
  return saleStatus === "Paid" || salePaid > 0;
}

export function purchaseRowIsFullyPaid(row) {

  const raw = row?._raw || {};

  const status = String(raw.paymentStatus || "").trim();

  if (status === "Paid") return true;

  const total = Number(raw.totalAmount) || 0;

  const paid = Number(raw.paidAmount) || 0;

  return total > 0 && paid >= total;

}



/** List + detail view: use saved status, else Pending (not payment mode). */

export function resolvePurchasePaymentStatusDisplay(doc) {

  const explicit = String(doc?.paymentStatus || "").trim();

  if (["Pending", "Partial", "Paid", "Unpaid"].includes(explicit)) {

    return explicit;

  }

  const total = Number(doc?.totalAmount) || 0;

  const paid = Number(doc?.paidAmount) || 0;

  if (total > 0 && paid >= total) return "Paid";

  if (paid > 0) return "Partial";

  return "Pending";

}

