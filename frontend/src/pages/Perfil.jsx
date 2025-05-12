import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";

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
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Tu Perfil</h2>

      <p className="mb-4"><strong>Email:</strong> {email}</p>

      <form onSubmit={handleChangePassword} className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">Nueva Contraseña</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full p-2 border rounded mb-3"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Cambiar Contraseña
        </button>
      </form>

      <button
        onClick={handleEliminarCuenta}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Eliminar Cuenta
      </button>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
};

export default Perfil;
