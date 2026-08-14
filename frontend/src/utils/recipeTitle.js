export const extraerTituloReceta = (textoReceta) => {
  if (!textoReceta) return 'la receta';

  const lineas = textoReceta.split('\n');
  for (const linea of lineas) {
    const lineaTrimmed = linea.trim();
    const match = lineaTrimmed.match(/^\**\s*nombre de la receta\s*\**\s*:\s*\**\s*(.+?)\s*\**$/i);
    if (match) {
      const titulo = match[1].replace(/^\**\s*/, '').replace(/\s*\**$/, '').trim();
      return titulo || 'la receta';
    }
  }

  return 'la receta';
};
