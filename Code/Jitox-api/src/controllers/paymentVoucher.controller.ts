import { Request, Response } from "express";
import { PaymentVoucher, PurchaseVoucher } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";

export const createPaymentVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      voucherNo,
      date,
      paymentThrough,
      paymentTo,
      amount,
      remarks,
      status,
    } = req.body;

    const requiredFields = [
      "voucherNo",
      "date",
      "paymentTo",
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

    const newVoucher = new PaymentVoucher({
      voucherNo,
      date,
      paymentThrough,
      paymentTo,
      amount,
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

export const getAllPaymentVouchers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, paymentTo, date, statusPriority } = req.query;

    const filter: any = {};

    if (status) filter.status = status;
    if (paymentTo)
      filter.paymentTo = { $regex: paymentTo as string, $options: "i" };
    if (date) {
      const selectedDate = new Date(date as string);
      const nextDate = new Date(selectedDate);
      nextDate.setDate(selectedDate.getDate() + 1);
      filter.date = { $gte: selectedDate, $lt: nextDate };
    }

    let vouchers = await PaymentVoucher.find(filter);

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

    if (vouchers.length === 0) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No payment vouchers found.");
    }

    res.status(200).json({
      count: vouchers.length,
      data: vouchers,
    });
  } catch (error) {
    console.error("Get All Payment Vouchers Error:", error);
    throw error;
  }
};

export const getTotalPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const totalResult = await PaymentVoucher.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $toDouble: "$amount" } },
          bankAmount: {
            $sum: {
              $cond: [
                { $eq: ["$paymentThrough", "Bank"] },
                { $toDouble: "$amount" },
                0,
              ],
            },
          },
          cashAmount: {
            $sum: {
              $cond: [
                { $eq: ["$paymentThrough", "Cash"] },
                { $toDouble: "$amount" },
                0,
              ],
            },
          },
        },
      },
    ]);

    const data = {
      totalAmount: totalResult[0]?.totalAmount || 0,
      bankAmount: totalResult[0]?.bankAmount || 0,
      cashAmount: totalResult[0]?.cashAmount || 0,
    };

    sendSuccess(res, data);
  } catch (error) {
    console.error("Get Total Payment Error:", error);
    throw error;
  }
};
