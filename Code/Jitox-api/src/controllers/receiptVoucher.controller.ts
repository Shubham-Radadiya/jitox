import { Request, Response } from "express";
import mongoose from "mongoose";
import { Account, ReceiptVoucher, SalesVoucher } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { logDayBookEntry, removeDayBookEntry } from "../utils/dayBookLogger";
import {
  applyReceiptToAccountBalance,
  parsePaymentAmount,
} from "../utils/applyPaymentToAccountBalance";

const RECEIPT_VOUCHER_PATCH_KEYS = [
  "voucherNo",
  "date",
  "receiptThrough",
  "receiptFrom",
  "amount",
  "remarks",
  "status",
] as const;

function parseAmountToNumber(value: unknown): number {
  return parsePaymentAmount(value);
}

async function reconcileAccountFromReceiptChange(
  previousStatus: string,
  nextStatus: string,
  prevReceiptFrom: string,
  prevAmount: unknown,
  nextReceiptFrom: string,
  nextAmount: unknown
): Promise<void> {
  const wasPaid = previousStatus === "Paid";
  const isPaid = nextStatus === "Paid";

  if (wasPaid && !isPaid) {
    await applyReceiptToAccountBalance(prevReceiptFrom, prevAmount, "reverse");
    return;
  }
  if (!wasPaid && isPaid) {
    await applyReceiptToAccountBalance(nextReceiptFrom, nextAmount, "apply");
    return;
  }
  if (wasPaid && isPaid) {
    const toChanged =
      String(prevReceiptFrom || "").trim().toLowerCase() !==
      String(nextReceiptFrom || "").trim().toLowerCase();
    const amtChanged =
      parsePaymentAmount(prevAmount) !== parsePaymentAmount(nextAmount);
    if (toChanged || amtChanged) {
      await applyReceiptToAccountBalance(prevReceiptFrom, prevAmount, "reverse");
      await applyReceiptToAccountBalance(nextReceiptFrom, nextAmount, "apply");
    }
  }
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
      amount,
      remarks,
      status,
      sourceSalesId,
    } = req.body;

    const requiredFields = ["date", "receiptFrom", "amount"] as const;
    validateAndRespond(req.body, requiredFields, res);

    let linkedSalesId: mongoose.Types.ObjectId | null = null;
    if (sourceSalesId && mongoose.isValidObjectId(sourceSalesId)) {
      const sale = await SalesVoucher.findById(sourceSalesId).select("_id");
      if (!sale) {
        throw new AppError(
          HttpStatusCode.NOT_FOUND,
          "Linked sales voucher not found."
        );
      }
      linkedSalesId = sale._id as mongoose.Types.ObjectId;
    }

    const resolvedVoucherNo = await resolveUniqueReceiptVoucherNo(voucherNo);
    const nextStatus = String(status || "Pending");

    const newVoucher = new ReceiptVoucher({
      voucherNo: resolvedVoucherNo,
      date,
      receiptThrough: receiptThrough || "Cash",
      receiptFrom,
      amount,
      remarks,
      status: nextStatus,
      sourceSalesId: linkedSalesId,
    });

    const savedVoucher = await newVoucher.save();

    if (nextStatus === "Paid") {
      await applyReceiptToAccountBalance(
        String(savedVoucher.receiptFrom || ""),
        savedVoucher.amount,
        "apply"
      );
    }

    if (linkedSalesId && nextStatus === "Paid") {
      await applyReceiptToLinkedSale(savedVoucher, "apply");
    }

    await logDayBookEntry({
      voucherNumber: savedVoucher.voucherNo as unknown as string,
      voucherType: "Receipt",
      particulars: `${receiptFrom} — receipt${
        receiptThrough ? ` (${receiptThrough})` : ""
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

    const previousStatus = String(voucher.status || "");
    const prevReceiptFrom = String(voucher.receiptFrom || "");
    const prevAmount = voucher.amount;
    const patch: Record<string, unknown> = {};
    for (const key of RECEIPT_VOUCHER_PATCH_KEYS) {
      if (Object.prototype.hasOwnProperty.call(raw, key)) {
        patch[key] = raw[key];
      }
    }

    voucher.set(patch);
    await voucher.save();

    const nextStatus = String(voucher.status || "");

    await reconcileAccountFromReceiptChange(
      previousStatus,
      nextStatus,
      prevReceiptFrom,
      prevAmount,
      String(voucher.receiptFrom || ""),
      voucher.amount
    );

    if (voucher.sourceSalesId && previousStatus !== nextStatus) {
      if (nextStatus === "Paid" && previousStatus !== "Paid") {
        await applyReceiptToLinkedSale(voucher, "apply");
      } else if (previousStatus === "Paid" && nextStatus !== "Paid") {
        await applyReceiptToLinkedSale(voucher, "reverse");
      }
    }

    await logDayBookEntry({
      voucherNumber: voucher.voucherNo as unknown as string,
      voucherType: "Receipt",
      particulars: `${voucher.receiptFrom} — receipt${
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
      await applyReceiptToAccountBalance(
        String((deleted as InstanceType<typeof ReceiptVoucher>).receiptFrom || ""),
        (deleted as InstanceType<typeof ReceiptVoucher>).amount,
        "reverse"
      );
    }

    if (
      (deleted as InstanceType<typeof ReceiptVoucher>).sourceSalesId &&
      String((deleted as InstanceType<typeof ReceiptVoucher>).status || "") ===
        "Paid"
    ) {
      await applyReceiptToLinkedSale(
        deleted as InstanceType<typeof ReceiptVoucher>,
        "reverse"
      );
    }

    await removeDayBookEntry((deleted as InstanceType<typeof ReceiptVoucher>).voucherNo as unknown as string);

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
      .select("businessName")
      .sort({ businessName: 1 })
      .lean();

    const seen = new Set<string>();
    const parties: { value: string; label: string }[] = [];
    for (const a of accounts) {
      const name = String(a?.businessName ?? "").trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      parties.push({ value: name, label: name });
    }

    let nextReceiptVoucherNo = "JITOX-DEMO-REC-001";
    try {
      nextReceiptVoucherNo = await computeNextReceiptVoucherNo();
    } catch (e) {
      console.error("computeNextReceiptVoucherNo", e);
    }

    sendSuccess(res, { nextReceiptVoucherNo, parties });
  } catch (error) {
    console.error("getReceiptFormMeta", error);
    res
      .status(500)
      .json({ message: "Failed to load receipt voucher form meta." });
  }
};
