import { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import RecetaCard from "../components/RecetaCard";
import Navbar from "../components/Navbar";
import EmptyState from "../components/EmptyState";

const Recomendaciones = () => {
  const [recetas, setRecetas] = useState([]);

  useEffect(() => {
    axiosInstance.get("/recetas-recomendadas")
      .then(res => setRecetas(res.data.recomendadas))
      .catch(() => setRecetas([]));
  }, []);

  if (recetas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <Navbar />
        <div className="max-w-2xl mx-auto py-16 px-4 flex flex-col items-center justify-center">
          <h2 className="text-3xl font-bold text-green-700 mb-4 text-center">Recomendaciones</h2>
          <EmptyState
            message="No hay recomendaciones disponibles en este momento"
            imageAlt="Sin recomendaciones"
            className="flex flex-col items-center justify-center"
            messageClassName="text-lg text-gray-600 mb-8 text-center"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-green-700 mb-8 text-center">Recomendaciones</h2>
        <div className="flex flex-col gap-8">
          {recetas.map(receta => (
            <div key={receta._id} className="w-full">
              <RecetaCard receta={receta} tipo="recomendada" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recomendaciones;
