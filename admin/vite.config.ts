import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Porta 5174 para rodar junto do app do aluno (5173) sem conflito.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
});
