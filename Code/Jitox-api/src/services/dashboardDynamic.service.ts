import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import {
  Quotation,
  SalesReturnVoucher,
  SalesVoucher,
  PaymentVoucher,
  ReceiptVoucher,
  Product,
  Employee,
  MarketingScheme,
  DocumentCategory,
  DocumentEntry,
} from "../models";
import {
  employeesTrackingSeed,
  type EmployeeSeed,
} from "../data/employeeTracking.seed";
import { productLineAmount, resolveProductUnit } from "../utils/productUnit";
import { applyPaymentToAccountBalance } from "../utils/applyPaymentToAccountBalance";
import {
  buildOrderFulfillment,
  syncQuotationAfterSalesReturns,
  syncQuotationNetPayableAfterReturns,
} from "../utils/salesReturnOrderSync";

function parseRupeeAmount(s: string): number {
  const n = Number(
    String(s)
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .trim()
  );
  return Number.isFinite(n) ? n : 0;
}

/** Demo seed prefixes product names; store and return clean names on schemes. */
function stripJitoxDemoProductNamePrefix(name: string): string {
  const s = String(name ?? "").trim();
  if (!s) return s;
  const stripped = s.replace(/^JITOX-DEMO\s+/i, "").trim();
  return stripped || s;
}

function formatPayableDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mi = parseInt(m, 10) - 1;
  return `${d} ${months[mi] ?? m} ${y}`;
}

function formatInr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

type QuotationLean = {
  _id: mongoose.Types.ObjectId;
  partyName?: string;
  voucherDate?: Date;
  voucherNo?: string;
  orderby?: string;
  items?: Array<{
    quantity?: number;
    rateParUnit?: number;
    subtotal?: number;
    unit?: string;
    discountPct?: number;
    discountAmt?: number;
    hsn?: string;
    product?: { productName?: string } | mongoose.Types.ObjectId | null;
  }>;
  totalAmount?: number;
  paidAmount?: number;
  receivedAmount?: number;
  returnedAmount?: number;
  customerRefundedAmount?: number;
  paymentStatus?: string;
  receiptRequestId?: mongoose.Types.ObjectId;
  paymentMode?: string;
  termsOfPayment?: string;
  termsAndConditions?: string;
  dueDate?: Date;
  addedToOrder?: boolean;
  dashboardTab?: string;
  dashboardOrderStatus?: string;
  shipToAndBillTo?: string;
  transportDetails?: string;
  deliveryAt?: string;
  gstAmount?: number;
  basePrice?: number;
  invoiceNo?: string;
  createdAt?: Date;
};

function productLineName(
  item: NonNullable<QuotationLean["items"]>[0]
): string {
  const p = item.product;
  if (p && typeof p === "object" && "productName" in p && p.productName) {
    return String(p.productName);
  }
  return "Product";
}

function quotationProductsSummary(q: QuotationLean): string {
  const items = q.items || [];
  if (!items.length) return "—";
  return items
    .map((i) => {
      const nm = productLineName(i);
      const u = i.unit ? ` ${i.unit}` : "";
      return `${nm} (${i.quantity ?? 0}${u})`;
    })
    .join(", ");
}

function quotationLineDiscount(
  it: {
    quantity?: number;
    rateParUnit?: number;
    discountPct?: number;
    discountAmt?: number;
    subtotal?: number;
  } | null
  | undefined
): number {
  if (!it || typeof it !== "object") return 0;
  const row = it;
  const qty = Number(row.quantity) || 0;
  const rate = Number(row.rateParUnit) || 0;
  const base = qty * rate;
  const dAmt = Number(row.discountAmt);
  const dPct = Number(row.discountPct);
  if (Number.isFinite(dAmt) && dAmt > 0) return dAmt;
  if (Number.isFinite(dPct) && dPct > 0) return (base * dPct) / 100;
  const sub = Number(row.subtotal);
  if (base > 0 && Number.isFinite(sub)) return Math.max(0, base - sub);
  return 0;
}

function sumQuotationLineDiscounts(
  items: QuotationLean["items"]
): number {
  const list = Array.isArray(items) ? items : [];
  return Math.round(
    list.reduce((s, it) => s + quotationLineDiscount(it), 0)
  );
}

/** Order-level GST % from stored base + tax (same as sales / purchase voucher). */
function quotationOrderGstRatePct(q: QuotationLean): number | null {
  const basePrice = Number(q.basePrice) || 0;
  const gstAmount = Number(q.gstAmount) || 0;
  if (basePrice <= 0 || gstAmount <= 0) return null;
  return (gstAmount / basePrice) * 100;
}

function quotationLineTaxable(
  it: NonNullable<QuotationLean["items"]>[number]
): number {
  const qty = Number(it.quantity) || 0;
  const rate = Number(it.rateParUnit) || 0;
  const base = qty * rate;
  const discount = quotationLineDiscount(it);
  return Math.max(0, base - discount);
}

function quotationLineGst(
  it: NonNullable<QuotationLean["items"]>[number],
  gstPct: number | null
): number {
  if (gstPct == null || !Number.isFinite(gstPct) || gstPct <= 0) return 0;
  return Math.round((quotationLineTaxable(it) * gstPct) / 100);
}

function paymentLabels(q: QuotationLean): {
  paymentStatus: string;
  paid: string;
  paidReceived: string;
  due: string;
  dueKind: "refund" | "collect";
  netTotal: string;
  grossTotal: string;
  returnedTotal: string;
  refundDueTotal: string;
  refundPaidTotal: string;
  creditBalance: number;
} {
  const gross = Number(q.totalAmount) || 0;
  const returned = Number(q.returnedAmount) || 0;
  const effective = Math.max(0, gross - returned);
  const receivedNum = Math.max(
    Number(q.receivedAmount) || 0,
    Number(q.paidAmount) || 0
  );
  const customerRefunded = Number(q.customerRefundedAmount) || 0;
  const refundDue = Math.max(0, receivedNum - effective - customerRefunded);
  const collectionDue = Math.max(0, effective - receivedNum);
  const netRetained = Math.min(receivedNum, effective);
  const creditNum = refundDue;
  const paymentStatus =
    refundDue > 0
      ? "Refund Pending"
      : (() => {
          const stored = String(q.paymentStatus || "").trim();
          if (stored && stored !== "Refund Pending") return stored;
          return effective > 0 && receivedNum >= effective
            ? "Paid"
            : receivedNum > 0
              ? "Partial"
              : effective > 0
                ? "Unpaid"
                : "Pending";
        })();

  return {
    paymentStatus,
    paid: formatInr(netRetained),
    paidReceived: formatInr(receivedNum),
    due: formatInr(refundDue > 0 ? refundDue : collectionDue),
    dueKind: refundDue > 0 ? "refund" : "collect",
    netTotal: formatInr(effective),
    grossTotal: formatInr(gross),
    returnedTotal: returned > 0 ? formatInr(returned) : "—",
    refundDueTotal: refundDue > 0 ? formatInr(refundDue) : "—",
    refundPaidTotal:
      customerRefunded > 0 ? formatInr(customerRefunded) : "—",
    creditBalance: creditNum,
  };
}

export function formatOrderRowFromQuotation(
  q: QuotationLean,
  opts?: { hasSale?: boolean }
) {
  const dateStr = q.voucherDate
    ? new Date(q.voucherDate).toISOString().slice(0, 10)
    : "";
  const labels = paymentLabels(q);
  const totalStr = formatInr(Number(q.totalAmount) || 0);
  return {
    _id: String(q._id),
    _receiptRecorded: q.receiptRequestId ? "yes" : "",
    _hasSale: Boolean(opts?.hasSale),
    _dueKind: labels.dueKind,
    "Order ID": q.voucherNo || String(q._id),
    "Client Name": q.partyName || "—",
    Date: dateStr,
    Products: quotationProductsSummary(q),
    "Manager Name": q.orderby?.trim() || "—",
    Paid: labels.paid,
    Due: labels.due,
    "Return Amt": labels.returnedTotal,
    "Refund Due": labels.refundDueTotal,
    Refunded: labels.refundPaidTotal,
    "Payment Status": labels.paymentStatus,
    "Total Amount": totalStr,
    "Net Amount": labels.netTotal,
    "Order Status": q.dashboardOrderStatus || "Pending",
  };
}

export async function fetchOrdersSummary() {
  const rows = (await Quotation.find({ addedToOrder: true })
    .select("dashboardTab paidAmount totalAmount paymentMode")
    .lean()) as unknown as Array<{
    dashboardTab?: string;
    paidAmount?: number;
    totalAmount?: number;
    paymentMode?: string;
  }>;
  const tabCounts = {
    all: rows.length,
    pending: 0,
    dispatched: 0,
    partSupply: 0,
    cancelled: 0,
  };
  for (const r of rows) {
    const tab = r.dashboardTab || "pending";
    if (tab === "pending") tabCounts.pending += 1;
    else if (tab === "dispatched") tabCounts.dispatched += 1;
    else if (tab === "partSupply") tabCounts.partSupply += 1;
    else if (tab === "cancelled") tabCounts.cancelled += 1;
  }
  const totalAmt = rows.reduce(
    (s, r) => s + (Number(r.totalAmount) || 0),
    0
  );
  const paidAmt = rows.reduce((s, r) => {
    const t = Number(r.totalAmount) || 0;
    const p = Number(r.paidAmount) || 0;
    return s + Math.min(p, t);
  }, 0);
  const orderReturns = await Quotation.countDocuments({
    addedToOrder: true,
    dashboardOrderStatus: "Return",
  });
  return {
    totalOrders: rows.length,
    orderReturns,
    totalOrderAmount: formatInr(totalAmt),
    revenue: formatInr(paidAmt),
    orderDispatched: tabCounts.dispatched,
    tabCounts,
  };
}

export async function fetchOrdersFiltered(reqQuery: Record<string, unknown>) {
  const tab = String(reqQuery.tab || "all");
  const client = String(reqQuery.clientName || "").toLowerCase();
  const orderStatus = String(reqQuery.orderStatus || "all");
  const paymentStatus = String(reqQuery.paymentStatus || "all");
  const manager = String(reqQuery.managerName || "").toLowerCase();
  const orderId = String(reqQuery.orderId || "").toLowerCase();
  const dateFrom = String(reqQuery.dateFrom || "");
  const dateTo = String(reqQuery.dateTo || "");

  let docs = (await Quotation.find({ addedToOrder: true })
    .populate("items.product", "productName")
    .sort({ voucherDate: -1, createdAt: -1 })
    .lean()) as unknown as QuotationLean[];

  const qIds = docs.map((d) => d._id).filter(Boolean);
  if (qIds.length) {
    const returnOrderIds = await SalesReturnVoucher.distinct(
      "sourceQuotationId",
      {
        sourceQuotationId: { $in: qIds },
        approvalStatus: { $ne: "Rejected" },
      }
    );
    if (returnOrderIds.length) {
      await Promise.all(
        returnOrderIds.map(async (id) => {
          await syncQuotationAfterSalesReturns(id);
          await syncQuotationNetPayableAfterReturns(id);
        })
      );
      const refreshed = (await Quotation.find({
        _id: { $in: returnOrderIds },
      })
        .populate("items.product", "productName")
        .lean()) as unknown as QuotationLean[];
      const byId = new Map(refreshed.map((d) => [String(d._id), d]));
      docs = docs.map((d) => byId.get(String(d._id)) ?? d);
    }
  }

  const mapTab: Record<string, string> = {
    pending: "pending",
    dispatched: "dispatched",
    "part-supply": "partSupply",
    cancelled: "cancelled",
  };
  const tabKey = tab !== "all" ? mapTab[tab] : "";
  let tabFiltered = docs;
  if (tabKey === "pending") {
    tabFiltered = docs.filter(
      (d) => !d.dashboardTab || d.dashboardTab === "pending"
    );
  } else if (tabKey) {
    tabFiltered = docs.filter((d) => d.dashboardTab === tabKey);
  }

  const saleQuotationIds = new Set<string>();
  if (qIds.length) {
    const linked = await SalesVoucher.find({
      sourceQuotationId: { $in: qIds },
    })
      .select("sourceQuotationId")
      .lean();
    for (const s of linked) {
      if (s.sourceQuotationId) {
        saleQuotationIds.add(String(s.sourceQuotationId));
      }
    }
  }

  let rows = tabFiltered.map((d) =>
    formatOrderRowFromQuotation(d, {
      hasSale: saleQuotationIds.has(String(d._id)),
    })
  );

  rows = rows.filter((r) => {
    if (client && !String(r["Client Name"]).toLowerCase().includes(client))
      return false;
    if (
      orderStatus !== "all" &&
      String(r["Order Status"]).toLowerCase() !== orderStatus.toLowerCase()
    )
      return false;
    if (
      paymentStatus !== "all" &&
      String(r["Payment Status"]).toLowerCase() !==
        paymentStatus.toLowerCase()
    )
      return false;
    if (
      manager &&
      !String(r["Manager Name"]).toLowerCase().includes(manager)
    )
      return false;
    if (orderId && !String(r["Order ID"]).toLowerCase().includes(orderId))
      return false;
    const rd = String(r.Date || "").slice(0, 10);
    if (dateFrom && rd && rd < dateFrom) return false;
    if (dateTo && rd && rd > dateTo) return false;
    return true;
  });

  return { orders: rows };
}

export async function fetchQuotationOrderPayload(id: string) {
  if (mongoose.isValidObjectId(id)) {
    await syncQuotationNetPayableAfterReturns(id);
  }
  const q = (await Quotation.findById(id)
    .populate("items.product", "productName")
    .lean()) as unknown as QuotationLean | null;
  if (!q) return null;
  const hasSale = Boolean(
    await SalesVoucher.exists({ sourceQuotationId: q._id })
  );
  const row = formatOrderRowFromQuotation(q, { hasSale });
  const items = q.items || [];
  let gstPct = quotationOrderGstRatePct(q);
  if (gstPct == null && items.length > 0) {
    const taxableSum = items.reduce(
      (s, it) => s + quotationLineTaxable(it),
      0
    );
    const gstAmount = Number(q.gstAmount) || 0;
    if (taxableSum > 0 && gstAmount > 0) {
      gstPct = (gstAmount / taxableSum) * 100;
    }
  }
  const productLines = items.map((i) => {
    const name = productLineName(i);
    const qty = i.quantity ?? 0;
    const unit = i.unit || "";
    const rate = i.rateParUnit ?? 0;
    const sub = i.subtotal ?? qty * rate;
    const gstLine = quotationLineGst(i, gstPct);
    return {
      name,
      qty: `${qty} ${unit}`.trim(),
      rate: formatInr(rate),
      gst: gstLine > 0 ? formatInr(gstLine) : "—",
      subtotal: formatInr(sub),
    };
  });
  const total = Number(q.totalAmount) || 0;
  const labels = paymentLabels(q);
  const basePrice = Number(q.basePrice) || 0;
  const gstAmount = Number(q.gstAmount) || 0;
  const gstPctLabel =
    basePrice > 0 && gstAmount >= 0
      ? Math.round((gstAmount / basePrice) * 100)
      : null;
  const discountNum = sumQuotationLineDiscounts(q.items);
  const termsOfPayment =
    String(q.termsOfPayment || "").trim() ||
    String(q.paymentMode || "").trim() ||
    "—";
  const created = q.createdAt
    ? new Date(q.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";
  const fulfillment = await buildOrderFulfillment(q._id);

  const detail = {
    createdAt: created,
    paymentStatus: labels.paymentStatus,
    orderStatus: q.dashboardOrderStatus || "Pending",
    fulfillment,
    manager: {
      fullName: q.orderby || row["Manager Name"],
      region: "",
      area: "",
    },
    client: {
      fullName: q.partyName || row["Client Name"],
      phone: "",
      email: "",
      shippingAddress: q.shipToAndBillTo || "",
    },
    products: productLines,
    productsTotal: formatInr(
      items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0)
    ),
    dispatch: {
      status:
        q.dashboardTab === "dispatched"
          ? "Dispatched"
          : q.dashboardTab === "partSupply"
            ? "Part Supply"
            : q.dashboardTab === "cancelled"
              ? "Cancelled"
              : q.dashboardTab === "pending"
                ? "Pending"
                : "—",
    },
    delivery: {
      trackingNumber: q.transportDetails || "—",
      courier: q.deliveryAt || "—",
    },
    payment: {
      termsOfPayment,
      paymentMode: q.paymentMode || "—",
      subTotal: formatInr(basePrice),
      totalAmount: formatInr(total),
      netReceivable: labels.netTotal,
      returnedAmount: labels.returnedTotal,
      refundDue: labels.refundDueTotal,
      refunded: labels.refundPaidTotal,
      creditBalance: labels.creditBalance,
      creditBalanceFormatted:
        labels.creditBalance > 0 ? formatInr(labels.creditBalance) : "",
      tax: formatInr(gstAmount),
      taxLabel: gstPctLabel != null ? `Tax (${gstPctLabel}%)` : "Tax",
      discount: formatInr(discountNum),
      paid: labels.paid,
      paidReceived: labels.paidReceived,
      due: labels.due,
      dueKind: labels.dueKind,
      finalPayable: labels.netTotal,
      mode: q.paymentMode || "—",
      transactionId: "—",
      grandTotal: formatInr(total),
      dueDate: q.dueDate
        ? new Date(q.dueDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "",
      paymentStatus: labels.paymentStatus,
    },
    invoice: {
      companyName: "Jitox Algo",
      website: "www.jitoxagro.com",
      email: "jitoxagro@email.com",
      phone: "+91 00000 00000",
      taxAddress:
        "Business address\nCity, State, IN - 000 000\nTAX ID 00XXXXX1234X0XX",
      billedTo: {
        name: q.partyName,
        address: q.shipToAndBillTo || "",
        phone: "",
      },
      invoiceNo: q.invoiceNo || q.voucherNo,
      reference: q.voucherNo,
      orderId: q.voucherNo,
      invoiceDate: q.voucherDate
        ? new Date(q.voucherDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "",
      invoiceTotalLabel: formatInr(total),
      paymentMode: q.paymentMode || "—",
      paymentStatusBadge: labels.paymentStatus,
      lines: productLines.map((p) => ({
        detail: p.name,
        qty: p.qty,
        rate: p.rate,
        amount: p.subtotal,
      })),
      subtotal: formatInr(Number(q.basePrice) || 0),
      taxPct: q.gstAmount && q.basePrice ? "" : "",
      taxAmount: formatInr(Number(q.gstAmount) || 0),
      discount: "₹0",
      paidAmount: labels.paid,
      outstanding: labels.due,
      finalPayable: labels.netTotal,
      terms: "Please pay within the agreed credit period.",
    },
  };
  const order = {
    id: String(q._id),
    orderId: q.voucherNo,
    clientName: q.partyName,
    date: row.Date,
    products: row.Products,
    managerName: row["Manager Name"],
    paid: row.Paid,
    due: row.Due,
    paymentStatus: labels.paymentStatus,
    totalAmount: row["Total Amount"],
    orderStatus: q.dashboardOrderStatus || "Pending",
    tab: q.dashboardTab || "pending",
    detail,
  };
  return { order, detail };
}

export async function markQuotationPaid(idOrVoucher: string) {
  const byId = mongoose.isValidObjectId(idOrVoucher)
    ? await Quotation.findById(idOrVoucher).lean()
    : null;
  const q =
    byId ||
    (await Quotation.findOne({ voucherNo: idOrVoucher }).lean());
  if (!q) return null;
  const total = Number(q.totalAmount) || 0;
  const updated = await Quotation.findByIdAndUpdate(
    q._id,
    { $set: { paidAmount: total, paymentStatus: "Paid" } },
    { new: true }
  )
    .populate("items.product", "productName")
    .lean();
  return updated
    ? formatOrderRowFromQuotation(updated as unknown as QuotationLean)
    : null;
}

function parsePaymentAmount(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return parseRupeeAmount(String(v ?? "0"));
}

export async function fetchPayablesList(query: Record<string, unknown>) {
  const q = String(query.voucherNo || "").toLowerCase();
  const from = query.from ? String(query.from) : "";
  const to = query.to ? String(query.to) : "";

  const docs = await PaymentVoucher.find().sort({ date: -1 }).lean();
  let raw = docs.map((p) => {
    const dateIso = p.date
      ? new Date(p.date as Date).toISOString().slice(0, 10)
      : "";
    const through =
      p.paymentThrough === "Cash"
        ? "Cash"
        : p.paymentThrough === "Bank"
          ? "Bank"
          : String(p.paymentThrough || "Bank");
    const labelThrough =
      through === "Cash" ? "Cash" : `Bank - ${through === "Bank" ? "Transfer" : through}`;
    return {
      voucherNo: p.voucherNo,
      date: dateIso,
      paymentThrough: labelThrough,
      paymentTo: p.paymentTo || "—",
      amount: parsePaymentAmount(p.amount),
      narration: p.remarks || "—",
      status: p.status || "Pending",
    };
  });
  if (q) raw = raw.filter((p) => p.voucherNo.toLowerCase().includes(q));
  if (from) raw = raw.filter((p) => p.date >= from);
  if (to) raw = raw.filter((p) => p.date <= to);

  const list = raw.map((p) => ({
    "Voucher No": p.voucherNo,
    Date: formatPayableDisplayDate(p.date),
    dateIso: p.date,
    "Payment Through": p.paymentThrough,
    "Payment To": p.paymentTo,
    "Amount (₹)": formatInr(p.amount),
    amountValue: p.amount,
    Narration: p.narration,
    Status: p.status,
  }));
  const total = raw.reduce((s, p) => s + p.amount, 0);
  return { payables: list, totalPayables: total };
}

const MONTH_SHORT_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Sum of all receipt voucher amounts (matches Receivable summary page). */
export async function totalReceiptVouchersAmount(): Promise<number> {
  const docs = await ReceiptVoucher.find().select("amount").lean();
  return docs.reduce(
    (s, d) => s + parsePaymentAmount((d as { amount?: unknown }).amount),
    0
  );
}

/** Monthly receipt vs payment totals for the dashboard chart (calendar year). */
export async function buildReceivablesPayablesMonthlyChart(
  year = new Date().getFullYear()
): Promise<{
  months: string[];
  receivables: number[];
  payables: number[];
}> {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const receivables = Array(12).fill(0) as number[];
  const payables = Array(12).fill(0) as number[];

  const [payments, receipts] = await Promise.all([
    PaymentVoucher.find({ date: { $gte: start, $lt: end } })
      .select("date amount")
      .lean(),
    ReceiptVoucher.find({ date: { $gte: start, $lt: end } })
      .select("date amount")
      .lean(),
  ]);

  for (const p of payments) {
    if (!p.date) continue;
    const m = new Date(p.date as Date).getMonth();
    if (m >= 0 && m < 12) {
      payables[m] += parsePaymentAmount((p as { amount?: unknown }).amount);
    }
  }
  for (const r of receipts) {
    if (!r.date) continue;
    const m = new Date(r.date as Date).getMonth();
    if (m >= 0 && m < 12) {
      receivables[m] += parsePaymentAmount((r as { amount?: unknown }).amount);
    }
  }

  return {
    months: [...MONTH_SHORT_LABELS],
    receivables: receivables.map((n) => Math.round(n)),
    payables: payables.map((n) => Math.round(n)),
  };
}

export async function applyPayablePayment(body: Record<string, unknown>) {
  const vn = String(body.voucherNumber || body.voucherNo || "").trim();
  const throughRaw = String(body.paymentThrough || "").toLowerCase();
  const paymentThrough =
    throughRaw === "cash" || throughRaw === "bank"
      ? throughRaw === "cash"
        ? "Cash"
        : "Bank"
      : "Bank";
  if (vn) {
    const existing = await PaymentVoucher.findOne({ voucherNo: vn }).lean();
    const wasPaid = existing && String(existing.status || "") === "Paid";
    const updated = await PaymentVoucher.findOneAndUpdate(
      { voucherNo: vn },
      {
        $set: {
          status: "Paid",
          paymentThrough,
          remarks: String(body.narration ?? ""),
        },
      },
      { new: true }
    );
    if (updated && !wasPaid) {
      await applyPaymentToAccountBalance(
        String(updated.paymentTo || body.paymentTo || ""),
        updated.amount ?? body.amount,
        "apply"
      );
    }
  }
  return {
    ok: true,
    payment: {
      voucherNumber: vn || "Auto",
      date: body.date ?? new Date().toISOString().slice(0, 10),
      paymentThrough: body.paymentThrough,
      paymentTo: body.paymentTo,
      amount: body.amount,
      narration: body.narration,
    },
  };
}

function stockStatusForQty(qty: number, minReorder: number): string {
  if (qty <= 0) return "Out of Stock";
  if (minReorder > 0 && qty < minReorder) return "Shortage";
  return "Sufficient";
}

export async function fetchStockSummary() {
  const products = await Product.find().lean();
  const totalItems = products.length;
  let inStock = 0;
  let lowStock = 0;
  let outStock = 0;
  let totalValue = 0;
  for (const p of products) {
    const qty = Number(p.quantity) || 0;
    const min = Number(p.minimumReorderLevel) || 0;
    totalValue += productLineAmount(p);
    if (qty <= 0) outStock += 1;
    else if (min > 0 && qty < min) lowStock += 1;
    else inStock += 1;
  }
  return {
    totalItems,
    inStock,
    lowStock,
    reserved: 0,
    damaged: outStock,
    totalValue: formatInr(Math.round(totalValue)),
  };
}

export async function fetchStockProducts(group: string) {
  const products = await Product.find().sort({ productName: 1 }).lean();
  let list = products.map((p) => {
    const qty = Number(p.quantity) || 0;
    const rate =
      p.rate != null && Number.isFinite(Number(p.rate))
        ? Number(p.rate)
        : Number(p.billingRatePerUnit) || 0;
    const min = Number(p.minimumReorderLevel) || 50;
    const valueNum = productLineAmount(p);
    return {
      product: p.productName,
      sku: p.batchNo || String(p._id).slice(-8),
      group: p.group || "—",
      category: p.category || "—",
      unit: resolveProductUnit(p.units) || String(p.alternateUnits || ""),
      qty,
      rate,
      value: formatInr(Math.round(valueNum)),
      status: stockStatusForQty(qty, min),
    };
  });
  if (group && group !== "all") {
    const g = group.toLowerCase();
    list = list.filter((p) => p.group.toLowerCase().includes(g));
  }
  const groupOptions = [
    ...new Set(
      (await Product.distinct("group")).filter(Boolean) as string[]
    ),
  ];
  return { products: list, groupOptions };
}

export async function createStockProductFromUi(body: Record<string, unknown>) {
  const qty = Number(body.qty) || 0;
  const rate =
    Number(body.rate) || Number(body.billingRate) || Number(body.billingRatePerUnit) || 0;
  const minReorder = Number(body.minReorderLevel) || 50;
  const unitsRaw = body.units ?? body.alternateUnits ?? "kg";
  const units =
    typeof unitsRaw === "string" && unitsRaw.trim()
      ? String(unitsRaw).trim()
      : String(unitsRaw || "kg");
  const doc = new Product({
    productName: String(body.productName || "New Product").trim() || "New Product",
    category: String(body.category || "General").trim() || "General",
    group: String(body.group || "General").trim() || "General",
    units,
    billingRatePerUnit: rate,
    quantity: qty,
    rate,
    amout:
      body.amout != null && Number.isFinite(Number(body.amout))
        ? Number(body.amout)
        : body.amount != null && Number.isFinite(Number(body.amount))
          ? Number(body.amount)
          : Math.round(qty * rate),
    minimumReorderLevel: minReorder,
    alternateUnits: body.alternateUnits
      ? String(body.alternateUnits).trim()
      : undefined,
  });
  const saved = await doc.save();
  const valueNum = productLineAmount(saved);
  const row = {
    product: saved.productName,
    sku: saved.batchNo || String(saved._id).slice(-8),
    group: saved.group,
    category: saved.category,
    unit:
      resolveProductUnit(saved.units) || String(saved.alternateUnits || ""),
    qty: Number(saved.quantity) || 0,
    rate: Number(saved.rate) || rate,
    value: formatInr(Math.round(valueNum)),
    status: stockStatusForQty(
      Number(saved.quantity) || 0,
      Number(saved.minimumReorderLevel) || minReorder
    ),
  };
  return row;
}

type GroupAgg = {
  id: string;
  groupName: string;
  valueNum: number;
  categories: Map<
    string,
    {
      id: string;
      name: string;
      qty: number;
      valueNum: number;
      products: Array<{
        productName: string;
        closingQty: number;
        rate: number;
        value: string;
        status: string;
      }>;
    }
  >;
};

export async function fetchStockGroups() {
  const products = await Product.find().lean();
  const byGroup = new Map<string, GroupAgg>();
  for (const p of products) {
    const gName = String(p.group || "General");
    const cName = String(p.category || "General");
    if (!byGroup.has(gName)) {
      byGroup.set(gName, {
        id: `g-${gName}`,
        groupName: gName,
        valueNum: 0,
        categories: new Map(),
      });
    }
    const g = byGroup.get(gName)!;
    const qty = Number(p.quantity) || 0;
    const rate =
      p.rate != null && Number.isFinite(Number(p.rate))
        ? Number(p.rate)
        : Number(p.billingRatePerUnit) || 0;
    const line = productLineAmount(p);
    g.valueNum += line;
    if (!g.categories.has(cName)) {
      g.categories.set(cName, {
        id: `c-${gName}-${cName}`,
        name: cName,
        qty: 0,
        valueNum: 0,
        products: [],
      });
    }
    const c = g.categories.get(cName)!;
    c.qty += qty;
    c.valueNum += line;
    const min = Number(p.minimumReorderLevel) || 0;
    c.products.push({
      productName: String(p.productName ?? ""),
      closingQty: qty,
      rate,
      value: String(Math.round(line)),
      status: stockStatusForQty(qty, min),
    });
  }
  const groups = [...byGroup.values()].map((g) => ({
    id: g.id,
    groupName: g.groupName,
    qty: null,
    rate: null,
    value: formatInr(Math.round(g.valueNum)),
    categories: [...g.categories.values()].map((c) => ({
      id: c.id,
      name: c.name,
      qty: c.qty,
      value: formatInr(Math.round(c.valueNum)),
      products: c.products,
    })),
  }));
  return { groups };
}

export async function fetchSchemesFiltered(query: Record<string, unknown>) {
  const search = String(query.search || "").toLowerCase();
  const type = String(query.type || "all");
  const audience = String(query.targetAudience || "all");
  const all = await MarketingScheme.find().sort({ createdAt: -1 }).lean();
  const list = all.filter((s) => {
    if (search && !String(s.schemeName).toLowerCase().includes(search))
      return false;
    if (
      type !== "all" &&
      String(s.schemeType).toLowerCase() !== type.toLowerCase()
    )
      return false;
    if (
      audience !== "all" &&
      String(s.targetAudience).toLowerCase() !== audience.toLowerCase()
    )
      return false;
    return true;
  });
  const rows = list.map((s) => ({
    id: String(s._id),
    "Scheme Name": s.schemeName,
    "Scheme Description": String(s.schemeDescription ?? "").trim(),
    "Applied Products": stripJitoxDemoProductNamePrefix(s.appliedProducts),
    Type: s.schemeType,
    "Target Audience": s.targetAudience,
    "Offer Name": s.offerDetails,
    "Start Date": s.startDate,
    "End Date": s.endDate,
  }));
  return { schemes: rows, total: all.length };
}

function marketingSchemeToRow(s: {
  _id: unknown;
  schemeName: string;
  schemeDescription?: string;
  appliedProducts: string;
  schemeType: string;
  targetAudience: string;
  offerDetails: string;
  startDate: string;
  endDate: string;
}) {
  return {
    id: String(s._id),
    "Scheme Name": s.schemeName,
    "Scheme Description": String(s.schemeDescription ?? "").trim(),
    "Applied Products": stripJitoxDemoProductNamePrefix(s.appliedProducts),
    Type: s.schemeType,
    "Target Audience": s.targetAudience,
    "Offer Name": s.offerDetails,
    "Start Date": s.startDate,
    "End Date": s.endDate,
  };
}

export async function createMarketingScheme(body: Record<string, unknown>) {
  const doc = await MarketingScheme.create({
    schemeName: String(body.schemeName || "New Scheme"),
    schemeDescription: String(body.schemeDescription ?? "").trim(),
    appliedProducts: stripJitoxDemoProductNamePrefix(
      String(body.appliedProducts || "-")
    ),
    schemeType: String(body.schemeType || "Cashback"),
    targetAudience: String(body.targetAudience || "Farmer"),
    offerDetails: String(body.offerDetails || "-"),
    startDate: String(body.startDate || ""),
    endDate: String(body.endDate || ""),
  });
  const s = doc.toObject();
  return {
    scheme: marketingSchemeToRow(s),
  };
}

export async function updateMarketingScheme(
  id: string,
  body: Record<string, unknown>
): Promise<{ scheme: ReturnType<typeof marketingSchemeToRow> } | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await MarketingScheme.findByIdAndUpdate(
    id,
    {
      schemeName: String(body.schemeName || "New Scheme"),
      schemeDescription: String(body.schemeDescription ?? "").trim(),
      appliedProducts: stripJitoxDemoProductNamePrefix(
        String(body.appliedProducts || "-")
      ),
      schemeType: String(body.schemeType || "Cashback"),
      targetAudience: String(body.targetAudience || "Farmer"),
      offerDetails: String(body.offerDetails || "-"),
      startDate: String(body.startDate || ""),
      endDate: String(body.endDate || ""),
    },
    { new: true, runValidators: true }
  ).lean();
  if (!doc) return null;
  const d = doc as {
    _id: unknown;
    schemeName: string;
    schemeDescription?: string;
    appliedProducts: string;
    schemeType: string;
    targetAudience: string;
    offerDetails: string;
    startDate: string;
    endDate: string;
  };
  return { scheme: marketingSchemeToRow(d) };
}

export async function deleteMarketingScheme(id: string) {
  await MarketingScheme.findByIdAndDelete(id);
}

async function ensureDocumentLibrarySeeded() {
  const n = await DocumentCategory.countDocuments();
  if (n > 0) return;
  const defs = [
    {
      name: "Government Licenses & Certificates",
      icon: "📋",
      inSidebar: true,
      sortIndex: 0,
      entries: [
        ["Pesticide Permit", "2025-01-01"],
        ["Organic Certifications", "2025-01-01"],
        ["GST Or Business Licenses", "2025-01-01"],
      ],
    },
    {
      name: "Training Manuals & Guides",
      icon: "📘",
      inSidebar: true,
      sortIndex: 1,
      entries: [
        ["Crop Care", "2025-01-10"],
        ["Fertilizer Usage", "2025-01-10"],
        ["Equipment Manual", "2025-01-10"],
      ],
    },
    {
      name: "Reports",
      icon: "📊",
      inSidebar: true,
      sortIndex: 3,
      entries: [
        ["Harvest Reports", "2025-01-15"],
        ["Market Rate Analysis", "2025-01-16"],
        ["Seasonal Crop", "2025-01-17"],
      ],
    },
    {
      name: "Product Catalogs",
      icon: "🛍️",
      inSidebar: true,
      sortIndex: 4,
      entries: [
        ["Seed Varieties", "2025-01-18"],
        ["Agrochemical Product Catalog", "2025-01-19"],
      ],
    },
    {
      name: "Agreements & Contracts",
      icon: "📝",
      inSidebar: false,
      sortIndex: 2,
      entries: [
        ["Farmer Agreement", "2025-01-10"],
        ["Distributor MOUs", "2025-01-10"],
        ["Vendor Contracts", "2025-01-10"],
      ],
    },
  ];
  for (const d of defs) {
    const cat = await DocumentCategory.create({
      name: d.name,
      icon: d.icon,
      inSidebar: d.inSidebar,
      sortIndex: d.sortIndex,
    });
    for (const [name, dateIso] of d.entries) {
      await DocumentEntry.create({
        categoryId: cat._id,
        name,
        admin: "Admin Name",
        type: "pdf",
        dateIso,
      });
    }
  }
}

function filterUiDocuments(
  docs: { name: string; dateIso: string }[],
  q: string,
  from?: string,
  to?: string
) {
  return docs.filter((d) => {
    if (q && !d.name.toLowerCase().includes(q)) return false;
    if (from && d.dateIso < from) return false;
    if (to && d.dateIso > to) return false;
    return true;
  });
}

export async function fetchDocumentsGrid(query: Record<string, unknown>) {
  await ensureDocumentLibrarySeeded();
  const q = String(query.q || "").toLowerCase();
  const from = query.from ? String(query.from) : "";
  const to = query.to ? String(query.to) : "";

  const categories = await DocumentCategory.find().sort({ sortIndex: 1 }).lean();
  const entries = await DocumentEntry.find().lean();
  const byCat = new Map<string, typeof entries>();
  for (const e of entries) {
    const k = String(e.categoryId);
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k)!.push(e);
  }

  const gridOrder = [...categories]
    .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
    .map((c) => String(c._id));

  const gridSections = gridOrder
    .map((id) => categories.find((c) => String(c._id) === id))
    .filter(Boolean)
    .map((meta) => {
      const catIdStr = String(meta!._id);
      const raw = (byCat.get(catIdStr) || []).map((d) => {
        const dateIso = String(d.dateIso ?? "");
        const rec = d as {
          fileUrl?: string;
        };
        return {
          id: String(d._id),
          categoryId: catIdStr,
          name: String(d.name ?? ""),
          date: new Date(`${dateIso}T12:00:00`).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          admin: String(d.admin ?? ""),
          type: String(d.type ?? "pdf"),
          dateIso,
          fileUrl: String(rec.fileUrl || "").trim(),
        };
      });
      const documents = filterUiDocuments(raw, q, from || undefined, to || undefined);
      return {
        id: String(meta!._id),
        name: String(meta!.name ?? ""),
        icon: String(meta!.icon ?? "📁"),
        count: documents.length,
        documents,
      };
    });

  const sidebarCategories = categories
    .filter((c) => c.inSidebar)
    .map((c) => ({
      id: String(c._id),
      name: String(c.name ?? ""),
      icon: String(c.icon ?? "📁"),
      count: (byCat.get(String(c._id)) || []).length,
    }));

  return { gridSections, sidebarCategories, gridOrder };
}

export async function createDocumentCategory(body: Record<string, unknown>) {
  await ensureDocumentLibrarySeeded();
  const name = String(body.name || "").trim();
  if (!name) throw new Error("name required");
  const maxSort = await DocumentCategory.findOne()
    .sort({ sortIndex: -1 })
    .select("sortIndex")
    .lean();
  const nextIdx = (maxSort?.sortIndex ?? 0) + 1;
  const cat = await DocumentCategory.create({
    name,
    icon: String(body.icon || "📁"),
    inSidebar: true,
    sortIndex: nextIdx,
  });
  return {
    category: {
      id: String(cat._id),
      name: cat.name,
      icon: cat.icon,
      count: 0,
      inSidebar: true,
    },
  };
}

export async function createDocumentEntry(body: Record<string, unknown>) {
  await ensureDocumentLibrarySeeded();
  const categoryId = String(body.categoryId || "").trim();
  const name = String(body.name || "").trim();
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new Error("Invalid category id");
  }
  if (!name) throw new Error("name required");
  const cat = await DocumentCategory.findById(categoryId);
  if (!cat) throw new Error("Category not found");
  let type = String(body.type || "pdf").toLowerCase();
  if (!["pdf", "word", "doc", "png", "other"].includes(type)) type = "pdf";
  const dateRaw = body.dateIso ?? body.date;
  const dateIso =
    typeof dateRaw === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateRaw)
      ? dateRaw.slice(0, 10)
      : new Date().toISOString().slice(0, 10);
  const admin = String(body.admin || "Admin").trim() || "Admin";
  let fileUrl = String(body.fileUrl || "").trim();
  if (fileUrl && !fileUrl.startsWith("/uploads/documents/")) {
    throw new Error("Invalid file URL");
  }
  const doc = await DocumentEntry.create({
    categoryId,
    name,
    type,
    dateIso,
    admin,
    fileUrl: fileUrl || "",
  });
  return {
    id: String(doc._id),
    categoryId: String(doc.categoryId),
    name: doc.name,
    type: doc.type,
    dateIso: doc.dateIso,
    admin: doc.admin,
    fileUrl: String(doc.fileUrl || "").trim(),
  };
}

export async function deleteDocumentEntry(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid document id");
  }
  const r = await DocumentEntry.findById(id).lean();
  if (!r) throw new Error("Document not found");
  const fu = String((r as { fileUrl?: string }).fileUrl || "").trim();
  if (fu.startsWith("/uploads/documents/")) {
    const base = path.basename(fu);
    if (base && !base.includes("..")) {
      const abs = path.join(process.cwd(), "uploads", "documents", base);
      try {
        fs.unlinkSync(abs);
      } catch {
        /* ignore missing file */
      }
    }
  }
  await DocumentEntry.findByIdAndDelete(id);
}

export async function updateDocumentEntry(
  id: string,
  body: Record<string, unknown>
) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid document id");
  }
  const patch: Record<string, unknown> = {};
  if (body.name != null && String(body.name).trim()) {
    patch.name = String(body.name).trim();
  }
  if (body.type != null) {
    let t = String(body.type).toLowerCase();
    if (!["pdf", "word", "doc", "png", "other"].includes(t)) t = "pdf";
    patch.type = t;
  }
  if (body.dateIso != null && String(body.dateIso)) {
    patch.dateIso = String(body.dateIso).slice(0, 10);
  }
  if (body.admin != null) {
    patch.admin = String(body.admin).trim() || "Admin";
  }
  if (
    body.categoryId != null &&
    mongoose.Types.ObjectId.isValid(String(body.categoryId))
  ) {
    const nc = await DocumentCategory.findById(String(body.categoryId));
    if (!nc) throw new Error("Category not found");
    patch.categoryId = body.categoryId;
  }
  if (body.fileUrl !== undefined) {
    const fu = String(body.fileUrl || "").trim();
    if (fu && !fu.startsWith("/uploads/documents/")) {
      throw new Error("Invalid file URL");
    }
    patch.fileUrl = fu || "";
  }
  const doc = await DocumentEntry.findByIdAndUpdate(id, patch, { new: true });
  if (!doc) throw new Error("Document not found");
  return {
    id: String(doc._id),
    categoryId: String(doc.categoryId),
    name: doc.name,
    type: doc.type,
    dateIso: doc.dateIso,
    admin: doc.admin,
    fileUrl: String(doc.fileUrl || "").trim(),
  };
}

export async function listEmployeesForTracking() {
  const fromDb = await Employee.find({ status: "Active" })
    .sort({ name: 1 })
    .lean();
  const mapped = fromDb.map((e) => ({
    id: String(e._id),
    name: e.name,
    department: e.department,
    time: e.updatedAt
      ? new Date(e.updatedAt).toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
        })
      : "—",
    online: false,
  }));
  const ids = new Set(mapped.map((m) => m.id));
  const extras = employeesTrackingSeed
    .filter((s) => !ids.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name,
      department: s.department,
      time: s.time,
      online: s.online,
    }));
  return { employees: [...mapped, ...extras] };
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function roundKm(km: number): number {
  return Math.round(km * 10) / 10;
}

function pathLengthKm(path: [number, number][]): number {
  if (path.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < path.length; i++) {
    const [la, ln] = path[i - 1];
    const [lb, le] = path[i];
    sum += haversineKm({ lat: la, lng: ln }, { lat: lb, lng: le });
  }
  return roundKm(sum);
}

export async function buildEmployeeTrackingRows(
  id: string,
  query: Record<string, unknown>
) {
  const from = query.from ? String(query.from) : "";
  const to = query.to ? String(query.to) : "";

  const seed = employeesTrackingSeed.find((e) => e.id === id);
  if (seed) {
    let days = [...seed.tracking];
    if (from) days = days.filter((d) => d.dateIso >= from);
    if (to) days = days.filter((d) => d.dateIso <= to);
    const rows = days.map((d) => mapTrackingDay(d));
    return {
      employee: {
        id: seed.id,
        name: seed.name,
        department: seed.department,
      },
      rows,
    };
  }

  const emp = await Employee.findById(id).lean();
  if (!emp) return null;
  return {
    employee: {
      id: String(emp._id),
      name: emp.name,
      department: emp.department,
    },
    rows: [] as ReturnType<typeof mapTrackingDay>[],
  };
}

function mapTrackingDay(d: EmployeeSeed["tracking"][0]) {
  const visits = d.visits;
  const pathFromVisits: [number, number][] = visits.map((v) => [v.lat, v.lng]);
  const path: [number, number][] =
    d.mapPath && d.mapPath.length >= 2 ? d.mapPath : pathFromVisits;

  const visitsWithLegs = visits.map((v, i) => {
    const distanceFromPrevKm =
      i === 0 ? null : roundKm(haversineKm(visits[i - 1], v));
    return { ...v, distanceFromPrevKm };
  });

  let mapTrack:
    | {
        path: [number, number][];
        totalPathKm: number;
        stops: {
          lat: number;
          lng: number;
          time: string;
          partyName: string;
          address: string;
          distanceFromPrevKm: number | null;
        }[];
        commuteChordKm?: number;
        commuteMid?: { lat: number; lng: number };
      }
    | undefined =
    visits.length > 0
      ? {
          path,
          totalPathKm: pathLengthKm(path),
          stops: visitsWithLegs.map((v) => ({
            lat: v.lat,
            lng: v.lng,
            time: v.time,
            partyName: v.partyName,
            address: v.address,
            distanceFromPrevKm: v.distanceFromPrevKm,
          })),
        }
      : undefined;

  if (mapTrack && visits.length === 1 && path.length >= 2) {
    const p0 = path[0];
    const pL = path[path.length - 1];
    mapTrack.commuteChordKm = roundKm(
      haversineKm({ lat: p0[0], lng: p0[1] }, { lat: pL[0], lng: pL[1] })
    );
    mapTrack.commuteMid = {
      lat: (p0[0] + pL[0]) / 2,
      lng: (p0[1] + pL[1]) / 2,
    };
  }

  return {
    Date: d.dateDisplay,
    dateIso: d.dateIso,
    "Opening KM": `${d.openingKm} Km`,
    "Closing KM": `${d.closingKm} Km`,
    "Travelled KM": `${d.travelledKm} Km`,
    Visit: String(d.visit),
    "Working Hours": d.workingHours,
    _visits: visitsWithLegs,
    _mapTrack: mapTrack,
  };
}

export async function ordersReceivableFromQuotations(): Promise<number> {
  const rows = (await Quotation.find({ addedToOrder: true }).lean()) as unknown as QuotationLean[];
  let receivable = 0;
  for (const o of rows) {
    const q = o;
    const labels = paymentLabels(q);
    if (labels.paymentStatus !== "Paid") {
      const total = Number(q.totalAmount) || 0;
      const paid = Number(q.paidAmount) || 0;
      receivable += Math.max(0, total - paid);
    }
  }
  return receivable;
}

export async function recentOrdersFormatted(limit: number) {
  const docs = (await Quotation.find({ addedToOrder: true })
    .populate("items.product", "productName")
    .sort({ voucherDate: -1, createdAt: -1 })
    .limit(limit)
    .lean()) as unknown as QuotationLean[];
  return docs.map((q) => formatOrderRowFromQuotation(q));
}
