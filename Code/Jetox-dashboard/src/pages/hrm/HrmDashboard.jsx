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
    tint: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  {
    key: "slips",
    title: "Monthly Salary Slip",
    desc: "View slips by month, history, and print or save as PDF.",
    path: "/dashboard/hrm/salary-slips",
    icon: FileSpreadsheet,
    tint: "bg-sky-50 text-sky-700 ring-sky-100",
  },
  {
    key: "auto",
    title: "Auto Salary Generation",
    desc: "Generate monthly payroll for all active employees.",
    path: "/dashboard/hrm/auto-salary",
    icon: Sparkles,
    tint: "bg-violet-50 text-violet-700 ring-violet-100",
  },
  {
    key: "offer",
    title: "Offer Letter",
    desc: "Create offer letters from a template and store records.",
    path: "/dashboard/hrm/offer-letter",
    icon: FileText,
    tint: "bg-amber-50 text-amber-800 ring-amber-100",
  },
  {
    key: "appoint",
    title: "Appointment Letter",
    desc: "Generate appointment letters from employee master data.",
    path: "/dashboard/hrm/appointment-letter",
    icon: ScrollText,
    tint: "bg-slate-100 text-slate-800 ring-slate-200",
  },
];

function SummaryCard({ label, value, sub, variant = "neutral" }) {
  const ring =
    variant === "emerald"
      ? "ring-emerald-100"
      : variant === "rose"
        ? "ring-rose-100"
        : variant === "amber"
          ? "ring-amber-100"
          : "ring-gray-100";
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm ring-1 ${ring} flex flex-col justify-center min-h-0`}
    >
      <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
      <p className="text-xl font-bold text-gray-900 tabular-nums mt-1">{value}</p>
      {sub ? (
        <p className="text-[11px] text-gray-500 mt-1 leading-snug line-clamp-2">
          {sub}
        </p>
      ) : null}
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
            <div className="flex items-center gap-2 text-emerald-600">
              <Users className="h-5 w-5" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Human resources
              </span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900 mt-0.5">HRM</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl leading-snug">
              Central hub for employees, payroll, and HR documents. Open a module
              below to work with that area.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            label="Total employees"
            value={isLoading ? "…" : data?.totalEmployees ?? 0}
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
          <h2 className="text-base font-medium text-gray-900 mb-3">Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => navigate(m.path)}
                  className="group text-left rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 flex flex-col gap-2.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-200"
                >
                  <div
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${m.tint}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
                      {m.desc}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 mt-auto pt-0.5">
                    Open
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
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
