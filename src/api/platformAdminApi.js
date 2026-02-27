import axios from "axios";
import { API_BASE_URL } from "../utils/api";

const platformAdminApi = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/$/, "")}/platform-admin`,
  withCredentials: false,
});

platformAdminApi.interceptors.request.use((config) => {
  const token =
    typeof localStorage !== "undefined" &&
    localStorage.getItem("platformAdminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.headers && config.headers["X-Company-Id"]) {
    delete config.headers["X-Company-Id"];
  }
  return config;
});

platformAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data || {};
    const code = data.code || data.error_code || data.error;
    if (code === "TENANT_DISABLED" || code === "USER_DISABLED") {
      error.normalized = {
        code,
        message: data.message || data.user_message || data.error || "Account access denied.",
        status: error?.response?.status || 403,
      };
    }
    return Promise.reject(error);
  }
);

export default platformAdminApi;
