import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import dayjs from "dayjs";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Button, InputField } from "../../components/ui/CommanUI";
import { hrmApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";
import { printHtmlDocument } from "../../utils/printAndExport";
import { buildSalarySlipBody, formatInr } from "../../utils/hrmPrint";

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

  const printSlip = (slip) => {
    printHtmlDocument(
      `Salary-slip-${slip.yearMonth}`,
      buildSalarySlipBody(slip)
    );
    toast.success(
      "Downloaded (.html). Open it and use Print → Save as PDF for a PDF copy."
    );
  };

  return (
    <DashboardLayout>
      <div className="ds-stack-major max-w-4xl">
        <button
          type="button"
          onClick={() => navigate("/dashboard/hrm")}
          className="inline-flex items-center gap-1 text-sm text-light hover:text-dark w-fit cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          HRM home
        </button>

        <div>
          <h1 className="text-xl font-bold text-dark">Monthly salary slips</h1>
          <p className="text-sm text-light mt-1">
            Filter by payroll month, print to PDF from the browser dialog, or
            browse recent history.
          </p>
        </div>

        <div className="rounded-xl border border-light-border bg-white p-5 shadow-sm flex flex-wrap items-end gap-4">
          <InputField
            label="Month"
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="w-48"
          />
          <Button label="Refresh" variant="outline" onClick={() => refetch()} />
        </div>

        <div className="rounded-xl border border-light-border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-dark mb-3">
            Slips for {yearMonth}
          </h2>
          {isLoading ? (
            <p className="text-sm text-light">Loading…</p>
          ) : slips.length === 0 ? (
            <p className="text-sm text-light">No slips for this month.</p>
          ) : (
            <ul className="divide-y divide-light-border">
              {slips.map((s) => {
                const emp = s.employeeId;
                const name = emp?.name || "Employee";
                return (
                  <li
                    key={s._id}
                    className="py-3 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-dark">{name}</p>
                      <p className="text-xs text-light">
                        Net {formatInr(s.netSalary)} · Gross{" "}
                        {formatInr(s.grossSalary)}
                      </p>
                    </div>
                    <Button
                      label="Print / PDF"
                      variant="outline"
                      onClick={() => printSlip(s)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-light-border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-dark mb-3">
            Recent history (all months)
          </h2>
          {allQuery.isLoading ? (
            <p className="text-sm text-light">Loading…</p>
          ) : (
            <ul className="divide-y divide-light-border max-h-72 overflow-y-auto">
              {history.map((s) => {
                const emp = s.employeeId;
                return (
                  <li
                    key={s._id}
                    className="py-2 flex flex-wrap justify-between gap-2 text-sm"
                  >
                    <span className="text-dark">
                      {emp?.name || "—"} ·{" "}
                      <span className="text-light tabular-nums">{s.yearMonth}</span>
                    </span>
                    <button
                      type="button"
                      className="text-xs text-primary font-medium cursor-pointer"
                      onClick={() => printSlip(s)}
                    >
                      Print
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
