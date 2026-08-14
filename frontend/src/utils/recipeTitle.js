export const extraerTituloReceta = (textoReceta) => {
  if (!textoReceta) return 'la receta';

  const lineas = textoReceta.split('\n');
  for (const linea of lineas) {
    const lineaTrimmed = linea.trim();
    if (/^(\*\*)?nombre de la receta(\*\*)?:/i.test(lineaTrimmed)) {
      const titulo = lineaTrimmed
        .replace(/^\*\*/, '')
        .replace(/\*\*$/, '')
        .replace(/^nombre de la receta\s*:\s*/i, '')
        .replace(/^\*\*/, '')
        .trim();

      return titulo || 'la receta';
    }
  }

  return 'la receta';
};
