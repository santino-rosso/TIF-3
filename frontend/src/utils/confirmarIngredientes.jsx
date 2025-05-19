import { createRoot } from 'react-dom/client';
import ConfirmacionModal from '../components/ConfirmacionModal';

export const confirmarIngredientes = async (ingredientesNoAprobados) => {
  const confirmados = [];
  
  // Procesar ingredientes uno por uno
  for (const [ingrediente, motivo] of ingredientesNoAprobados) {
    // Crear un contenedor temporal para el modal
    const modalContainer = document.createElement('div');
    document.body.appendChild(modalContainer);
    const root = createRoot(modalContainer);
    
    // Usar una promesa para esperar la respuesta del modal
    const respuesta = await new Promise((resolve) => {
      const handleConfirm = () => {
        resolve(true);
        root.unmount();
        document.body.removeChild(modalContainer);
      };
      
      const handleCancel = () => {
        resolve(false);
        root.unmount();
        document.body.removeChild(modalContainer);
      };
      
      // Renderizar el modal
      root.render(
        <ConfirmacionModal 
          isOpen={true}
          ingrediente={ingrediente}
          motivo={motivo}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );
    });
    
    if (respuesta) {
      confirmados.push(ingrediente);
    }
  }
  
  return confirmados;
};