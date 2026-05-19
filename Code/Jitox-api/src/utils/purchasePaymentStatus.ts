export type PurchasePaymentStatus = "Pending" | "Paid" | "Unpaid";

const VALID: PurchasePaymentStatus[] = ["Pending", "Paid", "Unpaid"];

export function normalizePurchasePaymentStatus(
  value: unknown
): PurchasePaymentStatus | null {
  const s = String(value ?? "").trim();
  return (VALID as string[]).includes(s) ? (s as PurchasePaymentStatus) : null;
}

export function resolvePurchasePaymentStatus(
  paymentStatus: unknown,
  _paymentMode?: unknown
): PurchasePaymentStatus {
  return normalizePurchasePaymentStatus(paymentStatus) ?? "Pending";
}

export function paidAmountForPurchaseStatus(
  status: PurchasePaymentStatus,
  totalAmount: unknown,
  paidAmount?: unknown
): number {
  const total = Number(totalAmount) || 0;
  if (status === "Paid") return total;
  if (status === "Unpaid") return 0;
  const paid = Number(paidAmount);
  if (Number.isFinite(paid) && paid >= 0) return Math.min(total, paid);
  return 0;
}

export function buildPurchasePaymentFields(
  totalAmount: unknown,
  paymentMode: unknown,
  paymentStatus?: unknown,
  paidAmount?: unknown
): { paymentStatus: PurchasePaymentStatus; paidAmount: number } {
  const status = resolvePurchasePaymentStatus(paymentStatus, paymentMode);
  return {
    paymentStatus: status,
    paidAmount: paidAmountForPurchaseStatus(status, totalAmount, paidAmount),
  };
}
