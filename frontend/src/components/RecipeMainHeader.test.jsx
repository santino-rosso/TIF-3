import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RecipeMainHeader from './RecipeMainHeader';

describe('RecipeMainHeader', () => {
  it('renders the generated recipe title by default', () => {
    render(<RecipeMainHeader />);

    expect(screen.getByText('Tu Receta Personalizada')).toBeInTheDocument();
    expect(screen.getByText('Creada especialmente para ti')).toBeInTheDocument();
  });

  it('renders the favorite recipe title when tipo="favorita"', () => {
    render(<RecipeMainHeader tipo="favorita" />);

    expect(screen.getByText('Receta guardada')).toBeInTheDocument();
    expect(screen.getByText('Marcada como favorita por vos')).toBeInTheDocument();
  });

  it('renders the recommended recipe title when tipo="recomendada"', () => {
    render(<RecipeMainHeader tipo="recomendada" />);

    expect(screen.getByText('Receta recomendada para vos')).toBeInTheDocument();
    expect(screen.getByText('Sugerida según tus favoritas')).toBeInTheDocument();
  });

  it('fires onCookingMode when the Modo Cocina button is clicked', async () => {
    const user = userEvent.setup();
    const onCookingMode = vi.fn();
    render(<RecipeMainHeader onCookingMode={onCookingMode} />);

    await user.click(screen.getByRole('button', { name: /modo cocina/i }));

    expect(onCookingMode).toHaveBeenCalledTimes(1);
  });

  it('shows saved state and fires onToggleFavorite when isSaved=true', async () => {
    const user = userEvent.setup();
    const onToggleFavorite = vi.fn();
    render(<RecipeMainHeader isSaved={true} onToggleFavorite={onToggleFavorite} />);

    expect(screen.getByText('Quitar de favoritos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /quitar de favoritos/i }));

    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it('shows unsaved state and fires onToggleFavorite when isSaved=false', async () => {
    const user = userEvent.setup();
    const onToggleFavorite = vi.fn();
    render(<RecipeMainHeader isSaved={false} onToggleFavorite={onToggleFavorite} />);

    expect(screen.getByText('Guardar como favorita')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /guardar como favorita/i }));

    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });
});
