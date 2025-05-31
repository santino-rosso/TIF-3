import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar";

const Perfil = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Obtener datos del usuario logueado
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/read");
        setEmail(res.data.email);
      } catch (err) {
        console.error("Error al cargar perfil:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await axiosInstance.put("/update", {
        new_password: newPassword,
      });
      setMessage("✅ Contraseña actualizada con éxito.");
      setNewPassword("");
    } catch (err) {
      setMessage("❌ Error al cambiar la contraseña.");
    }
  };

  const handleEliminarCuenta = async () => {
    if (!window.confirm("¿Estás seguro de que querés eliminar tu cuenta? Esta acción es irreversible.")) return;
    try {
        await axiosInstance.delete("delete");
            setMessage("✅ Cuenta eliminada con éxito.");
        localStorage.clear();
        navigate("/login");
    } catch (err) {
        console.error("Error al eliminar la cuenta:", err);
        setMessage("❌ No se pudo eliminar la cuenta.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-2">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-green-100 p-8 mt-10 mb-10">
          <h2 className="text-3xl font-bold mb-6 text-green-700 text-center">Tu Perfil</h2>

          <div className="mb-6 text-center">
            <p className="text-gray-500 text-sm">Email de usuario</p>
            <span className="inline-block bg-green-100 text-green-700 rounded-full px-4 py-2 font-semibold text-base mb-2">
              {email}
            </span>
          </div>

          <form onSubmit={handleChangePassword} className="mb-8">
            <label className="block mb-2 text-sm font-medium text-gray-700">Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
              placeholder="Ingresá tu nueva contraseña"
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow"
            >
              Cambiar Contraseña
            </button>
          </form>

          <button
            onClick={handleEliminarCuenta}
            className="w-full bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors shadow"
          >
            Eliminar Cuenta
          </button>

          {message && <p className={`mt-6 text-center text-base font-medium ${message.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default Perfil;
