import { jwtDecode } from "jwt-decode";
import axiosInstance from "../utils/axiosInstance";

export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; 
    return decoded.exp && currentTime > decoded.exp;
  } catch (error) {
    return true;
  }
};

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("token_refresh"); 
  if (!refreshToken) return null;

  try {
    const response = await axiosInstance.post("/refresh", {
      refresh_token: refreshToken
    });

    localStorage.setItem("token", response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.error("Error al refrescar el token", error);
    localStorage.removeItem("token");
    localStorage.removeItem("token_refresh");
    return null;
  }
};
