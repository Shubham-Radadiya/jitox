import { Product } from "../models/index";
import Notification from "../models/notification.model";
import {
  createAndPushNotification,
  getAdminUserIds,
} from "../services/notification.service";
import { emitToAdmins } from "../socket/io";

type ProductStockLike = {
  _id?: unknown;
  productName?: unknown;
  units?: unknown;
  quantity?: unknown;
  minimumReorderLevel?: unknown;
  stockQuantity?: unknown;
};

/** Track stock on and qty at or below minimum reorder level (inclusive). */
export function isProductAtOrBelowReorder(product: ProductStockLike): boolean {
  if (product.stockQuantity === false) return false;
  const min = Number(product.minimumReorderLevel);
  if (!Number.isFinite(min) || min < 0) return false;
  const qty = Number(product.quantity) || 0;
  return qty <= min;
}

export async function resolveProductLowStockNotifications(
  productId: string
): Promise<void> {
  await Notification.updateMany(
    {
      type: "product_low_stock",
      read: false,
      "meta.productId": productId,
    },
    {
      $set: {
        read: true,
        "meta.resolvedAt": new Date().toISOString(),
      },
    }
  );
}

/** Notify admins once per product while stock stays at/below reorder level. */
export async function checkAndNotifyProductLowStock(
  productId: string
): Promise<void> {
  const product = await Product.findById(productId).lean();
  if (!product) return;

  const pid = String(product._id);

  if (!isProductAtOrBelowReorder(product)) {
    await resolveProductLowStockNotifications(pid);
    return;
  }

  const existing = await Notification.findOne({
    type: "product_low_stock",
    read: false,
    "meta.productId": pid,
  }).lean();
  if (existing) return;

  const adminIds = await getAdminUserIds();
  if (!adminIds.length) return;

  const name = String(product.productName || "Product").trim() || "Product";
  const qty = Number(product.quantity) || 0;
  const min = Number(product.minimumReorderLevel) || 0;
  const unit = String(product.units || "").trim();
  const qtyLabel = unit ? `${qty} ${unit}` : String(qty);
  const minLabel = unit ? `${min} ${unit}` : String(min);
  const body = `"${name}" stock is ${qtyLabel} (minimum reorder: ${minLabel}). Please reorder.`;

  await Promise.all(
    adminIds.map((uid) =>
      createAndPushNotification({
        userId: uid,
        type: "product_low_stock",
        title: "Low stock — reorder needed",
        body,
        meta: {
          productId: pid,
          productName: name,
          quantity: qty,
          minimumReorderLevel: min,
          units: unit,
        },
      })
    )
  );

  emitToAdmins("stock:low", { productId: pid, productName: name });
}
