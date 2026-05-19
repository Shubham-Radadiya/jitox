import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  CommonDropdown,
  CommonModal,
  InputField,
} from "../../../components/ui/CommanUI";
import {
  emptyMeta,
  usePurchaseFormMeta,
} from "../../../hooks/usePurchaseFormMeta";
import { expenseVouchersApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";
import { buildUploadUrl } from "../../../utils/uploadUrl";

const DEFAULT_EXPENSE_TYPE_OPTIONS = [
  { value: "Fuel", label: "Fuel" },
  { value: "Travel", label: "Travel" },
  { value: "Supplies", label: "Supplies" },
  { value: "Rent", label: "Rent" },
  { value: "Electricity", label: "Electricity" },
  { value: "Salaries", label: "Salaries" },
  { value: "Other", label: "Other" },
];

const PAYMENT_MODE_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "NEFT", label: "NEFT" },
  { value: "Card", label: "Card" },
  { value: "Cheque", label: "Cheque" },
];

/** Backend (multer) restricts upload to image / pdf proofs < 20 MB; keep client check in sync.
 *  Includes extensions so Windows file picker filters properly (mime-only filters can fall back to "All Files"). */
const ACCEPTED_PROOF_TYPES =
  ".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf";
const MAX_PROOF_BYTES = 20 * 1024 * 1024;

const emptyForm = () => ({
  startDate: dayjs().format("YYYY-MM-DD"),
  expenseType: "",
  description: "",
  paidTo: "",
  paymentMode: "Cash",
  amount: "",
});

/** Convert a saved ExpenseVoucher mongo doc to the modal's form shape. */
const formFromExpense = (expense) => {
  if (!expense) return emptyForm();
  return {
    startDate: expense.startDate
      ? dayjs(expense.startDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD"),
    expenseType: expense.expenseType || "",
    description: expense.description || "",
    paidTo: expense.paidTo || "",
    paymentMode: expense.paymentMode || "Cash",
    amount: expense.amount != null ? String(expense.amount) : "",
  };
};

/** Mime types matched by the human-readable hint "JPG, JPEG, PNG, WEBP, PDF — Max 20 MB". */
const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
/** Fallback when the OS doesn't pass a mime (some Windows builds) — sniff the extension instead. */
const ACCEPTED_EXT_RE = /\.(jpe?g|png|webp|pdf)$/i;

function isProofTypeAllowed(file) {
  if (!file) return false;
  if (file.type && ACCEPTED_MIME.has(String(file.type).toLowerCase())) return true;
  return ACCEPTED_EXT_RE.test(String(file.name || ""));
}

const ExpenseModal = ({ open, onClose, expense = null }) => {
  const queryClient = useQueryClient();
  const { data: meta } = usePurchaseFormMeta();
  const [expenseTypeOptions, setExpenseTypeOptions] = useState(
    DEFAULT_EXPENSE_TYPE_OPTIONS
  );

  useEffect(() => {
    if (!open) return;
    expenseVouchersApi
      .getExpenseTypes()
      .then(({ data }) => {
        const types = data?.types || [];
        if (types.length) {
          setExpenseTypeOptions(
            types.map((t) => ({ value: t, label: t }))
          );
        }
      })
      .catch(() => setExpenseTypeOptions(DEFAULT_EXPENSE_TYPE_OPTIONS));
  }, [open]);
  const partyOptions = useMemo(() => {
    if (!meta?.parties?.length) return emptyMeta.parties;
    return meta.parties;
  }, [meta]);

  const isEditMode = Boolean(expense?._id);
  /** Resolved URL of the proof already attached to this expense, if any.
   *  Shown as a "Current proof" link when no replacement file is staged. */
  const existingProofUrl = isEditMode ? buildUploadUrl(expense?.uploadProof) : "";

  const [form, setForm] = useState(emptyForm);
  const [proofFile, setProofFile] = useState(null);
  // Object URL for the staged file so the download icon link works for both
  // images and PDFs. Created on each file change and revoked to avoid leaks.
  const [proofObjectUrl, setProofObjectUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  /** When the modal opens: prefill from `expense` (edit) or reset (create).
   *  When it closes: clear everything so reopening starts fresh. */
  useEffect(() => {
    if (open) {
      setForm(formFromExpense(expense));
      setProofFile(null);
      setSaving(false);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setForm(emptyForm());
    setProofFile(null);
    setSaving(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, expense]);

  /** Create a temporary blob URL whenever a new file is staged, so the
   *  download icon link can serve it back to the user. Revoke on cleanup
   *  to avoid leaking object URLs. */
  useEffect(() => {
    if (!proofFile) {
      setProofObjectUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(proofFile);
    setProofObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /** Single source of truth for accepting / rejecting a picked file (used by browse + drop). */
  const acceptProofFile = (file) => {
    if (!file) {
      setProofFile(null);
      return;
    }
    if (!isProofTypeAllowed(file)) {
      toast.error("Only JPG, JPEG, PNG, WEBP, or PDF files are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.error("Proof file must be 20 MB or smaller.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setProofFile(file);
  };

  const handleProofPick = (e) => {
    acceptProofFile(e.target.files?.[0] || null);
  };

  const handleProofDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    acceptProofFile(e.dataTransfer?.files?.[0] || null);
  };

  const removeProof = () => {
    setProofFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    if (!form.startDate) return "Pick a date.";
    if (!form.expenseType) return "Pick an expense type.";
    if (!form.description.trim()) return "Add a short description.";
    if (!form.paidTo) return "Select the party paid to.";
    if (!form.paymentMode) return "Pick a payment mode.";
    const n = Number(form.amount);
    if (!Number.isFinite(n) || n <= 0) return "Enter a valid amount.";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const body = new FormData();
    body.append("startDate", form.startDate);
    body.append("expenseType", form.expenseType);
    body.append("description", form.description.trim());
    body.append("paidTo", form.paidTo);
    body.append("paymentMode", form.paymentMode);
    body.append("amount", String(form.amount).trim());
    if (proofFile) body.append("uploadProof", proofFile);

    try {
      setSaving(true);
      if (isEditMode) {
        await expenseVouchersApi.update(String(expense._id), body);
      } else {
        await expenseVouchersApi.create(body);
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["voucher-list", "expenses"],
        }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
      ]);
      toast.success(
        isEditMode ? "Expense voucher updated." : "Expense voucher saved."
      );
      onClose();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not save expense voucher"));
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <Button
        label="Cancel"
        variant="outline"
        className="w-28"
        onClick={onClose}
        disabled={saving}
      />
      <Button
        label={saving ? "Saving…" : "Save"}
        variant="primary"
        className="w-28 text-white dark:text-white"
        onClick={handleSave}
        disabled={saving}
      />
    </>
  );

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={isEditMode ? "Edit Expense" : "Add New Expense"}
      width="800px"
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Start Date"
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
          />
          <CommonDropdown
            label="Expense Type"
            options={expenseTypeOptions}
            value={form.expenseType}
            onChange={(value) => updateField("expenseType", value)}
            placeholder="Fuel, Travel, Supplies…"
            hideAdd
            menuPortal
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Description"
            name="description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="What was the expense for?"
          />
          <CommonDropdown
            label="Paid to (party)"
            options={partyOptions}
            value={form.paidTo}
            onChange={(value) => updateField("paidTo", value)}
            placeholder="Select party"
            searchable
            searchPlaceholder="Search party…"
            addNavigateTo="/dashboard/account"
            menuPortal
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CommonDropdown
            label="Payment Mode"
            options={PAYMENT_MODE_OPTIONS}
            value={form.paymentMode}
            onChange={(value) => updateField("paymentMode", value)}
            placeholder="Cash / UPI / NEFT / Card"
            hideAdd
            menuPortal
          />
          <InputField
            label="Amount (₹)"
            type="number"
            name="amount"
            value={form.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-dark">Upload Proof</span>
          <label
            htmlFor="expense-upload-proof"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isDragging) setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={handleProofDrop}
            className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-4 text-center transition ${
              isDragging
                ? "border-primary bg-primary/5 dark:bg-emerald-950/30"
                : "border-light-border bg-rowBg"
            }`}
          >
            <input
              ref={fileInputRef}
              id="expense-upload-proof"
              type="file"
              accept={ACCEPTED_PROOF_TYPES}
              onChange={handleProofPick}
              className="sr-only"
            />
            <span className="inline-flex h-9 w-32 items-center justify-center rounded-lg border border-light-border bg-white text-sm font-medium text-gray-900 shadow-sm transition hover:bg-primary hover:text-white dark:border-slate-500 dark:bg-slate-800 dark:text-white">
              {proofFile ? "Change file" : "Upload"}
            </span>
            {proofFile ? (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-dark">
                <span className="break-all">
                  Selected:{" "}
                  <span className="font-medium">{proofFile.name}</span>
                </span>
                {proofObjectUrl ? (
                  <a
                    href={proofObjectUrl}
                    download={proofFile.name}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-light-border bg-white text-primary transition hover:bg-primary hover:text-white dark:border-slate-600 dark:bg-slate-800 dark:text-emerald-400 dark:hover:text-white"
                    aria-label="Download selected file"
                    title="Download"
                  >
                    <Download size={14} />
                  </a>
                ) : null}
                <button
                  type="button"
                  className="text-primary underline-offset-2 hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeProof();
                  }}
                >
                  Remove
                </button>
              </div>
            ) : existingProofUrl ? (
              <p className="text-xs text-light">
                Current proof:{" "}
                <a
                  href={existingProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-primary underline-offset-2 hover:underline dark:text-emerald-400"
                >
                  View
                </a>
                . Upload a new file to replace it.
              </p>
            ) : (
              <p className="text-xs text-light">
                Choose a file or drag &amp; drop it here.
              </p>
            )}
            <p className="text-[11px] text-light">
              JPG, JPEG, PNG, WEBP and PDF, Max 20 MB.
            </p>
          </label>
        </div>
      </div>
    </CommonModal>
  );
};

export default ExpenseModal;
