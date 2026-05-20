import dayjs from "dayjs";
import { fmtRupee, parseRupeeCell } from "./voucherRowMappers";

/**
 * Running balance side for party / account ledgers (debit − credit).
 * Positive → Dr, negative → Cr (e.g. supplier payable).
 */
export function formatLedgerRunningBalance(running) {
  const n = Number(running);
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const side = n >= 0 ? "Dr" : "Cr";
  return `${fmtRupee(abs)} ${side}`;
}

/** e.g. "Closing balance: ₹5,155.00 Cr" */
export function formatClosingBalanceLabel(running) {
  const cell = formatLedgerRunningBalance(running);
  if (cell === "—") return "Closing balance: —";
  return `Closing balance: ${cell}`;
}

/**
 * Map DayBook API documents → ledger table rows with a simple running balance.
 */
export function mapDayBooksToLedgerRows(docs) {
  const list = Array.isArray(docs) ? docs : [];
  let running = 0;
  return list.map((d) => {
    const dr = parseRupeeCell(d.debitAmount);
    const cr = parseRupeeCell(d.creditAmount);
    running += dr - cr;
    return {
      _id: d._id,
      Date: d.createdAt ? dayjs(d.createdAt).format("DD-MMM-YY") : "—",
      "Voucher Type": d.voucherType || "—",
      "Voucher No": d.voucherNumber || "—",
      Particulars: d.particulars || "—",
      "Debit ₹": dr ? fmtRupee(dr) : "—",
      "Credit ₹": cr ? fmtRupee(cr) : "—",
      "Balance ₹": formatLedgerRunningBalance(running),
      _runningBalance: running,
    };
  });
}
