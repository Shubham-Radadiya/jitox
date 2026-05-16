/**
 * Party ledger debit/credit rules — shared by Day book ledger (per account) and
 * Account Master statement PDFs.
 *
 * Money movement (payment, receipt, journal, cash, bank, expense):
 * - Payment to party, Expense paid to party, Cash/Bank when party is debitFrom → Debit
 * - Receipt from party, Cash/Bank when party is creditTo → Credit
 * - Journal: debit when account is paymentBy; credit when account is paymentTo
 *
 * Trade vouchers (purchase, purchase return) — statement PDF only when moneyOnly is false.
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

function partyNamesFromAccount(account) {
  return {
    accountName: String(account.businessName || "").trim().toLowerCase(),
    personName: String(account.name || "").trim().toLowerCase(),
  };
}

function matchesPartyName(accountName, personName, raw) {
  const n = String(raw || "").trim().toLowerCase();
  return n && (n === accountName || n === personName);
}

/** Align with Bank voucher list: credit side is Cash, debit is not Cash. */
function cashVoucherDisplayType(cv) {
  const credit = String(cv.creditTo || "").trim().toLowerCase();
  const debit = String(cv.debitFrom || "").trim().toLowerCase();
  if (credit === "cash" && debit !== "cash") return "Bank";
  return "Cash";
}

function mapCashAndBankVoucherRows(cashVouchers, accountName, personName) {
  return (cashVouchers || [])
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
      const voucherType = cashVoucherDisplayType(cv);
      return {
        kind: voucherType === "Bank" ? "bank" : "cash",
        _id: cv._id,
        raw: cv,
        date: cv.voucherDate || cv.createdAt,
        dateIso: toIsoDate(cv.voucherDate || cv.createdAt),
        voucherType,
        voucherNo: cv.voucherNumber || "—",
        particulars:
          String(cv.narration || "").trim() ||
          String(cv.particulars || "").trim() ||
          `Debit: ${cv.debitFrom || "—"} · Credit: ${cv.creditTo || "—"}`,
        debit,
        credit,
      };
    });
}

/**
 * @param {{ moneyOnly?: boolean }} [options] — Day book ledger uses moneyOnly: true
 * @returns {Array<{ kind: string, _id: any, raw: any, date: any, dateIso: string, voucherType: string, voucherNo: string, particulars: string, debit: number, credit: number }>}
 */
export function buildPartyTransactionEntries(
  account,
  accountId,
  ledgerSource,
  options = {}
) {
  const { moneyOnly = false } = options;
  const { accountName, personName } = partyNamesFromAccount(account);

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
      return {
        kind: "journal",
        _id: j._id,
        raw: j,
        date: j.date || j.createdAt,
        dateIso: toIsoDate(j.date || j.createdAt),
        voucherType: "Journal",
        voucherNo: j.voucherNo || "—",
        particulars:
          j.remarks ||
          (isBy ? "Journal (payment by)" : "Journal (payment to)"),
        debit: isBy ? parseRupeeCell(j.debitAmount) : 0,
        credit: isBy ? 0 : parseRupeeCell(j.creditAmount),
      };
    });

  const purchaseRows = moneyOnly
    ? []
    : (ledgerSource.purchases || [])
        .filter((pv) => matchesPartyName(accountName, personName, pv.partyName))
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

  const purchaseReturnRows = moneyOnly
    ? []
    : (ledgerSource.purchaseReturns || [])
        .filter((pv) => matchesPartyName(accountName, personName, pv.partyName))
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
    .filter((ex) => matchesPartyName(accountName, personName, ex.paidTo))
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

  const cashAndBankRows = mapCashAndBankVoucherRows(
    ledgerSource.cashVouchers,
    accountName,
    personName
  );

  return [
    ...payRows,
    ...receiptRows,
    ...journalRows,
    ...purchaseRows,
    ...purchaseReturnRows,
    ...expenseRows,
    ...cashAndBankRows,
  ].sort(
    (a, b) =>
      new Date(a.dateIso || 0).getTime() - new Date(b.dateIso || 0).getTime()
  );
}

/** Day book ledger (per account) — money transfer vouchers only. */
export function buildPartyMoneyLedgerEntries(account, accountId, ledgerSource) {
  return buildPartyTransactionEntries(account, accountId, ledgerSource, {
    moneyOnly: true,
  });
}
