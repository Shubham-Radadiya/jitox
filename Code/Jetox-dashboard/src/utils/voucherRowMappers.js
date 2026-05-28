import dayjs from "dayjs";
import {
  displayOrderStatus,
  displayQuotationListStatus,
  hasOrderListDecisionMade,
  isQuotationOnOrderList,
} from "../constants/orderStatus";
import { invoiceCompanyFields } from "../constants/invoiceCompanyProfile";
import {
  resolvePurchasePaymentStatusDisplay,
  resolvePurchaseReturnRefundStatusDisplay,
  resolveSalesReturnRefundStatusDisplay,
} from "./purchasePaymentStatus";

export function fmtRupee(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `₹${x.toLocaleString("en-IN")}`;
}

export function parseRupeeCell(s) {
  if (s == null || s === "—") return 0;
  const n = Number(String(s).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Line discount ₹ (matches purchase invoice: amt overrides %). */
export function purchaseLineDiscount(it) {
  const qty = Number(it?.quantity) || 0;
  const rate = Number(it?.rateParUnit) || 0;
  const base = qty * rate;
  const dAmt = Number(it?.discountAmt);
  const dPct = Number(it?.discountPct);
  if (Number.isFinite(dAmt) && dAmt > 0) return dAmt;
  if (Number.isFinite(dPct) && dPct > 0) return (base * dPct) / 100;
  const sub = Number(it?.subtotal);
  if (base > 0 && Number.isFinite(sub)) return Math.max(0, base - sub);
  return 0;
}

export function sumPurchaseLineDiscounts(items) {
  const list = Array.isArray(items) ? items : [];
  return list.reduce((sum, it) => sum + purchaseLineDiscount(it), 0);
}

function purchaseRowPaidAmount(v) {
  const total = Number(v.totalAmount) || 0;
  const status = resolvePurchasePaymentStatusDisplay(v);
  let paid = Number(v.paidAmount);
  if (!Number.isFinite(paid)) {
    if (status === "Paid") paid = total;
    else if (status === "Unpaid") paid = 0;
    else paid = 0;
  }
  return Math.max(0, Math.min(total, paid));
}

export function mapPurchaseAggregateRow(v) {
  const id = v._id;
  const date = v.voucherDate
    ? dayjs(v.voucherDate).format("YYYY-MM-DD")
    : "";
  const total = Number(v.totalAmount) || 0;
  const paid = purchaseRowPaidAmount(v);
  const remaining = Math.max(0, total - paid);
  return {
    _id: id,
    _raw: v,
    Date: date,
    "Party Name": v.partyName || "—",
    "Voucher No.": v.voucherNo || "—",
    "Total Amount": fmtRupee(total),
    "Paid Amount": fmtRupee(paid),
    "Due Amount": fmtRupee(remaining),
    "Debit Amount": total > 0 ? fmtRupee(total) : "—",
    "Payment Status": resolvePurchasePaymentStatusDisplay(v),
  };
}

export function mapSalesReturnAggregateRow(v) {
  const id = v._id;
  const date = v.voucherDate
    ? dayjs(v.voucherDate).format("YYYY-MM-DD")
    : "";
  const total = Number(v.totalAmount) || 0;
  const returnedQty = Array.isArray(v.items)
    ? v.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
    : 0;
  return {
    _id: id,
    _raw: v,
    "Return ID": v.voucherNo || "—",
    "Invoice No.": v.salesInvoiceNo || v.invoiceNo || "—",
    "Client Name": v.partyName || "—",
    "Return Date": date,
    "Returned QTY": returnedQty,
    "Reason ": v.returnReason || v.narration || "—",
    Amount: fmtRupee(total),
    "Refund Order Status": v.approvalStatus || "Pending",
    "Refund Payment Status": resolveSalesReturnRefundStatusDisplay(v),
  };
}

export function mapPurchaseReturnAggregateRow(v) {
  const id = v._id;
  const date = v.voucherDate
    ? dayjs(v.voucherDate).format("YYYY-MM-DD")
    : "";
  const total = Number(v.totalAmount) || 0;
  const paid = Number(v.refundedAmount) || 0;
  const remaining = Math.max(0, total - paid);
  const paymentStatus = resolvePurchaseReturnRefundStatusDisplay(v);
  return {
    _id: id,
    _raw: v,
    Date: date,
    "Party Name": v.partyName || "—",
    "Voucher No.": v.voucherNo || "—",
    "Total Amount": fmtRupee(total),
    "Paid Amount": fmtRupee(paid),
    "Due Amount": fmtRupee(remaining),
    "Payment Status": paymentStatus,
    "Debit Amount": total > 0 ? fmtRupee(total) : "—",
  };
}

export function mapManufacturingRow(v) {
  const id = v._id;
  const finished =
    v.finishedProduct && typeof v.finishedProduct === "object"
      ? v.finishedProduct
      : null;
  const productName = finished?.productName || "—";
  const qty = Number(v.quantityToProduce);
  const unit = String(v.produceUnit || "").trim();
  const status = v.status || "Planned";
  const stockIssues = Array.isArray(v.stockIssues) ? v.stockIssues : [];
  const stockBlocked = Boolean(v.stockBlocked) || stockIssues.length > 0;
  const displayStatus =
    status === "Paused" || (stockBlocked && status === "Planned")
      ? "Paused"
      : status;
  const displayDate = v.completedAt || v.startedAt || v.mfgDate;
  const dateIso = displayDate
    ? dayjs(displayDate).format("YYYY-MM-DD")
    : "—";
  const costPerUnit = Number(v.landingCostPerUnit);
  const grandTotal = Number(v.grandTotal);
  let qtyMade = "—";
  if (status === "Failed" && (!Number.isFinite(qty) || qty <= 0)) {
    qtyMade = "0";
  } else if (Number.isFinite(qty) && qty > 0) {
    qtyMade = unit ? `${qty} ${unit}` : String(qty);
  }
  return {
    _id: id,
    _raw: v,
    "Batch ID": v.batchCode || v.voucherNo || "—",
    "Product Name": productName,
    Date: dateIso,
    "Qty Made": qtyMade,
    "Cost/Unit":
      Number.isFinite(costPerUnit) && costPerUnit > 0
        ? fmtRupee(costPerUnit)
        : status === "Failed"
          ? "—"
          : fmtRupee(costPerUnit),
    "Total Cost":
      Number.isFinite(grandTotal) && grandTotal > 0
        ? fmtRupee(grandTotal)
        : status === "Failed"
          ? fmtRupee(0)
          : fmtRupee(grandTotal),
    Status: displayStatus,
    stockBlocked,
    stockIssues,
  };
}

export function mapSalesAggregateRow(v) {
  const id = v._id;
  const date = v.voucherDate ? dayjs(v.voucherDate).format("YYYY-MM-DD") : "";
  const totalQty = Array.isArray(v.items)
    ? v.items.reduce((s, it) => s + (Number(it?.quantity) || 0), 0)
    : 0;
  return {
    _id: id,
    _raw: v,
    "Invoice No.": v.voucherNo || v.invoiceNo || "—",
    Date: date,
    "Party Name": v.partyName || "—",
    Qty: totalQty ? String(totalQty) : "—",
    Amount: v.totalAmount != null ? fmtRupee(v.totalAmount) : "—",
    "Payment Status": v.paymentStatus || "Pending",
    "Order Status": v.orderStatus || "Processing",
  };
}

export function mapDashboardOrderRow(r) {
  return {
    _id: r._id,
    _raw: r,
    "Invoice No.": r["Order ID"] || r.orderId || "—",
    Date: r.Date || "—",
    "Party Name": r["Client Name"] || "—",
    Qty: r.Products || "—",
    Amount: r["Total Amount"] || "—",
    "Payment Status": r["Payment Status"] || "—",
    "Order Status": r["Order Status"] || "—",
  };
}

export function mapPaymentVoucherRow(v) {
  const mode = String(v.paymentThrough || "").toLowerCase();
  return {
    _id: v._id,
    _raw: v,
    "Voucher No": v.voucherNo || "—",
    Date: v.date ? dayjs(v.date).format("YYYY-MM-DD") : "—",
    Party: v.paymentTo || "—",
    "Paid From": v.paymentFrom || "—",
    Mode: mode === "bank" ? "bank" : mode === "cash" ? "cash" : mode || "—",
    Amount: v.amount != null ? fmtRupee(parseFloat(String(v.amount))) : "—",
    Status: v.status || "Pending",
  };
}

export function mapAccountingReceiptRow(v) {
  const paid = String(v.status || "").toLowerCase() === "paid";
  return {
    _id: v._id,
    _raw: v,
    "Voucher No": v.voucherNo || "—",
    Date: v.date ? dayjs(v.date).format("YYYY-MM-DD") : "—",
    "Receipt From": v.receiptFrom || "—",
    "Received In": v.receivedIn || "—",
    Mode: v.receiptThrough || "—",
    "Amount (₹)":
      v.amount != null
        ? Number(String(v.amount).replace(/,/g, "")).toLocaleString("en-IN")
        : "—",
    Narration: v.remarks || "—",
    Status: paid ? "Received" : "Pending",
  };
}

export function mapExpenseRow(v) {
  return {
    _id: v._id,
    _raw: v,
    Date: v.startDate
      ? dayjs(v.startDate).format("YYYY-MM-DD")
      : "—",
    "Expense Type": v.expenseType || "—",
    Description: v.description || "—",
    "Paid To": v.paidTo || "—",
    Amount: v.amount != null ? fmtRupee(v.amount) : "—",
    Mode: v.paymentMode || "—",
    Proof: v.uploadProof ? "view" : "-",
  };
}

export function mapCashVoucherRow(v) {
  const amt = v.amount != null ? fmtRupee(v.amount) : "—";
  return {
    _id: v._id,
    _raw: v,
    "Voucher No": v.voucherNumber || "—",
    Date: v.createdAt
      ? dayjs(v.createdAt).format("YYYY-MM-DD")
      : "—",
    Particulars: v.particulars || v.narration || "—",
    "Debit (Outflow)": v.creditTo || "—",
    "Credit (Inflow)": v.debitFrom || "Cash",
    Balance: amt,
  };
}

export function mapBankVoucherRow(v) {
  const amt = v.amount != null ? fmtRupee(v.amount) : "—";
  return {
    _id: v._id,
    _raw: v,
    "Voucher No": v.voucherNumber || "—",
    Date: v.createdAt
      ? dayjs(v.createdAt).format("YYYY-MM-DD")
      : "—",
    Particulars: v.particulars || v.narration || "—",
    "Debit (Inflow)": v.debitFrom || "—",
    "Credit (Outflow)": v.creditTo || "—",
    Balance: amt,
  };
}

export function mapJournalRow(v) {
  return {
    _id: v._id,
    _raw: v,
    "Entry No": v.voucherNo || "—",
    Date: v.date ? dayjs(v.date).format("YYYY-MM-DD") : "—",
    Description: v.remarks || "—",
    Debit: v.debitAmount != null ? fmtRupee(v.debitAmount) : "—",
    Credit: v.creditAmount != null ? fmtRupee(v.creditAmount) : "—",
  };
}

/** Mongo id from a voucher list row (aggregate or mapper). */
export function resolveVoucherRowId(row) {
  const raw = row?._raw;
  const id = row?._id ?? raw?._id;
  if (id == null || id === "") return null;
  return String(id);
}

export function mapQuotationRow(q) {
  const addedToOrder = isQuotationOnOrderList(q);
  const orderListDecisionMade = hasOrderListDecisionMade(q);
  const orderListStatus = displayQuotationListStatus(q);
  return {
    _id: q._id,
    _raw: q,
    addedToOrder,
    orderListDecisionMade,
    "Quote No": q.voucherNo || "—",
    Date: q.voucherDate
      ? dayjs(q.voucherDate).format("YYYY-MM-DD")
      : "—",
    Client: q.partyName || "—",
    Amount: q.totalAmount != null ? fmtRupee(q.totalAmount) : "—",
    "Quotation status": orderListStatus,
    Status: orderListStatus,
  };
}

/** Detail drawer shape for quotation vouchers (reuses purchase layout). */
export function quotationDocToDetailShape(doc, partyAccount = null, options = {}) {
  return purchaseDocToDetailShape(doc, partyAccount, {
    isQuotation: true,
    ...options,
  });
}

function pushDetailRow(rows, label, value) {
  if (value == null) return;
  const v = String(value).trim();
  if (!v) return;
  rows.push({ label, value: v });
}

/** Shape expected by PurchaseDetails drawer */
/** Purchase return view drawer — refund received = paid amount, status Received/Partial/Pending. */
export function purchaseReturnDocToDetailShape(doc, partyAccount = null, options = {}) {
  return purchaseDocToDetailShape(doc, partyAccount, {
    isPurchaseReturn: true,
    ...options,
  });
}

export function purchaseDocToDetailShape(
  doc,
  partyAccount = null,
  options = {}
) {
  const d = doc;
  if (!d) return null;
  const isPurchaseReturn = options.isPurchaseReturn === true;
  const isQuotation = options.isQuotation === true;

  const basePriceNum = Number(d.basePrice);
  const gstAmountNum = Number(d.gstAmount);
  const hasSplitGst =
    Number.isFinite(basePriceNum) &&
    basePriceNum > 0 &&
    Number.isFinite(gstAmountNum) &&
    gstAmountNum >= 0;

  const products = (d.items || []).map((it, i) => {
    const p = it.product;
    const name =
      p && typeof p === "object" && p.productName
        ? p.productName
        : String(p || `Item ${i + 1}`);
    let lineGst = "—";
    if (hasSplitGst) {
      const taxable = Number(it.subtotal);
      if (Number.isFinite(taxable) && taxable >= 0) {
        const share = (taxable / basePriceNum) * gstAmountNum;
        lineGst = fmtRupee(share);
      }
    }
    return {
      name,
      hsn: String(it.hsn ?? "").trim() || "—",
      qty: String(it.quantity ?? ""),
      rate: fmtRupee(it.rateParUnit),
      gst: lineGst,
      subtotal: fmtRupee(it.subtotal),
    };
  });
  const ta = d.totalAmount;
  const totalLabel = ta != null ? fmtRupee(ta) : "—";

  /** Our (buyer) side — for the “Customer Details” card in PurchaseDetails. */
  const customer = [];
  pushDetailRow(customer, "Full Name", d.orderby);

  /** Supplier side — for the “Party Details” card. Keep it to the two slots used by the design. */
  const party = [];
  pushDetailRow(party, "Full Name", d.partyName);
  const shippingAddress = isQuotation
    ? String(d.shipToAndBillTo ?? "").trim() ||
      String(d.shipTo ?? "").trim() ||
      String(d.billTo ?? "").trim()
    : String(d.shipTo ?? "").trim() || String(d.billTo ?? "").trim();
  pushDetailRow(party, "Shipping Address", shippingAddress);

  if (party.length === 0) {
    pushDetailRow(party, "Full Name", "—");
  }

  const termsAndConditions = String(d.termsAndConditions || "").trim();

  const paymentStatus = isPurchaseReturn
    ? resolvePurchaseReturnRefundStatusDisplay(d)
    : resolvePurchasePaymentStatusDisplay(d);
  const quotationListStatus = isQuotation
    ? displayQuotationListStatus(d)
    : null;
  const totalNum = Number(d.totalAmount) || 0;
  let paidNum = isPurchaseReturn
    ? Number(d.refundedAmount)
    : Number(d.paidAmount);
  if (!Number.isFinite(paidNum)) {
    if (!isPurchaseReturn && paymentStatus === "Paid") paidNum = totalNum;
    else if (!isPurchaseReturn && paymentStatus === "Unpaid") paidNum = 0;
    else if (isPurchaseReturn && paymentStatus === "Received") paidNum = totalNum;
    else paidNum = 0;
  }
  paidNum = Math.max(0, Math.min(totalNum, paidNum));
  const dueNum = Math.max(0, totalNum - paidNum);

  const discountNum = Math.round(sumPurchaseLineDiscounts(d.items));
  const discountLabel = fmtRupee(discountNum);

  const gstPctLabel =
    hasSplitGst && basePriceNum > 0
      ? Math.round((gstAmountNum / basePriceNum) * 100)
      : null;

  return {
    voucherNo: d.voucherNo || "—",
    status: isQuotation ? quotationListStatus : paymentStatus,
    quotationListStatus,
    isPurchaseReturn,
    isQuotation,
    paymentTerms: isQuotation
      ? d.paymentMode
        ? String(d.paymentMode)
        : "—"
      : d.termsOfPayment
        ? String(d.termsOfPayment)
        : d.paymentMode
          ? String(d.paymentMode)
          : "—",
    invoiceNo: d.invoiceNo ? String(d.invoiceNo) : "—",
    purchaseDate: d.voucherDate
      ? dayjs(d.voucherDate).format("DD MMM YYYY")
      : "—",
    narration: d.narration || d.remarks || "",
    termsAndConditions,
    customer,
    party,
    products:
      products.length > 0
        ? products
        : [
            {
              name: "—",
              hsn: "—",
              qty: "—",
              rate: "—",
              gst: "—",
              subtotal: "—",
            },
          ],
    totals: {
      totalAmount: totalLabel,
      tax: d.gstAmount != null ? fmtRupee(d.gstAmount) : "—",
      taxLabel: gstPctLabel != null ? `Tax (${gstPctLabel}%)` : "Tax",
      discount: discountLabel,
      paid: fmtRupee(paidNum),
      due: fmtRupee(dueNum),
      finalPayable: totalLabel,
      reference: d.transportDetails || "",
    },
    _sourceDoc: d,
    partyAccount: partyAccount || null,
    shipPartyAccount: options.shipPartyAccount ?? partyAccount ?? null,
  };
}

/**
 * Format INR consistently with the backend (`formatInr` in
 * `services/dashboardDynamic.service.ts`): rounds and uses `en-IN` grouping.
 */
function fmtInr(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `₹${Math.round(x).toLocaleString("en-IN")}`;
}

/** Payment block for Order Details / Sales drawer (matches PurchaseDetails totals). */
export function buildOrderDrawerPaymentDetail(d) {
  if (!d || typeof d !== "object") return {};

  const basePriceNum = Number(d.basePrice) || 0;
  const gstAmountNum = Number(d.gstAmount) || 0;
  const totalNum = Number(d.totalAmount) || 0;
  const hasSplitGst =
    basePriceNum > 0 && Number.isFinite(gstAmountNum) && gstAmountNum >= 0;
  const gstPctLabel =
    hasSplitGst && basePriceNum > 0
      ? Math.round((gstAmountNum / basePriceNum) * 100)
      : null;

  const paymentStatus = resolvePurchasePaymentStatusDisplay(d);
  let paidNum = Number(d.paidAmount);
  if (!Number.isFinite(paidNum)) {
    if (paymentStatus === "Paid") paidNum = totalNum;
    else if (paymentStatus === "Unpaid") paidNum = 0;
    else paidNum = 0;
  }
  paidNum = Math.max(0, Math.min(totalNum, paidNum));
  const dueNum = Math.max(0, totalNum - paidNum);
  const discountNum = Math.round(sumPurchaseLineDiscounts(d.items));
  const termsOfPayment =
    String(d.termsOfPayment || "").trim() ||
    String(d.paymentMode || "").trim() ||
    "—";

  return {
    termsOfPayment,
    paymentMode: String(d.paymentMode || "").trim() || "—",
    subTotal: fmtInr(basePriceNum),
    totalAmount: fmtInr(totalNum),
    tax: fmtInr(gstAmountNum),
    taxLabel: gstPctLabel != null ? `Tax (${gstPctLabel}%)` : "Tax",
    discount: fmtInr(discountNum),
    paid: fmtInr(paidNum),
    due: fmtInr(dueNum),
    finalPayable: fmtInr(totalNum),
    grandTotal: fmtInr(totalNum),
    mode: String(d.paymentMode || "").trim() || "—",
    transactionId: String(d.transactionId || "").trim() || "—",
    dueDate: d.dueDate ? dayjs(d.dueDate).format("DD MMM YYYY") : "",
    paymentStatus,
  };
}

function dispatchLabelFromDashboardTab(tab) {
  const t = String(tab || "").trim();
  if (t === "dispatched") return "Dispatched";
  if (t === "partSupply") return "Part Supply";
  if (t === "cancelled") return "Cancelled";
  if (t === "pending") return "Pending";
  return "";
}

/**
 * Shape expected by `OrderDetailsDrawer` (reused by `SalesDetailsDrawer`).
 *
 * Mirrors the shape `fetchQuotationOrderPayload` returns on the backend —
 * always emit formatted strings with `"—"` fallbacks so every row in the
 * Payment Details / Dispatch / Delivery sections renders, even when the
 * underlying voucher field is missing. This keeps the sales voucher view
 * visually identical to the dashboard's order drawer.
 */
export function salesDocToOrderDetailShape(doc) {
  const d = doc;
  if (!d) return null;

  const createdSource = d.voucherDate || d.createdAt;
  const createdAt = createdSource
    ? new Date(createdSource).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  const basePriceNum = Number(d.basePrice) || 0;
  const gstAmountNum = Number(d.gstAmount) || 0;
  const hasSplitGst =
    basePriceNum > 0 &&
    Number.isFinite(gstAmountNum) &&
    gstAmountNum >= 0;

  const products = (d.items || []).map((it, i) => {
    const p = it.product;
    const name =
      p && typeof p === "object" && p.productName
        ? p.productName
        : String(p || `Item ${i + 1}`);
    const qtyNum = Number(it.quantity);
    const qty = `${Number.isFinite(qtyNum) ? qtyNum : it.quantity ?? ""} ${it.unit || ""}`.trim();
    const rateNum = Number(it.rateParUnit) || 0;
    const subNum =
      Number(it.subtotal) ||
      (Number.isFinite(qtyNum) ? qtyNum * rateNum : 0);
    let lineGst = "—";
    if (hasSplitGst) {
      const taxable = Number(it.subtotal);
      if (Number.isFinite(taxable) && taxable >= 0) {
        const share = (taxable / basePriceNum) * gstAmountNum;
        lineGst = fmtInr(share);
      }
    }
    return {
      name,
      hsn: String(it.hsn ?? "").trim() || "—",
      qty: qty || "—",
      rate: fmtInr(rateNum),
      gst: lineGst,
      subtotal: fmtInr(subNum),
    };
  });

  const productsTotal = fmtInr(
    (d.items || []).reduce((s, i) => s + (Number(i?.subtotal) || 0), 0)
  );

  const shippingAddress =
    String(d.shipTo ?? "").trim() ||
    String(d.shipToAndBillTo ?? "").trim() ||
    String(d.billTo ?? "").trim();

  const manager = {
    fullName: d.orderby || "—",
    region: d.region || "",
    area: d.area || "",
  };

  const client = {
    fullName: d.partyName || "—",
    phone: d.partyPhone || d.phone || "",
    email: d.partyEmail || d.email || "",
    shippingAddress,
  };

  const payment = buildOrderDrawerPaymentDetail(d);
  const paymentStatus =
    payment.paymentStatus || resolvePurchasePaymentStatusDisplay(d);
  const orderStatus = displayOrderStatus(
    d.dashboardOrderStatus || d.orderStatus,
    { isQuotation: !d.addedToOrder }
  );
  const dispatchTabLabel = dispatchLabelFromDashboardTab(d.dashboardTab);
  const dispatch = {
    status:
      dispatchTabLabel ||
      d.dispatchStatus ||
      (d.dashboardTab === "dispatched" ? "Dispatched" : "—"),
  };

  const delivery = {
    trackingNumber: d.trackingNumber || d.transportDetails || "—",
    courier: d.courier || d.deliveryAt || "—",
  };

  /**
   * Invoice payload for `InvoiceModal` — mirrors the shape produced by
   * `fetchQuotationOrderPayload` on the backend so the modal renders the
   * same way it does from the dashboard's "Generate Invoice" button.
   */
  const totalAmount = Number(d.totalAmount) || 0;
  const paidAmount = Number(d.paidAmount) || 0;
  const outstanding = Math.max(0, totalAmount - paidAmount);
  const invoiceDate = d.voucherDate
    ? new Date(d.voucherDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const invoice = {
    ...invoiceCompanyFields(),
    companyName: d.companyName || invoiceCompanyFields().companyName,
    website: d.companyWebsite || invoiceCompanyFields().website,
    email: d.companyEmail || invoiceCompanyFields().email,
    phone: d.companyPhone || invoiceCompanyFields().phone,
    taxAddress: d.companyAddress || invoiceCompanyFields().taxAddress,
    billedTo: {
      name: d.partyName || "—",
      address: shippingAddress,
      phone: d.partyPhone || d.phone || "",
    },
    invoiceNo: d.invoiceNo || d.voucherNo || "—",
    reference: d.voucherNo || "",
    orderId: d.voucherNo || "",
    invoiceDate,
    invoiceTotalLabel: fmtInr(totalAmount),
    paymentMode: payment.paymentMode || d.paymentMode || "—",
    paymentStatusBadge: paymentStatus || "Pending",
    lines: products.map((p) => ({
      detail: p.name,
      qty: p.qty,
      rate: p.rate,
      amount: p.subtotal,
    })),
    subtotal: fmtInr(Number(d.basePrice) || 0),
    taxPct: "",
    taxAmount: fmtInr(Number(d.gstAmount) || 0),
    discount: payment.discount || "₹0",
    paidAmount: payment.paid || fmtInr(paidAmount),
    outstanding: payment.due || fmtInr(outstanding),
    finalPayable: payment.finalPayable || fmtInr(totalAmount),
    terms:
      d.termsAndConditions ||
      "Please pay within the agreed credit period.",
  };

  return {
    voucherNo: d.voucherNo || "",
    invoiceNo: d.invoiceNo || "",
    createdAt,
    paymentStatus,
    orderStatus,
    manager,
    client,
    products,
    productsTotal,
    payment,
    dispatch,
    delivery,
    invoice,
    narration: d.narration || d.remarks || "",
  };
}

/**
 * Build `InvoiceModal` payload from the Invoice Generate page editor state.
 */
export function buildInvoiceReviewPayload({
  invoiceNo,
  issueDateLabel,
  client,
  clientAddress = "",
  paymentMode,
  reference,
  orderId = "",
  lines = [],
  subtotalNum = 0,
  taxNum = 0,
  taxPctLabel = "10%",
  discountNum = 0,
  finalPayableNum = 0,
  paymentStatus = "Pending",
  paidAmountNum = 0,
  terms,
}) {
  const total = Number(finalPayableNum) || 0;
  const paid = Math.max(0, Number(paidAmountNum) || 0);
  const outstanding = Math.max(0, total - paid);

  return {
    ...invoiceCompanyFields(),
    billedTo: {
      name: client || "—",
      address: clientAddress || "—",
      phone: "",
    },
    invoiceNo: invoiceNo || "—",
    reference: reference || "—",
    orderId: orderId || reference || "—",
    invoiceDate: issueDateLabel || "—",
    invoiceTotalLabel: fmtRupee(total),
    paymentMode: paymentMode || "—",
    paymentStatusBadge: paymentStatus || "Pending",
    lines: (lines || []).map((l) => ({
      detail: l.name || "—",
      qty: l.qty != null ? String(l.qty) : "—",
      rate: fmtRupee(Number(l.rate) || 0),
      amount: fmtRupee(Number(l.subtotal) || 0),
    })),
    subtotal: fmtRupee(subtotalNum),
    taxPct: taxPctLabel,
    taxAmount: fmtRupee(taxNum),
    discount: fmtRupee(discountNum),
    paidAmount: fmtRupee(paid),
    outstanding: fmtRupee(outstanding),
    finalPayable: fmtRupee(total),
    terms:
      terms ||
      "Please pay within 15 days of receiving this invoice.",
  };
}

/** Map GET /dashboard-ui/orders/:id → PurchaseDetails shape */
export function salesOrderResponseToPurchaseDetail(payload) {
  const order = payload?.order;
  const detail = payload?.detail;
  if (!order) return null;
  if (detail?.invoice) {
    const inv = detail.invoice;
    const products = (inv.lines || []).map((line) => ({
      name: line.detail || "—",
      qty: line.qty || "—",
      rate: line.rate || "—",
      gst: "—",
      subtotal: line.amount || "—",
    }));
    return {
      voucherNo: inv.invoiceNo || order.orderId || "—",
      status: order.paymentStatus || "—",
      purchaseDate: inv.invoiceDate || order.date || "—",
      narration: inv.notes || order.notes || "",
      customer: [],
      party: [
        {
          label: "Client",
          value: order.clientName || inv.billedTo?.name || "—",
        },
      ],
      products:
        products.length > 0
          ? products
          : [{ name: order.products || "—", qty: "—", rate: "—", gst: "—", subtotal: "—" }],
      totals: {
        totalAmount: inv.invoiceTotalLabel || order.totalAmount || "—",
        tax: inv.taxAmount || "—",
        discount: inv.discount || "—",
        paid: inv.paidAmount || order.paid || "—",
        due: inv.outstanding || order.due || "—",
        finalPayable: inv.finalPayable || order.totalAmount || "—",
        reference: inv.reference || "",
      },
    };
  }
  return {
    voucherNo: order.orderId || "—",
    status: order.paymentStatus || "—",
    purchaseDate: order.date || "—",
    narration: order.notes || "",
    customer: [],
    party: [{ label: "Client", value: order.clientName || "—" }],
    products: [
      {
        name: order.products || "—",
        qty: "—",
        rate: "—",
        gst: "—",
        subtotal: order.totalAmount || "—",
      },
    ],
    totals: {
      totalAmount: order.totalAmount || "—",
      tax: "—",
      discount: "—",
      paid: order.paid || "—",
      due: order.due || "—",
      finalPayable: order.totalAmount || "—",
      reference: "",
    },
  };
}
