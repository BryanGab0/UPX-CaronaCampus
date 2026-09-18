import { Home } from "./components/Home";
import { Placeholder } from "./components/Placeholder";
import { Trajeto } from "./components/Trajeto";
import { Routes, Route, Navigate } from "react-router";
import { Layout } from "./components/Layout";

// Mapa de rotas: cada URL renderiza uma tela dentro do Layout (moldura + nav)
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/trajeto" element={<Trajeto />} />
        <Route path="/caronas" element={<Placeholder titulo="Caronas" />} />
        <Route path="/perfil" element={<Placeholder titulo="Perfil" />} />
      </Route>
      {/* Qualquer URL desconhecida volta para a home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
