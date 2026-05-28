import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  FileText,
  Phone,
  Printer,
  Receipt,
  ScrollText,
  Wallet,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Button } from "../../components/ui/CommanUI";
import { hrmApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";
import { createElement, useEffect } from "react";
import { downloadSalarySlipPdf, formatInr } from "../../utils/hrmPrint";

function sumSalaryLines(lines) {
  return (lines || []).reduce((s, x) => s + Math.max(0, Number(x.amount) || 0), 0);
}

const API_BASE =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : "http://localhost:4000";

function ProfileField({ icon, label, children }) {
  return (
    <div className="flex min-h-13 items-start gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-slate-50 text-slate-500 shadow-sm dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-400">
        {icon ? createElement(icon, { className: "h-4 w-4", "aria-hidden": true }) : null}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="mt-0.5 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Scroll when list exceeds space; on lg fills half of the documents column with the other card. */
function ListScroll({ "aria-label": ariaLabel, children }) {
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className="min-h-0 overflow-y-auto overscroll-y-contain pr-0.5 max-h-[min(38vh,12.5rem)] sm:max-h-[min(40vh,13rem)] lg:max-h-none lg:flex-1"
    >
      {children}
    </div>
  );
}

function SidePanel({ icon, title, children, expandLg = true }) {
  const growLg =
    expandLg === true ? "lg:min-h-0 lg:flex-1" : "lg:flex-none lg:shrink-0";
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 px-2 py-2 shadow-sm dark:border-slate-600/55 dark:bg-slate-900/70 dark:shadow-none ${growLg}`}
    >
      <div className="mb-1.5 flex shrink-0 items-center gap-1.5 border-b border-slate-100 pb-1.5 dark:border-slate-700/80">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          {icon ? createElement(icon, { className: "h-3.5 w-3.5", "aria-hidden": true }) : null}
        </span>
        <h2 className="text-xs font-semibold leading-tight text-slate-900 dark:text-slate-100">
          {title}
        </h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </section>
  );
}

function EmptyHint({ children }) {
  return (
    <div className="shrink-0 rounded-md border border-dashed border-slate-200/90 bg-slate-50/80 px-2 py-2.5 text-center text-xs leading-snug text-slate-500 dark:border-slate-600/60 dark:bg-slate-800/40 dark:text-slate-400">
      {children}
    </div>
  );
}

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["hrm", "employee", id],
    queryFn: async () => {
      const { data: d } = await hrmApi.getEmployee(id);
      return d;
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load employee"));
    }
  }, [isError, error]);

  const printSlip = async (slip) => {
    const id = toast.loading("Generating PDF…");
    try {
      await downloadSalarySlipPdf(slip);
      toast.success("PDF saved to your downloads.", { id });
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not generate PDF"), { id });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <p className="p-8 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <p className="p-8 text-sm text-slate-500 dark:text-slate-400">
          Employee not found.
        </p>
      </DashboardLayout>
    );
  }

  const slips = data.salarySlips || [];
  const letters = data.appointmentLetters || [];

  const initials = String(data.name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard/hrm/employees")}
          className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to employees
        </button>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/4 dark:border-slate-600/70 dark:bg-slate-900/90 dark:shadow-[0_2px_16px_rgba(0,0,0,0.28)] dark:ring-white/6">
          <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,20.5rem)] xl:grid-cols-[minmax(0,1fr)_minmax(19rem,22rem)] lg:divide-x lg:divide-slate-200/80 dark:lg:divide-slate-600/55">
            {/* Profile */}
            <div className="flex flex-col px-2.5 py-4 sm:px-3.5">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-700/80">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-linear-to-br from-slate-50 to-slate-100 text-sm font-bold text-slate-700 shadow-sm dark:border-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-slate-200"
                  aria-hidden
                >
                  {initials || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 gap-y-1">
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-slate-50">
                      {data.name}
                    </h1>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                        data.status === "Active"
                          ? "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-950/50 dark:text-emerald-200"
                          : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300"
                      }`}
                    >
                      {data.status}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                    {data.email}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200/90 bg-slate-200/70 sm:grid-cols-2 dark:border-slate-600/60 dark:bg-slate-700/40">
                <div className="bg-white px-2.5 py-2.5 dark:bg-slate-900/95">
                  <ProfileField icon={Phone} label="Phone">
                    {data.phone || "—"}
                  </ProfileField>
                </div>
                <div className="bg-white px-2.5 py-2.5 dark:bg-slate-900/95">
                  <ProfileField icon={Building2} label="Department">
                    {data.department}
                  </ProfileField>
                </div>
                <div className="bg-white px-2.5 py-2.5 dark:bg-slate-900/95">
                  <ProfileField icon={Briefcase} label="Role">
                    {data.roleDesignation}
                  </ProfileField>
                </div>
                <div className="bg-white px-2.5 py-2.5 dark:bg-slate-900/95">
                  <ProfileField icon={CalendarDays} label="Joining date">
                    {data.joiningDate
                      ? String(data.joiningDate).slice(0, 10)
                      : "—"}
                  </ProfileField>
                </div>
                <div className="bg-slate-50/90 px-2.5 py-2.5 sm:col-span-2 dark:bg-slate-800/50">
                  <ProfileField icon={Wallet} label="Salary structure">
                    {(() => {
                      const structure = data.salaryStructure;
                      const allowanceTotal = sumSalaryLines(structure?.allowances);
                      const deductionTotal = sumSalaryLines(structure?.deductions);
                      const basic = Math.max(0, Number(structure?.basic) || 0);
                      const net = Math.max(
                        0,
                        basic + allowanceTotal - deductionTotal
                      );
                      return (
                        <>
                          Basic {formatInr(basic)}
                          {allowanceTotal > 0
                            ? ` · +${formatInr(allowanceTotal)} allowances`
                            : ""}
                          {deductionTotal > 0
                            ? ` · −${formatInr(deductionTotal)} deductions`
                            : ""}
                          {` · Net ${formatInr(net)}`}
                        </>
                      );
                    })()}
                  </ProfileField>
                </div>
              </div>

              <div className="mt-4 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-700/80">
                <Button
                  label="Edit employee"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 text-white! hover:bg-emerald-700 hover:text-white! dark:bg-emerald-600 dark:hover:bg-emerald-500 sm:min-h-9 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
                  onClick={() =>
                    navigate(
                      `/dashboard/hrm/employees?edit=${encodeURIComponent(id)}`
                    )
                  }
                />
              </div>
            </div>

            {/* Documents */}
            <aside className="flex min-h-0 flex-col gap-1.5 border-t border-slate-200/80 bg-slate-50/80 px-2 py-3 sm:px-2.5 dark:border-slate-600/55 dark:bg-slate-950/40 lg:h-full lg:min-h-0 lg:gap-1.5 lg:border-t-0 lg:py-2.5">
              <SidePanel
                icon={Receipt}
                title="Salary slip history"
                expandLg={slips.length > 0}
              >
                {slips.length === 0 ? (
                  <EmptyHint>No salary slips generated yet.</EmptyHint>
                ) : (
                  <ListScroll aria-label="Salary slip list">
                    <ul className="space-y-1.5">
                      {slips.map((s) => (
                        <li
                          key={s._id}
                          className="flex items-center justify-between gap-2 rounded-md border border-slate-200/80 bg-white px-2 py-1 dark:border-slate-600/50 dark:bg-slate-900/60"
                        >
                          <p className="min-w-0 text-xs font-semibold tabular-nums leading-snug text-slate-900 sm:text-[13px] dark:text-slate-100">
                            <span className="mr-1 font-medium text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                              Period
                            </span>
                            {s.yearMonth}
                            <span className="font-medium text-slate-400 dark:text-slate-500">
                              {" "}
                              ·{" "}
                            </span>
                            <span className="font-normal text-slate-600 dark:text-slate-300">
                              Net {formatInr(s.netSalary)}
                            </span>
                          </p>
                          <button
                            type="button"
                            title="Print / Save PDF"
                            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-600 dark:bg-slate-800 dark:text-emerald-400 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/50 sm:size-8"
                            onClick={() => printSlip({ ...s, employeeId: data })}
                          >
                            <Printer className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </ListScroll>
                )}
              </SidePanel>

              <SidePanel
                icon={ScrollText}
                title="Appointment letters"
                expandLg={letters.length > 0}
              >
                {letters.length === 0 ? (
                  <EmptyHint>No appointment letters stored for this employee.</EmptyHint>
                ) : (
                  <ListScroll aria-label="Appointment letters list">
                    <ul className="space-y-1.5">
                      {letters.map((l) => (
                        <li
                          key={l._id}
                          className="rounded-md border border-slate-200/80 bg-white px-2 py-1 dark:border-slate-600/50 dark:bg-slate-900/60"
                        >
                          {l.documentPath ? (
                            <a
                              href={`${API_BASE}${l.documentPath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 sm:text-[13px]"
                            >
                              <FileText
                                className="h-3.5 w-3.5 shrink-0 opacity-90"
                                aria-hidden
                              />
                              <span className="truncate">
                                {new Date(l.createdAt).toLocaleDateString()} — Open
                                document
                              </span>
                            </a>
                          ) : (
                            <span className="text-sm text-slate-400 dark:text-slate-500">
                              —
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </ListScroll>
                )}
              </SidePanel>
            </aside>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
