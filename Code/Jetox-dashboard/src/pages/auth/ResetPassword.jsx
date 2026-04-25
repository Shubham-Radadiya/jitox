import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AuthLayout from '../../layouts/AuthLayout';
import { InputField, Button } from '../../components/ui/CommanUI';
import { changePassword } from '../../redux/auth/AuthThunk';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    if (!password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    setIsSubmitting(true);
    setError('');
    dispatch(
      changePassword(
        { email, newPassword: password },
        {
          onSuccess: () => {
            setIsSubmitting(false);
            navigate('/message-box', { replace: true });
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
            label="New Password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <InputField
            label="Confirm New Password"
            type="password"
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && (
            <p className="text-sm text-red-500 font-medium">{error}</p>
          )}

          <Button
            type="submit"
            label="Update Password"
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

export default ResetPassword;
