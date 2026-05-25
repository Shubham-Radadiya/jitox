import {
  Product,
  Quotation,
  ReceiptVoucher,
  SalesVoucher,
  TargetAchievementPlan,
  TargetIncentiveAssignment,
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
    /** No targets saved — do not show 100% just because there is achievement. */
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
  }
  /** "All managers" → every plan row (company-wide + each manager) for monthly totals. */
  return TargetAchievementPlan.find(filter).sort({ month: 1 }).lean();
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
    visitsTarget?: number;
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
    const existing = await TargetAchievementPlan.findOne({
      year,
      month,
      managerUserId,
    }).lean();
    const salesTarget =
      row.salesTarget !== undefined
        ? Math.max(0, Number(row.salesTarget) || 0)
        : Math.max(0, Number(existing?.salesTarget) || 0);
    const collectionPlan =
      row.collectionPlan !== undefined
        ? Math.max(0, Number(row.collectionPlan) || 0)
        : Math.max(0, Number(existing?.collectionPlan) || 0);
    const visitsTarget =
      row.visitsTarget !== undefined
        ? Math.max(0, Number(row.visitsTarget) || 0)
        : Math.max(0, Number(existing?.visitsTarget) || 0);
    const doc = await TargetAchievementPlan.findOneAndUpdate(
      { year, month, managerUserId },
      {
        $set: {
          salesTarget,
          collectionPlan,
          visitsTarget,
          createdByUserId: body.createdByUserId,
        },
      },
      { upsert: true, new: true }
    );
    results.push(doc);
  }

  return results;
}

function parseIncentivePct(raw: unknown): number {
  const s = String(raw ?? "")
    .trim()
    .replace(/%/g, "");
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 0;
}

function monthPeriodLabel(year: number, month: number): string {
  const short = MONTH_SHORT[month - 1] || `M${month}`;
  return `${short} ${year}`;
}

function fmtInrDisplay(n: number): string {
  return `₹${Math.round(Number(n) || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function fmtVisitsDisplay(n: number): string {
  return `${Math.round(Number(n) || 0).toLocaleString("en-IN")} Visits`;
}

function assignmentAppliesToManager(
  a: {
    applicableTo?: string;
    applicableUserIds?: string[];
  },
  managerUserId: string
): boolean {
  const mode = String(a.applicableTo || "all");
  if (mode === "all") return true;
  if (mode === "managers") {
    const ids = Array.isArray(a.applicableUserIds) ? a.applicableUserIds : [];
    return ids.map(String).includes(managerUserId);
  }
  return false;
}

function assignmentOverlapsMonth(
  a: { fromDate?: string; toDate?: string },
  year: number,
  month: number
): boolean {
  const from = String(a.fromDate || "").trim();
  const to = String(a.toDate || "").trim();
  if (!from || !to) return false;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return from <= end && to >= start;
}

function assignmentOverlapsRange(
  a: { fromDate?: string; toDate?: string },
  rangeStart: Date,
  rangeEnd: Date
): boolean {
  const from = String(a.fromDate || "").trim();
  const to = String(a.toDate || "").trim();
  if (!from || !to) return false;
  const startIso = rangeStart.toISOString().slice(0, 10);
  const endInclusive = new Date(rangeEnd.getTime() - 1);
  const endIso = endInclusive.toISOString().slice(0, 10);
  return from <= endIso && to >= startIso;
}

function buildProductPctMap(
  assignments: {
    applicableTo?: string;
    applicableUserIds?: string[];
    fromDate?: string;
    toDate?: string;
    rows?: { product?: string; incentive?: string }[];
  }[],
  managerUserId: string,
  year: number,
  month: number
): Map<string, number> {
  const map = new Map<string, number>();
  for (const a of assignments) {
    if (!assignmentOverlapsMonth(a, year, month)) continue;
    if (!assignmentAppliesToManager(a, managerUserId)) continue;
    const rows = Array.isArray(a.rows) ? a.rows : [];
    for (const row of rows) {
      const key = String(row.product || "").trim().toLowerCase();
      if (!key) continue;
      const pct = parseIncentivePct(row.incentive);
      const prev = map.get(key) ?? 0;
      if (pct > prev) map.set(key, pct);
    }
  }
  return map;
}

function calcProductIncentiveForMonth(
  salesVouchers: Awaited<ReturnType<typeof aggregateMonthlyAchievement>>["salesVouchers"],
  productPct: Map<string, number>,
  managerName: string,
  monthIndex: number,
  year: number
): number {
  if (!productPct.size) return 0;
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 1);
  let total = 0;
  for (const sv of salesVouchers) {
    const d = sv.voucherDate as Date | undefined;
    if (!d || d < monthStart || d >= monthEnd) continue;
    if (!orderByMatchesManager(String(sv.orderby || ""), managerName)) continue;
    const items = Array.isArray(sv.items) ? sv.items : [];
    for (const it of items) {
      const pop = (it as { product?: { productName?: string } | string }).product;
      const pname =
        typeof pop === "object" && pop && "productName" in pop
          ? String(pop.productName || "").trim().toLowerCase()
          : "";
      if (!pname) continue;
      const pct = productPct.get(pname) ?? 0;
      if (pct <= 0) continue;
      total += (parseAmount((it as { subtotal?: number }).subtotal) * pct) / 100;
    }
  }
  return Math.round(total);
}

function managerSalesInMonth(
  salesVouchers: Awaited<ReturnType<typeof aggregateMonthlyAchievement>>["salesVouchers"],
  managerName: string,
  monthIndex: number,
  year: number
): number {
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 1);
  let total = 0;
  for (const sv of salesVouchers) {
    const d = sv.voucherDate as Date | undefined;
    if (!d || d < monthStart || d >= monthEnd) continue;
    if (!orderByMatchesManager(String(sv.orderby || ""), managerName)) continue;
    total += parseAmount(sv.totalAmount);
  }
  return Math.round(total);
}

type ReceiptLeanRow = {
  date?: Date;
  amount?: unknown;
  /** Populated sales voucher or raw ObjectId from lean(). */
  sourceSalesId?: unknown;
};

function orderByFromPopulatedSale(source: unknown): string {
  if (!source || typeof source !== "object") return "";
  const rec = source as Record<string, unknown>;
  if (!("orderby" in rec)) return "";
  return String(rec.orderby ?? "").trim();
}

function managerCollectionInMonth(
  receipts: ReceiptLeanRow[],
  managerName: string,
  monthIndex: number,
  year: number
): number {
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 1);
  let total = 0;
  for (const r of receipts) {
    if (!r.date) continue;
    const d = new Date(r.date as Date);
    if (d < monthStart || d >= monthEnd) continue;
    const orderBy = orderByFromPopulatedSale(r.sourceSalesId);
    if (!orderBy || !orderByMatchesManager(orderBy, managerName)) continue;
    total += parseAmount(r.amount);
  }
  return Math.round(total);
}

export type LiveTeamIncentiveRow = {
  id: string;
  user: string;
  period: string;
  targetType: string;
  targetAmt: string;
  achieved: string;
  pctAchieved: number;
  incentive: string;
  status: "Achieved" | "Not Achieved";
};

/** Build Team incentives tab from plans, vouchers, and Assign incentive rules. */
export async function buildLiveTeamIncentiveView(query: { year?: number }) {
  const year = Number(query.year) || new Date().getFullYear();
  const rangeStart = new Date(year, 0, 1);
  const rangeEnd = new Date(year + 1, 0, 1);

  const [plans, managers, assignments, salesVouchers, receipts] = await Promise.all([
    TargetAchievementPlan.find({ year }).sort({ month: 1 }).lean(),
    User.find({ role: { $in: ["Manager", "Admin"] } })
      .select("name firstName lastName email")
      .lean(),
    TargetIncentiveAssignment.find().lean(),
    SalesVoucher.find({
      voucherDate: { $gte: rangeStart, $lt: rangeEnd },
    })
      .select("voucherDate totalAmount orderby items")
      .populate({ path: "items.product", select: "productName" })
      .lean(),
    ReceiptVoucher.find({
      date: { $gte: rangeStart, $lt: rangeEnd },
    })
      .select("date amount sourceSalesId")
      .populate({ path: "sourceSalesId", select: "orderby" })
      .lean(),
  ]);

  const managerById = new Map(
    managers.map((m) => [String(m._id), userDisplayName(m)])
  );

  const rows: LiveTeamIncentiveRow[] = [];

  for (const plan of plans) {
    const month = Number(plan.month);
    if (!Number.isFinite(month) || month < 1 || month > 12) continue;

    const managerUserId = String(plan.managerUserId || "").trim();
    const userLabel = managerUserId
      ? managerById.get(managerUserId) || "Manager"
      : "Company-wide";
    const managerName = managerUserId ? userLabel : "";
    const period = monthPeriodLabel(year, month);
    const monthIndex = month - 1;

    const productPct = managerUserId
      ? buildProductPctMap(assignments, managerUserId, year, month)
      : new Map<string, number>();
    const productIncentive = managerUserId
      ? calcProductIncentiveForMonth(
          salesVouchers,
          productPct,
          managerName,
          monthIndex,
          year
        )
      : 0;

    const salesTarget = Math.max(0, Number(plan.salesTarget) || 0);
    if (salesTarget > 0) {
      const achieved = managerUserId
        ? managerSalesInMonth(salesVouchers, managerName, monthIndex, year)
        : achievementSumSalesMonth(salesVouchers, monthIndex);
      const pct = salesTarget > 0 ? Math.min(999, Math.round((achieved / salesTarget) * 100)) : 0;
      const bonus = pct >= 100 ? Math.round(achieved * 0.06) : 0;
      const incentive = Math.round(productIncentive + bonus);
      rows.push({
        id: `${managerUserId || "co"}-${month}-sales`,
        user: userLabel,
        period,
        targetType: "Sales",
        targetAmt: fmtInrDisplay(salesTarget),
        achieved: fmtInrDisplay(achieved),
        pctAchieved: pct,
        incentive: fmtInrDisplay(incentive),
        status: pct >= 100 ? "Achieved" : "Not Achieved",
      });
    }

    const collTarget = Math.max(0, Number(plan.collectionPlan) || 0);
    if (collTarget > 0) {
      const achieved = managerUserId
        ? managerCollectionInMonth(receipts, managerName, monthIndex, year)
        : sumReceiptsMonth(receipts, monthIndex);
      const pct = collTarget > 0 ? Math.min(999, Math.round((achieved / collTarget) * 100)) : 0;
      const bonus = pct >= 100 ? Math.round(achieved * 0.06) : 0;
      rows.push({
        id: `${managerUserId || "co"}-${month}-coll`,
        user: userLabel,
        period,
        targetType: "Collections",
        targetAmt: fmtInrDisplay(collTarget),
        achieved: fmtInrDisplay(achieved),
        pctAchieved: pct,
        incentive: fmtInrDisplay(Math.round(bonus)),
        status: pct >= 100 ? "Achieved" : "Not Achieved",
      });
    }

    const visitsTarget = Math.max(0, Number(plan.visitsTarget) || 0);
    if (visitsTarget > 0) {
      const achievedVisits = 0;
      const pct =
        visitsTarget > 0
          ? Math.min(999, Math.round((achievedVisits / visitsTarget) * 100))
          : 0;
      rows.push({
        id: `${managerUserId || "co"}-${month}-visits`,
        user: userLabel,
        period,
        targetType: "Visits",
        targetAmt: fmtVisitsDisplay(visitsTarget),
        achieved: fmtVisitsDisplay(achievedVisits),
        pctAchieved: pct,
        incentive: fmtInrDisplay(0),
        status: pct >= 100 ? "Achieved" : "Not Achieved",
      });
    }
  }

  let notAchieved = 0;
  let pctSum = 0;
  let incentiveSum = 0;
  let targetSum = 0;
  for (const r of rows) {
    if (r.status !== "Achieved") notAchieved += 1;
    pctSum += r.pctAchieved;
    incentiveSum += parseAmount(r.incentive);
    if (r.targetType !== "Visits") {
      targetSum += parseAmount(r.targetAmt);
    }
  }

  const kpis = rows.length
    ? [
        {
          key: "totalTarget",
          label: "Total Target",
          value: formatInrCompact(targetSum),
        },
        {
          key: "notAchieved",
          label: "Not Achieved",
          value: String(notAchieved),
        },
        {
          key: "totalPct",
          label: "Total Achievement%",
          value: `${Math.round(pctSum / rows.length)}%`,
        },
        {
          key: "totalIncentive",
          label: "Total Incentive",
          value: formatInrCompact(incentiveSum),
        },
      ]
    : [];

  return { year, rows, kpis, hasPlans: plans.length > 0 };
}

function achievementSumSalesMonth(
  salesVouchers: { voucherDate?: Date; totalAmount?: unknown }[],
  monthIndex: number
): number {
  let total = 0;
  for (const sv of salesVouchers) {
    const d = sv.voucherDate as Date | undefined;
    if (!d || new Date(d).getMonth() !== monthIndex) continue;
    total += parseAmount(sv.totalAmount);
  }
  return Math.round(total);
}

function sumReceiptsMonth(receipts: ReceiptLeanRow[], monthIndex: number): number {
  let total = 0;
  for (const r of receipts) {
    if (!r.date || new Date(r.date as Date).getMonth() !== monthIndex) continue;
    total += parseAmount(r.amount);
  }
  return Math.round(total);
}

export type LiveProductIncentiveRow = {
  id: string;
  prodGroup: string;
  prodCategory: string;
  prodName: string;
  qty: string;
  qtyNumeric: number;
  sellingAmt: number;
  total: number;
  pctIncentive: string;
  incentiveValue: number;
};

/** Product incentive table from sales lines + Assign incentive rules. */
export async function buildLiveProductIncentiveView(query: TargetIncentiveQuery) {
  const { year, rangeStart, rangeEnd } = resolveYearRange(query);
  const managerId = String(query.managerId || "all").trim();

  let managerName: string | undefined;
  if (managerId && managerId !== "all") {
    const mgr = await User.findById(managerId)
      .select("name firstName lastName email")
      .lean();
    if (mgr) managerName = userDisplayName(mgr);
  }

  const [assignments, salesVouchers, distinctGroups] = await Promise.all([
    TargetIncentiveAssignment.find().lean(),
    SalesVoucher.find({
      voucherDate: { $gte: rangeStart, $lt: rangeEnd },
    })
      .select("voucherDate orderby items")
      .populate({
        path: "items.product",
        select: "productName group category unit",
      })
      .lean(),
    Product.distinct("group"),
  ]);

  const productPct = new Map<string, number>();
  const assignmentGroups = new Set<string>();
  let hasActiveRules = false;

  for (const a of assignments) {
    if (!assignmentOverlapsRange(a, rangeStart, rangeEnd)) continue;
    if (managerId !== "all" && !assignmentAppliesToManager(a, managerId)) continue;
    hasActiveRules = true;
    const aRows = Array.isArray(a.rows) ? a.rows : [];
    for (const row of aRows) {
      const g = String(row.group || "").trim();
      if (g) assignmentGroups.add(g);
      const pct = parseIncentivePct(row.incentive);
      const nameKey = String(row.product || "").trim().toLowerCase();
      if (nameKey) productPct.set(nameKey, Math.max(productPct.get(nameKey) ?? 0, pct));
      const pid = String(row.productId || "").trim();
      if (pid) {
        productPct.set(`id:${pid}`, Math.max(productPct.get(`id:${pid}`) ?? 0, pct));
      }
    }
  }

  type ProductAgg = {
    prodGroup: string;
    prodCategory: string;
    prodName: string;
    productId: string;
    qty: number;
    total: number;
    unit: string;
  };

  const agg = new Map<string, ProductAgg>();

  for (const sv of salesVouchers) {
    if (managerName && !orderByMatchesManager(String(sv.orderby || ""), managerName)) {
      continue;
    }
    const items = Array.isArray(sv.items) ? sv.items : [];
    for (const it of items) {
      const line = it as {
        group?: string;
        category?: string;
        unit?: string;
        quantity?: number;
        subtotal?: number;
        rateParUnit?: number;
        product?: { _id?: unknown; productName?: string; group?: string; category?: string; unit?: string };
      };
      const pop = line.product;
      const productId =
        pop && typeof pop === "object" && pop._id != null ? String(pop._id) : "";
      const prodName =
        (pop && typeof pop === "object" && String(pop.productName || "").trim()) ||
        "Product";
      const key = productId || prodName.toLowerCase();
      const prodGroup =
        String(line.group || "").trim() ||
        (pop && typeof pop === "object" ? String(pop.group || "").trim() : "") ||
        "Other";
      const prodCategory =
        String(line.category || "").trim() ||
        (pop && typeof pop === "object" ? String(pop.category || "").trim() : "") ||
        "";
      const unit =
        String(line.unit || "").trim() ||
        (pop && typeof pop === "object" ? String(pop.unit || "").trim() : "") ||
        "";
      const qty = Number(line.quantity) || 0;
      const sub = parseAmount(line.subtotal);

      const prev = agg.get(key) || {
        prodGroup,
        prodCategory,
        prodName,
        productId,
        qty: 0,
        total: 0,
        unit,
      };
      prev.qty += qty;
      prev.total += sub;
      if (unit && !prev.unit) prev.unit = unit;
      agg.set(key, prev);
    }
  }

  const rows: LiveProductIncentiveRow[] = [];
  let idx = 0;
  for (const [, a] of agg) {
    const pct =
      productPct.get(a.prodName.toLowerCase()) ??
      (a.productId ? productPct.get(`id:${a.productId}`) ?? 0 : 0);
    const incentiveValue = Math.round((a.total * pct) / 100);
    const sellingAmt = a.qty > 0 ? Math.round(a.total / a.qty) : 0;
    const qtyLabel =
      a.qty > 0 ? (a.unit ? `${Math.round(a.qty)} ${a.unit}` : String(Math.round(a.qty))) : "0";

    rows.push({
      id: `live-p${idx++}`,
      prodGroup: a.prodGroup,
      prodCategory: a.prodCategory,
      prodName: a.prodName,
      qty: qtyLabel,
      qtyNumeric: Math.round(a.qty),
      sellingAmt,
      total: Math.round(a.total),
      pctIncentive: pct > 0 ? `${pct}%` : "—",
      incentiveValue,
    });
  }

  rows.sort((a, b) => b.total - a.total);

  const summaryMap = new Map<string, { totalSales: number; incentiveEarned: number }>();
  for (const r of rows) {
    const g = r.prodGroup || "Other";
    const prev = summaryMap.get(g) || { totalSales: 0, incentiveEarned: 0 };
    prev.totalSales += r.total;
    prev.incentiveEarned += r.incentiveValue;
    summaryMap.set(g, prev);
  }
  for (const g of assignmentGroups) {
    if (!summaryMap.has(g)) {
      summaryMap.set(g, { totalSales: 0, incentiveEarned: 0 });
    }
  }
  for (const g of distinctGroups) {
    const name = String(g || "").trim();
    if (name && !summaryMap.has(name)) {
      summaryMap.set(name, { totalSales: 0, incentiveEarned: 0 });
    }
  }

  const summary = [...summaryMap.entries()]
    .sort((a, b) => b[1].totalSales - a[1].totalSales)
    .map(([group, v]) => ({
      group,
      totalSales: Math.round(v.totalSales),
      incentiveEarned: Math.round(v.incentiveEarned),
    }));

  return {
    year,
    rows,
    summary,
    hasActiveRules,
    hasSales: rows.length > 0,
  };
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
