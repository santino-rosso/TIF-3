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
