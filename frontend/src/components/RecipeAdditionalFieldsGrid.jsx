const fieldClassName = "w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base bg-white text-gray-700";

const fields = [
  {
    name: "preferencias",
    label: "Preferencias alimentarias",
    placeholder: "Ej: vegetariano, sin gluten...",
  },
  {
    name: "restricciones",
    label: "Restricciones alimentarias",
    placeholder: "Ej: alergias, intolerancias...",
  },
  {
    name: "tiempo",
    label: "Tiempo disponible",
    placeholder: "Ej: 30 minutos, 1 hora...",
  },
  {
    name: "tipo_comida",
    label: "Tipo de comida",
    placeholder: "Ej: desayuno, almuerzo, cena...",
  },
  {
    name: "herramientas",
    label: "Herramientas disponibles",
    placeholder: "Ej: horno, sartén, licuadora...",
  },
  {
    name: "experiencia",
    label: "Nivel de experiencia",
    placeholder: "Ej: principiante, intermedio, avanzado...",
  },
];

const RecipeAdditionalFieldsGrid = ({ datos, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {fields.map(({ name, label, placeholder }) => (
      <div key={name}>
        <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
        <input
          id={name}
          type="text"
          name={name}
          placeholder={placeholder}
          value={datos[name]}
          onChange={onChange}
          className={fieldClassName}
        />
      </div>
    ))}
  </div>
);

export default RecipeAdditionalFieldsGrid;
