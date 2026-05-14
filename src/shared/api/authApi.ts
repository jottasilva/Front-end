import axios from "axios";

export const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
