import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AuthLayout from '../../layouts/AuthLayout';
import { InputField, Button } from '../../components/ui/CommanUI';
import { forgetPassword } from '../../redux/auth/AuthThunk';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    setIsSubmitting(true);
    dispatch(
      forgetPassword(
        { email: email.trim() },
        {
          onSuccess: () => {
            setIsSubmitting(false);
            navigate('/verify-code', { state: { email: email.trim() } });
          },
        }
      )
    );
  };

  return (
    <AuthLayout>
      <div className="ds-stack-major">
        <form onSubmit={handleSubmit} className="ds-stack-major">
          <InputField
            label="Email"
            type="email"
            placeholder="xyz@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && (
            <p className="text-sm text-red-500 font-medium">{error}</p>
          )}
          <Button
            type="submit"
            label="Send Code"
            variant="primary"
            className="w-full"
            disabled={isSubmitting}
          />
        </form>

        <div className="">
          <NavLink to="/login" className="text-blue-500 hover:underline">
            Back to Login
          </NavLink>
        </div>
      </div>
    </AuthLayout>
  );
}

export default ForgotPassword;
