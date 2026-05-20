import priceListLogoUrl from "../assets/jitox-price-list-logo.png";
import { escapeHtml } from "./printAndExport";
import { amountInWordsIndian } from "./amountInWords";
import { getStoredUser } from "./authSession";

export const PAYMENT_RECEIPT_COMPANY = {
  brand: "JETOX",
  tagline: "AGRO INDUSTRIES",
  address:
    "A - 16, Swagat Industrial Park, Dhamatvan Road, Bakrol, Tal. Daskroi, Ahmedabad, Gujarat - 382433.",
  email: "jetoxagroind@gmail.com",
  gstin: "24BBCPV7183D1ZJ",
};

const MINT = "#B7D7C1";
const DARK_GREEN = "#1a5c3a";

export function parseReceiptAmount(amount) {
  const raw = String(amount ?? "").replace(/,/g, "").trim();
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function formatReceiptAmountDisplay(amount) {
  const n = parseReceiptAmount(amount);
  if (n == null) return "—";
  return `${n.toLocaleString("en-IN")}/-`;
}

export function formatReceiptAmountBox(amount) {
  const n = parseReceiptAmount(amount);
  if (n == null) return "—";
  return n.toLocaleString("en-IN");
}

export function getReceiptReceivedByName() {
  const u = getStoredUser();
  if (!u) return "—";
  return (
    String(u.name || "").trim() ||
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
    "—"
  );
}

/** Contact person on Account Master for the party on the receipt (Received By). */
export function receiptReceivedByFromParty(account, partyName = "") {
  const person = String(account?.name || "").trim();
  if (person) return person;
  const business = String(account?.businessName || partyName || "").trim();
  return business || "—";
}

export function formatReceiptDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Normalized receipt payload for UI + print (from API doc or table row).
 */
export function buildPaymentReceiptData(source = {}) {
  const amt = parseReceiptAmount(source.amount);
  const through = String(source.receiptThrough || "Cash").trim() || "Cash";
  const isCash = through.toLowerCase() === "cash";

  return {
    voucherNo: String(source.voucherNo || "—").trim() || "—",
    dateLabel: source.date ? formatReceiptDate(source.date) : "—",
    receivedFrom: String(source.receiptFrom || "").trim() || "—",
    amount: amt,
    amountDisplay: formatReceiptAmountDisplay(source.amount),
    amountBox: formatReceiptAmountBox(source.amount),
    amountWords: amt != null ? amountInWordsIndian(amt) : "—",
    paymentMode: isCash ? "Cash" : through,
    chequeNo: "—",
    remarks: String(source.remarks || "").trim() || "—",
    receivedBy:
      String(source.receivedBy || "").trim() ||
      receiptReceivedByFromParty(
        source.partyAccount,
        source.receiptFrom
      ),
  };
}

function dottedRow(label, value, extraClass = "") {
  return `<div class="row ${extraClass}">
    <span class="lbl">${escapeHtml(label)}</span>
    <span class="val">${escapeHtml(value)}</span>
  </div>`;
}

/**
 * Inner HTML for print / PDF (body only).
 */
export function buildPaymentReceiptBodyHtml(data, logoSrc = priceListLogoUrl) {
  const co = PAYMENT_RECEIPT_COMPANY;
  return `<style>
  .pr-wrap{font-family:Arial,Helvetica,sans-serif;color:#111;max-width:820px;margin:0 auto;padding:12px;}
  .pr-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:10px;}
  .pr-brand{display:flex;align-items:center;gap:12px;min-width:0;}
  .pr-brand img{width:72px;height:72px;object-fit:contain;}
  .pr-jetox{font-size:34px;font-weight:800;color:${DARK_GREEN};letter-spacing:1px;line-height:1;}
  .pr-tag{font-size:14px;font-weight:700;letter-spacing:.5px;margin-top:2px;}
  .pr-co-info{text-align:right;font-size:11px;line-height:1.45;max-width:340px;}
  .pr-title{background:${MINT};text-align:center;font-weight:700;font-size:15px;letter-spacing:.6px;padding:7px 8px;margin:8px 0 0;}
  .pr-box{padding:16px 18px 14px;margin-top:0;}
  .pr-top{display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:14px;}
  .row{display:flex;align-items:baseline;gap:6px;margin:11px 0;font-size:13px;}
  .lbl{font-weight:700;white-space:nowrap;}
  .val{flex:1;border-bottom:1px dotted #333;min-height:18px;padding:0 4px 2px;font-weight:600;}
  .row.split .val{max-width:38%;}
  .row.split .lbl2{font-weight:700;white-space:nowrap;margin-left:12px;}
  .row.split .val2{flex:1;border-bottom:1px dotted #333;min-height:18px;padding:0 4px 2px;font-weight:600;}
  .pr-foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:22px;gap:12px;}
  .pr-amt{display:flex;align-items:stretch;}
  .pr-amt-sym{background:${MINT};border:1px solid #8fb89a;border-right:none;border-radius:6px 0 0 6px;width:38px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;}
  .pr-amt-num{background:${MINT};border:1px solid #8fb89a;border-radius:0 6px 6px 0;min-width:120px;padding:8px 16px;font-size:22px;font-weight:700;text-align:center;}
  .pr-sign{text-align:center;font-size:12px;min-width:140px;}
  .pr-sign .line{border-bottom:1px dotted #333;min-height:20px;margin-bottom:4px;}
  .pr-sign .cap{color:#444;}
  </style>
  <div class="pr-wrap">
  <div class="pr-head">
    <div class="pr-brand">
      <img src="${escapeHtml(logoSrc)}" alt="JETOX" />
      <div>
        <div class="pr-jetox">${escapeHtml(co.brand)}</div>
        <div class="pr-tag">${escapeHtml(co.tagline)}</div>
      </div>
    </div>
    <div class="pr-co-info">
      <div>${escapeHtml(co.address)}</div>
      <div>${escapeHtml(co.email)}</div>
      <div><strong>GSTIN :</strong> ${escapeHtml(co.gstin)}</div>
    </div>
  </div>
  <div class="pr-title">PAYMENT RECEIPT</div>
  <div class="pr-box">
    <div class="pr-top">
      <span><strong>No. :</strong> ${escapeHtml(data.voucherNo)}</span>
      <span><strong>Date :</strong> ${escapeHtml(data.dateLabel)}</span>
    </div>
    ${dottedRow("Received With Thanks From", data.receivedFrom)}
    ${dottedRow("Amount", data.amountDisplay)}
    ${dottedRow("In Word", data.amountWords)}
    <div class="row split">
      <span class="lbl">By</span>
      <span class="val">${escapeHtml(data.paymentMode)}</span>
      <span class="lbl2">NEFT / Cheque No.</span>
      <span class="val2">${escapeHtml(data.chequeNo)}</span>
    </div>
    ${dottedRow("Remarks", data.remarks)}
    <div class="pr-foot">
      <div class="pr-amt">
        <div class="pr-amt-sym">₹</div>
        <div class="pr-amt-num">${escapeHtml(data.amountBox)}</div>
      </div>
      <div class="pr-sign">
        <div class="line">${escapeHtml(data.receivedBy)}</div>
        <div class="cap">Received By</div>
      </div>
      <div class="pr-sign">
        <div class="line"></div>
        <div class="cap">Authorised Signature</div>
      </div>
    </div>
  </div>
  </div>`;
}
