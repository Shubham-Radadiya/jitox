import { Request, Response } from "express";
import { JournalVoucher, Account, PurchaseVoucher } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";

export const createJournalVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      voucherNo,
      date,
      paymentBy,
      paymentTo,
      debitAmount,
      creditAmount,
      remarks,
      status = "Pending",
    } = req.body;
    const requiredFields = [
      "voucherNo",
      "date",
      "paymentBy",
      "paymentTo",
      "debitAmount",
      "creditAmount",
    ] as const;

    validateAndRespond(req.body, requiredFields, res);
    // const existingVoucher = await PaymentVoucher.findOne({ voucherNo });
    // if (existingVoucher) {
    //   res.status(400).json({ message: "Voucher number already exists." });
    //   return;
    // }

    const accountFrom = await Account.findOne({ _id: paymentBy });
    if (!accountFrom) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        `Account '${paymentBy}' does not exist.`
      );
    }
    const accountTo = await Account.findOne({ _id: paymentTo });
    if (!accountTo) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        `Account '${paymentTo}' does not exist.`
      );
    }

    if (paymentBy == paymentTo) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Payment By and Payment To cannot be the same."
      );
    }

    const voucherNotFoundInPurchase = await PurchaseVoucher.findOne({
      voucherNo,
    });
    if (!voucherNotFoundInPurchase) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Voucher number does not exist in Purchase Vouchers."
      );
    }

    const newVoucher = new JournalVoucher({
      voucherNo,
      date,
      paymentBy,
      paymentTo,
      debitAmount,
      creditAmount,
      remarks,
      status,
    });

    const savedVoucher = await newVoucher.save();

    res.status(201).json({
      message: "Payment voucher created successfully.",
      voucher: savedVoucher,
    });
  } catch (error) {
    console.error("Create Payment Voucher Error:", error);
    throw error;
  }
};

export const getAllJournalVouchers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, date } = req.query;

    const filter: any = {};

    if (status) filter.status = status;
    if (date) {
      const selectedDate = new Date(date as string);
      const nextDate = new Date(selectedDate);
      nextDate.setDate(selectedDate.getDate() + 1);
      filter.date = { $gte: selectedDate, $lt: nextDate };
    }

    const vouchers = await JournalVoucher.find(filter);

    sendSuccess(
      res,
      { count: vouchers.length, data: vouchers },
      vouchers.length ? "" : "No journal vouchers found."
    );
  } catch (error) {
    console.error("Get All Payment Vouchers Error:", error);
    throw error;
  }
};

export const getJournalVoucherById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const voucher = await JournalVoucher.findById(id);
    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Journal voucher not found."
      );
    }
    res.status(200).json(voucher);
  } catch (error) {
    console.error("Get Journal Voucher By ID Error:", error);
    throw error;
  }
};

export const updateJournalVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedVoucher = await JournalVoucher.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    if (!updatedVoucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Journal voucher not found."
      );
    }
    res.status(200).json({
      message: "Journal voucher updated successfully.",
      voucher: updatedVoucher,
    });
  } catch (error) {
    console.error("Update Journal Voucher Error:", error);
    throw error;
  }
};

export const deleteJournalVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedVoucher = await JournalVoucher.findByIdAndDelete(id);
    if (!deletedVoucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Journal voucher not found."
      );
    }
    res.status(200).json({ message: "Journal voucher deleted successfully." });
  } catch (error) {
    console.error("Delete Journal Voucher Error:", error);
    throw error;
  }
};
