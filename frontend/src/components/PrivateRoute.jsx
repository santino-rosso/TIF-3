import { Navigate, Outlet } from "react-router-dom";
import jwtDecode from "jwt-decode";


const isTokenValid = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000; // en segundos
      return decoded.exp && decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
};

const PrivateRoute = () => {
  const token = localStorage.getItem("token");

  const isAuthenticated = token && isTokenValid(token);

  if (!isAuthenticated) {
    localStorage.removeItem("token");
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
