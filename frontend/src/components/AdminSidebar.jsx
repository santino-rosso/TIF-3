import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, Home, LogOut } from "lucide-react";
import { logout } from "../utils/logout";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "Usuarios", icon: Users },
  { path: "/admin/recipes", label: "Recetas", icon: BookOpen },
];

const AdminSidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-white text-gray-800 border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <button onClick={() => navigate("/admin")} className="cursor-pointer" aria-label="Ir al panel de administración">
          <img
            src="/Reseya.png"
            alt="ReseYa Logo"
            className="h-12 sm:h-14 w-auto"
          />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "text-green-600"
                  : "text-gray-600 hover:text-green-600"
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          Generador de recetas
        </button>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => logout(navigate)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;