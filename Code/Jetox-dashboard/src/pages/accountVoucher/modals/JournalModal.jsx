import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  CommonModal,
  InputField,
  CommonDropdown,
  Button,
} from "../../../components/ui/CommanUI";
import { accountsApi, journalVouchersApi } from "../../../services/api";
import { getApiErrorMessage, isEmptyListNotFound } from "../../../utils/apiError";

function baseFormFields() {
  return {
    voucherNo: "",
    date: new Date().toISOString().slice(0, 10),
    paymentBy: "",
    paymentTo: "",
    amount: "",
    remarks: "",
  };
}

/** Normalize Mongo ref / id from API or list row into a string id. */
function accountRefToId(ref) {
  if (ref == null || ref === "") return "";
  if (typeof ref === "string" || typeof ref === "number") {
    return String(ref).trim();
  }
  if (typeof ref === "object") {
    if (ref._id != null) return String(ref._id).trim();
    if (typeof ref.toString === "function") {
      const s = ref.toString();
      if (s && s !== "[object Object]") return s.trim();
    }
  }
  return "";
}

function accountLabel(a) {
  const party = String(a.businessName || "").trim();
  const person = String(a.name || "").trim();
  const email = String(a.email || "").trim();
  const mobile = String(a.mobileNumber || "").trim();
  const typ = String(a.accountType || a.category || "").trim();
  const idShort = a._id != null ? String(a._id).slice(-8) : "";
  const base =
    party ||
    person ||
    email ||
    mobile ||
    (idShort ? `Account …${idShort}` : "Account");
  return typ ? `${base} (${typ})` : base;
}

function formatDateInput(value) {
  if (value == null || value === "") return baseFormFields().date;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return baseFormFields().date;
  return d.toISOString().slice(0, 10);
}

function journalToForm(journal) {
  if (!journal?._id) return null;
  return {
    voucherNo: String(journal.voucherNo || "").trim(),
    date: formatDateInput(journal.date),
    paymentBy: accountRefToId(journal.paymentBy),
    paymentTo: accountRefToId(journal.paymentTo),
    amount:
      journal.debitAmount != null && journal.debitAmount !== ""
        ? String(journal.debitAmount)
        : "",
    remarks: journal.remarks != null ? String(journal.remarks) : "",
  };
}

const JournalModal = ({ open, onClose, onSaved, journal }) => {
  const [form, setForm] = useState(() => baseFormFields());
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(journal?._id);

  const {
    data: nextVoucherNoRes,
    isFetching: nextNoLoading,
    isError: nextNoError,
    error: nextNoErr,
  } = useQuery({
    queryKey: ["journal-next-voucher-no"],
    queryFn: async () => {
      const { data } = await journalVouchersApi.getNextVoucherNo();
      return data?.voucherNo != null ? String(data.voucherNo).trim() : "";
    },
    enabled: open && !isEdit,
    staleTime: 0,
  });

  const suggestedVoucherNo = nextVoucherNoRes ?? "";

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    if (isEdit) {
      const fromDoc = journalToForm(journal);
      if (fromDoc) setForm(fromDoc);
      return;
    }
    setForm({
      ...baseFormFields(),
      voucherNo: suggestedVoucherNo || "",
    });
  }, [open, isEdit, journal, suggestedVoucherNo]);

  useEffect(() => {
    if (!nextNoError || !nextNoErr || isEdit) return;
    toast.error(
      getApiErrorMessage(nextNoErr, "Could not load next journal voucher number")
    );
  }, [nextNoError, nextNoErr, isEdit]);

  const updateField = (key, value) => {
    if (key === "paymentBy" || key === "paymentTo") {
      const id = value != null && value !== "" ? String(value).trim() : "";
      setForm((prev) => ({ ...prev, [key]: id }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const {
    data: accountsRaw = [],
    isLoading: accountsLoading,
    isError: accountsError,
    error: accountsErr,
  } = useQuery({
    // Raw account list for dropdowns — do not share ["accounts"] with Account Master
    // (that cache stores table rows mapped via mapAccountToRow).
    queryKey: ["accounts", "raw"],
    queryFn: async () => {
      try {
        const { data } = await accountsApi.getAll({});
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        return [];
      } catch (e) {
        if (isEmptyListNotFound(e)) return [];
        throw e;
      }
    },
    enabled: open,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (accountsError && accountsErr) {
      toast.error(getApiErrorMessage(accountsErr, "Could not load accounts"));
    }
  }, [accountsError, accountsErr]);

  const accountOptions = useMemo(() => {
    const base = accountsRaw.map((a) => ({
      value: String(a._id),
      label: accountLabel(a),
    }));
    const baseIds = new Set(base.map((o) => o.value));
    const extras = [];
    for (const rawId of [form.paymentBy, form.paymentTo]) {
      const id = rawId != null && String(rawId).trim() !== "" ? String(rawId).trim() : "";
      if (!id || baseIds.has(id)) continue;
      extras.push({
        value: id,
        label: accountsLoading
          ? "Resolving account…"
          : `Account (id …${id.slice(-8)})`,
      });
    }
    return [...extras, ...base];
  }, [accountsRaw, accountsLoading, form.paymentBy, form.paymentTo]);

  const handleSave = async () => {
    const amountNum = Number(form.amount);
    if (!form.paymentBy || !form.paymentTo) {
      toast.error("Select both By and To accounts.");
      return;
    }
    if (form.paymentBy === form.paymentTo) {
      toast.error("By and To must be different accounts.");
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error("Enter a valid positive amount.");
      return;
    }
    if (!form.date) {
      toast.error("Select a date.");
      return;
    }
    const voucherNo = form.voucherNo.trim();
    if (!voucherNo) {
      toast.error("Enter a voucher number.");
      return;
    }

    const payload = {
      voucherNo,
      date: form.date,
      paymentBy: form.paymentBy,
      paymentTo: form.paymentTo,
      debitAmount: amountNum,
      creditAmount: amountNum,
      remarks: form.remarks?.trim() || "",
    };

    setSaving(true);
    try {
      if (isEdit) {
        await journalVouchersApi.update(String(journal._id), payload);
        toast.success(`Journal ${voucherNo} updated.`);
      } else {
        await journalVouchersApi.create(payload);
        toast.success(`Journal ${voucherNo} saved.`);
      }
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(
        getApiErrorMessage(
          e,
          isEdit ? "Could not update journal voucher" : "Could not save journal voucher"
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const voucherReadOnly = !isEdit && nextNoLoading;

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
        label={saving ? (isEdit ? "Updating…" : "Saving…") : isEdit ? "Update" : "Save"}
        variant="primary"
        className="w-28"
        onClick={handleSave}
        disabled={
          saving ||
          (accountsLoading && accountOptions.length === 0) ||
          (!isEdit && nextNoLoading && !form.voucherNo.trim())
        }
      />
    </>
  );

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Journal" : "Add Journal"}
      width="720px"
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            label="Voucher Number"
            value={form.voucherNo}
            onChange={(e) => updateField("voucherNo", e.target.value)}
            placeholder="JITOX-DEMO-JV-001"
            readOnly={voucherReadOnly}
            inputClassName={voucherReadOnly ? "text-slate-400" : undefined}
          />
          <InputField
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CommonDropdown
            label="By (debit account)"
            addNavigateTo="/dashboard/account"
            options={accountOptions}
            value={form.paymentBy}
            onChange={(value) => updateField("paymentBy", value)}
            placeholder={
              accountsLoading ? "Loading accounts…" : "Select account"
            }
            searchable
            menuPortal
            disabled={accountsLoading && accountOptions.length === 0}
          />
          <InputField
            label="Amount (debit = credit)"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            placeholder="Amount to move between accounts"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CommonDropdown
            label="To (credit account)"
            addNavigateTo="/dashboard/account"
            options={accountOptions}
            value={form.paymentTo}
            onChange={(value) => updateField("paymentTo", value)}
            placeholder={
              accountsLoading ? "Loading accounts…" : "Select account"
            }
            searchable
            menuPortal
            disabled={accountsLoading && accountOptions.length === 0}
          />
        </div>

        <InputField
          label="Narration / Remark"
          multiline
          rows={3}
          value={form.remarks}
          onChange={(e) => updateField("remarks", e.target.value)}
          placeholder="Reason for this journal entry"
        />

        {accountsRaw.length === 0 && !accountsLoading ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            No accounts found. Add accounts under Account Master first.
          </p>
        ) : null}
      </div>
    </CommonModal>
  );
};

export default JournalModal;
