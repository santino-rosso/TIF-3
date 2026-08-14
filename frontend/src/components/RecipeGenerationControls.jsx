const RecipeGenerationControls = ({ loading, errors, isFormValid }) => (
  <>
    {loading && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="flex flex-col items-center bg-white rounded-lg p-6 shadow-xl">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-700 text-lg font-medium">Generando receta...</p>
        </div>
      </div>
    )}

    {errors.length > 0 && (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <div className="flex items-center mb-2">
          <span className="text-lg">⚠️</span>
          <span className="ml-2 font-semibold">Error:</span>
        </div>
        <ul className="list-disc list-inside space-y-1">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      </div>
    )}

    <div className="pt-4">
      <button
        type="submit"
        disabled={loading || !isFormValid}
        className={`w-full font-bold py-4 px-6 rounded-lg text-lg transition-colors transform focus:outline-none focus:ring-4 shadow-lg ${
          !isFormValid
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white hover:scale-[1.02] focus:ring-green-300'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Generando...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <span className="mr-2">🍳</span>
            Generar Receta
          </span>
        )}
      </button>
    </div>
  </>
);

export default RecipeGenerationControls;
