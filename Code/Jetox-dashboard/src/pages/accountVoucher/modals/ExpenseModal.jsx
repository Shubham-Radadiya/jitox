import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  CommonModal,
  InputField,
  CommonDropdown,
  Button,
} from "../../../components/ui/CommanUI";
import {
  emptyMeta,
  usePurchaseFormMeta,
} from "../../../hooks/usePurchaseFormMeta";

const expenseTypeOptions = [
  { label: "Fuel", value: "fuel" },
  { label: "Travel", value: "travel" },
  { label: "Supplies", value: "supplies" },
];

const paymentModeOptions = [
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "NEFT", value: "neft" },
  { label: "Card", value: "card" },
];

const ExpenseModal = ({ open, onClose }) => {
  const { data: meta } = usePurchaseFormMeta();
  const partyOptions = useMemo(() => {
    if (!meta?.parties?.length) return emptyMeta.parties;
    return meta.parties;
  }, [meta]);

  const [form, setForm] = useState({
    startDate: "",
    expenseType: "",
    description: "",
    paidToParty: "",
    paymentMode: "",
    amount: "",
  });

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const footer = (
    <>
      <Button label="Cancel" variant="outline" className="w-28" onClick={onClose} />
      <Button
        label="Save"
        variant="primary"
        className="w-28 text-white dark:text-white"
        onClick={() => {
          const party = partyOptions.find((p) => p.value === form.paidToParty);
          if (!form.paidToParty) {
            toast.error("Select the party paid to for ledger posting.");
            return;
          }
          toast.success(
            `Expense will post to ${party?.label || "party"} ledger when the API is connected.`
          );
          onClose();
        }}
      />
    </>
  );

  return (
    <CommonModal open={open} onClose={onClose} title="Add New Expense" width="800px" footer={footer}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Start Date"
            type="date"
            value={form.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
            placeholder="01 July, 2025"
          />
          <CommonDropdown
            label="Expense Type"
            addNavigateTo="/dashboard/account"
            options={expenseTypeOptions}
            value={form.expenseType}
            onChange={(value) => updateField("expenseType", value)}
            placeholder="Dropdown (Fuel, Travel, Supplies, etc.)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Text Input"
          />
          <CommonDropdown
            label="Paid to (party)"
            addNavigateTo="/dashboard/account"
            options={partyOptions}
            value={form.paidToParty}
            onChange={(value) => updateField("paidToParty", value)}
            placeholder="Select party — ledger updates on save"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CommonDropdown
            label="Payment Mode"
            addNavigateTo="/dashboard/account"
            options={paymentModeOptions}
            value={form.paymentMode}
            onChange={(value) => updateField("paymentMode", value)}
            placeholder="Dropdown (Cash, UPI, NEFT, Card)"
          />
          <InputField
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            placeholder="Number Input"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-dark">Upload Proof</label>
          <div className="border border-dashed border-light-border rounded-xl bg-rowBg px-4 py-4 flex flex-col gap-2 items-center text-center">
            <Button
              label="Upload"
              variant="outline"
              className="w-32 bg-white !text-gray-900 shadow-sm hover:!text-white dark:bg-slate-800 dark:!text-white dark:shadow-none dark:border-slate-500 dark:hover:!text-white"
            />
            <p className="text-xs text-light">Choose images or drag & drop it here.</p>
            <p className="text-[11px] text-light">JPG, JPEG, PNG and WEBP, Max 20 MB.</p>
          </div>
        </div>
      </div>
    </CommonModal>
  );
};

export default ExpenseModal;









