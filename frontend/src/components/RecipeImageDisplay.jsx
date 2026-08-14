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
    className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/80"
    style={{ margin: 0, padding: 0 }}
    onClick={onClose}
  >
    <div className="relative max-w-5xl w-full max-h-[90vh]">
      <img
        src={imageUrl}
        alt={alt}
        className="w-full max-h-[90vh] object-cover rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
          <ImageIcon className="w-3 h-3" />
          Imagen generada con IA
        </p>
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
);
