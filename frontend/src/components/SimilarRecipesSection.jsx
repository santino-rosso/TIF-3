import { RecipeFavoriteButton } from './RecipeFavoriteButton';
import { RecipeImagePreview } from './RecipeImageDisplay';
import { formatearReceta } from '../utils/recipeFormatter';
import { extraerTituloReceta } from '../utils/recipeTitle';
import { API_BASE_URL } from '../utils/axiosInstance';
import { ChefHat, Repeat } from 'lucide-react';

const SimilarRecipesSection = ({
  similares,
  guardadasSimilares,
  onToggleFavorite,
  onCookingMode,
  onOpenImage,
}) => {
  if (!similares || similares.length === 0) return null;

  return (
    <>
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Recetas Similares</h3>
        <p className="text-gray-600">Otras opciones que podrían interesarte</p>
        <div className="w-24 h-1 bg-green-500 mx-auto mt-3 rounded-full"></div>
      </div>

      <div className="similar-grid">
        {similares.map((rec, idx) => (
          <div key={idx} className="receta-card bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
            {/* Header de receta similar */}
            <div className="bg-green-500 px-5 py-3 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Repeat className="w-6 h-6 text-white" />
                  Receta Alternativa {idx + 1}
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => onCookingMode(rec)}
                    className="flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span className="hidden sm:inline">Modo Cocina</span>
                    <span className="sm:hidden">Cocinar</span>
                  </button>
                  <RecipeFavoriteButton
                    isSaved={guardadasSimilares[idx]}
                    onClick={() => onToggleFavorite(rec._id, idx)}
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
                onOpen={() => onOpenImage(rec, idx)}
              />
            )}

            {/* Contenido de receta similar */}
            <div className="p-5">
              <div className="receta-container bg-gray-50 rounded-lg p-6">
                <div className="texto-receta text-gray-800 leading-relaxed">
                  {formatearReceta(rec.texto_receta)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default SimilarRecipesSection;
