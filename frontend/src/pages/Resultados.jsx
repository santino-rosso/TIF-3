import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RecetaCard from "../components/RecetaCard";
import Navbar from "../components/Navbar";

const Resultados = () => {
  const [receta, setReceta] = useState(null);
  const [estado, setEstado] = useState("cargando"); // 'cargando' | 'lista' | 'no_encontrada'
  const navigate = useNavigate();

  useEffect(() => {
    const recetaGuardada = localStorage.getItem("recetaGenerada");
    if (recetaGuardada) {
      try {
        const parsedReceta = JSON.parse(recetaGuardada);
        if (parsedReceta?.receta_generada) {
          setReceta(parsedReceta);
          setEstado("lista");
        } else {
          setEstado("no_encontrada");
          setTimeout(() => navigate("/"), 5000);
        }
      } catch (err) {
        console.error("Error al parsear receta guardada:", err);
        setEstado("no_encontrada");
        setTimeout(() => navigate("/"), 5000);
      }
    } else {
      setEstado("no_encontrada");
      setTimeout(() => navigate("/"), 5000);
    }
  }, [navigate]);


  // Estado de carga
  if (estado === "cargando") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300">Cargando tu receta...</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Estamos preparando algo delicioso</p>
      </div>
    );
  }

  // Estado de no encontrada
  if (estado === "no_encontrada") {
    return (
      <div className="flex items-center justify-center h-screen flex-col text-center px-4">
          <p className="text-lg mb-2">No se ha generado ninguna receta</p>
          <p className="text-sm text-gray-500">Redirigiendo al inicio para que puedas intentarlo de nuevo...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Navbar />
      <RecetaCard receta={receta.receta_generada} similares={receta.recetas_similares} />
    </div>
  );
};

export default Resultados;

