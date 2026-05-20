import mongoose from "mongoose";
import { PaymentVoucher, PurchaseVoucher } from "../models/index";
import {
  applyPaymentToAccountBalance,
  parsePaymentAmount,
} from "./applyPaymentToAccountBalance";
import type { PurchasePaymentStatus } from "./purchasePaymentStatus";

const CASH_LEDGER = "cash";

export function isGenericCashLedger(name: string): boolean {
  return String(name || "").trim().toLowerCase() === CASH_LEDGER;
}

/** Money out from bank / cash-in-hand — skip generic "Cash" with no Account row. */
export async function applyPaidFromAccountBalance(
  paymentFrom: string,
  amount: unknown,
  direction: "apply" | "reverse"
): Promise<void> {
  const from = String(paymentFrom || "").trim();
  if (!from || isGenericCashLedger(from)) return;
  await applyPaymentToAccountBalance(from, amount, direction);
}

export function inferPaymentThrough(
  paymentFrom: string,
  accountType?: string
): "Cash" | "Bank" {
  if (isGenericCashLedger(paymentFrom)) return "Cash";
  const t = String(accountType || "").trim();
  if (t === "CashInHand") return "Cash";
  if (t === "BankAccounts") return "Bank";
  return "Bank";
}

export type PaymentLedgerSnapshot = {
  status: string;
  paymentTo: string;
  paymentFrom: string;
  amount: unknown;
};

export async function reconcilePaymentVoucherLedgers(
  previous: PaymentLedgerSnapshot,
  next: PaymentLedgerSnapshot
): Promise<void> {
  const wasPaid = String(previous.status || "") === "Paid";
  const isPaid = String(next.status || "") === "Paid";

  const reversePaid = async (snap: PaymentLedgerSnapshot) => {
    await applyPaymentToAccountBalance(
      snap.paymentTo,
      snap.amount,
      "reverse"
    );
    await applyPaidFromAccountBalance(
      snap.paymentFrom,
      snap.amount,
      "reverse"
    );
  };

  const applyPaid = async (snap: PaymentLedgerSnapshot) => {
    await applyPaymentToAccountBalance(snap.paymentTo, snap.amount, "apply");
    await applyPaidFromAccountBalance(
      snap.paymentFrom,
      snap.amount,
      "apply"
    );
  };

  if (wasPaid && !isPaid) {
    await reversePaid(previous);
    return;
  }
  if (!wasPaid && isPaid) {
    await applyPaid(next);
    return;
  }
  if (wasPaid && isPaid) {
    const toChanged =
      String(previous.paymentTo || "").trim().toLowerCase() !==
      String(next.paymentTo || "").trim().toLowerCase();
    const fromChanged =
      String(previous.paymentFrom || "").trim().toLowerCase() !==
      String(next.paymentFrom || "").trim().toLowerCase();
    const amtChanged =
      parsePaymentAmount(previous.amount) !== parsePaymentAmount(next.amount);
    if (toChanged || fromChanged || amtChanged) {
      await reversePaid(previous);
      await applyPaid(next);
    }
  }
}

export function derivePurchasePaymentStatus(
  totalAmount: unknown,
  paidAmount: unknown
): PurchasePaymentStatus {
  const total = Number(totalAmount) || 0;
  const paid = Math.max(0, Number(paidAmount) || 0);
  if (total > 0 && paid >= total) return "Paid";
  if (paid > 0) return "Partial";
  return "Pending";
}

/** Sum all Paid payment vouchers linked to this purchase and update paidAmount / status. */
export async function recomputeLinkedPurchasePayment(
  purchaseId: unknown
): Promise<void> {
  if (!purchaseId || !mongoose.isValidObjectId(purchaseId)) return;

  const purchase = await PurchaseVoucher.findById(purchaseId);
  if (!purchase) return;

  const payments = await PaymentVoucher.find({
    sourcePurchaseId: purchase._id,
    status: "Paid",
  })
    .select("amount")
    .lean();

  let paidSum = 0;
  for (const p of payments) {
    paidSum += parsePaymentAmount(p.amount);
  }

  const total = Number(purchase.totalAmount) || 0;
  purchase.paidAmount = Math.min(total, paidSum);
  purchase.paymentStatus = derivePurchasePaymentStatus(
    total,
    purchase.paidAmount
  );
  await purchase.save();
}
