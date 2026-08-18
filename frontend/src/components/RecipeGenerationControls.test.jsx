import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RecipeGenerationControls from './RecipeGenerationControls';

describe('RecipeGenerationControls', () => {
  it('renders errors and disables submit when the form is invalid', () => {
    render(
      <RecipeGenerationControls
        loading={false}
        errors={['Debes subir una imagen de los ingredientes.', 'Otro error']}
        isFormValid={false}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Debes subir una imagen de los ingredientes.')).toBeInTheDocument();
    expect(screen.getByText('Otro error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generar receta/i })).toBeDisabled();
  });

  it('keeps the submit button enabled when the form is valid and not loading', () => {
    render(<RecipeGenerationControls loading={false} errors={[]} isFormValid />);

    expect(screen.queryByText('Generando receta...')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generar receta/i })).toBeEnabled();
  });

  it('shows loading overlay and loading submit state', () => {
    render(<RecipeGenerationControls loading errors={[]} isFormValid />);

    expect(screen.getByText('Generando receta...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generando/i })).toBeDisabled();
  });
});
