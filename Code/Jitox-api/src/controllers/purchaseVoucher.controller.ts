import { Request, Response } from "express";
import { PurchaseVoucher, Product } from "../models/index";
import { IPurchaseItem } from "../types/purchaseVoucher.type";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendCreated, sendSuccess } from "../utils/apiResponse";

/** Fields accepted from dashboard PUT body when updating a purchase voucher */
const PURCHASE_VOUCHER_PATCH_KEYS = [
  "partyName",
  "invoiceNo",
  "dueDate",
  "transportDetails",
  "deliveryAt",
  "orderby",
  "shipToAndBillTo",
  "billTo",
  "shipTo",
  "shipDifferent",
  "narration",
  "termsAndConditions",
  "voucherNo",
  "voucherDate",
  "items",
  "gstAmount",
  "totalAmount",
  "paymentMode",
  "basePrice",
  "stockDetails",
] as const;

/**
 * Use client `V###` if free; otherwise take the next free `V###` (stale UI / race).
 */
async function resolveUniqueVoucherNo(requested: string): Promise<string> {
  const base = String(requested || "").trim();
  let candidate = base || "V001";
  for (let i = 0; i < 60; i++) {
    const taken = await PurchaseVoucher.findOne({ voucherNo: candidate });
    if (!taken) return candidate;
    const m = /^V(\d+)$/i.exec(candidate);
    if (m) {
      const n = parseInt(m[1], 10) + 1;
      const w = Math.max(3, m[1].length, String(n).length);
      candidate = `V${String(n).padStart(w, "0")}`;
    } else {
      candidate = i === 0 ? `${base || "V"}-2` : `${base}-${i + 2}`;
    }
  }
  return `V${Date.now()}`;
}

export const createPurchaseVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      partyName,
      invoiceNo,
      dueDate,
      transportDetails,
      deliveryAt,
      orderby,
      shipToAndBillTo,
      billTo,
      shipTo,
      shipDifferent,
      narration,
      termsAndConditions,
      voucherNo,
      voucherDate,
      items,
      gstAmount,
      totalAmount,
      paymentMode,
      basePrice,
      stockDetails,
    } = req.body;

    const requiredFields = [
      "partyName",
      "voucherNo",
      "voucherDate",
      "items",
    ] as const;

    validateAndRespond(req.body, requiredFields, res);

    const resolvedVoucherNo = await resolveUniqueVoucherNo(voucherNo);

    const productIds = items.map((item: IPurchaseItem) => item.product);
    const validProducts = await Product.find({ _id: { $in: productIds } });
    if (validProducts.length !== productIds.length) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "One or more product IDs are invalid."
      );
    }

    const newVoucher = new PurchaseVoucher({
      partyName,
      invoiceNo,
      dueDate,
      transportDetails,
      deliveryAt,
      orderby,
      shipToAndBillTo,
      billTo,
      shipTo,
      shipDifferent,
      narration,
      termsAndConditions,
      voucherNo: resolvedVoucherNo,
      voucherDate,
      items,
      gstAmount,
      totalAmount,
      paymentMode,
      basePrice,
      stockDetails,
    });

    const savedVoucher = await newVoucher.save();
    sendCreated(res, savedVoucher, "Purchase voucher created successfully.");
  } catch (error) {
    console.error("Create Purchase Voucher Error:", error);
    throw error;
  }
};

export const getAllPurchaseVouchers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { partyName, dueDate, dateFrom, dateTo } = req.query;

    const matchStage: any = {};

    if (partyName) {
      matchStage.partyName = { $regex: partyName as string, $options: "i" };
    }

    if (dueDate) {
      matchStage.dueDate = new Date(dueDate as string);
    }

    if (dateFrom && dateTo) {
      matchStage.voucherDate = {
        $gte: new Date(dateFrom as string),
        $lte: new Date(dateTo as string),
      };
    } else if (dateFrom) {
      matchStage.voucherDate = { $gte: new Date(dateFrom as string) };
    } else if (dateTo) {
      matchStage.voucherDate = { $lte: new Date(dateTo as string) };
    }

    const vouchers = await PurchaseVoucher.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },

      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },

      {
        $project: {
          partyName: 1,
          voucherNo: 1,
          voucherDate: 1,
          totalAmount: 1,
          invoiceNo: 1,
          dueDate: 1,
          stockDetails: 1,
          gstAmount: 1,
          paymentMode: 1,
          basePrice: 1,
          createdAt: 1,
          updatedAt: 1,
          "productDetails.productName": 1,
          "productDetails.category": 1,
          "productDetails.group": 1,
        },
      },
    ]);

    sendSuccess(
      res,
      { count: vouchers.length, data: vouchers },
      vouchers.length ? "" : "No purchase vouchers found."
    );
  } catch (error) {
    console.error("Get All Purchase Vouchers Error:", error);
    throw error;
  }
};

export const getPurchaseVoucherById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const voucher = await PurchaseVoucher.findById(id).populate(
      "items.product",
      "productName category group"
    );

    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "No purchase vouchers found."
      );
    }

    res.status(200).json(voucher);
  } catch (error) {
    console.error("Get Purchase Voucher by ID Error:", error);
    throw error;
  }
};

export const updatePurchaseVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const raw = req.body as Record<string, unknown>;

    const voucher = await PurchaseVoucher.findById(id);
    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "No purchase vouchers found."
      );
    }

    const patch: Record<string, unknown> = {};
    for (const key of PURCHASE_VOUCHER_PATCH_KEYS) {
      if (Object.prototype.hasOwnProperty.call(raw, key)) {
        patch[key] = raw[key];
      }
    }

    voucher.set(patch);
    await voucher.save();
    await voucher.populate({
      path: "items.product",
      select: "productName category group",
    });

    sendSuccess(
      res,
      voucher,
      "Purchase voucher updated successfully."
    );
  } catch (error) {
    console.error("Update Purchase Voucher Error:", error);
    throw error;
  }
};

export const deletePurchaseVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedVoucher = await PurchaseVoucher.findByIdAndDelete(id);
    if (!deletedVoucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "No purchase vouchers found."
      );
    }

    res.status(200).json({ message: "Purchase voucher deleted successfully." });
  } catch (error) {
    console.error("Delete Purchase Voucher Error:", error);
    throw error;
  }
};
