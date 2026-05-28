import { parseNum } from "./voucherFormConstants";

/** Invoice layout uses prefix + number; legacy forms may only send `invoiceNo`. */
export function composeInvoiceNo(payload) {
  const prefix = String(payload?.invoicePrefix ?? "").trim();
  const number = String(payload?.invoiceNumber ?? "").trim();
  if (prefix || number) return `${prefix}${number}`.trim();
  return String(payload?.invoiceNo ?? "").trim();
}

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

function lineTaxableAndTax(row, gstRatePct) {
  const q = parseNum(row.qty);
  const r = parseNum(row.rate);
  const base = q * r;
  const dAmt = parseNum(row.discountAmt);
  const dPct = parseNum(row.discountPct);
  const disc = dAmt > 0 ? dAmt : base * (dPct / 100);
  const taxable = Math.max(0, base - disc);
  const gstPct = parseNum(gstRatePct);
  const tax = gstPct ? (taxable * gstPct) / 100 : 0;
  return { taxable, tax };
}

/**
 * Maps UI gatherPayload → Jitox-api `create-purchase-voucher` body.
 */
export function purchasePayloadToCreateBody(payload) {
  const gstRate = payload.gstRate;
  const items = (payload.productRows || [])
    .filter((r) => r.product)
    .map((row) => {
      const { taxable } = lineTaxableAndTax(row, gstRate);
      const subtotal = taxable;
      const discountPct = parseNum(row.discountPct);
      const discountAmt = parseNum(row.discountAmt);
      return {
        product: row.product,
        quantity: parseNum(row.qty) || 0,
        rateParUnit: parseNum(row.rate) || 0,
        group: row.group || "",
        category: row.category || "",
        unit: row.unit || "Nos",
        subtotal,
        discountPct,
        discountAmt,
        hsn: String(row.hsn ?? "").trim(),
        batch: String(row.batch ?? "").trim(),
        expDate: String(row.expDate ?? "").trim(),
        mfgDate: String(row.mfgDate ?? "").trim(),
        mrp: String(row.mrp ?? "").trim(),
      };
    });

  const lineTax = (payload.productRows || [])
    .filter((r) => r.product)
    .reduce((s, row) => s + lineTaxableAndTax(row, gstRate).tax, 0);
  const lineTaxableTotal = (payload.productRows || [])
    .filter((r) => r.product)
    .reduce((s, row) => s + lineTaxableAndTax(row, gstRate).taxable, 0);

  const gstAmount =
    payload.lineTotals?.tax != null
      ? Math.round(Number(payload.lineTotals.tax) || 0)
      : Math.round(lineTax);
  const totalAmount =
    lineTaxableTotal + (Number.isFinite(gstAmount) ? gstAmount : 0);

  const billTo = String(payload.billTo ?? "").trim();
  const shipRaw = String(payload.shipTo ?? "").trim();
  const sd =
    typeof payload.shipDifferent === "boolean"
      ? payload.shipDifferent
      : String(payload.shipDifferent || "").toLowerCase() === "true";
  /** Legacy combined field: bill address only when ship-to party is same as bill-from. */
  const shipLine = sd ? shipRaw : billTo;

  const paymentStatusRaw = String(payload.paymentStatus || "Pending").trim();
  const normalizedStatus = ["Pending", "Partial", "Paid", "Unpaid"].includes(
    paymentStatusRaw
  )
    ? paymentStatusRaw
    : "Pending";
  const paidFromPayload = Number(payload.paidAmount);
  let paidAmount = 0;
  if (normalizedStatus === "Paid") paidAmount = totalAmount;
  else if (normalizedStatus === "Partial" && Number.isFinite(paidFromPayload)) {
    paidAmount = Math.min(totalAmount, Math.max(0, paidFromPayload));
  }

  const invoicePrefix = String(payload.invoicePrefix ?? "").trim();
  const invoiceNumber = String(payload.invoiceNumber ?? "").trim();
  const invoiceNo = composeInvoiceNo(payload);
  const termsPaymentRaw = String(payload.termsPayment ?? "").trim();

  return {
    partyName: String(payload.partyName || "").trim(),
    invoiceNo,
    invoicePrefix,
    invoiceNumber,
    originalInvNo: String(payload.originalInvNo ?? "").trim(),
    ewayBill: String(payload.ewayBill ?? "").trim(),
    termsOfPayment: termsPaymentRaw,
    voucherNo: String(payload.voucherNo || "").trim(),
    voucherDate: payload.purchaseDate,
    transportDetails: String(payload.transporter || "").trim(),
    deliveryAt: String(payload.deliveryAt || "").trim(),
    orderby: String(payload.orderBy || "").trim(),
    shipToAndBillTo: sd ? "" : billTo,
    billTo,
    shipTo: shipLine,
    shipToPartyName: sd
      ? String(payload.shipToPartyName || "").trim()
      : String(payload.partyName || "").trim(),
    shipDifferent: sd,
    narration: String(payload.narration || "").trim(),
    termsAndConditions: String(payload.termsText || "").trim(),
    items,
    gstAmount,
    totalAmount,
    paymentMode: mapPaymentMode(termsPaymentRaw),
    paymentStatus: normalizedStatus,
    paidAmount,
    basePrice: lineTaxableTotal,
    stockDetails: {
      stockQuantity: payload.stockToggle !== false,
      generetePurchaseBill: false,
      updateStockAfterOrderPlaced: false,
    },
  };
}
