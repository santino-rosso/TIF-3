import { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar";
import RecetaCard from '../components/RecetaCard';


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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <Navbar />
        <div className="max-w-2xl mx-auto py-16 px-4 flex flex-col items-center justify-center">
          <h2 className="text-3xl font-bold text-green-700 mb-4 text-center">Tus Recetas Favoritas</h2>
          <p className="text-lg text-gray-600 mb-8 text-center">Aún no tenés recetas guardadas.</p>
          <img src="/vite.svg" alt="Sin favoritos" className="w-32 opacity-60" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <Navbar />
      <div className="max-w-5xl mx-auto py-10 px-2 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-green-700 mb-8 text-center">Tus Recetas Favoritas</h2>
        <div className="flex flex-col gap-8">
          {favoritos.map((receta) => (
            <div key={receta._id} className="relative group bg-white rounded-2xl shadow-lg border border-green-100 p-6 flex flex-col transition-transform hover:scale-[1.02]">
              <div className="flex-1 flex flex-col">
                {RecetaCard ? (
                  <RecetaCard receta={receta} tipo="favorita" />
                ) : (
                  <pre className="whitespace-pre-wrap text-gray-700 text-base mt-2">{receta.texto_receta}</pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Favoritos;
