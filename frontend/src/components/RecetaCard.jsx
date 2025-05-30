import axiosInstance from "../utils/axiosInstance";
import { useEffect, useState } from "react";

const RecetaCard = ({ receta, similares }) => {
  const [guardadas, setGuardadas] = useState({
    principal: false,
    similares: similares ? new Array(similares.length).fill(false) : []
  });

  useEffect(() => {
    const cargarFavoritos = async () => {
      try {
        const res = await axiosInstance.get("/favoritos"); 
        const favoritosIds = res.data.favoritos.map((fav) => fav._id);

        const principalId = receta._id;
        const similaresIds = similares?.map(r => r._id) || [];

        const nuevasSimilares = similaresIds.map(id => favoritosIds.includes(id));
        const esFavoritoPrincipal = favoritosIds.includes(principalId);

        setGuardadas({
          principal: esFavoritoPrincipal,
          similares: nuevasSimilares
        });
      } catch (error) {
        console.error("Error al cargar favoritos del usuario:", error);
      }
    };

    cargarFavoritos();
  }, [receta, similares]);

  const toggleFavorito = async (recetaId, esPrincipal, index = -1) => {
    const yaGuardada = esPrincipal ? guardadas.principal : guardadas.similares[index];

    try {
      if (yaGuardada) {
        await axiosInstance.delete(`/favoritos/${recetaId}`);
      } else {
        await axiosInstance.post(`/favoritos/${recetaId}`);
      }

      if (esPrincipal) {
        setGuardadas(prev => ({ ...prev, principal: !yaGuardada }));
      } else {
        const nuevas = [...guardadas.similares];
        nuevas[index] = !yaGuardada;
        setGuardadas(prev => ({ ...prev, similares: nuevas }));
      }
    } catch (error) {
      console.error("Error al actualizar favorito:", error);
      alert("Hubo un problema al actualizar tus favoritos.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Receta Principal */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header de la receta */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🍳</span>
                Tu Receta Personalizada
              </h2>
              <p className="text-green-100 text-sm">Creada especialmente para ti</p>
            </div>
            <button
              onClick={() => toggleFavorito(receta._id, true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                guardadas.principal 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-white hover:bg-gray-50 text-green-600'
              }`}
            >
              <svg className="w-5 h-5" fill={guardadas.principal ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="hidden sm:inline">
                {guardadas.principal ? 'Quitar de favoritos' : 'Guardar como favorita'}
              </span>
              <span className="sm:hidden">
                {guardadas.principal ? 'Quitar' : 'Guardar'}
              </span>
            </button>
          </div>
        </div>

        {/* Contenido de la receta */}
        <div className="p-6">
          <div className="prose prose-gray max-w-none">
            <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-green-500">
              <pre className="text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                {receta.texto_receta || receta}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Recetas Similares */}
      {similares?.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Recetas Similares</h3>
            <p className="text-gray-600">Otras opciones que podrían interesarte</p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-3 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {similares.map((rec, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 overflow-hidden">
                {/* Header de receta similar */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span className="text-lg">👨‍🍳</span>
                      Receta Alternativa {idx + 1}
                    </h4>
                    <button
                      onClick={() => toggleFavorito(rec._id, false, idx)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                        guardadas.similares[idx] 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-white hover:bg-gray-50 text-blue-600'
                      }`}
                    >
                      <svg className="w-4 h-4" fill={guardadas.similares[idx] ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="hidden sm:inline">
                        {guardadas.similares[idx] ? 'Guardada' : 'Guardar'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Contenido de receta similar */}
                <div className="p-5">
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400">
                    <pre className="text-gray-800 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {rec.texto_receta}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecetaCard;
