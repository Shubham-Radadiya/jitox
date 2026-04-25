import { Request, Response } from "express";
import { PurchaseVoucher, ReceiptVoucher } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";

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
    } = req.body;

    const requiredFields = [
      "voucherNo",
      "date",
      "receiptFrom",
      "amount",
    ] as const;

    validateAndRespond(req.body, requiredFields, res);

    // const existingVoucher = await PaymentVoucher.findOne({ voucherNo });
    // if (existingVoucher) {
    //   res.status(400).json({ message: "Voucher number already exists." });
    //   return;
    // }

    const voucherNotFoundInPurchase = await PurchaseVoucher.findOne({
      voucherNo,
    });
    if (!voucherNotFoundInPurchase) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Voucher number does not exist in Purchase Vouchers."
      );
    }

    const newVoucher = new ReceiptVoucher({
      voucherNo,
      date,
      receiptThrough,
      receiptFrom,
      amount,
      remarks,
      status,
    });

    const savedVoucher = await newVoucher.save();

    res.status(201).json({
      message: "Receipt voucher created successfully.",
      voucher: savedVoucher,
    });
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

    const filter: any = {};

    if (status) filter.status = status;
    if (receiptFrom)
      filter.receiptFrom = { $regex: receiptFrom as string, $options: "i" };
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
      return sum + parseFloat(voucher.amount as string);
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

    res.status(200).json({
      data: receiptVoucher,
    });
  } catch (error) {
    console.error("Get All Receipt Vouchers Error:", error);
    throw error;
  }
};
