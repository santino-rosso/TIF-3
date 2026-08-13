import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlanInfo } from './usePlanInfo';

const { axiosInstance } = vi.hoisted(() => ({
  axiosInstance: {
    get: vi.fn(),
  },
}));

vi.mock('../utils/axiosInstance', () => ({
  default: axiosInstance,
}));

const estadisticas = {
  nombre_plan: 'Gratuito',
  tipo_plan: 'gratuito',
  generaciones_restantes: 3,
  generaciones_usadas: 2,
  limite_generaciones: 5,
};

describe('usePlanInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads plan statistics from the shared endpoint', async () => {
    axiosInstance.get.mockResolvedValue({ data: { estadisticas } });

    const { result } = renderHook(() => usePlanInfo());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.estadisticas).toEqual(estadisticas));
    expect(result.current.plan).toEqual(estadisticas);
    expect(result.current.loading).toBe(false);
    expect(axiosInstance.get).toHaveBeenCalledWith('/obtener-plan');
  });

  it('supports manual loading when autoLoad is disabled', async () => {
    axiosInstance.get.mockResolvedValue({ data: { estadisticas } });

    const { result } = renderHook(() => usePlanInfo({ autoLoad: false }));

    expect(result.current.loading).toBe(false);
    expect(axiosInstance.get).not.toHaveBeenCalled();

    await result.current.reload();

    await waitFor(() => expect(result.current.estadisticas).toEqual(estadisticas));
    expect(axiosInstance.get).toHaveBeenCalledWith('/obtener-plan');
  });
});
