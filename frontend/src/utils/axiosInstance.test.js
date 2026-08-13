import { beforeEach, describe, expect, it, vi } from 'vitest';

const refreshAccessToken = vi.fn();

vi.mock('./auth', () => ({
  refreshAccessToken,
}));

const createAxiosMock = () => {
  const responseHandlers = [];
  const requestHandlers = [];
  const instance = vi.fn((config) => Promise.resolve({ config }));

  instance.defaults = { headers: { common: {} } };
  instance.interceptors = {
    request: {
      use: vi.fn((fulfilled, rejected) => {
        requestHandlers.push({ fulfilled, rejected });
      }),
    },
    response: {
      use: vi.fn((fulfilled, rejected) => {
        responseHandlers.push({ fulfilled, rejected });
      }),
    },
  };

  vi.doMock('axios', () => ({
    default: {
      create: vi.fn(() => instance),
    },
  }));

  return { instance, responseHandlers, requestHandlers };
};

const loadInterceptor = async () => {
  vi.resetModules();
  const axiosMock = createAxiosMock();
  await import('./axiosInstance');
  return {
    ...axiosMock,
    onRejected: axiosMock.responseHandlers[0].rejected,
  };
};

describe('axiosInstance refresh interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('retries queued 401 responses after one refresh', async () => {
    const { instance, onRejected } = await loadInterceptor();
    localStorage.setItem('token', 'old-access-token');
    refreshAccessToken.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve('new-access-token'), 0))
    );
    const firstRequest = { headers: {}, url: '/first' };
    const secondRequest = { headers: {}, url: '/second' };

    const firstRetry = onRejected({ response: { status: 401 }, config: firstRequest });
    const secondRetry = onRejected({ response: { status: 401 }, config: secondRequest });

    await expect(Promise.all([firstRetry, secondRetry])).resolves.toEqual([
      { config: firstRequest },
      { config: secondRequest },
    ]);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(instance).toHaveBeenCalledTimes(2);
    expect(firstRequest.headers.Authorization).toBe('Bearer new-access-token');
    expect(secondRequest.headers.Authorization).toBe('Bearer new-access-token');
    expect(instance.defaults.headers.common.Authorization).toBe('Bearer new-access-token');
  });

  it('clears auth state and redirects when refresh cannot recover', async () => {
    const { instance, onRejected } = await loadInterceptor();
    const assign = vi.fn();
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, assign };
    localStorage.setItem('token', 'old-access-token');
    localStorage.setItem('token_refresh', 'refresh-token');
    localStorage.setItem('recetaGenerada', '{}');
    refreshAccessToken.mockResolvedValueOnce(null);
    const error = { response: { status: 401 }, config: { headers: {}, url: '/private' } };

    await expect(onRejected(error)).rejects.toBe(error);

    expect(instance).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('token_refresh')).toBeNull();
    expect(localStorage.getItem('recetaGenerada')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login');
    window.location = originalLocation;
  });
});
