import dayjs from "dayjs";
import priceListLogoUrl from "../assets/jitox-price-list-logo.png";
import { escapeHtml } from "./printAndExport";
import { PAYMENT_RECEIPT_COMPANY } from "./paymentReceipt";
import { amountInWordsIndian } from "./amountInWords";
import {
  purchaseLineDiscount,
  sumPurchaseLineDiscounts,
} from "./voucherRowMappers";

/** Invoice HTML width for html2canvas PDF capture */
export const PURCHASE_TAX_INVOICE_PAGE_W_PX = 700;
const PAGE_W_PX = PURCHASE_TAX_INVOICE_PAGE_W_PX;

const PURCHASE_INVOICE_BANK = {
  bankName: "HDFC Bank",
  accountNo: "0123456789",
  branchIfsc: "SARKHEJ & BKID00123",
};

const COMPANY = {
  ...PAYMENT_RECEIPT_COMPANY,
  legalName: "JETOX AGRO INDUSTRIES",
  addressLines: [
    "A - 16, Swagat Industrial Park, Dhamatvan Road, Bakrol Bujarang,",
    "Tal. Daskroi, Ahemdabad, Gujarat - 382433.",
  ],
};

/** Signature block: "For," line — left-aligned, two lines for default company name */
function forCompanySignHtml(legalName) {
  const n = String(legalName || "").trim();
  if (n.toUpperCase() === "JETOX AGRO INDUSTRIES") {
    return "For, JETOX AGRO<br>INDUSTRIES";
  }
  return `For, ${escapeHtml(n)}`;
}

function fmtMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0.00";
  return x.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function round2(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

function fmtCgstRate(pct) {
  const r = round2(pct);
  if (!r) return "";
  return Number.isInteger(r) ? `${r}%` : `${r}%`;
}

function fmtDate(d) {
  if (!d) return "";
  const parsed = dayjs(d);
  return parsed.isValid() ? parsed.format("DD-MM-YYYY") : "";
}

function invoiceNoFromDoc(doc) {
  const prefix = String(doc?.invoicePrefix ?? "").trim();
  const num = String(doc?.invoiceNumber ?? "").trim();
  const combined = `${prefix}${num}`.trim();
  return combined || String(doc?.invoiceNo ?? "").trim() || "";
}

function billToColumnData(doc, partyAccount) {
  const name = String(doc?.partyName || "").trim() || "—";
  const addressLines = [];
  const addr =
    String(partyAccount?.addressSummary || "").trim() ||
    String(partyAccount?.address || "").trim();
  if (addr) {
    addr.split(/\n+/).forEach((l) => {
      const t = l.trim();
      if (t) addressLines.push(t);
    });
  }
  return {
    name,
    addressLines,
    gstin: String(partyAccount?.gstNumber || "").trim(),
    state: String(partyAccount?.state || "").trim(),
  };
}

function shipColumnDataFromText(text, fallbackGst = "", fallbackState = "") {
  const lines = String(text || "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) {
    return { name: "—", addressLines: [], gstin: fallbackGst, state: fallbackState };
  }
  let gstin = fallbackGst;
  let state = fallbackState;
  const body = [];
  for (const l of lines) {
    if (/^GSTIN\s*:/i.test(l)) {
      gstin = l.replace(/^GSTIN\s*:\s*/i, "").trim();
      continue;
    }
    if (/^State\s*&\s*Code\s*:/i.test(l)) {
      state = l.replace(/^State\s*&\s*Code\s*:/i, "").trim();
      continue;
    }
    body.push(l);
  }
  const name = body.shift() || "—";
  return { name, addressLines: body, gstin, state };
}

function renderPartyColumn(title, data) {
  const addrHtml = data.addressLines
    .map((l) => `<div class="ti-meta-p">${escapeHtml(l)}</div>`)
    .join("");
  return `<div class="ti-meta-col ti-meta-party">
    <div class="ti-meta-h">${escapeHtml(title)}</div>
    <div class="ti-meta-body">
      <div class="ti-meta-name">${escapeHtml(data.name)}</div>
      ${addrHtml}
    </div>
    <div class="ti-meta-foot">
      <div class="ti-meta-p">GSTIN : ${escapeHtml(data.gstin || "")}</div>
      <div class="ti-meta-p">State &amp; Code : ${escapeHtml(data.state || "")}</div>
    </div>
  </div>`;
}

function buildLineDescription(it) {
  const p = it.product;
  const base =
    p && typeof p === "object" && p.productName
      ? String(p.productName)
      : String(p || "Item");
  const parts = [base];
  const batch = String(it.batch || "").trim();
  const exp = String(it.expDate || "").trim();
  const mfg = String(it.mfgDate || "").trim();
  if (batch) parts.push(`Batch No. ${batch}`);
  if (mfg) parts.push(`Mfg. Date. ${mfg}`);
  if (exp) parts.push(`Exp. Date. ${exp}`);
  return parts.join(", ");
}

function lineTaxableAmount(it) {
  return Number(it.subtotal) || 0;
}

function buildHsnRows(items, gstAmountNum, taxableTotal) {
  const map = new Map();
  for (const it of items) {
    const hsn = String(it.hsn || "").trim() || "—";
    const taxable = lineTaxableAmount(it);
    let lineTax = Number(it._lineTax);
    if (!Number.isFinite(lineTax) || lineTax < 0) {
      lineTax =
        taxableTotal > 0 && gstAmountNum > 0
          ? (taxable / taxableTotal) * gstAmountNum
          : 0;
    }
    const prev = map.get(hsn) || { taxable: 0, tax: 0 };
    prev.taxable += taxable;
    prev.tax += lineTax;
    map.set(hsn, prev);
  }

  const entries = [...map.entries()];
  const rows = [];
  let totalTaxable = 0;
  let allocatedCgst = 0;
  let allocatedSgst = 0;
  const targetHalf = round2(gstAmountNum / 2);

  entries.forEach(([hsn, agg], idx) => {
    const isLast = idx === entries.length - 1;
    let cgstAmt = round2(agg.tax / 2);
    let sgstAmt = round2(agg.tax / 2);
    if (isLast && entries.length > 0) {
      cgstAmt = round2(targetHalf - allocatedCgst);
      sgstAmt = round2(targetHalf - allocatedSgst);
    }
    allocatedCgst += cgstAmt;
    allocatedSgst += sgstAmt;
    totalTaxable += agg.taxable;
    const rateHalf =
      agg.taxable > 0 && agg.tax > 0 ? round2((agg.tax / 2 / agg.taxable) * 100) : 0;
    rows.push({
      hsn,
      taxable: agg.taxable,
      rate: rateHalf,
      cgstAmt,
      sgstAmt,
      totalTax: round2(agg.tax),
    });
  });

  return {
    rows,
    totalTaxable,
    totalCgst: round2(gstAmountNum / 2),
    totalSgst: round2(gstAmountNum / 2),
  };
}

/** Label : value row — flex, no nested table */
function metaRow(label, value) {
  return `<div class="ti-kv">
    <span class="ti-kv-l">${escapeHtml(label)}</span>
    <span class="ti-kv-c">:</span>
    <span class="ti-kv-v">${escapeHtml(value || "")}</span>
  </div>`;
}

function bankRow(label, value) {
  return `<div class="ti-bank-kv">
    <span class="ti-bk-l">${escapeHtml(label)}</span>
    <span class="ti-bk-c">:</span>
    <span class="ti-bk-v">${escapeHtml(value || "")}</span>
  </div>`;
}

function cell(content, align = "left", extraClass = "") {
  const a =
    align === "right" ? "ti-ar" : align === "center" ? "ti-ac" : "ti-al";
  const x = extraClass ? ` ${extraClass}` : "";
  return `<div class="ti-cell ${a}${x}">${content}</div>`;
}

/** Column widths tuned for 700px page (~680px inner): Sr | Description | HSN | Packs | Qty | Rate | Unit | Amount */
const LINE_GRID_COLS =
  "52px 1fr 76px 64px 64px 50px 48px 82px";

/** HSN summary (~680px inner): HSN ~38% | Taxable ~15% | CGST/SGST rate+amt | Total tax ~15% */
const HSN_GRID_COLS =
  "250px 100px 40px 72px 40px 72px 106px";

function buildHsnHeaderHtml() {
  return `<div class="ti-hsn-head-wrap" style="grid-template-columns:${HSN_GRID_COLS}">
    ${cell("HSN", "center", "ti-hsn-r2")}
    ${cell("Taxable Value", "center", "ti-hsn-r2")}
    ${cell("CGST", "center", "ti-hsn-c2")}
    ${cell("SGST", "center", "ti-hsn-c2")}
    ${cell("Total Tax Amount", "center", "ti-hsn-r2")}
    ${cell("Rate", "center")}
    ${cell("Amount", "center")}
    ${cell("Rate", "center")}
    ${cell("Amount", "center")}
  </div>`;
}

/**
 * Full A4 tax-invoice HTML (body inner — use buildPurchaseTaxInvoiceFullDocument for PDF).
 * Layout uses CSS Grid / Flex (no HTML tables) for reliable html2canvas alignment.
 */
export function buildPurchaseTaxInvoiceBodyHtml(doc, partyAccount = null) {
  if (!doc) return "";

  const items = Array.isArray(doc.items) ? doc.items : [];
  const basePrice = Number(doc.basePrice) || 0;
  const gstAmount = Number(doc.gstAmount) || 0;
  const totalAmount = Number(doc.totalAmount) || 0;
  const discountTotal = sumPurchaseLineDiscounts(items);
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const roundOff = totalAmount - (basePrice + gstAmount);
  const roundOffRounded = Math.round(roundOff * 100) / 100;

  const billToData = billToColumnData(doc, partyAccount);
  const shipToText =
    String(doc.shipTo || "").trim() ||
    String(doc.billTo || "").trim() ||
    String(doc.shipToAndBillTo || "").trim() ||
    [billToData.name, ...billToData.addressLines].filter((x) => x && x !== "—").join("\n");
  const shipToData = shipColumnDataFromText(
    shipToText,
    billToData.gstin,
    billToData.state
  );

  const paymentTerms =
    String(doc.termsOfPayment || "").trim() ||
    String(doc.paymentMode || "").trim() ||
    "";

  const docGstRatePct =
    basePrice > 0 && gstAmount > 0 ? (gstAmount / basePrice) * 100 : 0;
  const itemsForHsn = items.map((it) => {
    const lineTax = Number(it._lineTax);
    if (Number.isFinite(lineTax) && lineTax >= 0) return it;
    const taxable = lineTaxableAmount(it);
    return {
      ...it,
      _lineTax: docGstRatePct ? (taxable * docGstRatePct) / 100 : 0,
    };
  });
  const { rows: hsnRows, totalTaxable } = buildHsnRows(
    itemsForHsn,
    gstAmount,
    basePrice
  );

  const lineHead = `<div class="ti-row ti-row-head" style="grid-template-columns:${LINE_GRID_COLS}">
    ${cell("Sr&nbsp;No.", "center", "ti-srno")}
    ${cell("Description of goods", "left")}
    ${cell("HSN", "center")}
    ${cell("Packs", "center")}
    ${cell("Qty.", "center")}
    ${cell("Rate", "center")}
    ${cell("Unit", "center")}
    ${cell("Amount", "right")}
  </div>`;

  const lineRowsHtml = items
    .map((it, idx) => {
      const qty = Number(it.quantity) || 0;
      const rate = Number(it.rateParUnit) || 0;
      const amount = lineTaxableAmount(it);
      const unit = String(it.unit || "Nos").trim() || "Nos";
      const packs = String(it.batch || it.group || "").trim() || "";
      return `<div class="ti-row" style="grid-template-columns:${LINE_GRID_COLS}">
        ${cell(String(idx + 1), "center")}
        ${cell(escapeHtml(buildLineDescription(it)), "left", "ti-desc")}
        ${cell(escapeHtml(String(it.hsn || "")), "center")}
        ${cell(escapeHtml(packs), "center")}
        ${cell(escapeHtml(String(qty)), "center")}
        ${cell(fmtMoney(rate), "center")}
        ${cell(escapeHtml(unit), "center")}
        ${cell(fmtMoney(amount), "right")}
      </div>`;
    })
    .join("");

  const hsnHead = buildHsnHeaderHtml();

  const hsnRowsHtml = hsnRows
    .map(
      (r) => `<div class="ti-hsn-grid" style="grid-template-columns:${HSN_GRID_COLS}">
        ${cell(escapeHtml(r.hsn), "left", "ti-hsn-code")}
        ${cell(fmtMoney(r.taxable), "right")}
        ${cell(fmtCgstRate(r.rate), "center")}
        ${cell(fmtMoney(r.cgstAmt), "right")}
        ${cell(fmtCgstRate(r.rate), "center")}
        ${cell(fmtMoney(r.sgstAmt), "right")}
        ${cell(fmtMoney(r.totalTax), "right")}
      </div>`
    )
    .join("");

  const hsnTotal = `<div class="ti-hsn-grid ti-hsn-tot" style="grid-template-columns:${HSN_GRID_COLS}">
    ${cell("Total", "right", "ti-hsn-tot-label")}
    ${cell(fmtMoney(totalTaxable), "right")}
    ${cell("", "center")}
    ${cell(fmtMoney(cgst), "right")}
    ${cell("", "center")}
    ${cell(fmtMoney(sgst), "right")}
    ${cell(fmtMoney(gstAmount), "right")}
  </div>`;

  const totRow = (label, val, grand = false) =>
    `<div class="ti-tot-line${grand ? " ti-tot-grand" : ""}">
      <span>${escapeHtml(label)}</span>
      <span>${escapeHtml(val)}</span>
    </div>`;

  const termsRaw = String(doc.termsAndConditions || "").trim();
  const termsHtml = termsRaw
    ? termsRaw
        .split(/\n+/)
        .filter(Boolean)
        .map(
          (line, i) =>
            `<div class="ti-term-line">${i + 1}) ${escapeHtml(line)}</div>`
        )
        .join("")
    : "";

  const narration = String(doc.narration || "").trim();
  const amountWords =
    totalAmount > 0 ? amountInWordsIndian(Math.round(totalAmount)) : "";

  const addrHtml = COMPANY.addressLines
    .map((l) => `<div>${escapeHtml(l)}</div>`)
    .join("");

  return `
<div class="ti-page">
  <div class="ti-sheet">
    <div class="ti-header-meta-shell">
    <div class="ti-header-box"><div class="ti-header-top">
      <img src="${escapeHtml(priceListLogoUrl)}" alt="" class="ti-logo" />
      <div class="ti-co">
        <div class="ti-co-name">${escapeHtml(COMPANY.legalName)}</div>
        <div class="ti-co-addr">${addrHtml}</div>
        <div class="ti-co-meta">Email : ${escapeHtml(COMPANY.email)}</div>
        <div class="ti-co-meta">GSTIN : ${escapeHtml(COMPANY.gstin)}</div>
      </div>
      </div>
      <div class="ti-header-title">
        <div class="ti-doc-title">Tax Invoice</div>
        <div class="ti-doc-sub">(Invoice Under Rules 46 of the GST Tax Rules, 2017)</div>
      </div>
    </div>

    <section class="ti-meta-grid">
      ${renderPartyColumn("Bill To,", billToData)}
      ${renderPartyColumn("Ship To,", shipToData)}
      <div class="ti-meta-col ti-meta-inv">
        ${metaRow("Invoice No.", invoiceNoFromDoc(doc))}
        ${metaRow("Date", fmtDate(doc.voucherDate))}
        ${metaRow("Transport", String(doc.transportDetails || ""))}
        ${metaRow("Vehicle No.", "")}
        ${metaRow("Delivery At.", String(doc.deliveryAt || ""))}
        ${metaRow("LR No.", "")}
        ${metaRow("Payment Terms", paymentTerms)}
        ${metaRow("Other", "")}
      </div>
    </section>
    </div>

    <section class="ti-lines-block">
      ${lineHead}
      ${lineRowsHtml || `<div class="ti-row ti-empty">${cell("—", "center")}</div>`}
    </section>

    <section class="ti-sum-grid">
      <div class="ti-bank-box">
        <div class="ti-bank-h">:: Bank Details ::</div>
        ${bankRow("Bank Name", PURCHASE_INVOICE_BANK.bankName)}
        ${bankRow("A/C No.", PURCHASE_INVOICE_BANK.accountNo)}
        ${bankRow("Branch & Ifs Code", PURCHASE_INVOICE_BANK.branchIfsc)}
        <div class="ti-words">
          <div class="ti-words-label">(Amount In Words) :</div>
          <div class="ti-words-value">${escapeHtml(amountWords)} INR Only.</div>
        </div>
      </div>
      <div class="ti-tot-box">
        ${totRow("Total", fmtMoney(basePrice))}
        ${totRow("Cash Discount", `-${fmtMoney(discountTotal)}`)}
        ${totRow("CGST", fmtMoney(cgst))}
        ${totRow("SGST", fmtMoney(sgst))}
        ${totRow("Round Off", fmtMoney(roundOffRounded))}
        ${totRow("Grand Total", fmtMoney(totalAmount), true)}
      </div>
    </section>

    <section class="ti-hsn-block">
      ${hsnHead}
      ${hsnRowsHtml}
      ${hsnTotal}
    </section>

    <section class="ti-foot-grid">
      <div class="ti-foot-left">
        <div class="ti-foot-h">Terms &amp; Conditions</div>
        <div class="ti-terms">${termsHtml || "—"}</div>
        ${narration ? `<div class="ti-narr-block"><div class="ti-narr-h">Narration</div><div class="ti-narr-text">${escapeHtml(narration)}</div></div>` : ""}
        <div class="ti-recv">Receiver Signature :</div>
      </div>
      <div class="ti-foot-right ti-sign-box">
        <div class="ti-for">${forCompanySignHtml(COMPANY.legalName)}</div>
        <div class="ti-auth">Authorised Signature</div>
      </div>
    </section>
  </div>
</div>`;
}

const TAX_INVOICE_STYLES = `
@page { size: A4 portrait; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; color: #000; }
body { font-family: Arial, Helvetica, sans-serif; }
.ti-page { width: ${PAGE_W_PX}px; margin: 0 auto; padding: 0; box-sizing: border-box; }
.ti-sheet {
  padding: 8px 10px 12px;
  box-sizing: border-box;
  font-size: 12px;
  line-height: 1.32;
}
.ti-header-meta-shell {
  border: none;
  box-sizing: border-box;
}
.ti-header-box {
  border: 1px solid #000;
  margin: 0;
  overflow: hidden;
  box-sizing: border-box;
}
.ti-header-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  position: relative;
  box-sizing: border-box;
}
.ti-header-top::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: #000;
}
.ti-logo { width: 76px; height: 76px; object-fit: contain; flex-shrink: 0; }
.ti-co { flex: 1; text-align: center; min-width: 0; }
.ti-co-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.3px;
  margin-bottom: 3px;
  text-transform: uppercase;
}
.ti-co-addr { font-size: 11.5px; line-height: 1.35; }
.ti-co-meta { font-size: 11.5px; margin-top: 2px; line-height: 1.35; }
.ti-header-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px 10px 12px;
  box-sizing: border-box;
}
.ti-doc-title {
  font-weight: 700;
  font-size: 16px;
  margin: 0;
  padding: 0;
  border: none;
}
.ti-doc-sub {
  font-size: 10.5px;
  margin: 3px 0 0;
  padding: 0;
  border: none;
  line-height: 1.35;
}
.ti-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border: 1px solid #d1d5db;
  border-top: none;
  align-items: stretch;
  overflow: hidden;
  box-sizing: border-box;
}
.ti-meta-col {
  padding: 8px 10px;
  font-size: 11.5px;
  min-width: 0;
  box-sizing: border-box;
  position: relative;
}
.ti-meta-col:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 1px;
  background: #d1d5db;
}
.ti-meta-party {
  display: flex;
  flex-direction: column;
  min-height: 168px;
}
.ti-meta-body { flex: 1; min-height: 0; }
.ti-meta-foot { margin-top: auto; padding-top: 6px; }
.ti-meta-h {
  font-weight: 400;
  text-decoration: none;
  margin-bottom: 6px;
  font-size: 11.5px;
}
.ti-meta-name { font-weight: 700; margin: 0 0 3px; line-height: 1.35; }
.ti-meta-p { margin: 1px 0; word-break: break-word; line-height: 1.35; font-weight: 400; }
.ti-meta-inv .ti-kv {
  display: grid;
  grid-template-columns: 100px 10px 1fr;
  align-items: start;
  column-gap: 2px;
  margin: 2px 0;
  font-size: 11.5px;
}
.ti-meta-inv .ti-kv-l { font-weight: 700; white-space: nowrap; }
.ti-meta-inv .ti-kv-c { text-align: center; }
.ti-meta-inv .ti-kv-v { min-width: 0; word-break: break-word; line-height: 1.35; }
.ti-bank-box .ti-bank-kv {
  display: grid;
  grid-template-columns: 132px 10px 1fr;
  align-items: baseline;
  column-gap: 0;
  margin: 3px 0;
  font-size: 11.5px;
  line-height: 1.35;
}
.ti-bk-l {
  font-weight: 400;
  white-space: nowrap;
  text-align: left;
}
.ti-bk-c {
  text-align: left;
  padding: 0 4px 0 0;
}
.ti-bk-v {
  font-weight: 400;
  min-width: 0;
  word-break: break-word;
}
.ti-words {
  margin-top: 12px;
  padding-top: 4px;
}
.ti-words-label {
  font-weight: 700;
  font-size: 11.5px;
  margin-bottom: 4px;
  line-height: 1.35;
}
.ti-words-value {
  font-weight: 400;
  font-size: 11.5px;
  line-height: 1.4;
  word-break: break-word;
}
.ti-lines-block {
  border: 1px solid #d1d5db;
  border-top: none;
  box-sizing: border-box;
}
.ti-hsn-block {
  border: 1px solid #d1d5db;
  border-top: none;
}
.ti-row,
.ti-hsn-grid {
  display: grid;
  width: 100%;
  box-sizing: border-box;
  align-items: stretch;
}
.ti-lines-block .ti-row + .ti-row { border-top: 1px solid #d1d5db; }
.ti-hsn-grid + .ti-hsn-grid,
.ti-hsn-head-wrap + .ti-hsn-grid { border-top: 1px solid #d1d5db; }
.ti-hsn-head-wrap {
  display: grid;
  grid-template-rows: auto auto;
  width: 100%;
  box-sizing: border-box;
}
.ti-hsn-head-wrap .ti-cell {
  font-weight: 700;
  background: #e9eef3;
}
.ti-lines-block .ti-row-head .ti-cell {
  font-weight: 700;
  background: #e9eef3;
  color: #1a1a1a;
}
.ti-lines-block .ti-row:not(.ti-row-head) .ti-cell {
  background: #fff;
}
.ti-hsn-r2 { grid-row: 1 / 3; }
.ti-hsn-c2 { grid-column: span 2; }
.ti-hsn-head-wrap .ti-cell:nth-child(1) { grid-column: 1; grid-row: 1 / 3; }
.ti-hsn-head-wrap .ti-cell:nth-child(2) { grid-column: 2; grid-row: 1 / 3; }
.ti-hsn-head-wrap .ti-cell:nth-child(3) { grid-column: 3 / 5; grid-row: 1; }
.ti-hsn-head-wrap .ti-cell:nth-child(4) { grid-column: 5 / 7; grid-row: 1; }
.ti-hsn-head-wrap .ti-cell:nth-child(5) { grid-column: 7; grid-row: 1 / 3; }
.ti-hsn-head-wrap .ti-cell:nth-child(6) { grid-column: 3; grid-row: 2; }
.ti-hsn-head-wrap .ti-cell:nth-child(7) { grid-column: 4; grid-row: 2; }
.ti-hsn-head-wrap .ti-cell:nth-child(8) { grid-column: 5; grid-row: 2; }
.ti-hsn-head-wrap .ti-cell:nth-child(9) { grid-column: 6; grid-row: 2; }
.ti-cell {
  display: flex;
  align-items: center;
  align-self: stretch;
  min-height: 28px;
  padding: 6px 5px;
  border-right: 1px solid #d1d5db;
  box-sizing: border-box;
  font-size: 11.5px;
  min-width: 0;
  word-break: break-word;
  line-height: 1.3;
}
.ti-lines-block .ti-cell {
  border-right: 1px solid #d1d5db;
}
.ti-lines-block .ti-row .ti-cell:first-child,
.ti-lines-block .ti-srno {
  white-space: nowrap;
}
.ti-lines-block .ti-row-head .ti-cell {
  align-items: center;
}
.ti-lines-block .ti-row:not(.ti-row-head) .ti-desc {
  align-items: flex-start;
  padding-top: 7px;
  padding-bottom: 7px;
}
.ti-hsn-grid .ti-cell { font-size: 11px; padding: 5px 6px; min-height: 24px; }
.ti-hsn-grid .ti-hsn-code { padding-left: 8px; }
.ti-hsn-tot .ti-hsn-tot-label { font-weight: 700; }
.ti-cell:last-child { border-right: none; }
.ti-hsn-block .ti-cell:last-child,
.ti-hsn-block .ti-hsn-head-wrap .ti-cell:nth-child(5) {
  border-right: 1px solid #d1d5db;
}
.ti-lines-block .ti-row .ti-cell:last-child {
  border-right: 1px solid #d1d5db;
}
.ti-al {
  justify-content: flex-start;
  text-align: left;
  padding-left: 8px;
}
.ti-ac {
  justify-content: center;
  text-align: center;
}
.ti-ar {
  justify-content: flex-end;
  text-align: right;
  padding-right: 8px;
}
.ti-lines-block .ti-row-head .ti-al {
  justify-content: flex-start;
  text-align: left;
  padding-left: 8px;
}
.ti-desc { align-items: center; }
.ti-hsn-head-wrap .ti-cell:nth-child(n+6) { border-top: 1px solid #d1d5db; }
.ti-row.ti-empty { grid-template-columns: 1fr !important; }
.ti-row.ti-empty .ti-cell {
  grid-column: 1 / -1;
  border-right: none;
  justify-content: center;
  text-align: center;
}
.ti-hsn-tot .ti-cell { font-weight: 700; }
.ti-sum-grid {
  display: grid;
  grid-template-columns: 62% 38%;
  border: 1px solid #d1d5db;
  border-top: none;
  box-sizing: border-box;
}
.ti-bank-box {
  padding: 8px 12px 10px;
  border-right: 1px solid #d1d5db;
  font-size: 11.5px;
  box-sizing: border-box;
}
.ti-bank-h {
  font-weight: 700;
  margin-bottom: 6px;
  font-size: 12px;
  text-align: left;
}
.ti-tot-box { display: flex; flex-direction: column; }
.ti-tot-line {
  display: grid;
  grid-template-columns: 1fr 100px;
  align-items: center;
  min-height: 28px;
  padding: 6px 10px;
  border-bottom: 1px solid #d1d5db;
  font-weight: 400;
  font-size: 11.5px;
  box-sizing: border-box;
}
.ti-tot-line span:first-child { text-align: left; }
.ti-tot-line span:last-child { text-align: right; white-space: nowrap; }
.ti-tot-grand {
  font-weight: 700;
  font-size: 12px;
  border-bottom: none;
  border-top: 1px solid #d1d5db;
}
.ti-tot-grand span:first-child,
.ti-tot-grand span:last-child { font-weight: 700; }
.ti-foot-grid {
  display: grid;
  grid-template-columns: 68% 32%;
  border: 1px solid #d1d5db;
  border-top: none;
}
.ti-foot-left {
  padding: 8px 10px 10px;
  border-right: 1px solid #d1d5db;
  font-size: 11px;
}
.ti-foot-right.ti-sign-box {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  min-height: 130px;
  margin: 0;
  padding: 10px 12px 12px;
  border: none;
  font-size: 11.5px;
  box-sizing: border-box;
}
.ti-foot-h { font-weight: 700; margin-bottom: 5px; font-size: 12px; }
.ti-term-line { margin: 3px 0; line-height: 1.35; }
.ti-narr-block { margin-top: 10px; }
.ti-narr-h { font-weight: 700; margin-bottom: 4px; font-size: 11.5px; }
.ti-narr-text { font-size: 11.5px; line-height: 1.4; }
.ti-recv { margin-top: 28px; font-weight: 600; font-size: 11.5px; }
.ti-for {
  font-weight: 700;
  text-align: left;
  font-size: 12px;
  line-height: 1.35;
  width: 100%;
}
.ti-auth {
  border: none;
  padding: 0;
  font-size: 11px;
  width: 100%;
  text-align: right;
  margin-top: auto;
  align-self: stretch;
}
`;

/** Complete HTML document sized for A4 PDF capture */
export function buildPurchaseTaxInvoiceFullDocument(doc, partyAccount = null) {
  const body = buildPurchaseTaxInvoiceBodyHtml(doc, partyAccount);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Tax Invoice</title>
<style>${TAX_INVOICE_STYLES}</style>
</head>
<body>${body}</body>
</html>`;
}

export function purchasePayloadToTaxInvoiceDoc(payload) {
  if (!payload) return null;
  const gstRate = Number(String(payload.gstRate || "").replace(/,/g, "")) || 0;
  const items = (payload.productRows || [])
    .filter((r) => r.product)
    .map((row) => {
      const qty = Number(String(row.qty).replace(/,/g, "")) || 0;
      const rate = Number(String(row.rate).replace(/,/g, "")) || 0;
      const base = qty * rate;
      const disc = purchaseLineDiscount({
        quantity: qty,
        rateParUnit: rate,
        discountAmt: row.discountAmt,
        discountPct: row.discountPct,
        subtotal: 0,
      });
      const taxable = Math.max(0, base - disc);
      const tax = gstRate ? (taxable * gstRate) / 100 : 0;
      return {
        product: row.product,
        quantity: qty,
        rateParUnit: rate,
        unit: row.unit || "Nos",
        hsn: row.hsn || "",
        batch: row.batch || "",
        group: row.group || "",
        expDate: row.expDate || "",
        mfgDate: row.mfgDate || "",
        subtotal: taxable,
        discountPct: row.discountPct,
        discountAmt: row.discountAmt,
        _lineTax: tax,
      };
    });

  const basePrice = items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
  const gstAmount = items.reduce((s, it) => s + (Number(it._lineTax) || 0), 0);
  const totalAmount = basePrice + gstAmount;

  return {
    partyName: payload.partyName,
    invoicePrefix: payload.invoicePrefix,
    invoiceNumber: payload.invoiceNumber,
    invoiceNo: payload.invoiceNo,
    voucherNo: payload.voucherNo,
    voucherDate: payload.purchaseDate,
    transportDetails: payload.transporter,
    deliveryAt: payload.deliveryAt,
    orderby: payload.orderBy,
    billTo: payload.billTo,
    shipTo: payload.shipTo,
    shipToAndBillTo: payload.shipTo,
    termsOfPayment: payload.termsPayment,
    paymentMode: payload.termsPayment,
    termsAndConditions: payload.termsText,
    narration: payload.narration,
    ewayBill: payload.ewayBill,
    items,
    basePrice,
    gstAmount: Math.round(gstAmount),
    totalAmount: Math.round(totalAmount),
  };
}

export function buildPurchaseTaxInvoiceBodyFromDetail(detail) {
  const doc = detail?._sourceDoc;
  if (!doc) return "";
  return buildPurchaseTaxInvoiceBodyHtml(doc, detail.partyAccount);
}

export function buildPurchaseTaxInvoiceFullDocumentFromDetail(detail) {
  const doc = detail?._sourceDoc;
  if (!doc) return "";
  return buildPurchaseTaxInvoiceFullDocument(doc, detail.partyAccount);
}
