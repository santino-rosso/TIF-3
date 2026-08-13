import { useCallback, useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";

export const usePlanInfo = ({ autoLoad = true } = {}) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const cargarPlanInfo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axiosInstance.get("/obtener-plan");
      setEstadisticas(res.data.estadisticas);
      return res.data.estadisticas;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarEstadisticas = useCallback((actualizacion) => {
    setEstadisticas((prev) => {
      if (!prev) return prev;
      return typeof actualizacion === "function" ? actualizacion(prev) : { ...prev, ...actualizacion };
    });
  }, []);

  useEffect(() => {
    if (!autoLoad) return;

    cargarPlanInfo().catch(() => {});
  }, [autoLoad, cargarPlanInfo]);

  return {
    plan: estadisticas,
    estadisticas,
    setEstadisticas,
    actualizarEstadisticas,
    loading,
    error,
    reload: cargarPlanInfo,
    cargarPlanInfo,
  };
};

export default usePlanInfo;
