import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Resultados from "./pages/Resultados";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import Register from "./pages/Register";
import Favoritos from "./pages/Favoritos";
import Perfil from "./pages/Perfil";
import Recomendaciones from "./pages/Recomendaciones";


function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/resultados" element={<Resultados />} />
        <Route path="/favoritos" element={<Favoritos />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/recomendaciones" element={<Recomendaciones />} />
      </Route>
    </Routes>
  );
}

export default App;

