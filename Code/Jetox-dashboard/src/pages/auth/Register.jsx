import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Formik } from "formik";
import * as Yup from "yup";
import AuthLayout from "../../layouts/AuthLayout";
import { InputField, Button } from "../../components/ui/CommanUI";
import AddressForm from "../../components/address/AddressForm";
import { Eye, EyeOff } from "lucide-react";
import { createUser } from "../../redux/auth/AuthThunk";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

const validationSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, "First name must be at least 2 characters")
    .required("First name is required"),
  lastName: Yup.string()
    .min(2, "Last name must be at least 2 characters")
    .required("Last name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  streetAddress: Yup.string()
    .min(3, "Street address is required")
    .required("Street address is required"),
  area: Yup.string(),
  city: Yup.string()
    .min(2, "City is required")
    .required("City is required"),
  state: Yup.string()
    .min(2, "State is required")
    .required("State is required"),
  taluka: Yup.string(),
  district: Yup.string(),
  country: Yup.string(),
  pincode: Yup.string()
    .matches(/^\d{5,10}$/, "Pincode must be 5–10 digits")
    .required("Pincode is required"),
});

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const initialValues = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    streetAddress: "",
    area: "",
    city: "",
    taluka: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
  };

  const handleSubmit = (values) => {
    dispatch(
      createUser(values, {
        onSuccess: () => {
          toast.success("Account created. Sign in to continue.");
          navigate("/login");
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Registration failed");
        }
      })
    );
  };


  return (
    <AuthLayout>
      <div className='ds-stack-major'>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isValid, setFieldValue }) => (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-5 max-h-[calc(100vh-20rem)] overflow-auto scrollbar-hide">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <InputField
                      label="First Name"
                      name="firstName"
                      value={values.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    />
                    {touched.firstName && errors.firstName && (
                      <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <InputField
                      label="Last Name"
                      name="lastName"
                      value={values.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    />
                    {touched.lastName && errors.lastName && (
                      <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <InputField
                      label="Email Address"
                      type="email"
                      name="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    />
                    {touched.email && errors.email && (
                      <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="relative w-full">
                    <InputField
                      label="Password"
                      type="password"
                      // type={showPassword ? "text" : "password"}
                      name="password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {touched.password && errors.password && (
                      <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Address</p>
                  <AddressForm
                    value={values}
                    onChange={(patch) => {
                      Object.entries(patch).forEach(([k, val]) =>
                        setFieldValue(k, val, true)
                      );
                    }}
                    errors={{
                      streetAddress: touched.streetAddress ? errors.streetAddress : "",
                      city: touched.city ? errors.city : "",
                      state: touched.state ? errors.state : "",
                      pincode: touched.pincode ? errors.pincode : "",
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      id="terms"
                      name="terms"
                      // onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-4 h-4 border-light-border rounded"
                    />
                    <label htmlFor="termsAccepted">
                      By using Jitox, you agree to the{" "}
                      <span className="text-blue-500 hover:underline">
                        Terms and Privacy Policy
                      </span>
                      .
                    </label>
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                label="Register"
                variant="primary"
                className="w-full"
                disabled={!isValid}
              />
            </form>
          )}
        </Formik>
        <div className="text-sm text-gray-600">
          Already have an account?{" "}
          <NavLink to="/login" className="text-blue-500 hover:underline">
            Login
          </NavLink>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Register;
