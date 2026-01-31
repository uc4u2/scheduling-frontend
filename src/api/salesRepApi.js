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

export default salesRepApi;
