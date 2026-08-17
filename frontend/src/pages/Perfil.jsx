import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar";
import { Crown } from "lucide-react";

const Perfil = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const messageTimerRef = useRef(null);
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
    setModalMessage("");
    try {
      await axiosInstance.put("/update", {
        new_password: newPassword,
      });
      setMessage("Contraseña actualizada con éxito");
      setNewPassword("");
      setShowPasswordModal(false);
      // Auto-hide después de 5 segundos
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      messageTimerRef.current = setTimeout(() => setMessage(""), 5000);
    } catch {
      setModalMessage("Error al cambiar la contraseña");
    }
  };

  const handleEliminarCuenta = async () => {
    if (!window.confirm("¿Estás seguro de que querés eliminar tu cuenta? \n Esta acción es irreversible.")) return;
    try {
        await axiosInstance.delete("delete");
            setMessage("Cuenta eliminada con éxito.");
        localStorage.clear();
        navigate("/login");
    } catch (err) {
        console.error("Error al eliminar la cuenta:", err);
        setMessage("No se pudo eliminar la cuenta.");
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
            <span className="inline-block text-green-700 font-semibold text-base mb-2">
              {email}
            </span>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setModalMessage("");
                setShowPasswordModal(true);
              }}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow"
            >
              Cambiar Contraseña
            </button>

            <Link
              to="/planes"
              className="w-full bg-yellow-500 text-white hover:text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors shadow flex items-center justify-center gap-2"
            >
              <Crown className="w-5 h-5" />
              Mi Plan de Membresía
            </Link>

            <button
              onClick={handleEliminarCuenta}
              className="w-full bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors shadow"
            >
              Eliminar Cuenta
            </button>
          </div>

          {message && <p className={`mt-6 text-center text-base font-medium ${message.includes('éxito') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}
        </div>
      </div>

      {/* Modal Cambiar Contraseña */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Cambiar Contraseña</h3>
            {modalMessage && (
              <p className={`mb-4 text-center text-sm font-medium ${modalMessage.includes('éxito') ? 'text-green-600' : 'text-red-500'}`}>
                {modalMessage}
              </p>
            )}
            <form onSubmit={handleChangePassword}>
              <label className="block mb-2 text-sm font-medium text-gray-700">Nueva Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-green-400 mb-4 bg-white text-gray-700"
                placeholder="Ingresá tu nueva contraseña"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setNewPassword("");
                    setShowPasswordModal(false);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Perfil;
