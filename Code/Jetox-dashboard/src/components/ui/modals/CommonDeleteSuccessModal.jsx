import React from "react";
import { CommonModal, Button } from "../CommanUI";
import deleteImg from "../../../assets/delete.png";

/**
 * CommonDeleteSuccessModal Component
 * Success modal shown after an item is successfully deleted.
 */
const CommonDeleteSuccessModal = ({ open, onClose, title = "Deleted Successfully", message = "The record has been successfully removed from your system." }) => {
  return (
    <CommonModal
      open={open}
      onClose={onClose}
      width="min(360px, 90vw)"
      title=""
      bodyClassName="px-3 py-3 sm:px-4 sm:py-4"
    >
      <div className="flex flex-col items-center text-center">
        {/* Success Illustration */}
        <div className="mb-3 w-full max-w-[180px] sm:max-w-[200px]">
          <img src={deleteImg} alt="Deleted" className="w-full h-auto object-contain" />
        </div>

        <h2 className="mb-2 text-lg font-bold text-dark">{title}</h2>
        <p className="mb-4 text-[13px] leading-relaxed text-gray-500">
          {message}
        </p>

        <Button
          label="Okay"
          variant="primary"
          onClick={onClose}
          size="sm"
          className="w-full rounded-lg font-semibold"
        />
      </div>
    </CommonModal>
  );
};

export default CommonDeleteSuccessModal;
