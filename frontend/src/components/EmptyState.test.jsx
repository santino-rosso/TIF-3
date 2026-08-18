import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders the configured message and shared empty-state image', () => {
    render(<EmptyState message="No hay contenido disponible." imageAlt="Sin contenido" />);

    expect(screen.getByText('No hay contenido disponible.')).toBeInTheDocument();
    expect(screen.getByAltText('Sin contenido')).toHaveAttribute('src', '/ReceYa.png');
  });
});
