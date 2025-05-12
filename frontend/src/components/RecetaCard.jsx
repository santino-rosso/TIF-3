import axiosInstance from "../utils/axiosInstance";
import { useEffect, useState } from "react";

const RecetaCard = ({ receta, similares }) => {
  const [guardadas, setGuardadas] = useState({
    principal: false,
    similares: similares ? new Array(similares.length).fill(false) : []
  });

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

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-green-700">Receta Generada</h2>
        <button
          onClick={() => toggleFavorito(receta._id, true)}
          className="text-lg"
        >
          {guardadas.principal ? '💔 Quitar de favoritos' : '❤️ Guardar como favorita'}
        </button>
      </div>

      <pre className="bg-white p-4 rounded shadow whitespace-pre-wrap">
        {receta.texto_receta || receta}
      </pre>

      {similares?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-700">Recetas Similares</h3>
          {similares.map((rec, idx) => (
            <div key={idx} className="relative mt-4">
              <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
                {rec.texto_receta}
              </pre>
              <button
                onClick={() => toggleFavorito(rec._id, false, idx)}
                className="text-sm mt-2"
              >
                {guardadas.similares[idx] ? '💔 Quitar de favoritos' : '❤️ Guardar como favorita'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecetaCard;
