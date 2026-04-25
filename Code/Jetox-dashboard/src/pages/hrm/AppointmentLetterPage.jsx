import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import dayjs from "dayjs";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Button, InputField, CommonDropdown } from "../../components/ui/CommanUI";
import { hrmApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function AppointmentLetterPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [employeeId, setEmployeeId] = useState("");
  const [form, setForm] = useState({
    employeeName: "",
    position: "",
    department: "",
    joiningDate: dayjs().format("YYYY-MM-DD"),
    companyName: "Jitox Agro",
    companyAddress: "",
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["hrm", "employees", "all"],
    queryFn: async () => {
      const { data } = await hrmApi.listEmployees({});
      return Array.isArray(data) ? data : [];
    },
  });

  const empOptions = [
    { value: "", label: "Select employee (auto-fills fields)" },
    ...employees.map((e) => ({
      value: String(e._id),
      label: `${e.name} — ${e.department}`,
    })),
  ];

  const { data: records = [] } = useQuery({
    queryKey: ["hrm", "appointment-letters"],
    queryFn: async () => {
      const { data } = await hrmApi.listAppointmentLetters();
      return Array.isArray(data) ? data : [];
    },
  });

  const genMutation = useMutation({
    mutationFn: async () => {
      const { data } = await hrmApi.generateAppointmentLetter({
        employeeId: employeeId || undefined,
        employeeName: form.employeeName.trim(),
        position: form.position.trim(),
        department: form.department.trim(),
        joiningDate: form.joiningDate,
        companyName: form.companyName.trim(),
        companyAddress: form.companyAddress.trim() || undefined,
      });
      return data;
    },
    onSuccess: (d) => {
      toast.success("Appointment letter saved");
      qc.invalidateQueries({ queryKey: ["hrm"] });
      const path = d?.previewUrl;
      if (path) window.open(`${API_BASE}${path}`, "_blank", "noopener,noreferrer");
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, "Could not generate letter")),
  });

  const onPickEmployee = (id) => {
    setEmployeeId(id);
    if (!id) return;
    const e = employees.find((x) => String(x._id) === id);
    if (!e) return;
    setForm((f) => ({
      ...f,
      employeeName: e.name || "",
      position: e.roleDesignation || "",
      department: e.department || "",
      joiningDate: e.joiningDate
        ? String(e.joiningDate).slice(0, 10)
        : f.joiningDate,
    }));
  };

  return (
    <DashboardLayout>
      <div className="ds-stack-major max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/dashboard/hrm")}
          className="inline-flex items-center gap-1 text-sm text-light hover:text-dark w-fit cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          HRM home
        </button>

        <div>
          <h1 className="text-xl font-bold text-dark">Appointment letter</h1>
          <p className="text-sm text-light mt-1">
            Pull from employee master or type manually. Document is stored and
            linked to the employee when selected.
          </p>
        </div>

        <div className="rounded-xl border border-light-border bg-white p-4 shadow-sm space-y-3">
          <CommonDropdown
            label="Employee (optional)"
            addNavigateTo="/dashboard/hrm/employees"
            options={empOptions}
            value={employeeId}
            onChange={onPickEmployee}
          />
          <InputField
            label="Employee name"
            value={form.employeeName}
            onChange={(e) =>
              setForm((f) => ({ ...f, employeeName: e.target.value }))
            }
            required
          />
          <InputField
            label="Position"
            value={form.position}
            onChange={(e) =>
              setForm((f) => ({ ...f, position: e.target.value }))
            }
            required
          />
          <InputField
            label="Department"
            value={form.department}
            onChange={(e) =>
              setForm((f) => ({ ...f, department: e.target.value }))
            }
            required
          />
          <InputField
            label="Joining date"
            type="date"
            value={form.joiningDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, joiningDate: e.target.value }))
            }
            required
          />
          <InputField
            label="Company name"
            value={form.companyName}
            onChange={(e) =>
              setForm((f) => ({ ...f, companyName: e.target.value }))
            }
            required
          />
          <InputField
            label="Company address (optional)"
            value={form.companyAddress}
            onChange={(e) =>
              setForm((f) => ({ ...f, companyAddress: e.target.value }))
            }
          />
          <Button
            label={genMutation.isPending ? "Generating…" : "Generate & open"}
            variant="primary"
            onClick={() => genMutation.mutate()}
            disabled={
              genMutation.isPending ||
              !form.employeeName.trim() ||
              !form.position.trim() ||
              !form.department.trim()
            }
          />
        </div>

        <div className="rounded-xl border border-light-border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-dark mb-3">Saved records</h2>
          <ul className="space-y-2 text-sm max-h-56 overflow-y-auto">
            {records.map((r) => (
              <li key={r._id} className="flex flex-wrap justify-between gap-2">
                <span className="text-dark">
                  {r.employeeName} — {r.position}
                </span>
                {r.documentPath ? (
                  <a
                    href={`${API_BASE}${r.documentPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs font-medium"
                  >
                    Open
                  </a>
                ) : null}
              </li>
            ))}
            {records.length === 0 ? (
              <p className="text-light text-sm">No letters yet.</p>
            ) : null}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
