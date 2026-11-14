import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// The Spring Boot backend (backend/) listens on port 8080.
// Requests to /api are forwarded to it, so the browser sees one origin and no CORS setup is needed.
const apiProxy = {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
