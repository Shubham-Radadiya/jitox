import {
  escapeHtml,
  buildStandalonePrintableHtml,
  downloadHtmlDocumentAsPdf,
  downloadHtmlFile,
} from "./printAndExport";
import {
  buildPurchaseTaxInvoiceFullDocument,
  buildPurchaseTaxInvoiceFullDocumentFromDetail,
  purchasePayloadToTaxInvoiceDoc,
  PURCHASE_TAX_INVOICE_PAGE_W_PX,
} from "./purchaseTaxInvoicePdf";

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Download a CSV file (Excel-compatible) in the browser.
 */
export function downloadCsv(filename, header, rows) {
  const lines = [
    header.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ];
  const blob = new Blob(["\ufeff", lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/[/\\?%*:|"<>]/g, "-");
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function buildPurchaseListRowSummary(row) {
  if (!row || typeof row !== "object") return "";
  const parts = [];
  for (const [k, v] of Object.entries(row)) {
    if (k === "_id" || k === "_raw" || k === "Actions") continue;
    if (v == null || v === "") continue;
    parts.push(`${k}: ${v}`);
  }
  return parts.join("\n");
}

export function downloadPurchaseListRowCsv(row) {
  if (!row) return;
  const dataRows = [];
  for (const [k, v] of Object.entries(row)) {
    if (k === "_raw" || k === "Actions") continue;
    dataRows.push([k, v == null ? "" : String(v)]);
  }
  const vn =
    row["Voucher No."] || row["Voucher No"] || row._id || "purchase-voucher";
  downloadCsv(
    `${String(vn).replace(/[/\\?%*:|"<>]/g, "-")}-summary.csv`,
    ["Field", "Value"],
    dataRows
  );
}

export function buildPurchaseDetailShareText(detail) {
  if (!detail) return "";
  let t = `Purchase voucher\nVoucher: ${detail.voucherNo}\nDate: ${detail.purchaseDate}\n`;
  if (detail.narration) t += `\nNarration:\n${detail.narration}\n`;
  if (detail.termsAndConditions) {
    t += `\nTerms & conditions:\n${detail.termsAndConditions}\n`;
  }
  (detail.party || []).forEach((r) => {
    t += `${r.label}: ${r.value}\n`;
  });
  t += "\nItems:\n";
  (detail.products || []).forEach((p, i) => {
    t += `${i + 1}. ${p.name} | Qty ${p.qty} | Rate ${p.rate} | Line ${p.subtotal}\n`;
  });
  t += `\nTotal: ${detail.totals?.totalAmount ?? "—"}\n`;
  return t;
}

export function downloadPurchaseDetailCsv(detail) {
  if (!detail) return;
  const header = ["Line", "Product", "Qty", "Rate", "Subtotal"];
  const rows = (detail.products || []).map((p, i) => [
    String(i + 1),
    p.name,
    p.qty,
    p.rate,
    p.subtotal,
  ]);
  const safe = String(detail.voucherNo || "purchase").replace(/[/\\?%*:|"<>]/g, "-");
  downloadCsv(`${safe}-lines.csv`, header, rows);
}

function buildPurchaseDetailBillBody(detail) {
  if (!detail) return "";
  const narr = detail.narration
    ? `<p><strong>Narration</strong><br/>${escapeHtml(detail.narration).replace(/\n/g, "<br/>")}</p>`
    : "";
  const terms = detail.termsAndConditions
    ? `<p><strong>Terms &amp; conditions</strong><br/>${escapeHtml(
        detail.termsAndConditions
      ).replace(/\n/g, "<br/>")}</p>`
    : "";
  const partyRows = (detail.party || [])
    .map(
      (r) =>
        `<tr><th>${escapeHtml(r.label)}</th><td>${escapeHtml(r.value)}</td></tr>`
    )
    .join("");
  const productRows = (detail.products || [])
    .map(
      (p) =>
        `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.qty)}</td><td>${escapeHtml(
          p.rate
        )}</td><td>${escapeHtml(p.gst)}</td><td>${escapeHtml(p.subtotal)}</td></tr>`
    )
    .join("");
  return `
<p><strong>Date:</strong> ${escapeHtml(detail.purchaseDate)}</p>
${narr}
${terms}
<table><tbody>${partyRows}</tbody></table>
<table>
<thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>GST</th><th>Subtotal</th></tr></thead>
<tbody>${productRows}</tbody>
</table>
<p><strong>Total:</strong> ${escapeHtml(detail.totals?.totalAmount ?? "—")}</p>
`;
}

export function printPurchaseDetailBill(detail) {
  if (!detail) return false;
  const body = buildPurchaseDetailBillBody(detail);
  return printHtmlDocument(`Purchase — ${detail.voucherNo}`, body);
}

export async function downloadPurchaseDetailBillPdf(detail) {
  if (!detail) return;
  const invNo =
    detail._sourceDoc?.invoiceNo ||
    detail.invoiceNo ||
    detail.voucherNo ||
    "voucher";
  const title = `Tax-Invoice-${String(invNo).replace(/[/\\?%*:|"<>]/g, "-")}`;
  const fullHtml =
    buildPurchaseTaxInvoiceFullDocumentFromDetail(detail) ||
    buildStandalonePrintableHtml(
      title,
      buildPurchaseDetailBillBody(detail),
      { showTitle: false }
    );
  await downloadHtmlDocumentAsPdf(fullHtml, `${title}.pdf`, {
    captureWidthPx: PURCHASE_TAX_INVOICE_PAGE_W_PX,
  });
}

export async function downloadPurchasePayloadTaxInvoicePdf(payload) {
  const doc = purchasePayloadToTaxInvoiceDoc(payload);
  if (!doc) return;
  const inv =
    `${payload.invoicePrefix || ""}${payload.invoiceNumber || ""}`.trim() ||
    payload.invoiceNo ||
    payload.voucherNo ||
    "draft";
  const title = `Tax-Invoice-${String(inv).replace(/[/\\?%*:|"<>]/g, "-")}`;
  const fullHtml = buildPurchaseTaxInvoiceFullDocument(doc, null);
  await downloadHtmlDocumentAsPdf(fullHtml, `${title}.pdf`, {
    captureWidthPx: PURCHASE_TAX_INVOICE_PAGE_W_PX,
  });
}

export function buildPaymentDetailShareText(detail) {
  if (!detail) return "";
  let t = `Payment voucher\nVoucher: ${detail.voucherNo}\nDate: ${detail.date}\n`;
  t += `Payment Status: ${detail.status}\n`;
  if (detail.paymentTerms && detail.paymentTerms !== "—") {
    t += `Terms of Payment: ${detail.paymentTerms}\n`;
  }
  (detail.party || []).forEach((r) => {
    t += `${r.label}: ${r.value}\n`;
  });
  t += `Amount: ${detail.totals?.amount ?? "—"}\n`;
  if (detail.remarks) t += `\nRemarks:\n${detail.remarks}\n`;
  return t;
}

export function downloadPaymentDetailCsv(detail) {
  if (!detail) return;
  const safe = String(detail.voucherNo || "payment").replace(
    /[/\\?%*:|"<>]/g,
    "-"
  );
  const rows = [
    ["Voucher No", detail.voucherNo || ""],
    ["Date", detail.date || ""],
    ["Payment Status", detail.status || ""],
    ["Terms of Payment", detail.paymentTerms || ""],
    ...(detail.party || []).map((r) => [r.label, r.value]),
    ["Amount", detail.totals?.amount || ""],
    ["Remarks", detail.remarks || ""],
  ];
  downloadCsv(`${safe}-summary.csv`, ["Field", "Value"], rows);
}

function buildPaymentDetailBillBody(detail) {
  if (!detail) return "";
  const partyRows = (detail.party || [])
    .map(
      (r) =>
        `<tr><th>${escapeHtml(r.label)}</th><td>${escapeHtml(r.value)}</td></tr>`
    )
    .join("");
  const remarks = detail.remarks
    ? `<p><strong>Remarks</strong><br/>${escapeHtml(detail.remarks).replace(/\n/g, "<br/>")}</p>`
    : "";
  return `
<p><strong>Date:</strong> ${escapeHtml(detail.date)}</p>
<p><strong>Payment Status:</strong> ${escapeHtml(detail.status || "—")}</p>
${detail.paymentTerms && detail.paymentTerms !== "—" ? `<p><strong>Terms of Payment:</strong> ${escapeHtml(detail.paymentTerms)}</p>` : ""}
<table><tbody>${partyRows}</tbody></table>
<p><strong>Amount:</strong> ${escapeHtml(detail.totals?.amount ?? "—")}</p>
${remarks}
`;
}

export async function downloadPaymentDetailBillPdf(detail) {
  if (!detail) return;
  const title = `Payment — ${detail.voucherNo || "voucher"}`;
  const body = buildPaymentDetailBillBody(detail);
  const fullHtml = buildStandalonePrintableHtml(title, body, {
    bodyPaddingPx: 10,
    bodyFontSizePx: 12,
    h1FontSizePx: 16,
    tableCellPaddingPx: 5,
  });
  await downloadHtmlDocumentAsPdf(fullHtml, `${title}.pdf`);
}

function rowMoneyForPayload(row, gstRate) {
  const q = Number(String(row.qty).replace(/,/g, "")) || 0;
  const r = Number(String(row.rate).replace(/,/g, "")) || 0;
  const base = q * r;
  const dAmt = Number(String(row.discountAmt).replace(/,/g, "")) || 0;
  const dPct = Number(String(row.discountPct).replace(/,/g, "")) || 0;
  const disc = dAmt > 0 ? dAmt : base * (dPct / 100);
  const gstPct = Number(String(gstRate).replace(/,/g, "")) || 0;
  const taxable = Math.max(0, base - disc);
  const tax = gstPct ? (taxable * gstPct) / 100 : 0;
  return taxable + tax;
}

export function buildPurchasePayloadShareText(p) {
  if (!p || typeof p !== "object") return "";
  const inv =
    `${p.invoicePrefix || ""}${p.invoiceNumber || ""}`.trim() ||
    p.invoiceNo ||
    "—";
  let t = `Purchase voucher (draft)\n`;
  t += `Voucher ref: ${p.voucherNo || "—"}\n`;
  t += `Invoice: ${inv}\n`;
  t += `Date: ${p.purchaseDate || "—"}\n`;
  if (p.narration) t += `\nNarration:\n${p.narration}\n`;
  if (p.internalNotes) t += `\nInternal notes:\n${p.internalNotes}\n`;
  t += `\nParty: ${p.partyName || "—"}\n`;
  t += `\nLines:\n`;
  (p.productRows || []).forEach((row, i) => {
    const amt = rowMoneyForPayload(row, p.gstRate);
    t += `${i + 1}. ${row.product || "—"} | Qty ${row.qty || 0} | Rate ${row.rate || 0} | Amt ₹${Math.round(amt)}\n`;
  });
  if (p.lineTotals) {
    t += `\nTaxable: ₹${Math.round(p.lineTotals.taxable || 0)} | Tax: ₹${Math.round(p.lineTotals.tax || 0)}\n`;
  }
  return t;
}

export function downloadPurchasePayloadCsv(p) {
  if (!p) return;
  const header = [
    "No",
    "Product",
    "HSN",
    "Batch",
    "Qty",
    "Rate",
    "Disc%",
    "DiscAmt",
    "Line total (₹)",
  ];
  const rows = (p.productRows || []).map((row, i) => {
    const amt = Math.round(rowMoneyForPayload(row, p.gstRate));
    return [
      String(i + 1),
      row.product || "",
      row.hsn || "",
      row.batch || "",
      row.qty || "",
      row.rate || "",
      row.discountPct || "",
      row.discountAmt || "",
      String(amt),
    ];
  });
  const name = String(p.voucherNo || "purchase-draft").replace(/[/\\?%*:|"<>]/g, "-");
  downloadCsv(`${name}-lines.csv`, header, rows);
}

export function printPurchasePayloadBill(p) {
  if (!p) return false;
  const doc = purchasePayloadToTaxInvoiceDoc(p);
  if (!doc) return false;
  const inv =
    `${p.invoicePrefix || ""}${p.invoiceNumber || ""}`.trim() ||
    p.invoiceNo ||
    p.voucherNo ||
    "draft";
  const fullHtml = buildPurchaseTaxInvoiceFullDocument(doc, null);
  downloadHtmlFile(`${String(inv).replace(/[/\\?%*:|"<>]/g, "-")}-tax-invoice.html`, fullHtml);
  return true;
}

/**
 * Uses Web Share API when available; otherwise copies text to clipboard.
 * @returns {"shared"|"copied"|"failed"}
 */
export async function shareOrCopyText(title, text) {
  const body = String(text || "");
  if (!body) return "failed";
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text: body });
      return "shared";
    } catch (e) {
      if (e && e.name === "AbortError") return "failed";
    }
  }
  try {
    await navigator.clipboard.writeText(body);
    return "copied";
  } catch {
    return "failed";
  }
}
