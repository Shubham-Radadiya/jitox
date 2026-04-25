import React, { useState } from "react";
import {
  CommonModal,
  InputField,
  CommonDropdown,
  Button,
} from "../../../components/ui/CommanUI";

const bankOptions = [
  { label: "HDFC Bank", value: "hdfc" },
  { label: "ICICI Bank", value: "icici" },
  { label: "SBI Bank", value: "sbi" },
  { label: "Axis Bank", value: "axis" },
];

const BankToCashModal = ({ open, onClose }) => {
  const [form, setForm] = useState({
    voucherNumber: "Auto",
    date: "",
    debitFrom: "",
    creditTo: "Cash auto",
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
    <CommonModal open={open} onClose={onClose} title="Bank to Cash Transfer" width="780px" footer={footer}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            label="Voucher Number" 
            value={form.voucherNumber} 
            disabled 
            placeholder="Auto" 
          />
          <InputField
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
            placeholder="Auto"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CommonDropdown
            label="Debit From"
            addNavigateTo="/dashboard/account"
            options={bankOptions}
            value={form.debitFrom}
            onChange={(value) => updateField("debitFrom", value)}
            placeholder="Dropdown: Select Bank"
          />
          <InputField 
            label="Credit To" 
            value={form.creditTo} 
            disabled 
            placeholder="Cash auto" 
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
          <div className="border border-dashed border-light-border rounded-xl bg-rowBg px-4 py-4 flex flex-col gap-2 items-center text-center">
            <Button label="Upload" variant="outline" className="w-32" />
            <p className="text-xs text-light">Choose images or drag & drop it here.</p>
            <p className="text-[11px] text-light">JPG, JPEG, PNG and WEBP, Max 20 MB.</p>
          </div>
        </div>
      </div>
    </CommonModal>
  );
};

export default BankToCashModal;








