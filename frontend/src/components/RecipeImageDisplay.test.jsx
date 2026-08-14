import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RecipeImageModal, RecipeImagePreview } from './RecipeImageDisplay';

describe('RecipeImageDisplay', () => {
  it('renders image preview metadata and forwards open clicks', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      <RecipeImagePreview
        imageUrl="/imagenes/main-image"
        alt="Imagen generada de Tarta"
        className="preview-class"
        loading="lazy"
        style={{ borderBottom: '4px solid #22c55e' }}
        onOpen={onOpen}
      />
    );

    const image = screen.getByAltText('Imagen generada de Tarta');
    expect(image).toHaveAttribute('src', '/imagenes/main-image');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('Imagen generada con IA')).toBeInTheDocument();
    expect(screen.getByText('Clic para ampliar')).toBeInTheDocument();

    await user.click(image);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('keeps modal image clicks from closing and closes from overlay or button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <RecipeImageModal
        imageUrl="/imagenes/main-image"
        alt="Imagen de Tarta"
        title="Tarta"
        onClose={onClose}
      />
    );

    await user.click(screen.getByAltText('Imagen de Tarta'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();

    onClose.mockClear();
    await user.click(screen.getByText('Tarta'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
