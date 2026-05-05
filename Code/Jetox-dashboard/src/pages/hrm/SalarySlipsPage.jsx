import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileDown } from "lucide-react";
import dayjs from "dayjs";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Button, InputField } from "../../components/ui/CommanUI";
import { hrmApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";
import { downloadSalarySlipPdf, formatInr } from "../../utils/hrmPrint";

const panelShell =
  "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/4 dark:border-slate-600/70 dark:bg-slate-900/90 dark:shadow-[0_2px_16px_rgba(0,0,0,0.22)] dark:ring-white/6";

const pdfBtnClass =
  "bg-emerald-600 text-white! shadow-sm hover:bg-emerald-700 hover:text-white! dark:bg-emerald-600 dark:hover:bg-emerald-500";

/** List area: grows inside equal-height cards; scrolls here instead of the page (lg+). */
const listWellClass =
  "flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200/60 bg-slate-50/70 p-2 dark:border-slate-600/50 dark:bg-slate-950/35";

function SectionHeading({ title, count = null }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2">
      <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h2>
      {count != null && !Number.isNaN(Number(count)) ? (
        <span className="shrink-0 rounded-full border border-slate-200/90 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
          {count}
        </span>
      ) : null}
    </div>
  );
}

export default function SalarySlipsPage() {
  const navigate = useNavigate();
  const [yearMonth, setYearMonth] = useState(dayjs().format("YYYY-MM"));

  const { data: slips = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["hrm", "salary-slips", yearMonth],
    queryFn: async () => {
      const { data } = await hrmApi.listSalarySlips({ month: yearMonth });
      return Array.isArray(data) ? data : [];
    },
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load salary slips"));
    }
  }, [isError, error]);

  const allQuery = useQuery({
    queryKey: ["hrm", "salary-slips-all"],
    queryFn: async () => {
      const { data } = await hrmApi.listSalarySlips({});
      return Array.isArray(data) ? data : [];
    },
  });

  const history = useMemo(() => {
    const list = allQuery.data || [];
    return [...list].slice(0, 60);
  }, [allQuery.data]);

  const printSlip = async (slip) => {
    const id = toast.loading("Generating PDF…");
    try {
      await downloadSalarySlipPdf(slip);
      toast.success("PDF saved to your downloads.", { id });
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not generate PDF"), { id });
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-3 pb-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard/hrm")}
          className="inline-flex w-fit shrink-0 cursor-pointer items-center gap-1.5 text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          HRM home
        </button>

        {/* Hero — shorter */}
        <div
          className={`${panelShell} shrink-0 bg-linear-to-br from-white via-emerald-50/30 to-slate-50/90 p-3.5 sm:p-4 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20`}
        >
          <div className="flex flex-col gap-2 border-l-[3px] border-emerald-500/80 pl-3 dark:border-emerald-500/60 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pl-3.5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400/90">
                Payroll
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50">
                Monthly salary slips
              </h1>
            </div>
            <p className="max-w-md text-xs leading-snug text-slate-600 sm:text-right sm:text-sm dark:text-slate-400">
              Pick a month, download slips as PDF, or scan recent runs across all
              months.
            </p>
          </div>
        </div>

        {/* lg: same height, fits viewport band — lists scroll inside if long */}
        <div className="grid min-h-0 grid-cols-1 gap-4 lg:h-[calc(100dvh-16.75rem)] lg:min-h-40 lg:grid-cols-2 lg:grid-rows-1 lg:items-stretch lg:gap-5 lg:overflow-hidden">
          {/* Current month */}
          <div className={`flex h-full min-h-0 flex-col overflow-hidden ${panelShell}`}>
            <div className="shrink-0 border-b border-slate-200/80 bg-slate-50/90 px-3 py-2.5 dark:border-slate-700/70 dark:bg-slate-800/45 sm:px-4">
              <div className="flex flex-wrap items-end gap-2.5 sm:gap-3">
                <InputField
                  label="Month"
                  type="month"
                  value={yearMonth}
                  onChange={(e) => setYearMonth(e.target.value)}
                  className="w-44 min-w-40 sm:w-48 sm:min-w-44"
                />
                <Button
                  label="Refresh"
                  variant="outline"
                  size="sm"
                  className="border-slate-200/90 dark:border-slate-600"
                  onClick={() => refetch()}
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 p-3 sm:gap-2.5 sm:p-4">
              <SectionHeading
                title={`Slips for ${yearMonth}`}
                count={isLoading ? null : slips.length}
              />

              {isLoading ? (
                <div
                  className={`${listWellClass} items-center justify-center border-dashed py-6 text-sm text-slate-500 dark:text-slate-400`}
                >
                  <span
                    className="inline-block size-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
                    aria-hidden
                  />
                  <span className="mt-2">Loading slips…</span>
                </div>
              ) : slips.length === 0 ? (
                <div
                  className={`${listWellClass} items-center justify-center border-dashed py-6 text-center text-sm text-slate-500 dark:text-slate-400`}
                >
                  No slips for this month.
                </div>
              ) : (
                <div className={listWellClass}>
                  <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain pr-0.5">
                    {slips.map((s) => {
                      const emp = s.employeeId;
                      const name = emp?.name || "Employee";
                      return (
                        <li
                          key={s._id}
                          className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-slate-200/85 bg-white px-3 py-2.5 shadow-sm transition hover:border-emerald-200/80 hover:bg-emerald-50/25 dark:border-slate-600/55 dark:bg-slate-900/70 dark:hover:border-emerald-800/40 dark:hover:bg-emerald-950/20"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              Net {formatInr(s.netSalary)}
                              <span className="text-slate-300 dark:text-slate-600">
                                {" "}
                                ·{" "}
                              </span>
                              Gross {formatInr(s.grossSalary)}
                            </p>
                          </div>
                          <Button
                            icon={FileDown}
                            label="PDF"
                            variant="primary"
                            size="sm"
                            className={`shrink-0 ${pdfBtnClass} sm:min-h-8 sm:px-3`}
                            onClick={() => printSlip(s)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className={`flex h-full min-h-0 flex-col overflow-hidden ${panelShell}`}>
            <div className="shrink-0 border-b border-slate-200/80 bg-slate-50/90 px-3 py-2.5 dark:border-slate-700/70 dark:bg-slate-800/45 sm:px-4">
              <SectionHeading
                title="Recent history"
                count={allQuery.isLoading ? null : history.length}
              />
              <p className="mt-1 text-xs font-medium leading-snug text-slate-600 sm:text-sm dark:text-slate-400">
                All months · newest first
              </p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
              {allQuery.isLoading ? (
                <div
                  className={`${listWellClass} items-center justify-center border-dashed py-6 text-sm text-slate-500 dark:text-slate-400`}
                >
                  <span
                    className="inline-block size-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
                    aria-hidden
                  />
                  <span className="mt-2">Loading…</span>
                </div>
              ) : history.length === 0 ? (
                <div
                  className={`${listWellClass} items-center justify-center border-dashed py-6 text-center text-sm text-slate-500 dark:text-slate-400`}
                >
                  No history yet.
                </div>
              ) : (
                <div className={listWellClass}>
                  <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain pr-0.5">
                    {history.map((s) => {
                      const emp = s.employeeId;
                      return (
                        <li
                          key={s._id}
                          className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-slate-200/85 bg-white px-3 py-2.5 shadow-sm transition hover:border-emerald-200/80 hover:bg-emerald-50/25 dark:border-slate-600/55 dark:bg-slate-900/70 dark:hover:border-emerald-800/40 dark:hover:bg-emerald-950/20"
                        >
                          <div className="min-w-0 text-sm">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {emp?.name || "—"}
                            </span>
                            <span className="ml-1.5 tabular-nums text-slate-500 dark:text-slate-400">
                              · {s.yearMonth}
                            </span>
                          </div>
                          <Button
                            icon={FileDown}
                            label="PDF"
                            variant="primary"
                            size="sm"
                            className={`shrink-0 ${pdfBtnClass} sm:min-h-8 sm:px-3`}
                            onClick={() => printSlip(s)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
