import FormularioReceta from "../components/FormularioReceta";
import Navbar from "../components/Navbar";

const Home = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <Navbar />
      <h1 className="text-3xl font-bold text-center mb-6 text-green-600">Generador de Recetas</h1>
      <FormularioReceta />
    </div>
  );
};

export default Home;
