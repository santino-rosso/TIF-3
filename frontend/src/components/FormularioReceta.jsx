import { useState, useEffect } from "react";
import { esFormularioRecetaValido } from "../utils/recipeFormValidation";
import { useIngredientImageInput } from "../hooks/useIngredientImageInput";
import { usePlanInfo } from "../hooks/usePlanInfo";
import { useRecipeGenerationSubmit } from "../hooks/useRecipeGenerationSubmit";
import IngredientInputSection from "./IngredientInputSection";
import RecipeAdditionalFieldsGrid from "./RecipeAdditionalFieldsGrid";
import RecipePlanNotice from "./RecipePlanNotice";

const FormularioReceta = () => {
  const [modoIngredientes, setModoIngredientes] = useState("imagen"); 
  const [datos, setDatos] = useState({
    preferencias: "",
    restricciones: "",
    tiempo: "",
    tipo_comida: "",
    herramientas: "",
    experiencia: "",
    ingredientes: "",
  });
  const [errores, setErrores] = useState([]);
  const {
    imagen,
    setImagen,
    mostrarCamara,
    stream,
    imagenPreviewUrl,
    videoRef,
    canvasRef,
    handleImagen,
    iniciarCamara,
    capturarFoto,
    cerrarCamara,
  } = useIngredientImageInput({
    onCameraReady: () => setErrores([]),
    onCameraError: (message) => setErrores([message]),
  });
  const {
    plan: planInfo,
    actualizarEstadisticas: actualizarPlanInfo,
    cargarPlanInfo,
    error: planError,
  } = usePlanInfo();

  useEffect(() => {
    if (planError) {
      console.error("Error al cargar plan:", planError);
    }
  }, [planError]);

  const { loading, handleSubmit } = useRecipeGenerationSubmit({
    datos,
    modoIngredientes,
    imagen,
    setDatos,
    setErrores,
    actualizarPlanInfo,
    cargarPlanInfo,
  });

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleModoChange = (e) => {
    setModoIngredientes(e.target.value);
    // Limpiar campos al cambiar modo
    setDatos((prev) => ({ ...prev, ingredientes: "" }));
    setImagen(null);
    // Cerrar cámara si está abierta
    cerrarCamara();
  };

  const formularioValido = esFormularioRecetaValido({ datos, modoIngredientes, imagen });

  return (
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Información del Plan */}
        <RecipePlanNotice planInfo={planInfo} />
        
        {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="flex flex-col items-center bg-white rounded-lg p-6 shadow-xl">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-700 text-lg font-medium">Generando receta...</p>
          </div>
        </div>
        )}

        <IngredientInputSection
          modoIngredientes={modoIngredientes}
          ingredientes={datos.ingredientes}
          imagen={imagen}
          imagenPreviewUrl={imagenPreviewUrl}
          mostrarCamara={mostrarCamara}
          stream={stream}
          videoRef={videoRef}
          canvasRef={canvasRef}
          onModoChange={handleModoChange}
          onIngredientesChange={handleChange}
          onImagenChange={handleImagen}
          onClearImagen={() => setImagen(null)}
          onIniciarCamara={iniciarCamara}
          onCapturarFoto={capturarFoto}
          onCerrarCamara={cerrarCamara}
        />

        <RecipeAdditionalFieldsGrid datos={datos} onChange={handleChange} />

        {/* Errores */}
        {errores.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-lg">⚠️</span>
              <span className="ml-2 font-semibold">Error:</span>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {errores.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Botón de envío */}
        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading || !formularioValido}
            className={`w-full font-bold py-4 px-6 rounded-lg text-lg transition-colors transform focus:outline-none focus:ring-4 shadow-lg ${
              !formularioValido
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
      </form>
  );
};

export default FormularioReceta;
