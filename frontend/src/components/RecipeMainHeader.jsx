import { RecipeFavoriteButton } from './RecipeFavoriteButton';
import { ChefHat } from 'lucide-react';

const RecipeMainHeader = ({ tipo = "generada", isSaved, onCookingMode, onToggleFavorite }) => {
  return (
    <div className="bg-green-500 px-6 py-4 rounded-t-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          {tipo === "generada" ? (
            <>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <ChefHat className="w-8 h-8 text-white" />
                Tu Receta Personalizada
              </h2>
              <p className="text-green-100 text-sm">Creada especialmente para vos</p>
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
            onClick={onCookingMode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-blue-500 hover:bg-blue-600 text-white"
          >
            <ChefHat className="w-5 h-5" />
            <span className="hidden sm:inline">Modo Cocina</span>
            <span className="sm:hidden">Cocinar</span>
          </button>
          <RecipeFavoriteButton
            isSaved={isSaved}
            onClick={onToggleFavorite}
          />
        </div>
      </div>
    </div>
  );
};

export default RecipeMainHeader;
