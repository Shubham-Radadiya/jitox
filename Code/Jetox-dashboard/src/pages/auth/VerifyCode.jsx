import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import { Button } from "../../components/ui/CommanUI";
import { verifyOtp } from "../../redux/auth/AuthThunk";

function VerifyCode() {
  const [code, setCode] = useState(["", "", "", "","",""]);
  const inputRefs = useRef([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Move focus to next field
    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    const otp = code.join("");
    if (otp.length !== code.length) {
      setError("Enter the complete 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    dispatch(
      verifyOtp(
        { email, otp },
        {
          onSuccess: () => {
            setIsSubmitting(false);
            navigate("/reset-password", { state: { email } });
          }
        }
      )
    );
  };

  return (
    <AuthLayout>
      <div className="ds-stack-major">
        <form   
          onSubmit={handleSubmit}
          className="ds-stack-major"
        >
          <div className="flex gap-3 justify-center w-full">
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-full h-14 text-center border border-light-border rounded-xl font-bold text-2xl 
                         focus:ring-2 focus:ring-primary focus:outline-none"
              />
            ))}
          </div>
          {error && (
            <p className="text-sm text-red-500 font-medium text-center">
              {error}
            </p>
          )}

          <Button
            type="submit"
            label="Verify"
            variant="primary"
            className="w-full"
            disabled={isSubmitting}
          />

          <div className="text-sm text-gray-600">
            Resend in <span className="text-blue-500 font-medium">00:20</span>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

export default VerifyCode;
