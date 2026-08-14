import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SimilarRecipesSection from './SimilarRecipesSection';

const recetaConImagen = {
  _id: 'r1',
  texto_receta: '**Nombre de la receta:** Tarta de Manzana\n\n**Ingredientes:**\n- Manzanas\n- Harina',
  imagen_id: 'img1'
};

const recetaSinImagen = {
  _id: 'r2',
  texto_receta: '**Nombre de la receta:** Brownie\n\n**Ingredientes:**\n- Chocolate'
};

const renderSection = (props = {}) => render(
  <SimilarRecipesSection
    similares={[recetaConImagen, recetaSinImagen]}
    guardadasSimilares={[false, false]}
    onToggleFavorite={() => {}}
    onCookingMode={() => {}}
    onOpenImage={() => {}}
    {...props}
  />
);

describe('SimilarRecipesSection', () => {
  it('renders null when similares is undefined', () => {
    const { container } = renderSection({ similares: undefined });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders null when similares is an empty array', () => {
    const { container } = renderSection({ similares: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the section header with two recipes', () => {
    renderSection();
    expect(screen.getByText('Recetas Similares')).toBeInTheDocument();
    expect(screen.getByText('Otras opciones que podrían interesarte')).toBeInTheDocument();
  });

  it('renders Receta Alternativa 1 and Receta Alternativa 2', () => {
    renderSection();
    expect(screen.getByText('Receta Alternativa 1')).toBeInTheDocument();
    expect(screen.getByText('Receta Alternativa 2')).toBeInTheDocument();
  });

  it('calls onCookingMode with the recipe when clicking Modo Cocina', async () => {
    const user = userEvent.setup();
    const onCookingMode = vi.fn();
    renderSection({ onCookingMode });

    await user.click(screen.getAllByRole('button', { name: /modo cocina/i })[0]);

    expect(onCookingMode).toHaveBeenCalledTimes(1);
    expect(onCookingMode).toHaveBeenCalledWith(recetaConImagen);
  });

  it('calls onToggleFavorite with (id, index) when clicking the favorite button', async () => {
    const user = userEvent.setup();
    const onToggleFavorite = vi.fn();
    renderSection({ onToggleFavorite });

    await user.click(screen.getAllByRole('button', { name: 'Guardar' })[1]);

    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    expect(onToggleFavorite).toHaveBeenCalledWith('r2', 1);
  });

  it('renders the image preview when imagen_id is present and not when absent', () => {
    const { container } = renderSection();
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute('src', expect.stringContaining('/imagenes/img1'));
  });

  it('uses the extracted title in the image alt', () => {
    const { container } = renderSection();
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', 'Imagen generada de Tarta de Manzana');
  });

  it('renders formatted recipe content text', () => {
    renderSection();
    expect(screen.getByText('Tarta de Manzana')).toBeInTheDocument();
    expect(screen.getByText('Manzanas')).toBeInTheDocument();
    expect(screen.getByText('Brownie')).toBeInTheDocument();
  });
});
