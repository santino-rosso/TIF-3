import { useState } from "react";
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
  const navigate = useNavigate();
  const { validarIngredientes: validarIngredientesHook } = useValidarIngredientes();


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
            <option value="imagen">📷 Subir imagen</option>
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
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImagen}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="imagen-input"
              />
              <div className="pointer-events-none">
                <div className="text-gray-600">
                  <span className="text-4xl mb-3 block">📸</span>
                  <p className="text-lg font-medium mb-1">
                    {imagen ? imagen.name : "Sube una imagen de tus ingredientes"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {imagen ? "Imagen seleccionada" : "Haz clic aquí o arrastra una imagen"}
                  </p>
                </div>
              </div>
            </div>
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