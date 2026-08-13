import { useEffect } from "react";
import { Crown, Zap } from "lucide-react";
import { usePlanInfo } from "../hooks/usePlanInfo";

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

  const porcentajeUso = Math.min((estadisticas.generaciones_usadas / estadisticas.limite_generaciones) * 100, 100);

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
            porcentajeUso >= 90 ? "bg-red-500" : 
            porcentajeUso >= 70 ? "bg-yellow-500" : "bg-green-500"
          }`}
          style={{ width: `${porcentajeUso}%` }}
        ></div>
      </div>
    </div>
  );
};

export default PlanStatus;
