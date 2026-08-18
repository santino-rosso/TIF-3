import { TrendingUp, AlertTriangle } from "lucide-react";

export function StatCard({ title, value, icon: Icon, trend, color, trendTone = "good" }) {
  const toneClass =
    trendTone === "bad" ? "text-red-600" : trendTone === "neutral" ? "text-gray-400" : "text-green-600";
  const showIcon = trendTone !== "neutral";
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 flex items-center gap-1 ${toneClass}`}>
              {showIcon && (trendTone === "bad" ? <AlertTriangle className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />)}
              <span>{trend}</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}