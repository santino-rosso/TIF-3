import { useEffect } from "react";
import { Crown, Zap } from "lucide-react";
import { usePlanInfo } from "../hooks/usePlanInfo";
import { calcularPorcentajeUso, colorNivelUso } from "../utils/planStats";

const PlanStatus = () => {
  const { estadisticas, loading, cargarPlanInfo, error: planError } = usePlanInfo();

  useEffect(() => {
    if (planError) {
      console.error("Error al cargar estadísticas del plan:", planError);
    }
  }, [planError]);

  useEffect(() => {
    // Escuchar eventos de actualización de plan
    const handlePlanUpdate = () => {
      cargarPlanInfo().catch((error) => {
        console.error("Error al cargar estadísticas del plan:", error);
      });
    };
    
    window.addEventListener('planUpdated', handlePlanUpdate);
    
    // Limpiar el listener al desmontar
    return () => {
      window.removeEventListener('planUpdated', handlePlanUpdate);
    };
  }, [cargarPlanInfo]);

  if (loading || !estadisticas) {
    return null;
  }

  const porcentajeUso = calcularPorcentajeUso(estadisticas);

  return (
    <div className="flex items-center gap-2 text-sm">
      {estadisticas.tipo_plan === "premium" ? (
        <Crown className="w-4 h-4 text-yellow-500" />
      ) : (
        <Zap className="w-4 h-4 text-green-500" />
      )}
      
      <div className="flex items-center gap-1">
        <span className="text-gray-600">
          {estadisticas.generaciones_restantes} restantes
        </span>
      </div>
      
      {/* Barra de progreso pequeña */}
      <div className="w-12 bg-gray-200 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full transition-all duration-300 ${
            colorNivelUso(porcentajeUso)
          }`}
          style={{ width: `${porcentajeUso}%` }}
        ></div>
      </div>
    </div>
  );
};

export default PlanStatus;
