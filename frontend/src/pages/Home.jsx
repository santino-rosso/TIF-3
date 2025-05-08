import FormularioReceta from "../components/FormularioReceta";

const Home = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6 text-green-600">Generador de Recetas</h1>
      <FormularioReceta />
    </div>
  );
};

export default Home;
