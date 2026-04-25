import dayjs from "dayjs";
import { fmtRupee, parseRupeeCell } from "./voucherRowMappers";

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
    const abs = Math.abs(running);
    const side = running >= 0 ? "Dr" : "Cr";
    return {
      _id: d._id,
      Date: d.createdAt ? dayjs(d.createdAt).format("DD-MMM-YY") : "—",
      "Voucher Type": d.voucherType || "—",
      "Voucher No": d.voucherNumber || "—",
      Particulars: d.particulars || "—",
      "Debit ₹": dr ? fmtRupee(dr) : "—",
      "Credit ₹": cr ? fmtRupee(cr) : "—",
      "Balance ₹": `${fmtRupee(abs)} ${side}`,
    };
  });
}
