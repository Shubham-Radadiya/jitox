import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import TargetIncentiveSubNav from "./TargetIncentiveSubNav";
import { dashboardUiApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import { tableFooterTdClasses } from "../../utils/tableUi";

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN");
}

export default function TargetProductIncentivePage() {
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["target-incentive"],
    queryFn: async () => {
      const { data: payload } = await dashboardUiApi.getTargetIncentive();
      return payload;
    },
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load data"));
    }
  }, [isError, error]);

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
          qty: acc.qty + (Number(r.qty) || 0),
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

      <button
        type="button"
        onClick={() => navigate("/dashboard/target-incentive")}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary mb-3 dark:text-slate-300"
      >
        <ArrowLeft size={18} />
        Product Incentive Table
      </button>

      {isLoading ? (
        <p className="text-sm text-slate-500 py-8">Loading…</p>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-left text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <th className="px-3 py-2">Prod. Group</th>
                    <th className="px-3 py-2">Prod. Category</th>
                    <th className="px-3 py-2">Prod. Name</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2 text-right tabular-nums">Selling Amt</th>
                    <th className="px-3 py-2 text-right tabular-nums">Total (₹)</th>
                    <th className="px-3 py-2 text-right">% Incentive</th>
                    <th className="px-3 py-2 text-right tabular-nums">Incentive Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-100 dark:border-slate-800"
                    >
                      <td className="px-3 py-2">{r.prodGroup}</td>
                      <td className="px-3 py-2">{r.prodCategory}</td>
                      <td className="px-3 py-2 font-medium">{r.prodName}</td>
                      <td className="px-3 py-2">{r.qty}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(r.sellingAmt)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">
                        {fmt(r.total)}
                      </td>
                      <td className="px-3 py-2 text-right">{r.pctIncentive}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
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
                            <td key={col} className={tableFooterTdClasses(col)}>
                              Total
                            </td>
                          );
                        }
                        if (col === "Prod. Category" || col === "Prod. Name") {
                          return <td key={col} className={tableFooterTdClasses(col)} />;
                        }
                        if (col === "Qty") {
                          return (
                            <td key={col} className={tableFooterTdClasses(col)}>
                              {lineTotals.qty.toLocaleString("en-IN")}
                            </td>
                          );
                        }
                        if (col === "Selling Amt") {
                          return (
                            <td
                              key={col}
                              className={tableFooterTdClasses(col, {
                                alignClass: "text-right tabular-nums",
                              })}
                            >
                              {fmt(lineTotals.selling)}
                            </td>
                          );
                        }
                        if (col === "Total (₹)") {
                          return (
                            <td key={col} className={tableFooterTdClasses(col)}>
                              {fmt(lineTotals.total)}
                            </td>
                          );
                        }
                        if (col === "% Incentive") {
                          return <td key={col} className={tableFooterTdClasses(col)} />;
                        }
                        return (
                          <td key={col} className={tableFooterTdClasses(col)}>
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

          <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-900">
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800">
              Total Incentive Calculation Summary
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="bg-slate-100 text-left text-xs font-medium dark:bg-slate-800">
                    <th className="px-3 py-2">Group</th>
                    <th className="px-3 py-2 text-right tabular-nums">Total Sales (₹)</th>
                    <th className="px-3 py-2 text-right tabular-nums">Incentive Earned (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s) => (
                    <tr key={s.group} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2">{s.group}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(s.totalSales)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(s.incentiveEarned)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/90">
                  <tr>
                    {sumCols.map((col) => {
                      if (col === "Group") {
                        return (
                          <td key={col} className={tableFooterTdClasses(col)}>
                            Total
                          </td>
                        );
                      }
                      if (col === "Total Sales (₹)") {
                        return (
                          <td key={col} className={tableFooterTdClasses(col)}>
                            {fmt(totals.sales)}
                          </td>
                        );
                      }
                      return (
                        <td key={col} className={tableFooterTdClasses(col)}>
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
