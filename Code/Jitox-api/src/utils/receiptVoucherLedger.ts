import {
  applyReceiptToAccountBalance,
  findAccountByPartyName,
  parsePaymentAmount,
} from "./applyPaymentToAccountBalance";
import { inferPaymentThrough, isGenericCashLedger } from "./paymentVoucherLedger";

/** Money into bank / cash-in-hand — skip generic "Cash" with no Account row. */
export async function applyReceivedInAccountBalance(
  receivedIn: string,
  amount: unknown,
  direction: "apply" | "reverse"
): Promise<void> {
  const name = String(receivedIn || "").trim();
  if (!name || isGenericCashLedger(name)) return;
  await applyReceiptToAccountBalance(name, amount, direction);
}

export async function resolveReceiptThroughFields(
  receivedIn: string,
  receiptThrough?: unknown
): Promise<{ receivedIn: string; receiptThrough: "Cash" | "Bank" }> {
  const into = String(receivedIn || "").trim();
  const explicit = String(receiptThrough || "").trim();
  if (explicit === "Cash" || explicit === "Bank") {
    return { receivedIn: into, receiptThrough: explicit };
  }
  if (!into) {
    return { receivedIn: into, receiptThrough: "Cash" };
  }
  const account = await findAccountByPartyName(into);
  return {
    receivedIn: into,
    receiptThrough: inferPaymentThrough(into, account?.accountType),
  };
}

export type ReceiptLedgerSnapshot = {
  status: string;
  receiptFrom: string;
  receivedIn: string;
  amount: unknown;
};

export async function reconcileReceiptVoucherLedgers(
  previous: ReceiptLedgerSnapshot,
  next: ReceiptLedgerSnapshot
): Promise<void> {
  const wasPaid = String(previous.status || "") === "Paid";
  const isPaid = String(next.status || "") === "Paid";

  const reversePaid = async (snap: ReceiptLedgerSnapshot) => {
    await applyReceiptToAccountBalance(
      snap.receiptFrom,
      snap.amount,
      "reverse"
    );
    await applyReceivedInAccountBalance(
      snap.receivedIn,
      snap.amount,
      "reverse"
    );
  };

  const applyPaid = async (snap: ReceiptLedgerSnapshot) => {
    await applyReceiptToAccountBalance(
      snap.receiptFrom,
      snap.amount,
      "apply"
    );
    await applyReceivedInAccountBalance(
      snap.receivedIn,
      snap.amount,
      "apply"
    );
  };

  if (wasPaid && !isPaid) {
    await reversePaid(previous);
    return;
  }
  if (!wasPaid && isPaid) {
    await applyPaid(next);
    return;
  }
  if (wasPaid && isPaid) {
    const fromChanged =
      String(previous.receiptFrom || "").trim().toLowerCase() !==
      String(next.receiptFrom || "").trim().toLowerCase();
    const intoChanged =
      String(previous.receivedIn || "").trim().toLowerCase() !==
      String(next.receivedIn || "").trim().toLowerCase();
    const amtChanged =
      parsePaymentAmount(previous.amount) !== parsePaymentAmount(next.amount);
    if (fromChanged || intoChanged || amtChanged) {
      await reversePaid(previous);
      await applyPaid(next);
    }
  }
}

export function receiptLedgerSnapshot(doc: {
  status?: unknown;
  receiptFrom?: unknown;
  receivedIn?: unknown;
  amount?: unknown;
}): ReceiptLedgerSnapshot {
  return {
    status: String(doc.status || ""),
    receiptFrom: String(doc.receiptFrom || ""),
    receivedIn: String(doc.receivedIn || ""),
    amount: doc.amount,
  };
}
