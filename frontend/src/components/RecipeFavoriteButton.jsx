const HeartIcon = ({ isSaved, className }) => (
  <svg className={className} fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

export const RecipeFavoriteButton = ({ isSaved, onClick, variant = 'main' }) => {
  const savedClasses = isSaved
    ? 'bg-red-500 hover:bg-red-600 text-white'
    : 'bg-white hover:bg-gray-200 text-green-600';

  if (variant === 'similar') {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all ${savedClasses}`}
      >
        <HeartIcon isSaved={isSaved} className="w-4 h-4" />
        <span className="hidden sm:inline">
          {isSaved ? 'Guardada' : 'Guardar'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${savedClasses}`}
    >
      <HeartIcon isSaved={isSaved} className="w-5 h-5" />
      <span className="hidden sm:inline">
        {isSaved ? 'Quitar de favoritos' : 'Guardar como favorita'}
      </span>
      <span className="sm:hidden">
        {isSaved ? 'Quitar' : 'Guardar'}
      </span>
    </button>
  );
};
