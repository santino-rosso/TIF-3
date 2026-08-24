import { ImageIcon } from 'lucide-react';

const RecipeImageBadge = () => (
  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
    <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
      <ImageIcon className="w-4 h-4" />
      Imagen generada con IA
    </span>
  </div>
);

const RecipeImageHint = () => (
  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
    <span className="text-white text-xs">Clic para ampliar</span>
  </div>
);

export const RecipeImagePreview = ({ imageUrl, alt, className, loading, style, onOpen }) => (
  <div className="relative">
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading={loading}
      style={style}
      onClick={onOpen}
    />
    <RecipeImageBadge />
    <RecipeImageHint />
  </div>
);

export const RecipeImageModal = ({ imageUrl, alt, title, onClose }) => (
  <div
    className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6"
    style={{ margin: 0 }}
    onClick={onClose}
  >
    <div className="relative w-fit max-w-full">
      <img
        src={imageUrl}
        alt={alt}
        className="w-auto max-w-full max-h-[80vh] sm:max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 max-w-[calc(100%-1rem)]">
        <p className="text-xs sm:text-sm font-medium text-gray-800 break-words">{title}</p>
        <p className="text-[10px] sm:text-xs text-gray-600 flex items-center gap-1 mt-0.5 sm:mt-1">
          <ImageIcon className="w-3 h-3 shrink-0" />
          Imagen generada con IA
        </p>
      </div>

      <button
        onClick={onClose}
        aria-label="Cerrar imagen"
        className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 hover:bg-white active:bg-gray-200 text-gray-800 rounded-full p-2.5 shadow-lg transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
);
