import { describe, expect, it } from 'vitest';
import { esFormularioRecetaValido, validarFormularioReceta } from './recipeFormValidation';

describe('recipeFormValidation', () => {
  it('requires ingredients in text mode', () => {
    const formValido = esFormularioRecetaValido({
      datos: { ingredientes: '' },
      modoIngredientes: 'texto',
      imagen: null,
    });
    const errores = validarFormularioReceta({
      datos: { ingredientes: '' },
      modoIngredientes: 'texto',
      imagen: null,
    });

    expect(errores).toEqual(["El campo 'ingredientes' es obligatorio."]);
    expect(formValido).toBe('');
  });

  it('requires an image in image mode', () => {
    const errores = validarFormularioReceta({
      datos: { ingredientes: '' },
      modoIngredientes: 'imagen',
      imagen: null,
    });

    expect(errores).toEqual(['Debes subir una imagen de los ingredientes.']);
    expect(esFormularioRecetaValido({
      datos: { ingredientes: '' },
      modoIngredientes: 'imagen',
      imagen: null,
    })).toBe(false);
  });

  it('validates text mode with ingredients', () => {
    expect(validarFormularioReceta({
      datos: { ingredientes: 'tomate, arroz' },
      modoIngredientes: 'texto',
      imagen: null,
    })).toEqual([]);
    expect(esFormularioRecetaValido({
      datos: { ingredientes: 'tomate, arroz' },
      modoIngredientes: 'texto',
      imagen: null,
    })).toBe(true);
  });

  it('validates image mode with an image', () => {
    const imagen = new File(['fake-image'], 'ingredients.png', { type: 'image/png' });

    expect(validarFormularioReceta({
      datos: { ingredientes: '' },
      modoIngredientes: 'imagen',
      imagen,
    })).toEqual([]);
    expect(esFormularioRecetaValido({
      datos: { ingredientes: '' },
      modoIngredientes: 'imagen',
      imagen,
    })).toBe(true);
  });
});
