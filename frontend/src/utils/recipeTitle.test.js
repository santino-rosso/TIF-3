import { describe, expect, it } from 'vitest';
import { extraerTituloReceta } from './recipeTitle';

describe('recipeTitle', () => {
  it('extracts the recipe name from plain generated text', () => {
    expect(extraerTituloReceta('Nombre de la receta: Tarta de verduras\nIngredientes:')).toBe('Tarta de verduras');
  });

  it('extracts the recipe name from supported markdown bold generated text', () => {
    expect(extraerTituloReceta('**Nombre de la receta: Guiso de lentejas**\n**Preparación:**')).toBe('Guiso de lentejas');
  });

  it('uses the existing fallback when the recipe has no explicit title', () => {
    expect(extraerTituloReceta('Ingredientes:\n- arroz')).toBe('la receta');
    expect(extraerTituloReceta('')).toBe('la receta');
  });
});
