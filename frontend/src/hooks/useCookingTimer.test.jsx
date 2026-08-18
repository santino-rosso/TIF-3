import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCookingTimer } from './useCookingTimer';

describe('useCookingTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete window.Notification;
    delete navigator.vibrate;
  });

  it('starts idle without timer state', () => {
    const { result } = renderHook(() => useCookingTimer({ speak: vi.fn(), currentStep: 0 }));

    expect(result.current.timeLeft).toBe(0);
    expect(result.current.activeTimer).toBeNull();
    expect(result.current.isTimerRunning).toBe(false);
    expect(result.current.isTimerRunningRef.current).toBe(false);
  });

  it('formats seconds as padded MM:SS', () => {
    const { result } = renderHook(() => useCookingTimer({ speak: vi.fn(), currentStep: 0 }));

    expect(result.current.formatTime(0)).toBe('00:00');
    expect(result.current.formatTime(5)).toBe('00:05');
    expect(result.current.formatTime(65)).toBe('01:05');
    expect(result.current.formatTime(600)).toBe('10:00');
    expect(result.current.formatTime(3661)).toBe('61:01');
  });

  it('extracts suggested times from instruction text', () => {
    const { result } = renderHook(() => useCookingTimer({ speak: vi.fn(), currentStep: 0 }));

    expect(result.current.extractTimeFromStep('Cocinar por 10 minutos')).toBe(10);
    expect(result.current.extractTimeFromStep('Cocinar por 2 horas')).toBe(120);
    expect(result.current.extractTimeFromStep('Dejar reposar 5 min')).toBe(5);
    expect(result.current.extractTimeFromStep('Hornear durante 1 hora')).toBe(60);
    expect(result.current.extractTimeFromStep('Cocinar por 3 h')).toBe(180);
    expect(result.current.extractTimeFromStep('Cocinar por 30 minutos a fuego lento')).toBe(30);
    expect(result.current.extractTimeFromStep('Revolver la mezcla')).toBeNull();
  });

  it('runs a full start, pause, resume and completion cycle', () => {
    const speak = vi.fn();
    const { result } = renderHook(() => useCookingTimer({ speak, currentStep: 0 }));

    act(() => result.current.startTimer(2));
    expect(result.current.timeLeft).toBe(120);
    expect(result.current.activeTimer).toBe(0);
    expect(result.current.isTimerRunning).toBe(true);
    expect(speak).toHaveBeenCalledWith('Temporizador iniciado por 2 minutos');

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.timeLeft).toBe(117);

    act(() => result.current.pauseTimer());
    expect(result.current.isTimerRunning).toBe(false);
    expect(result.current.isTimerRunningRef.current).toBe(false);

    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.timeLeft).toBe(117);

    act(() => result.current.pauseTimer());
    act(() => vi.advanceTimersByTime(117000));
    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isTimerRunning).toBe(false);
    expect(speak).toHaveBeenCalledWith('Tiempo terminado');
  });

  it('resets all timer state', () => {
    const { result } = renderHook(() => useCookingTimer({ speak: vi.fn(), currentStep: 0 }));

    act(() => result.current.startTimer(5));
    expect(result.current.isTimerRunning).toBe(true);

    act(() => result.current.resetTimer());
    expect(result.current.timeLeft).toBe(0);
    expect(result.current.activeTimer).toBeNull();
    expect(result.current.isTimerRunning).toBe(false);
  });

  it('triggers a browser notification and vibration when the timer completes', () => {
    const speak = vi.fn();
    const NotificationMock = vi.fn();
    NotificationMock.permission = 'granted';
    const vibrateMock = vi.fn();

    Object.defineProperty(window, 'Notification', { configurable: true, value: NotificationMock });
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrateMock });

    const { result, rerender } = renderHook(
      ({ speak, currentStep }) => useCookingTimer({ speak, currentStep }),
      { initialProps: { speak, currentStep: 2 } }
    );

    act(() => result.current.startTimer(1));
    rerender({ speak, currentStep: 3 });
    act(() => vi.advanceTimersByTime(60000));

    expect(NotificationMock).toHaveBeenCalledWith(
      '⏰ ¡Tiempo terminado!',
      expect.objectContaining({ body: 'Paso 4 completado', icon: '/ReceYa.png' })
    );
    expect(vibrateMock).toHaveBeenCalledWith([200, 100, 200, 100, 200]);
    expect(speak).toHaveBeenCalledWith('Tiempo terminado');
  });

  it('cleans up the interval on unmount', () => {
    const speak = vi.fn();
    const { result, unmount } = renderHook(() => useCookingTimer({ speak, currentStep: 0 }));

    act(() => result.current.startTimer(1));
    unmount();
    act(() => vi.advanceTimersByTime(120000));

    expect(speak).not.toHaveBeenCalledWith('Tiempo terminado');
  });
});
