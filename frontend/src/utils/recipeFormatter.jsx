import {
  List,
  ClipboardList,
  Clock,
  Microwave,
  StickyNote,
  UtensilsCrossed,
  BadgeCheck,
  Star,
  AlertTriangle,
  FileText,
} from 'lucide-react';

// Regex para detectar y quitar el prefijo de pasos numerados
export const NUMBERED_STEP_REGEX = /^\d+\./;
export const NUMBERED_STEP_STRIP_REGEX = /^\d+\.\s*/;

// Pone la primera letra de cada palabra en mayúscula
export const toTitleCase = (texto) => {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

// Función para detectar si una línea es un título de receta
export const esTituloReceta = (linea) => {
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
export const formatearReceta = (texto) => {
  if (!texto) return null;
  const lineas = texto.split('\n');
  const bloques = [];
  let listaActual = [];
  let pasosActual = [];

  // Función para determinar la clase de lista según la sección
  const getListaClass = (seccion) => {
    const seccionLower = seccion.toLowerCase();
    if (seccionLower.includes('preferencias')) return 'lista-ingredientes lista-preferencias';
    if (seccionLower.includes('restricciones')) return 'lista-ingredientes lista-restricciones';
    if (seccionLower.includes('herramientas') || seccionLower.includes('utensilios')) return 'lista-ingredientes lista-herramientas';
    return 'lista-ingredientes';
  };

  let seccionActual = 'default';

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    // Líneas vacías: cierran listas/pasos
    if (!linea) {
      if (listaActual.length > 0) {
        const className = getListaClass(seccionActual);
        bloques.push(
          <ul className={`${className} space-y-1 ml-4`} key={`ul-${i}`}>{listaActual}</ul>
        );
        listaActual = [];
      }
      if (pasosActual.length > 0) {
        bloques.push(
          <ul className="lista-pasos space-y-3 ml-4" key={`pasos-${i}`}>{pasosActual}</ul>
        );
        pasosActual = [];
      }
      bloques.push(<div className="mb-3" key={`spacer-${i}`}></div>);
      continue;
    }
    // Títulos
    if ((linea.includes('**') && linea.includes(':')) || linea.endsWith(':') || esTituloReceta(linea)) {
      if (listaActual.length > 0) {
        const className = getListaClass(seccionActual);
        bloques.push(
          <ul className={`${className} space-y-1 ml-4`} key={`ul-${i}`}>{listaActual}</ul>
        );
        listaActual = [];
      }
      if (pasosActual.length > 0) {
        bloques.push(
          <ul className="lista-pasos space-y-3 ml-4" key={`pasos-${i}`}>{pasosActual}</ul>
        );
        pasosActual = [];
      }
      let titulo = linea.replace(/\*\*/g, '').replace(':', '').trim();
      // Actualizar sección actual para los bullets
      const tituloLower = titulo.toLowerCase();
      if (tituloLower.includes('preferencias dietéticas')) seccionActual = 'preferencias';
      else if (tituloLower.includes('restricciones')) seccionActual = 'restricciones';
      else if (tituloLower.includes('herramientas') || tituloLower.includes('utensilios')) seccionActual = 'herramientas';
      else seccionActual = 'default';
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
        <li className="flex items-center gap-3 py-2" key={`li-${i}`}>
          <span className="text-gray-700 leading-relaxed">{toTitleCase(contenido)}</span>
        </li>
      );
      continue;
    }
    // Pasos numerados
    if (NUMBERED_STEP_REGEX.test(linea)) {
      const numero = linea.match(/^(\d+)\./)[1];
      const contenido = linea.replace(NUMBERED_STEP_STRIP_REGEX, '');
      pasosActual.push(
        <li className="flex items-center gap-3 py-2" data-paso={numero} key={`paso-${i}`}>
          <span className="text-gray-700 leading-relaxed">{contenido}</span>
        </li>
      );
      continue;
    }
    // Info especial
    if (linea.includes('Tiempo') || linea.includes('Porciones') || linea.includes('Dificultad') ||
        linea.includes('Calorías') || linea.includes('Costo') || linea.includes('Rendimiento')) {
      if (listaActual.length > 0) {
        const className = getListaClass(seccionActual);
        bloques.push(
          <ul className={`${className} space-y-1 ml-4`} key={`ul-${i}`}>{listaActual}</ul>
        );
        listaActual = [];
      }
      if (pasosActual.length > 0) {
        bloques.push(
          <ul className="lista-pasos space-y-3 ml-4" key={`pasos-${i}`}>{pasosActual}</ul>
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
      const className = getListaClass(seccionActual);
      bloques.push(
        <ul className={`${className} space-y-1 ml-4`} key={`ul-${i}`}>{listaActual}</ul>
      );
      listaActual = [];
    }
if (pasosActual.length > 0) {
        bloques.push(
          <ul className="lista-pasos space-y-3 ml-4 ml-4" key={`pasos-${i}`}>{pasosActual}</ul>
        );
        pasosActual = [];
      }
      bloques.push(
      <p className="text-gray-700 mb-3 leading-relaxed" key={`p-${i}`}>{linea}</p>
    );
  }
  // Cierra listas/pasos al final
  if (listaActual.length > 0) {
    const className = getListaClass(seccionActual);
    bloques.push(
      <ul className={`${className} space-y-1 ml-4`} key={`ul-final`}>{listaActual}</ul>
    );
  }
  if (pasosActual.length > 0) {
    bloques.push(
      <ul className="lista-pasos space-y-3 ml-4 ml-4" key={`pasos-final`}>{pasosActual}</ul>
    );
  }
  return bloques;
};

// Función para obtener iconos según el título
export const getTituloIcon = (titulo) => {
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
