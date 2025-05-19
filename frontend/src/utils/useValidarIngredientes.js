import axiosInstance from "../utils/axiosInstance";


export const useValidarIngredientes = () => {
  const validarIngredientes = async (datos, modoIngredientes, imagen) => {
    // Crear FormData para validar ingredientes
    const formDataValidar = new FormData();
    formDataValidar.append("restricciones", datos.restricciones);
    if (modoIngredientes === "texto") {
      formDataValidar.append("ingredientes", datos.ingredientes);
    } else if (modoIngredientes === "imagen" && imagen) {
      formDataValidar.append("imagen", imagen);
    }
    // Enviar solicitud al backend para validar ingredientes
    const response = await axiosInstance.post("/validar-ingredientes", formDataValidar);
    return response.data;
  };

  return { validarIngredientes };
};