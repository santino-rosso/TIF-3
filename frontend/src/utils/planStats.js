// Calcula el porcentaje de uso del plan a partir de las estadísticas del plan.
export const calcularPorcentajeUso = (estadisticas) => {
  const { generaciones_usadas = 0, limite_generaciones = 0 } = estadisticas ?? {};
  if (limite_generaciones <= 0) return 0;
  return Math.min((generaciones_usadas / limite_generaciones) * 100, 100);
};

// Asigna un porcentaje de uso al color de la barra que se utiliza en la interfaz de usuario del plan.
export const colorNivelUso = (porcentaje) => {
  if (porcentaje >= 90) return "bg-red-500";
  if (porcentaje >= 70) return "bg-yellow-500";
  return "bg-green-500";
};