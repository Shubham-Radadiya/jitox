import React from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import { Button } from "../../components/ui/CommanUI";
import Pwd from "../../assets/pwd.jpg";

const MessageBox = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
    <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
      <div className="relative bg-white rounded-2xl p-6 w-[360px] flex flex-col gap-4 text-center" style={{boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px'}}>
        {/* Close Button */}
        <button
          onClick={() => navigate("/login")}
          className="absolute top-3 rounded-full p-1 right-3 hover:text-gray-600"
          style={{boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px'}}
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="flex justify-center">
         <img src={Pwd} alt="Password changed" className="w-12 h-12" />
        </div>

        {/* Title */}
        <div>
        <h2 className="text-lg font-semibold text-primary">
          Password changed
        </h2>

        {/* Subtitle */}
        <div className="text-gray-500 text-sm">
          Your password has been changed successfully.
        </div>
        </div>

        {/* Button */}
        <Button
             type="submit"
            label="Back to Login"
            variant="primary"
            onClick={() => navigate("/login")}
        />
      </div>
    </div>
    </AuthLayout>
  );
};

export default MessageBox;
