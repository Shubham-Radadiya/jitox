import { DayBook } from "../models/index";

/**
 * Shape accepted by {@link logDayBookEntry}. The day book stores debit/credit as
 * strings, but callers usually have numeric totals — both are accepted and
 * normalized here so callers don't have to coerce types at every call site.
 */
export interface DayBookEntryInput {
  voucherNumber: string;
  voucherType: string;
  particulars: string;
  debitAmount: string | number;
  creditAmount: string | number;
}

const toAmountString = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return "0";
  const str = typeof value === "number" ? String(value) : String(value).trim();
  return str.length > 0 ? str : "0";
};

/**
 * Day book list shows one row per voucher — amount belongs in debit OR credit,
 * not both. Callers often pass the same total twice (double-entry); we split by type.
 */
export function resolveDayBookAmounts(
  voucherType: string,
  debitAmount: string | number,
  creditAmount: string | number
): { debitAmount: string; creditAmount: string } {
  const d = toAmountString(debitAmount);
  const c = toAmountString(creditAmount);
  const amt =
    d !== "0" ? d : c !== "0" ? c : "0";

  if (d !== c || amt === "0") {
    return { debitAmount: d, creditAmount: c };
  }

  const t = String(voucherType || "").trim().toLowerCase();

  if (t === "receipt" || t === "sales" || t === "sales return") {
    return { debitAmount: "0", creditAmount: amt };
  }
  if (t === "purchase return") {
    return { debitAmount: "0", creditAmount: amt };
  }
  if (t === "payment" || t === "purchase" || t === "expense") {
    return { debitAmount: amt, creditAmount: "0" };
  }

  return { debitAmount: amt, creditAmount: "0" };
}

/**
 * Upsert a day book entry keyed by `voucherNumber`. Used by voucher create /
 * update flows so the day book always mirrors the latest voucher state without
 * the caller having to know whether a row already exists.
 *
 * Failures are caught and logged: the day book is an audit side effect and
 * should never break the primary voucher write.
 */
export const logDayBookEntry = async (
  entry: DayBookEntryInput
): Promise<void> => {
  if (!entry || !entry.voucherNumber) return;

  try {
    const { debitAmount, creditAmount } = resolveDayBookAmounts(
      entry.voucherType,
      entry.debitAmount,
      entry.creditAmount
    );
    await DayBook.findOneAndUpdate(
      { voucherNumber: entry.voucherNumber },
      {
        $set: {
          voucherNumber: entry.voucherNumber,
          voucherType: entry.voucherType,
          particulars: entry.particulars,
          debitAmount,
          creditAmount,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error("logDayBookEntry failed", {
      voucherNumber: entry.voucherNumber,
      err,
    });
  }
};

/**
 * Delete the day book entry tied to a given voucher number. Safe to call even
 * if the row doesn't exist — used by voucher delete flows.
 */
export const removeDayBookEntry = async (
  voucherNumber: string | undefined | null
): Promise<void> => {
  if (!voucherNumber) return;

  try {
    await DayBook.deleteOne({ voucherNumber });
  } catch (err) {
    console.error("removeDayBookEntry failed", { voucherNumber, err });
  }
};
