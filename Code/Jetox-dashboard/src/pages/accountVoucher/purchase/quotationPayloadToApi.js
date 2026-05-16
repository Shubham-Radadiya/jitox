import { parseNum } from "./voucherFormConstants";
import { purchasePayloadToCreateBody } from "./purchasePayloadToApi";

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
  const items = (purchaseShape.items || []).map((row) => ({
    product: row.product,
    quantity: row.quantity,
    rateParUnit: row.rateParUnit,
    group: row.group || "",
    category: row.category || "",
    unit: row.unit || "Nos",
    subtotal: row.subtotal,
  }));

  const voucherNo = String(payload.voucherNo || purchaseShape.voucherNo || "").trim();
  const invoiceNo = String(payload.invoiceNo || "").trim();

  const body = {
    partyName: purchaseShape.partyName,
    voucherNo,
    voucherDate: payload.purchaseDate || purchaseShape.voucherDate,
    invoiceNo: invoiceNo || (voucherNo ? `${voucherNo}-INV` : ""),
    transportDetails: purchaseShape.transportDetails || "",
    deliveryAt: purchaseShape.deliveryAt || "",
    orderby: purchaseShape.orderby || "",
    shipToAndBillTo: purchaseShape.shipToAndBillTo || "",
    items,
    gstAmount: purchaseShape.gstAmount,
    basePrice: purchaseShape.basePrice,
    totalAmount: purchaseShape.totalAmount,
    paymentMode: mapPaymentMode(payload.termsPayment),
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
