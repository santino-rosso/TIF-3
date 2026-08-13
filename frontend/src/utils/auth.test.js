import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosPost = vi.fn();

vi.mock('axios', () => ({
  default: {
    post: axiosPost,
  },
}));

describe('refreshAccessToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('refreshes through raw axios instead of the intercepted axios instance', async () => {
    const { refreshAccessToken } = await import('./auth');
    localStorage.setItem('token_refresh', 'refresh-token');
    axiosPost.mockResolvedValueOnce({ data: { access_token: 'new-access-token' } });

    const token = await refreshAccessToken();

    expect(token).toBe('new-access-token');
    expect(axiosPost).toHaveBeenCalledWith('http://localhost:8000/api/refresh', {
      refresh_token: 'refresh-token',
    });
    expect(localStorage.getItem('token')).toBe('new-access-token');
  });

  it('clears stored auth tokens when refresh fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { refreshAccessToken } = await import('./auth');
    localStorage.setItem('token', 'old-access-token');
    localStorage.setItem('token_refresh', 'refresh-token');
    axiosPost.mockRejectedValueOnce(new Error('refresh failed'));

    const token = await refreshAccessToken();

    expect(token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('token_refresh')).toBeNull();
    consoleError.mockRestore();
  });
});
