import { useIngredientImageInput } from "../hooks/useIngredientImageInput";
import { usePlanInfo } from "../hooks/usePlanInfo";
import { useRecipeGenerationSubmit } from "../hooks/useRecipeGenerationSubmit";
import { useFormularioReceta } from "../hooks/useFormularioReceta";
import IngredientInputSection from "./IngredientInputSection";
import RecipeAdditionalFieldsGrid from "./RecipeAdditionalFieldsGrid";
import RecipeGenerationControls from "./RecipeGenerationControls";
import RecipePlanNotice from "./RecipePlanNotice";

const FormularioReceta = () => {
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

  const {
    modoIngredientes,
    datos,
    errores,
    handleChange,
    handleModoChange,
    formularioValido,
    setErrores,
    setDatos,
  } = useFormularioReceta({ setImagen, cerrarCamara, planError, imagen });

  const { loading, handleSubmit } = useRecipeGenerationSubmit({
    datos,
    modoIngredientes,
    imagen,
    setDatos,
    setErrores,
    actualizarPlanInfo,
    cargarPlanInfo,
  });

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
          limitReached={planInfo?.generaciones_restantes === 0}
        />
      </form>
  );
};

export default FormularioReceta;
