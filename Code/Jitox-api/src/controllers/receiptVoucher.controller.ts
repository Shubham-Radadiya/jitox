import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  Account,
  PurchaseReturnVoucher,
  Quotation,
  ReceiptVoucher,
  SalesVoucher,
} from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { logDayBookEntry, removeDayBookEntry } from "../utils/dayBookLogger";
import { parsePaymentAmount } from "../utils/applyPaymentToAccountBalance";
import {
  receiptLedgerSnapshot,
  reconcileReceiptVoucherLedgers,
  resolveReceiptThroughFields,
} from "../utils/receiptVoucherLedger";
import { recomputeLinkedPurchaseReturnRefund } from "../utils/purchaseReturnRefundStatus";
import {
  assertCollectionNotFullyPaid,
  clearReceiptLinksAfterDelete,
  recomputeLinkedQuotationReceipt,
  setReceiptLinksAfterCreate,
  syncQuotationPaymentFromSale,
  syncSalePaymentFromQuotation,
} from "../utils/receiptQuotationLedger";

const RECEIPT_VOUCHER_PATCH_KEYS = [
  "voucherNo",
  "date",
  "receiptThrough",
  "receiptFrom",
  "receivedIn",
  "amount",
  "remarks",
  "status",
] as const;

function parseAmountToNumber(value: unknown): number {
  return parsePaymentAmount(value);
}

async function computeNextReceiptVoucherNo(): Promise<string> {
  const docs = await ReceiptVoucher.find().select("voucherNo").lean();
  let max = 0;
  const re = /^JITOX-DEMO-REC-(\d+)$/i;
  for (const d of docs) {
    const v = String(d?.voucherNo ?? "").trim();
    const m = re.exec(v);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }
  }
  return `JITOX-DEMO-REC-${String(max + 1).padStart(3, "0")}`;
}

async function resolveUniqueReceiptVoucherNo(
  requested?: string
): Promise<string> {
  const base = String(requested || "").trim();
  if (base) {
    const taken = await ReceiptVoucher.findOne({ voucherNo: base });
    if (!taken) return base;
  }
  for (let i = 0; i < 60; i++) {
    const candidate = await computeNextReceiptVoucherNo();
    const taken = await ReceiptVoucher.findOne({ voucherNo: candidate });
    if (!taken) return candidate;
  }
  return `JITOX-DEMO-REC-${Date.now()}`;
}

function reconcileSalesFromReceipt(
  sale: InstanceType<typeof SalesVoucher>,
  receiptAmount: number,
  direction: "apply" | "reverse"
): void {
  const total = Number(sale.totalAmount) || 0;
  const current = Number(sale.paidAmount) || 0;
  const delta = parseAmountToNumber(receiptAmount);

  if (direction === "apply") {
    sale.paidAmount = Math.min(total, current + delta);
  } else {
    sale.paidAmount = Math.max(0, current - delta);
  }

  const paid = Number(sale.paidAmount) || 0;
  if (paid >= total && total > 0) {
    sale.paymentStatus = "Paid";
  } else if (paid > 0) {
    sale.paymentStatus = "Partial";
  } else {
    sale.paymentStatus = "Pending";
  }
}

async function applyReceiptToLinkedSale(
  receipt: InstanceType<typeof ReceiptVoucher>,
  direction: "apply" | "reverse"
): Promise<void> {
  if (!receipt.sourceSalesId) return;
  const sale = await SalesVoucher.findById(receipt.sourceSalesId);
  if (!sale) return;
  reconcileSalesFromReceipt(
    sale,
    parseAmountToNumber(receipt.amount),
    direction
  );
  await sale.save();
  await syncQuotationPaymentFromSale(sale._id);
}

export const createReceiptVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      voucherNo,
      date,
      receiptThrough,
      receiptFrom,
      receivedIn,
      amount,
      remarks,
      status,
      sourceSalesId,
      sourcePurchaseReturnId,
      sourceQuotationId,
    } = req.body;

    const requiredFields = ["date", "receiptFrom", "amount"] as const;
    validateAndRespond(req.body, requiredFields, res);

    const nextStatus = String(status || "Pending");
    if (nextStatus === "Paid" && !String(receivedIn || "").trim()) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Please select Received in (bank or cash account) when status is Received."
      );
    }

    const throughFields = await resolveReceiptThroughFields(
      String(receivedIn || ""),
      receiptThrough
    );

    const hasSales =
      sourceSalesId && mongoose.isValidObjectId(sourceSalesId);
    const hasQuotation =
      sourceQuotationId && mongoose.isValidObjectId(sourceQuotationId);
    const hasPurchaseReturn =
      sourcePurchaseReturnId &&
      mongoose.isValidObjectId(sourcePurchaseReturnId);

    if (hasPurchaseReturn && (hasSales || hasQuotation)) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Link receipt to only one source voucher (sales, purchase return, or order)."
      );
    }
    if (hasSales && hasQuotation) {
      const saleForPair = await SalesVoucher.findById(sourceSalesId).select(
        "sourceQuotationId"
      );
      if (
        !saleForPair?.sourceQuotationId ||
        String(saleForPair.sourceQuotationId) !== String(sourceQuotationId)
      ) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          "Sales and order links do not match."
        );
      }
    }

    let linkedSalesId: mongoose.Types.ObjectId | null = null;
    if (hasSales) {
      const sale = await SalesVoucher.findById(sourceSalesId).select(
        "_id sourceQuotationId paidAmount totalAmount paymentStatus"
      );
      if (!sale) {
        throw new AppError(
          HttpStatusCode.NOT_FOUND,
          "Linked sales voucher not found."
        );
      }
      const saleTotal = Number(sale.totalAmount) || 0;
      const salePaid = Number(sale.paidAmount) || 0;
      if (
        saleTotal > 0 &&
        (salePaid >= saleTotal ||
          String(sale.paymentStatus || "").trim() === "Paid")
      ) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          "This sales invoice is already fully paid."
        );
      }
      linkedSalesId = sale._id as mongoose.Types.ObjectId;
    }

    let linkedPurchaseReturnId: mongoose.Types.ObjectId | null = null;
    if (
      sourcePurchaseReturnId &&
      mongoose.isValidObjectId(sourcePurchaseReturnId)
    ) {
      const pr = await PurchaseReturnVoucher.findById(
        sourcePurchaseReturnId
      ).select("refundRequestId partyName");
      if (!pr) {
        throw new AppError(
          HttpStatusCode.NOT_FOUND,
          "Linked purchase return voucher not found."
        );
      }
      if (pr.refundRequestId) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          "A receipt voucher already exists for this purchase return."
        );
      }
      linkedPurchaseReturnId = pr._id as mongoose.Types.ObjectId;
    }

    let linkedQuotationId: mongoose.Types.ObjectId | null = null;
    if (hasQuotation) {
      const quotation = await Quotation.findById(sourceQuotationId).select(
        "paidAmount totalAmount partyName receiptRequestId"
      );
      if (!quotation) {
        throw new AppError(
          HttpStatusCode.NOT_FOUND,
          "Linked order (quotation) not found."
        );
      }
      const total = Number(quotation.totalAmount) || 0;
      const paid = Number(quotation.paidAmount) || 0;
      if (total > 0 && paid >= total) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          "This order is already fully paid."
        );
      }
      linkedQuotationId = quotation._id as mongoose.Types.ObjectId;
    } else if (linkedSalesId) {
      const sale = await SalesVoucher.findById(linkedSalesId).select(
        "sourceQuotationId"
      );
      if (
        sale?.sourceQuotationId &&
        mongoose.isValidObjectId(sale.sourceQuotationId)
      ) {
        linkedQuotationId = new mongoose.Types.ObjectId(
          String(sale.sourceQuotationId)
        );
      }
    }

    await assertCollectionNotFullyPaid({
      sourceSalesId: linkedSalesId,
      sourceQuotationId: linkedQuotationId,
    });

    const resolvedVoucherNo = await resolveUniqueReceiptVoucherNo(voucherNo);

    const newVoucher = new ReceiptVoucher({
      voucherNo: resolvedVoucherNo,
      date,
      receiptThrough: throughFields.receiptThrough,
      receiptFrom,
      receivedIn: throughFields.receivedIn,
      amount,
      remarks,
      status: nextStatus,
      sourceSalesId: linkedSalesId,
      sourcePurchaseReturnId: linkedPurchaseReturnId,
      sourceQuotationId: linkedQuotationId,
    });

    const savedVoucher = await newVoucher.save();

    if (linkedPurchaseReturnId) {
      await PurchaseReturnVoucher.findByIdAndUpdate(linkedPurchaseReturnId, {
        $set: { refundRequestId: savedVoucher._id },
      });
      await recomputeLinkedPurchaseReturnRefund(linkedPurchaseReturnId);
    }

    if (nextStatus === "Paid") {
      await reconcileReceiptVoucherLedgers(
        receiptLedgerSnapshot({ status: "Pending" }),
        receiptLedgerSnapshot(savedVoucher)
      );
    }

    if (nextStatus === "Paid") {
      if (linkedSalesId) {
        await applyReceiptToLinkedSale(savedVoucher, "apply");
      } else if (linkedQuotationId) {
        await recomputeLinkedQuotationReceipt(linkedQuotationId);
      }
    }

    await setReceiptLinksAfterCreate(savedVoucher._id, {
      sourceSalesId: linkedSalesId,
      sourceQuotationId: linkedQuotationId,
    });

    const intoLabel = throughFields.receivedIn
      ? ` into ${throughFields.receivedIn}`
      : "";
    await logDayBookEntry({
      voucherNumber: savedVoucher.voucherNo as unknown as string,
      voucherType: "Receipt",
      particulars: `${receiptFrom} — receipt${intoLabel}${
        throughFields.receiptThrough
          ? ` (${throughFields.receiptThrough})`
          : ""
      }`,
      debitAmount: amount,
      creditAmount: amount,
    });

    sendCreated(res, savedVoucher, "Receipt voucher created successfully.");
  } catch (error) {
    console.error("Create Receipt Voucher Error:", error);
    throw error;
  }
};

export const getAllReceiptVouchers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, receiptFrom, date, statusPriority } = req.query;

    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (receiptFrom) {
      filter.receiptFrom = { $regex: receiptFrom as string, $options: "i" };
    }
    if (date) {
      const selectedDate = new Date(date as string);
      const nextDate = new Date(selectedDate);
      nextDate.setDate(selectedDate.getDate() + 1);
      filter.date = { $gte: selectedDate, $lt: nextDate };
    }

    let vouchers = await ReceiptVoucher.find(filter);

    if (statusPriority) {
      vouchers.sort((a, b) => {
        if (a.status === statusPriority && b.status !== statusPriority)
          return -1;
        if (a.status !== statusPriority && b.status === statusPriority)
          return 1;
        return 0;
      });
    } else {
      vouchers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const totalAmount = vouchers.reduce((sum, voucher) => {
      return sum + parseAmountToNumber(voucher.amount);
    }, 0);

    sendSuccess(
      res,
      {
        count: vouchers.length,
        data: vouchers,
        totalAmount,
      },
      vouchers.length ? "" : "No receipt vouchers found."
    );
  } catch (error) {
    console.error("Get All Receipt Vouchers Error:", error);
    throw error;
  }
};

export const getReceiptById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const receiptVoucher = await ReceiptVoucher.findById(id);
    if (!receiptVoucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Receipt Voucher not found."
      );
    }

    sendSuccess(res, receiptVoucher);
  } catch (error) {
    console.error("Get Receipt By ID Error:", error);
    throw error;
  }
};

export const updateReceiptVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const raw = req.body as Record<string, unknown>;

    const voucher = await ReceiptVoucher.findById(id);
    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Receipt voucher not found."
      );
    }

    if (
      typeof raw.voucherNo === "string" &&
      raw.voucherNo.trim() &&
      raw.voucherNo.trim() !== voucher.voucherNo
    ) {
      const clash = await ReceiptVoucher.findOne({
        voucherNo: raw.voucherNo.trim(),
        _id: { $ne: id },
      });
      if (clash) {
        throw new AppError(
          HttpStatusCode.BAD_REQUEST,
          "Voucher number already exists."
        );
      }
    }

    const previousSnap = receiptLedgerSnapshot(voucher);
    const patch: Record<string, unknown> = {};
    for (const key of RECEIPT_VOUCHER_PATCH_KEYS) {
      if (Object.prototype.hasOwnProperty.call(raw, key)) {
        patch[key] = raw[key];
      }
    }

    const mergedReceivedIn = Object.prototype.hasOwnProperty.call(
      patch,
      "receivedIn"
    )
      ? String(patch.receivedIn || "")
      : String(voucher.receivedIn || "");
    const mergedThrough = Object.prototype.hasOwnProperty.call(
      patch,
      "receiptThrough"
    )
      ? patch.receiptThrough
      : voucher.receiptThrough;
    const throughFields = await resolveReceiptThroughFields(
      mergedReceivedIn,
      mergedThrough
    );
    patch.receivedIn = throughFields.receivedIn;
    patch.receiptThrough = throughFields.receiptThrough;

    const nextStatus = Object.prototype.hasOwnProperty.call(patch, "status")
      ? String(patch.status || "")
      : String(voucher.status || "");
    if (nextStatus === "Paid" && !throughFields.receivedIn) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Please select Received in (bank or cash account) when status is Received."
      );
    }

    voucher.set(patch);
    await voucher.save();

    await reconcileReceiptVoucherLedgers(
      previousSnap,
      receiptLedgerSnapshot(voucher)
    );

    const previousStatus = previousSnap.status;
    const nextStatusAfter = String(voucher.status || "");

    if (voucher.sourcePurchaseReturnId) {
      await recomputeLinkedPurchaseReturnRefund(voucher.sourcePurchaseReturnId);
    }

    if (voucher.sourceSalesId && previousStatus !== nextStatusAfter) {
      if (nextStatusAfter === "Paid" && previousStatus !== "Paid") {
        await applyReceiptToLinkedSale(voucher, "apply");
      } else if (previousStatus === "Paid" && nextStatusAfter !== "Paid") {
        await applyReceiptToLinkedSale(voucher, "reverse");
      }
    } else if (
      voucher.sourceQuotationId &&
      previousStatus !== nextStatusAfter
    ) {
      await recomputeLinkedQuotationReceipt(voucher.sourceQuotationId);
    }

    const intoLabel = String(voucher.receivedIn || "").trim()
      ? ` into ${voucher.receivedIn}`
      : "";
    await logDayBookEntry({
      voucherNumber: voucher.voucherNo as unknown as string,
      voucherType: "Receipt",
      particulars: `${voucher.receiptFrom} — receipt${intoLabel}${
        voucher.receiptThrough ? ` (${voucher.receiptThrough})` : ""
      }`,
      debitAmount: voucher.amount as unknown as string,
      creditAmount: voucher.amount as unknown as string,
    });

    sendSuccess(res, voucher, "Receipt voucher updated successfully.");
  } catch (error) {
    console.error("Update Receipt Voucher Error:", error);
    throw error;
  }
};

export const deleteReceiptVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await ReceiptVoucher.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Receipt voucher not found."
      );
    }

    if (
      String((deleted as InstanceType<typeof ReceiptVoucher>).status || "") ===
      "Paid"
    ) {
      await reconcileReceiptVoucherLedgers(
        receiptLedgerSnapshot(deleted as InstanceType<typeof ReceiptVoucher>),
        receiptLedgerSnapshot({ status: "Pending" })
      );
    }

    const deletedReceipt = deleted as InstanceType<typeof ReceiptVoucher>;
    const wasPaid = String(deletedReceipt.status || "") === "Paid";

    if (deletedReceipt.sourceSalesId && wasPaid) {
      await applyReceiptToLinkedSale(deletedReceipt, "reverse");
    }

    if (deletedReceipt.sourcePurchaseReturnId) {
      const prId = (deleted as InstanceType<typeof ReceiptVoucher>)
        .sourcePurchaseReturnId;
      const pr = await PurchaseReturnVoucher.findById(prId).select(
        "refundRequestId"
      );
      if (
        pr &&
        pr.refundRequestId &&
        String(pr.refundRequestId) === String((deleted as any)._id)
      ) {
        pr.refundRequestId = undefined;
        await pr.save();
      }
      await recomputeLinkedPurchaseReturnRefund(prId);
    }

    if (deletedReceipt.sourceQuotationId && wasPaid && !deletedReceipt.sourceSalesId) {
      await recomputeLinkedQuotationReceipt(deletedReceipt.sourceQuotationId);
    }

    await clearReceiptLinksAfterDelete(deletedReceipt);

    await removeDayBookEntry(deletedReceipt.voucherNo as unknown as string);

    sendSuccess(res, null, "Receipt voucher deleted successfully.");
  } catch (error) {
    console.error("Delete Receipt Voucher Error:", error);
    throw error;
  }
};

export const getReceiptFormMeta = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const accounts = await Account.find({
      customerStatus: { $ne: "Inactive" },
    })
      .select("businessName name accountType")
      .sort({ businessName: 1 })
      .lean();

    const seenParty = new Set<string>();
    const parties: { value: string; label: string }[] = [];
    const seenReceivedIn = new Set<string>();
    const receivedInAccounts: { value: string; label: string }[] = [];
    const RECEIVED_IN_TYPES = new Set(["BankAccounts", "CashInHand"]);

    for (const a of accounts) {
      const name = String(a?.businessName ?? a?.name ?? "").trim();
      if (!name) continue;
      if (!seenParty.has(name)) {
        seenParty.add(name);
        parties.push({ value: name, label: name });
      }
      const acctType = String(a?.accountType ?? "").trim();
      if (RECEIVED_IN_TYPES.has(acctType) && !seenReceivedIn.has(name)) {
        seenReceivedIn.add(name);
        receivedInAccounts.push({ value: name, label: name });
      }
    }

    if (!seenReceivedIn.has("Cash")) {
      receivedInAccounts.unshift({ value: "Cash", label: "Cash" });
    }

    let nextReceiptVoucherNo = "JITOX-DEMO-REC-001";
    try {
      nextReceiptVoucherNo = await computeNextReceiptVoucherNo();
    } catch (e) {
      console.error("computeNextReceiptVoucherNo", e);
    }

    sendSuccess(res, { nextReceiptVoucherNo, parties, receivedInAccounts });
  } catch (error) {
    console.error("getReceiptFormMeta", error);
    res
      .status(500)
      .json({ message: "Failed to load receipt voucher form meta." });
  }
};
