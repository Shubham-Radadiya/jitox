import React, { useState } from "react";
import {
  CommonModal,
  InputField,
  CommonDropdown,
  Button,
} from "../../../components/ui/CommanUI";

const accountOptions = [
  { label: "Account 1", value: "account1" },
  { label: "Account 2", value: "account2" },
  { label: "Account 3", value: "account3" },
];

const JournalModal = ({ open, onClose }) => {
  const [form, setForm] = useState({
    voucherNumber: "Auto",
    date: "",
    by: "",
    to: "",
    debitAmount: "",
    creditAmount: "",
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
    <CommonModal open={open} onClose={onClose} title="Add Journal" width="720px" footer={footer}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          <InputField
            label="Voucher Number"
            value={form.voucherNumber}
            disabled
            placeholder="Auto"
          />
          <CommonDropdown
            label="By"
            addNavigateTo="/dashboard/account"
            options={accountOptions}
            value={form.by}
            onChange={(value) => updateField("by", value)}
            placeholder="Dropdown: Select Account"
          />
          <CommonDropdown
            label="To"
            addNavigateTo="/dashboard/account"
            options={accountOptions}
            value={form.to}
            onChange={(value) => updateField("to", value)}
            placeholder="Dropdown: Select Account"
          />
          <InputField
            label="Narration / Remark"
            multiline
            rows={3}
            value={form.narration}
            onChange={(e) => updateField("narration", e.target.value)}
            placeholder="Textarea"
          />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          <InputField
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
            placeholder="Auto"
          />
          <InputField
            label="Debit Amount"
            type="number"
            value={form.debitAmount}
            onChange={(e) => updateField("debitAmount", e.target.value)}
            placeholder="Amount"
          />
          <InputField
            label="Credit Amount"
            type="number"
            value={form.creditAmount}
            onChange={(e) => updateField("creditAmount", e.target.value)}
            placeholder="Amount"
          />
        </div>
      </div>
    </CommonModal>
  );
};

export default JournalModal;

