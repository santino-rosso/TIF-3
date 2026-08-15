import { useState, useEffect } from "react";
import { esFormularioRecetaValido } from "../utils/recipeFormValidation";

export const useFormularioReceta = ({ setImagen, cerrarCamara, planError, imagen }) => {
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

  useEffect(() => {
    if (planError) {
      console.error("Error al cargar plan:", planError);
    }
  }, [planError]);

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleModoChange = (e) => {
    setModoIngredientes(e.target.value);
    setDatos((prev) => ({ ...prev, ingredientes: "" }));
    setImagen(null);
    cerrarCamara();
  };

  const formularioValido = esFormularioRecetaValido({ datos, modoIngredientes, imagen });

  return {
    modoIngredientes,
    setModoIngredientes,
    datos,
    setDatos,
    errores,
    setErrores,
    handleChange,
    handleModoChange,
    formularioValido,
  };
};

export default useFormularioReceta;