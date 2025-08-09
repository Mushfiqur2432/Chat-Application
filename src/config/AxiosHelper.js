import axios from "axios";

// Base URL for your backend
export const baseURL = "http://localhost:8080";

// Create axios instance with default configuration
const api = axios.create({
  baseURL: baseURL,
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Include credentials for CORS
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log("=== AXIOS REQUEST ===");
    console.log("URL:", config.url);
    console.log("Method:", config.method);
    console.log("Data:", config.data);
    console.log("Headers:", config.headers);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log("=== AXIOS RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Data:", response.data);
    return response;
  },
  (error) => {
    console.error("=== AXIOS ERROR ===");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);
    return Promise.reject(error);
  }
);

export default api;
