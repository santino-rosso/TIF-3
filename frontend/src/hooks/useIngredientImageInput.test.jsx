import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIngredientImageInput } from './useIngredientImageInput';

const createObjectURL = vi.fn(() => 'blob:ingredients-preview');
const revokeObjectURL = vi.fn();

describe('useIngredientImageInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeObjectURL,
      configurable: true,
    });
  });

  it('revokes the same object URL used for the image preview', async () => {
    const { result, unmount } = renderHook(() => useIngredientImageInput());
    const imageFile = new File(['fake-image'], 'ingredients.png', { type: 'image/png' });

    act(() => {
      result.current.setImagen(imageFile);
    });

    await waitFor(() => expect(result.current.imagenPreviewUrl).toBe('blob:ingredients-preview'));
    expect(createObjectURL).toHaveBeenCalledWith(imageFile);

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:ingredients-preview');
  });

  it('resets the file input value so the same file can be selected again', () => {
    const { result } = renderHook(() => useIngredientImageInput());
    const imageFile = new File(['fake-image'], 'ingredients.png', { type: 'image/png' });
    const input = { target: { files: [imageFile], value: 'C:\\fakepath\\ingredients.png' } };

    act(() => {
      result.current.handleImagen(input);
    });

    expect(result.current.imagen).toBe(imageFile);
    // Sin este reset, el <input type="file"> no dispara onChange
    // si el usuario vuelve a elegir el MISMO archivo.
    expect(input.target.value).toBe('');
  });

  it('stops the active camera stream when closed', async () => {
    const stop = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop }],
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });
    const { result } = renderHook(() => useIngredientImageInput());

    await act(async () => {
      await result.current.iniciarCamara();
    });

    expect(getUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    });
    expect(result.current.mostrarCamara).toBe(true);

    act(() => {
      result.current.cerrarCamara();
    });

    expect(stop).toHaveBeenCalled();
    expect(result.current.mostrarCamara).toBe(false);
  });
});
