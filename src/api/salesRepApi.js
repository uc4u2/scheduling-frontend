import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const salesRepApi = axios.create({
  baseURL: `${API_URL}/sales`,
});

salesRepApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("salesRepToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

salesRepApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const errCode = error?.response?.data?.error;
    if (status === 401 && typeof window !== "undefined") {
      const path = window.location?.pathname || "";
      if (!path.startsWith("/sales/login")) {
        window.location.assign("/sales/login");
      }
    }
    if (status === 403 && errCode === "agreement_required" && typeof window !== "undefined") {
      const path = window.location?.pathname || "";
      if (!path.startsWith("/sales/agreement")) {
        window.location.assign("/sales/agreement");
      }
    }
    return Promise.reject(error);
  }
);

export default salesRepApi;
