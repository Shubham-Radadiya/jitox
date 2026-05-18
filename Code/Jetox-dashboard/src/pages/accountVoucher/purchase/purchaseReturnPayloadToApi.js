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
 * Maps UI gatherPayload → Jitox-api `create-purchase-return-voucher` body.
 *
 * Note: The return schema doesn't model billTo/shipTo/narration/T&C separately,
 * so we collapse the shipping line into `shipToAndBillTo` to keep parity with
 * how the controller stores supplier address. Items match the purchase shape.
 */
export function purchaseReturnPayloadToCreateBody(payload) {
  const gstRate = payload.gstRate;
  const items = (payload.productRows || [])
    .filter((r) => r.product)
    .map((row) => {
      const { taxable } = lineTaxableAndTax(row, gstRate);
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
  /** Returns use the single legacy address field — prefer ship when different else bill. */
  const shipToAndBillTo = sd && shipRaw ? shipRaw : billTo || shipRaw;

  return {
    partyName: String(payload.partyName || "").trim(),
    voucherNo: String(payload.voucherNo || "").trim(),
    voucherDate: payload.purchaseDate,
    transportDetails: String(payload.transporter || "").trim(),
    deliveryAt: String(payload.deliveryAt || "").trim(),
    orderby: String(payload.orderBy || "").trim(),
    shipToAndBillTo,
    items,
    gstAmount,
    totalAmount,
    paymentMode: mapPaymentMode(payload.termsPayment),
    basePrice: lineTaxableTotal,
    stockDetails: {
      /** Returns always reduce product qty on save (matches API model default). */
      stockQuantity: payload.stockToggle !== false,
      generetePurchaseBill: false,
      updateStockAfterOrderPlaced: false,
    },
  };
}
