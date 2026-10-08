/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Testes do app do aluno; admin/ e backend/ têm os próprios.
  test: { include: ["src/**/*.test.ts"] },
})
