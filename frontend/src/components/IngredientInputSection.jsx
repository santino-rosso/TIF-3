import { createPortal } from "react-dom";

const IngredientInputSection = ({
  modoIngredientes,
  ingredientes,
  imagen,
  imagenPreviewUrl,
  mostrarCamara,
  stream,
  videoRef,
  canvasRef,
  onModoChange,
  onIngredientesChange,
  onImagenChange,
  onClearImagen,
  onIniciarCamara,
  onCapturarFoto,
  onCerrarCamara,
}) => {
  return (
  <>
    {/* Modo de ingredientes */}
    <div className="bg-gray-50 p-4 rounded-lg">
      <label htmlFor="modo-ingredientes" className="block text-lg font-semibold mb-3 text-gray-700">
        ¿Cómo querés ingresar los ingredientes?
      </label>
      <select
        id="modo-ingredientes"
        value={modoIngredientes}
        onChange={onModoChange}
        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base bg-white text-gray-700"
      >
        <option value="imagen">Subir imagen o usar cámara</option>
        <option value="texto">Ingresarlos manualmente</option>
      </select>
    </div>

    {/* Campo de ingredientes */}
    <div className="space-y-2">
      <label htmlFor={modoIngredientes === "texto" ? "ingredientes" : undefined} className="block text-lg font-semibold text-gray-700">
        Ingredientes
      </label>
      {modoIngredientes === "texto" && (
        <textarea
          id="ingredientes"
          name="ingredientes"
          placeholder="Ej: tomate, arroz, huevo, cebolla, ajo..."
          value={ingredientes}
          onChange={onIngredientesChange}
          rows="4"
          className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base resize-none bg-white text-gray-700"
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
                  onClick={onIniciarCamara}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                >
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-green-700 font-medium">Usar cámara</span>
                </button>

                <div className="relative hover:border-blue-400 hover:bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onImagenChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="imagen-input"
                  />
                  <div className="flex items-center justify-center p-4">
                    <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-blue-700 font-medium">Subir imagen</span>
                  </div>
                </div>
              </div>

              {/* Mostrar imagen seleccionada */}
              {imagen && imagenPreviewUrl && (
                <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-green-800 font-medium">Imagen seleccionada:</p>
                    <button
                      type="button"
                      onClick={onClearImagen}
                      className="text-red-500 hover:text-red-700 text-xl"
                    >
                      ❌
                    </button>
                  </div>

                  {/* Vista previa de la imagen */}
                  <div className="mt-3">
                    <img
                      src={imagenPreviewUrl}
                      alt="Vista previa de ingredientes"
                      className="w-full max-w-xs mx-auto rounded-lg shadow-md"
                      style={{ maxHeight: '200px', objectFit: 'cover' }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Modal de cámara (portal al body para que el overlay cubra toda la pantalla) */
            createPortal(
              <div
                data-testid="modal-overlay"
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
                onClick={onCerrarCamara}
              >
                <div
                  className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Capturar foto</h3>
                  <button
                    type="button"
                    onClick={onCerrarCamara}
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

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={onCapturarFoto}
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
                  </div>
                </div>
              </div>
              </div>,
              document.body
            )
          )}

          {/* Canvas oculto para capturar la foto */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
      )}
    </div>
  </>
  );
};

export default IngredientInputSection;
