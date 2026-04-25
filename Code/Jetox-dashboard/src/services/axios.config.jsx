import axios from "axios";
import { clearAuthSession } from "../utils/authSession";

/** Public API base (Jitox-api). Set in `.env`: VITE_API_BASE_URL=http://localhost:4000 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

const getStoredToken = () =>
  localStorage.getItem("token") || localStorage.getItem("access_token");

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (
      body &&
      typeof body === "object" &&
      body.success === true &&
      Object.prototype.hasOwnProperty.call(body, "data")
    ) {
      response.data = body.data;
      response.apiMessage = typeof body.message === "string" ? body.message : "";
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      clearAuthSession();
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
      ) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
