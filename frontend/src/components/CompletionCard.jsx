import { API_BASE_URL } from '../utils/apiConfig';
import { Image } from 'lucide-react';
import { RecipeImageModal } from './RecipeImageDisplay';
import { useState } from 'react';

export const CompletionCard = ({ recipe, titulo, onClose, onExit }) => {
  const [showImageModal, setShowImageModal] = useState(false);

  const openImage = () => setShowImageModal(true);
  const closeImageModal = () => setShowImageModal(false);

  return (
    <>
      <div
        className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/80"
        style={{ margin: 0, padding: 0 }}
        onClick={onClose}
      >
        <div
          className="completion-card"
          onClick={(e) => e.stopPropagation()}
        >
          <h3>¡Receta completada!</h3>
          <p>Has terminado de cocinar {titulo}</p>

          {/* Mostrar imagen de la receta si existe */}
          {recipe.imagen_id && (
            <div className="completion-image relative">
              <img
                src={`${API_BASE_URL}/imagenes/${recipe.imagen_id}`}
                alt={`Imagen de ${titulo}`}
                className="recipe-completion-image cursor-pointer"
                onClick={openImage}
              />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
                  <Image className="w-4 h-4" aria-hidden="true" />
                  Imagen generada con IA
                </span>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="completion-actions">
            <button
              onClick={onClose}
              className="btn-previous"
            >
              Volver
            </button>

            <button onClick={onExit} className="btn-finish">
              Finalizar cocina
            </button>
          </div>
        </div>
      </div>

      {showImageModal && recipe.imagen_id && (
        <RecipeImageModal
          imageUrl={`${API_BASE_URL}/imagenes/${recipe.imagen_id}`}
          alt={`Imagen de ${titulo}`}
          title={titulo}
          onClose={closeImageModal}
        />
      )}
    </>
  );
};

export default CompletionCard;
