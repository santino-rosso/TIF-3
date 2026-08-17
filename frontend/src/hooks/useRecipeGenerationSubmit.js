import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { confirmarIngredientes } from "../utils/confirmarIngredientes.jsx";
import { calcularPorcentajeUso } from "../utils/planStats";
import { validarFormularioReceta } from "../utils/recipeFormValidation";
import { useValidarIngredientes } from "../utils/useValidarIngredientes";

export const useRecipeGenerationSubmit = ({
  datos,
  modoIngredientes,
  imagen,
  setDatos,
  setErrores,
  actualizarPlanInfo,
  cargarPlanInfo,
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { validarIngredientes: validarIngredientesHook } = useValidarIngredientes();

  const verificarLimiteGeneracion = async () => {
    const res = await axiosInstance.get("/verificar-limite");
    const limite = res.data;

    actualizarPlanInfo((prev) => ({
      ...prev,
      generaciones_usadas: limite.generaciones_usadas,
      generaciones_restantes: limite.restantes,
      limite_generaciones: limite.limite,
      porcentaje_uso: calcularPorcentajeUso({
        generaciones_usadas: limite.generaciones_usadas,
        limite_generaciones: limite.limite,
      }),
    }));

    return limite;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const nuevosErrores = validarFormularioReceta({ datos, modoIngredientes, imagen });
    if (nuevosErrores.length > 0) {
      setErrores(nuevosErrores);
      setLoading(false);
      return;
    }

    setErrores([]);

    try {
      const limite = await verificarLimiteGeneracion();
      if (!limite.puede_generar) {
        // Límite alcanzado: no mostramos error, solo abortamos
        await cargarPlanInfo();
        setErrores([]);
        return;
      }

      const ingredientesRes = await validarIngredientesHook(datos, modoIngredientes, imagen);
      let ingredientesFinales = "";

      if (ingredientesRes.ingredientes_no_aprobados) {
        const confirmados = await confirmarIngredientes(ingredientesRes.ingredientes_no_aprobados);
        const ingredientesValidos = ingredientesRes.ingredientes.filter(ingrediente => {
          const esNoAprobado = ingredientesRes.ingredientes_no_aprobados.some(
            ([ingredienteNoAprobado]) => ingredienteNoAprobado === ingrediente
          );

          if (!esNoAprobado) {
            return true;
          }

          return confirmados.includes(ingrediente);
        });

        ingredientesFinales = ingredientesValidos.join(", ");
      } else {
        ingredientesFinales = ingredientesRes.ingredientes_validados.join(", ");
      }

      setDatos((prev) => ({ ...prev, ingredientes: ingredientesFinales }));

      const formDataGenerar = new FormData();
      Object.entries(datos).forEach(([key, value]) => {
        if (key !== "ingredientes") {
          formDataGenerar.append(key, value);
        }
      });
      formDataGenerar.append("ingredientes", ingredientesFinales);

      const recetaRes = await axiosInstance.post("/generar-receta", formDataGenerar);
      localStorage.setItem("recetaGenerada", JSON.stringify(recetaRes.data));
      navigate("/resultados");
    } catch (err) {
      if (err.response?.data?.tipo === "limite_alcanzado") {
        const errorData = err.response.data;
        setErrores([
          `${errorData.error}: ${errorData.detalle}`,
          `Has usado ${errorData.generaciones_usadas} de ${errorData.limite} recetas en tu período actual.`
        ]);
      } else {
        const mensajeError = err.response?.data?.error || "Error al generar la receta. Por favor, intenta nuevamente.";
        setErrores([mensajeError]);
      }
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleSubmit };
};
