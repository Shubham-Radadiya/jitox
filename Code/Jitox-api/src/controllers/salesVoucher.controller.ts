import { Request, Response } from "express";
import { Types } from "mongoose";
import { Account, Product, User } from "../models/index";
import SalesVoucher from "../models/salesVoucher.model";
import type { AuthRequest } from "../middleware/authonticated.middleware";
import { buildSalesScopeFilter, isTerritoryScopedRole } from "../services/territory.service";
import { Role } from "../constants/roles";
import { ISalesItem } from "../types/salesVoucher.type";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { logDayBookEntry, removeDayBookEntry } from "../utils/dayBookLogger";
import { applyProductStockDelta } from "../utils/applyProductStockDelta";

/** Fields accepted from PUT body when updating a sales voucher. */
const SALES_VOUCHER_PATCH_KEYS = [
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
  "paymentStatus",
  "orderStatus",
  "stockDetails",
] as const;

/**
 * Next sales voucher no. in `JITOX-DEMO-SL-001` form — scans existing codes so
 * sequencing continues past existing data.
 */
async function computeNextSalesVoucherNo(): Promise<string> {
  const docs = await SalesVoucher.find().select("voucherNo").lean();
  let max = 0;
  const re = /^JITOX-DEMO-SL-(\d+)$/i;
  for (const d of docs) {
    const v = String(d?.voucherNo ?? "").trim();
    const m = re.exec(v);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }
  }
  const next = max + 1;
  return `JITOX-DEMO-SL-${String(next).padStart(3, "0")}`;
}

/** Reserve the next free voucher no. — retries on race so two creates can't collide. */
async function resolveUniqueSalesVoucherNo(
  requested?: string
): Promise<string> {
  const base = String(requested || "").trim();
  if (base) {
    const taken = await SalesVoucher.findOne({ voucherNo: base });
    if (!taken) return base;
  }
  for (let i = 0; i < 60; i++) {
    const candidate = await computeNextSalesVoucherNo();
    const taken = await SalesVoucher.findOne({ voucherNo: candidate });
    if (!taken) return candidate;
  }
  return `JITOX-DEMO-SL-${Date.now()}`;
}

/** Did the user opt into stock update for this voucher? */
function shouldUpdateStock(stockDetails: unknown): boolean {
  if (!stockDetails || typeof stockDetails !== "object") return false;
  return Boolean((stockDetails as { stockQuantity?: unknown }).stockQuantity);
}

export const createSalesVoucher = async (
  req: AuthRequest,
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
      paymentStatus,
      orderStatus,
      stockDetails,
    } = req.body;

    const requiredFields = ["partyName", "voucherDate", "items"] as const;
    validateAndRespond(req.body, requiredFields, res);

    const productIds = (items as ISalesItem[]).map((item) => item.product);
    const validProducts = await Product.find({ _id: { $in: productIds } });
    if (validProducts.length !== productIds.length) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "One or more product IDs are invalid."
      );
    }

    const resolvedVoucherNo = await resolveUniqueSalesVoucherNo(voucherNo);

    let orderbyFinal = String(orderby || "").trim();
    let createdByUserId: Types.ObjectId | undefined;
    let territoryId: Types.ObjectId | undefined;
    let managerUserId: Types.ObjectId | undefined;

    const authId = req.user?.id ? String(req.user.id) : "";
    const authRole = req.user?.role ? String(req.user.role) : "";
    if (authId && isTerritoryScopedRole(authRole)) {
      const creator = await User.findById(authId).select(
        "name firstName lastName email territoryId managerId role"
      );
      if (creator) {
        createdByUserId = creator._id as Types.ObjectId;
        if (creator.territoryId) territoryId = creator.territoryId;
        if (creator.managerId) managerUserId = creator.managerId;
        if (!orderbyFinal) {
          orderbyFinal =
            creator.name ||
            [creator.firstName, creator.lastName].filter(Boolean).join(" ").trim() ||
            creator.email;
        }
      }
    }

    const newVoucher = new SalesVoucher({
      partyName,
      invoiceNo,
      dueDate,
      transportDetails,
      deliveryAt,
      orderby: orderbyFinal,
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
      paymentStatus,
      orderStatus,
      stockDetails,
      ...(createdByUserId ? { createdByUserId } : {}),
      ...(territoryId ? { territoryId } : {}),
      ...(managerUserId ? { managerUserId } : {}),
    });

    const savedVoucher = await newVoucher.save();

    /** Stock toggle ON → sales leave stock, decrement product qty by line qty. */
    if (shouldUpdateStock(stockDetails)) {
      await applyProductStockDelta(items as ISalesItem[], -1);
    }

    await logDayBookEntry({
      voucherNumber: savedVoucher.voucherNo,
      voucherType: "Sales",
      particulars: `${partyName} — sales${
        invoiceNo ? ` (Inv ${invoiceNo})` : ""
      }`,
      debitAmount: totalAmount,
      creditAmount: totalAmount,
    });

    sendCreated(res, savedVoucher, "Sales voucher created successfully.");
  } catch (error) {
    console.error("Create Sales Voucher Error:", error);
    throw error;
  }
};

export const getAllSalesVouchers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { partyName, dueDate, dateFrom, dateTo } = req.query;

    const matchStage: Record<string, unknown> = {};
    const scope = await buildSalesScopeFilter({
      id: req.user?.id ? String(req.user.id) : undefined,
      role: req.user?.role ? String(req.user.role) : undefined,
    });
    if (scope && Object.keys(scope).length) {
      Object.assign(matchStage, scope);
    }

    if (req.user?.role === Role.admin && req.query.territoryId) {
      matchStage.territoryId = new Types.ObjectId(String(req.query.territoryId));
    }

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

    const vouchers = await SalesVoucher.aggregate([
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
          paymentStatus: 1,
          orderStatus: 1,
          basePrice: 1,
          items: 1,
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
      vouchers.length ? "" : "No sales vouchers found."
    );
  } catch (error) {
    console.error("Get All Sales Vouchers Error:", error);
    throw error;
  }
};

export const getSalesVoucherById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const voucher = await SalesVoucher.findById(id).populate(
      "items.product",
      "productName category group"
    );

    if (!voucher) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No sales voucher found.");
    }

    res.status(200).json(voucher);
  } catch (error) {
    console.error("Get Sales Voucher by ID Error:", error);
    throw error;
  }
};

export const updateSalesVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const raw = req.body as Record<string, unknown>;

    const voucher = await SalesVoucher.findById(id);
    if (!voucher) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No sales voucher found.");
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
      const clash = await SalesVoucher.findOne({
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
    for (const key of SALES_VOUCHER_PATCH_KEYS) {
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

    /** Reconcile stock: rollback the old sale, then apply the new sale. */
    const nextStockOn = shouldUpdateStock(voucher.stockDetails);
    if (prevStockOn) {
      await applyProductStockDelta(prevItems, +1); // undo old decrement
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

    const salesInvoiceNo = (voucher as any).invoiceNo;
    await logDayBookEntry({
      voucherNumber: voucher.voucherNo,
      voucherType: "Sales",
      particulars: `${voucher.partyName} — sales${
        salesInvoiceNo ? ` (Inv ${salesInvoiceNo})` : ""
      }`,
      debitAmount: voucher.totalAmount as unknown as string,
      creditAmount: voucher.totalAmount as unknown as string,
    });

    sendSuccess(res, voucher, "Sales voucher updated successfully.");
  } catch (error) {
    console.error("Update Sales Voucher Error:", error);
    throw error;
  }
};

export const deleteSalesVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedVoucher = await SalesVoucher.findByIdAndDelete(id);
    if (!deletedVoucher) {
      throw new AppError(HttpStatusCode.NOT_FOUND, "No sales voucher found.");
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

    res.status(200).json({ message: "Sales voucher deleted successfully." });
  } catch (error) {
    console.error("Delete Sales Voucher Error:", error);
    throw error;
  }
};

/** Dropdowns + next auto voucher no. for the Add Sales modal. */
export const getSalesFormMeta = async (
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

    let nextSalesVoucherNo = "JITOX-DEMO-SL-001";
    try {
      nextSalesVoucherNo = await computeNextSalesVoucherNo();
    } catch (e) {
      console.error("computeNextSalesVoucherNo", e);
    }

    sendSuccess(res, { nextSalesVoucherNo, parties });
  } catch (error) {
    console.error("getSalesFormMeta", error);
    res.status(500).json({ message: "Failed to load sales voucher form meta." });
  }
};
