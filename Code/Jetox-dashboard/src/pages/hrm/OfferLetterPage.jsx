import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import dayjs from "dayjs";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Button, InputField } from "../../components/ui/CommanUI";
import { hrmApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";
import { downloadHtmlDocumentAsPdf } from "../../utils/printAndExport";

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

  const downloadOfferLetterPdfFromPath = async (path, fileHint = "candidate") => {
    if (!path) {
      toast.error("Could not find generated document.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const fullHtml = await res.text();
      const safeHint = String(fileHint || "candidate")
        .trim()
        .replace(/[/\\?%*:|"<>]/g, "-")
        .replace(/\s+/g, "-");
      await downloadHtmlDocumentAsPdf(fullHtml, `offer-letter-${safeHint}.pdf`);
      toast.success("Offer letter downloaded as PDF.");
    } catch (err) {
      console.error("Offer letter PDF generation failed:", err);
      toast.error("Could not download PDF from generated letter.");
    }
  };

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
    onSuccess: async (d) => {
      toast.success("Offer letter saved");
      qc.invalidateQueries({ queryKey: ["hrm", "offer-letters"] });
      const path = d?.previewUrl || d?.documentPath;
      await downloadOfferLetterPdfFromPath(path, form.candidateName);
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, "Could not generate letter")),
  });

  return (
    <DashboardLayout>
      <div className="ds-stack-major w-full min-w-0">
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
          <p className="text-sm text-light mt-1 max-w-3xl">
            Fill the fields and generate the letter from template as a PDF
            download.
          </p>
        </div>

        <div className="flex flex-col gap-3 min-[1200px]:flex-row min-[1200px]:items-stretch min-[1200px]:gap-4 xl:gap-5 min-w-0 max-w-full">
          <div className="min-w-0 w-full flex flex-col min-[1200px]:max-w-160 min-[1200px]:shrink-0">
            <div className="rounded-2xl jitox-panel jitox-panel--shadow p-3 sm:p-4 flex flex-col gap-3">
              {/* Row 1: three fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <InputField
                  label="Candidate name"
                  value={form.candidateName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, candidateName: e.target.value }))
                  }
                  required
                  className="min-w-0"
                />
                <InputField
                  label="Position"
                  value={form.position}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, position: e.target.value }))
                  }
                  required
                  className="min-w-0"
                />
                <InputField
                  label="Monthly salary (₹)"
                  type="number"
                  value={form.salary}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, salary: e.target.value }))
                  }
                  required
                  className="min-w-0 sm:col-span-2 lg:col-span-1"
                />
              </div>

              {/* Row 2: address only */}
              <InputField
                label="Company address (optional)"
                value={form.companyAddress}
                onChange={(e) =>
                  setForm((f) => ({ ...f, companyAddress: e.target.value }))
                }
                className="min-w-0 w-full"
              />

              {/* Row 3: two fields + button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:items-end">
                <InputField
                  label="Joining date"
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, joiningDate: e.target.value }))
                  }
                  required
                  className="min-w-0"
                />
                <InputField
                  label="Company name"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, companyName: e.target.value }))
                  }
                  required
                  className="min-w-0"
                />
                <div className="flex flex-col min-w-0 sm:col-span-2 lg:col-span-1">
                  <span
                    className="mb-1.5 text-left text-[12px] font-semibold leading-tight tracking-wide text-slate-800 dark:text-slate-200 invisible select-none"
                    aria-hidden
                  >
                    Action
                  </span>
                  <Button
                    label={
                      genMutation.isPending ? "Generating…" : "Generate & open"
                    }
                    variant="primary"
                    onClick={() => genMutation.mutate()}
                    disabled={
                      genMutation.isPending ||
                      !form.candidateName.trim() ||
                      !form.position.trim()
                    }
                    className="w-full min-h-10 shrink-0 rounded-md border-0! bg-primary! text-white! shadow-sm ring-1! ring-primary/40! hover:bg-emerald-600! hover:text-white! hover:ring-emerald-600/50! active:bg-emerald-700! focus-visible:outline-none focus-visible:ring-2! focus-visible:ring-primary/45! disabled:cursor-not-allowed! disabled:bg-primary! disabled:text-white! disabled:opacity-65 disabled:hover:bg-primary! disabled:hover:opacity-65 dark:bg-primary! dark:text-white! dark:ring-primary/40! dark:hover:bg-emerald-600! dark:hover:ring-emerald-600/50! dark:disabled:bg-primary!"
                  />
                </div>
              </div>
            </div>
          </div>

          <aside className="w-full min-w-0 max-w-full overflow-x-hidden min-[1200px]:flex-1 min-[1200px]:min-w-0 xl:min-w-72 min-[1200px]:max-w-none min-[1200px]:shrink min-[1200px]:max-h-[calc(100dvh-8rem)] min-[1200px]:sticky min-[1200px]:top-4 min-[1200px]:self-start flex flex-col min-h-0">
            <div className="rounded-2xl jitox-panel jitox-panel--shadow p-3 sm:p-4 flex flex-col min-h-0 min-w-0 flex-1 overflow-hidden min-[1200px]:max-h-[min(28rem,calc(100dvh-10rem))]">
              <h2 className="text-sm font-semibold text-dark mb-2 tracking-tight shrink-0">
                Saved records
              </h2>
              <ul className="space-y-1.5 text-sm overflow-y-auto overflow-x-hidden min-h-0 min-w-0 flex-1 overscroll-contain">
                {records.map((r) => (
                  <li key={r._id} className="min-w-0 max-w-full">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 sm:gap-x-3 rounded-lg border border-light-border bg-slate-50/90 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:border-slate-600/90 dark:bg-slate-800/50 dark:shadow-none min-w-0 max-w-full transition-colors hover:bg-slate-100/95 dark:hover:bg-slate-800/80">
                      <div className="min-w-0 flex min-h-0 items-center">
                        <p className="text-sm font-medium text-dark leading-tight wrap-break-word m-0 w-full">
                          <span className="text-slate-900 dark:text-slate-100">
                            {r.candidateName}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-normal">
                            {" "}
                            —{" "}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-normal">
                            {r.position}
                          </span>
                        </p>
                      </div>
                      {r.documentPath ? (
                        <button
                          type="button"
                          onClick={() =>
                            downloadOfferLetterPdfFromPath(
                              r.documentPath,
                              r.candidateName || "candidate"
                            )
                          }
                          className="inline-flex w-fit max-w-full shrink-0 items-center justify-center justify-self-end gap-1 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white shadow-sm ring-1 ring-primary/40 hover:bg-emerald-600 hover:text-white hover:ring-emerald-600/50 active:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 dark:bg-primary dark:text-white dark:hover:bg-emerald-600"
                        >
                          Open
                          <ExternalLink
                            className="h-3 w-3 shrink-0 text-white opacity-95"
                            aria-hidden
                          />
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
                {records.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400 rounded-lg border border-dashed border-light-border px-3 py-6 text-center dark:border-slate-600">
                    No letters yet.
                  </p>
                ) : null}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
