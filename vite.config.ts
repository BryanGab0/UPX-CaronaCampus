/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Testes de lógica pura do app e do admin (o backend tem a própria configuração).
  test: { include: ["src/**/*.test.ts", "admin/src/**/*.test.ts"] },
})
