import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FormularioReceta from './FormularioReceta';

const { navigate, axiosInstance, validarIngredientes } = vi.hoisted(() => ({
  navigate: vi.fn(),
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
  },
  validarIngredientes: vi.fn(),
}));

const createObjectURL = vi.fn(() => 'blob:ingredients-preview');
const revokeObjectURL = vi.fn();

vi.mock('../utils/axiosInstance', () => ({
  default: axiosInstance,
}));

vi.mock('../utils/useValidarIngredientes', () => ({
  useValidarIngredientes: () => ({ validarIngredientes }),
}));

vi.mock('../utils/confirmarIngredientes.jsx', () => ({
  confirmarIngredientes: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children }) => <a href="/planes">{children}</a>,
    useNavigate: () => navigate,
  };
});

const planInfo = {
  nombre_plan: 'Gratuito',
  tipo_plan: 'gratuito',
  generaciones_restantes: 3,
  generaciones_usadas: 2,
  limite_generaciones: 5,
  porcentaje_uso: 40,
};

const renderForm = async () => {
  const view = render(<FormularioReceta />);
  await waitFor(() => expect(axiosInstance.get).toHaveBeenCalledWith('/obtener-plan'));
  return view;
};

describe('FormularioReceta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeObjectURL,
      configurable: true,
    });
    axiosInstance.get.mockResolvedValue({ data: { estadisticas: planInfo } });
  });

  it('shows a preview when an image is selected', async () => {
    const user = userEvent.setup();
    const { container } = await renderForm();
    const imageFile = new File(['fake-image'], 'ingredients.png', { type: 'image/png' });

    await user.upload(container.querySelector('#imagen-input'), imageFile);

    expect(await screen.findByAltText('Vista previa de ingredientes')).toHaveAttribute('src', 'blob:ingredients-preview');
    expect(createObjectURL).toHaveBeenCalledWith(imageFile);
  });

  it('clears loading and does not generate when local validation fails', async () => {
    await renderForm();

    screen.getByRole('button', { name: /generar receta/i }).closest('form').requestSubmit();

    expect(await screen.findByText("Debes subir una imagen de los ingredientes.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generar receta/i })).toBeInTheDocument();
    expect(axiosInstance.post).not.toHaveBeenCalled();
    expect(validarIngredientes).not.toHaveBeenCalled();
  });

  it('blocks generation when the plan preflight reports an exhausted limit', async () => {
    const user = userEvent.setup();
    axiosInstance.get
      .mockResolvedValueOnce({ data: { estadisticas: planInfo } })
      .mockResolvedValueOnce({
        data: {
          puede_generar: false,
          razon: 'Plan limit reached',
          generaciones_usadas: 5,
          restantes: 0,
          limite: 5,
        },
      })
      .mockResolvedValueOnce({ data: { estadisticas: { ...planInfo, generaciones_restantes: 0 } } });
    await renderForm();

    await user.selectOptions(screen.getByLabelText(/cómo querés ingresar los ingredientes/i), 'texto');
    await user.type(screen.getByLabelText('Ingredientes'), 'tomate, arroz');
    const generateButton = screen.getByRole('button', { name: /generar receta/i });
    await user.click(generateButton);

    // No error text should appear
    expect(screen.queryByText('Plan limit reached')).not.toBeInTheDocument();
    expect(screen.queryByText('Has alcanzado el límite')).not.toBeInTheDocument();
    // Button should be disabled
    expect(generateButton).toBeDisabled();
    expect(axiosInstance.get).toHaveBeenCalledWith('/verificar-limite');
    expect(validarIngredientes).not.toHaveBeenCalled();
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });

  it('generates a recipe with the validated ingredient payload and finishes loading', async () => {
    const user = userEvent.setup();
    axiosInstance.get
      .mockResolvedValueOnce({ data: { estadisticas: planInfo } })
      .mockResolvedValueOnce({
        data: {
          puede_generar: true,
          generaciones_usadas: 3,
          restantes: 2,
          limite: 5,
        },
      });
    validarIngredientes.mockResolvedValue({ ingredientes_validados: ['tomate', 'arroz'] });
    axiosInstance.post.mockResolvedValue({ data: { id: 1, titulo: 'Arroz con tomate' } });
    await renderForm();

    await user.selectOptions(screen.getByLabelText(/cómo querés ingresar los ingredientes/i), 'texto');
    await user.type(screen.getByLabelText('Ingredientes'), 'tomate, arroz');
    await user.type(screen.getByLabelText('Preferencias alimentarias'), 'vegetariano');
    await user.click(screen.getByRole('button', { name: /generar receta/i }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/resultados'));
    const [url, payload] = axiosInstance.post.mock.calls[0];

    expect(url).toBe('/generar-receta');
    expect(payload).toBeInstanceOf(FormData);
    expect(payload.get('ingredientes')).toBe('tomate, arroz');
    expect(payload.get('preferencias')).toBe('vegetariano');
    expect(localStorage.getItem('recetaGenerada')).toBe(JSON.stringify({ id: 1, titulo: 'Arroz con tomate' }));
    expect(screen.getByRole('button', { name: /generar receta/i })).toBeEnabled();
  });
});
