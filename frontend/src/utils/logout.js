
export const logout = (navigate) => {
    localStorage.removeItem("token");
    localStorage.removeItem("token_refresh");
    localStorage.removeItem("recetaGenerada");
    navigate("/login");
  };