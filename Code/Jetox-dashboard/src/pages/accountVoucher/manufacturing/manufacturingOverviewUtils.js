import dayjs from "dayjs";
import { productIdFromRef } from "./manufacturingFormPrefill";

const MONTH_KEYS = [
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
];

const DONUT_COLORS = ["#FFC857", "#58A4B0", "#9B5DE5", "#41EAD4", "#F95738", "#E07A5F", "#81B29A", "#3D5A80"];

function rawMaterialName(line) {
  const pop =
    line?.product && typeof line.product === "object" ? line.product : null;
  return String(pop?.productName ?? "Unknown").trim() || "Unknown";
}

function lineSubtotal(line) {
  const sub = Number(line?.subtotal);
  if (Number.isFinite(sub) && sub > 0) return sub;
  const qty = Number(line?.requiredQty) || 0;
  const rate = Number(line?.ratePerUnit) || 0;
  return qty * rate;
}

/**
 * Aggregate raw material spend across manufacturing batches (optional finished-product filter).
 * @returns {{ label: string, value: number, total: number, color: string }[]}
 */
export function buildRawMaterialBreakdown(rows, finishedProductFilter = "all") {
  const byProduct = new Map();

  for (const row of rows) {
    const raw = row?._raw;
    if (!raw) continue;

    const finishedId = productIdFromRef(raw.finishedProduct);
    if (
      finishedProductFilter !== "all" &&
      finishedId &&
      finishedId !== finishedProductFilter
    ) {
      continue;
    }

    const lines = Array.isArray(raw.rawMaterials) ? raw.rawMaterials : [];
    for (const line of lines) {
      const pid = productIdFromRef(line.product) || rawMaterialName(line);
      const amount = lineSubtotal(line);
      if (amount <= 0) continue;

      const prev = byProduct.get(pid) || {
        label: rawMaterialName(line),
        total: 0,
      };
      prev.total += amount;
      const name = rawMaterialName(line);
      if (name && name !== "Unknown") prev.label = name;
      byProduct.set(pid, prev);
    }
  }

  const sorted = [...byProduct.values()].sort((a, b) => b.total - a.total);
  const grand = sorted.reduce((s, e) => s + e.total, 0);
  if (grand <= 0) return [];

  const withPct = sorted.map((e) => ({
    label: e.label,
    total: e.total,
    value: (e.total / grand) * 100,
  }));

  const rounded = withPct.map((e) => ({
    ...e,
    value: Math.round(e.value),
  }));
  const sum = rounded.reduce((s, e) => s + e.value, 0);
  if (rounded.length && sum !== 100) {
    rounded[0].value += 100 - sum;
  }

  return rounded.map((e, i) => ({
    ...e,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));
}

export function buildFinishedProductOptions(rows) {
  const options = [{ value: "all", label: "All Products" }];
  const seen = new Set(["all"]);

  for (const row of rows) {
    const raw = row?._raw;
    if (!raw) continue;
    const id = productIdFromRef(raw.finishedProduct);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const pop =
      raw.finishedProduct && typeof raw.finishedProduct === "object"
        ? raw.finishedProduct
        : null;
    const label =
      String(pop?.productName ?? row?.["Product Name"] ?? "Product").trim() ||
      "Product";
    options.push({ value: id, label });
  }

  return options;
}

function batchTrendDate(raw) {
  return raw?.completedAt || raw?.mfgDate || raw?.createdAt || null;
}

/** Distinct calendar years from batch dates (newest first), always includes current year. */
export function buildManufacturingTrendYears(rows) {
  const years = new Set([dayjs().year()]);
  for (const row of rows) {
    const raw = row?._raw;
    const d = batchTrendDate(raw);
    if (!d) continue;
    const y = dayjs(d).year();
    if (Number.isFinite(y)) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}

/** Default chart year: latest year present in batch dates, else current year. */
export function resolveManufacturingTrendYear(rows) {
  const years = buildManufacturingTrendYears(rows);
  return years[0] ?? dayjs().year();
}

/**
 * Monthly manufacturing cost (sum of batch grandTotal) for a calendar year.
 * @returns {{ month: string, monthIndex: number, value: number }[]}
 */
export function buildManufacturingTrend(
  rows,
  finishedProductFilter = "all",
  year = dayjs().year()
) {
  const monthly = MONTH_KEYS.map((month, monthIndex) => ({
    month,
    monthIndex,
    value: 0,
  }));

  for (const row of rows) {
    const raw = row?._raw;
    if (!raw) continue;

    const finishedId = productIdFromRef(raw.finishedProduct);
    if (
      finishedProductFilter !== "all" &&
      finishedId &&
      finishedId !== finishedProductFilter
    ) {
      continue;
    }

    const d = batchTrendDate(raw);
    if (!d) continue;
    const parsed = dayjs(d);
    if (!parsed.isValid() || parsed.year() !== year) continue;

    const amount = Number(raw.grandTotal);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    monthly[parsed.month()].value += amount;
  }

  return monthly;
}

export function formatTrendAxisValue(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (v >= 1000) {
    const k = v / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(Math.round(v));
}

/** Y-axis max and tick values for the trend bar chart. */
export function buildTrendChartScale(monthlyPoints) {
  const maxVal = Math.max(0, ...monthlyPoints.map((p) => p.value));
  if (maxVal <= 0) {
    return { chartMax: 1000, ticks: [1000, 800, 600, 400, 200, 0], hasData: false };
  }

  const padded = maxVal * 1.12;
  const exp = Math.floor(Math.log10(padded));
  const magnitude = Math.pow(10, Math.max(0, exp));
  const chartMax = Math.max(magnitude, Math.ceil(padded / magnitude) * magnitude);
  const step = chartMax / 5;
  const ticks = [];
  for (let i = 5; i >= 0; i -= 1) {
    ticks.push(Math.round(step * i));
  }
  return { chartMax, ticks, hasData: true };
}

export function buildManufacturingStatusSummary(rows) {
  if (!rows.length) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      planned: 0,
      paused: 0,
      failed: 0,
      totalCost: "₹0",
    };
  }

  let completed = 0;
  let inProgress = 0;
  let planned = 0;
  let paused = 0;
  let failed = 0;
  let costSum = 0;

  for (const row of rows) {
    const status = String(row?.Status ?? row?._raw?.status ?? "").trim();
    if (status === "Completed") completed += 1;
    else if (status === "In Progress") inProgress += 1;
    else if (status === "Planned") planned += 1;
    else if (status === "Paused") paused += 1;
    else if (status === "Failed") failed += 1;

    const gt = Number(row?._raw?.grandTotal);
    if (Number.isFinite(gt) && gt > 0) costSum += gt;
  }

  return {
    total: rows.length,
    completed,
    inProgress,
    planned,
    paused,
    failed,
    totalCost: `₹${Math.round(costSum).toLocaleString("en-IN")}`,
  };
}

export { DONUT_COLORS };
