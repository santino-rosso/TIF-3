import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Resultados from "./pages/Resultados";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import Register from "./pages/Register";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/resultados" element={<Resultados />} />
      </Route>
    </Routes>
  );
}

export default App;

