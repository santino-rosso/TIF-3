import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import RecetaCard from "../components/RecetaCard";

const Recomendaciones = () => {
  const [recetas, setRecetas] = useState([]);

  useEffect(() => {
    axiosInstance.get("/recetas-recomendadas")
      .then(res => setRecetas(res.data.recomendadas))
      .catch(() => setRecetas([]));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Recomendaciones para ti</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recetas.map(receta => (
          <RecetaCard key={receta._id} receta={receta} />
        ))}
      </div>
    </div>
  );
};

export default Recomendaciones;