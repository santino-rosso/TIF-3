import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

export const logout = async (navigate) => {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("token_refresh");

  try {
    if (token && refreshToken) {
      await axios.post(`${API_BASE_URL}/logout`, {
        refresh_token: refreshToken
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  } catch (error) {
    console.error("Error al cerrar sesión", error);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("token_refresh");
    localStorage.removeItem("recetaGenerada");
    navigate("/login");
  }
};
