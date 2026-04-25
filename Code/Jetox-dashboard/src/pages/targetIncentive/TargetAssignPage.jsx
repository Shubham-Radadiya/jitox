import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import TargetIncentiveSubNav from "./TargetIncentiveSubNav";
import { CommonDropdown, Button } from "../../components/ui/CommanUI";

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
  const [applicable, setApplicable] = useState("all");

  const update = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  return (
    <DashboardLayout>
      <TargetIncentiveSubNav />

      <div className="flex flex-col gap-4 max-w-4xl">
        <button
          type="button"
          onClick={() => navigate("/dashboard/target-incentive")}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary dark:text-slate-300"
        >
          <ArrowLeft size={18} />
          Back to target view
        </button>

        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Assign Incentive
        </h1>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Description
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="text-slate-500 block mb-1">From</span>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                defaultValue="2025-07-01"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-500 block mb-1">To</span>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                defaultValue="2025-07-01"
              />
            </label>
            <div>
              <span className="text-slate-500 block mb-1 text-sm">Applicable To</span>
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
                className="w-full"
              />
            </div>
          </div>
          <p className="text-xs text-red-600">
            Warning: You must select a group before accessing other fields.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-xs font-medium dark:bg-slate-800">
                  <th className="px-3 py-2">Group</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2 text-right">Total Selling Amount</th>
                  <th className="px-3 py-2 text-right">Incentive Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 align-top">
                      <input
                        className="w-full min-w-[7rem] rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-950"
                        value={r.group}
                        onChange={(e) => update(r.id, "group", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        className="w-full min-w-[7rem] rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-950"
                        value={r.category}
                        onChange={(e) => update(r.id, "category", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        className="w-full min-w-[8rem] rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-950"
                        value={r.product}
                        onChange={(e) => update(r.id, "product", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
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
                          className="w-16 rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-950"
                          value={r.qty}
                          onChange={(e) => update(r.id, "qty", e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      <input
                        className="w-24 ml-auto rounded border border-slate-200 px-2 py-1 text-sm tabular-nums text-right dark:border-slate-600 dark:bg-slate-950"
                        value={r.selling}
                        onChange={(e) => update(r.id, "selling", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      <input
                        className="w-20 ml-auto rounded border border-slate-200 px-2 py-1 text-sm text-right dark:border-slate-600 dark:bg-slate-950"
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
          <Button label="Cancel" variant="outline" onClick={() => navigate(-1)} />
          <Button
            label="Save incentive"
            onClick={() => toast.success("Incentive rules saved (demo). Connect API to persist.")}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
