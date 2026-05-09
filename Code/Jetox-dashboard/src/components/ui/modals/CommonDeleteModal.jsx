import React from "react";
import { CommonModal } from "../CommanUI";
import { AlertTriangle } from "lucide-react";

/**
 * CommonDeleteModal Component
 * Generic confirmation modal for deletion.
 */
const CommonDeleteModal = ({ 
  open, 
  onClose, 
  onDelete, 
  title = "Delete Item?", 
  itemName = "", 
  message = "Are you sure you want to delete this from your records?",
  compact = false,
}) => {
  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={title}
      width={compact ? "min(380px, 92vw)" : "450px"}
    >
      <div className={`flex flex-col items-center text-center ${compact ? "px-2.5 py-1.5 sm:px-3 sm:py-2" : "p-4"}`}>
        {/* Item Name */}
        {itemName && (
          <h2 className={`${compact ? "text-lg mb-1.5" : "text-xl mb-4"} font-bold text-dark`}>
            {itemName}
          </h2>
        )}
        
        {/* Warning Message */}
        <div className={`flex items-start gap-2 text-red font-medium ${compact ? "mb-2.5" : "mb-8"}`}>
          <AlertTriangle size={compact ? 16 : 18} className="shrink-0 mt-0.5" />
          <p className={compact ? "text-[13px]" : "text-sm"}>
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex w-full overflow-hidden border border-light-border rounded-xl">
          <button
            onClick={onDelete}
            className={`flex-1 ${compact ? "py-1.5 text-sm" : "py-3"} text-red font-semibold hover:bg-red/5 transition-colors border-r border-light-border`}
          >
            Yes, Delete
          </button>
          <button
            onClick={onClose}
            className={`flex-1 ${compact ? "py-1.5 text-sm" : "py-3"} text-dark font-semibold hover:bg-gray-50 transition-colors`}
          >
            Cancel
          </button>
        </div>
      </div>
    </CommonModal>
  );
};

export default CommonDeleteModal;
