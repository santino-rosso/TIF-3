import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:8000/api",
});

// Interceptor para agregar el token JWT automáticamente
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
