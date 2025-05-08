const RecetaCard = ({ receta, similares }) => (
    <div className="mt-6">
      <h2 className="text-xl font-semibold text-green-700">Receta Generada</h2>
      <pre className="bg-white p-4 rounded shadow whitespace-pre-wrap">{receta}</pre>
  
      {similares?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-700">Recetas Similares</h3>
          {similares.map((rec, idx) => (
            <pre key={idx} className="bg-gray-100 p-2 mt-2 rounded whitespace-pre-wrap">
              {rec.texto_receta}
            </pre>
          ))}
        </div>
      )}
    </div>
  );
  
  export default RecetaCard;
  