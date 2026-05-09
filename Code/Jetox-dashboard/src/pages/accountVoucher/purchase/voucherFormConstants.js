import dayjs from "dayjs";

export function parseNum(v) {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
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
    return {
      id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 9)}`,
      product: productId,
      description: "",
      hsn: it.hsn != null ? String(it.hsn) : "",
      batch: it.batch != null ? String(it.batch) : "",
      expDate: it.expDate != null ? String(it.expDate) : "",
      mfgDate: it.mfgDate != null ? String(it.mfgDate) : "",
      mrp: it.mrp != null ? String(it.mrp) : "",
      group:
        it.group != null && String(it.group).trim()
          ? String(it.group)
          : pop?.group != null
            ? String(pop.group)
            : "",
      unit: it.unit != null ? String(it.unit) : "",
      category:
        it.category != null && String(it.category).trim()
          ? String(it.category)
          : pop?.category != null
            ? String(pop.category)
            : "",
      qty: it.quantity != null ? String(it.quantity) : "",
      rate: it.rateParUnit != null ? String(it.rateParUnit) : "",
      discountPct: "",
      discountAmt: "",
    };
  });

  const pm = String(doc.paymentMode || "");
  const paymentLower = pm.toLowerCase();
  let termsPayment = "credit";
  if (paymentLower === "cash") termsPayment = "cash";
  else if (paymentLower === "online") termsPayment = "online";
  else if (paymentLower === "cheque") termsPayment = "cheque";
  else if (paymentLower === "credit") termsPayment = "credit";

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
  const billTo = billStored || legacySingle;
  const shipTo = shipStored || legacySingle;
  let shipDifferent = false;
  if (typeof doc.shipDifferent === "boolean") {
    shipDifferent = doc.shipDifferent;
  } else if (billStored && shipStored && billStored !== shipStored) {
    shipDifferent = true;
  }

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

  return {
    partyName,
    purchaseDate,
    voucherNo,
    transporter: String(doc.transportDetails || "").trim(),
    deliveryAt: String(doc.deliveryAt || "").trim(),
    orderBy: String(doc.orderby || "").trim(),
    billTo,
    shipTo,
    shipDifferent,
    narration,
    termsText,
    termsPayment,
    gstRate,
    productRows,
    stockToggle: Boolean(doc.stockDetails?.stockQuantity),
  };
}
