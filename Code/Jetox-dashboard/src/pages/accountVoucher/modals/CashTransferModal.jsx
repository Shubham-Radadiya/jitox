import React, { useState } from "react";
import {
  CommonModal,
  InputField,
  CommonDropdown,
  Button,
} from "../../../components/ui/CommanUI";

const bankOptions = [
  { label: "Select Bank", value: "" },
  { label: "HDFC Bank", value: "hdfc" },
  { label: "ICICI Bank", value: "icici" },
];

const CashTransferModal = ({ open, onClose }) => {
  const [form, setForm] = useState({
    voucherNumber: "Auto",
    date: "",
    debitFrom: "Cash auto",
    creditTo: "",
    amount: "",
    narration: "",
  });

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const footer = (
    <>
      <Button label="Cancel" variant="outline" className="w-28" onClick={onClose} />
      <Button label="Save" variant="primary" className="w-28" />
    </>
  );

  return (
    <CommonModal open={open} onClose={onClose} title="Cash to Bank Transfer" width="780px" footer={footer}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Voucher Number" value={form.voucherNumber} disabled placeholder="Auto" />
          <InputField
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
            placeholder="Auto"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label="Debit From" value={form.debitFrom} disabled />
          <CommonDropdown
            label="Credit To"
            addNavigateTo="/dashboard/account"
            options={bankOptions}
            value={form.creditTo}
            onChange={(value) => updateField("creditTo", value)}
            placeholder="Dropdown: Select Bank"
          />
          <InputField
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            placeholder="Amount"
          />
        </div>

        <InputField
          label="Narration / Remark"
          multiline
          rows={3}
          value={form.narration}
          onChange={(e) => updateField("narration", e.target.value)}
          placeholder="Textarea"
        />

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-dark">Attachment (Optional)</label>
          <div className="border border-dashed border-light-border rounded-xl bg-rowBg px-4 py-3 flex gap-3 items-center justify-center text-center">
            <Button
              label="Upload"
              variant="outline"
              className="w-32 bg-white !text-gray-900 shadow-sm hover:!text-white dark:bg-slate-800 dark:!text-white dark:shadow-none dark:border-slate-500 dark:hover:!text-white"
            />
            <div>
            <div className="text-xs text-light">Choose images or drag & drop it here.</div>
            <div className="text-[11px] text-light">JPG, JPEG, PNG and WEBP, Max 20 MB.</div>
            </div>
          </div>
        </div>
      </div>
    </CommonModal>
  );
};

export default CashTransferModal;


