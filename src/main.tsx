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
