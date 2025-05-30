import { useNavigate, Link } from "react-router-dom";
import { logout } from "../utils/logout";

const Navbar = () => {
  const navigate = useNavigate();
  
  const handleLogoClick = (e) => {
    e.preventDefault(); 
    localStorage.removeItem("recetaGenerada");
    navigate("/");
  };

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-lg">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <a 
          href="/" 
          onClick={handleLogoClick}
          className="text-lg sm:text-xl font-bold hover:text-gray-300 transition-colors flex items-center"
        >
          <span className="text-xl sm:text-2xl font-bold tracking-tight">
            Rece<span className="text-green-400">Ya</span>
          </span>
        </a>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          <Link 
            to="/favoritos" 
            className="text-sm sm:text-base text-gray-300 hover:text-green-400 transition-colors flex items-center gap-1"
          >
            <span>⭐</span>
            <span>Favoritos</span>
          </Link>

          <Link 
            to="/perfil" 
            className="text-sm sm:text-base text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            <span>👤</span>
            <span>Mi Cuenta</span>
          </Link>

          <button
            onClick={() => logout(navigate)}
            className="bg-red-500 hover:bg-red-600 px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;