import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RecipeAdditionalFieldsGrid from './RecipeAdditionalFieldsGrid';

const datos = {
  preferencias: 'vegetariano',
  restricciones: 'sin gluten',
  tiempo: '30 minutos',
  tipo_comida: 'almuerzo',
  herramientas: 'horno',
  experiencia: 'intermedio',
};

describe('RecipeAdditionalFieldsGrid', () => {
  it('renders the additional recipe fields with their current values', () => {
    render(<RecipeAdditionalFieldsGrid datos={datos} onChange={vi.fn()} />);

    expect(screen.getByLabelText('Preferencias alimentarias')).toHaveValue('vegetariano');
    expect(screen.getByLabelText('Restricciones alimentarias')).toHaveValue('sin gluten');
    expect(screen.getByLabelText('Tiempo disponible')).toHaveValue('30 minutos');
    expect(screen.getByLabelText('Tipo de comida')).toHaveValue('almuerzo');
    expect(screen.getByLabelText('Herramientas disponibles')).toHaveValue('horno');
    expect(screen.getByLabelText('Nivel de experiencia')).toHaveValue('intermedio');
  });

  it('keeps the original field names and forwards changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<RecipeAdditionalFieldsGrid datos={{ ...datos, tiempo: '' }} onChange={onChange} />);

    const tiempo = screen.getByPlaceholderText('Ej: 30 minutos, 1 hora...');
    await user.type(tiempo, '45');

    expect(tiempo).toHaveAttribute('name', 'tiempo');
    expect(tiempo).toHaveAttribute('id', 'tiempo');
    expect(onChange).toHaveBeenCalled();
  });
});
