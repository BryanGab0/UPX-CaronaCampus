import { Home } from "./components/Home";
import { Placeholder } from "./components/Placeholder";
import { Trajeto } from "./components/Trajeto";
import { Routes, Route, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Detalhe } from "./components/Detalhe";

// Mapa de rotas: cada URL renderiza uma tela dentro do Layout (moldura + nav)
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/trajeto" element={<Trajeto />} />
        <Route path="/caronas" element={<Placeholder titulo="Caronas" />} />
        <Route path="/perfil" element={<Placeholder titulo="Perfil" />} />
        {/* :id é um parâmetro — a tela lê ele da URL para saber qual carona mostrar */}
        <Route path="/carona/:id" element={<Detalhe />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
