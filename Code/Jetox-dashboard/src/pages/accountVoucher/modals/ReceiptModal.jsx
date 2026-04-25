import React, { useState } from "react";
import {
  CommonModal,
  InputField,
  CommonDropdown,
  Button,
} from "../../../components/ui/CommanUI";

const receiptThroughOptions = [
  { label: "Cash", value: "cash" },
  { label: "Bank", value: "bank" },
];

const receiptFromOptions = [
  { label: "Supplier", value: "supplier" },
  { label: "Dealer", value: "dealer" },
  { label: "Employee", value: "employee" },
];

const ReceiptModal = ({ open, onClose }) => {
  const [form, setForm] = useState({
    voucherNumber: "Auto",
    date: "",
    receiptThrough: "",
    receiptFrom: "",
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
    <CommonModal open={open} onClose={onClose} title="Add Receipt" width="720px" footer={footer}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Voucher Number" value={form.voucherNumber} disabled placeholder="Auto" />
          <InputField
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CommonDropdown
            label="Receipt Through"
            addNavigateTo="/dashboard/account"
            options={receiptThroughOptions}
            value={form.receiptThrough}
            onChange={(value) => updateField("receiptThrough", value)}
            placeholder="Dropdown: Cash, Bank"
          />
          <CommonDropdown
            label="Receipt From"
            addNavigateTo="/dashboard/account"
            options={receiptFromOptions}
            value={form.receiptFrom}
            onChange={(value) => updateField("receiptFrom", value)}
            placeholder="Dropdown: Supplier, Dealer, Employee..."
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
      </div>
    </CommonModal>
  );
};

export default ReceiptModal;









