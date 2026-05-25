import mongoose from "mongoose";
import { PaymentVoucher, SalesReturnVoucher } from "../models/index";
import { parsePaymentAmount } from "./applyPaymentToAccountBalance";
import { syncQuotationNetPayableAfterReturns } from "./salesReturnOrderSync";

export type SalesReturnRefundStatus =
  | "Pending"
  | "Processing"
  | "Partial"
  | "Refunded";

export function deriveSalesReturnRefundStatus(
  totalAmount: unknown,
  refundedAmount: unknown,
  hasPendingPayment = false
): SalesReturnRefundStatus {
  const total = Number(totalAmount) || 0;
  const refunded = Math.max(0, Number(refundedAmount) || 0);
  if (total > 0 && refunded >= total) return "Refunded";
  if (refunded > 0) return "Partial";
  if (hasPendingPayment) return "Processing";
  return "Pending";
}

/** Sum linked payment vouchers and update refund fields on the sales return. */
export async function recomputeLinkedSalesReturnRefund(
  salesReturnId: unknown
): Promise<void> {
  if (!salesReturnId || !mongoose.isValidObjectId(salesReturnId)) return;

  const sr = await SalesReturnVoucher.findById(salesReturnId);
  if (!sr) return;

  const payments = await PaymentVoucher.find({
    sourceSalesReturnId: sr._id,
  })
    .select("amount status")
    .lean();

  let paidSum = 0;
  let hasPending = false;
  for (const p of payments) {
    if (String(p.status || "") === "Paid") {
      paidSum += parsePaymentAmount(p.amount);
    } else if (String(p.status || "") === "Pending") {
      hasPending = true;
    }
  }

  const total = Number(sr.totalAmount) || 0;
  (sr as { refundedAmount?: number }).refundedAmount = Math.min(total, paidSum);
  (sr as { refundStatus?: SalesReturnRefundStatus }).refundStatus =
    deriveSalesReturnRefundStatus(total, paidSum, hasPending);
  await sr.save();

  if (sr.sourceQuotationId) {
    await syncQuotationNetPayableAfterReturns(sr.sourceQuotationId);
  }
}
