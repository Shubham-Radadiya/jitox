import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import TargetIncentiveSubNav from "./TargetIncentiveSubNav";
import { dashboardUiApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import { DateRangePicker, CommonDropdown, Button } from "../../components/ui/CommanUI";

function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-IN");
}

function BarCompareChart({ labels, a, b, aLabel, bLabel, bTone }) {
  const max = Math.max(1, ...a, ...b);
  return (
    <div className="flex items-end justify-between gap-1 sm:gap-2 h-40 px-1">
      {labels.map((lab, i) => (
        <div
          key={lab}
          className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1"
        >
          <div className="flex gap-0.5 items-end h-28 w-full justify-center">
            <div
              className="w-[42%] max-w-6 rounded-t bg-sky-200/90 dark:bg-sky-900/60"
              style={{ height: `${(a[i] / max) * 100}%`, minHeight: a[i] ? 4 : 0 }}
              title={`${aLabel}: ${a[i]}`}
            />
            <div
              className={`w-[42%] max-w-6 rounded-t ${bTone}`}
              style={{ height: `${(b[i] / max) * 100}%`, minHeight: b[i] ? 4 : 0 }}
              title={`${bLabel}: ${b[i]}`}
            />
          </div>
          <span className="text-[10px] text-slate-500 truncate w-full text-center dark:text-slate-400">
            {lab}
          </span>
        </div>
      ))}
    </div>
  );
}

function LineSpark({ labels, values, color }) {
  const max = Math.max(1, ...values);
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div className="h-36 w-full">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        aria-hidden
      >
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          points={pts}
        />
      </svg>
      <div className="flex justify-between text-[10px] text-slate-500 -mt-1 dark:text-slate-400">
        {labels.map((l) => (
          <span key={l} className="truncate max-w-[3rem] text-center">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function PctBar({ pct }) {
  const v = Math.min(100, Math.max(0, Number(pct) || 0));
  const strong = v >= 70;
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all ${strong ? "bg-primary" : "bg-slate-400"}`}
          style={{ width: `${v}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-9 text-right">{v}%</span>
    </div>
  );
}

export default function TargetAchievementPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("year");
  const [manager, setManager] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [openMonth, setOpenMonth] = useState(null);
  const [openManager, setOpenManager] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["target-incentive"],
    queryFn: async () => {
      const { data: payload } = await dashboardUiApi.getTargetIncentive();
      return payload;
    },
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load target data"));
    }
  }, [isError, error]);

  const overviewKpis = data?.overviewKpis || [];
  const months = data?.months || [];
  const chartLabels = data?.chartLabels || [];
  const salesVs = data?.salesVsAchievement || { target: [], achieved: [] };
  const collVs = data?.collectionVsAchievement || { plan: [], achieved: [] };
  const managers = data?.managers || [{ value: "all", label: "All Managers" }];

  const managerOpts = useMemo(
    () => managers.map((m) => ({ value: m.value, label: m.label })),
    [managers]
  );

  const monthColumnTotals = useMemo(() => {
    return months.reduce(
      (acc, m) => ({
        salesTarget: acc.salesTarget + (Number(m.salesTarget) || 0),
        salesAchieved: acc.salesAchieved + (Number(m.salesAchieved) || 0),
        collPlan: acc.collPlan + (Number(m.collPlan) || 0),
        collAchieved: acc.collAchieved + (Number(m.collAchieved) || 0),
        pctSum: acc.pctSum + (Number(m.pct) || 0),
      }),
      { salesTarget: 0, salesAchieved: 0, collPlan: 0, collAchieved: 0, pctSum: 0 }
    );
  }, [months]);
  const avgMonthPct = months.length
    ? Math.round(monthColumnTotals.pctSum / months.length)
    : 0;

  const toggleMonth = (id) => {
    setOpenMonth((m) => (m === id ? null : id));
    setOpenManager(null);
  };
  const toggleManager = (monthId, mgrId) => {
    const key = `${monthId}:${mgrId}`;
    setOpenManager((k) => (k === key ? null : key));
  };

  return (
    <DashboardLayout>
      <TargetIncentiveSubNav />

      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Target vs Achievement View
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-600">
              {["month", "year"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize ${
                    period === p
                      ? "bg-primary text-white"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <CommonDropdown
              hideAdd
              filterBar
              options={managerOpts}
              value={manager}
              onChange={setManager}
              placeholder="Manager"
              className="w-40 sm:w-48"
            />
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder={["From", "To"]}
              className="w-48 sm:w-56"
            />
            <Button
              label="Set incentive"
              size="sm"
              onClick={() => navigate("/dashboard/target-incentive/assign")}
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500 py-8">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {overviewKpis.map((k) => (
                <div
                  key={k.key}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400">{k.label}</p>
                  <p className="text-xl font-semibold text-slate-900 tabular-nums mt-1 dark:text-slate-100">
                    {k.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-sm font-semibold text-slate-800 mb-3 dark:text-slate-100">
                  Sales: Target vs Achievement
                </h2>
                <BarCompareChart
                  labels={chartLabels}
                  a={salesVs.target}
                  b={salesVs.achieved}
                  aLabel="Target"
                  bLabel="Achieved"
                  bTone="bg-sky-600 dark:bg-sky-500"
                />
                <p className="text-xs text-slate-500 mt-2 dark:text-slate-400">
                  Light bars = target · Dark bars = achieved
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-sm font-semibold text-slate-800 mb-3 dark:text-slate-100">
                  Collection: Planning vs Achievement
                </h2>
                <LineSpark
                  labels={chartLabels}
                  values={collVs.achieved}
                  color="#e11d48"
                />
                <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                  Line = collection achieved (demo)
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-900">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800">
                Target Table ({period === "year" ? "Yearly" : "Monthly"})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-left text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <th className="w-10 px-2 py-2" />
                      <th className="px-3 py-2">Month</th>
                      <th className="px-3 py-2 text-right tabular-nums">Sales Target</th>
                      <th className="px-3 py-2 text-right tabular-nums">Sales Achieved</th>
                      <th className="px-3 py-2 text-right tabular-nums">Coll. Plan</th>
                      <th className="px-3 py-2 text-right tabular-nums">Achieved</th>
                      <th className="px-3 py-2 w-36">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {months.map((row) => {
                      const expanded = openMonth === row.id;
                      return (
                        <Fragment key={row.id}>
                          <tr
                            className="border-t border-slate-100 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                className="p-1 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                                aria-expanded={expanded}
                                onClick={() => toggleMonth(row.id)}
                              >
                                {expanded ? (
                                  <ChevronDown size={18} />
                                ) : (
                                  <ChevronRight size={18} />
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">
                              {row.label}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {fmt(row.salesTarget)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {fmt(row.salesAchieved)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {fmt(row.collPlan)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {fmt(row.collAchieved)}
                            </td>
                            <td className="px-3 py-2">
                              <PctBar pct={row.pct} />
                            </td>
                          </tr>
                          {expanded && row.managers?.length > 0 && (
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                              <td colSpan={7} className="p-0 border-t border-slate-100 dark:border-slate-800">
                                <div className="px-4 py-3 pl-10">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                      Manager Performance Overview
                                    </span>
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                                      {row.managers.length}
                                    </span>
                                  </div>
                                  <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden dark:border-slate-700">
                                    <thead>
                                      <tr className="bg-slate-100 dark:bg-slate-800">
                                        <th className="w-8 px-1 py-2" />
                                        <th className="text-left px-2 py-2">Manager Name</th>
                                        <th className="text-right px-2 py-2 tabular-nums">Sales Target</th>
                                        <th className="text-right px-2 py-2 tabular-nums">Sales Achieved</th>
                                        <th className="text-right px-2 py-2 tabular-nums">Coll. Plan</th>
                                        <th className="text-right px-2 py-2 tabular-nums">Coll. Ach.</th>
                                        <th className="text-right px-2 py-2 tabular-nums">Team Total (T+A)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {row.managers.map((mgr) => {
                                        const mkey = `${row.id}:${mgr.id}`;
                                        const mOpen = openManager === mkey;
                                        return (
                                          <Fragment key={mgr.id}>
                                            <tr
                                              className="border-t border-slate-100 dark:border-slate-800"
                                            >
                                              <td className="px-1 py-1.5">
                                                <button
                                                  type="button"
                                                  className="p-0.5 text-slate-500"
                                                  onClick={() => toggleManager(row.id, mgr.id)}
                                                  aria-expanded={mOpen}
                                                >
                                                  {mOpen ? (
                                                    <ChevronDown size={16} />
                                                  ) : (
                                                    <ChevronRight size={16} />
                                                  )}
                                                </button>
                                              </td>
                                              <td className="px-2 py-1.5 font-medium">{mgr.name}</td>
                                              <td className="px-2 py-1.5 text-right tabular-nums">
                                                {fmt(mgr.salesTarget)}
                                              </td>
                                              <td className="px-2 py-1.5 text-right tabular-nums">
                                                {fmt(mgr.salesAchieved)}
                                              </td>
                                              <td className="px-2 py-1.5 text-right tabular-nums">
                                                {fmt(mgr.collPlan)}
                                              </td>
                                              <td className="px-2 py-1.5 text-right tabular-nums">
                                                {fmt(mgr.collAchieved)}
                                              </td>
                                              <td className="px-2 py-1.5 text-right tabular-nums">
                                                {fmt(mgr.teamTotal)}
                                              </td>
                                            </tr>
                                            {mOpen && mgr.products?.length > 0 && (
                                              <tr>
                                                <td colSpan={7} className="p-2 pl-8 bg-white dark:bg-slate-950">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[11px] font-semibold">Product List</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                                                      {mgr.products.length}
                                                    </span>
                                                  </div>
                                                  <table className="w-full text-[11px] border border-slate-200 rounded dark:border-slate-700">
                                                    <thead>
                                                      <tr className="bg-slate-50 dark:bg-slate-900">
                                                        <th className="text-left px-2 py-1">Product Name</th>
                                                        <th className="text-right px-2 py-1">Closing Qty</th>
                                                        <th className="text-right px-2 py-1">Rate</th>
                                                        <th className="text-right px-2 py-1">Value</th>
                                                        <th className="text-center px-2 py-1">Status</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {mgr.products.map((pr) => (
                                                        <tr
                                                          key={pr.id}
                                                          className="border-t border-slate-100 dark:border-slate-800"
                                                        >
                                                          <td className="px-2 py-1">{pr.name}</td>
                                                          <td className="px-2 py-1 text-right tabular-nums">
                                                            {pr.closingQty}
                                                          </td>
                                                          <td className="px-2 py-1 text-right tabular-nums">
                                                            {pr.rate}
                                                          </td>
                                                          <td className="px-2 py-1 text-right tabular-nums">
                                                            {fmt(pr.value)}
                                                          </td>
                                                          <td className="px-2 py-1 text-center">
                                                            <span
                                                              className={
                                                                pr.status === "Sufficient"
                                                                  ? "text-emerald-600 font-medium"
                                                                  : "text-red-600 font-medium"
                                                              }
                                                            >
                                                              {pr.status}
                                                            </span>
                                                          </td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                </td>
                                              </tr>
                                            )}
                                          </Fragment>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                  {months.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-100">
                        <td className="px-2 py-2.5" />
                        <td className="px-3 py-2.5">Total</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {fmt(monthColumnTotals.salesTarget)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {fmt(monthColumnTotals.salesAchieved)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {fmt(monthColumnTotals.collPlan)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {fmt(monthColumnTotals.collAchieved)}
                        </td>
                        <td className="px-3 py-2.5">
                          <PctBar pct={avgMonthPct} />
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
