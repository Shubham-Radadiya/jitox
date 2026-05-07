import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCog,
  FileSpreadsheet,
  Sparkles,
  FileText,
  ScrollText,
  ArrowRight,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { hrmApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import toast from "react-hot-toast";
import { useEffect } from "react";

const MODULES = [
  {
    key: "employees",
    title: "User Management",
    desc: "Add, edit, and manage employees, roles, and profiles.",
    path: "/dashboard/hrm/employees",
    icon: UserCog,
    tint:
      "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/55 dark:text-emerald-300 dark:ring-emerald-800/55",
  },
  {
    key: "slips",
    title: "Monthly Salary Slip",
    desc: "View slips by month, history, and print or save as PDF.",
    path: "/dashboard/hrm/salary-slips",
    icon: FileSpreadsheet,
    tint: "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800/50",
  },
  {
    key: "auto",
    title: "Auto Salary Generation",
    desc: "Generate monthly payroll for all active employees.",
    path: "/dashboard/hrm/auto-salary",
    icon: Sparkles,
    tint:
      "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800/50",
  },
  {
    key: "offer",
    title: "Offer Letter",
    desc: "Create offer letters from a template and store records.",
    path: "/dashboard/hrm/offer-letter",
    icon: FileText,
    tint:
      "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950/45 dark:text-amber-200 dark:ring-amber-800/50",
  },
  {
    key: "appoint",
    title: "Appointment Letter",
    desc: "Generate appointment letters from employee master data.",
    path: "/dashboard/hrm/appointment-letter",
    icon: ScrollText,
    tint:
      "bg-slate-100 text-slate-800 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-600/55",
  },
];

/** Ghost-style summary cards aligned with Product Master “Total products” pattern (gradient shell + value pill). */
const SUMMARY_GHOST = {
  slate: {
    card: "from-white/80 via-slate-50/45 to-slate-100/30 dark:from-slate-900/80 dark:via-slate-800/55 dark:to-slate-900/45",
    border: "border-slate-200/55 dark:border-slate-500/45",
    pill:
      "from-slate-100/90 to-slate-200/75 text-slate-800 dark:from-slate-700/90 dark:to-slate-800/85 dark:text-slate-50",
  },
  emerald: {
    card: "from-white/80 via-emerald-50/40 to-teal-50/25 dark:from-slate-900/75 dark:via-emerald-950/40 dark:to-teal-950/28",
    border: "border-emerald-200/50 dark:border-emerald-600/40",
    pill:
      "from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-800/55 dark:to-teal-800/45 dark:text-emerald-50",
  },
  rose: {
    card: "from-white/80 via-rose-50/35 to-red-50/20 dark:from-slate-900/75 dark:via-rose-950/38 dark:to-red-950/25",
    border: "border-rose-200/50 dark:border-rose-700/40",
    pill:
      "from-rose-100 to-red-100 text-rose-900 dark:from-rose-800/50 dark:to-red-900/40 dark:text-rose-50",
  },
  amber: {
    card: "from-white/80 via-amber-50/40 to-orange-50/22 dark:from-slate-900/75 dark:via-amber-950/38 dark:to-orange-950/25",
    border: "border-amber-200/50 dark:border-amber-600/40",
    pill:
      "from-amber-100 to-orange-100 text-amber-900 dark:from-amber-800/50 dark:to-orange-800/40 dark:text-amber-50",
  },
};

function SummaryCard({ label, value, sub, variant = "slate" }) {
  const g = SUMMARY_GHOST[variant] ?? SUMMARY_GHOST.slate;
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br p-3 shadow-sm backdrop-blur-md transition-shadow duration-200 hover:shadow-md dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] dark:hover:shadow-lg dark:hover:shadow-black/25 ${g.card} ${g.border}`}
    >
      <div className="flex min-h-9 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="block min-w-0 flex-1 truncate text-left text-sm font-semibold leading-tight text-slate-700 dark:text-slate-200">
            {label}
          </span>
          <div
            className={`inline-flex min-h-8 min-w-10 max-w-[min(100%,8.5rem)] shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-gradient-to-br px-3 py-1 text-sm font-bold tabular-nums shadow-sm backdrop-blur-sm dark:border-slate-500/45 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${g.pill}`}
          >
            <span className="truncate">{value}</span>
          </div>
        </div>
        {sub ? (
          <p className="text-[11px] leading-snug text-slate-600/90 line-clamp-2 dark:text-slate-400">
            {sub}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function HrmDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["hrm", "dashboard"],
    queryFn: async () => {
      const { data: d } = await hrmApi.getDashboard();
      return d;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load HRM dashboard"));
    }
  }, [isError, error]);

  const payroll = data?.payroll;
  const payrollSub = payroll
    ? `${payroll.generatedCount} generated · ${payroll.pendingCount} pending (${payroll.yearMonth})`
    : null;
  const payrollLabel =
    payroll?.status === "Generated" && (payroll?.pendingCount ?? 0) === 0
      ? "Generated"
      : "Pending";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 max-w-[1280px] min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Users className="h-5 w-5" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Human resources
              </span>
            </div>
            <h1 className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-slate-50">HRM</h1>
            <p className="mt-1 max-w-xl text-sm leading-snug text-gray-500 dark:text-slate-400">
              Central hub for employees, payroll, and HR documents. Open a module
              below to work with that area.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total employees"
            value={isLoading ? "…" : data?.totalEmployees ?? 0}
            variant="slate"
          />
          <SummaryCard
            label="Active"
            value={isLoading ? "…" : data?.activeEmployees ?? 0}
            variant="emerald"
          />
          <SummaryCard
            label="Inactive"
            value={isLoading ? "…" : data?.inactiveEmployees ?? 0}
            variant="rose"
          />
          <SummaryCard
            label="Monthly payroll"
            value={isLoading ? "…" : payrollLabel}
            sub={payrollSub || undefined}
            variant="amber"
          />
        </div>

        <div>
          <h2 className="mb-3 text-base font-medium text-gray-900 dark:text-slate-100">Modules</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => navigate(m.path)}
                  className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-slate-200/70 bg-white/75 p-4 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300/70 hover:bg-white/90 hover:shadow-md dark:border-slate-600/50 dark:bg-slate-900/50 dark:backdrop-blur-md dark:hover:border-emerald-500/40 dark:hover:bg-slate-800/65 dark:hover:shadow-lg dark:hover:shadow-black/20 sm:gap-2.5"
                >
                  <div className="flex min-w-0 flex-row items-start gap-3 sm:flex-col sm:gap-2.5">
                    <div
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${m.tint}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1 sm:flex sm:flex-none sm:flex-col sm:gap-0.5">
                      <h3 className="text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400">
                        {m.title}
                      </h3>
                      {/* Desktop: description directly under title */}
                      <p className="hidden line-clamp-2 text-xs leading-snug text-gray-500 sm:block dark:text-slate-400">
                        {m.desc}
                      </p>
                    </div>
                  </div>
                  {/* Mobile only: description below the icon + title row */}
                  <p className="-mt-1 line-clamp-2 text-xs leading-snug text-gray-500 sm:hidden dark:text-slate-400">
                    {m.desc}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-0.5 text-xs font-medium text-emerald-600 max-sm:w-full max-sm:justify-end dark:text-emerald-400">
                    Open
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
