import priceListLogoUrl from "../assets/jitox-price-list-logo.png";

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
 * @param {{ bodyFontSizePx?: number, h1FontSizePx?: number, bodyPaddingPx?: number, tableCellPaddingPx?: number, showTitle?: boolean }} [opts]
 */
export function buildStandalonePrintableHtml(title, bodyInnerHtml, opts = {}) {
  const bodyPx = opts.bodyFontSizePx ?? 14;
  const h1Px = opts.h1FontSizePx ?? 18;
  const padPx = opts.bodyPaddingPx ?? 20;
  const cellPadPx = opts.tableCellPaddingPx ?? 8;
  const showTitle = opts.showTitle ?? true;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<style>
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
  body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:${padPx}px;color:#111;font-size:${bodyPx}px;line-height:1.45;}
  table{border-collapse:collapse;width:100%;margin-top:12px;}
  th,td{border:1px solid #ddd;padding:${cellPadPx}px;text-align:left;vertical-align:top;}
  th{background:#f8fafc;font-weight:600;}
  h1{font-size:${h1Px}px;margin:0 0 12px;color:#0f766e;}
</style></head><body>
${showTitle ? `<h1>${escapeHtml(title)}</h1>` : ""}
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
 * Render a full HTML document string to a PDF and trigger download (client-side).
 * Uses html2canvas + jsPDF (avoids html2pdf.js v0.10 bundler / interop issues under Vite).
 *
 * @param {string} fullHtmlDocument complete <!DOCTYPE html>… document
 * @param {string} filename e.g. "invoice-AB01.pdf"
 * @returns {Promise<void>}
 */
/** Wait for `<img>` nodes so html2canvas captures logos from `/public` reliably. */
function waitForImagesLoaded(root) {
  const imgs = root.querySelectorAll?.("img") ?? [];
  return Promise.all(
    [...imgs].map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalHeight > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          setTimeout(done, 4000);
        })
    )
  );
}

export async function downloadHtmlDocumentAsPdf(fullHtmlDocument, filename = "document.pdf") {
  const safeName = (filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`).replace(
    /[/\\?%*:|"<>]/g,
    "-"
  );

  const [html2canvasModule, jspdfModule] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const html2canvas = html2canvasModule.default ?? html2canvasModule;
  const JsPDF = jspdfModule.jsPDF ?? jspdfModule.default?.jsPDF ?? jspdfModule.default;
  if (typeof html2canvas !== "function" || typeof JsPDF !== "function") {
    throw new Error("PDF dependencies failed to load (html2canvas or jsPDF).");
  }

  /**
   * Render inside a real iframe document so <head> styles apply to <body> (moving nodes
   * into a div breaks `body { … }` rules and near-zero opacity often yields a blank canvas).
   */
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.title = "pdf-export";
  iframe.style.cssText =
    "position:absolute;left:-9999px;top:0;width:1040px;height:400px;border:0;margin:0;padding:0;opacity:1;pointer-events:none;overflow:hidden;";
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentDocument;
  if (!frameDoc) {
    iframe.remove();
    throw new Error("PDF export iframe has no document (browser blocked?).");
  }

  frameDoc.open();
  frameDoc.write(fullHtmlDocument);
  frameDoc.close();

  const captureRoot = frameDoc.body;
  if (!captureRoot || !captureRoot.textContent?.trim()) {
    iframe.remove();
    throw new Error("Invoice HTML is empty or could not be parsed for PDF.");
  }

  try {
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    await new Promise((r) => setTimeout(r, 80));

    const docEl = frameDoc.documentElement;
    if (docEl) {
      docEl.style.height = "auto";
      docEl.style.minHeight = "0";
    }
    captureRoot.style.minHeight = "0";

    const contentH = Math.max(captureRoot.scrollHeight, captureRoot.getBoundingClientRect().height);
    iframe.style.height = `${Math.ceil(contentH + 2)}px`;

    await new Promise((r) => requestAnimationFrame(r));

    await waitForImagesLoaded(captureRoot);

    const canvas = await html2canvas(captureRoot, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      foreignObjectRendering: false,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error("PDF capture produced an empty image (0×0).");
    }

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    /** Tight PDF margins (mm) */
    const margin = 5;
    const innerH = pageH - 2 * margin;
    const imgW = pageW - 2 * margin;
    const imgH = (canvas.height * imgW) / canvas.width;

    /** Only add extra pages when content truly exceeds one page (avoids blank trailing pages from rounding / extra canvas pixels). */
    const pageMmEps = 0.75;
    const pagesNeeded = Math.max(1, Math.ceil((imgH - pageMmEps) / innerH));

    for (let i = 0; i < pagesNeeded; i++) {
      if (i > 0) pdf.addPage();
      const y = margin - i * innerH;
      pdf.addImage(imgData, "JPEG", margin, y, imgW, imgH);
    }

    pdf.save(safeName);
  } finally {
    iframe.remove();
  }
}

/**
 * Save a printable HTML document to the user's Downloads folder (no print dialog).
 * Open the file and use Print → Save as PDF for a true PDF.
 */
export function downloadPrintableDocument(title, bodyInnerHtml) {
  const full = buildStandalonePrintableHtml(title, bodyInnerHtml);
  downloadHtmlFile(`${safeDownloadBasename(title)}.html`, full);
}

/** Default matches Account Statement / branding — override via opts */
const PRICE_LIST_DEFAULT_COMPANY = {
  name: "JETOX AGRO INDUSTRIES",
  addressLine:
    "A-16, Swagat Industrial Park, Near Indore Ahmedabad Highway, Bakrol, Ahmedabad.",
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Current Indian FY period start (1 Apr). */
function indianFinancialYearStartDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const fyYearStart = m >= 3 ? y : y - 1;
  return new Date(fyYearStart, 3, 1);
}

function formatDdMmYyyy(d) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function fmtPriceNum(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function fmtGstPdf(v) {
  const raw = String(v ?? "")
    .replace(/%/g, "")
    .trim();
  if (!raw) return "—";
  return `${raw}%`;
}

function displayMrpForPdf(p) {
  const raw = p.mrpPerUnit;
  if (raw == null || String(raw).trim() === "") return "—";
  const n = Number(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) ? fmtPriceNum(n) : String(raw).trim();
}

function packingDisplay(p) {
  const a = String(p.packingStyle || "").trim();
  const b = String(p.packagingType || "").trim();
  if (a && b && a.toLowerCase() !== b.toLowerCase()) return `${a} / ${b}`;
  return a || b || "—";
}

function productNamePackWise(p) {
  const name = String(p.productName || "").trim() || "—";
  const pack = String(p.defaultPackSize || "").trim();
  if (!pack) return name;
  return `${name} (${pack})`;
}

/**
 * Formal price list layout (portrait PDF via html2canvas): company block + bordered grid,
 * category bands + optional group sub-rows + product lines.
 *
 * @param {string} documentTitle `<title>` + filename base
 * @param {Record<string, unknown>[]} products raw API product docs
 * @param {{ companyName?: string, companyAddress?: string, effectiveDateLabel?: string, logoSrc?: string }} [opts]
 * @returns {string} full HTML document
 */
export function buildPriceListStandaloneHtml(documentTitle, products, opts = {}) {
  const companyName = opts.companyName ?? PRICE_LIST_DEFAULT_COMPANY.name;
  const addressLine =
    opts.companyAddress ?? PRICE_LIST_DEFAULT_COMPANY.addressLine;
  const effectiveDateLabel =
    opts.effectiveDateLabel ?? formatDdMmYyyy(indianFinancialYearStartDate());

  /** Bundled from `src/assets` — Vite resolves to a stable URL for PDF capture */
  const logoSrc = opts.logoSrc ?? priceListLogoUrl;

  const list = Array.isArray(products) ? [...products] : [];
  list.sort((a, b) => {
    const ca = String(a.category || "").toLowerCase();
    const cb = String(b.category || "").toLowerCase();
    if (ca !== cb) return ca.localeCompare(cb);
    const ga = String(a.group || "").toLowerCase();
    const gb = String(b.group || "").toLowerCase();
    const gaK = ga || "\uFFFF";
    const gbK = gb || "\uFFFF";
    if (gaK !== gbK) return gaK.localeCompare(gbK);
    return String(a.productName || "").localeCompare(String(b.productName || ""));
  });

  const cellBase =
    "border:1px solid #000;padding:5px 7px;font-size:18px;vertical-align:middle;";
  const thBase =
    `${cellBase}background:#e8e8e8;font-weight:700;text-align:center;`;

  const bodyRows = [];
  let lastCat = null;
  let lastGroup = null;

  for (const p of list) {
    const cat = String(p.category || "General").trim() || "General";
    const grp = String(p.group || "").trim();

    if (cat !== lastCat) {
      bodyRows.push(
        `<tr><td colspan="6" style="${cellBase}background:#dedede;text-align:center;font-weight:700;font-size:19px;text-transform:uppercase;padding:6px 8px;">${escapeHtml(
          cat
        )}</td></tr>`
      );
      lastCat = cat;
      lastGroup = null;
    }

    if (grp && grp !== lastGroup) {
      bodyRows.push(
        `<tr><td colspan="6" style="${cellBase}background:#eeeeee;text-align:left;font-weight:700;font-size:18px;padding:5px 8px;">${escapeHtml(
          grp
        )}</td></tr>`
      );
      lastGroup = grp;
    }

    const rateLtr = fmtPriceNum(p.billingRatePerUnit);
    const rateUnit =
      p.rate != null && Number.isFinite(Number(p.rate))
        ? fmtPriceNum(p.rate)
        : rateLtr;

    bodyRows.push(`<tr>
      <td style="${cellBase}text-align:left;">${escapeHtml(productNamePackWise(p))}</td>
      <td style="${cellBase}text-align:center;">${escapeHtml(packingDisplay(p))}</td>
      <td style="${cellBase}text-align:center;">${escapeHtml(rateLtr)}</td>
      <td style="${cellBase}text-align:center;">${escapeHtml(rateUnit)}</td>
      <td style="${cellBase}text-align:center;">${escapeHtml(fmtGstPdf(p.gstRate))}</td>
      <td style="${cellBase}text-align:center;">${escapeHtml(displayMrpForPdf(p))}</td>
    </tr>`);
  }

  const innerTable = `
<table style="width:100%;border-collapse:collapse;table-layout:fixed;border:2px solid #000;margin-top:16px;">
  <colgroup>
    <col style="width:30%" />
    <col style="width:14%" />
    <col style="width:12%" />
    <col style="width:12%" />
    <col style="width:12%" />
    <col style="width:20%" />
  </colgroup>
  <thead>
    <tr>
      <th style="${thBase}">Product Name Pack Wise</th>
      <th style="${thBase}">Packing Style</th>
      <th style="${thBase}">Rate per Ltr/Kg</th>
      <th style="${thBase}">Rate per Unit</th>
      <th style="${thBase}">GST Rate</th>
      <th style="${thBase}">MRP per Unit</th>
    </tr>
  </thead>
  <tbody>${bodyRows.join("")}</tbody>
</table>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(
    documentTitle
  )}</title>
<style>
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
  body,
  table,
  th,
  td {
    font-family: "Times New Roman", Times, serif;
  }
  body {
    margin: 0;
    padding: 16px 16px 24px;
    color: #111;
    font-size: 17px;
    line-height: 1.45;
    background: #fff;
  }
  .co-brand {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: nowrap;
    margin: 0;
  }
  .co-logo {
    display: block;
    height: 96px;
    width: auto;
    max-width: 150px;
    object-fit: contain;
    flex-shrink: 0;
    // align-self: center;
    margin-top: 25px;
  }
  .co-name {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    text-align: center;
    font-size: 40px;
    font-weight: 800;
    letter-spacing: 0.5px;
    margin: 0;
    padding: 0;
    text-transform: uppercase;
    align-self: center;
  }
  .co-addr {
    text-align: center;
    font-size: 23px;
    margin: -4px auto 0;
    padding: 0;
    white-space: nowrap;
    overflow: visible;
  }
  .co-addr-inner {
    display: inline-block;
    max-width: 100%;
    white-space: nowrap;
    border-bottom: 2px solid #111;
    padding-bottom: 10px;
    box-sizing: border-box;
  }
  .doc-title {
    text-align: center;
    font-size: 21px;
    font-weight: 700;
    margin: 5px 0 0;
    font-family: "Times New Roman", Times, serif;
  }
</style></head><body>
  <div class="co-brand">
    <img
      class="co-logo"
      src="${escapeHtml(logoSrc)}"
      alt=""
      width="200"
      height="96"
    />
    <div class="co-name">${escapeHtml(companyName)}</div>
  </div>
  <div class="co-addr"><span class="co-addr-inner">| ${escapeHtml(
    addressLine
  )} |</span></div>
  <div class="doc-title">Price List Effective From ${escapeHtml(
    effectiveDateLabel
  )}</div>
  ${innerTable}
</body></html>`;
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
