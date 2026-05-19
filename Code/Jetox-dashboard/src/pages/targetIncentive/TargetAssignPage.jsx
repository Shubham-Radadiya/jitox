import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import TargetIncentiveSubNav from "./TargetIncentiveSubNav";
import { CommonDropdown, Button } from "../../components/ui/CommanUI";
import { dashboardUiApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";

const unitOpts = [
  { value: "Bags", label: "Bags" },
  { value: "Litre", label: "Litre" },
  { value: "Packet", label: "Packet" },
];

const initialRows = [
  {
    id: "1",
    group: "Dap Fertilizer",
    category: "NPK Fertilizers",
    product: "Urea 46%",
    unit: "Bags",
    qty: "80",
    selling: "620",
    incentive: "20%",
  },
  {
    id: "2",
    group: "",
    category: "",
    product: "NPK 20-20-20",
    unit: "Litre",
    qty: "50",
    selling: "1200",
    incentive: "10%",
  },
  {
    id: "3",
    group: "",
    category: "Organic",
    product: "Vermicompost",
    unit: "Packet",
    qty: "30",
    selling: "450",
    incentive: "15%",
  },
];

export default function TargetAssignPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(initialRows);
  const [saving, setSaving] = useState(false);
  const [applicable, setApplicable] = useState("all");

  useEffect(() => {
    let cancelled = false;
    dashboardUiApi
      .listTargetIncentiveAssignments()
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        const latest = list[0];
        if (!latest?.rows?.length) return;
        setRows(
          latest.rows.map((r, i) => ({
            id: String(i + 1),
            group: r.group || "",
            category: r.category || "",
            product: r.product || "",
            unit: r.unit || "",
            qty: r.qty || "",
            selling: r.selling || "",
            incentive: r.incentive || "",
          }))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  return (
    <DashboardLayout>
      <TargetIncentiveSubNav />

      <div className="flex w-full flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate("/dashboard/target-incentive")}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary dark:text-slate-300"
        >
          <ArrowLeft size={18} />
          Back to target view
        </button>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Description
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <label className="flex min-w-0 items-center gap-2 text-sm sm:flex-1">
              <span className="shrink-0 text-slate-500">From</span>
              <input
                type="date"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
                defaultValue="2025-07-01"
              />
            </label>
            <label className="flex min-w-0 items-center gap-2 text-sm sm:flex-1">
              <span className="shrink-0 text-slate-500">To</span>
              <input
                type="date"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
                defaultValue="2025-07-01"
              />
            </label>
            <div className="flex min-w-0 items-center gap-2 text-sm sm:flex-[1.15]">
              <span className="shrink-0 text-slate-500">Applicable To</span>
              <CommonDropdown
                hideAdd
                filterBar
                options={[
                  { value: "all", label: "All Managers" },
                  { value: "region", label: "By region" },
                ]}
                value={applicable}
                onChange={setApplicable}
                placeholder="Applicable To"
                className="w-full min-w-0"
              />
            </div>
          </div>
          <p className="text-xs text-red-600">
            Warning: You must select a group before accessing other fields.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-xs font-medium dark:bg-slate-800">
                  <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Group</th>
                  <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Category</th>
                  <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Product</th>
                  <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Qty</th>
                  <th className="border border-slate-200 px-3 py-2 text-right dark:border-slate-700">Total Selling Amount</th>
                  <th className="border border-slate-200 px-3 py-2 text-right dark:border-slate-700">Incentive Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="border border-slate-200 px-3 py-2 align-top dark:border-slate-700">
                      <input
                        className="w-full min-w-[7rem] rounded border border-slate-200 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
                        value={r.group}
                        onChange={(e) => update(r.id, "group", e.target.value)}
                      />
                    </td>
                    <td className="border border-slate-200 px-3 py-2 align-top dark:border-slate-700">
                      <input
                        className="w-full min-w-[7rem] rounded border border-slate-200 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
                        value={r.category}
                        onChange={(e) => update(r.id, "category", e.target.value)}
                      />
                    </td>
                    <td className="border border-slate-200 px-3 py-2 align-top dark:border-slate-700">
                      <input
                        className="w-full min-w-[8rem] rounded border border-slate-200 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
                        value={r.product}
                        onChange={(e) => update(r.id, "product", e.target.value)}
                      />
                    </td>
                    <td className="border border-slate-200 px-3 py-2 align-top dark:border-slate-700">
                      <div className="flex gap-1 items-center">
                        <CommonDropdown
                          hideAdd
                          filterBar
                          options={unitOpts}
                          value={r.unit}
                          onChange={(v) => update(r.id, "unit", v)}
                          className="w-24 shrink-0"
                        />
                        <input
                          type="number"
                          className="w-16 rounded border border-slate-200 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
                          value={r.qty}
                          onChange={(e) => update(r.id, "qty", e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="border border-slate-200 px-3 py-2 align-top text-right dark:border-slate-700">
                      <input
                        className="w-24 ml-auto rounded border border-slate-200 px-2 py-1 text-sm tabular-nums text-right focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
                        value={r.selling}
                        onChange={(e) => update(r.id, "selling", e.target.value)}
                      />
                    </td>
                    <td className="border border-slate-200 px-3 py-2 align-top text-right dark:border-slate-700">
                      <input
                        className="w-20 ml-auto rounded border border-slate-200 px-2 py-1 text-sm text-right focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
                        value={r.incentive}
                        onChange={(e) => update(r.id, "incentive", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            label="Cancel"
            variant="outline"
            size="sm"
            className="text-xs min-h-8 px-2.5 py-1 sm:text-sm sm:min-h-9 sm:px-3 sm:py-1"
            onClick={() => navigate(-1)}
          />
          <Button
            label="Save incentive"
            size="sm"
            className="text-xs min-h-8 px-2.5 py-1 sm:text-sm sm:min-h-9 sm:px-3 sm:py-1"
            disabled={saving}
            onClick={async () => {
              const valid = rows.filter((r) => String(r.product || "").trim());
              if (!valid.length) {
                toast.error("Add at least one product row.");
                return;
              }
              setSaving(true);
              try {
                await dashboardUiApi.saveTargetIncentiveAssign({ rows: valid });
                toast.success("Incentive rules saved.");
              } catch (err) {
                toast.error(getApiErrorMessage(err, "Save failed"));
              } finally {
                setSaving(false);
              }
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
