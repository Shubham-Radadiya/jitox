import { Request, Response } from "express";
import mongoose from "mongoose";
import ManufacturingVoucher from "../models/manufacturingVoucher.model";
import { Product } from "../models/index";
import { validateAndRespond } from "../utils/validateAndRespond";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import {
  IManufacturingAdditionalCost,
  IManufacturingRawMaterial,
} from "../types/manufacturingVoucher.type";
import { applyProductStockDelta } from "../utils/applyProductStockDelta";
import { productIdFromRef } from "../utils/productUnit";

function requireManufacturingId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(HttpStatusCode.BAD_REQUEST, "Invalid id format.");
  }
}

const PATCH_KEYS = [
  "batchCode",
  "mfgDate",
  "expDate",
  "finishedProduct",
  "quantityToProduce",
  "produceUnit",
  "rawMaterials",
  "additionalCosts",
  "remarks",
  "rawMaterialTotal",
  "additionalTotal",
  "grandTotal",
  "landingCostPerUnit",
] as const;

export type StockIssue = {
  productId: string;
  productName: string;
  required: number;
  available: number;
  unit?: string;
};

async function computeNextVoucherNo(): Promise<string> {
  const docs = await ManufacturingVoucher.find().select("voucherNo").lean();
  let max = 0;
  const re = /^MFG-(\d+)$/i;
  for (const d of docs) {
    const v = String(d?.voucherNo ?? "").trim();
    const m = re.exec(v);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }
  }
  return `MFG-${String(max + 1).padStart(4, "0")}`;
}

async function resolveUniqueVoucherNo(requested?: string): Promise<string> {
  const base = String(requested || "").trim();
  if (base) {
    const taken = await ManufacturingVoucher.findOne({ voucherNo: base });
    if (!taken) return base;
  }
  for (let i = 0; i < 60; i++) {
    const candidate = await computeNextVoucherNo();
    const taken = await ManufacturingVoucher.findOne({ voucherNo: candidate });
    if (!taken) return candidate;
  }
  return `MFG-${Date.now()}`;
}

function normalizeRawLines(
  lines: unknown[]
): IManufacturingRawMaterial[] {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "At least one raw material row is required."
    );
  }
  return lines.map((line: any) => {
    const product = String(line?.product ?? "").trim();
    const requiredQty = Number(line?.requiredQty);
    const ratePerUnit = Number(line?.ratePerUnit ?? line?.rate);
    if (!product || !Number.isFinite(requiredQty) || requiredQty <= 0) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Each raw material needs a product and required quantity."
      );
    }
    if (!Number.isFinite(ratePerUnit) || ratePerUnit < 0) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Each raw material needs a valid rate per unit."
      );
    }
    const subtotal =
      Number(line?.subtotal) ||
      Math.round(requiredQty * ratePerUnit * 100) / 100;
    return {
      product: product as any,
      requiredQty,
      ratePerUnit,
      unit: line?.unit ? String(line.unit).trim() : undefined,
      subtotal,
    };
  });
}

function normalizeAdditionalCosts(
  lines: unknown[] | undefined
): IManufacturingAdditionalCost[] {
  if (!Array.isArray(lines)) return [];
  return lines
    .map((line: any) => {
      const account = String(line?.account ?? "").trim();
      const qty = Number(line?.qty);
      const rate = Number(line?.rate);
      if (!account || !Number.isFinite(qty) || qty < 0 || !Number.isFinite(rate)) {
        return null;
      }
      const amount =
        Number(line?.amount) || Math.round(qty * rate * 100) / 100;
      return {
        account,
        qty,
        unit: line?.unit ? String(line.unit).trim() : undefined,
        rate,
        amount,
      };
    })
    .filter(Boolean) as IManufacturingAdditionalCost[];
}

async function validateProductIds(ids: string[]): Promise<void> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return;
  const found = await Product.find({ _id: { $in: unique } });
  if (found.length !== unique.length) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "One or more product IDs are invalid."
    );
  }
}

export async function checkRawStock(
  rawMaterials: IManufacturingRawMaterial[]
): Promise<StockIssue[]> {
  const issues: StockIssue[] = [];
  for (const line of rawMaterials) {
    const pid = productIdFromRef(line.product);
    if (!pid || !mongoose.Types.ObjectId.isValid(pid)) continue;

    const populated =
      line.product != null &&
      typeof line.product === "object" &&
      !Array.isArray(line.product);
    const populatedDoc = populated
      ? (line.product as { productName?: string })
      : null;

    /** Always read latest quantity from DB (recheck after stock updates). */
    const product = await Product.findById(pid)
      .select("productName quantity alternateUnits")
      .lean();

    const productName = String(
      populatedDoc?.productName ?? product?.productName ?? "Product"
    );
    const available = Number(product?.quantity ?? 0);
    const unit =
      line.unit ||
      String(product?.alternateUnits ?? "");

    if (!product) {
      issues.push({
        productId: pid,
        productName: "Unknown product",
        required: line.requiredQty,
        available: 0,
        unit,
      });
      continue;
    }

    const required = Number(line.requiredQty) || 0;
    if (required > available) {
      issues.push({
        productId: pid,
        productName,
        required,
        available,
        unit,
      });
    }
  }
  return issues;
}

/**
 * After product inventory changes (e.g. starting another batch), re-check every
 * Planned/Paused batch against current stock and set Paused / Planned accordingly.
 */
async function syncAllPlannedPausedManufacturingStatuses(): Promise<void> {
  const docs = await ManufacturingVoucher.find({
    status: { $in: ["Planned", "Paused"] },
  })
    .select("rawMaterials status")
    .lean();

  for (const v of docs) {
    const id = v._id;
    const current = String(v.status || "Planned");
    let issues: StockIssue[] = [];
    try {
      issues = await checkRawStock(
        (v.rawMaterials || []) as IManufacturingRawMaterial[]
      );
    } catch (err) {
      console.error("syncAllPlannedPausedManufacturingStatuses", id, err);
      continue;
    }
    const blocked = issues.length > 0;
    if (blocked && current === "Planned") {
      await ManufacturingVoucher.updateOne({ _id: id }, { status: "Paused" });
    } else if (!blocked && current === "Paused") {
      await ManufacturingVoucher.updateOne({ _id: id }, { status: "Planned" });
    }
  }
}

function recalcTotals(body: {
  rawMaterials: IManufacturingRawMaterial[];
  additionalCosts: IManufacturingAdditionalCost[];
  quantityToProduce: number;
}) {
  const rawMaterialTotal = body.rawMaterials.reduce(
    (s, r) => s + (Number(r.subtotal) || 0),
    0
  );
  const additionalTotal = body.additionalCosts.reduce(
    (s, c) => s + (Number(c.amount) || 0),
    0
  );
  const grandTotal = rawMaterialTotal + additionalTotal;
  const qty = Number(body.quantityToProduce) || 0;
  const landingCostPerUnit = qty > 0 ? grandTotal / qty : 0;
  return {
    rawMaterialTotal,
    additionalTotal,
    grandTotal,
    landingCostPerUnit,
  };
}

export const createManufacturingVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      batchCode,
      mfgDate,
      expDate,
      finishedProduct,
      quantityToProduce,
      produceUnit,
      rawMaterials,
      additionalCosts,
      remarks,
      voucherNo,
    } = req.body;

    validateAndRespond(
      req.body,
      ["finishedProduct", "mfgDate", "quantityToProduce", "rawMaterials"],
      res
    );

    const rawLines = normalizeRawLines(rawMaterials);
    const costLines = normalizeAdditionalCosts(additionalCosts);
    const qty = Number(quantityToProduce);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Quantity to produce must be greater than zero."
      );
    }

    const productIds = [
      String(finishedProduct),
      ...rawLines.map((r) => String(r.product)),
    ];
    await validateProductIds(productIds);

    const totals = recalcTotals({
      rawMaterials: rawLines,
      additionalCosts: costLines,
      quantityToProduce: qty,
    });

    const resolvedVoucherNo = await resolveUniqueVoucherNo(voucherNo);
    const resolvedBatch =
      String(batchCode || "").trim() || (await computeNextBatchCode());

    const doc = new ManufacturingVoucher({
      voucherNo: resolvedVoucherNo,
      batchCode: resolvedBatch,
      mfgDate: new Date(mfgDate),
      expDate: expDate ? new Date(expDate) : undefined,
      finishedProduct,
      quantityToProduce: qty,
      produceUnit: produceUnit ? String(produceUnit).trim() : undefined,
      status: "Planned",
      rawMaterials: rawLines,
      additionalCosts: costLines,
      remarks: remarks ? String(remarks).trim() : undefined,
      ...totals,
    });

    const saved = await doc.save();
    await saved.populate("finishedProduct", "productName category group quantity");
    await saved.populate(
      "rawMaterials.product",
      "productName quantity billingRatePerUnit"
    );

    sendCreated(res, saved, "Manufacturing batch saved.");
  } catch (error) {
    console.error("Create Manufacturing Voucher Error:", error);
    throw error;
  }
};

function dayjsBatchStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** Next batch id like `20250610-01` (date prefix + daily sequence). */
async function computeNextBatchCode(): Promise<string> {
  const stamp = dayjsBatchStamp();
  const prefix = `${stamp}-`;
  const docs = await ManufacturingVoucher.find({
    batchCode: { $regex: `^${stamp}-\\d+$` },
  })
    .select("batchCode")
    .lean();

  let max = 0;
  for (const d of docs) {
    const code = String(d?.batchCode ?? "");
    if (!code.startsWith(prefix)) continue;
    const suffix = parseInt(code.slice(prefix.length), 10);
    if (Number.isFinite(suffix)) max = Math.max(max, suffix);
  }
  return `${prefix}${String(max + 1).padStart(2, "0")}`;
}

/** Preview numbers when the Add Manufacturing form opens (not saved until POST). */
export const getManufacturingFormMeta = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    let nextVoucherNo = "MFG-0001";
    let nextBatchCode = `${dayjsBatchStamp()}-01`;
    try {
      nextVoucherNo = await computeNextVoucherNo();
      nextBatchCode = await computeNextBatchCode();
    } catch (e) {
      console.error("getManufacturingFormMeta", e);
    }
    sendSuccess(res, { nextVoucherNo, nextBatchCode });
  } catch (error) {
    console.error("getManufacturingFormMeta", error);
    res
      .status(500)
      .json({ message: "Failed to load manufacturing form meta." });
  }
};

export const getAllManufacturingVouchers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const vouchers = await ManufacturingVoucher.find()
      .sort({ createdAt: -1 })
      .populate("finishedProduct", "productName category group units")
      .populate("rawMaterials.product", "productName quantity alternateUnits")
      .lean();

    const data = await Promise.all(
      vouchers.map(async (v) => {
        let status = String(v.status || "Planned");
        let stockIssues: StockIssue[] = [];
        if (status === "Planned" || status === "Paused") {
          try {
            stockIssues = await checkRawStock(
              (v.rawMaterials || []) as IManufacturingRawMaterial[]
            );
          } catch (err) {
            console.error("checkRawStock for list row", v._id, err);
          }
          const blocked = stockIssues.length > 0;
          if (blocked && status === "Planned") {
            await ManufacturingVoucher.updateOne(
              { _id: v._id },
              { status: "Paused" }
            );
            status = "Paused";
          } else if (!blocked && status === "Paused") {
            await ManufacturingVoucher.updateOne(
              { _id: v._id },
              { status: "Planned" }
            );
            status = "Planned";
          }
        }
        return {
          ...v,
          status,
          stockIssues,
          stockBlocked: stockIssues.length > 0,
        };
      })
    );

    sendSuccess(
      res,
      { count: data.length, data },
      data.length ? "" : "No manufacturing batches found."
    );
  } catch (error) {
    console.error("Get All Manufacturing Vouchers Error:", error);
    throw error;
  }
};

export const getManufacturingVoucherById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    requireManufacturingId(id);
    const voucher = await ManufacturingVoucher.findById(id)
      .populate("finishedProduct", "productName category group quantity billingRatePerUnit")
      .populate(
        "rawMaterials.product",
        "productName quantity billingRatePerUnit alternateUnits"
      );

    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Manufacturing batch not found."
      );
    }

    sendSuccess(res, voucher);
  } catch (error) {
    console.error("Get Manufacturing Voucher Error:", error);
    throw error;
  }
};

export const updateManufacturingVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    requireManufacturingId(id);
    const voucher = await ManufacturingVoucher.findById(id);
    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Manufacturing batch not found."
      );
    }
    if (voucher.status !== "Planned" && voucher.status !== "Paused") {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Only planned or paused batches can be edited."
      );
    }

    const patch: Record<string, unknown> = {};
    for (const key of PATCH_KEYS) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        patch[key] = req.body[key];
      }
    }

    if (patch.rawMaterials) {
      patch.rawMaterials = normalizeRawLines(patch.rawMaterials as unknown[]);
    }
    if (patch.additionalCosts) {
      patch.additionalCosts = normalizeAdditionalCosts(
        patch.additionalCosts as unknown[]
      );
    }

    const finishedId = patch.finishedProduct ?? voucher.finishedProduct;
    const rawLines =
      (patch.rawMaterials as IManufacturingRawMaterial[]) ?? voucher.rawMaterials;
    const costLines =
      (patch.additionalCosts as IManufacturingAdditionalCost[]) ??
      voucher.additionalCosts;
    const qty = Number(patch.quantityToProduce ?? voucher.quantityToProduce);

    const productIds = [
      String(finishedId),
      ...rawLines.map((r) => String(r.product)),
    ];
    await validateProductIds(productIds);

    const totals = recalcTotals({
      rawMaterials: rawLines,
      additionalCosts: costLines,
      quantityToProduce: qty,
    });

    voucher.set({ ...patch, ...totals });

    const issues = await checkRawStock(
      (voucher.rawMaterials || []) as IManufacturingRawMaterial[]
    );
    if (issues.length > 0) {
      voucher.status = "Paused";
    } else if (voucher.status === "Paused") {
      voucher.status = "Planned";
    }

    await voucher.save();
    await voucher.populate("finishedProduct", "productName");
    await voucher.populate("rawMaterials.product", "productName quantity");

    sendSuccess(res, voucher, "Manufacturing batch updated.");
  } catch (error) {
    console.error("Update Manufacturing Voucher Error:", error);
    throw error;
  }
};

export const deleteManufacturingVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    requireManufacturingId(id);
    const voucher = await ManufacturingVoucher.findById(id);
    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Manufacturing batch not found."
      );
    }
    if (voucher.status !== "Planned" && voucher.status !== "Paused") {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Only planned or paused batches can be deleted."
      );
    }
    await voucher.deleteOne();
    await syncAllPlannedPausedManufacturingStatuses();
    sendSuccess(res, null, "Manufacturing batch deleted.");
  } catch (error) {
    console.error("Delete Manufacturing Voucher Error:", error);
    throw error;
  }
};

export const recheckManufacturingStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    requireManufacturingId(id);
    const voucher = await ManufacturingVoucher.findById(id).populate(
      "rawMaterials.product",
      "productName quantity alternateUnits"
    );
    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Manufacturing batch not found."
      );
    }
    const issues = await checkRawStock(
      (voucher.rawMaterials || []) as IManufacturingRawMaterial[]
    );
    const ok = issues.length === 0;
    if (ok && voucher.status === "Paused") {
      voucher.status = "Planned";
      await voucher.save();
    } else if (!ok && voucher.status === "Planned") {
      voucher.status = "Paused";
      await voucher.save();
    }
    await syncAllPlannedPausedManufacturingStatuses();
    sendSuccess(res, {
      ok,
      stockIssues: issues,
      status: voucher.status,
    });
  } catch (error) {
    console.error("Recheck manufacturing stock Error:", error);
    throw error;
  }
};

export const startManufacturingVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    requireManufacturingId(id);
    const voucher = await ManufacturingVoucher.findById(id);
    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Manufacturing batch not found."
      );
    }
    if (voucher.status !== "Planned" && voucher.status !== "Paused") {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Only planned or paused batches can be started."
      );
    }

    const issues = await checkRawStock(
      (voucher.rawMaterials || []) as IManufacturingRawMaterial[]
    );
    if (issues.length > 0) {
      if (voucher.status === "Planned") {
        voucher.status = "Paused";
        await voucher.save();
      }
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message:
          "The following raw materials are low or out of stock. Please update stock or reduce quantity.",
        stockIssues: issues,
      });
      return;
    }

    const stockLines = voucher.rawMaterials.map((r) => ({
      product: r.product,
      quantity: r.requiredQty,
    }));
    await applyProductStockDelta(stockLines, -1);

    voucher.status = "In Progress";
    voucher.startedAt = new Date();
    await voucher.save();
    await syncAllPlannedPausedManufacturingStatuses();
    await voucher.populate("finishedProduct", "productName");

    sendSuccess(res, voucher, "Manufacturing started. Raw stock updated.");
  } catch (error) {
    console.error("Start Manufacturing Voucher Error:", error);
    throw error;
  }
};

export const completeManufacturingVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    requireManufacturingId(id);
    const voucher = await ManufacturingVoucher.findById(id);
    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Manufacturing batch not found."
      );
    }
    if (voucher.status !== "In Progress") {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Only in-progress batches can be completed."
      );
    }

    await applyProductStockDelta(
      [
        {
          product: voucher.finishedProduct,
          quantity: voucher.quantityToProduce,
        },
      ],
      +1
    );

    voucher.status = "Completed";
    voucher.completedAt = new Date();
    await voucher.save();
    await voucher.populate("finishedProduct", "productName");

    sendSuccess(res, voucher, "Batch completed. Finished product added to stock.");
  } catch (error) {
    console.error("Complete Manufacturing Voucher Error:", error);
    throw error;
  }
};

export const failManufacturingVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    requireManufacturingId(id);
    const { failureReason, failureRemarks, supervisorName } = req.body;
    const reason = String(failureReason ?? "").trim();
    if (!reason) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Failure reason is required."
      );
    }

    const voucher = await ManufacturingVoucher.findById(id);
    if (!voucher) {
      throw new AppError(
        HttpStatusCode.NOT_FOUND,
        "Manufacturing batch not found."
      );
    }
    if (voucher.status === "Completed") {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "Completed batches cannot be marked failed."
      );
    }
    if (voucher.status === "Failed") {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        "This batch is already marked as failed."
      );
    }

    if (voucher.status === "In Progress") {
      const rawLines = Array.isArray(voucher.rawMaterials)
        ? voucher.rawMaterials
        : [];
      const stockLines = rawLines.map((r) => ({
        product:
          r.product != null &&
          typeof r.product === "object" &&
          "_id" in (r.product as object)
            ? (r.product as { _id: unknown })._id
            : r.product,
        quantity: r.requiredQty,
      }));
      await applyProductStockDelta(stockLines, +1);
    }

    const file = (req as Request & { file?: Express.Multer.File }).file;
    voucher.status = "Failed";
    voucher.failureReason = reason;
    voucher.failureRemarks = failureRemarks
      ? String(failureRemarks).trim()
      : undefined;
    voucher.supervisorName = supervisorName
      ? String(supervisorName).trim()
      : undefined;
    voucher.failedAt = new Date();
    if (file?.filename) {
      voucher.failureAttachment = file.filename;
    }
    await voucher.save();
    await syncAllPlannedPausedManufacturingStatuses();
    await voucher.populate("finishedProduct", "productName");

    sendSuccess(res, voucher, "Batch marked as failed.");
  } catch (error) {
    console.error("Fail Manufacturing Voucher Error:", error);
    throw error;
  }
};
