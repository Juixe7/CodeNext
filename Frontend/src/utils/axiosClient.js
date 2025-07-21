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

// Render free-tier dynos sleep after 15 min of inactivity.
// Cold starts can take 30–60 seconds, so we use a generous timeout.
const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60s to survive Render cold starts
});

// Proactively wake the backend (fire-and-forget)
export const pingServer = () => {
  axios
    .get(`${baseURL}/health`, { timeout: 60000 })
    .then(() => console.log("✅ Server is awake"))
    .catch(() => console.log("⏳ Server is waking up..."));
};

axiosClient.interceptors.request.use(
  (config) => {
    console.log("📤 Making request to:", config.baseURL + config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Retry config – retry up to 3 times on cold-start timeouts / network errors
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

const isColdStartError = (error) =>
  !error.response &&
  (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK" || !error.code);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

axiosClient.interceptors.response.use(
  (response) => {
    console.log("✅ Response received:", response.status, response.config.url);
    return response;
  },
  async (error) => {
    const config = error.config || {};
    config.__retryCount = config.__retryCount || 0;

    const shouldRetry =
      isColdStartError(error) && config.__retryCount < MAX_RETRIES;

    if (shouldRetry) {
      config.__retryCount += 1;
      console.warn(
        `⏳ Server cold-start detected. Retry ${config.__retryCount}/${MAX_RETRIES} in ${RETRY_DELAY_MS / 1000}s...`
      );
      await sleep(RETRY_DELAY_MS);
      return axiosClient(config);
    }

    console.error("❌ Response error:", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
    });

    // Handle expired JWT — redirect to login with a toast
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/user/check') ||
                          error.config?.url?.includes('/user/login') ||
                          error.config?.url?.includes('/user/register');
      if (!isAuthRoute && typeof window !== 'undefined') {
        // Dynamically import toast to avoid circular deps
        import('react-hot-toast').then(({ default: toast }) => {
          toast.error('Session expired — please log in again.', { id: 'session-expired' });
        });
        setTimeout(() => { window.location.href = '/login'; }, 1500);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
