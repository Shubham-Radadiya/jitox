import { Request, Response } from "express";
import { JournalVoucher, Account } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";

/**
 * Next journal voucher no. in `JITOX-DEMO-JV-001` form — scans existing
 * `JITOX-DEMO-JV-###` codes so sequencing continues past seeded / legacy data.
 */
async function computeNextJournalVoucherNo(): Promise<string> {
  const docs = await JournalVoucher.find().select("voucherNo").lean();
  let max = 0;
  const re = /^JITOX-DEMO-JV-(\d+)$/i;
  for (const d of docs) {
    const v = String(d?.voucherNo ?? "").trim();
    const m = re.exec(v);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }
  }
  return `JITOX-DEMO-JV-${String(max + 1).padStart(3, "0")}`;
}

export const getNextJournalVoucherNo = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const voucherNo = await computeNextJournalVoucherNo();
    res.status(200).json({ voucherNo });
  } catch (error) {
    console.error("Get next journal voucher no Error:", error);
    throw error;
  }
};

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

    const debitNum = Number(debitAmount);
    const creditNum = Number(creditAmount);
    if (!Number.isFinite(debitNum) || !Number.isFinite(creditNum) || debitNum <= 0) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Debit and credit amounts must be positive numbers."
      );
    }
    if (Math.abs(debitNum - creditNum) > 0.005) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Journal debit and credit amounts must match."
      );
    }

    const duplicateNo = await JournalVoucher.findOne({ voucherNo });
    if (duplicateNo) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Journal voucher number already exists."
      );
    }

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
      message: "Journal voucher created successfully.",
      voucher: savedVoucher,
    });
  } catch (error) {
    console.error("Create Journal Voucher Error:", error);
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
    console.error("Get All Journal Vouchers Error:", error);
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
    const existing = await JournalVoucher.findById(id);
    if (!existing) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Journal voucher not found."
      );
    }

    const b = req.body as Record<string, unknown>;
    const voucherNo =
      b.voucherNo != null && String(b.voucherNo).trim() !== ""
        ? String(b.voucherNo).trim()
        : existing.voucherNo;
    const date =
      b.date != null ? new Date(String(b.date)) : (existing.date as Date);
    const paymentBy = (b.paymentBy ?? existing.paymentBy) as string;
    const paymentTo = (b.paymentTo ?? existing.paymentTo) as string;
    const debitNum =
      b.debitAmount != null && b.debitAmount !== ""
        ? Number(b.debitAmount)
        : Number(existing.debitAmount);
    const creditNum =
      b.creditAmount != null && b.creditAmount !== ""
        ? Number(b.creditAmount)
        : Number(existing.creditAmount);
    const remarks =
      b.remarks != null ? String(b.remarks) : existing.remarks ?? "";
    const status =
      b.status != null && String(b.status).trim() !== ""
        ? String(b.status).trim()
        : existing.status ?? "Pending";

    if (!Number.isFinite(debitNum) || !Number.isFinite(creditNum) || debitNum <= 0) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Debit and credit amounts must be positive numbers."
      );
    }
    if (Math.abs(debitNum - creditNum) > 0.005) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Journal debit and credit amounts must match."
      );
    }

    const dup = await JournalVoucher.findOne({
      voucherNo,
      _id: { $ne: id },
    });
    if (dup) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Journal voucher number already exists."
      );
    }

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
    if (String(paymentBy) === String(paymentTo)) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Payment By and Payment To cannot be the same."
      );
    }

    const updatedVoucher = await JournalVoucher.findByIdAndUpdate(
      id,
      {
        voucherNo,
        date,
        paymentBy,
        paymentTo,
        debitAmount: debitNum,
        creditAmount: creditNum,
        remarks,
        status,
      },
      { new: true }
    );

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
