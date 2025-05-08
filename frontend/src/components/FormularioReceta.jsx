import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

    const formData = new FormData();
    // Campos comunes
    Object.entries(datos).forEach(([key, value]) => {
      if (modoIngredientes === "texto" || key !== "ingredientes") {
        formData.append(key, value);
      }
    });

    // Si es imagen, la agregamos
    if (modoIngredientes === "imagen" && imagen) {
      formData.append("imagen", imagen);
    }

    try {
      const res = await axios.post("http://localhost:8000/api/generar-receta", formData);
      localStorage.setItem("recetaGenerada", JSON.stringify(res.data));
      navigate("/resultados");
    } catch (err) {
      console.error(err);
      setErrores(["Error al generar la receta. Por favor, intenta nuevamente."]);
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