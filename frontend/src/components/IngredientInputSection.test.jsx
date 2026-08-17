import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import IngredientInputSection from './IngredientInputSection';

const defaultProps = {
  modoIngredientes: 'imagen',
  ingredientes: '',
  imagen: null,
  imagenPreviewUrl: null,
  mostrarCamara: false,
  stream: null,
  videoRef: createRef(),
  canvasRef: createRef(),
  onModoChange: vi.fn(),
  onIngredientesChange: vi.fn(),
  onImagenChange: vi.fn(),
  onClearImagen: vi.fn(),
  onIniciarCamara: vi.fn(),
  onCapturarFoto: vi.fn(),
  onCerrarCamara: vi.fn(),
};

const renderSection = (props = {}) => render(
  <IngredientInputSection {...defaultProps} {...props} />
);

describe('IngredientInputSection', () => {
  it('renders manual ingredient mode and forwards text changes', async () => {
    const user = userEvent.setup();
    const onIngredientesChange = vi.fn();

    renderSection({
      modoIngredientes: 'texto',
      ingredientes: 'tomate',
      onIngredientesChange,
    });

    const input = screen.getByLabelText('Ingredientes');
    expect(input).toHaveValue('tomate');

    await user.type(input, ', arroz');

    expect(onIngredientesChange).toHaveBeenCalled();
  });

  it('renders image actions, preview, and camera callbacks', async () => {
    const user = userEvent.setup();
    const onIniciarCamara = vi.fn();
    const onClearImagen = vi.fn();

    const { rerender } = renderSection({
      imagen: new File(['fake-image'], 'ingredients.png', { type: 'image/png' }),
      imagenPreviewUrl: 'blob:ingredients-preview',
      onIniciarCamara,
      onClearImagen,
    });

    await user.click(screen.getByRole('button', { name: /usar cámara/i }));
    expect(onIniciarCamara).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Imagen seleccionada:')).toBeInTheDocument();
    expect(screen.getByAltText('Vista previa de ingredientes')).toHaveAttribute('src', 'blob:ingredients-preview');

    await user.click(screen.getByRole('button', { name: '❌' }));
    expect(onClearImagen).toHaveBeenCalledTimes(1);

    const onCapturarFoto = vi.fn();
    const onCerrarCamara = vi.fn();

    rerender(
      <IngredientInputSection
        {...defaultProps}
        mostrarCamara
        onCapturarFoto={onCapturarFoto}
        onCerrarCamara={onCerrarCamara}
      />
    );

    expect(screen.getByText('Iniciando cámara...')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /capturar/i }));
    await user.click(screen.getByTestId('modal-overlay'));

    expect(onCapturarFoto).toHaveBeenCalledTimes(1);
    expect(onCerrarCamara).toHaveBeenCalledTimes(1);
  });
});
