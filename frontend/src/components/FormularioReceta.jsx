import { useState, useEffect } from "react";
import { esFormularioRecetaValido } from "../utils/recipeFormValidation";
import { useIngredientImageInput } from "../hooks/useIngredientImageInput";
import { usePlanInfo } from "../hooks/usePlanInfo";
import { useRecipeGenerationSubmit } from "../hooks/useRecipeGenerationSubmit";
import IngredientInputSection from "./IngredientInputSection";
import RecipeAdditionalFieldsGrid from "./RecipeAdditionalFieldsGrid";
import RecipeGenerationControls from "./RecipeGenerationControls";
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

        <RecipeGenerationControls
          loading={loading}
          errors={errores}
          isFormValid={formularioValido}
        />
      </form>
  );
};

export default FormularioReceta;
