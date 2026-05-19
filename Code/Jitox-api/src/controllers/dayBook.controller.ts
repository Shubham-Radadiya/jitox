import { Request, Response } from "express";
import { DayBook } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";
import { resolveDayBookAmounts } from "../utils/dayBookLogger";
import type { IDayBook } from "../types/dayBook";

function serializeDayBookRow(doc: IDayBook | Record<string, unknown>) {
  const plain =
    typeof (doc as IDayBook).toObject === "function"
      ? (doc as IDayBook).toObject()
      : { ...(doc as Record<string, unknown>) };
  const { debitAmount, creditAmount } = resolveDayBookAmounts(
    String(plain.voucherType ?? ""),
    plain.debitAmount as string | number,
    plain.creditAmount as string | number
  );
  return { ...plain, debitAmount, creditAmount };
}

export const createDayBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      voucherNumber,
      debitAmount,
      creditAmount,
      voucherType,
      particulars,
    } = req.body;

    const requiredFields = [
      "voucherNumber",
      "debitAmount",
      "creditAmount",
      "voucherType",
      "particulars",
    ] as const;

    validateAndRespond(req.body, requiredFields, res);

    const existingDayBook = await DayBook.findOne({ voucherNumber });
    if (existingDayBook) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Voucher number already exists."
      );
    }

    const sides = resolveDayBookAmounts(
      voucherType,
      debitAmount,
      creditAmount
    );
    const newDayBook = new DayBook({
      voucherNumber,
      debitAmount: sides.debitAmount,
      creditAmount: sides.creditAmount,
      voucherType,
      particulars,
    });

    const savedDayBook = await newDayBook.save();

    res.status(201).json({
      message: "Expense DayBook created successfully.",
      dayBook: savedDayBook,
    });
  } catch (error) {
    console.error("Create Expense DayBook Error:", error);
    throw error;
  }
};

export const getAllDayBooks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate } = req.query;

    let filter: any = {};

    if (startDate) {
      const date = new Date(startDate as string);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      filter.createdAt = { $gte: date, $lt: nextDate };
    }

    const dayBook = await DayBook.find(filter).sort({ createdAt: -1 });
    sendSuccess(
      res,
      dayBook.map(serializeDayBookRow),
      dayBook.length ? "" : "No day book entries found."
    );
  } catch (error) {
    console.error("Get All Expense DayBook Error:", error);
    throw error;
  }
};

export const getDayBookById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const dayBook = await DayBook.findById(id);

    if (!dayBook) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "Cash DayBook found");
    }

    res.status(200).json(serializeDayBookRow(dayBook));
  } catch (error) {
    console.error("Get Expense DayBook By ID Error:", error);
    throw error;
  }
};

export const updateDayBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { voucherType, debitAmount, creditAmount, particulars } = req.body;
    const existing = await DayBook.findById(id);
    if (!existing) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "Day book entry not found.");
    }
    const sides = resolveDayBookAmounts(
      voucherType ?? existing.voucherType,
      debitAmount ?? existing.debitAmount,
      creditAmount ?? existing.creditAmount
    );
    const updated = await DayBook.findByIdAndUpdate(
      id,
      {
        ...req.body,
        debitAmount: sides.debitAmount,
        creditAmount: sides.creditAmount,
      },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      message: "Day book updated successfully.",
      dayBook: serializeDayBookRow(updated!),
    });
  } catch (error) {
    console.error("Update DayBook Error:", error);
    throw error;
  }
};

export const deleteDayBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await DayBook.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "Day book entry not found.");
    }
    res.status(200).json({ message: "Day book deleted successfully." });
  } catch (error) {
    console.error("Delete DayBook Error:", error);
    throw error;
  }
};
