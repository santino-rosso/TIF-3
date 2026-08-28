import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar";
import { usePlanInfo } from "../hooks/usePlanInfo";
import { calcularPorcentajeUso } from "../utils/planStats";
import { Crown, Zap, CheckCircle } from "lucide-react";

const Planes = () => {
  const [planesDisponibles, setPlanesDisponibles] = useState([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardErrors, setCardErrors] = useState({ number: "", expiry: "", cvc: "" });
  const messageTimerRef = useRef(null);
  const navigate = useNavigate();
  const { estadisticas, cargarPlanInfo } = usePlanInfo({ autoLoad: false });

  // Helpers
  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(" ") : digits;
  };

  const validateCardNumber = (value) => {
    const digits = value.replace(/\s/g, "");
    if (!/^\d{16}$/.test(digits)) return "El número debe tener 16 dígitos";
    return "";
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0,2) + "/" + digits.slice(2);
    return digits;
  };

  const validateExpiry = (value) => {
    const parts = value.split("/");
    if (parts.length !== 2) return "Formato MM/AA";
    const month = parseInt(parts[0],10);
    const year = parseInt(parts[1],10);
    if (isNaN(month) || month < 1 || month > 12) return "Mes inválido";
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return "Tarjeta expirada";
    }
    return "";
  };

  const formatCvc = (value) => value.replace(/\D/g, "").slice(0,3);
  const validateCvc = (value) => /^\d{3}$/.test(value) ? "" : "CVC debe ser 3 dígitos";

  const validateAll = () => {
    const errs = {
      number: validateCardNumber(cardNumber),
      expiry: validateExpiry(cardExpiry),
      cvc: validateCvc(cardCvc)
    };
    setCardErrors(errs);
    return !errs.number && !errs.expiry && !errs.cvc;
  };

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
      setMensaje("Error al cargar la información del plan");
    } finally {
      setLoadingPlanes(false);
    }
  };

  const actualizarPlan = async (tipoPlan) => {
    setActualizando(true);
    setMensaje("");
    
    try {
      let payload = {};
      if (tipoPlan === "premium") {
        // Parse expiry MM/AA
        const [mes, anio] = cardExpiry.split("/");
        payload = {
          card_number: cardNumber.replace(/\s/g, ""),
          exp_month: parseInt(mes, 10),
          exp_year: parseInt("20" + anio, 10),
          cvc: cardCvc
        };
      }
      const res = await axiosInstance.post(`/actualizar-plan/${tipoPlan}`, payload);
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

  const openPaymentModal = (tipoPlan) => {
    setPendingPlan(tipoPlan);
    setCardNumber("");
    setCardExpiry("");
    setCardCvc("");
    setCardErrors({ number: "", expiry: "", cvc: "" });
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPendingPlan(null);
    setCardNumber("");
    setCardExpiry("");
    setCardCvc("");
    setCardErrors({ number: "", expiry: "", cvc: "" });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!pendingPlan) return;
    if (!validateAll()) return;
    await actualizarPlan(pendingPlan);
    closePaymentModal();
  };

  const getPorcentajeUso = () => {
    if (!estadisticas) return 0;
    return calcularPorcentajeUso(estadisticas);
  };

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
                      ? "border-yellow-500 ring-2 ring-yellow-200" 
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
              
              <div className="p-6 flex flex-col">
                <p className="text-gray-600 mb-4">{plan.descripcion}</p>
                
<div className="space-y-3 mb-6 flex-1">
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
onClick={() => {
                      if (plan.tipo === "premium") {
                        openPaymentModal(plan.tipo);
                      } else {
                        if (window.confirm("¿Estás seguro de cambiar al plan gratuito? Perderás las ventajas de premium.")) {
                          actualizarPlan(plan.tipo);
                        }
                      }
                    }}
                    disabled={actualizando}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors shadow flex items-center justify-center gap-2 ${
                      plan.tipo === "premium"
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
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

    {showPaymentModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closePaymentModal}>
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Actualizar a Premium</h3>
          <form onSubmit={handlePaymentSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de tarjeta</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => {
                  const formatted = formatCardNumber(e.target.value);
                  setCardNumber(formatted);
                  setCardErrors(prev => ({ ...prev, number: "" }));
                }}
                onBlur={() => {
                  const err = validateCardNumber(cardNumber);
                  setCardErrors(prev => ({ ...prev, number: err }));
                }}
                placeholder="1234 5678 9012 3456"
                className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  cardErrors.number ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {cardErrors.number && <p className="text-red-500 text-xs mt-1">{cardErrors.number}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiración (MM/AA)</label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => {
                    const formatted = formatExpiry(e.target.value);
                    setCardExpiry(formatted);
                    setCardErrors(prev => ({ ...prev, expiry: "" }));
                  }}
                  onBlur={() => {
                    const err = validateExpiry(cardExpiry);
                    setCardErrors(prev => ({ ...prev, expiry: err }));
                  }}
                  placeholder="MM/AA"
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-400 ${
                    cardErrors.expiry ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {cardErrors.expiry && <p className="text-red-500 text-xs mt-1">{cardErrors.expiry}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                <input
                  type="text"
                  value={cardCvc}
                  onChange={(e) => {
                    const formatted = formatCvc(e.target.value);
                    setCardCvc(formatted);
                    setCardErrors(prev => ({ ...prev, cvc: "" }));
                  }}
                  onBlur={() => {
                    const err = validateCvc(cardCvc);
                    setCardErrors(prev => ({ ...prev, cvc: err }));
                  }}
                  placeholder="123"
                  className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-400 ${
                    cardErrors.cvc ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {cardErrors.cvc && <p className="text-red-500 text-xs mt-1">{cardErrors.cvc}</p>}
              </div>
            </div>
<div className="flex gap-3">
              <button type="button" onClick={closePaymentModal} className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">Pagar</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
  );
};

export default Planes;
