import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CookingMode from './CookingMode';

vi.mock('../utils/apiConfig', () => ({
  API_BASE_URL: 'https://api.example.test/api',
}));

describe('CookingMode', () => {
  it('uses the configured API base URL for the completion image', async () => {
    const user = userEvent.setup();
    const recipe = {
      imagen_id: 'image-123',
      texto_receta: `
**Preparación:**
1. Cocinar el arroz durante 10 minutos.
2. Servir con tomate fresco.
`,
    };

    render(<CookingMode recipe={recipe} titulo="Arroz con tomate" onExit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    await user.click(screen.getByRole('button', { name: /^finalizar/i }));

    expect(screen.getByAltText('Imagen de Arroz con tomate')).toHaveAttribute(
      'src',
      'https://api.example.test/api/imagenes/image-123'
    );
  });
});
