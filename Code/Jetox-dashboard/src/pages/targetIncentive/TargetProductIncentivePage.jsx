import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import TargetIncentiveSubNav from "./TargetIncentiveSubNav";
import { dashboardUiApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN");
}

export default function TargetProductIncentivePage() {
  const navigate = useNavigate();
  const [year] = useState(() => new Date().getFullYear());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["target-incentive", "products", year],
    queryFn: async () => {
      const { data: payload } = await dashboardUiApi.getTargetIncentive({
        year,
        source: "live",
      });
      return payload;
    },
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load data"));
    }
  }, [isError, error]);

  const productLive = data?.productDataSource === "live";
  const rows = data?.productIncentiveRows || [];
  const summary = data?.productIncentiveSummary || [];

  const totals = useMemo(() => {
    return summary.reduce(
      (acc, r) => ({
        sales: acc.sales + (Number(r.totalSales) || 0),
        incentive: acc.incentive + (Number(r.incentiveEarned) || 0),
      }),
      { sales: 0, incentive: 0 }
    );
  }, [summary]);

  const lineTotals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          qty: acc.qty + (Number(r.qtyNumeric ?? r.qty) || 0),
          selling: acc.selling + (Number(r.sellingAmt) || 0),
          total: acc.total + (Number(r.total) || 0),
          incentive: acc.incentive + (Number(r.incentiveValue) || 0),
        }),
        { qty: 0, selling: 0, total: 0, incentive: 0 }
      ),
    [rows]
  );

  const productLineFooterCols = [
    "Prod. Group",
    "Prod. Category",
    "Prod. Name",
    "Qty",
    "Selling Amt",
    "Total (₹)",
    "% Incentive",
    "Incentive Value (₹)",
  ];

  const sumCols = ["Group", "Total Sales (₹)", "Incentive Earned (₹)"];

  return (
    <DashboardLayout>
      <TargetIncentiveSubNav />

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard/target-incentive")}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary dark:text-slate-300"
        >
          <ArrowLeft size={18} />
          Product Incentive Table
        </button>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            productLive
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
          }`}
        >
          {productLive ? "Live data" : "Demo data"}
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500 py-8">Loading…</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Prod. Group</th>
                    <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Prod. Category</th>
                    <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Prod. Name</th>
                    <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Qty</th>
                    <th className="border border-slate-200 px-3 py-2 tabular-nums dark:border-slate-700">Selling Amt</th>
                    <th className="border border-slate-200 px-3 py-2 tabular-nums dark:border-slate-700">Total (₹)</th>
                    <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">% Incentive</th>
                    <th className="border border-slate-200 px-3 py-2 tabular-nums dark:border-slate-700">Incentive Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {!rows.length && !isLoading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="border border-slate-200 px-3 py-8 text-center text-sm text-slate-500 dark:border-slate-700"
                      >
                        {productLive
                          ? "No product sales in this period. Add sales vouchers and Assign incentive rules."
                          : "No rows to display."}
                      </td>
                    </tr>
                  ) : null}
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="border border-slate-200 px-3 py-2 dark:border-slate-700">{r.prodGroup}</td>
                      <td className="border border-slate-200 px-3 py-2 dark:border-slate-700">{r.prodCategory}</td>
                      <td className="border border-slate-200 px-3 py-2 font-medium dark:border-slate-700">{r.prodName}</td>
                      <td className="border border-slate-200 px-3 py-2 dark:border-slate-700">{r.qty}</td>
                      <td className="border border-slate-200 px-3 py-2 tabular-nums dark:border-slate-700">{fmt(r.sellingAmt)}</td>
                      <td className="border border-slate-200 px-3 py-2 tabular-nums font-medium dark:border-slate-700">
                        {fmt(r.total)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 dark:border-slate-700">{r.pctIncentive}</td>
                      <td className="border border-slate-200 px-3 py-2 tabular-nums dark:border-slate-700">
                        {fmt(r.incentiveValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {rows.length > 0 && (
                  <tfoot className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/90">
                    <tr>
                      {productLineFooterCols.map((col) => {
                        if (col === "Prod. Group") {
                          return (
                            <td key={col} className="border-0 px-2 py-1.5 font-semibold text-slate-900 sm:px-3 sm:py-2.5 dark:text-slate-100">
                              Total
                            </td>
                          );
                        }
                        if (col === "Prod. Category" || col === "Prod. Name") {
                          return <td key={col} className="border-0 px-2 py-1.5 sm:px-3 sm:py-2.5" />;
                        }
                        if (col === "Qty") {
                          return (
                            <td key={col} className="border-0 px-2 py-1.5 text-left font-semibold tabular-nums text-slate-900 sm:px-3 sm:py-2.5 dark:text-slate-100">
                              {lineTotals.qty.toLocaleString("en-IN")}
                            </td>
                          );
                        }
                        if (col === "Selling Amt") {
                          return (
                            <td
                              key={col}
                              className="border-0 px-2 py-1.5 font-semibold tabular-nums text-slate-900 sm:px-3 sm:py-2.5 dark:text-slate-100"
                            >
                              {fmt(lineTotals.selling)}
                            </td>
                          );
                        }
                        if (col === "Total (₹)") {
                          return (
                            <td key={col} className="border-0 px-2 py-1.5 font-semibold tabular-nums text-slate-900 sm:px-3 sm:py-2.5 dark:text-slate-100">
                              {fmt(lineTotals.total)}
                            </td>
                          );
                        }
                        if (col === "% Incentive") {
                          return <td key={col} className="border-0 px-2 py-1.5 sm:px-3 sm:py-2.5" />;
                        }
                        return (
                          <td key={col} className="border-0 px-2 py-1.5 font-semibold tabular-nums text-slate-900 sm:px-3 sm:py-2.5 dark:text-slate-100">
                            {fmt(lineTotals.incentive)}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800">
              Total Incentive Calculation Summary
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-xs font-medium dark:bg-slate-800">
                    <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Group</th>
                    <th className="border border-slate-200 px-3 py-2 text-right tabular-nums dark:border-slate-700">Total Sales (₹)</th>
                    <th className="border border-slate-200 px-3 py-2 text-right tabular-nums dark:border-slate-700">Incentive Earned (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s) => (
                    <tr
                      key={s.group}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="border border-slate-200 px-3 py-2 dark:border-slate-700">{s.group}</td>
                      <td className="border border-slate-200 px-3 py-2 text-right tabular-nums dark:border-slate-700">{fmt(s.totalSales)}</td>
                      <td className="border border-slate-200 px-3 py-2 text-right tabular-nums dark:border-slate-700">{fmt(s.incentiveEarned)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/90">
                  <tr>
                    {sumCols.map((col) => {
                      if (col === "Group") {
                        return (
                          <td key={col} className="border-0 px-2 py-1.5 font-semibold text-slate-900 sm:px-3 sm:py-2.5 dark:text-slate-100">
                            Total
                          </td>
                        );
                      }
                      if (col === "Total Sales (₹)") {
                        return (
                          <td key={col} className="border-0 px-2 py-1.5 text-right font-semibold tabular-nums text-slate-900 sm:px-3 sm:py-2.5 dark:text-slate-100">
                            {fmt(totals.sales)}
                          </td>
                        );
                      }
                      return (
                        <td key={col} className="border-0 px-2 py-1.5 text-right font-semibold tabular-nums text-slate-900 sm:px-3 sm:py-2.5 dark:text-slate-100">
                          {fmt(totals.incentive)}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
