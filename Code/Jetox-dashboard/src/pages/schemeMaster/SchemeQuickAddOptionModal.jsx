import React, { useState, useEffect } from "react";
import { CommonModal, InputField, Button } from "../../components/ui/CommanUI";
import toast from "react-hot-toast";

/**
 * Small modal opened from scheme form dropdown "+ Add" (SelectWithAdd `renderAddModal`).
 */
const SchemeQuickAddOptionModal = ({
  open,
  onClose,
  title,
  placeholder = "Type a name…",
  onConfirm,
}) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const handleSubmit = () => {
    const t = name.trim();
    if (!t) {
      toast.error("Enter a name");
      return;
    }
    onConfirm(t);
    onClose();
  };

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={[
        <Button
          key="cancel"
          label="Cancel"
          variant="outline"
          size="sm"
          onClick={onClose}
        />,
        <Button
          key="add"
          label="Add"
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          className="!text-white hover:!text-white dark:!text-white dark:hover:!text-white"
        />,
      ]}
    >
      <InputField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
        dense
      />
    </CommonModal>
  );
};

export default SchemeQuickAddOptionModal;
