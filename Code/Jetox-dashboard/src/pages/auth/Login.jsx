import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { getFirstAllowedDashboardPath } from '../../constants/routePermissions';
import { Formik } from 'formik';
import * as Yup from 'yup';
import AuthLayout from '../../layouts/AuthLayout';
import { Button, InputField } from '../../components/ui/CommanUI';
import { loginUser } from '../../redux/auth/AuthThunk';
import { useDispatch } from 'react-redux';

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const flashMessage = location.state?.message;
  const initialValues = {
    email: '',
    password: '',
  };

  const handleSubmit = (values) => {
    dispatch(
      loginUser(values, {
        onSuccess: (response) => {
          const user = response?.data?.user;
          navigate(getFirstAllowedDashboardPath(user) || '/dashboard');
        },
      })
    );
  };

  return (
    <AuthLayout>
      <div className="ds-stack-major">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit: formikSubmit,
          }) => (
            <form
              onSubmit={formikSubmit}
              className="ds-stack-major"
              noValidate
            >
              {flashMessage ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                  {flashMessage}
                </p>
              ) : null}
              <div>
                <InputField
                  label="Email"
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="xyz@gmail.com"
                  autoComplete="email"
                />
                {touched.email && errors.email && (
                  <p className="text-xs text-red-500 pt-2">{errors.email}</p>
                )}
              </div>
              <div>
                <InputField
                  label="Password"
                  type="password"
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="********"
                  autoComplete="current-password"
                />
                {touched.password && errors.password && (
                  <p className="text-xs text-red-500 pt-2">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 text-primary"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 text-sm text-gray-600"
                  >
                    Remember me
                  </label>
                </div>
                <NavLink
                  to="/forgot-password"
                  className="text-sm text-blue-500 hover:underline"
                >
                  Forgot Password?
                </NavLink>
              </div>

              <Button
                type="submit"
                label="Login"
                variant="primary"
                className="w-full"
              />
            </form>
          )}
        </Formik>

        {import.meta.env.DEV && (
          <p className="text-xs text-gray-500 rounded-md bg-gray-50 border border-gray-100 px-3 py-2">
            Local dev: seed users once via{' '}
            <code className="text-[11px]">GET http://localhost:4000/users/get-users</code>
            <br />
            <code>admin@gmail.com</code> (Admin), <code>manager@gmail.com</code> (Manager),{' '}
            <code>testuser@gmail.com</code>, <code>rajesh.field@gmail.com</code>,{' '}
            <code>priya.field@gmail.com</code> (Field) — password <code>123456</code>
            <br />
            Tracking test data: <code>npm run seed:user-test</code> in Jitox-api
          </p>
        )}

        <div>
          <div className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <NavLink to="/register" className="text-blue-500 hover:underline">
              Sign up
            </NavLink>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Login;
