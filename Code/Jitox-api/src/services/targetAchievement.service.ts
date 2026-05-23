import {
  Product,
  Quotation,
  ReceiptVoucher,
  SalesVoucher,
  TargetAchievementPlan,
  User,
} from "../models/index";
import { productLineAmount } from "../utils/productUnit";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTH_IDS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

function parseAmount(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function userDisplayName(u: {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}): string {
  const fromParts = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return (
    String(u.name || "").trim() ||
    fromParts ||
    String(u.email || "").trim() ||
    "User"
  );
}

function formatInrCompact(n: number): string {
  const v = Math.round(Number(n) || 0);
  const abs = Math.abs(v);
  if (abs >= 10_000_000) {
    const cr = v / 10_000_000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1)}Cr`;
  }
  if (abs >= 100_000) {
    const L = v / 100_000;
    return `₹${L % 1 === 0 ? L.toFixed(0) : L.toFixed(1)}L`;
  }
  if (abs >= 1_000) {
    const k = v / 1_000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `₹${v.toLocaleString("en-IN")}`;
}

function monthPct(
  salesTarget: number,
  salesAchieved: number,
  collPlan: number,
  collAchieved: number
): number {
  const parts: number[] = [];
  if (salesTarget > 0) parts.push((salesAchieved / salesTarget) * 100);
  if (collPlan > 0) parts.push((collAchieved / collPlan) * 100);
  if (!parts.length) {
    if (salesAchieved > 0 || collAchieved > 0) return 100;
    return 0;
  }
  return Math.min(100, Math.round(parts.reduce((a, b) => a + b, 0) / parts.length));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function orderByMatchesManager(orderBy: string, managerName: string): boolean {
  const o = String(orderBy || "").trim().toLowerCase();
  const m = String(managerName || "").trim().toLowerCase();
  if (!o || !m) return false;
  return o === m || o.includes(m) || m.includes(o);
}

export type TargetIncentiveQuery = {
  year?: number;
  managerId?: string;
  dateFrom?: string;
  dateTo?: string;
};

function resolveYearRange(query: TargetIncentiveQuery): {
  year: number;
  rangeStart: Date;
  rangeEnd: Date;
} {
  const year = Number(query.year) || new Date().getFullYear();
  let rangeStart = new Date(year, 0, 1);
  let rangeEnd = new Date(year + 1, 0, 1);

  if (query.dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(query.dateFrom)) {
    rangeStart = new Date(`${query.dateFrom}T00:00:00.000Z`);
  }
  if (query.dateTo && /^\d{4}-\d{2}-\d{2}$/.test(query.dateTo)) {
    const d = new Date(`${query.dateTo}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    rangeEnd = d;
  }

  return { year, rangeStart, rangeEnd };
}

async function loadManagers() {
  const users = await User.find({ role: { $in: ["Manager", "Admin"] } })
    .select("name firstName lastName email role")
    .sort({ name: 1, email: 1 })
    .lean();

  return [
    { value: "all", label: "All Managers" },
    ...users.map((u) => ({
      value: String(u._id),
      label: userDisplayName(u),
    })),
  ];
}

async function loadPlansForYear(year: number, managerUserId?: string) {
  const filter: Record<string, unknown> = { year };
  if (managerUserId && managerUserId !== "all") {
    filter.managerUserId = managerUserId;
  } else {
    filter.$or = [{ managerUserId: "" }, { managerUserId: { $exists: false } }];
  }
  return TargetAchievementPlan.find(filter).lean();
}

async function aggregateMonthlyAchievement(
  rangeStart: Date,
  rangeEnd: Date,
  managerName?: string
) {
  const salesByMonth = Array(12).fill(0) as number[];
  const collByMonth = Array(12).fill(0) as number[];

  const salesFilter: Record<string, unknown> = {
    voucherDate: { $gte: rangeStart, $lt: rangeEnd },
  };
  const receiptFilter: Record<string, unknown> = {
    date: { $gte: rangeStart, $lt: rangeEnd },
  };

  const [salesVouchers, quotations, receipts] = await Promise.all([
    SalesVoucher.find(salesFilter)
      .select("voucherDate totalAmount orderby items")
      .populate({ path: "items.product", select: "productName" })
      .lean(),
    Quotation.find(salesFilter).select("voucherDate totalAmount orderby").lean(),
    ReceiptVoucher.find(receiptFilter).select("date amount").lean(),
  ]);

  const addSales = (date: Date | undefined, amount: number, orderBy?: string) => {
    if (!date) return;
    if (managerName && !orderByMatchesManager(String(orderBy || ""), managerName)) {
      return;
    }
    const m = new Date(date).getMonth();
    if (m >= 0 && m < 12) salesByMonth[m] += amount;
  };

  for (const s of salesVouchers) {
    addSales(
      s.voucherDate as Date | undefined,
      parseAmount(s.totalAmount),
      String(s.orderby || "")
    );
  }
  for (const q of quotations) {
    addSales(
      q.voucherDate as Date | undefined,
      parseAmount(q.totalAmount),
      String(q.orderby || "")
    );
  }

  for (const r of receipts) {
    if (!r.date) continue;
    const m = new Date(r.date as Date).getMonth();
    if (m >= 0 && m < 12) {
      collByMonth[m] += parseAmount(r.amount);
    }
  }

  return {
    salesByMonth: salesByMonth.map((n) => Math.round(n)),
    collByMonth: collByMonth.map((n) => Math.round(n)),
    salesVouchers,
  };
}

async function buildManagerRowsForMonth(
  monthIndex: number,
  year: number,
  plans: { managerUserId?: string; salesTarget: number; collectionPlan: number }[],
  salesVouchers: Awaited<ReturnType<typeof aggregateMonthlyAchievement>>["salesVouchers"]
) {
  const managers = await User.find({ role: { $in: ["Manager", "Admin"] } })
    .select("name firstName lastName email")
    .lean();

  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 1);

  const rows: {
    id: string;
    name: string;
    salesTarget: number;
    salesAchieved: number;
    collPlan: number;
    collAchieved: number;
    teamTotal: number;
    products: {
      id: string;
      name: string;
      closingQty: number;
      rate: number;
      value: number;
      status: string;
    }[];
  }[] = [];

  for (const mgr of managers) {
    const id = String(mgr._id);
    const name = userDisplayName(mgr);
    const plan = plans.find((p) => String(p.managerUserId || "") === id);

    let salesAchieved = 0;
    const productAgg = new Map<
      string,
      { name: string; qty: number; value: number; rate: number }
    >();

    for (const sv of salesVouchers) {
      const d = sv.voucherDate as Date | undefined;
      if (!d || d < monthStart || d >= monthEnd) continue;
      if (!orderByMatchesManager(String(sv.orderby || ""), name)) continue;
      salesAchieved += parseAmount(sv.totalAmount);
      const items = Array.isArray(sv.items) ? sv.items : [];
      for (const it of items) {
        const pop = (it as { product?: { productName?: string } | string }).product;
        const pname =
          typeof pop === "object" && pop && "productName" in pop
            ? String(pop.productName || "Product")
            : "Product";
        const key = pname;
        const sub = parseAmount((it as { subtotal?: number }).subtotal);
        const qty = Number((it as { quantity?: number }).quantity) || 0;
        const prev = productAgg.get(key) || { name: pname, qty: 0, value: 0, rate: 0 };
        prev.qty += qty;
        prev.value += sub;
        if (qty > 0) prev.rate = Math.round(sub / qty) || prev.rate;
        productAgg.set(key, prev);
      }
    }

    const collAchieved = 0;

    const salesTarget = Number(plan?.salesTarget) || 0;
    const collPlan = Number(plan?.collectionPlan) || 0;

    const products = [...productAgg.values()].slice(0, 8).map((p, i) => {
      const min = 50;
      const status = p.qty >= min ? "Sufficient" : "Low Stock";
      return {
        id: `${id}-p${i}`,
        name: p.name,
        closingQty: Math.round(p.qty),
        rate: p.rate,
        value: Math.round(p.value),
        status,
      };
    });

    if (!salesTarget && !salesAchieved && !collPlan && !collAchieved) continue;

    rows.push({
      id,
      name,
      salesTarget,
      salesAchieved: Math.round(salesAchieved),
      collPlan,
      collAchieved: Math.round(collAchieved),
      teamTotal: Math.round(salesAchieved + collAchieved),
      products,
    });
  }

  return rows;
}

async function yearlyChartTotals(endYear: number, managerName?: string) {
  const labels: string[] = [];
  const salesTarget: number[] = [];
  const salesAchieved: number[] = [];
  const collPlan: number[] = [];
  const collAchieved: number[] = [];

  for (let y = endYear - 2; y <= endYear; y++) {
    labels.push(String(y));
    const start = new Date(y, 0, 1);
    const end = new Date(y + 1, 0, 1);
    const { salesByMonth, collByMonth } = await aggregateMonthlyAchievement(
      start,
      end,
      managerName
    );
    const plans = await loadPlansForYear(y);
    const st = plans.reduce((s, p) => s + (Number(p.salesTarget) || 0), 0);
    const cp = plans.reduce((s, p) => s + (Number(p.collectionPlan) || 0), 0);
    salesTarget.push(Math.round(st));
    salesAchieved.push(salesByMonth.reduce((a, b) => a + b, 0));
    collPlan.push(Math.round(cp));
    collAchieved.push(collByMonth.reduce((a, b) => a + b, 0));
  }

  return {
    chartLabels: labels,
    salesVsAchievement: { target: salesTarget, achieved: salesAchieved },
    collectionVsAchievement: { plan: collPlan, achieved: collAchieved },
  };
}

export async function buildLiveTargetAchievementView(query: TargetIncentiveQuery) {
  const { year, rangeStart, rangeEnd } = resolveYearRange(query);
  const managerId = String(query.managerId || "all").trim();

  let managerName: string | undefined;
  if (managerId && managerId !== "all") {
    const mgr = await User.findById(managerId)
      .select("name firstName lastName email")
      .lean();
    if (mgr) managerName = userDisplayName(mgr);
  }

  const [managers, plans, achievement] = await Promise.all([
    loadManagers(),
    loadPlansForYear(year, managerId !== "all" ? managerId : undefined),
    aggregateMonthlyAchievement(rangeStart, rangeEnd, managerName),
  ]);

  const targetByMonth = Array(12)
    .fill(null)
    .map(() => ({ salesTarget: 0, collPlan: 0 }));
  for (const p of plans) {
    const mi = Number(p.month) - 1;
    if (mi >= 0 && mi < 12) {
      targetByMonth[mi].salesTarget += Number(p.salesTarget) || 0;
      targetByMonth[mi].collPlan += Number(p.collectionPlan) || 0;
    }
  }

  const months = await Promise.all(
    MONTH_SHORT.map(async (label, i) => {
      const salesTarget = Math.round(targetByMonth[i].salesTarget);
      const collPlan = Math.round(targetByMonth[i].collPlan);
      const salesAchieved = achievement.salesByMonth[i] || 0;
      const collAchieved = achievement.collByMonth[i] || 0;
      const mgrRows = await buildManagerRowsForMonth(
        i,
        year,
        plans as { managerUserId?: string; salesTarget: number; collectionPlan: number }[],
        achievement.salesVouchers
      );
      return {
        id: MONTH_IDS[i],
        label,
        salesTarget,
        salesAchieved,
        collPlan,
        collAchieved,
        pct: monthPct(salesTarget, salesAchieved, collPlan, collAchieved),
        managers: mgrRows,
      };
    })
  );

  const totals = months.reduce(
    (acc, m) => ({
      salesTarget: acc.salesTarget + m.salesTarget,
      salesAchieved: acc.salesAchieved + m.salesAchieved,
      collPlan: acc.collPlan + m.collPlan,
      collAchieved: acc.collAchieved + m.collAchieved,
    }),
    { salesTarget: 0, salesAchieved: 0, collPlan: 0, collAchieved: 0 }
  );

  const charts = await yearlyChartTotals(year, managerName);

  const hasLiveAchievement =
    totals.salesAchieved > 0 || totals.collAchieved > 0;
  const hasLiveTargets = totals.salesTarget > 0 || totals.collPlan > 0;

  return {
    overviewKpis: [
      {
        key: "totalTarget",
        label: "Total Target",
        value: formatInrCompact(totals.salesTarget),
      },
      {
        key: "totalAchievement",
        label: "Total Achievement",
        value: formatInrCompact(totals.salesAchieved),
      },
      {
        key: "collectionPlan",
        label: "Collection Plan",
        value: formatInrCompact(totals.collPlan),
      },
      {
        key: "collectionAchieved",
        label: "Collection Achieved",
        value: formatInrCompact(totals.collAchieved),
      },
    ],
    chartLabels: charts.chartLabels,
    salesVsAchievement: charts.salesVsAchievement,
    collectionVsAchievement: charts.collectionVsAchievement,
    months,
    managers,
    meta: {
      year,
      hasLiveAchievement,
      hasLiveTargets,
      managerId: managerId || "all",
    },
  };
}

export async function upsertTargetAchievementPlans(body: {
  year: number;
  months: {
    month: number;
    salesTarget?: number;
    collectionPlan?: number;
    managerUserId?: string;
  }[];
  createdByUserId?: string;
}) {
  const year = Number(body.year);
  if (!Number.isFinite(year) || year < 2000) {
    throw new Error("Valid year is required.");
  }
  const months = Array.isArray(body.months) ? body.months : [];
  const results = [];

  for (const row of months) {
    const month = Number(row.month);
    if (!Number.isFinite(month) || month < 1 || month > 12) continue;
    const managerUserId = String(row.managerUserId || "").trim();
    const doc = await TargetAchievementPlan.findOneAndUpdate(
      { year, month, managerUserId },
      {
        $set: {
          salesTarget: Math.max(0, Number(row.salesTarget) || 0),
          collectionPlan: Math.max(0, Number(row.collectionPlan) || 0),
          createdByUserId: body.createdByUserId,
        },
      },
      { upsert: true, new: true }
    );
    results.push(doc);
  }

  return results;
}

/** Stock snapshot for demo-style product drill-down when no sales lines exist. */
export async function topProductsForManagerFallback(limit = 5) {
  const products = await Product.find().sort({ productName: 1 }).limit(limit).lean();
  return products.map((p, i) => {
    const qty = Number(p.quantity) || 0;
    const rate =
      p.rate != null && Number.isFinite(Number(p.rate))
        ? Number(p.rate)
        : Number(p.billingRatePerUnit) || 0;
    const min = Number(p.minimumReorderLevel) || 50;
    return {
      id: `stock-${i}`,
      name: String(p.productName || "Product"),
      closingQty: qty,
      rate,
      value: Math.round(productLineAmount(p)),
      status: qty >= min ? "Sufficient" : "Out of Stock",
    };
  });
}
