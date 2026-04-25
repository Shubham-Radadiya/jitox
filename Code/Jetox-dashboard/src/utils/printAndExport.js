/**
 * Escape text for safe insertion into HTML.
 */
export function escapeHtml(text) {
  const s = String(text ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Build a simple two-column table from a plain object.
 */
export function objectToHtmlTable(obj) {
  const rows = Object.entries(obj)
    .map(
      ([k, v]) =>
        `<tr><th style="text-align:left;padding:6px;border:1px solid #ddd">${escapeHtml(
          k
        )}</th><td style="padding:6px;border:1px solid #ddd">${escapeHtml(
          v
        )}</td></tr>`
    )
    .join("");
  return `<table style="border-collapse:collapse;width:100%;max-width:640px">${rows}</table>`;
}

/**
 * Build an HTML table from column keys and row objects (for exports).
 * @param {string[]} columnKeys
 * @param {Record<string, unknown>[]} rows
 */
export function rowsToHtmlTable(columnKeys, rows) {
  const thead = `<tr>${columnKeys
    .map((c) => `<th>${escapeHtml(c)}</th>`)
    .join("")}</tr>`;
  const tbody = rows
    .map(
      (row) =>
        `<tr>${columnKeys
          .map((c) => `<td>${escapeHtml(row[c] ?? "")}</td>`)
          .join("")}</tr>`
    )
    .join("");
  return `<table style="border-collapse:collapse;width:100%"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
}

function safeDownloadBasename(title) {
  const base = String(title || "Jitox-document")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  return base || "Jitox-document";
}

/**
 * Full standalone HTML document (print-friendly). Same shell for download + print window.
 */
export function buildStandalonePrintableHtml(title, bodyInnerHtml) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<style>
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
  body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:20px;color:#111;font-size:14px;line-height:1.45;}
  table{border-collapse:collapse;width:100%;margin-top:12px;}
  th,td{border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top;}
  th{background:#f8fafc;font-weight:600;}
  h1{font-size:18px;margin:0 0 12px;color:#0f766e;}
</style></head><body>
<h1>${escapeHtml(title)}</h1>
${bodyInnerHtml}
</body></html>`;
}

/**
 * Download a text/html file (e.g. invoice preview).
 */
export function downloadHtmlFile(filename, fullHtmlDocument) {
  const blob = new Blob([fullHtmlDocument], { type: "text/html;charset=utf-8" });
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

/**
 * Save a printable HTML document to the user's Downloads folder (no print dialog).
 * Open the file and use Print → Save as PDF for a true PDF.
 */
export function downloadPrintableDocument(title, bodyInnerHtml) {
  const full = buildStandalonePrintableHtml(title, bodyInnerHtml);
  downloadHtmlFile(`${safeDownloadBasename(title)}.html`, full);
}

/**
 * Open a print dialog with the given HTML body (no app shell), and **download** the same
 * document as `.html` so the file always lands in Downloads even if pop-ups are blocked.
 *
 * @param {string} title
 * @param {string} bodyInnerHtml
 * @param {{ download?: boolean, printDialog?: boolean }} [opts]
 * @returns {boolean} true if the download ran (default) and/or print was attempted
 */
export function printHtmlDocument(title, bodyInnerHtml, opts = {}) {
  const { download = true, printDialog = false } = opts;
  const full = buildStandalonePrintableHtml(title, bodyInnerHtml);
  const fname = `${safeDownloadBasename(title)}.html`;

  if (download) {
    downloadHtmlFile(fname, full);
  }

  if (!printDialog) {
    return true;
  }

  const w = window.open("", "_blank");
  if (!w) {
    return Boolean(download);
  }
  w.document.open();
  w.document.write(full);
  w.document.close();
  w.focus();
  try {
    w.print();
  } catch {
    /* ignore */
  }
  try {
    w.close();
  } catch {
    /* ignore */
  }
  return true;
}
