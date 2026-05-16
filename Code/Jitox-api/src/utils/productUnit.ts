import mongoose from "mongoose";

/** Resolve product id from an ObjectId, string, or populated product subdoc. */
export function productIdFromRef(product: unknown): string {
  if (product == null || product === "") return "";
  if (typeof product === "string") return product.trim();
  if (typeof product === "object") {
    const doc = product as { _id?: unknown };
    if (doc._id != null) return String(doc._id);
  }
  const asString = String(product);
  return asString === "[object Object]" ? "" : asString.trim();
}

/** Legacy products stored units as numeric codes (1 = kg, etc.). */
const LEGACY_UNIT_NUM: Record<number, string> = {
  1: "kg",
  2: "ltr",
  3: "gm",
  4: "ml",
};

export function resolveProductUnit(units: unknown): string {
  if (units == null || units === "") return "";
  const n = Number(units);
  if (Number.isFinite(n) && LEGACY_UNIT_NUM[n]) return LEGACY_UNIT_NUM[n];
  return String(units).trim();
}

type ProductAmountFields = {
  amout?: unknown;
  quantity?: unknown;
  rate?: unknown;
  billingRatePerUnit?: unknown;
};

/** Inventory line value: current qty × rate (keeps in sync when stock moves). */
export function productLineAmount(p: ProductAmountFields): number {
  const qty = Number(p.quantity) || 0;
  const rate =
    p.rate != null && Number.isFinite(Number(p.rate))
      ? Number(p.rate)
      : Number(p.billingRatePerUnit) || 0;
  return qty * rate;
}
