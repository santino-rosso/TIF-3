import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../utils/logout";
import { HandPlatter, Star, User, Menu, X } from 'lucide-react';
import PlanStatus from "./PlanStatus";

const NAV_LINKS = [
  { to: "/favoritos", label: "Favoritos", Icon: Star },
  { to: "/recomendaciones", label: "Recomendaciones", Icon: HandPlatter },
  { to: "/perfil", label: "Mi Cuenta", Icon: User },
];

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogoClick = (e) => {
    e.preventDefault();
    localStorage.removeItem("recetaGenerada");
    setMenuOpen(false);
    navigate("/");
  };

  const closeMenuAndLogout = () => {
    setMenuOpen(false);
    logout(navigate);
  };

  return (
    <nav className="bg-white text-gray-800 px-4 sm:px-8 py-4 shadow-lg border-b border-gray-200">
      <div className="container mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center">
          <a
            href="/"
            onClick={handleLogoClick}
            className="flex items-center"
          >
            <img
              src="/ReceYa.png"
              alt="ReceYa Logo"
              className="h-10 sm:h-14 w-auto"
            />
          </a>
        </div>

        {/* Links - desktop */}
        <div className="hidden sm:flex flex-1 justify-center">
          <div className="flex flex-row items-center gap-6">
            {NAV_LINKS.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className="text-base text-gray-600 hover:text-green-600 transition-colors flex items-center gap-2"
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Plan + logout - desktop */}
        <div className="hidden sm:flex justify-end items-center gap-4">
          <PlanStatus />
          <button
            onClick={() => logout(navigate)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-base transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Hamburguesa - mobile */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          className="sm:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Menú desplegable - mobile */}
      {menuOpen && (
        <div className="sm:hidden mt-4 pt-4 border-t border-gray-100 flex flex-col gap-1">
          {NAV_LINKS.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className="text-base text-gray-600 hover:text-green-600 hover:bg-gray-50 transition-colors flex items-center gap-3 px-3 py-3 rounded-lg"
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}

          <div className="mt-2 pt-3 border-t border-gray-100 px-3 py-2">
            <PlanStatus />
          </div>

          <button
            onClick={closeMenuAndLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded text-base transition-colors mt-2"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
