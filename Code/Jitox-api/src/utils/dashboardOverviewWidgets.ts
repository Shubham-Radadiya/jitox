import {
  Product,
  User,
  Account,
  PurchaseVoucher,
  PurchaseReturnVoucher,
  SalesVoucher,
  SalesReturnVoucher,
  ManufacturingVoucher,
} from "../models/index";
import { productIdFromRef } from "./productUnit";

export type DashboardOverviewPeriod = "week" | "month";

export function parseDashboardOverviewPeriod(
  raw: unknown,
  fallback: DashboardOverviewPeriod = "month"
): DashboardOverviewPeriod {
  const s = String(raw ?? "").toLowerCase().trim();
  return s === "week" ? "week" : fallback;
}

export function dashboardOverviewPeriodRange(period: DashboardOverviewPeriod): {
  start: Date;
  end: Date;
} {
  const end = new Date();
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (period === "week" ? 7 : 30));
  return { start, end };
}

function stockCutEnabled(stockDetails: unknown): boolean {
  return Boolean(
    (stockDetails as { stockQuantity?: unknown } | null)?.stockQuantity
  );
}

function addItemDeltas(
  deltas: Map<string, number>,
  items: Array<{ product?: unknown; quantity?: unknown }> | undefined,
  multiplier: 1 | -1
) {
  if (!Array.isArray(items)) return;
  for (const it of items) {
    const pid = productIdFromRef(it?.product);
    const qty = Number(it?.quantity);
    if (!pid || !Number.isFinite(qty) || qty === 0) continue;
    deltas.set(pid, (deltas.get(pid) ?? 0) + qty * multiplier);
  }
}

async function aggregateStockDeltasInPeriod(
  start: Date,
  end: Date
): Promise<Map<string, number>> {
  const deltas = new Map<string, number>();
  const dateMatch = { $gte: start, $lte: end };

  const [purchases, purchaseReturns, sales, salesReturns, completedMfg, startedMfg] =
    await Promise.all([
      PurchaseVoucher.find({ voucherDate: dateMatch })
        .select("items stockDetails")
        .lean(),
      PurchaseReturnVoucher.find({ voucherDate: dateMatch })
        .select("items stockDetails")
        .lean(),
      SalesVoucher.find({ voucherDate: dateMatch })
        .select("items stockDetails")
        .lean(),
      SalesReturnVoucher.find({
        voucherDate: dateMatch,
        approvalStatus: "Approved",
      })
        .select("items stockDetails")
        .lean(),
      ManufacturingVoucher.find({
        status: "Completed",
        completedAt: dateMatch,
      })
        .select("finishedProduct quantityToProduce")
        .lean(),
      ManufacturingVoucher.find({
        startedAt: dateMatch,
        status: { $in: ["In Progress", "Completed", "Failed", "Paused"] },
      })
        .select("rawMaterials")
        .lean(),
    ]);

  for (const v of purchases) {
    if (!stockCutEnabled(v.stockDetails)) continue;
    addItemDeltas(deltas, v.items as Array<{ product?: unknown; quantity?: unknown }>, 1);
  }
  for (const v of purchaseReturns) {
    if (!stockCutEnabled(v.stockDetails)) continue;
    addItemDeltas(deltas, v.items as Array<{ product?: unknown; quantity?: unknown }>, -1);
  }
  for (const v of sales) {
    if (!stockCutEnabled(v.stockDetails)) continue;
    addItemDeltas(deltas, v.items as Array<{ product?: unknown; quantity?: unknown }>, -1);
  }
  for (const v of salesReturns) {
    if (!stockCutEnabled(v.stockDetails)) continue;
    addItemDeltas(deltas, v.items as Array<{ product?: unknown; quantity?: unknown }>, 1);
  }
  for (const v of completedMfg) {
    const pid = productIdFromRef(v.finishedProduct);
    const qty = Number(v.quantityToProduce);
    if (pid && Number.isFinite(qty) && qty > 0) {
      deltas.set(pid, (deltas.get(pid) ?? 0) + qty);
    }
  }
  for (const v of startedMfg) {
    for (const raw of v.rawMaterials ?? []) {
      const pid = productIdFromRef(
        (raw as { product?: unknown }).product
      );
      const qty = Number((raw as { requiredQty?: unknown }).requiredQty);
      if (!pid || !Number.isFinite(qty) || qty === 0) continue;
      deltas.set(pid, (deltas.get(pid) ?? 0) - qty);
    }
  }

  return deltas;
}

function stockChangePct(currentQty: number, deltaInPeriod: number): number {
  const atStart = currentQty - deltaInPeriod;
  if (atStart <= 0) {
    if (deltaInPeriod > 0) return 100;
    if (deltaInPeriod < 0) return -100;
    return 0;
  }
  return Math.round((deltaInPeriod / atStart) * 100);
}

export type DashboardStockItem = {
  name: string;
  qty: string;
  changePct: number;
};

export async function buildDashboardStockItems(
  period: DashboardOverviewPeriod,
  limit = 9
): Promise<DashboardStockItem[]> {
  const { start, end } = dashboardOverviewPeriodRange(period);
  const [products, deltas] = await Promise.all([
    Product.find().sort({ quantity: -1 }).limit(limit).lean(),
    aggregateStockDeltasInPeriod(start, end),
  ]);

  if (products.length === 0) {
    return [{ name: "Stock", qty: "0", changePct: 0 }];
  }

  return products.map((p) => {
    const pid = String(p._id);
    const current = Number(p.quantity) || 0;
    const delta = deltas.get(pid) ?? 0;
    return {
      name: String(p.productName ?? "Product"),
      qty: String(current),
      changePct: stockChangePct(current, delta),
    };
  });
}

const DEALER_ACCOUNT_FILTER = {
  $or: [
    { partyType: { $regex: /dealer/i } },
    { category: { $regex: /dealer/i } },
  ],
};

export type DashboardUserDistribution = {
  /** Sum of managers + dealers + users (accounts) in the active period. */
  total: number;
  rings: Array<{ label: string; pct: number; count: number; color: string }>;
};

export async function buildDashboardUserDistribution(
  period: DashboardOverviewPeriod
): Promise<DashboardUserDistribution> {
  const { start, end } = dashboardOverviewPeriodRange(period);
  const createdInPeriod = { $gte: start, $lte: end };

  const countInPeriod = async () => {
    const [managers, users, dealers] = await Promise.all([
      User.countDocuments({
        role: { $in: ["Manager", "Admin"] },
        createdAt: createdInPeriod,
      }),
      User.countDocuments({ role: "User", createdAt: createdInPeriod }),
      Account.countDocuments({
        ...DEALER_ACCOUNT_FILTER,
        createdAt: createdInPeriod,
      }),
    ]);
    return { managers, users, dealers };
  };

  const countAllTime = async () => {
    const [managers, users, dealers] = await Promise.all([
      User.countDocuments({ role: { $in: ["Manager", "Admin"] } }),
      User.countDocuments({ role: "User" }),
      Account.countDocuments(DEALER_ACCOUNT_FILTER),
    ]);
    return { managers, users, dealers };
  };

  let { managers, users, dealers } = await countInPeriod();
  const periodTotal = managers + users + dealers;
  if (periodTotal === 0) {
    ({ managers, users, dealers } = await countAllTime());
  }

  const total = managers + users + dealers;
  const ringPct = (n: number) =>
    total > 0 ? Math.round((n / total) * 100) : 0;

  return {
    total,
    rings: [
      {
        label: "Managers",
        pct: ringPct(managers),
        count: managers,
        color: "#22c55e",
      },
      {
        label: "Dealers",
        pct: ringPct(dealers),
        count: dealers,
        color: "#0ea5e9",
      },
      {
        label: "Users",
        pct: ringPct(users),
        count: users,
        color: "#a855f7",
      },
    ],
  };
}
