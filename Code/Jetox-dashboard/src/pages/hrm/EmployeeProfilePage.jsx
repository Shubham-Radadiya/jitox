import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Button } from "../../components/ui/CommanUI";
import { hrmApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";
import { useEffect } from "react";
import { printHtmlDocument } from "../../utils/printAndExport";
import { buildSalarySlipBody, formatInr } from "../../utils/hrmPrint";

const API_BASE =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : "http://localhost:4000";

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

  const printSlip = (slip) => {
    const body = buildSalarySlipBody(slip);
    printHtmlDocument(`Salary-slip-${slip.yearMonth}`, body);
    toast.success(
      "Downloaded (.html). Open it and use Print → Save as PDF for a PDF copy."
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <p className="text-sm text-light p-8">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <p className="text-sm text-light p-8">Employee not found.</p>
      </DashboardLayout>
    );
  }

  const slips = data.salarySlips || [];
  const letters = data.appointmentLetters || [];

  return (
    <DashboardLayout>
      <div className="ds-stack-major max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/dashboard/hrm/employees")}
          className="inline-flex items-center gap-1 text-sm text-light hover:text-dark w-fit cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to employees
        </button>

        <div className="rounded-xl border border-light-border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-dark">{data.name}</h1>
              <p className="text-sm text-light mt-1">{data.email}</p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                data.status === "Active"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {data.status}
            </span>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-sm">
            <div>
              <dt className="text-light">Phone</dt>
              <dd className="text-dark font-medium">{data.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-light">Department</dt>
              <dd className="text-dark font-medium">{data.department}</dd>
            </div>
            <div>
              <dt className="text-light">Role</dt>
              <dd className="text-dark font-medium">{data.roleDesignation}</dd>
            </div>
            <div>
              <dt className="text-light">Joining date</dt>
              <dd className="text-dark font-medium">
                {data.joiningDate
                  ? String(data.joiningDate).slice(0, 10)
                  : "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-light">Salary structure</dt>
              <dd className="text-dark font-medium mt-1">
                Basic {formatInr(data.salaryStructure?.basic)}
                {data.salaryStructure?.allowances?.length
                  ? ` · +${data.salaryStructure.allowances.length} allowance(s)`
                  : ""}
                {data.salaryStructure?.deductions?.length
                  ? ` · −${data.salaryStructure.deductions.length} deduction(s)`
                  : ""}
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <Button
              label="Edit employee"
              variant="outline"
              onClick={() =>
                navigate(`/dashboard/hrm/employees?edit=${encodeURIComponent(id)}`)
              }
            />
          </div>
        </div>

        <div className="rounded-xl border border-light-border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-dark mb-3">Salary slip history</h2>
          {slips.length === 0 ? (
            <p className="text-sm text-light">No slips yet.</p>
          ) : (
            <ul className="space-y-2">
              {slips.map((s) => (
                <li
                  key={s._id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-light-border last:border-0"
                >
                  <span className="text-sm text-dark font-medium tabular-nums">
                    {s.yearMonth} · Net {formatInr(s.netSalary)}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary cursor-pointer"
                    onClick={() => printSlip({ ...s, employeeId: data })}
                  >
                    Print / Save PDF
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-light-border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-dark mb-3">
            Stored appointment letters
          </h2>
          {letters.length === 0 ? (
            <p className="text-sm text-light">None yet.</p>
          ) : (
            <ul className="space-y-2">
              {letters.map((l) => (
                <li key={l._id} className="text-sm">
                  {l.documentPath ? (
                    <a
                      href={`${API_BASE}${l.documentPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-medium hover:underline"
                    >
                      {new Date(l.createdAt).toLocaleDateString()} — Open document
                    </a>
                  ) : (
                    <span className="text-light">—</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
