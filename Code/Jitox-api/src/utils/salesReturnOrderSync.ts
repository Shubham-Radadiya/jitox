import mongoose from "mongoose";
import SalesReturnVoucher from "../models/salesReturnVoucher.model";
import SalesVoucher from "../models/salesVoucher.model";
import Quotation from "../models/quotation.model";
import { productIdFromRef } from "./productUnit";
import {
  deriveNetPayablePaymentStatus,
  recomputeQuotationPaymentState,
} from "./receiptQuotationLedger";

export type FulfillmentLine = {
  productId: string;
  name: string;
  orderedQty: number;
  soldQty: number;
  returnedQty: number;
  netQty: number;
  unit: string;
};

/** Sum line qty per product on a voucher document. */
function sumQtyByProduct(
  items: Array<{ product?: unknown; quantity?: unknown }>
): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items || []) {
    const pid = productIdFromRef(it?.product);
    const qty = Number(it?.quantity) || 0;
    if (!pid || qty <= 0) continue;
    m.set(pid, (m.get(pid) ?? 0) + qty);
  }
  return m;
}

/** Sold / returned / net per product for an order (quotation). */
export async function buildOrderFulfillment(
  quotationId: unknown
): Promise<{
  salesVoucherNo: string;
  salesVoucherId: string;
  lines: FulfillmentLine[];
  returns: Array<{ id: string; voucherNo: string; status: string; totalAmount: number }>;
} | null> {
  if (!quotationId || !mongoose.isValidObjectId(quotationId)) return null;

  const quotation = await Quotation.findById(quotationId)
    .populate("items.product", "productName")
    .lean();
  if (!quotation) return null;

  const sale = await SalesVoucher.findOne({
    sourceQuotationId: quotation._id,
  })
    .populate("items.product", "productName")
    .lean();
  if (!sale) return null;

  const ordered = sumQtyByProduct(quotation.items || []);
  const sold = sumQtyByProduct(sale.items || []);

  const returns = await SalesReturnVoucher.find({
    sourceQuotationId: quotation._id,
  })
    .select("voucherNo approvalStatus totalAmount items")
    .lean();

  const returnedApproved = new Map<string, number>();
  const returnRows: Array<{
    id: string;
    voucherNo: string;
    status: string;
    totalAmount: number;
  }> = [];

  for (const r of returns) {
    returnRows.push({
      id: String(r._id),
      voucherNo: String(r.voucherNo || ""),
      status: String(r.approvalStatus || "Pending"),
      totalAmount: Number(r.totalAmount) || 0,
    });
    if (r.approvalStatus !== "Approved") continue;
    const m = sumQtyByProduct(r.items || []);
    for (const [pid, qty] of m) {
      returnedApproved.set(pid, (returnedApproved.get(pid) ?? 0) + qty);
    }
  }

  const nameByProduct = new Map<string, string>();
  for (const it of quotation.items || []) {
    const pid = productIdFromRef(it?.product);
    if (!pid) continue;
    const p = it.product as { productName?: string } | undefined;
    nameByProduct.set(pid, String(p?.productName || "Product").trim());
  }
  for (const it of sale.items || []) {
    const pid = productIdFromRef(it?.product);
    if (!pid || nameByProduct.has(pid)) continue;
    const p = it.product as { productName?: string } | undefined;
    nameByProduct.set(pid, String(p?.productName || "Product").trim());
  }

  const allPids = new Set([
    ...ordered.keys(),
    ...sold.keys(),
    ...returnedApproved.keys(),
  ]);

  const lines: FulfillmentLine[] = [];
  for (const pid of allPids) {
    const o = ordered.get(pid) ?? 0;
    const s = sold.get(pid) ?? 0;
    const ret = returnedApproved.get(pid) ?? 0;
    lines.push({
      productId: pid,
      name: nameByProduct.get(pid) || "Product",
      orderedQty: o,
      soldQty: s,
      returnedQty: ret,
      netQty: Math.max(0, s - ret),
      unit: "",
    });
  }

  return {
    salesVoucherNo: String(sale.voucherNo || ""),
    salesVoucherId: String(sale._id),
    lines,
    returns: returnRows,
  };
}

/** Sum approved sales return value and refresh order/sale paid, due, payment status. */
export async function syncQuotationNetPayableAfterReturns(
  quotationId: unknown
): Promise<void> {
  if (!quotationId || !mongoose.isValidObjectId(quotationId)) return;

  const quotation = await Quotation.findById(quotationId);
  if (!quotation) return;

  const approved = await SalesReturnVoucher.find({
    sourceQuotationId: quotation._id,
    approvalStatus: "Approved",
  })
    .select("totalAmount")
    .lean();

  let returnedSum = 0;
  for (const r of approved) {
    returnedSum += Number(r.totalAmount) || 0;
  }

  const grossOrder = Number(quotation.totalAmount) || 0;
  quotation.returnedAmount = Math.min(grossOrder, Math.max(0, returnedSum));

  const allReturns = await SalesReturnVoucher.find({
    sourceQuotationId: quotation._id,
  })
    .select("refundedAmount")
    .lean();
  let customerRefunded = 0;
  for (const r of allReturns) {
    customerRefunded += Number(r.refundedAmount) || 0;
  }
  quotation.customerRefundedAmount = customerRefunded;
  await quotation.save();

  await recomputeQuotationPaymentState(quotationId);

  const q = await Quotation.findById(quotationId);
  if (!q) return;

  const sale = await SalesVoucher.findOne({ sourceQuotationId: q._id });
  const grossSale = sale ? Number(sale.totalAmount) || 0 : 0;
  const base = sale ? grossSale : grossOrder;
  const returned = Number(q.returnedAmount) || 0;
  const effective = Math.max(0, base - returned);
  const received = Math.max(
    Number(q.receivedAmount) || 0,
    Number(q.paidAmount) || 0
  );
  const refunded = Number(q.customerRefundedAmount) || 0;

  q.paymentStatus = deriveNetPayablePaymentStatus(
    effective,
    received,
    refunded
  );
  await q.save();

  if (sale) {
    const saleEffective = Math.max(0, grossSale - returned);
    const saleReceived = Math.max(
      Number((sale as { receivedAmount?: number }).receivedAmount) || 0,
      Number(sale.paidAmount) || 0
    );
    sale.paymentStatus = deriveNetPayablePaymentStatus(
      saleEffective,
      saleReceived,
      refunded
    );
    await sale.save();
  }
}

/**
 * Keep order list status in sync with sales return vouchers on this quotation.
 * Any non-rejected return → Refund Order Status "Return".
 */
export async function syncQuotationAfterSalesReturns(
  quotationId: unknown
): Promise<void> {
  if (!quotationId || !mongoose.isValidObjectId(quotationId)) return;

  const quotation = await Quotation.findById(quotationId);
  if (!quotation) return;

  const sale = await SalesVoucher.findOne({
    sourceQuotationId: quotation._id,
  }).lean();

  const returns = await SalesReturnVoucher.find({
    sourceQuotationId: quotation._id,
  }).lean();

  const active = returns.filter(
    (r) => String(r.approvalStatus || "") !== "Rejected"
  );

  if (!active.length) {
    if (String(quotation.dashboardOrderStatus || "") === "Return") {
      if (sale) {
        quotation.dashboardOrderStatus = "Dispatched";
        quotation.dashboardTab = "dispatched";
      } else {
        quotation.dashboardOrderStatus = "Pending";
        quotation.dashboardTab = "pending";
      }
    }
    await quotation.save();
    await syncQuotationNetPayableAfterReturns(quotationId);
    return;
  }

  quotation.dashboardOrderStatus = "Return";

  const approved = active.filter((r) => r.approvalStatus === "Approved");
  if (approved.length && sale) {
    const sold = sumQtyByProduct(sale.items || []);
    const returned = new Map<string, number>();
    for (const r of approved) {
      const m = sumQtyByProduct(r.items || []);
      for (const [pid, qty] of m) {
        returned.set(pid, (returned.get(pid) ?? 0) + qty);
      }
    }
    let fullReturn = sold.size > 0;
    for (const [pid, sQty] of sold) {
      if ((returned.get(pid) ?? 0) < sQty) {
        fullReturn = false;
        break;
      }
    }
    quotation.dashboardTab = fullReturn ? "cancelled" : "partSupply";
  } else {
    quotation.dashboardTab = "partSupply";
  }

  await quotation.save();

  await syncQuotationNetPayableAfterReturns(quotationId);
}
