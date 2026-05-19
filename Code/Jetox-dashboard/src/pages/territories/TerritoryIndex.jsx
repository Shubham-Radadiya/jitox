import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { AlertTriangle, MapPin, Plus } from "lucide-react";
import { TbEdit as TbEditIcon } from "react-icons/tb";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Button, CommonModal } from "../../components/ui/CommanUI";
import { territoriesApi } from "../../services/api";
import { getApiErrorMessage } from "../../utils/apiError";
import { isAdminUser } from "../../utils/authSession";

function parseListInput(value) {
  return String(value || "")
    .split(/[,;|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToInput(arr) {
  return Array.isArray(arr) ? arr.join(", ") : "";
}

const emptyForm = {
  name: "",
  code: "",
  districts: "",
  states: "",
  cities: "",
  pincodes: "",
  managerId: "",
};

export default function TerritoryIndex() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const highlightDistrict = searchParams.get("highlightDistrict") || "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const admin = isAdminUser();

  const { data: territories = [], isLoading } = useQuery({
    enabled: admin,
    queryKey: ["territories"],
    queryFn: async () => {
      const { data } = await territoriesApi.list();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: pending = [] } = useQuery({
    enabled: admin,
    queryKey: ["territories", "pending-districts"],
    queryFn: async () => {
      const { data } = await territoriesApi.listPendingDistricts();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30_000,
  });

  const { data: managers = [] } = useQuery({
    enabled: admin,
    queryKey: ["territories", "managers"],
    queryFn: async () => {
      const { data } = await territoriesApi.listManagers();
      return Array.isArray(data) ? data : [];
    },
  });

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm({
      ...emptyForm,
      districts: highlightDistrict || "",
    });
    setModalOpen(true);
  }, [highlightDistrict]);

  const openEdit = useCallback((row) => {
    setEditing(row);
    setForm({
      name: row.name || "",
      code: row.code || "",
      districts: listToInput(row.districts),
      states: listToInput(row.states),
      cities: listToInput(row.cities),
      pincodes: listToInput(row.pincodes),
      managerId: row.managerId ? String(row.managerId) : "",
    });
    setModalOpen(true);
  }, []);

  useEffect(() => {
    if (highlightDistrict && pending.length > 0) {
      openCreate();
    }
  }, [highlightDistrict, pending.length, openCreate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        districts: parseListInput(form.districts),
        states: parseListInput(form.states),
        cities: parseListInput(form.cities),
        pincodes: parseListInput(form.pincodes),
        managerId: form.managerId || undefined,
      };
      if (!body.name) throw new Error("Territory name is required.");
      if (!body.districts.length) {
        throw new Error("Add at least one district for this territory.");
      }
      if (editing?._id) {
        return territoriesApi.update(editing._id, body);
      }
      return territoriesApi.create(body);
    },
    onSuccess: (res) => {
      const msg = res?.apiMessage || "Territory saved";
      const reassigned = res?.data?.reassignedUsers;
      toast.success(
        reassigned
          ? `${msg} (${reassigned} user(s) assigned.)`
          : msg
      );
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["territories"] });
      qc.invalidateQueries({ queryKey: ["territories", "pending-districts"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Could not save territory")),
  });

  const pendingBanner = useMemo(() => {
    if (!pending.length) return null;
    return (
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Districts waiting for territory mapping
            </p>
            <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/80">
              Users registered in these districts are not assigned to any territory.
              Add each district to a territory below (you were also notified in
              Notifications).
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {pending.map((row) => (
                <li key={row.district}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setForm({ ...emptyForm, districts: row.district });
                      setModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-900 shadow-sm ring-1 ring-amber-200 hover:bg-amber-100 dark:bg-slate-900 dark:text-amber-100 dark:ring-amber-800"
                  >
                    <MapPin size={12} />
                    {row.district}
                    {row.users?.length ? ` (${row.users.length})` : ""}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }, [pending]);

  if (!admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Territory Master
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Create territories and assign districts. Users in unmapped districts
            trigger an admin notification until you add the district here.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          label="Add territory"
          icon={Plus}
          className="inline-flex gap-2"
        />
      </div>

      {pendingBanner}

      <div className="overflow-hidden rounded-xl border border-light-border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading…</p>
        ) : territories.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            No territories yet. Create one and list its districts.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Districts</th>
                  <th className="px-4 py-3">Manager</th>
                  <th className="px-4 py-3 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {territories.map((t) => {
                  const manager = managers.find(
                    (m) => String(m._id) === String(t.managerId)
                  );
                  const managerLabel =
                    manager?.name ||
                    [manager?.firstName, manager?.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    manager?.email ||
                    "—";
                  return (
                    <tr key={t._id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                        {t.name}
                        {t.code ? (
                          <span className="ml-2 text-xs text-gray-400">({t.code})</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                        {(t.districts || []).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                        {managerLabel}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary dark:hover:bg-slate-800"
                          aria-label="Edit territory"
                        >
                          <TbEditIcon size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CommonModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit territory" : "Add territory"}
        size="md"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <label className="block text-sm">
            <span className="font-medium text-gray-700 dark:text-slate-300">
              Territory name *
            </span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700 dark:text-slate-300">
              Districts * (comma-separated)
            </span>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              placeholder="e.g. Ahmedabad, Gandhinagar"
              value={form.districts}
              onChange={(e) =>
                setForm((f) => ({ ...f, districts: e.target.value }))
              }
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700 dark:text-slate-300">
              Territory manager
            </span>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              value={form.managerId}
              onChange={(e) =>
                setForm((f) => ({ ...f, managerId: e.target.value }))
              }
            >
              <option value="">— None —</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name ||
                    [m.firstName, m.lastName].filter(Boolean).join(" ") ||
                    m.email}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700 dark:text-slate-300">
              States (optional)
            </span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              value={form.states}
              onChange={(e) => setForm((f) => ({ ...f, states: e.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              label="Cancel"
              onClick={() => setModalOpen(false)}
            />
            <Button
              type="submit"
              label={saveMutation.isPending ? "Saving…" : "Save"}
              disabled={saveMutation.isPending}
            />
          </div>
        </form>
      </CommonModal>
    </DashboardLayout>
  );
}
