import { Request, Response } from "express";
import { PurchaseVoucher, Product } from "../models/index";
import { IPurchaseItem } from "../types/purchaseVoucher.type";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { logDayBookEntry, removeDayBookEntry } from "../utils/dayBookLogger";

/**
 * Apply a stock delta to each line item's product (multiplier: +1 to add, -1 to remove).
 * Sums duplicate product ids across lines so a single product appears once per `$inc`.
 * Silently skips lines without a valid product / quantity so a partial bad row can't crash a save.
 */
async function applyStockDelta(
  items: Array<{ product: unknown; quantity: unknown }>,
  multiplier: 1 | -1
): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) return;

  const totals = new Map<string, number>();
  for (const it of items) {
    const pid =
      it && it.product != null && typeof (it.product as any).toString === "function"
        ? String((it.product as any).toString())
        : String(it?.product ?? "").trim();
    const qty = Number(it?.quantity);
    if (!pid || !Number.isFinite(qty) || qty === 0) continue;
    totals.set(pid, (totals.get(pid) ?? 0) + qty);
  }

  if (totals.size === 0) return;

  await Promise.all(
    Array.from(totals.entries()).map(([pid, qty]) =>
      Product.findByIdAndUpdate(pid, {
        $inc: { quantity: qty * multiplier },
      }).catch((err) => {
        console.error("applyStockDelta failed", { pid, qty, multiplier, err });
      })
    )
  );
}

/** Did the user opt into stock update for this voucher? */
function shouldUpdateStock(stockDetails: unknown): boolean {
  if (!stockDetails || typeof stockDetails !== "object") return false;
  return Boolean((stockDetails as { stockQuantity?: unknown }).stockQuantity);
}

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

    /** Stock toggle ON → add purchase qty to each product's current stock. */
    if (shouldUpdateStock(stockDetails)) {
      await applyStockDelta(items as IPurchaseItem[], +1);
    }

    await logDayBookEntry({
      voucherNumber: savedVoucher.voucherNo,
      voucherType: "Purchase",
      particulars: `${partyName} — purchase${
        invoiceNo ? ` (Inv ${invoiceNo})` : ""
      }`,
      debitAmount: totalAmount,
      creditAmount: totalAmount,
    });

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

    /** Snapshot stock state BEFORE patch so we can rollback the old delta cleanly. */
    const prevStockOn = shouldUpdateStock(voucher.stockDetails);
    const prevItems = Array.isArray(voucher.items)
      ? voucher.items.map((it: any) => ({
          product: it?.product,
          quantity: Number(it?.quantity),
        }))
      : [];

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

    /**
     * Reconcile stock: rollback what the previous version of this voucher added,
     * then re-apply the new lines if the toggle is still on. This keeps Product.quantity
     * correct across qty edits, line removals, and toggle flips.
     */
    const nextStockOn = shouldUpdateStock(voucher.stockDetails);
    if (prevStockOn) {
      await applyStockDelta(prevItems, -1);
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
      await applyStockDelta(nextItems, +1);
    }

    const voucherInvoiceNo = (voucher as any).invoiceNo;
    await logDayBookEntry({
      voucherNumber: voucher.voucherNo,
      voucherType: "Purchase",
      particulars: `${voucher.partyName} — purchase${
        voucherInvoiceNo ? ` (Inv ${voucherInvoiceNo})` : ""
      }`,
      debitAmount: voucher.totalAmount as unknown as string,
      creditAmount: voucher.totalAmount as unknown as string,
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

    /** If this voucher had previously bumped product stock, roll it back on delete. */
    if (shouldUpdateStock((deletedVoucher as any).stockDetails)) {
      const items = Array.isArray((deletedVoucher as any).items)
        ? (deletedVoucher as any).items.map((it: any) => ({
            product: it?.product,
            quantity: Number(it?.quantity),
          }))
        : [];
      await applyStockDelta(items, -1);
    }

    await removeDayBookEntry((deletedVoucher as any).voucherNo);

    res.status(200).json({ message: "Purchase voucher deleted successfully." });
  } catch (error) {
    console.error("Delete Purchase Voucher Error:", error);
    throw error;
  }
};
