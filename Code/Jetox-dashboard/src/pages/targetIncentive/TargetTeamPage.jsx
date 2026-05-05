import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Eye } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import TargetIncentiveSubNav from "./TargetIncentiveSubNav";
import { dashboardUiApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  SearchBar,
  CommonDropdown,
  Button,
  CommonModal,
} from "../../components/ui/CommanUI";
import {
  downloadPrintableDocument,
  objectToHtmlTable,
  rowsToHtmlTable,
} from "../../utils/printAndExport";

function parseInr(val) {
  if (val == null || val === "") return 0;
  const s = String(val).replace(/[₹,\s]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function fmtInr(n) {
  return `₹${Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function PctBar({ pct }) {
  const v = Math.min(100, Math.max(0, Number(pct) || 0));
  const ok = v >= 100;
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full rounded-full ${ok ? "bg-primary" : "bg-slate-400"}`}
          style={{ width: `${Math.min(100, v)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums w-10 text-right">{v}%</span>
    </div>
  );
}

export default function TargetTeamPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [detail, setDetail] = useState(null);

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

  const kpis = data?.teamSummaryKpis || [];
  const rows = data?.teamRows || [];

  const roleOpts = useMemo(
    () => [
      { value: "all", label: "All roles" },
      { value: "manager", label: "Manager" },
      { value: "sales", label: "Sales" },
    ],
    []
  );

  const filtered = useMemo(() => {
    let out = rows;
    const s = q.trim().toLowerCase();
    if (s) {
      out = out.filter((r) => String(r.user).toLowerCase().includes(s));
    }
    if (role !== "all") {
      /* placeholder filter */
    }
    return out;
  }, [rows, q, role]);

  const exportTeamTable = () => {
    if (!filtered.length) {
      toast.error("No rows to export");
      return;
    }
    const cols = [
      "User",
      "Period",
      "Target Type",
      "Target Amt",
      "Achieved",
      "% Achieved",
      "Incentive",
      "Status",
    ];
    const exportRows = filtered.map((r) => ({
      User: r.user,
      Period: r.period,
      "Target Type": r.targetType,
      "Target Amt": r.targetAmt,
      Achieved: r.achieved,
      "% Achieved": `${r.pctAchieved ?? ""}%`,
      Incentive: r.incentive,
      Status: r.status,
    }));
    downloadPrintableDocument(
      `Jitox-target-team-${new Date().toISOString().slice(0, 10)}`,
      rowsToHtmlTable(cols, exportRows)
    );
    toast.success("Target table downloaded (.html)");
  };

  const downloadDetailReport = () => {
    if (!detail) return;
    const flat = {
      "Target Type": detail.targetType,
      "Target Amount": detail.targetAmt,
      "Actual Achievement": detail.achieved,
      "Achievement %": `${detail.pctAchieved ?? ""}%`,
      "Incentive eligibility": "Yes",
      "Incentive paid": detail.incentive,
    };
    downloadPrintableDocument(
      `Jitox-target-${String(detail.user || "detail").replace(/\s+/g, "-")}`,
      objectToHtmlTable(flat)
    );
    toast.success("Report downloaded (.html)");
  };

  const teamFooterTotals = useMemo(() => {
    let target = 0;
    let achieved = 0;
    let incentive = 0;
    filtered.forEach((r) => {
      target += parseInr(r.targetAmt);
      achieved += parseInr(r.achieved);
      incentive += parseInr(r.incentive);
    });
    const pctOverall =
      target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
    return { target, achieved, incentive, pctOverall };
  }, [filtered]);

  return (
    <DashboardLayout>
      <TargetIncentiveSubNav />

      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Target vs Achievement View
        </h1>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.key}
              className="flex min-h-14 items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/35 px-3.5 py-2.5 shadow-card dark:border-emerald-800/60 dark:bg-emerald-950/20"
            >
              <p className="!mb-0 text-base font-semibold leading-tight text-slate-800 dark:text-slate-100">
                {k.label}
              </p>
              <span className="inline-flex min-w-11 items-center justify-center rounded-md border border-emerald-200 bg-emerald-100/80 px-2.5 py-1 text-sm font-semibold leading-none tabular-nums text-emerald-800 shadow-sm dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                {k.value}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
            <SearchBar
              dense
              value={q}
              onChange={setQ}
              placeholder="Search name here…"
              className="w-full sm:max-w-xs"
            />
            <div className="flex gap-2 items-center">
              <CommonDropdown
                hideAdd
                filterBar
                options={roleOpts}
                value={role}
                onChange={setRole}
                placeholder="Role"
                className="w-36"
              />
              <button
                type="button"
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-primary dark:border-slate-600"
                title="Export"
                onClick={exportTeamTable}
              >
                <CalendarDays size={18} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-500 py-6">Loading…</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full min-w-[800px] border-collapse text-sm [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-100 text-left text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">User</th>
                    <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Period</th>
                    <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Target Type</th>
                    <th className="border border-slate-200 px-3 py-2 text-right dark:border-slate-700">Target Amt</th>
                    <th className="border border-slate-200 px-3 py-2 text-right dark:border-slate-700">Achieved</th>
                    <th className="border border-slate-200 px-3 py-2 w-36 dark:border-slate-700">% Achieved</th>
                    <th className="border border-slate-200 px-3 py-2 text-right dark:border-slate-700">Incentive</th>
                    <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Status</th>
                    <th className="border border-slate-200 px-3 py-2 text-center dark:border-slate-700">View Report</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="border border-slate-200 px-3 py-2 font-medium text-slate-800 dark:border-slate-700 dark:text-slate-100">
                        {r.user}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-700 dark:text-slate-300">{r.period}</td>
                      <td className="border border-slate-200 px-3 py-2 dark:border-slate-700">{r.targetType}</td>
                      <td className="border border-slate-200 px-3 py-2 text-right tabular-nums dark:border-slate-700">{r.targetAmt}</td>
                      <td className="border border-slate-200 px-3 py-2 text-right tabular-nums dark:border-slate-700">{r.achieved}</td>
                      <td className="border border-slate-200 px-3 py-2 dark:border-slate-700">
                        <PctBar pct={r.pctAchieved} />
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right tabular-nums dark:border-slate-700">{r.incentive}</td>
                      <td className="border border-slate-200 px-3 py-2 dark:border-slate-700">
                        <span
                          className={
                            r.status === "Achieved"
                              ? "text-emerald-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center dark:border-slate-700">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:border-primary hover:text-primary dark:border-slate-600"
                          title="View"
                          onClick={() => setDetail(r)}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-100">
                      <td className="border-0 px-3 py-2.5">Total</td>
                      <td className="border-0 px-3 py-2.5" />
                      <td className="border-0 px-3 py-2.5" />
                      <td className="border-0 px-3 py-2.5 text-right tabular-nums">
                        {fmtInr(teamFooterTotals.target)}
                      </td>
                      <td className="border-0 px-3 py-2.5 text-right tabular-nums">
                        {fmtInr(teamFooterTotals.achieved)}
                      </td>
                      <td className="border-0 px-3 py-2.5">
                        <PctBar pct={teamFooterTotals.pctOverall} />
                      </td>
                      <td className="border-0 px-3 py-2.5 text-right tabular-nums">
                        {fmtInr(teamFooterTotals.incentive)}
                      </td>
                      <td className="border-0 px-3 py-2.5" />
                      <td className="border-0 px-3 py-2.5" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>

      <CommonModal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `Target Achievement — ${detail.user}` : ""}
        width="min(420px, 94vw)"
        footer={[
          <Button
            key="dl"
            label="Download"
            variant="outline"
            size="sm"
            onClick={downloadDetailReport}
          />,
          <Button key="cl" label="Close" size="sm" onClick={() => setDetail(null)} />,
        ]}
      >
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500">Target Type</span>
              <span className="font-medium text-right">{detail.targetType}</span>
              <span className="text-slate-500">Target Amount</span>
              <span className="font-medium text-right tabular-nums">{detail.targetAmt}</span>
              <span className="text-slate-500">Actual Achievement</span>
              <span className="font-medium text-right tabular-nums">{detail.achieved}</span>
              <span className="text-slate-500">Achievement %</span>
              <span className="font-medium text-right tabular-nums">{detail.pctAchieved}%</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700">
              <span className="text-slate-600">Incentive eligibility</span>
              <span className="text-emerald-600 font-medium">Yes</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs mb-1">Incentive paid</span>
              <span className="tabular-nums">{detail.incentive} (On 28 Jul 2025)</span>
            </div>
          </div>
        )}
      </CommonModal>
    </DashboardLayout>
  );
}
