import FormularioReceta from "../components/FormularioReceta";
import Navbar from "../components/Navbar";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-6 sm:mb-8 text-green-600">
            Generador de Recetas
          </h1>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
            <FormularioReceta />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
