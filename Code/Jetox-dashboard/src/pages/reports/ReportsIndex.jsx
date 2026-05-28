import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "../../layouts/DashboardLayout";
import { SearchBar, DateRangePicker } from "../../components/ui/CommanUI";
import { TableContent } from "../../hooks/TableCustomHook";
import { dashboardUiApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import TruncatedText from "../../components/ui/table/TruncatedText";
import OrdersTableShell from "../../components/ui/table/OrdersTableShell";
import {
  paymentStatusBadgeClasses,
  reportOrderThClasses,
  reportOrderTdClasses,
  reportOrderColClass,
  getCellTextAlign,
  STATUS_CELL_INNER_DENSE,
  tableFooterTdClasses,
} from "../../utils/tableUi";

function parseInrCell(v) {
  if (v == null) return 0;
  const n = Number(String(v).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
import toast from "react-hot-toast";

function PeriodToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-light-border bg-rowBg p-1 text-xs dark:border-slate-700 dark:bg-slate-800/50">
      {["Month", "Year"].map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p.toLowerCase())}
          className={`px-4 py-2 rounded-md ${
            value === p.toLowerCase()
              ? "bg-primary text-white shadow-sm font-medium"
              : "text-light dark:text-slate-400"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function DonutRing({ pct, color, size = 80, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

const emptyReports = {
  attendance: { totalLabel: "", segments: [] },
  productSales: { months: [], values: [] },
  salesTrend: { months: [], revenue: [], expenses: [] },
  paymentAnalytics: { totalLabel: "", gaugePct: 0, legend: [] },
  leadConversion: { months: [], campaign: [], referral: [], user: [] },
  areaWiseSales: [],
  bankStatements: { totalLabel: "", incomePct: 50, outgoingPct: 50 },
  targetVsAchievement: [],
  orders: [],
};

function ReportsIndex() {
  const [qInput, setQInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [partyInput, setPartyInput] = useState("");
  const [debouncedParty, setDebouncedParty] = useState("");
  const [productInput, setProductInput] = useState("");
  const [debouncedProduct, setDebouncedProduct] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [period, setPeriod] = useState("month");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(qInput.trim()), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedParty(partyInput.trim()), 300);
    return () => clearTimeout(t);
  }, [partyInput]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProduct(productInput.trim()), 300);
    return () => clearTimeout(t);
  }, [productInput]);

  const {
    data = emptyReports,
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "dashboard",
      "reports",
      debouncedQ,
      debouncedParty,
      debouncedProduct,
      dateRange?.[0],
      dateRange?.[1],
    ],
    queryFn: async () => {
      const { data: d } = await dashboardUiApi.getReports({
        q: debouncedQ || undefined,
        party: debouncedParty || undefined,
        product: debouncedProduct || undefined,
        from: dateRange?.[0] || undefined,
        to: dateRange?.[1] || undefined,
      });
      return { ...emptyReports, ...d };
    },
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load reports"));
    }
  }, [isError, error]);

  const orderColumns = useMemo(
    () => [
      "Order ID",
      "Client Name",
      "Date",
      "Products",
      "Manager Name",
      "Paid",
      "Due",
      "Payment Status",
      "Total Amount",
    ],
    []
  );

  const orderFooterTotals = useMemo(() => {
    const rows = data.orders || [];
    let paid = 0;
    let due = 0;
    let totalAmt = 0;
    rows.forEach((r) => {
      paid += parseInrCell(r.Paid);
      due += parseInrCell(r.Due);
      totalAmt += parseInrCell(r["Total Amount"]);
    });
    return { paid, due, totalAmt };
  }, [data.orders]);

  const fmtInr = (n) =>
    `₹${Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const renderRowCell = (key, value, _row) => {
    if (key === "Date" && value && /^\d{4}-\d{2}-\d{2}/.test(String(value))) {
      const formatted = dayjs(value).format("DD MMM YYYY");
      return (
        <td key={key} className={reportOrderTdClasses(key)}>
          <TruncatedText className="tabular-nums text-gray-700 dark:text-slate-200" title={formatted}>
            {formatted}
          </TruncatedText>
        </td>
      );
    }
    if (key === "Payment Status") {
      return (
        <td key={key} className={reportOrderTdClasses(key)}>
          <div className={STATUS_CELL_INNER_DENSE}>
            <span className={paymentStatusBadgeClasses(value, { dense: true })}>
              {value}
            </span>
          </div>
        </td>
      );
    }
    if (key === "Products") {
      const text = value ?? "—";
      return (
        <td key={key} className={reportOrderTdClasses(key)}>
          <TruncatedText
            ellipsis
            className="text-gray-800 dark:text-slate-200"
            title={String(text)}
          >
            {text}
          </TruncatedText>
        </td>
      );
    }
    const align = getCellTextAlign(key);
    return (
      <td key={key} className={reportOrderTdClasses(key)}>
        <TruncatedText
          align={align}
          className={
            align === "right"
              ? "tabular-nums text-gray-800 dark:text-slate-200"
              : "text-gray-800 dark:text-slate-200"
          }
        >
          {value}
        </TruncatedText>
      </td>
    );
  };

  const head = (label) => (
    <th key={label} className={reportOrderThClasses(label)}>
      {label}
    </th>
  );

  const reportFooterTd = (col, extra = "") =>
    [tableFooterTdClasses(col), reportOrderColClass(col, "td"), extra]
      .filter(Boolean)
      .join(" ");

  const att = data.attendance;
  const ps = data.productSales;
  const st = data.salesTrend;
  const pa = data.paymentAnalytics;
  const lc = data.leadConversion;
  const maxBar = Math.max(1, ...(ps.values || []));

  return (
    <DashboardLayout>
      <div className="ds-stack-page min-w-0">
        <div className="grid grid-cols-1 gap-3 auto-rows-fr sm:grid-cols-2 sm:gap-4">
          <div className="rounded-xl jitox-panel jitox-panel--shadow p-3 sm:p-4 flex flex-col min-h-[180px] sm:min-h-[200px]">
            <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4 sm:gap-4">
              <span className="text-xs sm:text-sm font-semibold text-dark">
                Attendance Report
              </span>
              <PeriodToggle value={period} onChange={setPeriod} />
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-3 sm:gap-4">
              <div className="relative flex items-center justify-center">
                <DonutRing pct={72} color="#22c55e" size={88} stroke={10} />
                <span className="absolute text-[10px] font-semibold text-center text-dark max-w-[4rem] leading-tight">
                  {att.totalLabel}
                </span>
              </div>
              <ul className="flex-1 min-w-[120px] space-y-2 text-xs leading-relaxed">
                {(att.segments || []).map((s) => (
                  <li key={s.label} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: s.color }}
                    />
                    <span className="text-light">{s.label}</span>
                    <span className="ml-auto font-medium">{s.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              className="mt-4 text-xs text-primary font-medium hover:underline self-start"
            >
              View Full Details
            </button>
          </div>

          <div className="rounded-xl jitox-panel jitox-panel--shadow p-3 sm:p-4 flex flex-col min-h-[180px] sm:min-h-[200px]">
            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4 sm:gap-4">
              <span className="text-xs sm:text-sm font-semibold text-dark">
                Product Sales Report
              </span>
              <select className="text-xs border border-light-border rounded-lg px-3 py-2 bg-white min-h-9 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                <option>All products</option>
              </select>
            </div>
            <div className="flex h-24 sm:h-32 flex-1 items-end justify-between gap-0.5">
              {(ps.months || []).map((m, i) => (
                <div key={m} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div
                    className="w-full max-w-4 rounded-t bg-primary/85"
                    style={{
                      height: `${((ps.values[i] || 0) / maxBar) * 100}%`,
                      minHeight: ps.values[i] ? 6 : 0,
                    }}
                  />
                  <span className="text-[9px] text-light truncate">{m}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl jitox-panel jitox-panel--shadow p-3 sm:p-4 flex flex-col min-h-[180px] sm:min-h-[200px]">
            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4 sm:gap-4">
              <span className="text-xs sm:text-sm font-semibold text-dark">Sales Report</span>
              <PeriodToggle value={period} onChange={setPeriod} />
            </div>
            <div className="flex-1 min-h-[120px] flex items-end gap-0.5">
              {(st.months || []).map((m, i) => {
                const mr = Math.max(
                  1,
                  st.revenue[i] || 0,
                  st.expenses[i] || 0
                );
                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
                    <div className="flex gap-0.5 items-end h-24 w-full justify-center">
                      <div
                        className="w-[40%] max-w-2 bg-emerald-500/90 rounded-t"
                        style={{
                          height: `${((st.revenue[i] || 0) / mr) * 100}%`,
                          minHeight: st.revenue[i] ? 4 : 0,
                        }}
                      />
                      <div
                        className="w-[40%] max-w-2 bg-rose-400/90 rounded-t"
                        style={{
                          height: `${((st.expenses[i] || 0) / mr) * 100}%`,
                          minHeight: st.expenses[i] ? 4 : 0,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-light">{m}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 text-[10px] text-light mt-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-1.5 rounded-sm bg-emerald-500" />
                Revenue
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-1.5 rounded-sm bg-rose-400" />
                Expenses
              </span>
            </div>
          </div>

          <div className="rounded-xl jitox-panel jitox-panel--shadow p-3 sm:p-4 flex flex-col min-h-[180px] sm:min-h-[200px]">
            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4 sm:gap-4">
              <span className="text-xs sm:text-sm font-semibold text-dark">
                Payment Analytics
              </span>
              <PeriodToggle value={period} onChange={setPeriod} />
            </div>
            <div className="flex flex-1 items-center gap-4">
              <div className="relative w-20 h-10 shrink-0 mx-auto sm:mx-0">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="10"
                    strokeDasharray={`${(pa.gaugePct / 100) * 126} 126`}
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-dark">
                  {pa.totalLabel}
                </div>
                <ul className="mt-3 space-y-2 text-[10px] leading-relaxed">
                  {(pa.legend || []).map((L) => (
                    <li key={L.label} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: L.color }}
                      />
                      {L.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-xl jitox-panel jitox-panel--shadow p-3 sm:p-4 md:col-span-2 flex flex-col min-h-[170px] sm:min-h-[180px]">
            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4 sm:gap-4">
              <span className="text-xs sm:text-sm font-semibold text-dark">
                Source Wise Lead Conversion
              </span>
              <PeriodToggle value={period} onChange={setPeriod} />
            </div>
            <div className="flex items-end gap-1 h-28">
              {(lc.months || []).map((m, i) => {
                const mx = Math.max(
                  1,
                  lc.campaign[i] || 0,
                  lc.referral[i] || 0,
                  lc.user[i] || 0
                );
                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="flex gap-px items-end h-20 w-full justify-center">
                      <div
                        className="w-[30%] max-w-2 bg-violet-500/85 rounded-t"
                        style={{
                          height: `${((lc.campaign[i] || 0) / mx) * 100}%`,
                          minHeight: 3,
                        }}
                      />
                      <div
                        className="w-[30%] max-w-2 bg-sky-500/85 rounded-t"
                        style={{
                          height: `${((lc.referral[i] || 0) / mx) * 100}%`,
                          minHeight: 3,
                        }}
                      />
                      <div
                        className="w-[30%] max-w-2 bg-amber-500/85 rounded-t"
                        style={{
                          height: `${((lc.user[i] || 0) / mx) * 100}%`,
                          minHeight: 3,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-light">{m}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 text-[10px] text-light mt-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-violet-500" />
                Campaign
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-sky-500" />
                Referral
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-amber-500" />
                User
              </span>
            </div>
          </div>

          <div className="rounded-xl jitox-panel jitox-panel--shadow p-3 sm:p-4 flex flex-col min-h-[180px] sm:min-h-[200px]">
            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4 sm:gap-4">
              <span className="text-xs sm:text-sm font-semibold text-dark">
                Area Wise Sales
              </span>
              <select className="text-xs border border-light-border rounded-lg px-3 py-2 bg-white min-h-9 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                <option>All regions</option>
              </select>
            </div>
            <div className="flex-1 space-y-3 min-h-[120px]">
              {(data.areaWiseSales || []).map((row) => (
                <div key={row.city} className="flex items-center gap-2 text-xs">
                  <span className="text-light w-24 truncate">{row.city}</span>
                  <div className="flex-1 h-2 rounded-full bg-rowBg overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${row.value}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-dark w-8 text-right">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl jitox-panel jitox-panel--shadow p-3 sm:p-4 flex flex-col min-h-[180px] sm:min-h-[200px]">
            <div className="mb-3 text-xs sm:text-sm font-semibold text-dark leading-snug sm:mb-4">
              Bank Statements
            </div>
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex items-center justify-center">
                <DonutRing
                  pct={data.bankStatements?.incomePct || 50}
                  color="#22c55e"
                  size={80}
                  stroke={10}
                />
                <span className="absolute text-[9px] font-semibold text-center px-1">
                  {data.bankStatements?.totalLabel}
                </span>
              </div>
              <div className="text-xs text-light space-y-2 leading-relaxed">
                <div>
                  Incoming{" "}
                  <span className="text-dark font-medium">
                    {data.bankStatements?.incomePct}%
                  </span>
                </div>
                <div>
                  Outgoing{" "}
                  <span className="text-dark font-medium">
                    {data.bankStatements?.outgoingPct}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl jitox-panel jitox-panel--shadow p-3 sm:p-4 md:col-span-2 flex flex-col min-h-[150px] sm:min-h-[160px]">
            <div className="mb-3 text-xs sm:text-sm font-semibold text-dark leading-snug sm:mb-4">
              Target vs Achievement
            </div>
            <div className="space-y-4">
              {(data.targetVsAchievement || []).map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-2 gap-4">
                    <span className="text-light">{row.label}</span>
                    <span className="text-dark tabular-nums">
                      {row.current.toLocaleString("en-IN")} /{" "}
                      {row.max.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-rowBg overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(100, (row.current / row.max) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl jitox-panel jitox-panel--shadow p-3 sm:p-4 min-w-0">
          <div className="mb-3 text-xs sm:text-sm font-semibold text-dark leading-snug sm:mb-4">
            All Orders
          </div>
          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="w-full">
              <DateRangePicker
                filterBar
                value={dateRange}
                onChange={setDateRange}
                placeholder={["Start Date", "End Date"]}
              />
            </div>
            <SearchBar
              dense
              value={qInput}
              onChange={setQInput}
              placeholder="Search order, client, manager"
              className="w-full"
            />
            <SearchBar
              dense
              value={partyInput}
              onChange={setPartyInput}
              placeholder="Filter by party (client)"
              className="w-full"
            />
            <SearchBar
              dense
              value={productInput}
              onChange={setProductInput}
              placeholder="Filter by product"
              className="w-full"
            />
          </div>
          <div className="w-full min-w-0">
            <OrdersTableShell>
              <thead>
                <tr>{orderColumns.map((c) => head(c))}</tr>
              </thead>
              <TableContent
                variant="ordersDense"
                columns={orderColumns}
                data={loading ? [] : data.orders || []}
                renderRowCell={renderRowCell}
              />
              {!loading && (data.orders || []).length > 0 && (
                <tfoot className="border-t-2 border-gray-200 bg-gray-50 lg:sticky lg:bottom-0 lg:z-1 dark:border-slate-600 dark:bg-slate-800/95">
                  <tr>
                    {orderColumns.map((col) => {
                      if (col === "Order ID") {
                        return (
                          <td key={col} className={reportFooterTd(col)}>
                            Total
                          </td>
                        );
                      }
                      if (col === "Paid") {
                        return (
                          <td key={col} className={reportFooterTd(col)}>
                            {fmtInr(orderFooterTotals.paid)}
                          </td>
                        );
                      }
                      if (col === "Due") {
                        return (
                          <td key={col} className={reportFooterTd(col)}>
                            {fmtInr(orderFooterTotals.due)}
                          </td>
                        );
                      }
                      if (col === "Total Amount") {
                        return (
                          <td key={col} className={reportFooterTd(col)}>
                            {fmtInr(orderFooterTotals.totalAmt)}
                          </td>
                        );
                      }
                      return <td key={col} className={reportFooterTd(col)} />;
                    })}
                  </tr>
                </tfoot>
              )}
            </OrdersTableShell>
            {!loading && (data.orders || []).length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-slate-500 border border-t-0 border-slate-200/90 rounded-b-lg bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                No orders found
              </div>
            )}
            {loading && (
              <div className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">Loading…</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ReportsIndex;
