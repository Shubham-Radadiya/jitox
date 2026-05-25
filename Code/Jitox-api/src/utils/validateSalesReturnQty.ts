import mongoose from "mongoose";
import SalesReturnVoucher from "../models/salesReturnVoucher.model";
import SalesVoucher from "../models/salesVoucher.model";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { productIdFromRef } from "./productUnit";
import type { ISalesItem } from "../types/salesVoucher.type";

function sumByProduct(
  items: Array<{ product?: unknown; quantity?: unknown }>
): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items || []) {
    const pid = productIdFromRef(it?.product);
    const qty = Number(it?.quantity) || 0;
    if (!pid || qty <= 0) continue;
    m.set(pid, (m.get(pid) ?? 0) + qty);
  }
  return m;
}

/**
 * Return qty cannot exceed sold minus already pending/approved returns
 * (excluding current doc when editing).
 */
export async function assertSalesReturnQuantitiesAllowed(
  sourceSalesId: unknown,
  items: ISalesItem[],
  excludeReturnId?: unknown
): Promise<void> {
  if (!sourceSalesId || !mongoose.isValidObjectId(sourceSalesId)) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "Link this return to a sales voucher (sourceSalesId)."
    );
  }

  const sale = await SalesVoucher.findById(sourceSalesId).lean();
  if (!sale) {
    throw new AppError(HttpStatusCode.NOT_FOUND, "Linked sales voucher not found.");
  }

  const sold = sumByProduct(sale.items || []);
  const filter: Record<string, unknown> = {
    sourceSalesId: sale._id,
    approvalStatus: { $in: ["Pending", "Approved"] },
  };
  if (excludeReturnId && mongoose.isValidObjectId(excludeReturnId)) {
    filter._id = { $ne: excludeReturnId };
  }

  const existing = await SalesReturnVoucher.find(filter).lean();
  const used = new Map<string, number>();
  for (const doc of existing) {
    const m = sumByProduct(doc.items || []);
    for (const [pid, qty] of m) {
      used.set(pid, (used.get(pid) ?? 0) + qty);
    }
  }

  const next = sumByProduct(items);
  for (const [pid, qty] of next) {
    const max = sold.get(pid) ?? 0;
    const already = used.get(pid) ?? 0;
    if (qty + already > max + 1e-9) {
      throw new AppError(
        HttpStatusCode.BAD_REQUEST,
        `Return quantity exceeds sold quantity for a product (max ${Math.max(0, max - already)}).`
      );
    }
  }
}
