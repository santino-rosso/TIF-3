import axiosInstance from "../utils/axiosInstance";
import { useEffect, useState } from "react";
import "../styles/recetas.css";
import CookingMode from './CookingMode';
import {
  List,
  ChefHat,
  ClipboardList,
  Clock,
  Microwave,
  StickyNote,
  UtensilsCrossed,
  BadgeCheck,
  AlertTriangle,
  FileText,
  Star,
  Repeat
} from 'lucide-react';

// Función para detectar si una línea es un título de receta
const esTituloReceta = (linea) => {
  const palabrasClave = [
    'nombre de la receta',
    'ingredientes',
    'preparación',
    'instrucciones',
    'procedimiento',
    'elaboración',
    'tiempo de',
    'utensilios',
    'herramientas',
    'notas',
    'consejos',
    'sugerencias',
    'variaciones',
    'tipo de comida',
    'nivel de experiencia',
    'preferencias dietéticas',
    'restricciones'
  ];
  
  const lineaLower = linea.toLowerCase().trim();
  return palabrasClave.some(palabra => lineaLower.includes(palabra)) && 
         lineaLower.length < 50; // Los títulos suelen ser cortos
};

// Función para formatear el texto de la receta como JSX
const formatearReceta = (texto) => {
  if (!texto) return null;
  const lineas = texto.split('\n');
  const bloques = [];
  let listaActual = [];
  let pasosActual = [];

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    // Líneas vacías: cierran listas/pasos
    if (!linea) {
      if (listaActual.length > 0) {
        bloques.push(
          <ul className="lista-ingredientes space-y-1 ml-4" key={`ul-${i}`}>{listaActual}</ul>
        );
        listaActual = [];
      }
      if (pasosActual.length > 0) {
        bloques.push(
          <div className="space-y-3 ml-2" key={`pasos-${i}`}>{pasosActual}</div>
        );
        pasosActual = [];
      }
      bloques.push(<div className="mb-3" key={`spacer-${i}`}></div>);
      continue;
    }
    // Títulos
    if ((linea.includes('**') && linea.includes(':')) || linea.endsWith(':') || esTituloReceta(linea)) {
      if (listaActual.length > 0) {
        bloques.push(
          <ul className="lista-ingredientes space-y-1 ml-4" key={`ul-${i}`}>{listaActual}</ul>
        );
        listaActual = [];
      }
      if (pasosActual.length > 0) {
        bloques.push(
          <div className="space-y-3 ml-2" key={`pasos-${i}`}>{pasosActual}</div>
        );
        pasosActual = [];
      }
      let titulo = linea.replace(/\*\*/g, '').replace(':', '').trim();
      // Si es el nombre de la receta, extraer solo el nombre y no mostrar icono
      let showIcon = true;
      if (/^nombre de la receta/i.test(titulo)) {
        titulo = titulo.replace(/^nombre de la receta\s*/i, '').trim();
        showIcon = false;
      }
      bloques.push(
        <div className="mt-6 mb-4 first:mt-0" key={`header-${i}`}> 
          <h3 className="seccion-titulo text-lg font-bold text-gray-800 flex items-center gap-3 pb-2 border-b-2 border-gray-200">
            {showIcon && getTituloIcon(titulo)}
            <span>{titulo}</span>
          </h3>
        </div>
      );
      continue;
    }
    // Lista
    if (linea.startsWith('-')) {
      const contenido = linea.substring(1).trim();
      listaActual.push(
        <li className="flex items-start gap-3 py-2" key={`li-${i}`}>
          <span className="bg-gradient-to-r from-green-400 to-green-500 rounded-full w-2 h-2 mt-2 flex-shrink-0 shadow-sm"></span>
          <span className="text-gray-700 leading-relaxed">{contenido}</span>
        </li>
      );
      continue;
    }
    // Pasos numerados
    if (/^\d+\./.test(linea)) {
      const numero = linea.match(/^(\d+)\./)[1];
      const contenido = linea.replace(/^\d+\.\s*/, '');
      pasosActual.push(
        <div className="paso-preparacion flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400 shadow-sm mb-3" key={`paso-${i}`}> 
          <span className="paso-numero bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md">{numero}</span>
          <div className="flex-1">
            <span className="text-gray-800 leading-relaxed font-medium">{contenido}</span>
          </div>
        </div>
      );
      continue;
    }
    // Info especial
    if (linea.includes('Tiempo') || linea.includes('Porciones') || linea.includes('Dificultad') || 
        linea.includes('Calorías') || linea.includes('Costo') || linea.includes('Rendimiento')) {
      if (listaActual.length > 0) {
        bloques.push(
          <ul className="lista-ingredientes space-y-1 ml-4" key={`ul-${i}`}>{listaActual}</ul>
        );
        listaActual = [];
      }
      if (pasosActual.length > 0) {
        bloques.push(
          <div className="space-y-3 ml-2" key={`pasos-${i}`}>{pasosActual}</div>
        );
        pasosActual = [];
      }
      bloques.push(
        <div className="info-destacada bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-4 shadow-sm" key={`info-${i}`}> 
          <p className="text-amber-800 font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {linea}
          </p>
        </div>
      );
      continue;
    }
    // Párrafos normales
    if (listaActual.length > 0) {
      bloques.push(
        <ul className="lista-ingredientes space-y-1 ml-4" key={`ul-${i}`}>{listaActual}</ul>
      );
      listaActual = [];
    }
    if (pasosActual.length > 0) {
      bloques.push(
        <div className="space-y-3 ml-2" key={`pasos-${i}`}>{pasosActual}</div>
      );
      pasosActual = [];
    }
    bloques.push(
      <p className="text-gray-700 mb-3 leading-relaxed" key={`p-${i}`}>{linea}</p>
    );
  }
  // Cierra listas/pasos al final
  if (listaActual.length > 0) {
    bloques.push(
      <ul className="lista-ingredientes space-y-1 ml-4" key={`ul-final`}>{listaActual}</ul>
    );
  }
  if (pasosActual.length > 0) {
    bloques.push(
      <div className="space-y-3 ml-2" key={`pasos-final`}>{pasosActual}</div>
    );
  }
  return bloques;
};

// Función para obtener iconos según el título
const getTituloIcon = (titulo) => {
  const tituloLower = titulo.toLowerCase();
  if (tituloLower.includes('nombre') || tituloLower.includes('receta')) return null;
  if (tituloLower.includes('ingredientes')) return <List className="w-6 h-6 text-green-500" />;
  if (
    tituloLower.includes('preparación') ||
    tituloLower.includes('instrucciones') ||
    tituloLower.includes('procedimiento') ||
    tituloLower.includes('elaboración')
  ) return <ClipboardList className="w-6 h-6 text-blue-500" />;
  if (tituloLower.includes('tiempo')) return <Clock className="w-6 h-6 text-purple-500" />;
  if (tituloLower.includes('utensilios') || tituloLower.includes('herramientas')) return <Microwave className="w-6 h-6 text-gray-600" />;
  if (
    tituloLower.includes('notas') ||
    tituloLower.includes('consejos') ||
    tituloLower.includes('sugerencias') ||
    tituloLower.includes('variaciones')
  ) return <StickyNote className="w-6 h-6 text-yellow-500" />;
  if (tituloLower.includes('tipo de comida')) return <UtensilsCrossed className="w-6 h-6 text-orange-500" />;
  if (tituloLower.includes('nivel de experiencia')) return <BadgeCheck className="w-6 h-6 text-indigo-500" />;
  if (tituloLower.includes('preferencias dietéticas')) return <Star className="w-6 h-6 text-yellow-400" />;
  if (tituloLower.includes('restricciones')) return <AlertTriangle className="w-6 h-6 text-red-600" />;
  return <FileText className="w-6 h-6 text-gray-500" />;
};

const RecetaCard = ({ receta, similares, tipo = "generada" }) => {
  const [guardadas, setGuardadas] = useState({
    principal: false,
    similares: similares ? new Array(similares.length).fill(false) : []
  });
  const [showCookingMode, setShowCookingMode] = useState(false);

  useEffect(() => {
    const cargarFavoritos = async () => {
      try {
        const res = await axiosInstance.get("/favoritos"); 
        const favoritosIds = res.data.favoritos.map((fav) => fav._id);

        const principalId = receta._id;
        const similaresIds = similares?.map(r => r._id) || [];

        const nuevasSimilares = similaresIds.map(id => favoritosIds.includes(id));
        const esFavoritoPrincipal = favoritosIds.includes(principalId);

        setGuardadas({
          principal: esFavoritoPrincipal,
          similares: nuevasSimilares
        });
      } catch (error) {
        console.error("Error al cargar favoritos del usuario:", error);
      }
    };

    cargarFavoritos();
  }, [receta, similares]);

  const toggleFavorito = async (recetaId, esPrincipal, index = -1) => {
    const yaGuardada = esPrincipal ? guardadas.principal : guardadas.similares[index];

    try {
      if (yaGuardada) {
        await axiosInstance.delete(`/favoritos/${recetaId}`);
      } else {
        await axiosInstance.post(`/favoritos/${recetaId}`);
      }

      if (esPrincipal) {
        setGuardadas(prev => ({ ...prev, principal: !yaGuardada }));
      } else {
        const nuevas = [...guardadas.similares];
        nuevas[index] = !yaGuardada;
        setGuardadas(prev => ({ ...prev, similares: nuevas }));
      }
    } catch (error) {
      console.error("Error al actualizar favorito:", error);
      alert("Hubo un problema al actualizar tus favoritos.");
    }
  };

  const startCookingMode = (recipe = null) => {
    // Solicitar permisos de notificación
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setShowCookingMode(recipe || receta);
  };

  // Si está en modo cocina, mostrar el componente CookingMode
  if (showCookingMode) {
    return (
      <CookingMode 
        recipe={showCookingMode} 
        onExit={() => setShowCookingMode(false)} 
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Receta Principal */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header de la receta */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              {tipo === "generada" ? (
                <>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ChefHat className="w-8 h-8 text-white" />
                    Tu Receta Personalizada
                  </h2>
                  <p className="text-green-100 text-sm">Creada especialmente para ti</p>
                </>
              ) : tipo === "favorita" ? (
                <>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ChefHat className="w-8 h-8 text-white" />
                    Receta guardada
                  </h2>
                  <p className="text-green-100 text-sm">Marcada como favorita por vos</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ChefHat className="w-8 h-8 text-white" />
                    Receta recomendada para vos
                  </h2>
                  <p className="text-green-100 text-sm">Sugerida según tus favoritas</p>
                </>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => startCookingMode()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <ChefHat className="w-5 h-5" />
                <span className="hidden sm:inline">Modo Cocina</span>
                <span className="sm:hidden">Cocinar</span>
              </button>
              <button
                onClick={() => toggleFavorito(receta._id, true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  guardadas.principal 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-white hover:bg-gray-50 text-green-600'
                }`}
              >
              <svg className="w-5 h-5" fill={guardadas.principal ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="hidden sm:inline">
                {guardadas.principal ? 'Quitar de favoritos' : 'Guardar como favorita'}
              </span>
              <span className="sm:hidden">
                {guardadas.principal ? 'Quitar' : 'Guardar'}
              </span>
            </button>
            </div>
          </div>
        </div>

        {/* Contenido de la receta */}
        <div className="p-6">
          <div className="prose prose-gray max-w-none">
            <div className="receta-container bg-gray-50 rounded-lg p-6 border-l-4 border-green-500">
              <div className="texto-receta text-gray-800 leading-relaxed">
                {formatearReceta(receta.texto_receta || receta)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recetas Similares */}
      {similares?.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Recetas Similares</h3>
            <p className="text-gray-600">Otras opciones que podrían interesarte</p>
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto mt-3 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {similares.map((rec, idx) => (
              <div key={idx} className="receta-card bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 overflow-hidden">
                {/* Header de receta similar */}
                <div className="bg-gradient-to-r from-green-500 to-blue-500 px-5 py-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Repeat className="w-6 h-6 text-white" />
                      Receta Alternativa {idx + 1}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCookingMode(rec)}
                        className="flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span className="hidden sm:inline">Modo Cocina</span>
                        <span className="sm:hidden">Cocinar</span>
                      </button>
                      <button
                        onClick={() => toggleFavorito(rec._id, false, idx)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all ${
                          guardadas.similares[idx] 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-white hover:bg-gray-50 text-green-600'
                        }`}
                      >
                        <svg className="w-4 h-4" fill={guardadas.similares[idx] ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="hidden sm:inline">
                          {guardadas.similares[idx] ? 'Guardada' : 'Guardar'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contenido de receta similar */}
                <div className="p-5">
                  <div className="receta-container bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400">
                    <div className="texto-receta text-gray-800 leading-relaxed">
                      {formatearReceta(rec.texto_receta)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecetaCard;
