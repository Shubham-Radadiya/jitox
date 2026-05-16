import React, { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  Button,
  CommonDropdown,
  CommonModal,
  InputField,
} from "../../../components/ui/CommanUI";
import { manufacturingVouchersApi, usersApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";

const FAILURE_REASON_OPTIONS = [
  { value: "Machine Breakdown", label: "Machine Breakdown" },
  { value: "Quality Issue", label: "Quality Issue" },
  { value: "Raw Material Shortage", label: "Raw Material Shortage" },
  { value: "Power Failure", label: "Power Failure" },
  { value: "Operator Error", label: "Operator Error" },
  { value: "Other", label: "Other" },
];

const ACCEPT_FILES = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";
const MAX_BYTES = 20 * 1024 * 1024;

const READONLY_INPUT_CLASS =
  "bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200 hover:bg-slate-100 focus:bg-slate-100 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-800/80 dark:focus:bg-slate-800/80";

function rowToContext(row) {
  const raw = row?._raw || {};
  const finished =
    raw.finishedProduct && typeof raw.finishedProduct === "object"
      ? raw.finishedProduct
      : null;
  const qty = Number(raw.quantityToProduce);
  const unit = String(raw.produceUnit || "").trim();
  return {
    productName:
      row?.["Product Name"] || finished?.productName || "—",
    batchId: row?.["Batch ID"] || raw.batchCode || raw.voucherNo || "—",
    attemptedQty:
      row?.["Qty Made"] ||
      (Number.isFinite(qty) && qty > 0
        ? unit
          ? `${qty} ${unit}`
          : String(qty)
        : "—"),
    dateTime: dayjs().format("DD MMM YYYY, h:mm A"),
  };
}

export default function ManufacturingFailedModal({
  open,
  onClose,
  row,
  onSaved,
}) {
  const fileRef = useRef(null);
  const ctx = useMemo(() => rowToContext(row), [row]);
  const [supervisorName, setSupervisorName] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [supervisorOptions, setSupervisorOptions] = useState([]);

  useEffect(() => {
    if (!open) return;
    setFailureReason("");
    setRemarks("");
    setAttachment(null);
    setSupervisorName("");
    if (fileRef.current) fileRef.current.value = "";
  }, [open, row?._id]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await usersApi.getAll();
        const list = Array.isArray(data) ? data : [];
        if (cancelled) return;
        const opts = list
          .map((u) => {
            const name = String(u?.name || u?.userName || "").trim();
            if (!name) return null;
            return { value: name, label: name };
          })
          .filter(Boolean);
        setSupervisorOptions(opts);
      } catch {
        if (!cancelled) setSupervisorOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAttachment(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File must be 20 MB or smaller.");
      e.target.value = "";
      setAttachment(null);
      return;
    }
    setAttachment(file);
  };

  const handleSubmit = async () => {
    const id = String(row?._raw?._id ?? row?._id ?? "").trim();
    if (!id) {
      toast.error("Batch id missing.");
      return;
    }
    if (!String(failureReason).trim()) {
      toast.error("Select a failure reason.");
      return;
    }
    setSaving(true);
    try {
      const reason = String(failureReason).trim();
      const payload = { failureReason: reason };
      if (remarks.trim()) payload.failureRemarks = remarks.trim();
      if (supervisorName.trim()) payload.supervisorName = supervisorName.trim();

      if (attachment) {
        const fd = new FormData();
        Object.entries(payload).forEach(([key, val]) => fd.append(key, val));
        fd.append("failureAttachment", attachment);
        await manufacturingVouchersApi.fail(id, fd);
      } else {
        await manufacturingVouchersApi.fail(id, payload);
      }
      toast.success("Batch marked as failed.");
      onSaved?.();
      onClose?.();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not mark batch as failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title="Manufacturing Failed"
      size="lg"
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Button label="Cancel" variant="outline" size="sm" onClick={onClose} />
          <Button
            label={saving ? "Saving…" : "Save & Mark Failed"}
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={saving}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-sm">
        <InputField
          label="Product Name"
          value={ctx.productName}
          readOnly
          inputClassName={READONLY_INPUT_CLASS}
        />

        <div className="rounded-lg border border-light-border bg-slate-50/50 p-3 dark:border-slate-600 dark:bg-slate-800/30">
          <div className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Auto Filled
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InputField
              label="Batch ID"
              value={ctx.batchId}
              readOnly
              inputClassName={READONLY_INPUT_CLASS}
            />
            <InputField
              label="Date & Time"
              value={ctx.dateTime}
              readOnly
              inputClassName={READONLY_INPUT_CLASS}
            />
          </div>
        </div>

        <CommonDropdown
          label="Supervisor Name (optional)"
          options={supervisorOptions}
          value={supervisorName}
          onChange={setSupervisorName}
          placeholder="Select supervisor (optional)"
          searchable
          hideAdd
        />

        <CommonDropdown
          label="Select Failure Reason"
          options={FAILURE_REASON_OPTIONS}
          value={failureReason}
          onChange={setFailureReason}
          placeholder="Dropdown (Mandatory)"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Additional Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Notes......"
            rows={3}
            className="w-full rounded-lg border border-light-border px-3 py-2 text-sm text-dark resize-none focus:ring-1 focus:ring-primary focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Attachment
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-light-border bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Button
                label="Select File"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[12rem]">
                {attachment?.name || "No file chosen"}
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              File supported: JPG, PDF, PNG
            </span>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT_FILES}
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        </div>
      </div>
    </CommonModal>
  );
}
