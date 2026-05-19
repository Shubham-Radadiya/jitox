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
import { usePurchaseFormMeta } from "../../../hooks/usePurchaseFormMeta";

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
  voucherNo: "",
  sourcePurchaseId: "",
  sourceSalesId: "",
});

/** Prefill from purchase/sales row — Payment To is always left for manual pick. */
function draftToForm(draft) {
  if (!draft) return emptyForm();
  const through = String(draft.paymentThrough || "Cash").trim();
  const paymentThrough =
    through.toLowerCase() === "bank" ? "Bank" : "Cash";
  return {
    ...emptyForm(),
    date: draft.date
      ? dayjs(draft.date).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD"),
    paymentThrough,
    paymentTo: "",
    amount:
      draft.amount != null && draft.amount !== ""
        ? String(draft.amount).replace(/,/g, "")
        : "",
    remarks: String(draft.remarks || ""),
    status: String(draft.status || "Pending") === "Paid" ? "Paid" : "Pending",
    sourcePurchaseId: String(draft.sourcePurchaseId || "").trim(),
    sourceSalesId: String(draft.sourceSalesId || "").trim(),
  };
}

function paymentToForm(payment) {
  if (!payment?._id) return emptyForm();
  const through = String(payment.paymentThrough || "Cash").trim();
  const paymentThrough =
    through.toLowerCase() === "bank" ? "Bank" : "Cash";
  return {
    date: payment.date
      ? dayjs(payment.date).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD"),
    paymentThrough,
    paymentTo: String(payment.paymentTo || "").trim(),
    amount:
      payment.amount != null && payment.amount !== ""
        ? String(payment.amount).replace(/,/g, "")
        : "",
    remarks: String(payment.remarks || ""),
    status: String(payment.status || "Pending") === "Paid" ? "Paid" : "Pending",
    voucherNo: String(payment.voucherNo || "").trim(),
    sourcePurchaseId: "",
    sourceSalesId: "",
  };
}

const PaymentModal = ({ open, onClose, payment = null, draft = null }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(payment?._id);

  /** Same party list as purchase / sales vouchers (Account Master). */
  const {
    data: purchaseMeta,
    isLoading: partiesLoading,
    isError: partiesError,
  } = usePurchaseFormMeta({ enabled: open });

  /** Next voucher no. only when creating. */
  const { data: paymentMetaRes, isLoading: voucherNoLoading } = useQuery({
    queryKey: ["payment-voucher-form-meta"],
    queryFn: async () => {
      const { data } = await paymentVouchersApi.getFormMeta();
      return data;
    },
    enabled: open && !isEdit,
    staleTime: 0,
  });

  useEffect(() => {
    if (open) {
      if (payment?._id) {
        setForm(paymentToForm(payment));
      } else if (draft) {
        setForm(draftToForm(draft));
      } else {
        setForm(emptyForm());
      }
      setSaving(false);
      return;
    }
    setForm(emptyForm());
    setSaving(false);
  }, [open, payment, draft]);

  useEffect(() => {
    if (partiesError) {
      toast.error(
        "Could not load party list. Check Account Master or refresh."
      );
    }
  }, [partiesError]);

  const nextVoucherNo = useMemo(() => {
    if (isEdit) return form.voucherNo || "—";
    const v = String(paymentMetaRes?.nextPaymentVoucherNo ?? "").trim();
    return v || "Auto";
  }, [paymentMetaRes, isEdit, form.voucherNo]);

  const partyOptions = useMemo(() => {
    const list = Array.isArray(purchaseMeta?.parties) ? purchaseMeta.parties : [];
    const byValue = new Map();
    for (const p of list) {
      if (!p || !String(p.value ?? "").trim()) continue;
      const value = String(p.value).trim();
      byValue.set(value, {
        value,
        label: String(p.label ?? value).trim() || value,
      });
    }
    const current = String(
      form.paymentTo || payment?.paymentTo || ""
    ).trim();
    if (current && !byValue.has(current)) {
      byValue.set(current, { value: current, label: current });
    }
    return Array.from(byValue.values());
  }, [purchaseMeta, form.paymentTo, payment]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.date) return "Pick a date.";
    if (!form.paymentTo.trim()) return "Please select Payment To.";
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
    if (form.sourcePurchaseId) {
      body.sourcePurchaseId = form.sourcePurchaseId;
    }
    if (form.sourceSalesId) {
      body.sourceSalesId = form.sourceSalesId;
    }
    try {
      setSaving(true);
      if (isEdit) {
        await paymentVouchersApi.update(String(payment._id), body);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["voucher-list", "payment"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["voucher-list", "purchase"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["voucher-list", "sales"],
          }),
          queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        ]);
        toast.success(
          form.voucherNo
            ? `Payment voucher ${form.voucherNo} updated.`
            : "Payment voucher updated."
        );
      } else {
        const res = await paymentVouchersApi.create(body);
        const savedNo =
          res?.data?.voucher?.voucherNo ||
          res?.data?.voucher?.voucherNumber ||
          nextVoucherNo;
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["voucher-list", "payment"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["payment-voucher-form-meta"],
          }),
          ...(body.sourcePurchaseId
            ? [
                queryClient.invalidateQueries({
                  queryKey: ["voucher-list", "purchase"],
                }),
              ]
            : []),
          ...(body.sourceSalesId
            ? [
                queryClient.invalidateQueries({
                  queryKey: ["voucher-list", "sales"],
                }),
              ]
            : []),
        ]);
        if (body.status === "Paid") {
          await queryClient.invalidateQueries({ queryKey: ["accounts"] });
        }
        toast.success(`Payment voucher ${savedNo} saved.`);
      }
      onClose();
    } catch (e) {
      toast.error(
        getApiErrorMessage(
          e,
          isEdit ? "Could not update payment voucher" : "Could not save payment voucher"
        )
      );
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
        label={saving ? "Saving…" : isEdit ? "Update" : "Save"}
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
      title={isEdit ? "Edit Payment" : "Add Payment"}
      width="720px"
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Voucher Number"
            value={
              !isEdit && voucherNoLoading ? "Generating…" : nextVoucherNo
            }
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
            menuPortal
          />
          <CommonDropdown
            label="Payment To"
            options={partyOptions}
            value={form.paymentTo}
            onChange={(value) => updateField("paymentTo", value)}
            placeholder={
              partiesLoading
                ? "Loading parties…"
                : partyOptions.length
                  ? "Select party"
                  : "No parties — add in Account Master"
            }
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
            menuPortal
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
