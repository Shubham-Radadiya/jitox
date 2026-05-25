import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Upload } from "lucide-react";
import {
  Button,
  CommonDropdown,
  CommonModal,
  InputField,
} from "../../../components/ui/CommanUI";
import { salesReturnVouchersApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";

const REJECT_REASON_OPTIONS = [
  { value: "Damaged By Customer", label: "Damaged By Customer" },
  { value: "Not Eligible", label: "Not Eligible" },
  { value: "Time Expired", label: "Time Expired" },
];

const ACCEPTED_PROOF_TYPES =
  "image/jpeg,image/jpg,image/png,image/webp,application/pdf";

const emptyForm = () => ({
  rejectReason: "",
  rejectNotes: "",
});

export default function SalesReturnRejectModal({
  open,
  onClose,
  sourceRow,
  onRejected,
}) {
  const [form, setForm] = useState(emptyForm);
  const [proofFile, setProofFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const returnId = String(sourceRow?._id || "").trim();
  const voucherNo =
    String(sourceRow?.["Return No"] || sourceRow?.voucherNo || "").trim() ||
    "Sales return";

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm());
    setProofFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, returnId]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleProofPick = (e) => {
    const file = e.target.files?.[0];
    setProofFile(file || null);
  };

  const handleSubmit = async () => {
    if (!returnId) {
      toast.error("Missing return id.");
      return;
    }
    const rejectReason = String(form.rejectReason || "").trim();
    if (!rejectReason) {
      toast.error("Select a reject reason.");
      return;
    }

    const fd = new FormData();
    fd.append("rejectReason", rejectReason);
    fd.append("rejectNotes", String(form.rejectNotes || "").trim());
    if (proofFile) fd.append("rejectProof", proofFile);

    setSaving(true);
    try {
      await salesReturnVouchersApi.reject(returnId, fd);
      toast.success(`${voucherNo} rejected.`);
      onRejected?.();
      onClose();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not reject sales return"));
    } finally {
      setSaving(false);
    }
  };

  const footer = (
  <>
      <Button
        label="Cancel"
        variant="outline"
        className="min-w-26"
        onClick={onClose}
        disabled={saving}
      />
      <Button
        label={saving ? "Rejecting…" : "Reject Return"}
        variant="primary"
        className="min-w-34 text-white"
        onClick={handleSubmit}
        disabled={saving}
      />
    </>
  );

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title="Reject Request"
      size="md"
      footer={footer}
      footerClassName="justify-end gap-3"
    >
      <div className="flex flex-col gap-5">
        <CommonDropdown
          label="Reject Reason"
          options={REJECT_REASON_OPTIONS}
          value={form.rejectReason}
          onChange={(value) => updateField("rejectReason", value)}
          placeholder="Damaged By Customer, Not Eligible, Time Expired"
          hideAdd
          menuPortal
        />

        <InputField
          label="Custom Notes"
          name="rejectNotes"
          multiline
          rows={4}
          value={form.rejectNotes}
          onChange={(e) => updateField("rejectNotes", e.target.value)}
          placeholder="Add Explanation For Rejection"
        />

        <div className="flex flex-col gap-2">
          <span className="text-left text-[12px] font-semibold tracking-wide text-slate-800 dark:text-slate-200">
            Attach Proof (Optional)
          </span>
          <label
            htmlFor="sales-return-reject-proof"
            className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center dark:border-slate-600 dark:bg-slate-900/50"
          >
            <input
              ref={fileInputRef}
              id="sales-return-reject-proof"
              type="file"
              accept={ACCEPTED_PROOF_TYPES}
              onChange={handleProofPick}
              className="sr-only"
            />
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
              <Upload size={16} />
              {proofFile ? "Change file" : "Upload"}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {proofFile ? proofFile.name : "Choose File"}
            </span>
          </label>
        </div>
      </div>
    </CommonModal>
  );
}
