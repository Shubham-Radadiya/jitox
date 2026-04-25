import {
  CREATE_REGISTER_REQUEST,
  LOGIN_REQUEST,
  FORGET_PASSWORD,
  VERIFY_OTP,
  RESET_PASSWORD,
} from "./AuthAction";
import { authService } from "../../services/auth.services";
import toast from "react-hot-toast";

const getErrorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || error?.message || fallback;

export const createUser = (data, { onSuccess } = {}) => {
  return async (dispatch) => {
    dispatch({ type: CREATE_REGISTER_REQUEST });
    try {
      const response = await authService.register(data);
      toast.success(response?.data?.message || "User registered successfully");
      if (onSuccess) onSuccess(response);
    } catch (error) {
      const message = getErrorMessage(error, "Unable to register user");
      toast.error(message);
    }
  };
};

export const loginUser = (data, { onSuccess } = {}) => {
  return async (dispatch) => {
    dispatch({ type: LOGIN_REQUEST });
    try {
      const response = await authService.loginUser(data);
      const token = response.data.token;
      localStorage.setItem("token", token);
      localStorage.setItem("access_token", token);
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      toast.success(response?.data?.message || "User login successful");
      if (onSuccess) onSuccess(response);
    } catch (error) {
      const message = getErrorMessage(error, "Unable to login");
      toast.error(message);
    }
  };
};

export const forgetPassword = (data, { onSuccess } = {}) => {
  return async (dispatch) => {
    dispatch({ type: FORGET_PASSWORD });
    try {
      const response = await authService.forgotPassword(data);
      toast.success(response?.data?.message || "OTP sent successfully");
      if (onSuccess) onSuccess(response);
    } catch (error) {
      const message = getErrorMessage(error, "Unable to send OTP");
      toast.error(message);
    }
  };
};

export const verifyOtp = (data, { onSuccess } = {}) => {
  return async (dispatch) => {
    dispatch({ type: VERIFY_OTP });
    try {
      const response = await authService.verifyCode(data);
      toast.success(response?.data?.message || "OTP verified successfully");
      if (onSuccess) onSuccess(response);
    } catch (error) {
      const message = getErrorMessage(error, "Invalid OTP");
      toast.error(message);
    }
  };
};

export const changePassword = (data, { onSuccess } = {}) => {
  return async (dispatch) => {
    dispatch({ type: RESET_PASSWORD });
    try {
      const response = await authService.resetPassword(data);
      toast.success(response?.data?.message || "Password updated successfully");
      if (onSuccess) onSuccess(response);
    } catch (error) {
      const message = getErrorMessage(error, "Unable to update password");
      toast.error(message);
    }
  };
};
