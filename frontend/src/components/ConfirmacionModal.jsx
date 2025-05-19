import React from "react";

const ConfirmacionModal = ({ isOpen, onClose, ingrediente, motivo, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-3">Confirmación de ingrediente</h3>
        <p className="mb-4">
          El ingrediente <span className="font-bold">"{ingrediente}"</span> no es apto debido a: 
          <span className="text-red-600 font-medium"> {motivo}</span>
        </p>
        <p className="mb-6">¿Es apto para ti de todos modos?</p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
          >
            No, excluir
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-500 rounded text-white hover:bg-green-600 transition-colors"
          >
            Sí, incluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmacionModal;