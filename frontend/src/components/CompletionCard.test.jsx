import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CompletionCard from './CompletionCard';

vi.mock('../utils/apiConfig', () => ({
  API_BASE_URL: 'https://api.example.test/api',
}));

describe('CompletionCard', () => {
  const recipe = {
    imagen_id: 'image-123',
  };

  const defaultProps = {
    recipe,
    titulo: 'Arroz con tomate',
    onClose: vi.fn(),
    onExit: vi.fn(),
  };

  it('renders the completion title and message with the recipe name', () => {
    render(<CompletionCard {...defaultProps} />);

    expect(screen.getByText('¡Receta completada!')).toBeInTheDocument();
    expect(
      screen.getByText('Has terminado de cocinar Arroz con tomate')
    ).toBeInTheDocument();
  });

  it('renders the recipe image with the configured API base URL', () => {
    render(<CompletionCard {...defaultProps} />);

    expect(screen.getByAltText('Imagen de Arroz con tomate')).toHaveAttribute(
      'src',
      'https://api.example.test/api/imagenes/image-123'
    );
  });

  it('does not render the image when the recipe has no imagen_id', () => {
    render(<CompletionCard {...defaultProps} recipe={{}} titulo="Receta sin imagen" />);

    expect(screen.queryByAltText(/Imagen de/)).not.toBeInTheDocument();
  });

  it('fires onClose when the Volver button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CompletionCard {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /volver/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(defaultProps.onExit).not.toHaveBeenCalled();
  });

  it('fires onExit when the Finalizar cocina button is clicked', async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    render(<CompletionCard {...defaultProps} onExit={onExit} />);

    await user.click(screen.getByRole('button', { name: /finalizar cocina/i }));

    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
