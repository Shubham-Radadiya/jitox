import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  CommonDropdown,
  CommonModal,
  InputField,
} from "../../../components/ui/CommanUI";
import { receiptVouchersApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";

const RECEIPT_THROUGH_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "Bank", label: "Bank" },
];

const RECEIPT_STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "Paid", label: "Received" },
];

const emptyForm = () => ({
  date: dayjs().format("YYYY-MM-DD"),
  receiptThrough: "Cash",
  receiptFrom: "",
  amount: "",
  remarks: "",
  status: "Paid",
});

const ReceiptModal = ({ open, onClose, sourceSalesId, prefilled }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: metaRes, isLoading: metaLoading, isError: metaError } = useQuery({
    queryKey: ["receipt-voucher-form-meta"],
    queryFn: async () => {
      const { data } = await receiptVouchersApi.getFormMeta();
      return data;
    },
    enabled: open,
    staleTime: 0,
  });

  useEffect(() => {
    if (!open) {
      setForm(emptyForm());
      setSaving(false);
      return;
    }
    if (prefilled) {
      setForm((prev) => ({
        ...prev,
        ...prefilled,
      }));
    }
  }, [open, prefilled]);

  useEffect(() => {
    if (metaError) {
      toast.error("Could not load parties or voucher number. Please retry.");
    }
  }, [metaError]);

  const nextVoucherNo = useMemo(() => {
    const v = String(metaRes?.nextReceiptVoucherNo ?? "").trim();
    return v || "Auto";
  }, [metaRes]);

  const partyOptions = useMemo(() => {
    const list = Array.isArray(metaRes?.parties) ? metaRes.parties : [];
    return list
      .filter((p) => p && String(p.value ?? "").trim())
      .map((p) => ({
        value: String(p.value),
        label: String(p.label ?? p.value),
      }));
  }, [metaRes]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.date) return "Pick a date.";
    if (!form.receiptFrom.trim()) return "Select who paid you.";
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

    const body = {
      date: form.date,
      receiptThrough: form.receiptThrough || "Cash",
      receiptFrom: form.receiptFrom.trim(),
      amount: String(form.amount).trim(),
      remarks: form.remarks.trim(),
      status: form.status || "Paid",
    };

    if (sourceSalesId) {
      body.sourceSalesId = sourceSalesId;
    }

    try {
      setSaving(true);
      const res = await receiptVouchersApi.create(body);
      const savedNo =
        res?.data?.data?.voucherNo ||
        res?.data?.voucherNo ||
        nextVoucherNo;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["voucher-list", "receipt"] }),
        queryClient.invalidateQueries({ queryKey: ["receiptVouchers"] }),
        queryClient.invalidateQueries({ queryKey: ["receipt-voucher-form-meta"] }),
        body.status === "Paid"
          ? queryClient.invalidateQueries({ queryKey: ["accounts"] })
          : Promise.resolve(),
        sourceSalesId
          ? queryClient.invalidateQueries({ queryKey: ["voucher-list", "sales"] })
          : Promise.resolve(),
      ]);

      toast.success(`Receipt voucher ${savedNo} saved.`);
      onClose();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not save receipt voucher"));
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
      title="Add Receipt"
      width="720px"
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Voucher Number"
            value={metaLoading ? "Generating…" : nextVoucherNo}
            disabled
            placeholder="Auto"
          />
          <InputField
            label="Date"
            type="date"
            name="date"
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CommonDropdown
            label="Receipt Through"
            options={RECEIPT_THROUGH_OPTIONS}
            value={form.receiptThrough}
            onChange={(value) => updateField("receiptThrough", value)}
            placeholder="Cash or Bank"
            hideAdd
            menuPortal
          />
          <CommonDropdown
            label="Receipt From"
            options={partyOptions}
            value={form.receiptFrom}
            onChange={(value) => updateField("receiptFrom", value)}
            placeholder={metaLoading ? "Loading parties…" : "Select party"}
            searchable
            searchPlaceholder="Search party…"
            addNavigateTo="/dashboard/account"
            menuPortal
          />
          <InputField
            label="Amount (₹)"
            type="number"
            name="amount"
            value={form.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            placeholder="Amount received"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CommonDropdown
            label="Status"
            options={RECEIPT_STATUS_OPTIONS}
            value={form.status}
            onChange={(v) => updateField("status", v)}
            placeholder="Received"
            hideAdd
            menuPortal
          />
          <InputField
            label="Narration / Remark"
            name="remarks"
            value={form.remarks}
            onChange={(e) => updateField("remarks", e.target.value)}
            placeholder="Against invoice, advance, etc. (optional)"
          />
        </div>
      </div>
    </CommonModal>
  );
};

export default ReceiptModal;
