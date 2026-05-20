import mongoose from "mongoose";
import { PurchaseReturnVoucher, ReceiptVoucher } from "../models/index";
import { parsePaymentAmount } from "./applyPaymentToAccountBalance";

export type PurchaseReturnRefundStatus = "Pending" | "Partial" | "Received";

export function derivePurchaseReturnRefundStatus(
  totalAmount: unknown,
  refundedAmount: unknown
): PurchaseReturnRefundStatus {
  const total = Number(totalAmount) || 0;
  const refunded = Math.max(0, Number(refundedAmount) || 0);
  if (total > 0 && refunded >= total) return "Received";
  if (refunded > 0) return "Partial";
  return "Pending";
}

/** Sum Paid receipt vouchers linked to this purchase return and update refund fields. */
export async function recomputeLinkedPurchaseReturnRefund(
  purchaseReturnId: unknown
): Promise<void> {
  if (!purchaseReturnId || !mongoose.isValidObjectId(purchaseReturnId)) return;

  const pr = await PurchaseReturnVoucher.findById(purchaseReturnId);
  if (!pr) return;

  const receipts = await ReceiptVoucher.find({
    sourcePurchaseReturnId: pr._id,
    status: "Paid",
  })
    .select("amount")
    .lean();

  let refundedSum = 0;
  for (const r of receipts) {
    refundedSum += parsePaymentAmount(r.amount);
  }

  const total = Number(pr.totalAmount) || 0;
  (pr as { refundedAmount?: number }).refundedAmount = Math.min(
    total,
    refundedSum
  );
  (pr as { refundStatus?: PurchaseReturnRefundStatus }).refundStatus =
    derivePurchaseReturnRefundStatus(total, refundedSum);
  await pr.save();
}
