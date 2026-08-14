import axiosInstance, { API_BASE_URL } from "../utils/axiosInstance";
import { useEffect, useState } from "react";
import { extraerTituloReceta } from "../utils/recipeTitle";
import "../styles/recetas.css";
import CookingMode from './CookingMode';
import { RecipeFavoriteButton } from './RecipeFavoriteButton';
import { RecipeImageModal, RecipeImagePreview } from './RecipeImageDisplay';
import { formatearReceta } from '../utils/recipeFormatter';
import {
  ChefHat,
  Repeat,
} from 'lucide-react';

const RecetaCard = ({ receta, similares, tipo = "generada" }) => {
  const [guardadas, setGuardadas] = useState({
    principal: false,
    similares: similares ? new Array(similares.length).fill(false) : []
  });
  const [showCookingMode, setShowCookingMode] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showSimilarImageModal, setShowSimilarImageModal] = useState({ show: false, recipe: null, index: null });

  // Extraer el título de la receta para usar en la imagen
  const tituloReceta = extraerTituloReceta(receta.texto_receta || receta);

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

  const startCookingMode = () => {
    // Solicitar permisos de notificación
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const recipeWithTitle = {
      ...receta,
      titulo: tituloReceta
    };

    setShowCookingMode(recipeWithTitle);
  };

  // Si está en modo cocina, mostrar el componente CookingMode
  if (showCookingMode) {
    return (
      <CookingMode 
        recipe={showCookingMode} 
        titulo={showCookingMode.titulo}
        onExit={() => setShowCookingMode(false)} 
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Receta Principal */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header de la receta */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              {tipo === "generada" ? (
                <>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ChefHat className="w-8 h-8 text-white" />
                    Tu Receta Personalizada
                  </h2>
                  <p className="text-green-100 text-sm">Creada especialmente para ti</p>
                </>
              ) : tipo === "favorita" ? (
                <>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ChefHat className="w-8 h-8 text-white" />
                    Receta guardada
                  </h2>
                  <p className="text-green-100 text-sm">Marcada como favorita por vos</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ChefHat className="w-8 h-8 text-white" />
                    Receta recomendada para vos
                  </h2>
                  <p className="text-green-100 text-sm">Sugerida según tus favoritas</p>
                </>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => startCookingMode()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <ChefHat className="w-5 h-5" />
                <span className="hidden sm:inline">Modo Cocina</span>
                <span className="sm:hidden">Cocinar</span>
              </button>
              <RecipeFavoriteButton
                isSaved={guardadas.principal}
                onClick={() => toggleFavorito(receta._id, true)}
              />
            </div>
          </div>
        </div>

        {/* Imagen SOLO para la receta generada */}
        {(tipo === "generada" || tipo === "favorita" || tipo === "recomendada") && receta.imagen_id && (
          <RecipeImagePreview
            imageUrl={`${API_BASE_URL}/imagenes/${receta.imagen_id}`}
            alt={`Imagen generada de ${tituloReceta}`}
            className="w-full h-64 sm:h-80 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
            style={{ borderBottom: "4px solid #22c55e" }}
            onOpen={() => setShowImageModal(true)}
          />
        )}

        {/* Contenido de la receta */}
        <div className="p-6">
          <div className="prose prose-gray max-w-none">
            <div className="receta-container bg-gray-50 rounded-lg p-6 border-l-4 border-green-500">
              <div className="texto-receta text-gray-800 leading-relaxed">
                {formatearReceta(receta.texto_receta || receta)}
              </div>
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
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto mt-3 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {similares.map((rec, idx) => (
              <div key={idx} className="receta-card bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 overflow-hidden">
                {/* Header de receta similar */}
                <div className="bg-gradient-to-r from-green-500 to-blue-500 px-5 py-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Repeat className="w-6 h-6 text-white" />
                      Receta Alternativa {idx + 1}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const recipeWithTitle = {
                            ...rec,
                            titulo: extraerTituloReceta(rec.texto_receta)
                          };
                          setShowCookingMode(recipeWithTitle);
                        }}
                        className="flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span className="hidden sm:inline">Modo Cocina</span>
                        <span className="sm:hidden">Cocinar</span>
                      </button>
                      <RecipeFavoriteButton
                        isSaved={guardadas.similares[idx]}
                        onClick={() => toggleFavorito(rec._id, false, idx)}
                        variant="similar"
                      />
                    </div>
                  </div>
                </div>

                {/* Imagen de la receta similar */}
                {rec.imagen_id && (
                  <RecipeImagePreview
                    imageUrl={`${API_BASE_URL}/imagenes/${rec.imagen_id}`}
                    alt={`Imagen generada de ${extraerTituloReceta(rec.texto_receta)}`}
                    className="w-full h-48 object-cover cursor-pointer hover:brightness-110 transition-all duration-300"
                    onOpen={() => setShowSimilarImageModal({ show: true, recipe: rec, index: idx })}
                  />
                )}

                {/* Contenido de receta similar */}
                <div className="p-5">
                  <div className="receta-container bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400">
                    <div className="texto-receta text-gray-800 leading-relaxed">
                      {formatearReceta(rec.texto_receta)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para mostrar imagen en tamaño completo */}
      {showImageModal && (tipo === "generada" || tipo === "favorita" || tipo === "recomendada") && receta.imagen_id && (
        <RecipeImageModal
          imageUrl={`${API_BASE_URL}/imagenes/${receta.imagen_id}`}
          alt={`Imagen generada de ${tituloReceta}`}
          title={tituloReceta}
          onClose={() => setShowImageModal(false)}
        />
      )}

      {/* Modal para mostrar imagen de receta similar en tamaño completo */}
      {showSimilarImageModal.show && showSimilarImageModal.recipe?.imagen_id && (
        <RecipeImageModal
          imageUrl={`${API_BASE_URL}/imagenes/${showSimilarImageModal.recipe.imagen_id}`}
          alt={`Imagen de ${extraerTituloReceta(showSimilarImageModal.recipe.texto_receta)}`}
          title={extraerTituloReceta(showSimilarImageModal.recipe.texto_receta)}
          onClose={() => setShowSimilarImageModal({ show: false, recipe: null, index: null })}
        />
      )}
    </div>
  );
};

export default RecetaCard;
