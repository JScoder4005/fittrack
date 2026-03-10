import axios from "axios";
import { toast } from "sonner";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Auto-toast on API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Something went wrong";
    toast.error(message);
    return Promise.reject(error);
  }
);
