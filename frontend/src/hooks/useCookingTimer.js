import { useCallback, useEffect, useRef, useState } from 'react';

export const useCookingTimer = ({ speak, currentStep }) => {
  const [activeTimer, setActiveTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const isTimerRunningRef = useRef(false);

  // Mantener ref actualizado
  useEffect(() => {
    isTimerRunningRef.current = isTimerRunning;
  }, [isTimerRunning]);

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(prev => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setTimeLeft(0);
    setActiveTimer(null);
  }, []);

  const extractTimeFromStep = useCallback((instruction) => {
    const timeRegex = /(\d+)\s*(minutos?|min|horas?|h)/gi;
    const matches = instruction.match(timeRegex);
    if (matches) {
      const timeStr = matches[0];
      const number = parseInt(timeStr.match(/\d+/)[0]);
      const unit = timeStr.toLowerCase();

      if (unit.includes('hora') || unit.includes('h')) {
        return number * 60;
      }
      return number;
    }
    return null;
  }, []);

  const showTimerNotification = useCallback(() => {
    // Vibración
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Notificación
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ ¡Tiempo terminado!', {
        body: `Paso ${currentStep + 1} completado`,
        icon: '/Reseya.png',
        vibrate: [200, 100, 200]
      });
    }

    // Síntesis de voz
    speak('Tiempo terminado');
  }, [currentStep, speak]);

  const startTimer = (minutes) => {
    const seconds = minutes * 60;
    setTimeLeft(seconds);
    setActiveTimer(currentStep);
    setIsTimerRunning(true);
    speak(`Temporizador iniciado por ${minutes} minutos`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Gestión de temporizadores
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            setIsTimerRunning(false);
            showTimerNotification();
            return 0;
          }
          return timeLeft - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, showTimerNotification]);

  return {
    activeTimer,
    setActiveTimer,
    timeLeft,
    setTimeLeft,
    isTimerRunning,
    setIsTimerRunning,
    isTimerRunningRef,
    pauseTimer,
    resetTimer,
    startTimer,
    extractTimeFromStep,
    formatTime,
  };
};

export default useCookingTimer;
