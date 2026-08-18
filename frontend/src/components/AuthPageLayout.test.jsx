import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AuthPageLayout from './AuthPageLayout';

describe('AuthPageLayout', () => {
  it('renders the shared auth page shell with logo and content', () => {
    render(
      <AuthPageLayout>
        <h1>Auth content</h1>
      </AuthPageLayout>
    );

    expect(screen.getByAltText('ReceYa Logo')).toHaveAttribute('src', '/ReceYa.png');
    expect(screen.getByRole('heading', { name: 'Auth content' })).toBeInTheDocument();
  });
});
