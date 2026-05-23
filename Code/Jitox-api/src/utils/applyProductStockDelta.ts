import { Product } from "../models/index";
import { productIdFromRef } from "./productUnit";
import { checkAndNotifyProductLowStock } from "./productStockAlert";

/**
 * Apply stock in/out on Product Master: updates `quantity` and syncs `amout`
 * to qty × rate so list/stock tables stay correct without a manual edit.
 */
export async function applyProductStockDelta(
  items: Array<{ product: unknown; quantity: unknown }>,
  multiplier: 1 | -1
): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) return;

  const totals = new Map<string, number>();
  for (const it of items) {
    const pid = productIdFromRef(it?.product);
    const qty = Number(it?.quantity);
    if (!pid || !Number.isFinite(qty) || qty === 0) continue;
    totals.set(pid, (totals.get(pid) ?? 0) + qty);
  }

  if (totals.size === 0) return;

  await Promise.all(
    Array.from(totals.entries()).map(async ([pid, qty]) => {
      const delta = qty * multiplier;
      try {
        await Product.findByIdAndUpdate(
          pid,
          [
            {
              $set: {
                quantity: {
                  $max: [
                    0,
                    { $add: [{ $ifNull: ["$quantity", 0] }, delta] },
                  ],
                },
              },
            },
            {
              $set: {
                amout: {
                  $multiply: [
                    "$quantity",
                    {
                      $cond: {
                        if: {
                          $and: [
                            { $ne: ["$rate", null] },
                            { $gt: [{ $ifNull: ["$rate", 0] }, 0] },
                          ],
                        },
                        then: "$rate",
                        else: { $ifNull: ["$billingRatePerUnit", 0] },
                      },
                    },
                  ],
                },
              },
            },
          ]
        );
        await checkAndNotifyProductLowStock(pid);
      } catch (err) {
        console.error("applyProductStockDelta failed", { pid, qty, multiplier, err });
      }
    })
  );
}
