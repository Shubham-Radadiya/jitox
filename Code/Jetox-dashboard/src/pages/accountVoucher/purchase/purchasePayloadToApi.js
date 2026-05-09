import { parseNum } from "./voucherFormConstants";

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
      const { taxable, tax } = lineTaxableAndTax(row, gstRate);
      const subtotal = taxable;
      return {
        product: row.product,
        quantity: parseNum(row.qty) || 0,
        rateParUnit: parseNum(row.rate) || 0,
        group: row.group || "",
        category: row.category || "",
        unit: row.unit || "Nos",
        subtotal,
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
  /** Persist full billing + shipping lines; legacy single field follows ship when different else bill. */
  const shipStored = sd ? shipRaw : billTo;

  return {
    partyName: String(payload.partyName || "").trim(),
    voucherNo: String(payload.voucherNo || "").trim(),
    voucherDate: payload.purchaseDate,
    transportDetails: String(payload.transporter || "").trim(),
    deliveryAt: String(payload.deliveryAt || "").trim(),
    orderby: String(payload.orderBy || "").trim(),
    shipToAndBillTo: shipStored,
    billTo,
    shipTo: shipStored,
    shipDifferent: sd,
    narration: String(payload.narration || "").trim(),
    termsAndConditions: String(payload.termsText || "").trim(),
    items,
    gstAmount,
    totalAmount,
    paymentMode: mapPaymentMode(payload.termsPayment),
    basePrice: lineTaxableTotal,
    stockDetails: {
      stockQuantity: Boolean(payload.stockToggle),
      generetePurchaseBill: false,
      updateStockAfterOrderPlaced: false,
    },
  };
}
