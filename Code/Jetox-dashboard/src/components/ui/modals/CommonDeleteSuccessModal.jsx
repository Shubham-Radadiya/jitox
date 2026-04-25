import React from "react";
import { CommonModal, Button } from "../CommanUI";
import deleteImg from "../../../assets/delete.png";

/**
 * CommonDeleteSuccessModal Component
 * Success modal shown after an item is successfully deleted.
 */
const CommonDeleteSuccessModal = ({ open, onClose, title = "Deleted Successfully", message = "The record has been successfully removed from your system." }) => {
  return (
    <CommonModal open={open} onClose={onClose} width="450px" title="">
      <div className="flex flex-col items-center text-center p-4">
        {/* Success Illustration */}
        <div className="mb-6 w-full max-w-[280px]">
          <img src={deleteImg} alt="Deleted" className="w-full h-auto object-contain" />
        </div>

        <h2 className="text-xl font-bold text-dark mb-4">{title}</h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          {message}
        </p>

        <Button
          label="Okay"
          variant="primary"
          onClick={onClose}
          className="w-full py-3 rounded-xl font-semibold"
        />
      </div>
    </CommonModal>
  );
};

export default CommonDeleteSuccessModal;
