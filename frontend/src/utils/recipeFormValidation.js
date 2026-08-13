export const validarFormularioReceta = ({ datos, modoIngredientes, imagen }) => {
  const nuevosErrores = [];

  if (!datos.ingredientes && modoIngredientes === "texto") {
    nuevosErrores.push("El campo 'ingredientes' es obligatorio.");
  }

  if (!imagen && modoIngredientes === "imagen") {
    nuevosErrores.push("Debes subir una imagen de los ingredientes.");
  }

  return nuevosErrores;
};

export const esFormularioRecetaValido = ({ datos, modoIngredientes, imagen }) => {
  if (modoIngredientes === "texto") {
    return datos.ingredientes && datos.ingredientes.trim() !== "";
  }

  return imagen !== null;
};
