import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useValidarIngredientes } from "../utils/useValidarIngredientes";
import { confirmarIngredientes } from "../utils/confirmarIngredientes.jsx";

const FormularioReceta = () => {
  const [modoIngredientes, setModoIngredientes] = useState("imagen"); 
  const [datos, setDatos] = useState({
    preferencias: "",
    restricciones: "",
    tiempo: "",
    tipo_comida: "",
    herramientas: "",
    experiencia: "",
    ingredientes: "",
  });
  const [imagen, setImagen] = useState(null);
  const [errores, setErrores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { validarIngredientes: validarIngredientesHook } = useValidarIngredientes();

  // Limpiar recursos de la cámara al desmontar el componente
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Asignar el stream al video cuando se abra la cámara
  useEffect(() => {
    if (mostrarCamara && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [mostrarCamara, stream]);

  // Limpiar URL de objeto cuando cambie la imagen
  useEffect(() => {
    return () => {
      if (imagen && typeof imagen === 'object' && imagen.name) {
        // Solo limpiar si es un File object con una URL creada
        const url = URL.createObjectURL(imagen);
        URL.revokeObjectURL(url);
      }
    };
  }, [imagen]);


  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleImagen = (e) => {
    setImagen(e.target.files[0]);
  };

  const handleModoChange = (e) => {
    setModoIngredientes(e.target.value);
    // Limpiar campos al cambiar modo
    setDatos((prev) => ({ ...prev, ingredientes: "" }));
    setImagen(null);
    // Cerrar cámara si está abierta
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setMostrarCamara(false);
  };

  const iniciarCamara = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Usar cámara trasera por defecto
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      setStream(mediaStream);
      setMostrarCamara(true);
      
      // Limpiar errores previos
      setErrores([]);
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      setErrores(['No se pudo acceder a la cámara. Verifica los permisos o prueba con otro navegador.']);
    }
  };

  const capturarFoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'foto-ingredientes.jpg', { type: 'image/jpeg' });
        setImagen(file);
        cerrarCamara();
      }, 'image/jpeg', 0.8);
    }
  };

  const cerrarCamara = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setMostrarCamara(false);
  };

  const validarFormulario = () => {
    const nuevosErrores = [];
    if (!datos.ingredientes && modoIngredientes === "texto") nuevosErrores.push("El campo 'ingredientes' es obligatorio.");
    if (!imagen && modoIngredientes === "imagen") nuevosErrores.push("Debes subir una imagen de los ingredientes.");
    return nuevosErrores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validar el formulario
    const nuevosErrores = validarFormulario();
    if (nuevosErrores.length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    // Limpiar errores anteriores
    setErrores([]);

    try {
      const ingredientesRes = await validarIngredientesHook(datos, modoIngredientes, imagen);
      
      let ingredientesFinales = "";

      if (ingredientesRes.ingredientes_no_aprobados) {
        // Mostrar ingredientes no aptos al usuario
        const confirmados = await confirmarIngredientes(ingredientesRes.ingredientes_no_aprobados);
        
        // Filtrar los ingredientes válidos
        const ingredientesValidos = ingredientesRes.ingredientes.filter(ingrediente => {
          // Verificar si el ingrediente está en la lista de no aprobados
          const esNoAprobado = ingredientesRes.ingredientes_no_aprobados.some(
            ([ingredienteNoAprobado]) => ingredienteNoAprobado === ingrediente
          );
          
          // Si no está en la lista de no aprobados, lo mantenemos
          if (!esNoAprobado) {
            return true;
          }
          
          // Si está en la lista de no aprobados, lo mantenemos solo si fue confirmado
          return confirmados.includes(ingrediente);
        });
        
        // Guardar los ingredientes válidos para usar inmediatamente
        ingredientesFinales = ingredientesValidos.join(", ");
      } else {
        // Si no hay ingredientes no aprobados, guardar los ingredientes directamente
        ingredientesFinales = ingredientesRes.ingredientes_validados.join(", ");
      }

      // Actualizar el estado (esto no se refleja inmediatamente)
      setDatos((prev) => ({ ...prev, ingredientes: ingredientesFinales }));

      // Crear FormData para generar la receta usando los ingredientes filtrados
      const formDataGenerar = new FormData();
      // Usar los datos actuales para todos los campos excepto ingredientes
      Object.entries(datos).forEach(([key, value]) => {
        if (key !== "ingredientes") {
          formDataGenerar.append(key, value);
        }
      });

      // Añadir los ingredientes filtrados correctamente
      formDataGenerar.append("ingredientes", ingredientesFinales);

      // Enviar la solicitud para generar la receta
      const recetaRes = await axiosInstance.post("/generar-receta", formDataGenerar);
      localStorage.setItem("recetaGenerada", JSON.stringify(recetaRes.data));
      navigate("/resultados");
    } catch (err) {
      const mensajeError = err.response?.data?.error || "Error al generar la receta. Por favor, intenta nuevamente.";
      setErrores([mensajeError]);
    } finally {
      setLoading(false);
    }
  };

  return (
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="flex flex-col items-center bg-white rounded-lg p-6 shadow-xl">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-700 text-lg font-medium">Generando receta...</p>
          </div>
        </div>
        )}

        {/* Modo de ingredientes */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-lg font-semibold mb-3 text-gray-700">
            ¿Cómo querés ingresar los ingredientes?
          </label>
          <select 
            value={modoIngredientes} 
            onChange={handleModoChange} 
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
          >
            <option value="imagen">📷 Subir imagen o usar cámara</option>
            <option value="texto">✍️ Ingresarlos manualmente</option>
          </select>
        </div>

        {/* Campo de ingredientes */}
        <div className="space-y-2">
          <label className="block text-lg font-semibold text-gray-700">
            Ingredientes
          </label>
          {modoIngredientes === "texto" && (
            <textarea
              name="ingredientes"
              placeholder="Ej: tomate, arroz, huevo, cebolla, ajo..."
              value={datos.ingredientes}
              onChange={handleChange}
              rows="4"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base resize-none"
            />
          )}

          {modoIngredientes === "imagen" && (
            <>
              {!mostrarCamara ? (
                <div className="space-y-4">
                  {/* Botones para elegir entre archivo y cámara */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={iniciarCamara}
                      className="flex items-center justify-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                    >
                      <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-green-700 font-medium">Usar cámara</span>
                    </button>
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImagen}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="imagen-input"
                      />
                      <div className="flex items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                        <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-blue-700 font-medium">Subir imagen</span>
                      </div>
                    </div>
                  </div>

                  {/* Mostrar imagen seleccionada */}
                  {imagen && (
                    <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-green-600 text-2xl mr-3">✅</span>
                          <div>
                            <p className="text-green-800 font-medium">Imagen seleccionada:</p>
                            <p className="text-green-600 text-sm">{imagen.name}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setImagen(null)}
                          className="text-red-500 hover:text-red-700 text-xl"
                        >
                          ❌
                        </button>
                      </div>
                      
                      {/* Vista previa de la imagen */}
                      <div className="mt-3">
                        <img
                          src={URL.createObjectURL(imagen)}
                          alt="Vista previa de ingredientes"
                          className="w-full max-w-xs mx-auto rounded-lg shadow-md"
                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Modal de cámara */
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Capturar foto</h3>
                      <button
                        type="button"
                        onClick={cerrarCamara}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover rounded-lg"
                          style={{ minHeight: '300px' }}
                        />
                        {!stream && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                            <p className="text-gray-600">Iniciando cámara...</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-center space-x-4">
                        <button
                          type="button"
                          onClick={capturarFoto}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                          <span className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Capturar
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={cerrarCamara}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Canvas oculto para capturar la foto */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </>
          )}
        </div>

        {/* Grid de campos adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Preferencias alimentarias
            </label>
            <input
              type="text"
              name="preferencias"
              placeholder="Ej: vegetariano, sin gluten..."
              value={datos.preferencias}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Restricciones alimentarias
            </label>
            <input
              type="text"
              name="restricciones"
              placeholder="Ej: alergias, intolerancias..."
              value={datos.restricciones}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tiempo disponible
            </label>
            <input
              type="text"
              name="tiempo"
              placeholder="Ej: 30 minutos, 1 hora..."
              value={datos.tiempo}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de comida
            </label>
            <input
              type="text"
              name="tipo_comida"
              placeholder="Ej: desayuno, almuerzo, cena..."
              value={datos.tipo_comida}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Herramientas disponibles
            </label>
            <input
              type="text"
              name="herramientas"
              placeholder="Ej: horno, sartén, licuadora..."
              value={datos.herramientas}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nivel de experiencia
            </label>
            <input
              type="text"
              name="experiencia"
              placeholder="Ej: principiante, intermedio, avanzado..."
              value={datos.experiencia}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
            />
          </div>
        </div>

        {/* Errores */}
        {errores.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-lg">⚠️</span>
              <span className="ml-2 font-semibold">Error:</span>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {errores.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Botón de envío */}
        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-300 shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Generando...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span className="mr-2">🍳</span>
                Generar Receta
              </span>
            )}
          </button>
        </div>
      </form>
  );
};

export default FormularioReceta;