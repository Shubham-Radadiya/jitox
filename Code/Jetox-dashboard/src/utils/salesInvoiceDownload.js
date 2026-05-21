import dayjs from "dayjs";
import { accountsApi } from "../services/api";
import { findAccountByBusinessName } from "./accountMappers";
import {
  buildPurchaseTaxInvoiceFullDocument,
  PURCHASE_TAX_INVOICE_PAGE_W_PX,
} from "./purchaseTaxInvoicePdf";
import { downloadHtmlDocumentAsPdf } from "./printAndExport";

async function loadPartyAccountByName(partyName) {
  const name = String(partyName || "").trim();
  if (!name) return null;
  try {
    const { data } = await accountsApi.getAll({});
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.accounts)
        ? data.accounts
        : Array.isArray(data?.data)
          ? data.data
          : [];
    return findAccountByBusinessName(list, name);
  } catch {
    return null;
  }
}

/**
 * Map Create Invoice / order invoice editor state → purchase tax-invoice document shape.
 */
export function invoiceEditorToTaxInvoiceDoc({
  invoiceNo,
  issueDate,
  client,
  clientAddress = "",
  paymentMode,
  reference = "",
  description = "",
  lines = [],
  subtotal = 0,
  tax = 0,
  vatYes = true,
  taxPct = 10,
  discount = 0,
  finalPayable = 0,
}) {
  const basePrice = Number(subtotal) || 0;
  const gstAmount = vatYes ? Number(tax) || 0 : 0;
  const totalAmount = Number(finalPayable) || basePrice + gstAmount - (Number(discount) || 0);
  const ratePct = vatYes ? Number(taxPct) || 0 : 0;

  const items = (lines || [])
    .filter((row) => String(row?.name || "").trim())
    .map((row) => {
      const qty = Number(row.qty) || 0;
      const rate = Number(row.rate) || 0;
      const lineSub = Number(row.subtotal) || qty * rate;
      const lineTax = ratePct ? (lineSub * ratePct) / 100 : 0;
      return {
        product: String(row.name).trim(),
        quantity: qty,
        rateParUnit: rate,
        unit: "Nos",
        hsn: "",
        batch: "",
        group: "",
        subtotal: lineSub,
        discountAmt: 0,
        discountPct: 0,
        _lineTax: lineTax,
      };
    });

  const voucherDate = issueDate?.isValid?.()
    ? issueDate.format("YYYY-MM-DD")
    : issueDate
      ? dayjs(issueDate).isValid()
        ? dayjs(issueDate).format("YYYY-MM-DD")
        : String(issueDate)
      : dayjs().format("YYYY-MM-DD");

  const invLabel = String(invoiceNo || "").trim();

  return {
    partyName: String(client || "").trim(),
    invoiceNo: invLabel,
    invoiceNumber: invLabel,
    voucherNo: String(reference || "").trim() || invLabel,
    voucherDate,
    billTo: String(clientAddress || "").trim(),
    shipTo: String(clientAddress || "").trim(),
    shipDifferent: false,
    termsOfPayment: String(paymentMode || "").trim(),
    paymentMode: String(paymentMode || "").trim(),
    termsAndConditions:
      String(description || "").trim() ||
      "Please pay within 15 days of receiving this invoice.",
    narration: String(description || "").trim(),
    items,
    basePrice,
    gstAmount: Math.round(gstAmount),
    totalAmount: Math.round(totalAmount),
    headerDiscount: Math.max(0, Number(discount) || 0),
  };
}

/** Download sales/order invoice using the same Tax Invoice PDF layout as purchase. */
export async function downloadSalesInvoiceEditorPdf(editorState) {
  const doc = invoiceEditorToTaxInvoiceDoc(editorState);
  if (!doc.items.length) {
    throw new Error("Add at least one product line before downloading.");
  }
  if (!String(doc.partyName || "").trim()) {
    throw new Error("Select a client before downloading.");
  }

  const partyAccount = await loadPartyAccountByName(doc.partyName);
  const fullHtml = buildPurchaseTaxInvoiceFullDocument(
    doc,
    partyAccount,
    partyAccount
  );
  const safeInv = String(doc.invoiceNo || doc.voucherNo || "invoice").replace(
    /[/\\?%*:|"<>]/g,
    "-"
  );
  const title = `Tax-Invoice-${safeInv}`;
  await downloadHtmlDocumentAsPdf(fullHtml, `${title}.pdf`, {
    captureWidthPx: PURCHASE_TAX_INVOICE_PAGE_W_PX,
  });
}
