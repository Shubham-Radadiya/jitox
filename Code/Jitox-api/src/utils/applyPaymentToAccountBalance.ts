import { Account } from "../models/index";

export function parsePaymentAmount(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[^\d.-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function findAccountByPartyName(partyName: string) {
  const name = String(partyName || "").trim();
  if (!name) return null;
  const rx = new RegExp(`^${escapeRegex(name)}$`, "i");
  return Account.findOne({
    $or: [{ businessName: { $regex: rx } }, { name: { $regex: rx } }],
  });
}

/**
 * Paid payments reduce the party's current balance (`Account.amount`) only.
 * `openingAmount` is frozen for the ledger's first row — set on create / account edit.
 */
export async function applyPaymentToAccountBalance(
  paymentTo: string,
  amount: unknown,
  direction: "apply" | "reverse"
): Promise<void> {
  const account = await findAccountByPartyName(paymentTo);
  if (!account) return;

  const delta = parsePaymentAmount(amount);
  if (delta <= 0) return;

  if (account.openingAmount == null) {
    account.openingAmount = Number(account.amount) || 0;
  }

  const current = Number(account.amount) || 0;
  if (direction === "apply") {
    account.amount = Math.max(0, current - delta);
  } else {
    account.amount = current + delta;
  }
  await account.save();
}

/** Expense paid to a party — same as payment (money out, balance decreases). */
export async function applyExpenseToAccountBalance(
  paidTo: string,
  amount: unknown,
  direction: "apply" | "reverse"
): Promise<void> {
  return applyPaymentToAccountBalance(paidTo, amount, direction);
}

/**
 * Received receipts increase the party's current balance (`Account.amount`) only.
 * `openingAmount` stays fixed for the ledger opening row.
 */
export async function applyReceiptToAccountBalance(
  receiptFrom: string,
  amount: unknown,
  direction: "apply" | "reverse"
): Promise<void> {
  const account = await findAccountByPartyName(receiptFrom);
  if (!account) return;

  const delta = parsePaymentAmount(amount);
  if (delta <= 0) return;

  if (account.openingAmount == null) {
    account.openingAmount = Number(account.amount) || 0;
  }

  const current = Number(account.amount) || 0;
  if (direction === "apply") {
    account.amount = current + delta;
  } else {
    account.amount = Math.max(0, current - delta);
  }
  await account.save();
}

function isCashLedgerName(name: string): boolean {
  return String(name || "").trim().toLowerCase() === "cash";
}

/**
 * Cash ↔ bank transfer: party debited → balance decreases; party credited → increases.
 * Literal `Cash` is not an Account Master row and is skipped.
 */
/**
 * Journal: `paymentBy` is debited (decrease), `paymentTo` is credited (increase).
 * Uses Account ids from the journal voucher.
 */
export async function applyJournalToAccountBalances(
  paymentById: unknown,
  paymentToId: unknown,
  amount: unknown,
  direction: "apply" | "reverse"
): Promise<void> {
  const amt = parsePaymentAmount(amount);
  if (amt <= 0) return;

  const byId = String(paymentById ?? "").trim();
  const toId = String(paymentToId ?? "").trim();

  const adjustById = async (
    id: string,
    mode: "decrease" | "increase"
  ): Promise<void> => {
    if (!id) return;
    const account = await Account.findById(id);
    if (!account) return;
    if (account.openingAmount == null) {
      account.openingAmount = Number(account.amount) || 0;
    }
    const current = Number(account.amount) || 0;
    if (direction === "apply") {
      account.amount =
        mode === "decrease"
          ? Math.max(0, current - amt)
          : current + amt;
    } else {
      account.amount =
        mode === "decrease"
          ? current + amt
          : Math.max(0, current - amt);
    }
    await account.save();
  };

  await adjustById(byId, "decrease");
  await adjustById(toId, "increase");
}

export async function applyCashBankTransferToAccounts(
  debitFrom: unknown,
  creditTo: unknown,
  amount: unknown,
  direction: "apply" | "reverse"
): Promise<void> {
  const debit = String(debitFrom ?? "").trim();
  const credit = String(creditTo ?? "").trim();

  if (debit && !isCashLedgerName(debit)) {
    await applyPaymentToAccountBalance(debit, amount, direction);
  }
  if (credit && !isCashLedgerName(credit)) {
    await applyReceiptToAccountBalance(credit, amount, direction);
  }
}

/**
 * Party ledger credit (purchase, sales) — outstanding increases (`Account.amount` up).
 * Mirrors receipt-side money in.
 */
export async function applyPartyLedgerCreditToAccountBalance(
  partyName: string,
  amount: unknown,
  direction: "apply" | "reverse"
): Promise<void> {
  return applyReceiptToAccountBalance(partyName, amount, direction);
}

/**
 * Party ledger debit (purchase return, sales return) — outstanding decreases.
 * Mirrors payment-side money out.
 */
export async function applyPartyLedgerDebitToAccountBalance(
  partyName: string,
  amount: unknown,
  direction: "apply" | "reverse"
): Promise<void> {
  return applyPaymentToAccountBalance(partyName, amount, direction);
}

export async function reconcilePartyLedgerCreditOnVoucherChange(
  prevParty: string,
  prevAmount: unknown,
  nextParty: string,
  nextAmount: unknown
): Promise<void> {
  const partyChanged =
    String(prevParty || "").trim().toLowerCase() !==
    String(nextParty || "").trim().toLowerCase();
  const amtChanged =
    parsePaymentAmount(prevAmount) !== parsePaymentAmount(nextAmount);
  if (partyChanged || amtChanged) {
    await applyPartyLedgerCreditToAccountBalance(
      prevParty,
      prevAmount,
      "reverse"
    );
    await applyPartyLedgerCreditToAccountBalance(
      nextParty,
      nextAmount,
      "apply"
    );
  }
}

export async function reconcilePartyLedgerDebitOnVoucherChange(
  prevParty: string,
  prevAmount: unknown,
  nextParty: string,
  nextAmount: unknown
): Promise<void> {
  const partyChanged =
    String(prevParty || "").trim().toLowerCase() !==
    String(nextParty || "").trim().toLowerCase();
  const amtChanged =
    parsePaymentAmount(prevAmount) !== parsePaymentAmount(nextAmount);
  if (partyChanged || amtChanged) {
    await applyPartyLedgerDebitToAccountBalance(
      prevParty,
      prevAmount,
      "reverse"
    );
    await applyPartyLedgerDebitToAccountBalance(
      nextParty,
      nextAmount,
      "apply"
    );
  }
}
