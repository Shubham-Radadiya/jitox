import {
  purchaseVouchersApi,
  purchaseReturnVouchersApi,
  salesVouchersApi,
  salesReturnVouchersApi,
  journalVouchersApi,
  paymentVouchersApi,
  receiptVouchersApi,
  accountsApi,
  manufacturingVouchersApi,
  quotationsApi,
  cashVouchersApi,
} from "../../services/api";
import {
  buildPaymentReceiptData,
  receiptReceivedByFromParty,
} from "../../utils/paymentReceipt";
import dayjs from "dayjs";
import { buildUploadUrl } from "../../utils/uploadUrl";
import {
  findAccountByBusinessName,
} from "../../utils/accountMappers";
import {
  purchaseDocToDetailShape,
  purchaseReturnDocToDetailShape,
  quotationDocToDetailShape,
  salesDocToOrderDetailShape,
  fmtRupee,
} from "../../utils/voucherRowMappers";

async function loadPartyAccountForVoucher(doc) {
  const partyName = String(doc?.partyName || "").trim();
  if (!partyName) return null;
  try {
    const { data } = await accountsApi.getAll({});
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.accounts)
        ? data.accounts
        : Array.isArray(data?.data)
          ? data.data
          : [];
    return findAccountByBusinessName(list, partyName);
  } catch {
    return null;
  }
}

function isShipDifferentDoc(doc) {
  if (typeof doc?.shipDifferent === "boolean") return doc.shipDifferent;
  if (doc?.shipDifferent != null && doc?.shipDifferent !== "") {
    return String(doc.shipDifferent).toLowerCase() === "true";
  }
  return false;
}

/** Bill-from party + ship-to party accounts for tax invoice / detail views. */
export async function loadPartyAccountsForVoucherDoc(doc) {
  const billPartyAccount = await loadPartyAccountForVoucher(doc);
  let shipPartyAccount = billPartyAccount;
  if (isShipDifferentDoc(doc)) {
    const shipName = String(doc?.shipToPartyName || "").trim();
    if (shipName) {
      const loaded = await loadPartyAccountForVoucher({ partyName: shipName });
      if (loaded) shipPartyAccount = loaded;
    }
  }
  return { billPartyAccount, shipPartyAccount };
}

export async function fetchPurchaseDetail(id) {
  const { data } = await purchaseVouchersApi.getById(id);
  const { billPartyAccount, shipPartyAccount } =
    await loadPartyAccountsForVoucherDoc(data);
  return purchaseDocToDetailShape(data, billPartyAccount, {
    shipPartyAccount,
  });
}

export async function fetchQuotationDetail(id) {
  const res = await quotationsApi.getById(id);
  const doc = res?.data ?? res;
  if (!doc || (typeof doc === "object" && !doc.voucherNo && !doc._id)) {
    return null;
  }
  const { billPartyAccount, shipPartyAccount } =
    await loadPartyAccountsForVoucherDoc(doc);
  return quotationDocToDetailShape(doc, billPartyAccount, {
    shipPartyAccount,
  });
}

export async function fetchPurchaseReturnDetail(id) {
  const { data } = await purchaseReturnVouchersApi.getById(id);
  const { billPartyAccount, shipPartyAccount } =
    await loadPartyAccountsForVoucherDoc(data);
  return purchaseReturnDocToDetailShape(data, billPartyAccount, {
    shipPartyAccount,
  });
}

export async function fetchSalesOrderDetail(id) {
  const { data } = await salesVouchersApi.getById(id);
  return salesDocToOrderDetailShape(data);
}

export async function fetchSalesReturnDetail(id) {
  const { data } = await salesReturnVouchersApi.getById(id);
  const { billPartyAccount, shipPartyAccount } =
    await loadPartyAccountsForVoucherDoc(data);
  const shape = purchaseReturnDocToDetailShape(data, billPartyAccount, {
    shipPartyAccount,
  });
  if (shape) {
    shape.approvalStatus = data?.approvalStatus || "Pending";
    shape.isSalesReturn = true;
  }
  return shape;
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

/** Shape for `ReceiptPaymentView` (printable payment receipt). */
export async function fetchReceiptDetail(id) {
  const vRes = await receiptVouchersApi.getById(id);
  const p = vRes?.data;
  if (!p || !p._id) return null;
  const partyAccount = await loadPartyAccountForVoucher({
    partyName: p.receiptFrom,
  });
  return buildPaymentReceiptData({
    ...p,
    partyAccount,
    receivedBy: receiptReceivedByFromParty(
      partyAccount,
      p.receiptFrom
    ),
  });
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
    paidFromLabel: String(p.paymentFrom || "").trim() || "—",
    modeLabel: String(p.paymentThrough || "").trim() || "—",
    amountLabel: amt != null ? fmtRupee(amt) : "—",
    remarks: String(p.remarks || "").trim() || "—",
    status: p.status || "—",
  };
}

function attachmentDisplayName(storedPath) {
  if (!storedPath) return "";
  const parts = String(storedPath).replace(/\\/g, "/").split("/");
  return decodeURIComponent(parts[parts.length - 1] || "");
}

/** Shape for `CashBankVoucherDetailsDrawer`. */
async function fetchCashBankVoucherDetail(id, kind) {
  const vRes = await cashVouchersApi.getById(id);
  const v = vRes?.data;
  if (!v || !v._id) return null;

  const amt =
    v.amount != null && Number.isFinite(Number(v.amount))
      ? Number(v.amount)
      : null;
  const dateSource = v.voucherDate || v.createdAt;
  const storedPath = v.attachmentsFile;

  return {
    kindLabel: kind === "bank" ? "Bank voucher" : "Cash voucher",
    voucherNo: v.voucherNumber || "—",
    dateLabel: dateSource ? dayjs(dateSource).format("DD MMM YYYY") : "—",
    debitLabel: String(v.debitFrom || "").trim() || "—",
    creditLabel: String(v.creditTo || "").trim() || "—",
    amountLabel: amt != null ? fmtRupee(amt) : "—",
    remarks: String(v.narration || v.particulars || "").trim() || "—",
    attachmentUrl: storedPath ? buildUploadUrl(storedPath) : "",
    attachmentName: attachmentDisplayName(storedPath),
  };
}

export async function fetchCashVoucherDetail(id) {
  return fetchCashBankVoucherDetail(id, "cash");
}

export async function fetchBankVoucherDetail(id) {
  return fetchCashBankVoucherDetail(id, "bank");
}
