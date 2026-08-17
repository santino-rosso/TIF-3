import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import RecipePlanNotice from './RecipePlanNotice';

const renderNotice = (planInfo) => render(
  <MemoryRouter>
    <RecipePlanNotice planInfo={planInfo} />
  </MemoryRouter>
);

describe('RecipePlanNotice', () => {
  it('renders the zero remaining warning with the premium upgrade link', () => {
    renderNotice({
      nombre_plan: 'Gratuito',
      tipo_plan: 'gratuito',
      generaciones_restantes: 0,
    });

    expect(screen.queryByText('0 recetas restantes')).not.toBeInTheDocument();
    expect(screen.queryByText('Gratuito')).not.toBeInTheDocument();
    expect(screen.getByText('Has alcanzado el límite de recetas para tu período actual')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /actualizar a premium/i })).toHaveAttribute('href', '/planes');
  });

  it('renders the low remaining free-plan warning with link and warning icon state', () => {
    const { container } = renderNotice({
      nombre_plan: 'Gratuito',
      tipo_plan: 'gratuito',
      generaciones_restantes: 2,
    });

    expect(screen.getByText('2 recetas restantes')).toBeInTheDocument();
    expect(screen.getByText('Te quedan pocas recetas. Considerá actualizar a Premium para obtener hasta 100 recetas cada 30 días.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver planes/i })).toHaveAttribute('href', '/planes');
  });
});
