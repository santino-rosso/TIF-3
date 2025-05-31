import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import RecetaCard from "../components/RecetaCard";
import Navbar from "../components/Navbar";

const Recomendaciones = () => {
  const [recetas, setRecetas] = useState([]);

  useEffect(() => {
    axiosInstance.get("/recetas-recomendadas")
      .then(res => setRecetas(res.data.recomendadas))
      .catch(() => setRecetas([]));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <Navbar />
      <div className="max-w-5xl mx-auto py-10 px-2 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-green-700 mb-8 text-center">Recomendaciones para ti</h2>
        {recetas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-lg text-gray-600 mb-6">No hay recomendaciones disponibles en este momento.</p>
            <img src="/vite.svg" alt="Sin recomendaciones" className="w-32 opacity-60" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {recetas.map(receta => (
              <div key={receta._id} className="w-full max-w-2xl mx-auto">
                <RecetaCard receta={receta} tipo="recomendada" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recomendaciones;