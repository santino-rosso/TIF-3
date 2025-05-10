import axiosInstance from "../utils/axiosInstance";
import { useState } from "react";

const RecetaCard = ({ receta, similares }) => {
   // Estado para rastrear qué recetas han sido guardadas
  const [guardadas, setGuardadas] = useState({
    principal: false,
    similares: similares ? new Array(similares.length).fill(false) : []
  });

  const handleGuardarFavorito = async (recetaId, esPrincipal, index = -1) => {
    try {
      await axiosInstance.post(`/favoritos/${recetaId}`);

      // Actualizar el estado para mostrar feedback visual
      if (esPrincipal) {
        setGuardadas(prev => ({ ...prev, principal: true }));
      } else {
        const nuevasGuardadas = [...guardadas.similares];
        nuevasGuardadas[index] = true;
        setGuardadas(prev => ({ ...prev, similares: nuevasGuardadas }));
      }

      alert("¡Receta guardada como favorita!");
    } catch (error) {
      console.error("Error al guardar favorito:", error);
      alert(error.response?.data?.detail || "Error al guardar la receta como favorita");
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold text-green-700">Receta Generada</h2>
      <pre className="bg-white p-4 rounded shadow whitespace-pre-wrap">{receta.texto_receta || receta}</pre>
      <button
          onClick={() => handleGuardarFavorito(receta._id, true)}
          className={`${guardadas.principal ? 'bg-gray-400' : 'bg-yellow-400 hover:bg-yellow-500'} text-white font-semibold px-3 py-1 rounded mt-2`}
          disabled={guardadas.principal}
        >
          {guardadas.principal ? '✓ Guardada' : '❤️ Guardar como favorita'}
      </button>

      {similares?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-700">Recetas Similares</h3>
          {similares.map((rec, idx) => (
            <div key={idx} className="relative mt-2">
              <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
                {rec.texto_receta}
              </pre>
              <button
                onClick={() => handleGuardarFavorito(rec._id, false, idx)}
                className={`${guardadas.similares[idx] ? 'bg-gray-400' : 'bg-yellow-400 hover:bg-yellow-500'} text-white font-semibold px-3 py-1 rounded mt-2`}
                disabled={guardadas.similares[idx]}
              >
                {guardadas.similares[idx] ? '✓ Guardada' : '❤️ Guardar como favorita'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecetaCard;