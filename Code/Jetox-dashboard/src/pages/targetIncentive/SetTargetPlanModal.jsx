import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { dashboardUiApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import { Button, CommonDropdown, CommonModal } from "../../components/ui/CommanUI";

const MONTH_OPTS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const TARGET_TYPE_OPTS = [
  { value: "sales", label: "Sales (₹)" },
  { value: "collection", label: "Collection (₹)" },
  { value: "visits", label: "Visits (count)" },
];

function parseAmountInput(val) {
  if (val == null || val === "") return 0;
  const n = Number(String(val).replace(/[,₹\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

function parseVisitsInput(val) {
  if (val == null || val === "") return 0;
  const n = parseInt(String(val).replace(/[,\s]/g, ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

function fieldClass() {
  return "h-9 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950";
}

function labelClass() {
  return "mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400";
}

function findPlan(plans, month, managerId) {
  const mi = Number(month);
  const key = String(managerId || "").trim();
  return plans.find(
    (p) => Number(p.month) === mi && String(p.managerUserId || "").trim() === key
  );
}

function valueForType(plan, targetType) {
  if (!plan) return "";
  if (targetType === "sales") {
    return plan.salesTarget != null && plan.salesTarget !== ""
      ? String(plan.salesTarget)
      : "";
  }
  if (targetType === "collection") {
    return plan.collectionPlan != null && plan.collectionPlan !== ""
      ? String(plan.collectionPlan)
      : "";
  }
  return plan.visitsTarget != null && plan.visitsTarget !== ""
    ? String(plan.visitsTarget)
    : "";
}

export default function SetTargetPlanModal({ open, onClose }) {
  const queryClient = useQueryClient();

  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [month, setMonth] = useState(() => String(new Date().getMonth() + 1));
  const [managerId, setManagerId] = useState("");
  const [targetType, setTargetType] = useState("sales");
  const [targetValue, setTargetValue] = useState("");
  const [saving, setSaving] = useState(false);

  const yearNum = Number(year);

  const { data: assignMeta, isLoading: metaLoading } = useQuery({
    queryKey: ["target-incentive-assign-meta"],
    queryFn: async () => {
      const { data } = await dashboardUiApi.getTargetIncentiveAssignMeta();
      return data && typeof data === "object" ? data : { managers: [], regions: [] };
    },
    enabled: open,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["target-achievement-plans", yearNum],
    queryFn: async () => {
      const { data } = await dashboardUiApi.listTargetAchievementPlans({
        year: yearNum,
      });
      return Array.isArray(data) ? data : [];
    },
    enabled: open && Number.isFinite(yearNum) && yearNum >= 2000,
  });

  const managerOpts = useMemo(() => {
    const managers = (assignMeta?.managers || []).filter(
      (m) => String(m.role || "Manager").toLowerCase() === "manager"
    );
    return [
      { value: "", label: "Company-wide (all managers)" },
      ...managers.map((m) => ({ value: String(m.value), label: m.label })),
    ];
  }, [assignMeta?.managers]);

  const yearOpts = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1].map((n) => ({
      value: String(n),
      label: String(n),
    }));
  }, []);

  const currentPlan = useMemo(
    () => findPlan(plans, month, managerId),
    [plans, month, managerId]
  );

  const targetLabel = useMemo(() => {
    if (targetType === "visits") return "Visit target (count)";
    if (targetType === "collection") return "Collection target (₹)";
    return "Sales target (₹)";
  }, [targetType]);

  useEffect(() => {
    if (!open) return;
    const d = new Date();
    setYear(String(d.getFullYear()));
    setMonth(String(d.getMonth() + 1));
    setManagerId("");
    setTargetType("sales");
    setTargetValue("");
  }, [open]);

  useEffect(() => {
    if (!open || plansLoading) return;
    setTargetValue(valueForType(currentPlan, targetType));
  }, [open, plansLoading, currentPlan, targetType]);

  const handleSave = async () => {
    const y = Number(year);
    const m = Number(month);
    if (!Number.isFinite(y) || y < 2000) {
      toast.error("Enter a valid year.");
      return;
    }
    if (!Number.isFinite(m) || m < 1 || m > 12) {
      toast.error("Select a month.");
      return;
    }

    const existing = currentPlan || {};
    let sales = Math.max(0, Number(existing.salesTarget) || 0);
    let coll = Math.max(0, Number(existing.collectionPlan) || 0);
    let visits = Math.max(0, Number(existing.visitsTarget) || 0);

    if (targetType === "sales") {
      const v = parseAmountInput(targetValue);
      if (Number.isNaN(v)) {
        toast.error("Enter a valid sales target amount.");
        return;
      }
      sales = v;
    } else if (targetType === "collection") {
      const v = parseAmountInput(targetValue);
      if (Number.isNaN(v)) {
        toast.error("Enter a valid collection target amount.");
        return;
      }
      coll = v;
    } else {
      const v = parseVisitsInput(targetValue);
      if (Number.isNaN(v)) {
        toast.error("Enter a valid visit count.");
        return;
      }
      visits = v;
    }

    setSaving(true);
    try {
      await dashboardUiApi.saveTargetAchievementPlans({
        year: y,
        months: [
          {
            month: m,
            salesTarget: sales,
            collectionPlan: coll,
            visitsTarget: visits,
            managerUserId: String(managerId || "").trim(),
          },
        ],
      });
      toast.success("Target saved for this manager and month.");
      await queryClient.invalidateQueries({ queryKey: ["target-incentive"] });
      await queryClient.invalidateQueries({ queryKey: ["target-incentive", "team"] });
      await queryClient.invalidateQueries({
        queryKey: ["target-incentive", "products"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["target-achievement-plans", y],
      });
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save targets"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title="Set monthly targets"
      size="md"
      bodyClassName="!px-4 !pb-4 !pt-3"
      footerClassName="!justify-end gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-700"
      footer={[
        <Button
          key="cancel"
          label="Cancel"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={saving}
        />,
        <Button
          key="save"
          label={saving ? "Saving…" : "Save target"}
          size="sm"
          onClick={handleSave}
          disabled={saving || metaLoading}
        />,
      ]}
    >
      <div className="flex flex-col gap-3 text-sm">
        <p className="mb-0 text-xs text-slate-500 dark:text-slate-400">
          Choose <strong className="font-medium text-slate-700 dark:text-slate-200">manager</strong> and{" "}
          <strong className="font-medium text-slate-700 dark:text-slate-200">target type</strong>, then save.
          Repeat for another manager or type (e.g. sales for Manager A, visits for Manager B).
          Sales and collection show on <strong className="font-medium text-slate-700 dark:text-slate-200">Target vs achievement (Live)</strong>.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <span className={labelClass()}>Year</span>
            <CommonDropdown
              hideAdd
              filterBar
              options={yearOpts}
              value={year}
              onChange={setYear}
              placeholder="Year"
              className="w-full"
            />
          </div>
          <div>
            <span className={labelClass()}>Month</span>
            <CommonDropdown
              hideAdd
              filterBar
              options={MONTH_OPTS}
              value={month}
              onChange={setMonth}
              placeholder="Month"
              className="w-full"
            />
          </div>
        </div>

        <div>
          <span className={labelClass()}>Manager</span>
          <CommonDropdown
            hideAdd
            filterBar
            options={managerOpts}
            value={managerId}
            onChange={setManagerId}
            placeholder="Manager"
            className="w-full"
            disabled={metaLoading}
          />
        </div>

        <div>
          <span className={labelClass()}>Target type</span>
          <CommonDropdown
            hideAdd
            filterBar
            options={TARGET_TYPE_OPTS}
            value={targetType}
            onChange={setTargetType}
            placeholder="Target type"
            className="w-full"
          />
        </div>

        <div>
          <label className={labelClass()} htmlFor="set-target-value">
            {targetLabel}
          </label>
          <input
            id="set-target-value"
            type="text"
            inputMode={targetType === "visits" ? "numeric" : "decimal"}
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder={
              targetType === "visits" ? "e.g. 60" : "e.g. 500000"
            }
            className={fieldClass()}
            disabled={plansLoading && open}
          />
        </div>

        {currentPlan && !plansLoading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
            <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">
              Already set for this manager & month
            </p>
            <ul className="mb-0 list-inside list-disc space-y-0.5">
              <li>
                Sales: ₹{Number(currentPlan.salesTarget || 0).toLocaleString("en-IN")}
              </li>
              <li>
                Collection: ₹
                {Number(currentPlan.collectionPlan || 0).toLocaleString("en-IN")}
              </li>
              <li>Visits: {Number(currentPlan.visitsTarget || 0).toLocaleString("en-IN")}</li>
            </ul>
          </div>
        ) : null}

        {plansLoading ? (
          <p className="text-xs text-slate-500">Loading existing targets…</p>
        ) : null}
      </div>
    </CommonModal>
  );
}
