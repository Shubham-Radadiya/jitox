import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import dayjs from "dayjs";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Button, InputField } from "../../components/ui/CommanUI";
import { hrmApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";

export default function AutoSalaryPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [yearMonth, setYearMonth] = useState(dayjs().format("YYYY-MM"));
  const [year, month] = yearMonth.split("-").map(Number);

  const genMutation = useMutation({
    mutationFn: async () => {
      const { data } = await hrmApi.generateSalary({ year, month });
      return data;
    },
    onSuccess: (d) => {
      toast.success(
        `Created ${d?.created ?? 0} slip(s), skipped ${d?.skipped ?? 0} duplicate(s).`
      );
      qc.invalidateQueries({ queryKey: ["hrm"] });
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, "Salary generation failed")),
  });

  return (
    <DashboardLayout>
      <div className="ds-stack-major w-full max-w-68 sm:max-w-xs md:max-w-sm">
        <button
          type="button"
          onClick={() => navigate("/dashboard/hrm")}
          className="inline-flex items-center gap-1 text-sm text-light hover:text-dark w-fit cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          HRM home
        </button>

        <div>
          <h1 className="text-xl font-bold text-dark">Auto salary generation</h1>
          <p className="text-sm text-light mt-1">
            Generates one salary slip per active employee for the selected month.
            Existing slips for that month are skipped (no duplicates).
          </p>
        </div>

        <div className="w-full max-w-full rounded-2xl jitox-panel jitox-panel--shadow p-4 sm:p-5 md:p-6 flex flex-col gap-4 sm:gap-5">
          <InputField
            label="Payroll month"
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
          />
          <Button
            label={
              genMutation.isPending
                ? "Generating…"
                : "Generate salary for this month"
            }
            variant="primary"
            onClick={() => genMutation.mutate()}
            disabled={genMutation.isPending || !year || !month}
            className="w-full min-h-8 sm:min-h-9 md:min-h-10 text-[11px] sm:text-xs md:text-sm px-2.5 sm:px-1 leading-tight tracking-tight sm:leading-snug"
          />
          <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400 border-t border-light-border pt-4 dark:border-slate-600/80">
            Scheduled monthly runs can be added on the server (e.g. cron calling
            the same API). This screen runs the job on demand.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
