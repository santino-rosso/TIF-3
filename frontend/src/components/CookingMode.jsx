import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChefHat,
  Clock,
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  SkipForward,
  SkipBack
} from 'lucide-react';
import { NUMBERED_STEP_REGEX, NUMBERED_STEP_STRIP_REGEX } from '../utils/recipeFormatter';
import { useCookingTimer } from '../hooks/useCookingTimer';
import CompletionCard from './CompletionCard';
import './CookingMode.css';

const CookingMode = ({ recipe, titulo, onExit }) => {
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [autoRead, setAutoRead] = useState(true);
  const wakeLockRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const handleVoiceCommandRef = useRef(null);
  const isRecognitionActiveRef = useRef(false);
  const isListeningRef = useRef(false);
  const autoReadRef = useRef(true);
  const currentStepRef = useRef(0);
  const instructionsRef = useRef([]);

  // Extraer instrucciones de la receta
  const parseInstructions = useCallback((recipeText) => {
    if (!recipeText) return [];

    const lines = recipeText.split('\n');
    const instructions = [];
    let inInstructionsSection = false;

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      // Detectar sección de instrucciones/preparación (con ** o sin **)
      if (/^(\*\*)?(preparación|instrucciones|procedimiento|elaboración)(\*\*)?:?/i.test(cleanLine)) {
        inInstructionsSection = true;
        continue;
      }

      // Si encontramos otra sección, salir
      if (inInstructionsSection && /^(\*\*)?(ingredientes|notas|consejos|tiempo|utensilios|preferencias|restricciones|tipo de comida|herramientas|nivel de experiencia)(\*\*)?:?/i.test(cleanLine)) {
        break;
      }

      // Agregar instrucciones numeradas o con viñetas
      if (inInstructionsSection && (
        NUMBERED_STEP_REGEX.test(cleanLine) ||
        /^-/.test(cleanLine) ||
        /^•/.test(cleanLine) ||
        (cleanLine.length > 15 && !cleanLine.includes(':')) // Líneas largas que no sean títulos
      )) {
        const cleanInstruction = cleanLine
          .replace(NUMBERED_STEP_STRIP_REGEX, '')
          .replace(/^[-•]\s*/, '')
          .trim();
        if (cleanInstruction) {
          instructions.push(cleanInstruction);
        }
      }
    }

    // Si no encontramos instrucciones específicas, intentar extraer pasos numerados de toda la receta
    if (instructions.length === 0) {
      for (const line of lines) {
        const cleanLine = line.trim();
        if (NUMBERED_STEP_REGEX.test(cleanLine)) {
          const cleanInstruction = cleanLine.replace(NUMBERED_STEP_STRIP_REGEX, '').trim();
          if (cleanInstruction && cleanInstruction.length > 10) {
            instructions.push(cleanInstruction);
          }
        }
      }
    }

    return instructions.length > 0 ? instructions : ['No hay instrucciones disponibles. Por favor, revisa el formato de la receta.'];
  }, []);

  const recipeText = recipe.texto_receta || recipe.receta || recipe.description || '';
  const instructions = useMemo(() => parseInstructions(recipeText), [parseInstructions, recipeText]);

  // Mantener refs actualizados
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    autoReadRef.current = autoRead;
  }, [autoRead]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    instructionsRef.current = instructions;
  }, [instructions]);

  // Mantener pantalla encendida
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  const startRecognition = useCallback(() => {
    if (!recognitionRef.current || isRecognitionActiveRef.current) return;

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error al iniciar reconocimiento:', error);
      setIsListening(false);
      isRecognitionActiveRef.current = false;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    if (!recognitionRef.current || !isRecognitionActiveRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Error al detener reconocimiento:', error);
    }
  }, []);

  const speak = useCallback((text) => {
    if (speechSynthesisRef.current && text) {
      // Pausar reconocimiento temporalmente durante la síntesis
      const wasListening = isListeningRef.current;
      if (wasListening && isRecognitionActiveRef.current) {
        stopRecognition();
      }

      speechSynthesisRef.current.cancel(); // Cancelar cualquier síntesis anterior
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;

      utterance.onend = () => {
        // Reanudar reconocimiento después de que termine la síntesis
        if (wasListening) {
          setTimeout(() => {
            if (isListeningRef.current && !isRecognitionActiveRef.current) {
              startRecognition();
            }
          }, 500); // Pequeña pausa para evitar detectar ecos
        }
      };

      utterance.onerror = () => {
        // Reanudar reconocimiento si hay error
        if (wasListening) {
          setTimeout(() => {
            if (isListeningRef.current && !isRecognitionActiveRef.current) {
              startRecognition();
            }
          }, 500);
        }
      };

      speechSynthesisRef.current.speak(utterance);
    }
  }, [startRecognition, stopRecognition]);

  const {
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
  } = useCookingTimer({ speak, currentStep });
  const timerDisplayRef = useRef(null);

  const scrollAlTimer = () => {
    setTimeout(() => {
      timerDisplayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };
const handleVoiceCommand = useCallback((command) => {

    // Obtener tiempo sugerido del paso actual
    const currentInstruction = instructionsRef.current[currentStepRef.current];
    const suggestedTime = extractTimeFromStep(currentInstruction);
    const hasTimer = !!suggestedTime;

    if (command.includes('siguiente')) {
      if (currentStepRef.current < instructionsRef.current.length - 1) {
        setCurrentStep(currentStepRef.current + 1);
        resetTimer();
      } else if (currentStepRef.current === instructionsRef.current.length - 1) {
        setShowCompletion(true);
      }

    } else if (command.includes('anterior')) {
      if (currentStepRef.current > 0) {
        setCurrentStep(currentStepRef.current - 1);
        resetTimer();
        setShowCompletion(false);
      }
    } else if (command.includes('repetir')) {
      speak(instructionsRef.current[currentStepRef.current]);

    } else if (command.includes('reiniciar')) {
      if (!hasTimer) {
        speak('No hay temporizador disponible para este paso');
        return;
      }
      const hayTimerActivo = activeTimer === currentStepRef.current && timeLeft > 0;
      if (!hayTimerActivo) {
        speak('No hay temporizador para reiniciar');
        return;
      }
      const seconds = suggestedTime * 60;
      setTimeLeft(seconds);
      setActiveTimer(currentStepRef.current);
      setIsTimerRunning(true);
      speak(`Temporizador reiniciado por ${suggestedTime} minutos`);
      scrollAlTimer();

    } else if (command.includes('iniciar')) {
      if (!hasTimer) {
        speak('No hay temporizador disponible para este paso');
        return;
      }
      const hayTimerActivo = activeTimer === currentStepRef.current && timeLeft > 0;
      if (hayTimerActivo) {
        speak(isTimerRunningRef.current ? 'El temporizador ya está en marcha' : 'El temporizador está pausado, decí reanudar');
        return;
      }
      const seconds = suggestedTime * 60;
      setTimeLeft(seconds);
      setActiveTimer(currentStepRef.current);
      setIsTimerRunning(true);
      speak(`Temporizador iniciado por ${suggestedTime} minutos`);
      scrollAlTimer();

    } else if (command.includes('pausar')) {
      const hayTimerCorriendo = activeTimer === currentStepRef.current && isTimerRunningRef.current && timeLeft > 0;
      if (!hayTimerCorriendo) {
        speak('No hay un temporizador en marcha para pausar');
        return;
      }
      pauseTimer();
      speak('Temporizador pausado');

    } else if (command.includes('reanudar')) {
      const hayTimerPausado = activeTimer === currentStepRef.current && !isTimerRunningRef.current && timeLeft > 0;
      if (!hayTimerPausado) {
        speak('No hay un temporizador pausado para reanudar');
        return;
      }
      pauseTimer();
      speak('Temporizador reanudado');
    }
  }, [activeTimer, extractTimeFromStep, isTimerRunningRef, pauseTimer, resetTimer, setActiveTimer, setIsTimerRunning, setTimeLeft, speak, timeLeft]);

  // Ref estable para el handler de comandos: el reconocimiento de voz se configura
  // una sola vez y no debe re-crearse cuando el timer actualiza el estado cada segundo
  handleVoiceCommandRef.current = handleVoiceCommand;

  const toggleVoiceRecognition = () => {
    if (!voiceSupported) {
      return;
    }

    if (isListening) {
      // Detener reconocimiento
      setIsListening(false);
      stopRecognition();
    } else {
      // Iniciar reconocimiento
      setIsListening(true);
      startRecognition();
    }
  };

  const nextStep = () => {
    if (currentStep < instructions.length - 1) {
      setCurrentStep(currentStep + 1);
      resetTimer();
    } else if (currentStep === instructions.length - 1) {
      setShowCompletion(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      resetTimer();
      if (showCompletion) {
        setShowCompletion(false);
      }
    }
  };

  const readCurrentStep = () => {
    const newAutoReadState = !autoRead;
    setAutoRead(newAutoReadState);

    // Si se está activando la lectura automática, leer la instrucción actual
    if (newAutoReadState && instructions[currentStep]) {
      setTimeout(() => {
        speak(instructions[currentStep]);
      }, 100);
    }
  };

  // Desactivar micrófono y leer la tarjeta cuando se muestra la receta completada
  useEffect(() => {
    if (showCompletion) {
      setIsListening(false);
      stopRecognition();
      if (autoReadRef.current) {
        setTimeout(() => {
          speak(`¡Receta completada! Has terminado de cocinar ${titulo}`);
        }, 300);
      }
    }
  }, [showCompletion, stopRecognition, speak, titulo]);

  // Configurar reconocimiento de voz
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onstart = () => {
        isRecognitionActiveRef.current = true;
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        isRecognitionActiveRef.current = false;
        // Solo reiniciar si el usuario quiere seguir escuchando
        if (isListeningRef.current) {
          setTimeout(() => {
            if (isListeningRef.current && !isRecognitionActiveRef.current) {
              startRecognition();
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Error en reconocimiento de voz:', event.error);
        isRecognitionActiveRef.current = false;
        setIsListening(false);

        if (event.error === 'not-allowed') {
          alert('Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.');
        } else if (event.error === 'no-speech') {
        }
      };

      recognitionRef.current.onresult = (event) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
        handleVoiceCommandRef.current?.(command);
      };

      setVoiceSupported(true);
    }

    // Configurar síntesis de voz
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current && isRecognitionActiveRef.current) {
        recognitionRef.current.stop();
        isRecognitionActiveRef.current = false;
      }
    };
  }, [startRecognition]);

  // Lectura automática solo cuando cambia el paso
  useEffect(() => {
    if (autoReadRef.current && instructionsRef.current[currentStep]) {
      const timer = setTimeout(() => {
        speak(instructionsRef.current[currentStep]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, speak]);

  const currentInstruction = instructions[currentStep] || 'No hay instrucciones disponibles';
  const suggestedTime = extractTimeFromStep(currentInstruction);
  const progress = ((currentStep + 1) / instructions.length) * 100;

  return (
    <div className="cooking-mode">
      <div className="cooking-header">
        <button onClick={onExit} className="exit-btn">
          <ArrowLeft size={24} />
          Salir
        </button>
        <div className="recipe-title">
          <ChefHat size={20} />
          {recipe.nombre || recipe.title || 'Modo Cocina'}
        </div>
        <div className="voice-controls">
          {voiceSupported && (
            <button
              onClick={toggleVoiceRecognition}
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              title={isListening ? 'Detener reconocimiento de voz' : 'Activar reconocimiento de voz'}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
          <button
            onClick={readCurrentStep}
            className={`speak-btn ${autoRead ? 'auto-read-active' : ''}`}
            title={autoRead ? 'Desactivar lectura automática' : 'Activar lectura automática'}
          >
            <Volume2 size={20} />
          </button>
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        <span className="progress-text">
          Paso {currentStep + 1} de {instructions.length}
        </span>
      </div>

      <div className="cooking-content">
        <div className="step-card">
          <div className="step-header">
            <h3>Paso {currentStep + 1}</h3>
          </div>

          <div className="step-instruction">
            {currentInstruction}
          </div>

          {suggestedTime && (
            <div className="timer-suggestion">
              <Clock size={16} />
              Tiempo: {suggestedTime} {suggestedTime>1? "minutos": "minuto"}
              <button
                onClick={() => {
                  startTimer(suggestedTime);
                  scrollAlTimer();
                }}
                className="btn-timer-start"
              >
                Iniciar temporizador
              </button>
            </div>
          )}

          {voiceSupported && (
            <div className="voice-commands">
              <h4>Comandos de voz disponibles</h4>
              <ul>
                <li>"Siguiente" - Avanzar al siguiente paso</li>
                <li>"Anterior" - Volver al paso anterior</li>
                <li>"Repetir" - Leer la instrucción actual</li>
                <li>"Iniciar" - Iniciar temporizador</li>
                <li>"Pausar" - Pausar temporizador</li>
                <li>"Reanudar" - Reanudar temporizador</li>
                <li>"Reiniciar" - Reiniciar el temporizador</li>
              </ul>
            </div>
          )}
        </div>

        {activeTimer === currentStep && (
          <div className="timer-display" ref={timerDisplayRef}>
            <div className="timer-circle">
              <div className="timer-time">{formatTime(timeLeft)}</div>
            </div>
            <div className="timer-controls">
              <button onClick={pauseTimer} className="timer-btn">
                {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={() => startTimer(suggestedTime)} className="timer-btn">
                <RotateCcw size={20} />
              </button>
            </div>
          </div>
        )}

        <div className="step-actions">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="step-btn step-btn-prev"
          >
            <SkipBack size={20} />
            Anterior
          </button>

          <button
            onClick={nextStep}
            disabled={showCompletion}
            className="step-btn step-btn-next"
          >
            {currentStep === instructions.length - 1 ? 'Finalizar' : 'Siguiente'}
            <SkipForward size={20} />
          </button>
        </div>
      </div>

      {showCompletion && (
        <CompletionCard
          recipe={recipe}
          titulo={titulo}
          onClose={() => {
            speechSynthesisRef.current?.cancel();
            setShowCompletion(false);
          }}
          onExit={() => {
            speechSynthesisRef.current?.cancel();
            onExit();
          }}
        />
      )}
    </div>
  );
};

export default CookingMode;
