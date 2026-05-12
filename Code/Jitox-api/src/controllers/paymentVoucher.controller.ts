import { Request, Response } from "express";
import { Account, PaymentVoucher } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { logDayBookEntry, removeDayBookEntry } from "../utils/dayBookLogger";

/** Fields accepted from PUT body when updating a payment voucher. */
const PAYMENT_VOUCHER_PATCH_KEYS = [
  "voucherNo",
  "date",
  "paymentThrough",
  "paymentTo",
  "amount",
  "remarks",
  "status",
] as const;

/**
 * Next payment voucher no. in `JITOX-DEMO-PAY-001` form — scans existing
 * `JITOX-DEMO-PAY-###` codes so sequencing continues past seeded / legacy data.
 */
async function computeNextPaymentVoucherNo(): Promise<string> {
  const docs = await PaymentVoucher.find().select("voucherNo").lean();
  let max = 0;
  const re = /^JITOX-DEMO-PAY-(\d+)$/i;
  for (const d of docs) {
    const v = String(d?.voucherNo ?? "").trim();
    const m = re.exec(v);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }
  }
  return `JITOX-DEMO-PAY-${String(max + 1).padStart(3, "0")}`;
}

/** Reserve the next free voucher no. — retries on race so two creates can't collide. */
async function resolveUniquePaymentVoucherNo(
  requested?: string
): Promise<string> {
  const base = String(requested || "").trim();
  if (base) {
    const taken = await PaymentVoucher.findOne({ voucherNo: base });
    if (!taken) return base;
  }
  for (let i = 0; i < 60; i++) {
    const candidate = await computeNextPaymentVoucherNo();
    const taken = await PaymentVoucher.findOne({ voucherNo: candidate });
    if (!taken) return candidate;
  }
  return `JITOX-DEMO-PAY-${Date.now()}`;
}

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

    /** voucherNo is generated server-side, so it's not in the required list. */
    const requiredFields = ["date", "paymentTo", "amount"] as const;
    validateAndRespond(req.body, requiredFields, res);

    const resolvedVoucherNo = await resolveUniquePaymentVoucherNo(voucherNo);

    const newVoucher = new PaymentVoucher({
      voucherNo: resolvedVoucherNo,
      date,
      paymentThrough,
      paymentTo,
      amount,
      remarks,
      status,
    });

    const savedVoucher = await newVoucher.save();

    await logDayBookEntry({
      voucherNumber: savedVoucher.voucherNo as unknown as string,
      voucherType: "Payment",
      particulars: `${paymentTo} — payment${
        paymentThrough ? ` (${paymentThrough})` : ""
      }`,
      debitAmount: amount,
      creditAmount: amount,
    });

    sendCreated(res, savedVoucher, "Payment voucher created successfully.");
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

    sendSuccess(
      res,
      { count: vouchers.length, data: vouchers },
      vouchers.length ? "" : "No payment vouchers found."
    );
  } catch (error) {
    console.error("Get All Payment Vouchers Error:", error);
    throw error;
  }
};

export const getPaymentVoucherById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const voucher = await PaymentVoucher.findById(id);
    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Payment voucher not found."
      );
    }
    res.status(200).json(voucher);
  } catch (error) {
    console.error("Get Payment Voucher By ID Error:", error);
    throw error;
  }
};

export const updatePaymentVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const raw = req.body as Record<string, unknown>;

    const voucher = await PaymentVoucher.findById(id);
    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Payment voucher not found."
      );
    }

    /** If voucherNo is being changed, make sure it's still unique (excluding this doc). */
    if (
      typeof raw.voucherNo === "string" &&
      raw.voucherNo.trim() &&
      raw.voucherNo.trim() !== voucher.voucherNo
    ) {
      const clash = await PaymentVoucher.findOne({
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

    const patch: Record<string, unknown> = {};
    for (const key of PAYMENT_VOUCHER_PATCH_KEYS) {
      if (Object.prototype.hasOwnProperty.call(raw, key)) {
        patch[key] = raw[key];
      }
    }

    voucher.set(patch);
    await voucher.save();

    await logDayBookEntry({
      voucherNumber: voucher.voucherNo as unknown as string,
      voucherType: "Payment",
      particulars: `${voucher.paymentTo} — payment${
        voucher.paymentThrough ? ` (${voucher.paymentThrough})` : ""
      }`,
      debitAmount: voucher.amount as unknown as string,
      creditAmount: voucher.amount as unknown as string,
    });

    sendSuccess(res, voucher, "Payment voucher updated successfully.");
  } catch (error) {
    console.error("Update Payment Voucher Error:", error);
    throw error;
  }
};

export const deletePaymentVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await PaymentVoucher.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Payment voucher not found."
      );
    }

    await removeDayBookEntry((deleted as any).voucherNo);

    sendSuccess(res, null, "Payment voucher deleted successfully.");
  } catch (error) {
    console.error("Delete Payment Voucher Error:", error);
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

/** Dropdowns + next auto voucher no. for the Add Payment modal. */
export const getPaymentFormMeta = async (
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

    let nextPaymentVoucherNo = "JITOX-DEMO-PAY-001";
    try {
      nextPaymentVoucherNo = await computeNextPaymentVoucherNo();
    } catch (e) {
      console.error("computeNextPaymentVoucherNo", e);
    }

    sendSuccess(res, { nextPaymentVoucherNo, parties });
  } catch (error) {
    console.error("getPaymentFormMeta", error);
    res
      .status(500)
      .json({ message: "Failed to load payment voucher form meta." });
  }
};
