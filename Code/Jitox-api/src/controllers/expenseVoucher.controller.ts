import { Request, Response } from "express";
import { ExpenseVoucher } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";
import {
  applyExpenseToAccountBalance,
  parsePaymentAmount,
} from "../utils/applyPaymentToAccountBalance";
import { logDayBookEntry, removeDayBookEntry } from "../utils/dayBookLogger";

async function reconcileExpenseAccountChange(
  prevPaidTo: string,
  prevAmount: unknown,
  nextPaidTo: string,
  nextAmount: unknown
): Promise<void> {
  const prevTo = String(prevPaidTo || "").trim();
  const nextTo = String(nextPaidTo || "").trim();
  const prevAmt = parsePaymentAmount(prevAmount);
  const nextAmt = parsePaymentAmount(nextAmount);

  if (prevTo && prevAmt > 0) {
    await applyExpenseToAccountBalance(prevPaidTo, prevAmount, "reverse");
  }
  if (nextTo && nextAmt > 0) {
    await applyExpenseToAccountBalance(nextPaidTo, nextAmount, "apply");
  }
}

export const createExpenseVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, expenseType, description, paidTo, paymentMode, amount } =
      req.body;

    const requiredFields = [
      "startDate",
      "expenseType",
      "description",
      "paidTo",
      "paymentMode",
      "amount",
    ] as const;

    validateAndRespond(req.body, requiredFields, res);

    let proofUrl = "";
    if (req.file) {
      proofUrl = req.file.path;
    }

    const newVoucher = new ExpenseVoucher({
      startDate,
      expenseType,
      description,
      paidTo,
      paymentMode,
      amount,
      uploadProof: proofUrl,
    });

    const savedVoucher = await newVoucher.save();

    await applyExpenseToAccountBalance(
      String(savedVoucher.paidTo || ""),
      savedVoucher.amount,
      "apply"
    );

    const expId = String(savedVoucher._id || "");
    await logDayBookEntry({
      voucherNumber: expId ? `EXP-${expId.slice(-6).toUpperCase()}` : "EXP",
      voucherType: "Expense",
      particulars: `${savedVoucher.expenseType || "Expense"} — ${savedVoucher.paidTo || "party"}`,
      debitAmount: savedVoucher.amount as unknown as string,
      creditAmount: savedVoucher.amount as unknown as string,
    });

    res.status(201).json({
      message: "Expense Voucher created successfully.",
      voucher: savedVoucher,
    });
  } catch (error) {
    console.error("Create Expense Voucher Error:", error);
    throw error;
  }
};

export const getAllExpenseVouchers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { expenseType, paymentMode, startDate } = req.query;

    let filter: any = {};

    if (expenseType) filter.expenseType = expenseType;
    if (paymentMode) filter.paymentMode = paymentMode;

    if (startDate) {
      const date = new Date(startDate as string);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      filter.startDate = { $gte: date, $lt: nextDate };
    }

    const vouchers = await ExpenseVoucher.find(filter).sort({ createdAt: -1 });
    sendSuccess(
      res,
      vouchers,
      vouchers.length ? "" : "No expense vouchers found."
    );
  } catch (error) {
    console.error("Get All Expense Vouchers Error:", error);
    throw error;
  }
};

export const getExpenseVoucherById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const voucher = await ExpenseVoucher.findById(id);

    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Expense Voucher not found."
      );
    }

    res.status(200).json(voucher);
  } catch (error) {
    console.error("Get Expense Voucher By ID Error:", error);
    throw error;
  }
};

export const updateExpenseVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await ExpenseVoucher.findById(id);
    if (!existing) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Expense Voucher not found."
      );
    }

    const prevPaidTo = String(existing.paidTo || "");
    const prevAmount = existing.amount;

    const updateData = { ...req.body };

    if (req.file) {
      updateData.uploadProof = req.file.path;
    }

    const updatedVoucher = await ExpenseVoucher.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedVoucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Expense Voucher not found."
      );
    }

    const paidToChanged =
      String(prevPaidTo).trim().toLowerCase() !==
      String(updatedVoucher.paidTo || "").trim().toLowerCase();
    const amtChanged =
      parsePaymentAmount(prevAmount) !== parsePaymentAmount(updatedVoucher.amount);

    if (paidToChanged || amtChanged) {
      await reconcileExpenseAccountChange(
        prevPaidTo,
        prevAmount,
        String(updatedVoucher.paidTo || ""),
        updatedVoucher.amount
      );
    }

    const expId = String(updatedVoucher._id || "");
    await logDayBookEntry({
      voucherNumber: expId ? `EXP-${expId.slice(-6).toUpperCase()}` : "EXP",
      voucherType: "Expense",
      particulars: `${updatedVoucher.expenseType || "Expense"} — ${updatedVoucher.paidTo || "party"}`,
      debitAmount: updatedVoucher.amount as unknown as string,
      creditAmount: updatedVoucher.amount as unknown as string,
    });

    res.status(200).json({
      message: "Expense Voucher updated successfully.",
      voucher: updatedVoucher,
    });
  } catch (error) {
    console.error("Update Expense Voucher Error:", error);
    throw error;
  }
};

export const deleteExpenseVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedVoucher = await ExpenseVoucher.findByIdAndDelete(id);

    if (!deletedVoucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Expense Voucher not found."
      );
    }

    await applyExpenseToAccountBalance(
      String(deletedVoucher.paidTo || ""),
      deletedVoucher.amount,
      "reverse"
    );

    const expId = String(deletedVoucher._id || "");
    await removeDayBookEntry(
      expId ? `EXP-${expId.slice(-6).toUpperCase()}` : "EXP"
    );

    res.status(200).json({ message: "Expense Voucher deleted successfully." });
  } catch (error) {
    console.error("Delete Expense Voucher Error:", error);
    throw error;
  }
};
