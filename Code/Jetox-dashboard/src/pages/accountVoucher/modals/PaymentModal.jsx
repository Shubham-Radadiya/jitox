import React, { useState } from "react";
import {
  CommonModal,
  InputField,
  CommonDropdown,
  Button,
} from "../../../components/ui/CommanUI";

const paymentThroughOptions = [
  { label: "Cash", value: "cash" },
  { label: "Bank", value: "bank" },
];

const paymentToOptions = [
  { label: "Supplier", value: "supplier" },
  { label: "Dealer", value: "dealer" },
  { label: "Employee", value: "employee" },
];

const PaymentModal = ({ open, onClose }) => {
  const [form, setForm] = useState({
    voucherNumber: "Auto",
    date: "",
    paymentThrough: "",
    paymentTo: "",
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
    <CommonModal open={open} onClose={onClose} title="Add Payment" width="720px" footer={footer}>
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
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CommonDropdown
            label="Payment Through"
            addNavigateTo="/dashboard/account"
            options={paymentThroughOptions}
            value={form.paymentThrough}
            onChange={(value) => updateField("paymentThrough", value)}
            placeholder="Dropdown: Cash, Bank"
          />
          <CommonDropdown
            label="Payment To"
            addNavigateTo="/dashboard/account"
            options={paymentToOptions}
            value={form.paymentTo}
            onChange={(value) => updateField("paymentTo", value)}
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

export default PaymentModal;









