import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import dayjs from "dayjs";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Button, InputField } from "../../components/ui/CommanUI";
import { hrmApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function OfferLetterPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    candidateName: "",
    position: "",
    salary: "",
    joiningDate: dayjs().add(30, "day").format("YYYY-MM-DD"),
    companyName: "Jitox Agro",
    companyAddress: "",
  });

  const { data: records = [] } = useQuery({
    queryKey: ["hrm", "offer-letters"],
    queryFn: async () => {
      const { data } = await hrmApi.listOfferLetters();
      return Array.isArray(data) ? data : [];
    },
  });

  const genMutation = useMutation({
    mutationFn: async () => {
      const { data } = await hrmApi.generateOfferLetter({
        candidateName: form.candidateName.trim(),
        position: form.position.trim(),
        salary: Number(form.salary) || 0,
        joiningDate: form.joiningDate,
        companyName: form.companyName.trim(),
        companyAddress: form.companyAddress.trim() || undefined,
      });
      return data;
    },
    onSuccess: (d) => {
      toast.success("Offer letter saved");
      qc.invalidateQueries({ queryKey: ["hrm", "offer-letters"] });
      const path = d?.previewUrl;
      if (path) window.open(`${API_BASE}${path}`, "_blank", "noopener,noreferrer");
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, "Could not generate letter")),
  });

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
          <h1 className="text-xl font-bold text-dark">Offer letter</h1>
          <p className="text-sm text-light mt-1">
            Fill the fields, generate from the template, and open the HTML
            document — use Print → Save as PDF in your browser.
          </p>
        </div>

        <div className="rounded-xl border border-light-border bg-white p-4 shadow-sm space-y-3">
          <InputField
            label="Candidate name"
            value={form.candidateName}
            onChange={(e) =>
              setForm((f) => ({ ...f, candidateName: e.target.value }))
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
            label="Monthly salary (₹)"
            type="number"
            value={form.salary}
            onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
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
              !form.candidateName.trim() ||
              !form.position.trim()
            }
          />
        </div>

        <div className="rounded-xl border border-light-border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-dark mb-3">Saved records</h2>
          <ul className="space-y-2 text-sm max-h-56 overflow-y-auto">
            {records.map((r) => (
              <li key={r._id} className="flex flex-wrap justify-between gap-2">
                <span className="text-dark">
                  {r.candidateName} — {r.position}
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
