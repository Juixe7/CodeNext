import axios from "axios";

const isBrowser = typeof window !== "undefined";
const isLocalhost = isBrowser && (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
);

// Always use Render backend unless explicitly running on localhost
const baseURL = isLocalhost
  ? "http://localhost:3000"
  : "https://roadcode-a-coding-platform.onrender.com";

console.log("🌐 Axios baseURL:", baseURL);

const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

axiosClient.interceptors.request.use(
  (config) => {
    console.log("📤 Making request to:", config.baseURL + config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => {
    console.log("✅ Response received:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ Response error:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
    });
    return Promise.reject(error);
  }
);

export default axiosClient;
