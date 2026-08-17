import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";

const AdminRoute = () => {
  const [checking, setChecking] = useState(true);
  const [redirect, setRedirect] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!localStorage.getItem("token")) {
        setRedirect("/login");
        setChecking(false);
        return;
      }

      try {
        const response = await api.get("/read");
        setRedirect(response.data.is_admin === true ? null : "/");
      } catch (error) {
        setRedirect("/login");
      }

      setChecking(false);
    };

    checkAdmin();
  }, []);

  if (checking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Verificando permisos...</p>
      </div>
    );
  }

  return redirect ? <Navigate to={redirect} replace /> : <Outlet />;
};

export default AdminRoute;