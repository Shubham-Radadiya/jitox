import mongoose from "mongoose";
import { Quotation, ReceiptVoucher, SalesVoucher } from "../models/index";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { parsePaymentAmount } from "./applyPaymentToAccountBalance";

export type CollectionPaymentStatus =
  | "Pending"
  | "Partial"
  | "Paid"
  | "Unpaid"
  | "Refund Pending";

export function deriveCollectionPaymentStatus(
  totalAmount: unknown,
  paidAmount: unknown
): CollectionPaymentStatus {
  const total = Number(totalAmount) || 0;
  const paid = Math.max(0, Number(paidAmount) || 0);
  if (total > 0 && paid >= total) return "Paid";
  if (paid > 0) return "Partial";
  if (total > 0) return "Unpaid";
  return "Pending";
}

/** Net sale after returns: refund still owed vs collection still owed. */
export function deriveNetPayablePaymentStatus(
  effectiveTotal: unknown,
  paidAmount: unknown,
  customerRefunded: unknown
): CollectionPaymentStatus {
  const effective = Math.max(0, Number(effectiveTotal) || 0);
  const paid = Math.max(0, Number(paidAmount) || 0);
  const refunded = Math.max(0, Number(customerRefunded) || 0);
  const refundDue = Math.max(0, paid - effective - refunded);
  if (refundDue > 0) return "Refund Pending";
  return deriveCollectionPaymentStatus(effective, paid);
}

function applyPaymentStatusToSale(
  sale: InstanceType<typeof SalesVoucher>
): void {
  sale.paymentStatus = deriveCollectionPaymentStatus(
    sale.totalAmount,
    sale.paidAmount
  );
}

/** Recompute order paid/status from direct receipts + linked sales vouchers. */
export async function recomputeQuotationPaymentState(
  quotationId: unknown
): Promise<void> {
  if (!quotationId || !mongoose.isValidObjectId(quotationId)) return;

  const quotation = await Quotation.findById(quotationId);
  if (!quotation) return;

  const total = Number(quotation.totalAmount) || 0;
  let paidSum = 0;

  const directReceipts = await ReceiptVoucher.find({
    sourceQuotationId: quotation._id,
    status: "Paid",
  })
    .select("amount")
    .lean();
  for (const r of directReceipts) {
    paidSum += parsePaymentAmount(r.amount);
  }

  const linkedSales = await SalesVoucher.find({
    sourceQuotationId: quotation._id,
  })
    .select("paidAmount totalAmount")
    .lean();

  for (const sale of linkedSales) {
    paidSum = Math.max(paidSum, Number(sale.paidAmount) || 0);
  }

  quotation.receivedAmount = paidSum;
  quotation.paidAmount = Math.min(total, paidSum);
  quotation.paymentStatus = deriveCollectionPaymentStatus(
    total,
    quotation.paidAmount
  );
  await quotation.save();

  for (const sale of linkedSales) {
    const doc = await SalesVoucher.findById(sale._id);
    if (!doc) continue;
    const saleTotal = Number(doc.totalAmount) || 0;
    doc.paidAmount = Math.min(saleTotal, quotation.paidAmount);
    applyPaymentStatusToSale(doc);
    await doc.save();
  }
}

/** Copy sales voucher collection progress onto the linked order (quotation). */
export async function syncQuotationPaymentFromSale(
  saleOrId: unknown
): Promise<void> {
  if (!saleOrId || !mongoose.isValidObjectId(saleOrId)) return;

  const sale = await SalesVoucher.findById(saleOrId)
    .select("sourceQuotationId paidAmount totalAmount paymentStatus")
    .lean();
  if (!sale) return;

  const quotationId = sale.sourceQuotationId;
  if (!quotationId || !mongoose.isValidObjectId(quotationId)) return;

  const quotation = await Quotation.findById(quotationId);
  if (!quotation) return;

  const qTotal = Number(quotation.totalAmount) || 0;
  const saleTotal = Number(sale.totalAmount) || 0;
  const salePaid = Math.max(0, Number(sale.paidAmount) || 0);

  quotation.paidAmount = Math.min(qTotal, salePaid);

  const saleStatus = String(sale.paymentStatus || "").trim();
  if (
    saleStatus === "Paid" ||
    saleStatus === "Partial" ||
    saleStatus === "Unpaid" ||
    saleStatus === "Pending"
  ) {
    quotation.paymentStatus = saleStatus as CollectionPaymentStatus;
  } else {
    quotation.paymentStatus = deriveCollectionPaymentStatus(
      qTotal,
      quotation.paidAmount
    );
  }

  if (Math.abs(qTotal - saleTotal) > 1 && qTotal > 0 && saleTotal > 0) {
    quotation.paymentStatus = deriveCollectionPaymentStatus(
      qTotal,
      quotation.paidAmount
    );
  }

  await quotation.save();
}

/** Copy order paid amount onto the linked sales voucher (if any). */
export async function syncSalePaymentFromQuotation(
  quotationOrId: unknown
): Promise<void> {
  if (!quotationOrId || !mongoose.isValidObjectId(quotationOrId)) return;

  const quotation = await Quotation.findById(quotationOrId)
    .select("paidAmount totalAmount paymentStatus")
    .lean();
  if (!quotation) return;

  const sale = await SalesVoucher.findOne({
    sourceQuotationId: quotation._id,
  });
  if (!sale) return;

  const total = Number(sale.totalAmount) || 0;
  const qPaid = Math.max(0, Number(quotation.paidAmount) || 0);
  sale.paidAmount = Math.min(total, qPaid);
  applyPaymentStatusToSale(sale);
  await sale.save();

  const qStatus = String(quotation.paymentStatus || "").trim();
  if (
    qStatus === "Paid" ||
    qStatus === "Partial" ||
    qStatus === "Unpaid" ||
    qStatus === "Pending"
  ) {
    sale.paymentStatus = qStatus as CollectionPaymentStatus;
    await sale.save();
  }
}

/** Sum Paid receipt vouchers linked to an order (quotation) and update paid/status. */
export async function recomputeLinkedQuotationReceipt(
  quotationId: unknown
): Promise<void> {
  await recomputeQuotationPaymentState(quotationId);
}

async function findReceiptForSalesId(
  salesId: unknown,
  excludeReceiptId?: unknown
): Promise<{ _id: unknown } | null> {
  if (!salesId || !mongoose.isValidObjectId(salesId)) return null;
  const filter: Record<string, unknown> = { sourceSalesId: salesId };
  if (excludeReceiptId && mongoose.isValidObjectId(excludeReceiptId)) {
    filter._id = { $ne: excludeReceiptId };
  }
  return ReceiptVoucher.findOne(filter).select("_id").lean();
}

async function findReceiptForQuotationId(
  quotationId: unknown,
  excludeReceiptId?: unknown
): Promise<{ _id: unknown } | null> {
  if (!quotationId || !mongoose.isValidObjectId(quotationId)) return null;
  const filter: Record<string, unknown> = {
    sourceQuotationId: quotationId,
  };
  if (excludeReceiptId && mongoose.isValidObjectId(excludeReceiptId)) {
    filter._id = { $ne: excludeReceiptId };
  }
  return ReceiptVoucher.findOne(filter).select("_id").lean();
}

/** Block new receipts only when the linked sale and/or order is already fully paid. */
export async function assertCollectionNotFullyPaid(options: {
  sourceSalesId?: unknown;
  sourceQuotationId?: unknown;
}): Promise<void> {
  const { sourceSalesId, sourceQuotationId } = options;

  if (sourceSalesId && mongoose.isValidObjectId(sourceSalesId)) {
    const sale = await SalesVoucher.findById(sourceSalesId)
      .select("paidAmount totalAmount paymentStatus")
      .lean();
    if (sale) {
      const total = Number(sale.totalAmount) || 0;
      const paid = Number(sale.paidAmount) || 0;
      const status = String(sale.paymentStatus || "").trim();
      if (
        (total > 0 && paid >= total) ||
        status === "Paid"
      ) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          "This sales invoice is already fully paid."
        );
      }
    }
  }

  if (sourceQuotationId && mongoose.isValidObjectId(sourceQuotationId)) {
    const quotation = await Quotation.findById(sourceQuotationId)
      .select("paidAmount totalAmount paymentStatus")
      .lean();
    if (quotation) {
      const total = Number(quotation.totalAmount) || 0;
      const paid = Number(quotation.paidAmount) || 0;
      const status = String(quotation.paymentStatus || "").trim();
      if (
        (total > 0 && paid >= total) ||
        status === "Paid"
      ) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          "This order is already fully paid."
        );
      }
    }
  }
}

/** @deprecated Use assertCollectionNotFullyPaid — partial payments may have multiple receipts. */
export const assertNoDuplicateReceiptLink = assertCollectionNotFullyPaid;

/** Store back-links so UI can disable duplicate receipt actions. */
export async function setReceiptLinksAfterCreate(
  receiptId: unknown,
  options: {
    sourceSalesId?: unknown;
    sourceQuotationId?: unknown;
  }
): Promise<void> {
  if (!receiptId || !mongoose.isValidObjectId(receiptId)) return;
  const link = receiptId;

  if (options.sourceSalesId && mongoose.isValidObjectId(options.sourceSalesId)) {
    await SalesVoucher.findByIdAndUpdate(options.sourceSalesId, {
      $set: { receiptRequestId: link },
    });
  }
  if (
    options.sourceQuotationId &&
    mongoose.isValidObjectId(options.sourceQuotationId)
  ) {
    await Quotation.findByIdAndUpdate(options.sourceQuotationId, {
      $set: { receiptRequestId: link },
    });
  }
}

export async function clearReceiptLinksAfterDelete(
  receipt: {
    sourceSalesId?: unknown;
    sourceQuotationId?: unknown;
    _id?: unknown;
  }
): Promise<void> {
  const rid = receipt._id;
  if (receipt.sourceSalesId && mongoose.isValidObjectId(receipt.sourceSalesId)) {
    await SalesVoucher.findOneAndUpdate(
      {
        _id: receipt.sourceSalesId,
        receiptRequestId: rid,
      },
      { $unset: { receiptRequestId: 1 } }
    );
  }
  if (
    receipt.sourceQuotationId &&
    mongoose.isValidObjectId(receipt.sourceQuotationId)
  ) {
    await Quotation.findOneAndUpdate(
      {
        _id: receipt.sourceQuotationId,
        receiptRequestId: rid,
      },
      { $unset: { receiptRequestId: 1 } }
    );
  }
}
