import { Request, Response } from "express";
import { ExpenseVoucher } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";

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

    res.status(200).json({ message: "Expense Voucher deleted successfully." });
  } catch (error) {
    console.error("Delete Expense Voucher Error:", error);
    throw error;
  }
};
