import {
  hasOrderListDecisionMade,
  isQuotationOnOrderList,
} from "../../../constants/orderStatus";
import {
  QUOTATION_INVOICE_PREFIX,
  quotationInvoiceFieldsFromNo,
} from "./voucherFormConstants";
import {
  composeInvoiceNo,
  purchasePayloadToCreateBody,
} from "./purchasePayloadToApi";

function mapPaymentMode(termsPayment) {
  const s = String(termsPayment || "")
    .trim()
    .toLowerCase();
  if (s === "cash") return "Cash";
  if (s === "online") return "Online";
  if (s === "cheque") return "Cheque";
  if (s === "credit") return "Credit";
  if (s.includes("online")) return "Online";
  if (s.includes("cash")) return "Cash";
  if (s.includes("cheque")) return "Cheque";
  return "Credit";
}

/**
 * Maps UI gatherPayload → Jitox-api `POST /quotations/create-quotation` body.
 * Reuses purchase line/tax math; strips purchase-only fields the quotation model lacks.
 */
export function quotationPayloadToCreateBody(payload) {
  const purchaseShape = purchasePayloadToCreateBody(payload);
  const uiRows = (payload.productRows || []).filter((r) => r.product);
  const items = (purchaseShape.items || []).map((row, idx) => ({
    product: row.product,
    quantity: row.quantity,
    rateParUnit: row.rateParUnit,
    group: row.group || "",
    category: row.category || "",
    unit: row.unit || "Nos",
    subtotal: row.subtotal,
    discountPct: row.discountPct ?? 0,
    discountAmt: row.discountAmt ?? 0,
    description: String(uiRows[idx]?.description ?? "").trim(),
    hsn: String(row.hsn ?? "").trim(),
    batch: String(row.batch ?? "").trim(),
    expDate: String(row.expDate ?? "").trim(),
    mfgDate: String(row.mfgDate ?? "").trim(),
    mrp: String(row.mrp ?? "").trim(),
  }));

  const voucherNo = String(payload.voucherNo || purchaseShape.voucherNo || "").trim();
  const defaultInv = quotationInvoiceFieldsFromNo(voucherNo);
  let invoicePrefix =
    String(payload.invoicePrefix ?? "").trim() || QUOTATION_INVOICE_PREFIX;
  let invoiceNumber = String(payload.invoiceNumber ?? "").trim();
  if (!invoiceNumber) {
    invoiceNumber = defaultInv.invoiceNumber;
  } else {
    const n = parseInt(String(invoiceNumber).replace(/\D/g, ""), 10);
    if (Number.isFinite(n)) invoiceNumber = String(n).padStart(3, "0");
  }
  const invoiceNo =
    composeInvoiceNo({ ...payload, invoicePrefix, invoiceNumber }) ||
    `${invoicePrefix}${invoiceNumber}`.trim() ||
    defaultInv.invoiceNo;

  const body = {
    partyName: purchaseShape.partyName,
    voucherNo,
    voucherDate: payload.purchaseDate || purchaseShape.voucherDate,
    invoiceNo,
    transportDetails: purchaseShape.transportDetails || "",
    deliveryAt: purchaseShape.deliveryAt || "",
    orderby: purchaseShape.orderby || "",
    shipToAndBillTo: purchaseShape.shipToAndBillTo || "",
    billTo: purchaseShape.billTo || "",
    shipTo: purchaseShape.shipTo || "",
    shipToPartyName: purchaseShape.shipToPartyName || "",
    shipDifferent: Boolean(purchaseShape.shipDifferent),
    items,
    termsOfPayment: purchaseShape.termsOfPayment || "",
    narration: purchaseShape.narration || "",
    termsAndConditions: purchaseShape.termsAndConditions || "",
    gstAmount: purchaseShape.gstAmount,
    basePrice: purchaseShape.basePrice,
    totalAmount: purchaseShape.totalAmount,
    paymentMode: purchaseShape.paymentMode || mapPaymentMode(payload.termsPayment),
    stockDetails: {
      stockQuantity: Boolean(payload.stockToggle),
      generetePurchaseBill: false,
      updateStockAfterOrderPlaced: false,
    },
  };

  if (body.paymentMode === "Credit" && body.voucherDate) {
    const d = new Date(body.voucherDate);
    if (!Number.isNaN(d.getTime())) {
      body.dueDate = new Date(d.getTime() + 15 * 86400000);
    }
  }

  return body;
}

/** Preserve order-list flag when saving quotation edits (form does not send this field). */
export function quotationPayloadToUpdateBody(payload, existingDoc) {
  const body = quotationPayloadToCreateBody(payload);
  if (!existingDoc || typeof existingDoc !== "object") return body;
  if (hasOrderListDecisionMade(existingDoc)) {
    body.orderListDecisionMade = true;
    if (isQuotationOnOrderList(existingDoc)) {
      body.addedToOrder = true;
      const st = String(existingDoc.dashboardOrderStatus || "").trim();
      body.dashboardOrderStatus =
        st && st !== "Quotation" ? st : "Pending";
      body.dashboardTab = existingDoc.dashboardTab || "pending";
    } else {
      body.addedToOrder = false;
      body.dashboardOrderStatus = "Pending";
      body.dashboardTab = "pending";
    }
  }
  return body;
}
