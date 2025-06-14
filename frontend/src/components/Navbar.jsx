import { useNavigate, Link } from "react-router-dom";
import { logout } from "../utils/logout";
import { HandPlatter, Star, User } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  
  const handleLogoClick = (e) => {
    e.preventDefault(); 
    localStorage.removeItem("recetaGenerada");
    navigate("/");
  };

  return (
    <nav className="bg-white text-gray-800 p-4 shadow-lg border-b border-gray-200">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <a 
          href="/" 
          onClick={handleLogoClick}
          className="text-lg sm:text-xl font-bold hover:text-gray-600 transition-colors flex items-center"
        >
          <img 
            src="/Reseya.png" 
            alt="ReseYa Logo" 
            className="h-12 sm:h-14 w-auto"
          />
        </a>
        
        <div className="flex-1 flex justify-center">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <Link to="/favoritos" className="text-sm sm:text-base text-gray-600 hover:text-green-600 transition-colors flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span>Favoritos</span>
            </Link>

            
            <Link to="/recomendaciones" className="text-sm sm:text-base text-gray-600 hover:text-green-600 transition-colors flex items-center gap-2">
              <HandPlatter className="w-5 h-5" />
              <span>Recomendaciones</span>
            </Link>
            

            <Link to="/perfil" className="text-sm sm:text-base text-gray-600 hover:text-green-600 transition-colors flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>Mi Cuenta</span>
            </Link>
          </div>
        </div>

        <button
          onClick={() => logout(navigate)}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;