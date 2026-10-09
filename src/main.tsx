import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./context/AuthProvider";
import { PerfilProvider } from "./context/PerfilProvider";
import App from "./App";
import { ErroTela } from "./components/ErroTela";
import { iniciarMonitoramento } from "./lib/monitoramento";
import "./index.css";

iniciarMonitoramento();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErroTela>
      <BrowserRouter>
        <AuthProvider>
          <PerfilProvider>
            <App />
          </PerfilProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErroTela>
  </StrictMode>,
);

// Service worker: recebe as notificações push (ver public/sw.js).
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch((e) => console.error("service worker não registrado", e));
}
