import toast from "react-hot-toast";
import { printHtmlDocument, escapeHtml } from "./printAndExport";

/**
 * Open WhatsApp with optional prefilled text (web or app).
 */
export function shareWhatsAppText(text) {
  const t = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${t}`, "_blank", "noopener,noreferrer");
}

/**
 * Print arbitrary title + HTML body (user can Save as PDF from print dialog).
 */
export function sharePrint(title, innerHtml) {
  const ok = printHtmlDocument(title, innerHtml);
  if (ok) {
    toast.success(
      "Downloaded (.html). Open the file and use Print → Save as PDF for a PDF copy."
    );
  } else {
    toast.error("Allow downloads in your browser to save this document.");
  }
}

/**
 * Compact toolbar actions for list rows / vouchers.
 */
export function buildVoucherShareSummaryLines(meta) {
  const rows = Object.entries(meta || {})
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px;border:1px solid #ddd"><strong>${escapeHtml(
          k
        )}</strong></td><td style="padding:4px;border:1px solid #ddd">${escapeHtml(
          String(v ?? "")
        )}</td></tr>`
    )
    .join("");
  return `<table style="border-collapse:collapse;width:100%;max-width:480px">${rows}</table>`;
}
