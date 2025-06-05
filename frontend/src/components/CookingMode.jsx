import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Mic, 
  MicOff,
  Volume2,
  SkipForward,
  SkipBack
} from 'lucide-react';
import './CookingMode.css';

const CookingMode = ({ recipe, onExit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [timers, setTimers] = useState({});
  const [activeTimer, setActiveTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [autoRead, setAutoRead] = useState(true);
  const wakeLockRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const isRecognitionActiveRef = useRef(false);

  // Extraer instrucciones de la receta
  const parseInstructions = (recipeText) => {
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
        /^\d+\./.test(cleanLine) || 
        /^-/.test(cleanLine) || 
        /^•/.test(cleanLine) ||
        (cleanLine.length > 15 && !cleanLine.includes(':')) // Líneas largas que no sean títulos
      )) {
        const cleanInstruction = cleanLine
          .replace(/^\d+\.\s*/, '')
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
        if (/^\d+\./.test(cleanLine)) {
          const cleanInstruction = cleanLine.replace(/^\d+\.\s*/, '').trim();
          if (cleanInstruction && cleanInstruction.length > 10) {
            instructions.push(cleanInstruction);
          }
        }
      }
    }
    
    return instructions.length > 0 ? instructions : ['No hay instrucciones disponibles. Por favor, revisa el formato de la receta.'];
  };

  const instructions = parseInstructions(recipe.texto_receta || recipe.receta || recipe.description || '');

  // Mantener pantalla encendida
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('Wake Lock activado - pantalla permanecerá encendida');
        }
      } catch (err) {
        console.log('Wake Lock no disponible:', err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        console.log('Wake Lock liberado');
      }
    };
  }, []);

  // Configurar reconocimiento de voz
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';
      
      recognitionRef.current.onstart = () => {
        console.log('Reconocimiento de voz iniciado');
        isRecognitionActiveRef.current = true;
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        console.log('Reconocimiento de voz terminado');
        isRecognitionActiveRef.current = false;
        // Solo reiniciar si el usuario quiere seguir escuchando
        if (isListening) {
          setTimeout(() => {
            if (isListening && !isRecognitionActiveRef.current) {
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
          console.log('No se detectó habla, reintentando...');
        }
      };
      
      recognitionRef.current.onresult = (event) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log('Comando detectado:', command);
        handleVoiceCommand(command);
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
  }, []);

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
  }, [isTimerRunning, timeLeft]);

  // Lectura automática solo cuando cambia el paso
  useEffect(() => {
    if (autoRead && instructions[currentStep]) {
      const timer = setTimeout(() => {
        speak(instructions[currentStep]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleVoiceCommand = (command) => {
    console.log('Comando de voz:', command);
    
    if (command.includes('siguiente') || command.includes('próximo')) {
      nextStep();
      speak('Siguiente paso');
    } else if (command.includes('anterior') || command.includes('volver')) {
      prevStep();
      speak('Paso anterior');
    } else if (command.includes('repetir') || command.includes('leer')) {
      speak(instructions[currentStep]);
    } else if (command.includes('temporizador') || command.includes('timer')) {
      const time = extractTimeFromCommand(command);
      if (time) {
        startTimer(time);
        speak(`Temporizador iniciado por ${time} minutos`);
      }
    } else if (command.includes('pausar') || command.includes('parar')) {
      pauseTimer();
      speak('Temporizador pausado');
    }
  };

  const extractTimeFromCommand = (command) => {
    const match = command.match(/(\d+)\s*(minuto|min)/);
    return match ? parseInt(match[1]) : null;
  };

  const speak = (text) => {
    if (speechSynthesisRef.current && text) {
      speechSynthesisRef.current.cancel(); // Cancelar cualquier síntesis anterior
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      speechSynthesisRef.current.speak(utterance);
    }
  };

  const startRecognition = () => {
    if (!recognitionRef.current || isRecognitionActiveRef.current) return;
    
    try {
      recognitionRef.current.start();
      console.log('Intentando iniciar reconocimiento...');
    } catch (error) {
      console.error('Error al iniciar reconocimiento:', error);
      setIsListening(false);
      isRecognitionActiveRef.current = false;
    }
  };

  const stopRecognition = () => {
    if (!recognitionRef.current || !isRecognitionActiveRef.current) return;
    
    try {
      recognitionRef.current.stop();
      console.log('Deteniendo reconocimiento...');
    } catch (error) {
      console.error('Error al detener reconocimiento:', error);
    }
  };

  const toggleVoiceRecognition = () => {
    if (!voiceSupported) {
      console.log('Reconocimiento de voz no soportado');
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

  const showTimerNotification = () => {
    // Vibración
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    // Notificación
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ ¡Tiempo terminado!', {
        body: `Paso ${currentStep + 1} completado`,
        icon: '/vite.svg',
        vibrate: [200, 100, 200]
      });
    }
    
    // Síntesis de voz
    speak('Tiempo terminado');
  };

  const startTimer = (minutes) => {
    const seconds = minutes * 60;
    setTimeLeft(seconds);
    setActiveTimer(currentStep);
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(0);
    setActiveTimer(null);
  };

  const nextStep = () => {
    if (currentStep < instructions.length - 1) {
      setCurrentStep(currentStep + 1);
      resetTimer();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      resetTimer();
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const extractTimeFromStep = (instruction) => {
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
  };

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
              Tiempo sugerido: {suggestedTime} minutos
              <button 
                onClick={() => startTimer(suggestedTime)}
                className="btn-timer-start"
              >
                Iniciar temporizador
              </button>
            </div>
          )}

          {voiceSupported && (
            <div className="voice-commands">
              <h4>Comandos de voz disponibles:</h4>
              <ul>
                <li>"Siguiente paso" - Avanzar al siguiente paso</li>
                <li>"Anterior" - Volver al paso anterior</li>
                <li>"Repetir" - Leer la instrucción actual</li>
                <li>"Temporizador X minutos" - Iniciar temporizador</li>
              </ul>
            </div>
          )}
        </div>

        {activeTimer === currentStep && (
          <div className="timer-display">
            <div className="timer-circle">
              <div className="timer-time">{formatTime(timeLeft)}</div>
            </div>
            <div className="timer-controls">
              <button onClick={pauseTimer} className="timer-btn">
                {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={resetTimer} className="timer-btn">
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
            disabled={currentStep === instructions.length - 1}
            className="step-btn step-btn-next"
          >
            Siguiente
            <SkipForward size={20} />
          </button>
        </div>
      </div>

      {currentStep === instructions.length - 1 && (
        <div className="completion-card">
          <h3>🎉 ¡Receta completada!</h3>
          <p>¡Felicitaciones! Has terminado de cocinar {recipe.nombre || recipe.title}</p>
          <button onClick={onExit} className="btn-finish">
            Finalizar cocina
          </button>
        </div>
      )}
    </div>
  );
};

export default CookingMode;
