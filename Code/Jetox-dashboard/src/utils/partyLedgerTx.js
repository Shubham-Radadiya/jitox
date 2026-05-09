/**
 * Single place for party (account) ledger debit/credit rules so Day book ledger
 * and statement PDF stay aligned.
 *
 * Convention for this party’s book:
 * - Payment to party, Purchase return, Expense paid to party, Cash when party is debitFrom → Debit
 * - Receipt from party, Purchase (bill), Cash when party is creditTo → Credit
 * - Journal: debitAmount when account is paymentBy; creditAmount when account is paymentTo
 */

import { parseRupeeCell } from "./voucherRowMappers";

export function normalizeList(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  return [];
}

export function accountOpeningMeta(account) {
  const openingAmount = parseRupeeCell(account.amount);
  /** Matches LedgerTable: everything except explicit "credit" is treated as debit opening. */
  const openingIsDebit =
    String(account.balenceType || "").toLowerCase() !== "credit";
  return { openingAmount, openingIsDebit };
}

function toIsoDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/**
 * @returns {Array<{ kind: string, _id: any, raw: any, date: any, dateIso: string, voucherType: string, voucherNo: string, particulars: string, debit: number, credit: number }>}
 */
export function buildPartyTransactionEntries(account, accountId, ledgerSource) {
  const accountName = String(account.businessName || "").trim().toLowerCase();
  const personName = String(account.name || "").trim().toLowerCase();

  const matchesPartyName = (raw) => {
    const n = String(raw || "").trim().toLowerCase();
    return n && (n === accountName || n === personName);
  };

  const payRows = (ledgerSource.payments || [])
    .filter((p) => {
      const to = String(p.paymentTo || "").trim().toLowerCase();
      return to && (to === accountName || to === personName);
    })
    .map((p) => ({
      kind: "payment",
      _id: p._id,
      raw: p,
      date: p.date || p.createdAt,
      dateIso: toIsoDate(p.date || p.createdAt),
      voucherType: "Payment",
      voucherNo: p.voucherNo || "—",
      particulars: p.remarks || `Payment to ${p.paymentTo || "account"}`,
      debit: parseRupeeCell(p.amount),
      credit: 0,
    }));

  const receiptRows = (ledgerSource.receipts || [])
    .filter((r) => {
      const from = String(r.receiptFrom || "").trim().toLowerCase();
      return from && (from === accountName || from === personName);
    })
    .map((r) => ({
      kind: "receipt",
      _id: r._id,
      raw: r,
      date: r.date || r.createdAt,
      dateIso: toIsoDate(r.date || r.createdAt),
      voucherType: "Receipt",
      voucherNo: r.voucherNo || "—",
      particulars: r.remarks || `Receipt from ${r.receiptFrom || "account"}`,
      debit: 0,
      credit: parseRupeeCell(r.amount),
    }));

  const journalRows = (ledgerSource.journals || [])
    .filter(
      (j) =>
        String(j.paymentBy || "") === accountId ||
        String(j.paymentTo || "") === accountId
    )
    .map((j) => {
      const isBy = String(j.paymentBy || "") === accountId;
      const isTo = String(j.paymentTo || "") === accountId;
      return {
        kind: "journal",
        _id: j._id,
        raw: j,
        date: j.date || j.createdAt,
        dateIso: toIsoDate(j.date || j.createdAt),
        voucherType: "Journal",
        voucherNo: j.voucherNo || "—",
        particulars:
          j.remarks || (isBy ? "Journal (payment by)" : "Journal (payment to)"),
        debit: isBy ? parseRupeeCell(j.debitAmount) : 0,
        credit: isTo ? parseRupeeCell(j.creditAmount) : 0,
      };
    });

  const purchaseRows = (ledgerSource.purchases || [])
    .filter((pv) => matchesPartyName(pv.partyName))
    .map((pv) => ({
      kind: "purchase",
      _id: pv._id,
      raw: pv,
      date: pv.voucherDate || pv.createdAt,
      dateIso: toIsoDate(pv.voucherDate || pv.createdAt),
      voucherType: "Purchase",
      voucherNo: pv.voucherNo || "—",
      particulars:
        String(pv.transportDetails || "").trim() ||
        `Purchase · ${String(pv.partyName || "").trim() || "Party"}`,
      debit: 0,
      credit: parseRupeeCell(pv.totalAmount),
    }));

  const purchaseReturnRows = (ledgerSource.purchaseReturns || [])
    .filter((pv) => matchesPartyName(pv.partyName))
    .map((pv) => ({
      kind: "purchaseReturn",
      _id: pv._id,
      raw: pv,
      date: pv.voucherDate || pv.createdAt,
      dateIso: toIsoDate(pv.voucherDate || pv.createdAt),
      voucherType: "Purchase Return",
      voucherNo: pv.voucherNo || "—",
      particulars:
        String(pv.transportDetails || "").trim() ||
        `Purchase return · ${String(pv.partyName || "").trim() || "Party"}`,
      debit: parseRupeeCell(pv.totalAmount),
      credit: 0,
    }));

  const expenseRows = (ledgerSource.expenses || [])
    .filter((ex) => matchesPartyName(ex.paidTo))
    .map((ex) => ({
      kind: "expense",
      _id: ex._id,
      raw: ex,
      date: ex.startDate || ex.createdAt,
      dateIso: toIsoDate(ex.startDate || ex.createdAt),
      voucherType: "Expense",
      voucherNo: ex._id ? `EXP-${String(ex._id).slice(-6)}` : "—",
      particulars:
        [ex.expenseType, ex.description].filter(Boolean).join(" — ") ||
        "Expense",
      debit: parseRupeeCell(ex.amount),
      credit: 0,
    }));

  const cashRows = (ledgerSource.cashVouchers || [])
    .filter((cv) => {
      const df = String(cv.debitFrom || "").trim().toLowerCase();
      const ct = String(cv.creditTo || "").trim().toLowerCase();
      return (
        (df && (df === accountName || df === personName)) ||
        (ct && (ct === accountName || ct === personName))
      );
    })
    .map((cv) => {
      const df = String(cv.debitFrom || "").trim().toLowerCase();
      const ct = String(cv.creditTo || "").trim().toLowerCase();
      const amt = parseRupeeCell(cv.amount);
      let debit = 0;
      let credit = 0;
      if (df === accountName || df === personName) debit = amt;
      else if (ct === accountName || ct === personName) credit = amt;
      return {
        kind: "cash",
        _id: cv._id,
        raw: cv,
        date: cv.createdAt,
        dateIso: toIsoDate(cv.createdAt),
        voucherType: "Cash",
        voucherNo: cv.voucherNumber || "—",
        particulars:
          String(cv.narration || "").trim() ||
          String(cv.particulars || "").trim() ||
          `Debit: ${cv.debitFrom || "—"} · Credit: ${cv.creditTo || "—"}`,
        debit,
        credit,
      };
    });

  return [
    ...payRows,
    ...receiptRows,
    ...journalRows,
    ...purchaseRows,
    ...purchaseReturnRows,
    ...expenseRows,
    ...cashRows,
  ].sort(
    (a, b) =>
      new Date(a.dateIso || 0).getTime() - new Date(b.dateIso || 0).getTime()
  );
}
