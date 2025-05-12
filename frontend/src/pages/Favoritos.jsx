import { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar";


const Favoritos = () => {
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarFavoritos = async () => {
    try {
      const res = await axiosInstance.get("/favoritos");
      setFavoritos(res.data.favoritos);
    } catch (error) {
      console.error("Error al cargar favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFavoritos();
  }, []);

  const handleEliminar = async (id) => {
    try {
      await axiosInstance.delete(`/favoritos/${id}`);
      setFavoritos(prev => prev.filter(fav => fav._id !== id));
    } catch (error) {
      console.error("Error al eliminar favorito:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-lg text-gray-600">Cargando favoritos...</p>
      </div>
    );
  }

  if (favoritos.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Navbar />
        <h2 className="text-2xl font-bold text-green-700 mb-4">Tus Recetas Favoritas</h2>
        <p className="text-lg text-gray-600">Aún no tenés recetas guardadas.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
        <Navbar />
        <h2 className="text-2xl font-bold text-green-700 mb-4">Tus Recetas Favoritas</h2>
        {favoritos.map((receta) => (
            <div key={receta._id} className="bg-white rounded shadow p-4 mb-4 relative">
            <pre className="whitespace-pre-wrap">{receta.texto_receta}</pre>
            <button
                onClick={() => handleEliminar(receta._id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
                🗑 Eliminar
            </button>
            </div>
        ))}
    </div>
  );
};

export default Favoritos;
