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
import { paymentVouchersApi } from "../../../services/api";
import { getApiErrorMessage } from "../../../utils/apiError";

/** Backend enums (paymentVoucher.model.ts) — keep value casing identical to schema. */
const PAYMENT_THROUGH_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "Bank", label: "Bank" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "Paid", label: "Paid" },
];

const emptyForm = () => ({
  date: dayjs().format("YYYY-MM-DD"),
  paymentThrough: "Cash",
  paymentTo: "",
  amount: "",
  remarks: "",
  status: "Pending",
});

const PaymentModal = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  /** Parties + auto voucher no. — refetched on every modal open so the number stays current. */
  const { data: metaRes, isLoading: metaLoading, isError: metaError } = useQuery({
    queryKey: ["payment-voucher-form-meta"],
    queryFn: async () => {
      const { data } = await paymentVouchersApi.getFormMeta();
      return data;
    },
    enabled: open,
    staleTime: 0,
  });

  useEffect(() => {
    if (!open) {
      setForm(emptyForm());
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    if (metaError) {
      toast.error("Could not load parties or voucher number. Please retry.");
    }
  }, [metaError]);

  const nextVoucherNo = useMemo(() => {
    const v = String(metaRes?.nextPaymentVoucherNo ?? "").trim();
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
    if (!form.paymentTo.trim()) return "Select whom you're paying.";
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
      paymentThrough: form.paymentThrough || "Cash",
      paymentTo: form.paymentTo.trim(),
      amount: String(form.amount).trim(),
      remarks: form.remarks.trim(),
      status: form.status || "Pending",
    };
    try {
      setSaving(true);
      const res = await paymentVouchersApi.create(body);
      const savedNo =
        res?.data?.voucher?.voucherNo ||
        res?.data?.voucher?.voucherNumber ||
        nextVoucherNo;
      await queryClient.invalidateQueries({
        queryKey: ["voucher-list", "payment"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["payment-voucher-form-meta"],
      });
      toast.success(`Payment voucher ${savedNo} saved.`);
      onClose();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not save payment voucher"));
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
      title="Add Payment"
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
            label="Payment Through"
            options={PAYMENT_THROUGH_OPTIONS}
            value={form.paymentThrough}
            onChange={(value) => updateField("paymentThrough", value)}
            placeholder="Cash or Bank"
            hideAdd
          />
          <CommonDropdown
            label="Payment To"
            options={partyOptions}
            value={form.paymentTo}
            onChange={(value) => updateField("paymentTo", value)}
            placeholder={
              metaLoading ? "Loading parties…" : "Select party"
            }
            searchable
            searchPlaceholder="Search party…"
            addNavigateTo="/dashboard/account"
          />
          <InputField
            label="Amount (₹)"
            type="number"
            name="amount"
            value={form.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            placeholder="Amount paid"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CommonDropdown
            label="Status"
            options={PAYMENT_STATUS_OPTIONS}
            value={form.status}
            onChange={(v) => updateField("status", v)}
            placeholder="Pending"
            hideAdd
          />
          <InputField
            label="Remarks"
            name="remarks"
            value={form.remarks}
            onChange={(e) => updateField("remarks", e.target.value)}
            placeholder="Reason for payment (optional)"
          />
        </div>
      </div>
    </CommonModal>
  );
};

export default PaymentModal;
