import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecipeGenerationSubmit } from './useRecipeGenerationSubmit';

const { navigate, axiosInstance, validarIngredientes, confirmarIngredientes } = vi.hoisted(() => ({
  navigate: vi.fn(),
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
  },
  validarIngredientes: vi.fn(),
  confirmarIngredientes: vi.fn(),
}));

vi.mock('../utils/axiosInstance', () => ({
  default: axiosInstance,
}));

vi.mock('../utils/useValidarIngredientes', () => ({
  useValidarIngredientes: () => ({ validarIngredientes }),
}));

vi.mock('../utils/confirmarIngredientes.jsx', () => ({
  confirmarIngredientes,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

const datos = {
  preferencias: 'vegetariano',
  restricciones: '',
  tiempo: '',
  tipo_comida: '',
  herramientas: '',
  experiencia: '',
  ingredientes: 'tomate, arroz, jamon',
};

const renderSubmitHook = (props = {}) => {
  const defaultProps = {
    datos,
    modoIngredientes: 'texto',
    imagen: null,
    setDatos: vi.fn(),
    setErrores: vi.fn(),
    actualizarPlanInfo: vi.fn(),
    cargarPlanInfo: vi.fn(),
  };

  return {
    props: { ...defaultProps, ...props },
    ...renderHook((hookProps) => useRecipeGenerationSubmit(hookProps), {
      initialProps: { ...defaultProps, ...props },
    }),
  };
};

describe('useRecipeGenerationSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('blocks generation when the limit preflight rejects the request', async () => {
    axiosInstance.get.mockResolvedValue({
      data: {
        puede_generar: false,
        razon: 'Plan limit reached',
        generaciones_usadas: 5,
        restantes: 0,
        limite: 5,
      },
    });
    const event = { preventDefault: vi.fn() };
    const { result, props } = renderSubmitHook();

    await act(async () => {
      await result.current.handleSubmit(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(axiosInstance.get).toHaveBeenCalledWith('/verificar-limite');
    // No error messages should be set; errors cleared
    expect(props.setErrores).toHaveBeenLastCalledWith([]);
    expect(props.cargarPlanInfo).toHaveBeenCalled();
    expect(validarIngredientes).not.toHaveBeenCalled();
    expect(axiosInstance.post).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('filters unapproved ingredients before generating the recipe', async () => {
    axiosInstance.get.mockResolvedValue({
      data: {
        puede_generar: true,
        generaciones_usadas: 3,
        restantes: 2,
        limite: 5,
      },
    });
    validarIngredientes.mockResolvedValue({
      ingredientes: ['tomate', 'arroz', 'jamon'],
      ingredientes_no_aprobados: [['jamon', 'No apto']],
    });
    confirmarIngredientes.mockResolvedValue([]);
    axiosInstance.post.mockResolvedValue({ data: { id: 1, titulo: 'Arroz con tomate' } });
    const event = { preventDefault: vi.fn() };
    const { result, props } = renderSubmitHook();

    await act(async () => {
      await result.current.handleSubmit(event);
    });

    const updatePlan = props.actualizarPlanInfo.mock.calls[0][0];
    const updateDatos = props.setDatos.mock.calls[0][0];
    const [url, payload] = axiosInstance.post.mock.calls[0];

    expect(updatePlan({ nombre_plan: 'Gratuito' })).toEqual({
      nombre_plan: 'Gratuito',
      generaciones_usadas: 3,
      generaciones_restantes: 2,
      limite_generaciones: 5,
      porcentaje_uso: 60,
    });
    expect(confirmarIngredientes).toHaveBeenCalledWith([['jamon', 'No apto']]);
    expect(updateDatos(datos).ingredientes).toBe('tomate, arroz');
    expect(url).toBe('/generar-receta');
    expect(payload).toBeInstanceOf(FormData);
    expect(payload.get('ingredientes')).toBe('tomate, arroz');
    expect(payload.get('preferencias')).toBe('vegetariano');
    expect(localStorage.getItem('recetaGenerada')).toBe(JSON.stringify({ id: 1, titulo: 'Arroz con tomate' }));
    expect(navigate).toHaveBeenCalledWith('/resultados');
    expect(result.current.loading).toBe(false);
  });
});
