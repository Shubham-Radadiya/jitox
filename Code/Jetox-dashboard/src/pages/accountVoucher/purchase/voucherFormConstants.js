import dayjs from "dayjs";
import {
  resolvePurchasePaymentStatusDisplay,
  resolvePurchaseReturnRefundStatusDisplay,
} from "../../../utils/purchasePaymentStatus";

export {
  PURCHASE_PAYMENT_STATUS_OPTIONS,
  resolvePurchasePaymentStatusDisplay,
} from "../../../utils/purchasePaymentStatus";

export function parseNum(v) {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Line discount ₹ from qty × rate × Disc %. */
export function calcLineDiscountAmtFromPct(qty, rate, discountPct) {
  const base = parseNum(qty) * parseNum(rate);
  const pct = parseNum(discountPct);
  if (!base || !pct) return "";
  const amt = (base * pct) / 100;
  const rounded = Math.round(amt * 100) / 100;
  return String(rounded);
}

export function fmtInr(n) {
  return `₹${Math.round(Number(n) || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

/** Party column from list rows is the account business name (API). */
export function partyValueFromPartyNameLabel(label) {
  return String(label || "").trim();
}

/** Default quotation invoice prefix (matches purchase invoice series). */
export const QUOTATION_INVOICE_PREFIX = "RH-P-24-25/";

/** Parse `QT-001` style quotation voucher numbers. */
export function parseQtSeriesNo(raw) {
  const s = String(raw ?? "").trim();
  const m = /^QT-(\d+)$/i.exec(s);
  if (!m) return null;
  const digits = String(parseInt(m[1], 10)).padStart(3, "0");
  return { prefix: "QT-", number: digits, full: `QT-${digits}` };
}

/** Parse `RH-P-24-25/001` style quotation invoice numbers. */
export function parseRhQuotationInvoiceNo(raw) {
  const s = String(raw ?? "").trim();
  const prefix = QUOTATION_INVOICE_PREFIX;
  if (!s.startsWith(prefix)) return null;
  const tail = s.slice(prefix.length).trim();
  if (!tail) return null;
  const digits = tail.replace(/\D/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n)) return null;
  const number = String(n).padStart(3, "0");
  return {
    invoicePrefix: prefix,
    invoiceNumber: number,
    invoiceNo: `${prefix}${number}`,
  };
}

/**
 * Invoice fields for quotation form: voucher ref stays `QT-001`, invoice is `RH-P-24-25/001`.
 */
export function quotationInvoiceFieldsFromNo(voucherOrInvoiceNo) {
  const rh = parseRhQuotationInvoiceNo(voucherOrInvoiceNo);
  if (rh) return rh;

  const qt = parseQtSeriesNo(voucherOrInvoiceNo);
  const number = qt ? qt.number : "001";
  const invoicePrefix = QUOTATION_INVOICE_PREFIX;
  const invoiceNo = `${invoicePrefix}${number}`;
  return { invoicePrefix, invoiceNumber: number, invoiceNo };
}

export function nextRevoucherNumber(current) {
  const s = String(current || "V000");
  const digits = s.match(/(\d+)/);
  const n = digits ? parseInt(digits[1], 10) : 0;
  const next = (Number.isFinite(n) ? n : 0) + 1;
  return `V${String(next).padStart(3, "0")}`;
}

/**
 * @param {Record<string, unknown>} row — list row
 * @param {"edit"|"revoucher"} mode
 */
export function buildPurchasePrefill(row, mode) {
  if (!row) return null;
  const party = partyValueFromPartyNameLabel(row["Party Name"] || "");
  const rawDate = row["Date"];
  const purchaseDate =
    rawDate && dayjs(rawDate).isValid()
      ? dayjs(rawDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");
  const voucherBase = row["Voucher No."] || row["Voucher No"] || "V001";
  const voucherNo =
    mode === "revoucher" ? nextRevoucherNumber(voucherBase) : String(voucherBase);
  const raw = row._raw;
  const narrationFromApi =
    raw?.narration ?? raw?.remarks ?? row["Narration"] ?? row["Remarks"];
  const out = {
    partyName: party,
    purchaseDate,
    voucherNo,
  };
  if (narrationFromApi != null && String(narrationFromApi).trim()) {
    out.narration = String(narrationFromApi).trim();
  }
  return out;
}

/**
 * Map full API purchase voucher (e.g. getById with populated items) → PurchaseVoucherForm prefill.
 * @param {Record<string, unknown>} doc
 * @returns {Record<string, unknown> | null}
 */
export function mapPurchaseApiDocToPrefill(doc) {
  if (!doc || typeof doc !== "object") return null;
  const purchaseDate = doc.voucherDate
    ? dayjs(doc.voucherDate).format("YYYY-MM-DD")
    : dayjs().format("YYYY-MM-DD");
  const partyName = String(doc.partyName || "").trim();
  const voucherNo = String(doc.voucherNo || "").trim();

  const items = Array.isArray(doc.items) ? doc.items : [];
  const productRows = items.map((it, idx) => {
    const pop =
      it.product && typeof it.product === "object" && it.product !== null
        ? it.product
        : null;
    const productId = pop?._id
      ? String(pop._id)
      : it.product != null
        ? String(it.product)
        : "";
    const popHsn =
      pop?.hsnCode != null && String(pop.hsnCode).trim()
        ? String(pop.hsnCode)
        : pop?.hsn != null && String(pop.hsn).trim()
          ? String(pop.hsn)
          : "";
    const popUnit =
      pop?.units != null && String(pop.units).trim()
        ? String(pop.units)
        : pop?.unit != null && String(pop.unit).trim()
          ? String(pop.unit)
          : "";
    const fmtPopDate = (d) => {
      if (d == null || d === "") return "";
      if (typeof d === "string") return d;
      try {
        return dayjs(d).format("YYYY-MM-DD");
      } catch {
        return String(d);
      }
    };
    return {
      id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 9)}`,
      product: productId,
      description: String(
        it.description ?? it.remarks ?? pop?.productDescription ?? ""
      ).trim(),
      hsn:
        it.hsn != null && String(it.hsn).trim()
          ? String(it.hsn)
          : popHsn,
      batch:
        it.batch != null && String(it.batch).trim()
          ? String(it.batch)
          : pop?.batchNo != null
            ? String(pop.batchNo)
            : "",
      expDate:
        it.expDate != null && String(it.expDate).trim()
          ? String(it.expDate)
          : fmtPopDate(pop?.expDt),
      mfgDate:
        it.mfgDate != null && String(it.mfgDate).trim()
          ? String(it.mfgDate)
          : fmtPopDate(pop?.mfgDt),
      mrp:
        it.mrp != null && String(it.mrp).trim()
          ? String(it.mrp)
          : pop?.mrpPerUnit != null
            ? String(pop.mrpPerUnit)
            : "",
      group:
        it.group != null && String(it.group).trim()
          ? String(it.group)
          : pop?.group != null
            ? String(pop.group)
            : "",
      unit:
        it.unit != null && String(it.unit).trim()
          ? String(it.unit)
          : popUnit,
      category:
        it.category != null && String(it.category).trim()
          ? String(it.category)
          : pop?.category != null
            ? String(pop.category)
            : "",
      qty: it.quantity != null ? String(it.quantity) : "",
      rate: it.rateParUnit != null ? String(it.rateParUnit) : "",
      discountPct:
        it.discountPct != null && Number(it.discountPct) !== 0
          ? String(it.discountPct)
          : "",
      discountAmt:
        it.discountAmt != null && Number(it.discountAmt) !== 0
          ? String(it.discountAmt)
          : "",
    };
  });

  const termsFromPayment = String(doc.termsOfPayment || "").trim();
  let termsPayment = termsFromPayment;
  if (!termsPayment) {
    const pm = String(doc.paymentMode || "");
    const paymentLower = pm.toLowerCase();
    termsPayment = "credit";
    if (paymentLower === "cash") termsPayment = "cash";
    else if (paymentLower === "online") termsPayment = "online";
    else if (paymentLower === "cheque") termsPayment = "cheque";
    else if (paymentLower === "credit") termsPayment = "credit";
  }

  const isReturnDoc =
    doc.refundStatus != null ||
    doc.refundedAmount != null ||
    doc.refundRequestId != null;
  const paymentStatus = isReturnDoc
    ? resolvePurchaseReturnRefundStatusDisplay(doc)
    : resolvePurchasePaymentStatusDisplay(doc);
  const totalAmount = Number(doc.totalAmount) || 0;
  const paidAmount = isReturnDoc
    ? Number(doc.refundedAmount) || 0
    : Number(doc.paidAmount) || 0;

  let gstRate = "";
  const base = Number(doc.basePrice);
  const gst = Number(doc.gstAmount);
  if (Number.isFinite(base) && base > 0 && Number.isFinite(gst) && gst >= 0) {
    const pct = (gst / base) * 100;
    if (Number.isFinite(pct)) gstRate = String(Math.round(pct * 100) / 100);
  }

  const legacySingle = String(doc.shipToAndBillTo || "").trim();
  const billStored = String(doc.billTo ?? "").trim();
  const shipStored = String(doc.shipTo ?? "").trim();

  let shipDifferent = false;
  if (typeof doc.shipDifferent === "boolean") {
    shipDifferent = doc.shipDifferent;
  } else if (doc.shipDifferent != null && doc.shipDifferent !== "") {
    shipDifferent = String(doc.shipDifferent).toLowerCase() === "true";
  } else if (billStored && shipStored && billStored !== shipStored) {
    shipDifferent = true;
  }

  const billTo = shipDifferent ? billStored : billStored || legacySingle;
  const shipTo =
    shipDifferent && shipStored ? shipStored : billTo;

  const termsFromApi = doc.termsAndConditions;
  const termsText =
    termsFromApi != null && String(termsFromApi).trim() !== ""
      ? String(termsFromApi)
      : "";

  const narrationFromApi = doc.narration;
  const narration =
    narrationFromApi != null && String(narrationFromApi).trim() !== ""
      ? String(narrationFromApi)
      : "";

  const invoicePrefix = String(doc.invoicePrefix ?? "").trim();
  const invoiceNumber = String(doc.invoiceNumber ?? "").trim();
  let invoiceNo =
    doc.invoiceNo != null && String(doc.invoiceNo).trim() !== ""
      ? String(doc.invoiceNo).trim()
      : `${invoicePrefix}${invoiceNumber}`.trim();
  const voucherNoStr = String(doc.voucherNo ?? "").trim();
  const rhInvoice = parseRhQuotationInvoiceNo(invoiceNo);
  let resolvedPrefix = invoicePrefix || QUOTATION_INVOICE_PREFIX;
  let resolvedNumber = invoiceNumber;
  let resolvedInvoiceNo = invoiceNo;

  if (rhInvoice) {
    resolvedPrefix = rhInvoice.invoicePrefix;
    resolvedNumber = rhInvoice.invoiceNumber;
    resolvedInvoiceNo = rhInvoice.invoiceNo;
  } else if (
    parseQtSeriesNo(voucherNoStr) &&
    (!invoiceNo || /-INV/i.test(invoiceNo) || parseQtSeriesNo(invoiceNo))
  ) {
    const inv = quotationInvoiceFieldsFromNo(voucherNoStr);
    resolvedPrefix = inv.invoicePrefix;
    resolvedNumber = inv.invoiceNumber;
    resolvedInvoiceNo = inv.invoiceNo;
  } else if (!resolvedNumber && voucherNoStr) {
    const inv = quotationInvoiceFieldsFromNo(voucherNoStr);
    resolvedPrefix = inv.invoicePrefix;
    resolvedNumber = inv.invoiceNumber;
    if (!resolvedInvoiceNo) resolvedInvoiceNo = inv.invoiceNo;
  }

  return {
    partyName,
    purchaseDate,
    voucherNo,
    invoiceNo: resolvedInvoiceNo,
    invoicePrefix: resolvedPrefix || undefined,
    invoiceNumber:
      resolvedNumber ||
      (resolvedInvoiceNo && !resolvedPrefix ? resolvedInvoiceNo : undefined),
    originalInvNo: String(doc.originalInvNo ?? "").trim() || undefined,
    ewayBill: String(doc.ewayBill ?? "").trim() || undefined,
    transporter: String(doc.transportDetails || "").trim(),
    deliveryAt: String(doc.deliveryAt || "").trim(),
    orderBy: String(doc.orderby || "").trim(),
    billTo,
    shipTo,
    shipToPartyName: String(doc.shipToPartyName ?? "").trim() || undefined,
    shipDifferent,
    narration,
    termsText,
    termsPayment,
    paymentStatus,
    totalAmount,
    paidAmount,
    isPurchaseReturnDoc: isReturnDoc,
    gstRate,
    productRows,
    stockToggle: doc.stockDetails?.stockQuantity !== false,
    sourceSalesId: doc.sourceSalesId
      ? String(doc.sourceSalesId?._id ?? doc.sourceSalesId).trim()
      : undefined,
    sourceQuotationId: doc.sourceQuotationId
      ? String(doc.sourceQuotationId?._id ?? doc.sourceQuotationId).trim()
      : undefined,
  };
}
