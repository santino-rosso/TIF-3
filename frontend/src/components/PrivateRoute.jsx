import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { isTokenExpired, refreshAccessToken } from "../utils/auth";

const PrivateRoute = () => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (token && !isTokenExpired(token)) {
        setIsAuthenticated(true);
      } else {
        const newToken = await refreshAccessToken();
        if (newToken) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Verificando autenticación...</p>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
