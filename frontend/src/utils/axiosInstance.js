import axios from "axios";
import { refreshAccessToken } from "../utils/auth";
import { Navigate } from "react-router-dom";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api",
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

// Agregar el token en cada request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejo del 401 con refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(async (resolve, reject) => {
        const newToken = await refreshAccessToken();

        if (newToken) {
          axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          resolve(axiosInstance(originalRequest));
        } else {
          processQueue(new Error("No se pudo refrescar el token"), null);
          Navigate("/login");
          reject(error);
        }

        isRefreshing = false;
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;


