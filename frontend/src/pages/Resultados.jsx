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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 border-4 border-t-green-500 border-green-200 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Preparando tu receta</h2>
            <p className="text-gray-600">Estamos cocinando algo delicioso para ti...</p>
            <div className="mt-4 flex justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado de no encontrada
  if (estado === "no_encontrada") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Ups! No encontramos tu receta</h2>
            <p className="text-gray-600 mb-4">Parece que no hay ninguna receta generada.</p>
            <p className="text-sm text-gray-500 mb-6">Te redirigiremos al inicio para que puedas crear una nueva receta.</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <Navbar />
      
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              ¡Tu receta está lista! 
              <span className="text-2xl md:text-3xl ml-2">🎉</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Hemos preparado una deliciosa receta personalizada para ti
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <RecetaCard receta={receta.receta_generada} similares={receta.recetas_similares} />
        
        {/* Back to Home Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => {
              localStorage.removeItem("recetaGenerada");
              navigate("/");
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear otra receta
          </button>
        </div>
      </div>

      {/* Footer decorativo */}
      <div className="mt-16 py-8 bg-gradient-to-r from-green-500 to-blue-500">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-white text-lg font-medium">
            ¡Esperamos que disfrutes cocinando! 👨‍🍳✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default Resultados;

