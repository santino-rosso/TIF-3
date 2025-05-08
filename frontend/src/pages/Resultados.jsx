import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RecetaCard from "../components/RecetaCard";

const Resultados = () => {
  const [receta, setReceta] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const recetaGuardada = localStorage.getItem("recetaGenerada");
    if (recetaGuardada) {
      try {
        const parsedReceta = JSON.parse(recetaGuardada);
        setReceta(parsedReceta);
      } catch (err) {
        console.error("Error al parsear receta guardada:", err);
      }
    }
  }, []);

  const handleBorrar = () => {
    localStorage.removeItem("recetaGenerada");
    navigate("/"); // Redirige al inicio
  };

  // Estado de carga
  if (!receta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300">Cargando tu receta...</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Estamos preparando algo delicioso</p>
      </div>
    );
  }

  // Luego verifica si tiene la propiedad receta_generada
  if (!receta.receta_generada) {
    return <div className="text-center mt-10 text-lg">No se ha generado ninguna receta. Vuelva a intentarlo.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <RecetaCard receta={receta.receta_generada} similares={receta.recetas_similares} />
    
      <div className="text-center">
        <button onClick={handleBorrar} className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default Resultados;

