import { Link } from "react-router-dom";

const RecipePlanNotice = ({ planInfo }) => {
  if (!planInfo) {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${
      planInfo.generaciones_restantes === 0
        ? "bg-red-50 border-red-200"
        : planInfo.generaciones_restantes <= 2 && planInfo.tipo_plan === "gratuito"
          ? "bg-yellow-50 border-yellow-200"
          : "bg-blue-50 border-blue-200"
    }`}>
      {planInfo.generaciones_restantes > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">
              {planInfo.nombre_plan}
            </span>
          </div>
          <div className="text-right">
<span className={`text-sm font-semibold ${
            planInfo.generaciones_restantes === 0 ? "text-red-600" :
            planInfo.generaciones_restantes <= 2 && planInfo.tipo_plan === "gratuito" ? "text-gray-700" :
            planInfo.generaciones_restantes <= 2 ? "text-yellow-600" : "text-gray-600"
          }`}>
              {planInfo.generaciones_restantes} recetas restantes
            </span>
          </div>
        </div>
      )}

      {planInfo.generaciones_restantes === 0 && (
        <>
          <p className="text-red-800 text-sm font-medium mb-3">
            Has alcanzado el límite de recetas para tu período actual
          </p>
          <Link
            to="/planes"
            className="w-full bg-yellow-500 text-white hover:text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors shadow flex items-center justify-center"
          >
            Actualizar a Premium
          </Link>
        </>
      )}

      {planInfo.generaciones_restantes <= 2 && planInfo.generaciones_restantes > 0 && planInfo.tipo_plan === "gratuito" && (
        <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Te quedan pocas recetas. Considerá actualizar a Premium para obtener hasta 100 recetas cada 30 días.
          </p>
          <Link
            to="/planes"
            className="w-full bg-yellow-500 text-white hover:text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors shadow mt-2 flex items-center justify-center"
          >
            Ver Planes
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecipePlanNotice;
