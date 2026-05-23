import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CommonModal,
  InputField,
  CommonDropdown,
  Button,
} from "../../../components/ui/CommanUI";
import { cashVouchersApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";
import {
  emptyMeta,
  usePurchaseFormMeta,
} from "../../../hooks/usePurchaseFormMeta";
import {
  buildAccountPartyOptions,
  CASH_LEDGER_OPTION,
  partyLabelFromOptions,
  partyValueFromLabel,
} from "./cashBankPartyOptions";
import { buildUploadUrl } from "../../../utils/uploadUrl";

const ACCEPTED_PROOF_TYPES =
  ".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf";
const MAX_PROOF_BYTES = 20 * 1024 * 1024;
const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const ACCEPTED_EXT_RE = /\.(jpe?g|png|webp|pdf)$/i;

function isProofTypeAllowed(file) {
  if (!file) return false;
  if (file.type && ACCEPTED_MIME.has(String(file.type).toLowerCase())) return true;
  return ACCEPTED_EXT_RE.test(String(file.name || ""));
}

const UPLOAD_INPUT_ID = "cash-voucher-attachment";

const emptyForm = () => ({
  voucherNumber: "",
  voucherDate: "",
  debitFrom: CASH_LEDGER_OPTION.value,
  creditTo: "",
  amount: "",
  narration: "",
});

const CashTransferModal = ({ open, onClose, voucher = null, readOnly = false }) => {
  const queryClient = useQueryClient();
  const { data: meta, isError: metaError } = usePurchaseFormMeta({
    enabled: open,
  });
  const creditPartyOptions = useMemo(
    () =>
      buildAccountPartyOptions(
        meta?.parties?.length ? meta.parties : emptyMeta.parties
      ),
    [meta]
  );

  const [form, setForm] = useState(emptyForm);
  const [proofFile, setProofFile] = useState(null);
  const [proofObjectUrl, setProofObjectUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (metaError) {
      toast.error("Could not load accounts. Check API and try again.");
    }
  }, [metaError]);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm());
      setProofFile(null);
      setSaving(false);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (readOnly && voucher) {
      setProofFile(null);
      setSaving(false);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setForm({
      ...emptyForm(),
      voucherNumber: `CV-${Date.now()}`,
      voucherDate: dayjs().format("YYYY-MM-DD"),
    });
    setProofFile(null);
    setSaving(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, readOnly, voucher?._id]);

  useEffect(() => {
    if (!open || !readOnly || !voucher) return;
    setForm({
      voucherNumber: String(voucher.voucherNumber || ""),
      voucherDate: voucher.voucherDate
        ? dayjs(voucher.voucherDate).format("YYYY-MM-DD")
        : voucher.createdAt
          ? dayjs(voucher.createdAt).format("YYYY-MM-DD")
          : "",
      debitFrom: CASH_LEDGER_OPTION.value,
      creditTo: partyValueFromLabel(creditPartyOptions, voucher.creditTo),
      amount:
        voucher.amount != null && voucher.amount !== ""
          ? String(voucher.amount)
          : "",
      narration: String(voucher.narration || voucher.particulars || ""),
    });
  }, [open, readOnly, voucher, creditPartyOptions]);

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
      toast.error("Attachment must be 20 MB or smaller.");
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
    if (!String(form.voucherDate || "").trim()) return "Pick a voucher date.";
    const debit = CASH_LEDGER_OPTION.label;
    const credit = partyLabelFromOptions(creditPartyOptions, form.creditTo);
    if (!credit) return "Select credit to (bank / account).";
    if (debit.toLowerCase() === credit.toLowerCase()) {
      return "Debit from and credit to must be different.";
    }
    const n = Number(form.amount);
    if (!Number.isFinite(n) || n <= 0) return "Enter a valid amount.";
    const narr = String(form.narration || "").trim();
    if (!narr) return "Add a narration or remark.";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const debitName = CASH_LEDGER_OPTION.label;
    const creditName = partyLabelFromOptions(creditPartyOptions, form.creditTo);
    const narr = String(form.narration || "").trim();
    const body = new FormData();
    body.append("voucherNumber", String(form.voucherNumber ?? "").trim());
    body.append("voucherDate", String(form.voucherDate || "").trim());
    body.append("amount", String(Number(form.amount)));
    body.append("debitFrom", debitName);
    body.append("creditTo", creditName);
    body.append("narration", narr);
    body.append("particulars", narr);
    if (proofFile) body.append("attachmentsFile", proofFile);

    try {
      setSaving(true);
      await cashVouchersApi.create(body);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["voucher-list", "cash"] }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
      ]);
      toast.success("Cash voucher saved.");
      onClose();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not save cash voucher"));
    } finally {
      setSaving(false);
    }
  };

  const existingProofUrl =
    readOnly && voucher?.attachmentsFile
      ? buildUploadUrl(voucher.attachmentsFile)
      : "";

  const footer = readOnly ? (
    <Button label="Close" variant="outline" className="w-28" onClick={onClose} />
  ) : (
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
        className="w-28"
        onClick={handleSave}
        disabled={saving}
      />
    </>
  );

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={readOnly ? "View Cash Voucher" : "Cash to Bank Transfer"}
      width="780px"
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            label="Voucher Number"
            value={form.voucherNumber}
            onChange={(e) => updateField("voucherNumber", e.target.value)}
            placeholder="e.g. CV-001 (leave blank to auto-generate on save)"
            readOnly={readOnly}
            disabled={readOnly}
          />
          <InputField
            label="Date"
            type="date"
            value={form.voucherDate}
            onChange={(e) => updateField("voucherDate", e.target.value)}
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InputField
            label="Debit From"
            value={CASH_LEDGER_OPTION.label}
            disabled
            readOnly
          />
          <CommonDropdown
            label="Credit To (Bank / Account)"
            searchable
            searchPlaceholder="Search account…"
            addNavigateTo="/dashboard/account"
            options={creditPartyOptions}
            value={form.creditTo}
            onChange={(value) => updateField("creditTo", value)}
            placeholder={
              creditPartyOptions.length
                ? "Select bank or account"
                : "Add accounts in Account Master"
            }
            menuPortal
            disabled={readOnly}
          />
          <InputField
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            placeholder="Amount"
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>

        <InputField
          label="Narration / Remark"
          multiline
          rows={3}
          value={form.narration}
          onChange={(e) => updateField("narration", e.target.value)}
          placeholder="Textarea"
          readOnly={readOnly}
          disabled={readOnly}
        />

        {readOnly ? (
          existingProofUrl ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-dark">Attachment</span>
              <a
                href={existingProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary underline-offset-2 hover:underline dark:text-emerald-400"
              >
                View attachment
              </a>
            </div>
          ) : null
        ) : (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-dark">Attachment (optional)</span>
          <label
            htmlFor={UPLOAD_INPUT_ID}
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
              id={UPLOAD_INPUT_ID}
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
                  Selected: <span className="font-medium">{proofFile.name}</span>
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
            ) : (
              <p className="text-xs text-light">Choose a file or drag &amp; drop it here.</p>
            )}
            <p className="text-[11px] text-light">
              JPG, JPEG, PNG, WEBP and PDF, Max 20 MB.
            </p>
          </label>
        </div>
        )}
      </div>
    </CommonModal>
  );
};

export default CashTransferModal;
