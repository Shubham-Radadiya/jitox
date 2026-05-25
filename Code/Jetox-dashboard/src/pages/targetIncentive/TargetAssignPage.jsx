import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import TargetIncentiveSubNav from "./TargetIncentiveSubNav";
import { CommonDropdown, Button } from "../../components/ui/CommanUI";
import { dashboardUiApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import { usePurchaseFormMeta } from "../../hooks/usePurchaseFormMeta";

const APPLICABLE_OPTS = [
  { value: "all", label: "All Managers" },
  { value: "managers", label: "Selected managers" },
  { value: "region", label: "By region" },
];

function newRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyRow() {
  return {
    id: newRowId(),
    productId: "",
    group: "",
    category: "",
    product: "",
    unit: "",
    qty: "",
    selling: "",
    incentive: "",
  };
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatAssignmentOption(a) {
  const from = a.fromDate || "—";
  const to = a.toDate || "—";
  const label = String(a.label || "Assignment").trim();
  return `${label} (${from} → ${to})`;
}

function mapAssignmentToState(a) {
  const rows = Array.isArray(a?.rows) ? a.rows : [];
  return {
    assignmentId: a._id ? String(a._id) : "",
    label: String(a.label || "").trim(),
    fromDate: String(a.fromDate || "").trim(),
    toDate: String(a.toDate || "").trim(),
    applicableTo: a.applicableTo || "all",
    applicableUserIds: Array.isArray(a.applicableUserIds)
      ? a.applicableUserIds.map(String)
      : [],
    region: String(a.region || "").trim(),
    rows: rows.length
      ? rows.map((r) => ({
          id: newRowId(),
          productId: String(r.productId || "").trim(),
          group: String(r.group || "").trim(),
          category: String(r.category || "").trim(),
          product: String(r.product || "").trim(),
          unit: String(r.unit || "").trim(),
          qty: String(r.qty ?? "").trim(),
          selling: String(r.selling ?? "").trim(),
          incentive: String(r.incentive ?? "").trim(),
        }))
      : [emptyRow()],
  };
}

function categoriesForGroup(products, group) {
  const set = new Set();
  for (const p of products) {
    if (p.group === group && p.category) set.add(String(p.category));
  }
  return [...set]
    .sort((a, b) => a.localeCompare(b))
    .map((c) => ({ value: c, label: c }));
}

function productsForGroupCategory(products, group, category) {
  return products.filter(
    (p) =>
      p.group === group &&
      (!category || p.category === category) &&
      p.value &&
      p.label
  );
}

export default function TargetAssignPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [assignmentId, setAssignmentId] = useState("");
  const [label, setLabel] = useState("");
  const [fromDate, setFromDate] = useState(todayIsoDate());
  const [toDate, setToDate] = useState(todayIsoDate());
  const [applicableTo, setApplicableTo] = useState("all");
  const [applicableUserIds, setApplicableUserIds] = useState([]);
  const [region, setRegion] = useState("");
  const [rows, setRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const { data: meta, isLoading: metaLoading } = usePurchaseFormMeta();
  const products = meta?.products || [];
  const groups = meta?.groups || [];
  const units = meta?.units || [];

  const { data: assignMeta } = useQuery({
    queryKey: ["target-incentive-assign-meta"],
    queryFn: async () => {
      const { data } = await dashboardUiApi.getTargetIncentiveAssignMeta();
      return data && typeof data === "object" ? data : { managers: [], regions: [] };
    },
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["target-incentive-assignments"],
    queryFn: async () => {
      const { data } = await dashboardUiApi.listTargetIncentiveAssignments();
      return Array.isArray(data) ? data : [];
    },
  });

  const managers = useMemo(
    () =>
      (assignMeta?.managers || []).filter(
        (m) => String(m.role || "Manager").toLowerCase() === "manager"
      ),
    [assignMeta?.managers]
  );
  const regions = assignMeta?.regions || [];

  /** Drop stale non-manager ids when loading saved assignments. */
  useEffect(() => {
    if (!managers.length) return;
    const managerIds = new Set(managers.map((m) => m.value));
    setApplicableUserIds((prev) => {
      const next = prev.filter((id) => managerIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [managers]);

  const assignmentOpts = useMemo(
    () => [
      { value: "", label: "New assignment" },
      ...assignments.map((a) => ({
        value: String(a._id),
        label: formatAssignmentOption(a),
      })),
    ],
    [assignments]
  );

  const applyFormState = useCallback((state) => {
    setAssignmentId(state.assignmentId);
    setLabel(state.label);
    setFromDate(state.fromDate || todayIsoDate());
    setToDate(state.toDate || todayIsoDate());
    setApplicableTo(state.applicableTo || "all");
    setApplicableUserIds(state.applicableUserIds || []);
    setRegion(state.region || "");
    setRows(state.rows?.length ? state.rows : [emptyRow()]);
  }, []);

  useEffect(() => {
    if (loadedOnce || assignmentsLoading) return;
    if (assignments.length) {
      applyFormState(mapAssignmentToState(assignments[0]));
    }
    setLoadedOnce(true);
  }, [assignments, assignmentsLoading, applyFormState, loadedOnce]);

  /** Backfill productId for rows saved before product master linking. */
  useEffect(() => {
    if (!products.length) return;
    setRows((prev) =>
      prev.map((r) => {
        if (r.productId) return r;
        const name = String(r.product || "").trim();
        if (!name) return r;
        const match = products.find(
          (p) =>
            String(p.label || "").trim() === name ||
            String(p.value || "").trim() === name
        );
        if (!match) return r;
        return {
          ...r,
          productId: match.value,
          group: r.group || match.group || "",
          category: r.category || match.category || "",
          unit: r.unit || match.unit || "",
          selling:
            r.selling ||
            (match.defaultRate != null ? String(match.defaultRate) : ""),
        };
      })
    );
  }, [products]);

  const loadAssignment = async (id) => {
    if (!id) {
      applyFormState({
        assignmentId: "",
        label: "",
        fromDate: todayIsoDate(),
        toDate: todayIsoDate(),
        applicableTo: "all",
        applicableUserIds: [],
        region: "",
        rows: [emptyRow()],
      });
      return;
    }
    try {
      const { data } = await dashboardUiApi.getTargetIncentiveAssignment(id);
      applyFormState(mapAssignmentToState(data));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not load assignment"));
    }
  };

  const updateRow = (id, patch) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const onGroupChange = (rowId, group) => {
    updateRow(rowId, {
      group,
      category: "",
      productId: "",
      product: "",
      unit: "",
      selling: "",
    });
  };

  const onCategoryChange = (rowId, category) => {
    updateRow(rowId, {
      category,
      productId: "",
      product: "",
      unit: "",
      selling: "",
    });
  };

  const onProductChange = (rowId, productId) => {
    const prod = products.find((p) => p.value === productId);
    if (!prod) {
      updateRow(rowId, {
        productId: "",
        product: "",
        unit: "",
        selling: "",
      });
      return;
    }
    updateRow(rowId, {
      productId: prod.value,
      product: prod.label,
      group: prod.group || "",
      category: prod.category || "",
      unit: prod.unit || "",
      selling:
        prod.defaultRate != null && Number.isFinite(Number(prod.defaultRate))
          ? String(prod.defaultRate)
          : "",
    });
  };

  const toggleManager = (userId) => {
    setApplicableUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const unitOptsForRow = (row) => {
    const base = units.length
      ? units
      : [
          { value: "Bags", label: "Bags" },
          { value: "Litre", label: "Litre" },
          { value: "Packet", label: "Packet" },
        ];
    if (row.unit && !base.some((u) => u.value === row.unit)) {
      return [{ value: row.unit, label: row.unit }, ...base];
    }
    return base;
  };

  const handleSave = async () => {
    const payload = {
      label: label.trim() || "Assignment",
      fromDate,
      toDate,
      applicableTo,
      applicableUserIds: applicableTo === "managers" ? applicableUserIds : [],
      region: applicableTo === "region" ? region : "",
      rows: rows.map(({ id: _id, ...r }) => r),
    };

    setSaving(true);
    try {
      if (assignmentId) {
        await dashboardUiApi.updateTargetIncentiveAssign(assignmentId, payload);
        toast.success("Incentive rules updated.");
      } else {
        const { data } = await dashboardUiApi.saveTargetIncentiveAssign(payload);
        const created = data?.assignment;
        if (created?._id) setAssignmentId(String(created._id));
        toast.success("Incentive rules saved.");
      }
      await queryClient.invalidateQueries({
        queryKey: ["target-incentive-assignments"],
      });
      await queryClient.invalidateQueries({ queryKey: ["target-incentive"] });
      await queryClient.invalidateQueries({
        queryKey: ["target-incentive", "products"],
      });
      await queryClient.invalidateQueries({ queryKey: ["target-incentive", "team"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!assignmentId) {
      applyFormState({
        assignmentId: "",
        label: "",
        fromDate: todayIsoDate(),
        toDate: todayIsoDate(),
        applicableTo: "all",
        applicableUserIds: [],
        region: "",
        rows: [emptyRow()],
      });
      return;
    }
    if (!window.confirm("Delete this incentive assignment?")) return;
    try {
      await dashboardUiApi.deleteTargetIncentiveAssign(assignmentId);
      toast.success("Assignment deleted.");
      await queryClient.invalidateQueries({
        queryKey: ["target-incentive-assignments"],
      });
      await queryClient.invalidateQueries({ queryKey: ["target-incentive"] });
      await queryClient.invalidateQueries({
        queryKey: ["target-incentive", "products"],
      });
      await queryClient.invalidateQueries({ queryKey: ["target-incentive", "team"] });
      setAssignmentId("");
      applyFormState({
        assignmentId: "",
        label: "",
        fromDate: todayIsoDate(),
        toDate: todayIsoDate(),
        applicableTo: "all",
        applicableUserIds: [],
        region: "",
        rows: [emptyRow()],
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Delete failed"));
    }
  };

  const showGroupWarning = rows.some((r) => !r.group && (r.category || r.productId));

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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <CommonDropdown
            hideAdd
            filterBar
            options={assignmentOpts}
            value={assignmentId}
            onChange={(v) => {
              setAssignmentId(v);
              loadAssignment(v);
            }}
            placeholder="Load assignment"
            className="w-full sm:max-w-md"
          />
          {assignmentsLoading || metaLoading ? (
            <p className="text-xs text-slate-500">Loading master data…</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Description
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex min-w-0 items-center gap-2 text-sm">
              <span className="shrink-0 text-slate-500">Label</span>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. July 2025 incentive"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
              />
            </label>
            <label className="flex min-w-0 items-center gap-2 text-sm">
              <span className="shrink-0 text-slate-500">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
              />
            </label>
            <label className="flex min-w-0 items-center gap-2 text-sm">
              <span className="shrink-0 text-slate-500">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
              />
            </label>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="shrink-0 text-slate-500">Applicable To</span>
              <CommonDropdown
                hideAdd
                filterBar
                options={APPLICABLE_OPTS}
                value={applicableTo}
                onChange={setApplicableTo}
                placeholder="Applicable To"
                className="w-full min-w-0"
              />
            </div>
          </div>

          {applicableTo === "managers" ? (
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                Select managers
              </p>
              <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
                {managers.length ? (
                  managers.map((m) => {
                    const on = applicableUserIds.includes(m.value);
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => toggleManager(m.value)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          on
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500">No managers found in User Master.</p>
                )}
              </div>
            </div>
          ) : null}

          {applicableTo === "region" ? (
            <div className="max-w-xs">
              <CommonDropdown
                hideAdd
                filterBar
                options={regions}
                value={region}
                onChange={setRegion}
                placeholder="Select region"
                className="w-full"
              />
            </div>
          ) : null}

          {showGroupWarning ? (
            <p className="text-xs text-red-600">
              Select a product group before choosing category and product.
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pick group → category → product from Product Master. Unit and selling rate auto-fill from the product.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-xs font-medium dark:bg-slate-800">
                  <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Group</th>
                  <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Category</th>
                  <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Product</th>
                  <th className="border border-slate-200 px-3 py-2 dark:border-slate-700">Qty</th>
                  <th className="border border-slate-200 px-3 py-2 text-right dark:border-slate-700">
                    Total Selling Amount
                  </th>
                  <th className="border border-slate-200 px-3 py-2 text-right dark:border-slate-700">
                    Incentive %
                  </th>
                  <th className="border border-slate-200 px-2 py-2 w-10 dark:border-slate-700" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const catOpts = r.group
                    ? categoriesForGroup(products, r.group)
                    : [];
                  const prodOpts = r.group
                    ? productsForGroupCategory(products, r.group, r.category).map(
                        (p) => ({ value: p.value, label: p.label })
                      )
                    : [];
                  const rowUnitOpts = unitOptsForRow(r);

                  return (
                    <tr key={r.id}>
                      <td className="border border-slate-200 px-2 py-2 align-top dark:border-slate-700">
                        <CommonDropdown
                          hideAdd
                          filterBar
                          menuPortal
                          options={groups}
                          value={r.group}
                          onChange={(v) => onGroupChange(r.id, v)}
                          placeholder="Group"
                          className="min-w-[7rem]"
                        />
                      </td>
                      <td className="border border-slate-200 px-2 py-2 align-top dark:border-slate-700">
                        <CommonDropdown
                          hideAdd
                          filterBar
                          menuPortal
                          options={catOpts}
                          value={r.category}
                          onChange={(v) => onCategoryChange(r.id, v)}
                          placeholder="Category"
                          className="min-w-[7rem]"
                          disabled={!r.group}
                        />
                      </td>
                      <td className="border border-slate-200 px-2 py-2 align-top dark:border-slate-700">
                        <CommonDropdown
                          hideAdd
                          filterBar
                          menuPortal
                          options={prodOpts}
                          value={r.productId}
                          onChange={(v) => onProductChange(r.id, v)}
                          placeholder="Product"
                          className="min-w-[8rem]"
                          disabled={!r.group}
                        />
                      </td>
                      <td className="border border-slate-200 px-2 py-2 align-top dark:border-slate-700">
                        <div className="flex items-center gap-1">
                          <CommonDropdown
                            hideAdd
                            filterBar
                            menuPortal
                            options={rowUnitOpts}
                            value={r.unit}
                            onChange={(v) => updateRow(r.id, { unit: v })}
                            className="w-24 shrink-0"
                            disabled={!r.productId}
                          />
                          <input
                            type="number"
                            min="0"
                            className="w-16 rounded border border-slate-200 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
                            value={r.qty}
                            onChange={(e) => updateRow(r.id, { qty: e.target.value })}
                            disabled={!r.productId}
                          />
                        </div>
                      </td>
                      <td className="border border-slate-200 px-2 py-2 align-top text-right dark:border-slate-700">
                        <input
                          className="w-24 ml-auto rounded border border-slate-200 px-2 py-1 text-sm tabular-nums text-right focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
                          value={r.selling}
                          onChange={(e) => updateRow(r.id, { selling: e.target.value })}
                          disabled={!r.productId}
                        />
                      </td>
                      <td className="border border-slate-200 px-2 py-2 align-top text-right dark:border-slate-700">
                        <input
                          className="w-20 ml-auto rounded border border-slate-200 px-2 py-1 text-sm text-right focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-950"
                          value={r.incentive}
                          onChange={(e) => updateRow(r.id, { incentive: e.target.value })}
                          placeholder="5%"
                          disabled={!r.productId}
                        />
                      </td>
                      <td className="border border-slate-200 px-1 py-2 align-top text-center dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() =>
                            setRows((prev) =>
                              prev.length <= 1
                                ? [emptyRow()]
                                : prev.filter((x) => x.id !== r.id)
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          aria-label="Remove row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setRows((prev) => [...prev, emptyRow()])}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Plus size={14} />
              Add product row
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {assignmentId ? (
            <Button
              label="Delete"
              variant="outline"
              size="sm"
              className="text-xs min-h-8 px-2.5 py-1 sm:text-sm sm:min-h-9 sm:px-3 sm:py-1 text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDelete}
            />
          ) : null}
          <Button
            label="Cancel"
            variant="outline"
            size="sm"
            className="text-xs min-h-8 px-2.5 py-1 sm:text-sm sm:min-h-9 sm:px-3 sm:py-1"
            onClick={() => navigate(-1)}
          />
          <Button
            label={assignmentId ? "Update incentive" : "Save incentive"}
            size="sm"
            className="text-xs min-h-8 px-2.5 py-1 sm:text-sm sm:min-h-9 sm:px-3 sm:py-1"
            disabled={saving || metaLoading}
            onClick={handleSave}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
