import { API_BASE_URL } from '../utils/apiConfig';

export const CompletionCard = ({ recipe, titulo, onClose, onExit }) => {
  return (
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
        <p>¡Felicitaciones! Has terminado de cocinar {titulo}</p>

        {/* Mostrar imagen de la receta si existe */}
        {recipe.imagen_id && (
          <div className="completion-image">
            <img
              src={`${API_BASE_URL}/imagenes/${recipe.imagen_id}`}
              alt={`Imagen de ${titulo}`}
              className="recipe-completion-image"
            />
            <div className="image-caption">
              <span>📸 Imagen generada con IA</span>
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
  );
};

export default CompletionCard;
