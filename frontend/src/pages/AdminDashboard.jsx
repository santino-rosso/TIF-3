import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import api from "../utils/axiosInstance";
import { StatsPanel } from "../components/admin/StatsPanel";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        setError("Error al cargar estadísticas");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  const u = stats?.usuarios || {};
  const r = stats?.recetas || {};
  const g = stats?.generaciones || {};

  const usersChartData = u.serie_30_dias?.map((d) => ({
    fecha: d.fecha,
    usuarios: d.count,
  })) || [];

  const generationsChartData = g.serie_30_dias?.map((d) => ({
    fecha: d.fecha,
    exitosas: d.exitosas,
    fallidas: d.fallidas,
    total: d.total,
  })) || [];

  const planDistribution = Object.entries(u.distribucion_planes || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel de Administración</h1>
      <StatsPanel
        usuarios={u}
        usuariosSerie={usersChartData}
        generacionesSerie={generationsChartData}
        planDistribution={planDistribution}
        recetas={r}
      />
    </div>
  );
}