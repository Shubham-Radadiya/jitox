import { Request, Response } from "express";
import { Account, PurchaseReturnVoucher, Product } from "../models/index";
import { IPurchaseItem } from "../types/purchaseVoucher.type";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";
import { logDayBookEntry, removeDayBookEntry } from "../utils/dayBookLogger";
import { applyProductStockDelta } from "../utils/applyProductStockDelta";

/** Fields accepted from PUT body when updating a purchase return voucher */
const PURCHASE_RETURN_PATCH_KEYS = [
  "partyName",
  "invoiceNo",
  "dueDate",
  "transportDetails",
  "deliveryAt",
  "orderby",
  "shipToAndBillTo",
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
 * Next purchase return voucher no. in `JITOX-DEMO-PR-001` form — scans existing
 * `JITOX-DEMO-PR-###` codes so sequencing continues past existing data.
 */
async function computeNextPurchaseReturnVoucherNo(): Promise<string> {
  const docs = await PurchaseReturnVoucher.find().select("voucherNo").lean();
  let max = 0;
  const re = /^JITOX-DEMO-PR-(\d+)$/i;
  for (const d of docs) {
    const v = String(d?.voucherNo ?? "").trim();
    const m = re.exec(v);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }
  }
  const next = max + 1;
  return `JITOX-DEMO-PR-${String(next).padStart(3, "0")}`;
}

/** Reserve the next free voucher no. — retries on race so two creates can't collide. */
async function resolveUniquePurchaseReturnVoucherNo(
  requested?: string
): Promise<string> {
  const base = String(requested || "").trim();
  if (base) {
    const taken = await PurchaseReturnVoucher.findOne({ voucherNo: base });
    if (!taken) return base;
  }
  for (let i = 0; i < 60; i++) {
    const candidate = await computeNextPurchaseReturnVoucherNo();
    const taken = await PurchaseReturnVoucher.findOne({ voucherNo: candidate });
    if (!taken) return candidate;
  }
  return `JITOX-DEMO-PR-${Date.now()}`;
}

/** Did the user opt into stock update for this voucher? */
function shouldUpdateStock(stockDetails: unknown): boolean {
  if (!stockDetails || typeof stockDetails !== "object") return false;
  return Boolean((stockDetails as { stockQuantity?: unknown }).stockQuantity);
}

export const createPurchaseReturnVoucher = async (
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
      voucherNo,
      voucherDate,
      items,
      gstAmount,
      totalAmount,
      paymentMode,
      basePrice,
      stockDetails,
    } = req.body;

    /** voucherNo is generated server-side, so it's not in the required list. */
    const requiredFields = ["partyName", "voucherDate", "items"] as const;
    validateAndRespond(req.body, requiredFields, res);

    const productIds = (items as IPurchaseItem[]).map((item) => item.product);
    const validProducts = await Product.find({ _id: { $in: productIds } });
    if (validProducts.length !== productIds.length) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "One or more product IDs are invalid."
      );
    }

    const resolvedVoucherNo = await resolveUniquePurchaseReturnVoucherNo(
      voucherNo
    );

    const newVoucher = new PurchaseReturnVoucher({
      partyName,
      invoiceNo,
      dueDate,
      transportDetails,
      deliveryAt,
      orderby,
      shipToAndBillTo,
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

    /** Stock toggle ON → returns leave stock, so decrement product qty by line qty. */
    if (shouldUpdateStock(stockDetails)) {
      await applyProductStockDelta(items as IPurchaseItem[], -1);
    }

    await logDayBookEntry({
      voucherNumber: savedVoucher.voucherNo,
      voucherType: "Purchase Return",
      particulars: `${partyName} — purchase return${
        invoiceNo ? ` (Inv ${invoiceNo})` : ""
      }`,
      debitAmount: totalAmount,
      creditAmount: totalAmount,
    });

    res.status(201).json({
      message: "Purchase return voucher created successfully.",
      data: savedVoucher,
    });
  } catch (error) {
    console.error("Create Purchase return voucher Error:", error);
    throw error;
  }
};

export const getAllPurchaseReturnVouchers = async (
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

    const vouchers = await PurchaseReturnVoucher.aggregate([
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
      vouchers.length ? "" : "No purchase return vouchers found."
    );
  } catch (error) {
    console.error("Get All Purchase return vouchers Error:", error);
    throw error;
  }
};

export const getPurchaseReturnVoucherById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const voucher = await PurchaseReturnVoucher.findById(id).populate(
      "items.product",
      "productName category group"
    );

    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "No purchase return vouchers found."
      );
    }

    res.status(200).json(voucher);
  } catch (error) {
    console.error("Get Purchase return voucher by ID Error:", error);
    throw error;
  }
};

export const updatePurchaseReturnVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const raw = req.body as Record<string, unknown>;

    const voucher = await PurchaseReturnVoucher.findById(id);
    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "No purchase return vouchers found."
      );
    }

    /** Snapshot prior stock state so we can rollback before applying new lines. */
    const prevStockOn = shouldUpdateStock(voucher.stockDetails);
    const prevItems = Array.isArray(voucher.items)
      ? voucher.items.map((it: any) => ({
          product: it?.product,
          quantity: Number(it?.quantity),
        }))
      : [];

    /** If voucherNo is being changed, make sure it's still unique (excluding this doc). */
    if (
      typeof raw.voucherNo === "string" &&
      raw.voucherNo.trim() &&
      raw.voucherNo.trim() !== voucher.voucherNo
    ) {
      const clash = await PurchaseReturnVoucher.findOne({
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
    for (const key of PURCHASE_RETURN_PATCH_KEYS) {
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

    /** Reconcile stock: rollback the old return, then apply the new return. */
    const nextStockOn = shouldUpdateStock(voucher.stockDetails);
    if (prevStockOn) {
      await applyProductStockDelta(prevItems, +1); // undo: returns originally removed stock
    }
    if (nextStockOn) {
      const nextItems = Array.isArray(voucher.items)
        ? voucher.items.map((it: any) => ({
            product:
              it?.product && typeof it.product === "object" && it.product?._id
                ? it.product._id
                : it?.product,
            quantity: Number(it?.quantity),
          }))
        : [];
      await applyProductStockDelta(nextItems, -1);
    }

    const returnInvoiceNo = (voucher as any).invoiceNo;
    await logDayBookEntry({
      voucherNumber: voucher.voucherNo,
      voucherType: "Purchase Return",
      particulars: `${voucher.partyName} — purchase return${
        returnInvoiceNo ? ` (Inv ${returnInvoiceNo})` : ""
      }`,
      debitAmount: voucher.totalAmount as unknown as string,
      creditAmount: voucher.totalAmount as unknown as string,
    });

    res.status(200).json({
      message: "Purchase return voucher updated successfully.",
      data: voucher,
    });
  } catch (error) {
    console.error("Update Purchase return voucher Error:", error);
    throw error;
  }
};

export const deletePurchaseReturnVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedVoucher = await PurchaseReturnVoucher.findByIdAndDelete(id);
    if (!deletedVoucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "No purchase return vouchers found."
      );
    }

    /** Roll back the stock deduction this voucher caused. */
    if (shouldUpdateStock((deletedVoucher as any).stockDetails)) {
      const items = Array.isArray((deletedVoucher as any).items)
        ? (deletedVoucher as any).items.map((it: any) => ({
            product: it?.product,
            quantity: Number(it?.quantity),
          }))
        : [];
      await applyProductStockDelta(items, +1);
    }

    await removeDayBookEntry((deletedVoucher as any).voucherNo);

    res
      .status(200)
      .json({ message: "Purchase return voucher deleted successfully." });
  } catch (error) {
    console.error("Delete Purchase return voucher Error:", error);
    throw error;
  }
};

/** Dropdowns + next auto voucher no. for the Add Purchase Return modal. */
export const getPurchaseReturnFormMeta = async (
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

    let nextPurchaseReturnVoucherNo = "JITOX-DEMO-PR-001";
    try {
      nextPurchaseReturnVoucherNo = await computeNextPurchaseReturnVoucherNo();
    } catch (e) {
      console.error("computeNextPurchaseReturnVoucherNo", e);
    }

    sendSuccess(res, { nextPurchaseReturnVoucherNo, parties });
  } catch (error) {
    console.error("getPurchaseReturnFormMeta", error);
    res
      .status(500)
      .json({ message: "Failed to load purchase return voucher form meta." });
  }
};
