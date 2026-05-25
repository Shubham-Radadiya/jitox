/** Purchase / quotation invoice series (matches dashboard purchase form). */
export const PURCHASE_INVOICE_PREFIX = "RH-P-24-25/";

/** Outward sales invoice series. */
export const SALES_INVOICE_PREFIX = "RH-S-24-25/";

/** Sales return credit note series. */
export const SALES_RETURN_INVOICE_PREFIX = "RH-SR-24-25/";

export type NextInvoiceFields = {
  invoicePrefix: string;
  invoiceNumber: string;
  invoiceNo: string;
};

export function parseRhInvoiceSuffix(
  raw: string,
  prefix: string
): number | null {
  const s = String(raw ?? "").trim();
  if (!s.startsWith(prefix)) return null;
  const tail = s.slice(prefix.length).trim();
  const digits = tail.replace(/\D/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

export function nextInvoiceFieldsFromMax(
  prefix: string,
  max: number
): NextInvoiceFields {
  const next = max + 1;
  const invoiceNumber = String(next);
  return {
    invoicePrefix: prefix,
    invoiceNumber,
    invoiceNo: `${prefix}${invoiceNumber}`,
  };
}

/** Bump max sequence from a voucher doc that stores invoiceNo and/or prefix+number. */
export function bumpMaxFromInvoiceDoc(
  max: number,
  prefix: string,
  doc: {
    invoiceNo?: unknown;
    invoicePrefix?: unknown;
    invoiceNumber?: unknown;
  }
): number {
  let m = max;
  const bumpFull = (raw: string) => {
    const n = parseRhInvoiceSuffix(raw, prefix);
    if (n != null) m = Math.max(m, n);
  };
  const bumpParts = (pfx: string, num: string) => {
    const p = String(pfx ?? "").trim() || prefix;
    if (p !== prefix) return;
    const digits = String(num ?? "").replace(/\D/g, "");
    if (!digits) return;
    const n = parseInt(digits, 10);
    if (Number.isFinite(n)) m = Math.max(m, n);
  };
  bumpFull(String(doc?.invoiceNo ?? ""));
  bumpParts(String(doc?.invoicePrefix ?? ""), String(doc?.invoiceNumber ?? ""));
  return m;
}
