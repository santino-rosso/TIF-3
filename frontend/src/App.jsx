import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Resultados from "./pages/Resultados";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/resultados" element={<Resultados />} />
    </Routes>
  );
}

export default App;

