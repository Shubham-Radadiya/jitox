/**
 * Party ledger debit/credit rules — shared by Day book ledger (per account) and
 * Account Master statement PDFs.
 *
 * Money movement (payment, receipt, journal, cash, bank, expense):
 * - Payment to party, Expense paid to party → Debit on party
 * - Payment paid from party (bank/cash account) → Credit on that account (money out)
 * - Receipt from party → Credit on party
 * - Cash/Bank transfer: money left (debitFrom) → Credit; money in (creditTo) → Debit
 * - Journal: debit when account is paymentBy; credit when account is paymentTo
 *
 * Trade vouchers (purchase, purchase return, sales, sales return) — party account Dr/Cr:
 * Purchase → Credit, Purchase return → Debit, Sales → Debit, Sales return → Credit.
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
  const openingSource =
    account.openingAmount != null && account.openingAmount !== ""
      ? account.openingAmount
      : account.amount;
  const openingAmount = parseRupeeCell(openingSource);
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

/** Full timestamp for sort — voucher date first, then createdAt (keeps same-day order). */
function resolveLedgerSortAt(raw, preferredDate) {
  const candidates = [
    preferredDate,
    raw?.date,
    raw?.voucherDate,
    raw?.startDate,
    raw?.createdAt,
    raw?.updatedAt,
  ];
  for (const v of candidates) {
    if (v == null || v === "") continue;
    const t = new Date(v).getTime();
    if (Number.isFinite(t)) return t;
  }
  return 0;
}

/** Oldest first; same instant → stable order by voucher id (creation sequence). */
export function compareLedgerEntries(a, b) {
  const ta = Number(a?.sortAt) || 0;
  const tb = Number(b?.sortAt) || 0;
  if (ta !== tb) return ta - tb;
  return String(a?._id ?? "").localeCompare(String(b?._id ?? ""));
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

/** Money vouchers affect the ledger only after they are settled (Paid). */
function isSettledMoneyVoucher(v) {
  return String(v?.status || "").trim().toLowerCase() === "paid";
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
      /** Tally-style: debitFrom = money out → Cr; creditTo = money in → Dr */
      if (df === accountName || df === personName) credit = amt;
      else if (ct === accountName || ct === personName) debit = amt;
      const voucherType = cashVoucherDisplayType(cv);
      const rowDate = cv.voucherDate || cv.createdAt;
      return {
        kind: voucherType === "Bank" ? "bank" : "cash",
        _id: cv._id,
        raw: cv,
        date: rowDate,
        dateIso: toIsoDate(rowDate),
        sortAt: resolveLedgerSortAt(cv, rowDate),
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
 * @returns {Array<{ kind: string, _id: any, raw: any, date: any, dateIso: string, voucherType: string, voucherNo: string, particulars: string, debit: number, credit: number }>}
 */
export function buildPartyTransactionEntries(account, accountId, ledgerSource) {
  const { accountName, personName } = partyNamesFromAccount(account);

  const payRows = (ledgerSource.payments || [])
    .filter((p) => {
      if (!isSettledMoneyVoucher(p)) return false;
      const to = String(p.paymentTo || "").trim().toLowerCase();
      const from = String(p.paymentFrom || "").trim().toLowerCase();
      return (
        (to && (to === accountName || to === personName)) ||
        (from && (from === accountName || from === personName))
      );
    })
    .map((p) => {
      const to = String(p.paymentTo || "").trim().toLowerCase();
      const from = String(p.paymentFrom || "").trim().toLowerCase();
      const isPaidFrom =
        from &&
        (from === accountName || from === personName) &&
        !(to === accountName || to === personName);
      const amt = parseRupeeCell(p.amount);
      const fromLabel = String(p.paymentFrom || "").trim();
      const rowDate = p.date || p.createdAt;
      return {
        kind: "payment",
        _id: p._id,
        raw: p,
        date: rowDate,
        dateIso: toIsoDate(rowDate),
        sortAt: resolveLedgerSortAt(p, rowDate),
        voucherType: "Payment",
        voucherNo: p.voucherNo || "—",
        particulars:
          p.remarks ||
          (isPaidFrom
            ? `Payment from ${fromLabel || "account"}`
            : `Payment to ${p.paymentTo || "account"}`),
        debit: isPaidFrom ? 0 : amt,
        credit: isPaidFrom ? amt : 0,
      };
    });

  const receiptRows = (ledgerSource.receipts || [])
    .filter((r) => {
      if (!isSettledMoneyVoucher(r)) return false;
      const from = String(r.receiptFrom || "").trim().toLowerCase();
      const into = String(r.receivedIn || "").trim().toLowerCase();
      return (
        (from && (from === accountName || from === personName)) ||
        (into && (into === accountName || into === personName))
      );
    })
    .map((r) => {
      const from = String(r.receiptFrom || "").trim().toLowerCase();
      const into = String(r.receivedIn || "").trim().toLowerCase();
      const isReceivedIn =
        into &&
        (into === accountName || into === personName) &&
        !(from === accountName || from === personName);
      const amt = parseRupeeCell(r.amount);
      const intoLabel = String(r.receivedIn || "").trim();
      const rowDate = r.date || r.createdAt;
      return {
        kind: "receipt",
        _id: r._id,
        raw: r,
        date: rowDate,
        dateIso: toIsoDate(rowDate),
        sortAt: resolveLedgerSortAt(r, rowDate),
        voucherType: "Receipt",
        voucherNo: r.voucherNo || "—",
        particulars:
          r.remarks ||
          (isReceivedIn
            ? `Receipt into ${intoLabel || "account"}`
            : `Receipt from ${r.receiptFrom || "account"}`),
        debit: isReceivedIn ? amt : 0,
        credit: isReceivedIn ? 0 : amt,
      };
    });

  const journalRows = (ledgerSource.journals || [])
    .filter(
      (j) =>
        String(j.paymentBy || "") === accountId ||
        String(j.paymentTo || "") === accountId
    )
    .map((j) => {
      const isBy = String(j.paymentBy || "") === accountId;
      const rowDate = j.date || j.createdAt;
      return {
        kind: "journal",
        _id: j._id,
        raw: j,
        date: rowDate,
        dateIso: toIsoDate(rowDate),
        sortAt: resolveLedgerSortAt(j, rowDate),
        voucherType: "Journal",
        voucherNo: j.voucherNo || "—",
        particulars:
          j.remarks ||
          (isBy ? "Journal (payment by)" : "Journal (payment to)"),
        debit: isBy ? parseRupeeCell(j.debitAmount) : 0,
        credit: isBy ? 0 : parseRupeeCell(j.creditAmount),
      };
    });

  const purchaseRows = (ledgerSource.purchases || [])
    .filter((pv) => matchesPartyName(accountName, personName, pv.partyName))
    .map((pv) => {
      const rowDate = pv.voucherDate || pv.createdAt;
      return {
      kind: "purchase",
      _id: pv._id,
      raw: pv,
      date: rowDate,
      dateIso: toIsoDate(rowDate),
      sortAt: resolveLedgerSortAt(pv, rowDate),
      voucherType: "Purchase",
      voucherNo: pv.voucherNo || "—",
      particulars:
        String(pv.narration || pv.transportDetails || "").trim() ||
        `Purchase · ${String(pv.partyName || "").trim() || "Party"}`,
      debit: 0,
      credit: parseRupeeCell(pv.totalAmount),
    };
    });

  const purchaseReturnRows = (ledgerSource.purchaseReturns || [])
    .filter((pv) => matchesPartyName(accountName, personName, pv.partyName))
    .map((pv) => {
      const rowDate = pv.voucherDate || pv.createdAt;
      return {
      kind: "purchaseReturn",
      _id: pv._id,
      raw: pv,
      date: rowDate,
      dateIso: toIsoDate(rowDate),
      sortAt: resolveLedgerSortAt(pv, rowDate),
      voucherType: "Purchase Return",
      voucherNo: pv.voucherNo || "—",
      particulars:
        String(pv.narration || pv.transportDetails || "").trim() ||
        `Purchase return · ${String(pv.partyName || "").trim() || "Party"}`,
      debit: parseRupeeCell(pv.totalAmount),
      credit: 0,
    };
    });

  const salesRows = (ledgerSource.sales || [])
    .filter((sv) => matchesPartyName(accountName, personName, sv.partyName))
    .map((sv) => {
      const rowDate = sv.voucherDate || sv.createdAt;
      return {
        kind: "sales",
        _id: sv._id,
        raw: sv,
        date: rowDate,
        dateIso: toIsoDate(rowDate),
        sortAt: resolveLedgerSortAt(sv, rowDate),
        voucherType: "Sales",
        voucherNo: sv.voucherNo || "—",
        particulars:
          String(sv.narration || sv.transportDetails || "").trim() ||
          `Sales · ${String(sv.partyName || "").trim() || "Party"}`,
        debit: parseRupeeCell(sv.totalAmount),
        credit: 0,
      };
    });

  const salesReturnRows = (ledgerSource.salesReturns || [])
    .filter((sv) => matchesPartyName(accountName, personName, sv.partyName))
    .map((sv) => {
      const rowDate = sv.voucherDate || sv.createdAt;
      return {
        kind: "salesReturn",
        _id: sv._id,
        raw: sv,
        date: rowDate,
        dateIso: toIsoDate(rowDate),
        sortAt: resolveLedgerSortAt(sv, rowDate),
        voucherType: "Sales Return",
        voucherNo: sv.voucherNo || "—",
        particulars:
          String(sv.narration || sv.transportDetails || "").trim() ||
          `Sales return · ${String(sv.partyName || "").trim() || "Party"}`,
        debit: 0,
        credit: parseRupeeCell(sv.totalAmount),
      };
    });

  const expenseRows = (ledgerSource.expenses || [])
    .filter((ex) => matchesPartyName(accountName, personName, ex.paidTo))
    .map((ex) => {
      const rowDate = ex.startDate || ex.createdAt;
      return {
        kind: "expense",
        _id: ex._id,
        raw: ex,
        date: rowDate,
        dateIso: toIsoDate(rowDate),
        sortAt: resolveLedgerSortAt(ex, rowDate),
        voucherType: "Expense",
        voucherNo: ex._id ? `EXP-${String(ex._id).slice(-6)}` : "—",
        particulars:
          [ex.expenseType, ex.description].filter(Boolean).join(" — ") ||
          "Expense",
        debit: parseRupeeCell(ex.amount),
        credit: 0,
      };
    });

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
    ...salesRows,
    ...salesReturnRows,
    ...expenseRows,
    ...cashAndBankRows,
  ].sort(compareLedgerEntries);
}

/** Day book ledger (per account) — money + trade vouchers for the party. */
export function buildPartyMoneyLedgerEntries(account, accountId, ledgerSource) {
  return buildPartyTransactionEntries(account, accountId, ledgerSource);
}

/**
 * Closing balance from ledger rules (debit − credit). Positive = Dr, negative = Cr.
 * Matches LedgerTable running balance after all settled vouchers.
 */
export function computePartyLedgerClosingBalance(
  account,
  accountId,
  ledgerSource
) {
  const { openingAmount, openingIsDebit } = accountOpeningMeta(account);
  let running =
    openingAmount > 0 ? (openingIsDebit ? openingAmount : -openingAmount) : 0;
  const entries = buildPartyMoneyLedgerEntries(
    account,
    accountId,
    ledgerSource || {}
  );
  for (const row of entries) {
    running += (Number(row.debit) || 0) - (Number(row.credit) || 0);
  }
  return running;
}

/** Split closing balance into Account Master Credit / Debit columns (Tally-style). */
export function formatAccountCreditDebitFromRunning(running) {
  const n = Number(running);
  const fmt = (x) =>
    Number(x).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  /** Zero balance = ₹0 Dr — show 0 in Debit only (same as ledger). */
  if (!Number.isFinite(n) || Math.abs(n) < 0.005) {
    return { credit: "—", debit: "0" };
  }
  const abs = Math.abs(n);
  if (n > 0) {
    return { credit: "—", debit: fmt(abs) };
  }
  return { credit: fmt(abs), debit: "—" };
}
