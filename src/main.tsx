import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./context/AuthProvider";
import { PerfilProvider } from "./context/PerfilProvider";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PerfilProvider>
          <App />
        </PerfilProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

// Service worker: recebe as notificações push (ver public/sw.js).
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch((e) => console.error("service worker não registrado", e));
}
