import { useAuth } from "./context/AuthContext";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";

// Gate: sem estar logado (como admin), mostra o login; senão, o painel.
export default function App() {
  const { autenticado } = useAuth();
  return autenticado ? <Dashboard /> : <Login />;
}
