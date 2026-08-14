import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RecipeFavoriteButton } from './RecipeFavoriteButton';

describe('RecipeFavoriteButton', () => {
  it('renders the main favorite action and forwards clicks', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(<RecipeFavoriteButton isSaved={false} onClick={onClick} />);

    expect(screen.getByText('Guardar como favorita')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('fill', 'none');

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps saved labels, fill, and compact classes for similar recipes', () => {
    const { container } = render(
      <RecipeFavoriteButton isSaved onClick={() => {}} variant="similar" />
    );

    expect(screen.getByText('Guardada')).toBeInTheDocument();
    expect(container.querySelector('button')).toHaveClass('gap-1', 'px-3', 'py-1', 'rounded-md', 'text-sm');
    expect(container.querySelector('svg')).toHaveAttribute('class', 'w-4 h-4');
    expect(container.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
  });
});
