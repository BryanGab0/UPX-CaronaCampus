import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { Home } from "./components/Home";
import { Trajeto } from "./components/Trajeto";
import { Detalhe } from "./components/Detalhe";
import { Perfil } from "./components/Perfil";
import { Placeholder } from "./components/Placeholder";
 
export default function App() {
  const { autenticado } = useAuth();
 
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
 
      {/* Rotas protegidas: sem estar logado, redireciona para /login */}
      <Route element={autenticado ? <Layout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Home />} />
        <Route path="/trajeto" element={<Trajeto />} />
        <Route path="/caronas" element={<Placeholder titulo="Caronas" />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/carona/:id" element={<Detalhe />} />
      </Route>
 
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
