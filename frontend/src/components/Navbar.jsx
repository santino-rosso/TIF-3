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
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <a 
        href="/" 
        onClick={handleLogoClick}
        className="text-lg font-bold hover:text-gray-300 transition-colors flex items-center"
      >
        <span className="text-xl font-bold tracking-tight">Rece<span className="text-green-400">Ya</span></span>
      </a>
      
      <Link to="/favoritos" className="text-sm text-gray-300 hover:text-green-400">
        ⭐ Favoritos
      </Link>

      <Link to="/perfil" className="text-sm text-gray-300 hover:text-blue-600">
        👤 Mi Cuenta
      </Link>

      <button
        onClick={() => logout(navigate)}
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
      >
        Cerrar sesión
      </button>
    </nav>
  );
};

export default Navbar;