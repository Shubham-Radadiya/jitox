import React from "react";
import { CommonModal, Button } from "../../components/ui/CommanUI";

/**
 * SchemeSuccessModal Component
 * Success confirmation after adding or updating a scheme.
 * @param {() => void} [onEditAgain] — Close success UI and reopen the scheme form (edit when `scheme.id` exists).
 */
const SchemeSuccessModal = ({ open, onClose, onEditAgain, scheme, mode = "add" }) => {
  const handleEditAgain = () => {
    if (typeof onEditAgain === "function") {
      onEditAgain();
      return;
    }
    onClose();
  };

  return (
    <CommonModal open={open} onClose={onClose} width="600px">
      <div className="flex flex-col items-center gap-4 py-3">
        {/* Title */}
        <h2 className="text-xl font-bold text-dark text-center">
          {mode === "add" 
            ? "Scheme created successfully." 
            : "Scheme details have been updated successfully."}
        </h2>

        {/* Details Box */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-dark">Scheme Name:</span>
            <span className="text-base font-medium text-gray-500">{scheme?.["Scheme Name"] || "Diwali Dhamaka Offer"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-dark">Offer Details:</span>
            <span className="text-base font-medium text-gray-500">{scheme?.["Offer Name"] || "Buy 2 Get 1 Free"}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 w-full px-6">
          <Button 
            label="View Scheme" 
            variant="secondary" 
            onClick={onClose} 
            className="flex-1 py-3 text-primary border border-gray-100 rounded-xl font-bold"
          />
          <Button 
            label="Edit Again" 
            variant="secondary" 
            onClick={handleEditAgain} 
            className="flex-1 py-3 text-dark border border-gray-100 rounded-xl font-bold shadow-none"
          />
        </div>
      </div>
    </CommonModal>
  );
};

export default SchemeSuccessModal;
