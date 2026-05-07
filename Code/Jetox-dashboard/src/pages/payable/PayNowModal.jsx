import React, { useState, useEffect } from "react";
import { dashboardUiService } from "../../services/dashboardUi.service";
import toast from "react-hot-toast";
import {
  CommonModal,
  InputField,
  CommonDropdown,
  Button,
} from "../../components/ui/CommanUI";
import { DatePicker } from "antd";
import dayjs from "dayjs";

/**
 * PayNowModal Component
 * Modal for adding a payment to a payable item.
 */
const PayNowModal = ({ open, onClose, voucherData, onSaved }) => {
  const [form, setForm] = useState({
    voucherNo: "Auto",
    date: dayjs(),
    paymentThrough: "",
    paymentTo: "",
    amount: "",
    narration: "",
  });

  useEffect(() => {
    if (!open || !voucherData) return;
    const rawAmt =
      voucherData.amountValue != null
        ? String(voucherData.amountValue)
        : String(voucherData["Amount (₹)"] || "").replace(/[₹,\s]/g, "");
    const through = String(voucherData["Payment Through"] || "");
    const payThrough =
      through.toLowerCase().includes("cash") ? "cash" : through ? "bank" : "";
    const payToLabel = String(voucherData["Payment To"] || "").toLowerCase();
    let payTo = "";
    if (payToLabel.includes("employee")) payTo = "employee";
    else if (payToLabel.includes("dealer")) payTo = "dealer";
    else if (payToLabel) payTo = "supplier";

    setForm({
      voucherNo: voucherData["Voucher No"] || "Auto",
      date: dayjs(),
      paymentThrough: payThrough,
      paymentTo: payTo,
      amount: rawAmt,
      narration: String(voucherData.Narration || ""),
    });
  }, [open, voucherData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await dashboardUiService.postPayablePayment({
        voucherNumber: form.voucherNo,
        date: form.date?.format?.("YYYY-MM-DD"),
        paymentThrough: form.paymentThrough,
        paymentTo: form.paymentTo,
        amount: form.amount,
        narration: form.narration,
      });
      toast.success("Payment saved");
      onClose();
      onSaved?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed");
    }
  };

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title="Add Payment"
      width="min(640px, 90vw)"
      headerClassName="py-2.5"
      bodyClassName="px-3 sm:px-4 pb-4 sm:pb-5 pt-2.5 sm:pt-3"
      footerClassName="px-3 sm:px-4 py-2.5 gap-2"
      footer={[
        <Button
          key="cancel"
          label="Cancel"
          variant="outline"
          onClick={onClose}
          size="sm"
          className="min-h-9 w-24 justify-center px-3 text-xs font-semibold sm:w-24"
        />,
        <Button
          key="save"
          label="Save"
          variant="primary"
          onClick={handleSave}
          size="sm"
          className="min-h-9 w-24 justify-center px-3 text-xs font-semibold sm:w-24"
        />,
      ]}
    >
      <div className="ds-modal-body-stack">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
          <InputField
            label="Voucher Number"
            name="voucherNo"
            value={form.voucherNo}
            onChange={handleChange}
            placeholder="Auto"
          />
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-dark">Date</label>
            <DatePicker
              value={form.date}
              onChange={(date) => setForm({ ...form, date })}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
          <CommonDropdown
            label="Payment Through"
            addNavigateTo="/dashboard/account"
            placeholder="Dropdown: Cash, Bank"
            value={form.paymentThrough}
            onChange={(v) => setForm({ ...form, paymentThrough: v })}
            options={[
              { value: "cash", label: "Cash" },
              { value: "bank", label: "Bank" },
            ]}
          />
          <CommonDropdown
            label="Payment To"
            addNavigateTo="/dashboard/account"
            placeholder="Dropdown: Supplier, Dealer, Employee,…"
            value={form.paymentTo}
            onChange={(v) => setForm({ ...form, paymentTo: v })}
            options={[
              { value: "supplier", label: "Supplier" },
              { value: "dealer", label: "Dealer" },
              { value: "employee", label: "Employee" },
            ]}
          />
          <InputField
            label="Amount"
            name="amount"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
          />
        </div>

        <InputField
          label="Narration / Remark"
          name="narration"
          multiline
          rows={3}
          placeholder="Textarea"
          value={form.narration}
          onChange={handleChange}
        />
      </div>
    </CommonModal>
  );
};

export default PayNowModal;
