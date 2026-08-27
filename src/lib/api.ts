import axios from "axios";
import { useAuthStore } from "@/store/auth-store";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/backend/api",
  timeout: 12000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.assign(`/login?reason=session-expired`);
      }
    }
    const message = error.response?.data?.message ?? error.message ?? "Terjadi gangguan layanan";
    return Promise.reject(new Error(message));
  },
);
