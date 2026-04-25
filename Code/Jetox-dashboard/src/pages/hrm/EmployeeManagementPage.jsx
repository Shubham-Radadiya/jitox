import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { mergePageAddButton } from "../../utils/pageAddButton";
import {
  Button,
  CommonModal,
  InputField,
  CommonDropdown,
} from "../../components/ui/CommanUI";
import DataTable from "../../components/ui/table/DataTable";
import { hrmApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";
import { isAdminUser } from "../../utils/authSession";
import { useTableData } from "../../hooks/useTableData";

const STATUS_OPTS = [
  { value: "", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

function emptyForm() {
  return {
    name: "",
    email: "",
    phone: "",
    roleDesignation: "",
    department: "",
    joiningDate: new Date().toISOString().slice(0, 10),
    basic: "0",
    status: "Active",
    linkedUserId: "",
    permissions: [],
  };
}

export default function EmployeeManagementPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const { renderRowCell: baseCell } = useTableData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [allowances, setAllowances] = useState([{ name: "HRA", amount: "0" }]);
  const [deductions, setDeductions] = useState([{ name: "PF", amount: "0" }]);

  const { data: usersForLink = [] } = useQuery({
    queryKey: ["hrm", "link-users"],
    queryFn: async () => {
      const { data } = await hrmApi.linkUsers();
      return Array.isArray(data) ? data : [];
    },
    enabled: modalOpen,
  });

  const userLinkOptions = useMemo(
    () => [
      { value: "", label: "No linked app user" },
      ...usersForLink.map((u) => ({
        value: String(u._id),
        label: `${u.name || u.email} (${u.role})`,
      })),
    ],
    [usersForLink]
  );

  const {
    data: rawList = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["hrm", "employees"],
    queryFn: async () => {
      const { data } = await hrmApi.listEmployees({});
      return Array.isArray(data) ? data : [];
    },
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load employees"));
    }
  }, [isError, error]);

  const rows = useMemo(
    () =>
      rawList.map((e) => ({
        _id: e._id,
        Name: e.name,
        Email: e.email,
        Phone: e.phone || "—",
        Department: e.department,
        Role: e.roleDesignation,
        Status: e.status,
        _raw: e,
      })),
    [rawList]
  );

  const columns = [
    "Name",
    "Email",
    "Phone",
    "Department",
    "Role",
    "Status",
    "Actions",
  ];

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setAllowances([{ name: "HRA", amount: "0" }]);
    setDeductions([{ name: "PF", amount: "0" }]);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    const e = row._raw;
    setEditingId(e._id);
    setForm({
      name: e.name || "",
      email: e.email || "",
      phone: e.phone || "",
      roleDesignation: e.roleDesignation || "",
      department: e.department || "",
      joiningDate: e.joiningDate
        ? String(e.joiningDate).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      basic: String(e.salaryStructure?.basic ?? 0),
      status: e.status || "Active",
      linkedUserId: e.linkedUserId ? String(e.linkedUserId) : "",
      permissions: e.permissions || [],
    });
    const al = e.salaryStructure?.allowances?.length
      ? e.salaryStructure.allowances.map((x) => ({
          name: x.name,
          amount: String(x.amount),
        }))
      : [{ name: "HRA", amount: "0" }];
    const ded = e.salaryStructure?.deductions?.length
      ? e.salaryStructure.deductions.map((x) => ({
          name: x.name,
          amount: String(x.amount),
        }))
      : [{ name: "PF", amount: "0" }];
    setAllowances(al);
    setDeductions(ded);
    setModalOpen(true);
  };

  const editFromQuery = searchParams.get("edit");
  useEffect(() => {
    if (!editFromQuery || !rawList.length) return;
    const e = rawList.find((x) => String(x._id) === editFromQuery);
    if (!e) return;
    openEdit({
      _id: e._id,
      Name: e.name,
      Email: e.email,
      Phone: e.phone || "—",
      Department: e.department,
      Role: e.roleDesignation,
      Status: e.status,
      _raw: e,
    });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("edit");
        return next;
      },
      { replace: true }
    );
    // openEdit is stable for UI; including it would retrigger when modal state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editFromQuery, rawList, setSearchParams]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const salaryStructure = {
        basic: Number(form.basic) || 0,
        allowances: allowances.map((a) => ({
          name: a.name.trim() || "Allowance",
          amount: Number(a.amount) || 0,
        })),
        deductions: deductions.map((d) => ({
          name: d.name.trim() || "Deduction",
          amount: Number(d.amount) || 0,
        })),
      };
      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        roleDesignation: form.roleDesignation.trim(),
        department: form.department.trim(),
        joiningDate: form.joiningDate,
        salaryStructure,
        status: form.status,
        linkedUserId: form.linkedUserId || undefined,
        permissions: form.permissions,
      };
      if (editingId) {
        await hrmApi.updateEmployee(editingId, body);
      } else {
        await hrmApi.createEmployee(body);
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Employee updated" : "Employee created");
      qc.invalidateQueries({ queryKey: ["hrm"] });
      setModalOpen(false);
    },
    onError: (e) => {
      toast.error(getApiErrorMessage(e, "Save failed"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => hrmApi.deleteEmployee(id),
    onSuccess: () => {
      toast.success("Employee removed");
      qc.invalidateQueries({ queryKey: ["hrm"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Delete failed")),
  });

  const renderRowCell = (key, value, row) => {
    if (key === "Status") {
      const active = String(value) === "Active";
      return (
        <td key={key} className="px-4 py-3 text-sm align-middle">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium border ${
              active
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {value}
          </span>
        </td>
      );
    }
    return baseCell(key, value, row);
  };

  const renderEmployeeActions = (row) => (
    <td className="px-3 py-2.5 text-sm align-middle whitespace-nowrap border-b border-gray-200">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          className="text-xs font-medium text-primary hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/dashboard/hrm/employees/${row._id}`);
          }}
        >
          Profile
        </button>
        <button
          type="button"
          className="text-xs font-medium text-dark hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(row);
          }}
        >
          Edit
        </button>
        {isAdminUser() ? (
          <button
            type="button"
            className="text-xs font-medium text-rose-600 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              if (
                window.confirm(
                  "Delete this employee and their salary slip records?"
                )
              ) {
                deleteMutation.mutate(row._id);
              }
            }}
          >
            Delete
          </button>
        ) : null}
      </div>
    </td>
  );

  const addAllow = () =>
    setAllowances((s) => [...s, { name: "", amount: "0" }]);
  const addDed = () =>
    setDeductions((s) => [...s, { name: "", amount: "0" }]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 max-w-6xl min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/hrm")}
            className="inline-flex items-center gap-1 text-sm text-light hover:text-dark cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            HRM home
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl font-bold text-dark">User management</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              label="Add employee"
              {...mergePageAddButton()}
              onClick={openCreate}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          renderRowCell={renderRowCell}
          renderAction={renderEmployeeActions}
          maxHeight="calc(100vh - 14rem)"
        />

        <CommonModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingId ? "Edit employee" : "Add employee"}
          width="min(560px, 96vw)"
          footer={
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-light-border">
              <Button label="Cancel" variant="outline" onClick={() => setModalOpen(false)} />
              <Button
                label={saveMutation.isPending ? "Saving…" : "Save"}
                variant="primary"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              />
            </div>
          }
        >
          <div className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
            <InputField
              label="Full name"
              name="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <InputField
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <InputField
              label="Role / designation"
              name="roleDesignation"
              value={form.roleDesignation}
              onChange={(e) =>
                setForm((f) => ({ ...f, roleDesignation: e.target.value }))
              }
              required
            />
            <InputField
              label="Department"
              name="department"
              value={form.department}
              onChange={(e) =>
                setForm((f) => ({ ...f, department: e.target.value }))
              }
              required
            />
            <InputField
              label="Joining date"
              name="joiningDate"
              type="date"
              value={form.joiningDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, joiningDate: e.target.value }))
              }
              required
            />
            <CommonDropdown
              hideAdd
              label="Status"
              options={STATUS_OPTS.filter((o) => o.value)}
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            />
            <CommonDropdown
              label="Linked app user (optional)"
              options={userLinkOptions}
              value={form.linkedUserId}
              onChange={(v) => setForm((f) => ({ ...f, linkedUserId: v }))}
              addNavigateTo="/dashboard/user-master"
            />
            <p className="text-xs font-semibold text-dark pt-2">Salary structure</p>
            <InputField
              label="Basic salary (₹)"
              name="basic"
              type="number"
              value={form.basic}
              onChange={(e) => setForm((f) => ({ ...f, basic: e.target.value }))}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-light">Allowances</span>
                <button
                  type="button"
                  onClick={addAllow}
                  className="text-xs text-primary flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              {allowances.map((a, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <InputField
                    label={i === 0 ? "Name" : ""}
                    value={a.name}
                    onChange={(e) => {
                      const next = [...allowances];
                      next[i] = { ...next[i], name: e.target.value };
                      setAllowances(next);
                    }}
                  />
                  <InputField
                    label={i === 0 ? "Amount" : ""}
                    type="number"
                    value={a.amount}
                    onChange={(e) => {
                      const next = [...allowances];
                      next[i] = { ...next[i], amount: e.target.value };
                      setAllowances(next);
                    }}
                  />
                  {allowances.length > 1 ? (
                    <button
                      type="button"
                      className="p-2 text-rose-500 cursor-pointer mb-0.5"
                      onClick={() =>
                        setAllowances((s) => s.filter((_, j) => j !== i))
                      }
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="w-9" />
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-light">Deductions</span>
                <button
                  type="button"
                  onClick={addDed}
                  className="text-xs text-primary flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              {deductions.map((a, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <InputField
                    label={i === 0 ? "Name" : ""}
                    value={a.name}
                    onChange={(e) => {
                      const next = [...deductions];
                      next[i] = { ...next[i], name: e.target.value };
                      setDeductions(next);
                    }}
                  />
                  <InputField
                    label={i === 0 ? "Amount" : ""}
                    type="number"
                    value={a.amount}
                    onChange={(e) => {
                      const next = [...deductions];
                      next[i] = { ...next[i], amount: e.target.value };
                      setDeductions(next);
                    }}
                  />
                  {deductions.length > 1 ? (
                    <button
                      type="button"
                      className="p-2 text-rose-500 cursor-pointer mb-0.5"
                      onClick={() =>
                        setDeductions((s) => s.filter((_, j) => j !== i))
                      }
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="w-9" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CommonModal>
      </div>
    </DashboardLayout>
  );
}
