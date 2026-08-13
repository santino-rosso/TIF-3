import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar";
import { Crown, Zap, CheckCircle, XCircle } from "lucide-react";

const Planes = () => {
  const [, setPlanActual] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [planesDisponibles, setPlanesDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar plan actual y estadísticas
      const [planRes, planesRes] = await Promise.all([
        axiosInstance.get("/obtener-plan"),
        axiosInstance.get("/planes")
      ]);

      setPlanActual(planRes.data.plan);
      setEstadisticas(planRes.data.estadisticas);
      setPlanesDisponibles(planesRes.data.planes);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setMensaje("❌ Error al cargar la información del plan");
    } finally {
      setLoading(false);
    }
  };

  const actualizarPlan = async (tipoPlan) => {
    setActualizando(true);
    setMensaje("");
    
    try {
      const res = await axiosInstance.post(`/actualizar-plan/${tipoPlan}`);
      setMensaje(`${res.data.mensaje}`);
      // Recargar datos
      await cargarDatos();
      
      // Emitir evento para notificar a otros componentes
      window.dispatchEvent(new CustomEvent('planUpdated'));
    } catch (error) {
      console.error("Error al actualizar plan:", error);
      setMensaje(`${error.response?.data?.error || "Error al actualizar el plan"}`);
    } finally {
      setActualizando(false);
    }
  };

  const getPorcentajeUso = () => {
    if (!estadisticas) return 0;
    return Math.min((estadisticas.generaciones_usadas / estadisticas.limite_generaciones) * 100, 100);
  };

  const getColorBarra = () => {
    const porcentaje = getPorcentajeUso();
    if (porcentaje >= 90) return "bg-red-500";
    if (porcentaje >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (loading) {
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
                        className={`h-3 rounded-full transition-all duration-300 ${getColorBarra()}`}
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
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white ${estadisticas.tipo_plan === "premium" ? "bg-gradient-to-br from-yellow-400 to-yellow-600" : "bg-gradient-to-br from-green-400 to-green-600"}`}>
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
                  ? "border-green-500 ring-2 ring-green-200" 
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              <div className={`p-6 text-center ${
                plan.tipo === "premium" 
                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white" 
                  : "bg-gradient-to-br from-green-400 to-green-600 text-white"
              }`}>
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
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">{plan.limite_generaciones_mensual} recetas cada 30 días</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Recetas personalizadas con IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Imágenes generadas automáticamente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Modo cocina interactivo</span>
                  </div>
                  {plan.tipo === "premium" && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700">Soporte prioritario</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700">Recetas sin límites diarios</span>
                      </div>
                    </>
                  )}
                </div>
                
                {estadisticas?.tipo_plan === plan.tipo ? (
                  <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-green-100 text-green-700 font-semibold">
                    <CheckCircle className="w-5 h-5" />
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
          <h3 className="text-lg font-semibold text-blue-800 mb-2">¿Necesitás más recetas?</h3>
          <p className="text-blue-600 mb-4">
            Con el plan Premium podés generar hasta 100 recetas cada 30 días, perfecto para chefs experimentados y familias numerosas.
          </p>
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
