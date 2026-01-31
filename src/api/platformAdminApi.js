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

export default platformAdminApi;
