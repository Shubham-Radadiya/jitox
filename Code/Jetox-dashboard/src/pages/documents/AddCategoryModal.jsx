import React, { useState } from "react";
import { CommonModal, InputField, Button } from "../../components/ui/CommanUI";
import { DatePicker } from "antd";
import { Calendar } from "lucide-react";
import dayjs from "dayjs";
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
    <CommonModal open={open} onClose={onClose} width="600px" title="">
      <div className="ds-modal-body-stack">
        {/* Header with Title and Date Picker */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-dark">Add Category</h2>
          <div className="flex items-center gap-2 border border-light-border rounded-lg px-3 py-1.5 focus-within:border-primary transition-colors">
            <DatePicker 
              placeholder="Default Date Picker"
              className="border-none shadow-none p-0 text-sm font-medium w-40"
              suffixIcon={<Calendar size={16} className="text-gray-400" />}
              value={date}
              onChange={(d) => setDate(d)}
            />
          </div>
        </div>

        <div className="h-[1px] bg-gray-100 w-full -mx-2"></div>

        {/* Input Field */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-400">Category Name</label>
          <InputField 
            placeholder="Agreements & Contracts"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="h-14 rounded-2xl text-lg font-medium"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mt-2">
          <Button 
            label={saving ? "Saving…" : "Save"} 
            variant="primary" 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-4 rounded-2xl font-bold text-lg bg-green-600 hover:bg-green-700 decoration-none"
          />
          <Button 
            label="Cancel" 
            variant="outline" 
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-4 rounded-2xl font-bold text-lg text-gray-400 border border-gray-100 decoration-none shadow-none"
          />
        </div>
      </div>
    </CommonModal>
  );
};

export default AddCategoryModal;
