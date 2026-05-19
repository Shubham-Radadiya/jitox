import { Request, Response } from "express";
import { CashVoucher } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";
import { applyCashBankTransferToAccounts } from "../utils/applyPaymentToAccountBalance";
import { logDayBookEntry } from "../utils/dayBookLogger";

export const createCashVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      amount,
      debitFrom,
      creditTo,
      narration,
      particulars,
    } = req.body;

    const requiredFields = [
      "debitFrom",
      "creditTo",
      "narration",
      "particulars",
      "amount",
    ] as const;

    validateAndRespond(req.body, requiredFields, res);

    let voucherNumber = String(req.body.voucherNumber ?? "").trim();
    if (!voucherNumber) {
      const creditIsCash =
        String(creditTo ?? "")
          .trim()
          .toLowerCase() === "cash";
      voucherNumber = creditIsCash ? `BV-${Date.now()}` : `CV-${Date.now()}`;
    }

    let voucherDate: Date | undefined;
    const rawDate = req.body.voucherDate;
    if (rawDate != null && String(rawDate).trim() !== "") {
      const parsed = new Date(String(rawDate));
      if (!Number.isNaN(parsed.getTime())) voucherDate = parsed;
    }

    const existingVoucher = await CashVoucher.findOne({ voucherNumber });
    if (existingVoucher) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Voucher number already exists."
      );
    }

    let attachmentsFile = "";
    if (req.file) {
      attachmentsFile = req.file.path;
    }

    const newCashVoucher = new CashVoucher({
      voucherNumber,
      ...(voucherDate && { voucherDate }),
      amount,
      debitFrom,
      creditTo,
      narration,
      particulars,
      attachmentsFile,
    });

    const savedVoucher = await newCashVoucher.save();

    await applyCashBankTransferToAccounts(
      savedVoucher.debitFrom,
      savedVoucher.creditTo,
      savedVoucher.amount,
      "apply"
    );

    const vn = String(savedVoucher.voucherNumber || "CASH");
    const narr = String(savedVoucher.narration || savedVoucher.particulars || "").trim();
    await logDayBookEntry({
      voucherNumber: vn,
      voucherType:
        String(savedVoucher.creditTo || "").trim().toLowerCase() === "cash"
          ? "Bank"
          : "Cash",
      particulars:
        narr ||
        `Transfer · Debit ${savedVoucher.debitFrom} · Credit ${savedVoucher.creditTo}`,
      debitAmount: savedVoucher.amount as unknown as string,
      creditAmount: savedVoucher.amount as unknown as string,
    });

    res.status(201).json({
      message: "Cash voucher created successfully.",
      voucher: savedVoucher,
    });
  } catch (error) {
    console.error("Create Expense Voucher Error:", error);
    throw error;
  }
};

export const getAllCashVouchers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { particulars, startDate, transactionType } = req.query;

    let filter: any = {};

    if (particulars) filter.particulars = particulars;

    if (transactionType) {
      if (transactionType === "Cash") {
        // cash to bank
        filter.debitFrom = transactionType;
      } else if (transactionType === "Bank") {
        // bank to cash
        filter.creditTo = "Cash";
      }
    }

    if (startDate) {
      const date = new Date(startDate as string);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      filter.$or = [
        { voucherDate: { $gte: date, $lt: nextDate } },
        {
          $and: [
            {
              $or: [
                { voucherDate: { $exists: false } },
                { voucherDate: null },
              ],
            },
            { createdAt: { $gte: date, $lt: nextDate } },
          ],
        },
      ];
    }

    const vouchers = await CashVoucher.find(filter).sort({ createdAt: -1 });
    sendSuccess(
      res,
      vouchers,
      vouchers.length ? "" : "No cash vouchers found."
    );
  } catch (error) {
    console.error("Get All Expense Vouchers Error:", error);
    throw error;
  }
};

export const getCashVoucherById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const voucher = await CashVoucher.findById(id);

    if (!voucher) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "Cash vouchers not found.");
    }

    res.status(200).json(voucher);
  } catch (error) {
    console.error("Get Expense Voucher By ID Error:", error);
    throw error;
  }
};

export const updateCashVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (req.file) {
      updateData.attachmentsFile = req.file.path;
    }
    const updated = await CashVoucher.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "Cash voucher not found.");
    }
    res.status(200).json({
      message: "Cash voucher updated successfully.",
      voucher: updated,
    });
  } catch (error) {
    console.error("Update Cash Voucher Error:", error);
    throw error;
  }
};

export const deleteCashVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await CashVoucher.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "Cash voucher not found.");
    }
    res.status(200).json({ message: "Cash voucher deleted successfully." });
  } catch (error) {
    console.error("Delete Cash Voucher Error:", error);
    throw error;
  }
};
