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
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-white text-lg">Generando receta...</p>
          </div>
        </div>
        )}

        <div className="flex items-center gap-4">
          <label className="font-semibold">¿Cómo querés ingresar los ingredientes?</label>
          <select value={modoIngredientes} onChange={handleModoChange} className="border p-2 rounded">
            <option value="imagen">Subir imagen</option>
            <option value="texto">Ingresarlos manualmente</option>
          </select>
        </div>

        {modoIngredientes === "texto" && (
          <textarea
            name="ingredientes"
            placeholder="Ej: tomate, arroz, huevo..."
            value={datos.ingredientes}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        )}

        {modoIngredientes === "imagen" && (
          <input
            type="file"
            accept="image/*"
            onChange={handleImagen}
            className="w-full border p-2 rounded"
          />
        )}

        {["preferencias", "restricciones", "tiempo", "tipo_comida", "herramientas", "experiencia"].map((campo) => (
          <input
            key={campo}
            type="text"
            name={campo}
            placeholder={campo}
            value={datos[campo]}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        ))}

        {errores.length > 0 && (
          <div className="bg-red-100 text-red-700 p-2 rounded">
            <ul className="list-disc list-inside">
              {errores.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
          Generar Receta
        </button>
      </form>
  );
};

export default FormularioReceta;