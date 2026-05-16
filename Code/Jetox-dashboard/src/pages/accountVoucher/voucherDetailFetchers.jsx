import {
  purchaseVouchersApi,
  purchaseReturnVouchersApi,
  salesVouchersApi,
  journalVouchersApi,
  paymentVouchersApi,
  accountsApi,
  manufacturingVouchersApi,
} from "../../services/api";
import dayjs from "dayjs";
import {
  purchaseDocToDetailShape,
  salesDocToOrderDetailShape,
  fmtRupee,
} from "../../utils/voucherRowMappers";

export async function fetchPurchaseDetail(id) {
  const { data } = await purchaseVouchersApi.getById(id);
  return purchaseDocToDetailShape(data);
}

export async function fetchPurchaseReturnDetail(id) {
  const { data } = await purchaseReturnVouchersApi.getById(id);
  return purchaseDocToDetailShape(data);
}

export async function fetchSalesOrderDetail(id) {
  const { data } = await salesVouchersApi.getById(id);
  return salesDocToOrderDetailShape(data);
}

function labelAccountForJournal(a) {
  if (!a) return "—";
  const party = String(a.businessName || "").trim();
  const person = String(a.name || "").trim();
  const typ = String(a.accountType || a.category || "").trim();
  const base = party || person || "Account";
  return typ ? `${base} (${typ})` : base;
}

const MFG_COST_ACCOUNT_LABELS = {
  labor: "Labor Charges",
  power: "Power & Electricity",
  packaging: "Packaging",
  transport: "Transport",
};

function mfgLineProductName(line) {
  const pop =
    line?.product && typeof line.product === "object" ? line.product : null;
  return String(pop?.productName ?? "—");
}

function mfgFmtDate(d) {
  if (!d) return "—";
  return dayjs(d).format("DD MMM YYYY");
}

function mfgFmtDateTime(d) {
  if (!d) return "—";
  return dayjs(d).format("DD MMM YYYY, h:mm A");
}

/** Shape for `ManufacturingDetailsDrawer` — loads full batch from API. */
export async function fetchManufacturingDetail(id) {
  const { data } = await manufacturingVouchersApi.getById(id);
  const doc = data?.data ?? data;
  if (!doc?._id) return null;

  const finished =
    doc.finishedProduct && typeof doc.finishedProduct === "object"
      ? doc.finishedProduct
      : null;
  const qty = Number(doc.quantityToProduce);
  const unit = String(doc.produceUnit || "").trim();
  const qtyLine =
    Number.isFinite(qty) && qty > 0
      ? unit
        ? `${qty} ${unit}`
        : String(qty)
      : "—";

  const rawMaterials = Array.isArray(doc.rawMaterials) ? doc.rawMaterials : [];
  const rawMaterialLines = rawMaterials.map((line) => {
    const name = mfgLineProductName(line);
    const req = Number(line.requiredQty) || 0;
    const rate = Number(line.ratePerUnit) || 0;
    const u = String(line.unit || "").trim();
    const sub = Number(line.subtotal);
    const requiredDisplay = u ? `${req} ${u}` : String(req);
    return {
      productName: name,
      requiredDisplay,
      rateDisplay: fmtRupee(rate),
      subtotalDisplay: fmtRupee(sub),
    };
  });

  const additionalCosts = Array.isArray(doc.additionalCosts)
    ? doc.additionalCosts
    : [];
  const costLines = additionalCosts.map((c) => {
    const key = String(c.account || "").trim();
    const label = MFG_COST_ACCOUNT_LABELS[key] || key || "Additional";
    return { label, amount: fmtRupee(c.amount) };
  });

  return {
    batchCode: String(doc.batchCode || "—"),
    voucherNo: String(doc.voucherNo || "—"),
    status: String(doc.status || "—"),
    mfgDateLabel: mfgFmtDate(doc.mfgDate),
    expDateLabel: mfgFmtDate(doc.expDate),
    startedAtLabel: mfgFmtDateTime(doc.startedAt),
    completedAtLabel: mfgFmtDateTime(doc.completedAt),
    failedAtLabel: mfgFmtDateTime(doc.failedAt),
    finishedProductName: String(finished?.productName ?? "—"),
    qtyLine,
    rawMaterialLines,
    costLines,
    rawMaterialSubtotal: fmtRupee(doc.rawMaterialTotal),
    additionalSubtotal: fmtRupee(doc.additionalTotal),
    grandTotalLabel: fmtRupee(doc.grandTotal),
    costPerUnitLabel: fmtRupee(doc.landingCostPerUnit),
    remarks: String(doc.remarks || "").trim() || "—",
    failureReason: doc.failureReason ? String(doc.failureReason) : "",
    failureRemarks: doc.failureRemarks ? String(doc.failureRemarks) : "",
    supervisorName: doc.supervisorName ? String(doc.supervisorName) : "",
  };
}

/** Shape for `JournalDetailsDrawer` — resolves account names from Account master. */
export async function fetchJournalDetail(id) {
  const vRes = await journalVouchersApi.getById(id);
  const j = vRes?.data;
  if (!j || !j._id) return null;

  const accRes = await accountsApi.getAll({});
  const list = Array.isArray(accRes?.data) ? accRes.data : [];
  const byId = new Map(list.map((a) => [String(a._id), a]));

  const debitId = String(j.paymentBy?._id ?? j.paymentBy ?? "");
  const creditId = String(j.paymentTo?._id ?? j.paymentTo ?? "");

  const debitAcc = byId.get(debitId);
  const creditAcc = byId.get(creditId);

  const amt =
    j.debitAmount != null && Number.isFinite(Number(j.debitAmount))
      ? Number(j.debitAmount)
      : null;

  return {
    voucherNo: j.voucherNo || "—",
    dateLabel: j.date ? dayjs(j.date).format("DD MMM YYYY") : "—",
    debitLabel: debitAcc ? labelAccountForJournal(debitAcc) : debitId || "—",
    creditLabel: creditAcc ? labelAccountForJournal(creditAcc) : creditId || "—",
    amountLabel:
      amt != null
        ? `₹${amt.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
        : "—",
    remarks: String(j.remarks || "").trim() || "—",
    status: j.status || "—",
  };
}

/** Shape for `PaymentDetailsDrawer`. */
export async function fetchPaymentDetail(id) {
  const vRes = await paymentVouchersApi.getById(id);
  const p = vRes?.data;
  if (!p || !p._id) return null;

  const rawAmt = String(p.amount ?? "").replace(/,/g, "");
  const amt = rawAmt !== "" && Number.isFinite(Number(rawAmt)) ? Number(rawAmt) : null;

  return {
    voucherNo: p.voucherNo || "—",
    dateLabel: p.date ? dayjs(p.date).format("DD MMM YYYY") : "—",
    partyLabel: String(p.paymentTo || "").trim() || "—",
    modeLabel: String(p.paymentThrough || "").trim() || "—",
    amountLabel: amt != null ? fmtRupee(amt) : "—",
    remarks: String(p.remarks || "").trim() || "—",
    status: p.status || "—",
  };
}
