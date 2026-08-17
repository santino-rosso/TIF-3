import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar";
import { usePlanInfo } from "../hooks/usePlanInfo";
import { calcularPorcentajeUso, colorNivelUso } from "../utils/planStats";
import { Crown, Zap, CheckCircle } from "lucide-react";

const Planes = () => {
  const [planesDisponibles, setPlanesDisponibles] = useState([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const messageTimerRef = useRef(null);
  const navigate = useNavigate();
  const { estadisticas, cargarPlanInfo } = usePlanInfo({ autoLoad: false });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar plan actual y estadísticas
      const [, planesRes] = await Promise.all([
        cargarPlanInfo(),
        axiosInstance.get("/planes")
      ]);

      setPlanesDisponibles(planesRes.data.planes);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setMensaje("❌ Error al cargar la información del plan");
    } finally {
      setLoadingPlanes(false);
    }
  };

  const actualizarPlan = async (tipoPlan) => {
    setActualizando(true);
    setMensaje("");
    
    try {
      const res = await axiosInstance.post(`/actualizar-plan/${tipoPlan}`);
      setMensaje(`${res.data.mensaje}`);
      // Auto-hide después de 5 segundos
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      messageTimerRef.current = setTimeout(() => setMensaje(""), 5000);
      // Recargar datos
      await cargarDatos();
      
      // Emitir evento para notificar a otros componentes
      window.dispatchEvent(new CustomEvent('planUpdated'));
    } catch (error) {
      console.error("Error al actualizar plan:", error);
      setMensaje(`${error.response?.data?.error || "Error al actualizar el plan"}`);
      // Auto-hide después de 5 segundos también en error
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      messageTimerRef.current = setTimeout(() => setMensaje(""), 5000);
    } finally {
      setActualizando(false);
    }
  };

  const getPorcentajeUso = () => {
    if (!estadisticas) return 0;
    return calcularPorcentajeUso(estadisticas);
  };

  const getColorBarra = () => colorNivelUso(getPorcentajeUso());

  if (loadingPlanes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información del plan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-green-700">
          Planes de Membresía
        </h1>

        {mensaje && (
          <div className={`text-center mb-6 p-3 rounded-lg ${mensaje.startsWith('Plan') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {mensaje}
          </div>
        )}

        {/* Plan Actual */}
        {estadisticas && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              {estadisticas.tipo_plan === "premium" ? <Crown className="w-6 h-6 text-yellow-500" /> : <Zap className="w-6 h-6 text-green-500" />}
              Tu Plan Actual: {estadisticas.nombre_plan}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 mb-4">{estadisticas.descripcion_plan}</p>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1 text-gray-700">
                      <span>Recetas generadas en el período actual:</span>
                      <span className="font-semibold text-gray-800">{estadisticas.generaciones_usadas} / {estadisticas.limite_generaciones}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          estadisticas.generaciones_restantes === 0
                            ? 'bg-red-500'
                            : estadisticas.tipo_plan === 'premium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${getPorcentajeUso()}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p><strong className="text-gray-800">Recetas restantes:</strong> {estadisticas.generaciones_restantes}</p>
                    <p><strong className="text-gray-800">Renovación:</strong> {new Date(estadisticas.fecha_renovacion).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
                        estadisticas.generaciones_restantes === 0
                          ? "bg-red-500"
                          : estadisticas.tipo_plan === "premium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}>
                    {Math.round(getPorcentajeUso())}%
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Uso del plan</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Planes Disponibles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {planesDisponibles.map((plan) => (
            <div 
              key={plan.tipo}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                estadisticas?.tipo_plan === plan.tipo 
                  ? (plan.tipo === "premium" 
                      ? "border-yellow-500" 
                      : "border-green-500 ring-2 ring-green-200")
                  : (plan.tipo === "premium" ? "border-yellow-300 hover:border-yellow-400" : "border-green-300 hover:border-green-400")
              }`}
            >
<div className={`p-6 text-center ${plan.tipo === "premium" ? "bg-yellow-500 text-white" : "bg-green-500 text-white"}`}>
                <div className="flex items-center justify-center mb-2">
                  {plan.tipo === "premium" ? <Crown className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
                </div>
                <h3 className="text-2xl font-bold">{plan.nombre}</h3>
                <div className="text-3xl font-bold mt-2">
                  {plan.precio === 0 ? "Gratis" : `$${plan.precio}/mes`}
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-4">{plan.descripcion}</p>
                
                <div className="space-y-3 mb-6 min-h-[204px]">
<div className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${plan.tipo === "premium" ? "text-yellow-500" : "text-green-500"}`} />
                      <span className="text-gray-700">Recetas personalizadas con IA</span>
                    </div>
<div className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${plan.tipo === "premium" ? "text-yellow-500" : "text-green-500"}`} />
                      <span className="text-gray-700">Imágenes generadas automáticamente</span>
                    </div>
<div className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${plan.tipo === "premium" ? "text-yellow-500" : "text-green-500"}`} />
                      <span className="text-gray-700">Modo cocina interactivo</span>
                    </div>
                  {plan.tipo === "premium" && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`w-5 h-5 ${plan.tipo === "premium" ? "text-yellow-500" : "text-green-500"}`} />
                        <span className="text-gray-700">Soporte prioritario</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`w-5 h-5 ${plan.tipo === "premium" ? "text-yellow-500" : "text-green-500"}`} />
                        <span className="text-gray-700">Recetas sin límites diarios</span>
                      </div>
                    </>
                  )}
                </div>
                
                {estadisticas?.tipo_plan === plan.tipo ? (
                  <div className={`flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold ${
                    plan.tipo === "premium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                  }`}>
                    <CheckCircle className={`w-5 h-5 ${plan.tipo === "premium" ? "text-yellow-500" : "text-green-500"}`} />
                    Plan Actual
                  </div>
                ) : (
                  <button
                    onClick={() => actualizarPlan(plan.tipo)}
                    disabled={actualizando}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors shadow flex items-center justify-center gap-2 ${
                      plan.tipo === "premium"
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white hover:text-white"
                        : "bg-green-500 hover:bg-green-600 text-white hover:text-white"
                    } ${actualizando ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {actualizando ? (
                      <span className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Actualizando...
                      </span>
                    ) : (
                      <>
                        {plan.tipo === "premium" ? <Crown className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                        {plan.tipo === "premium" ? "Actualizar a Premium" : "Cambiar a Gratuito"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800 mb-4">¿Necesitas generar una receta?</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Generar Nueva Receta
          </button>
        </div>
      </div>
    </div>
  );
};

export default Planes;
