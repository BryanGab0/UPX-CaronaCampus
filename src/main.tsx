import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { PerfilProvider } from "./context/PerfilContext";
import App from "./App";
import "./index.css";
 
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {/* PerfilProvider deixa o trajeto acessível em todas as telas */}
      <PerfilProvider>
        <App />
      </PerfilProvider>
    </BrowserRouter>
  </StrictMode>,
);
