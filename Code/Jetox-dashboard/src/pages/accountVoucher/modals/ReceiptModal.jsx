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
import { usePurchaseFormMeta } from "../../../hooks/usePurchaseFormMeta";

const RECEIPT_STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "Paid", label: "Received" },
];

const emptyForm = () => ({
  date: dayjs().format("YYYY-MM-DD"),
  receivedIn: "",
  receiptFrom: "",
  amount: "",
  remarks: "",
  status: "Paid",
  voucherNo: "",
});

function receiptToForm(receipt) {
  if (!receipt?._id) return emptyForm();
  return {
    date: receipt.date
      ? dayjs(receipt.date).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD"),
    receivedIn: String(receipt.receivedIn || "").trim(),
    receiptFrom: String(receipt.receiptFrom || "").trim(),
    amount:
      receipt.amount != null && receipt.amount !== ""
        ? String(receipt.amount).replace(/,/g, "")
        : "",
    remarks: String(receipt.remarks || ""),
    status: String(receipt.status || "Pending") === "Paid" ? "Paid" : "Pending",
    voucherNo: String(receipt.voucherNo || "").trim(),
  };
}

const ReceiptModal = ({
  open,
  onClose,
  sourceSalesId,
  prefilled,
  draft = null,
  receipt = null,
}) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(receipt?._id);
  const linkedSalesId = String(
    draft?.sourceSalesId ||
      sourceSalesId ||
      receipt?.sourceSalesId ||
      ""
  ).trim();
  const linkedPurchaseReturnId = String(
    draft?.sourcePurchaseReturnId || receipt?.sourcePurchaseReturnId || ""
  ).trim();
  const linkedQuotationId = String(
    draft?.sourceQuotationId || receipt?.sourceQuotationId || ""
  ).trim();

  const {
    data: purchaseMeta,
    isLoading: partiesLoading,
    isError: partiesError,
  } = usePurchaseFormMeta({ enabled: open });

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
    if (receipt?._id) {
      setForm(receiptToForm(receipt));
      setSaving(false);
      return;
    }
    if (draft) {
      setForm({
        ...emptyForm(),
        date: draft.date
          ? dayjs(draft.date).format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD"),
        receivedIn: String(draft.receivedIn || "").trim(),
        receiptFrom: String(draft.receiptFrom || "").trim(),
        amount:
          draft.amount != null && draft.amount !== ""
            ? String(draft.amount).replace(/,/g, "")
            : "",
        remarks: String(draft.remarks || ""),
        status:
          String(draft.status || "Pending") === "Paid" ? "Paid" : "Pending",
      });
      setSaving(false);
      return;
    }
    if (prefilled) {
      setForm((prev) => ({
        ...prev,
        ...prefilled,
        receivedIn: String(prefilled.receivedIn || prev.receivedIn || "").trim(),
        receiptFrom: String(prefilled.receiptFrom || prev.receiptFrom || "").trim(),
      }));
    } else {
      setForm(emptyForm());
    }
    setSaving(false);
  }, [open, prefilled, draft, receipt]);

  useEffect(() => {
    if (metaError) {
      toast.error("Could not load voucher number or bank/cash accounts.");
    }
  }, [metaError]);

  useEffect(() => {
    if (partiesError) {
      toast.error(
        "Could not load party list. Check Account Master or refresh."
      );
    }
  }, [partiesError]);

  const nextVoucherNo = useMemo(() => {
    if (isEdit) return form.voucherNo || "—";
    const v = String(metaRes?.nextReceiptVoucherNo ?? "").trim();
    return v || "Auto";
  }, [metaRes, isEdit, form.voucherNo]);

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
    const current = String(form.receiptFrom || "").trim();
    if (current && !byValue.has(current)) {
      byValue.set(current, { value: current, label: current });
    }
    return Array.from(byValue.values());
  }, [purchaseMeta, form.receiptFrom]);

  const receivedInOptions = useMemo(() => {
    const list = Array.isArray(metaRes?.receivedInAccounts)
      ? metaRes.receivedInAccounts
      : [];
    const byValue = new Map();
    for (const p of list) {
      if (!p || !String(p.value ?? "").trim()) continue;
      const value = String(p.value).trim();
      byValue.set(value, {
        value,
        label: String(p.label ?? value).trim() || value,
      });
    }
    const current = String(form.receivedIn || "").trim();
    if (current && !byValue.has(current)) {
      byValue.set(current, { value: current, label: current });
    }
    return Array.from(byValue.values());
  }, [metaRes, form.receivedIn]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.date) return "Pick a date.";
    if (!form.receiptFrom.trim()) return "Please select Receipt From (party).";
    if (form.status === "Paid" && !form.receivedIn.trim()) {
      return "Please select Received in (bank or cash account).";
    }
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
      receivedIn: form.receivedIn.trim(),
      receiptFrom: form.receiptFrom.trim(),
      amount: String(form.amount).trim(),
      remarks: form.remarks.trim(),
      status: form.status || "Paid",
    };

    if (!isEdit) {
      if (linkedSalesId) {
        body.sourceSalesId = linkedSalesId;
      }
      if (linkedPurchaseReturnId) {
        body.sourcePurchaseReturnId = linkedPurchaseReturnId;
      }
      if (linkedQuotationId) {
        body.sourceQuotationId = linkedQuotationId;
      }
    }

    try {
      setSaving(true);
      let savedNo = nextVoucherNo;
      if (isEdit) {
        await receiptVouchersApi.update(String(receipt._id), body);
        savedNo = form.voucherNo || savedNo;
      } else {
        const res = await receiptVouchersApi.create(body);
        savedNo =
          res?.data?.data?.voucherNo ||
          res?.data?.voucherNo ||
          nextVoucherNo;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["voucher-list", "receipt"] }),
        queryClient.invalidateQueries({ queryKey: ["receiptVouchers"] }),
        queryClient.invalidateQueries({ queryKey: ["receipt-voucher-form-meta"] }),
        body.status === "Paid"
          ? queryClient.invalidateQueries({ queryKey: ["accounts"] })
          : Promise.resolve(),
        linkedSalesId || receipt?.sourceSalesId
          ? Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["voucher-list", "sales"],
              }),
              queryClient.invalidateQueries({
                queryKey: ["dashboard", "orders"],
              }),
            ])
          : Promise.resolve(),
        linkedPurchaseReturnId || receipt?.sourcePurchaseReturnId
          ? queryClient.invalidateQueries({
              queryKey: ["voucher-list", "purchase-return"],
            })
          : Promise.resolve(),
        linkedQuotationId || receipt?.sourceQuotationId
          ? queryClient.invalidateQueries({ queryKey: ["dashboard", "orders"] })
          : Promise.resolve(),
        body.status === "Paid"
          ? queryClient.invalidateQueries({ queryKey: ["account-ledger"] })
          : Promise.resolve(),
      ]);

      toast.success(
        isEdit
          ? `Receipt voucher ${savedNo} updated.`
          : `Receipt voucher ${savedNo} saved.`
      );
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
      title={
        isEdit
          ? "Edit Receipt"
          : linkedPurchaseReturnId
            ? "Refund — Add Receipt"
            : "Add Receipt"
      }
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
            label="Receipt From (party)"
            options={partyOptions}
            value={form.receiptFrom}
            onChange={(value) => updateField("receiptFrom", value)}
            placeholder={
              partiesLoading
                ? "Loading parties…"
                : partyOptions.length
                  ? "Select customer / supplier"
                  : "No parties — add in Account Master"
            }
            searchable
            searchPlaceholder="Search party…"
            addNavigateTo="/dashboard/account"
            menuPortal
          />
          <CommonDropdown
            label="Received in (bank / cash)"
            options={receivedInOptions}
            value={form.receivedIn}
            onChange={(value) => updateField("receivedIn", value)}
            placeholder={
              metaLoading && !receivedInOptions.length
                ? "Loading accounts…"
                : receivedInOptions.length
                  ? "Select account"
                  : "Add Bank or Cash In Hand in Account Master"
            }
            searchable
            searchPlaceholder="Search account…"
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
        {linkedPurchaseReturnId ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Refund from supplier for a purchase return. When status is Received,
            pick the bank or cash account where the money was deposited.
          </p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            When status is Received, party and received-in account balances
            update (Tally-style). Use bank / cash-in-hand accounts from Account
            Master.
          </p>
        )}
      </div>
    </CommonModal>
  );
};

export default ReceiptModal;
