import React, { useState } from "react";
import { CommonModal, InputField, Button } from "../../components/ui/CommanUI";
import { DatePicker } from "antd";
import { Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";

/**
 * AddCategoryModal Component
 * Modal for creating a new document category.
 */
const AddCategoryModal = ({ open, onClose, onSave }) => {
  const [categoryName, setCategoryName] = useState("");
  const [date, setDate] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const name = categoryName.trim();
    if (!name) {
      toast.error("Enter a category name");
      return;
    }
    setSaving(true);
    try {
      await onSave({ name, date });
      setCategoryName("");
      setDate(null);
      onClose();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not create category"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title="Add Category"
      width="min(94vw, 520px)"
      headerClassName="!px-4 !py-3"
      titleClassName="!text-sm sm:!text-base"
      bodyClassName="!px-4 !pt-3 !pb-4"
      footerClassName="!px-4 !py-3"
      footer={[
        <Button
          key="cancel"
          label="Cancel"
          variant="outline"
          onClick={onClose}
          disabled={saving}
          size="sm"
          className="min-h-9! px-3.5! text-sm!"
        />,
        <Button
          key="save"
          label={saving ? "Saving…" : "Save"}
          variant="primary"
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="min-h-9! px-4.5! text-sm!"
        />,
      ]}
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InputField
            label="Category Name"
            placeholder="Agreements & Contracts"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            dense
            labelClassName="text-sm!"
            inputClassName="h-10! rounded-lg text-[13px]!"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Date (optional)
            </label>
            <DatePicker
              placeholder="Select date"
              className="h-10! w-full rounded-lg border border-light-border px-3 py-0 text-[13px] dark:border-slate-600 [&_.ant-picker-input>input]:h-full [&_.ant-picker-input>input]:text-[13px]"
              suffixIcon={<Calendar size={14} className="text-gray-400 dark:text-slate-500" />}
              value={date}
              onChange={(d) => setDate(d)}
            />
          </div>
        </div>
      </div>
    </CommonModal>
  );
};

export default AddCategoryModal;
