import { authApi } from "./api";

export const authService = {
  register: (data) => authApi.register(data),
  loginUser: (data) => authApi.login(data),
  forgotPassword: (data) => authApi.forgotPassword(data),
  verifyCode: (data) => authApi.verifyCode(data),
  resetPassword: (data) => authApi.resetPassword(data),
};
