import axios from "axios";

export const bookingApi = axios.create({
  baseURL: import.meta.env.VITE_BOOKING_API_URL ?? "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

bookingApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

bookingApi.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("authUser");
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  },
);
