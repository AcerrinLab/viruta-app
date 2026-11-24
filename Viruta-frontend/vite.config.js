import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Las librerias grandes van en archivos propios: cambian poco, asi el navegador las guarda.
        // Ojo: el runtime de JSX (react/jsx-runtime) y scheduler van con React; si no, Rollup los mete
        // en el archivo del 3D y el inicio termina descargando three.js igual.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules[\/](react|react-dom|react-router|react-router-dom|scheduler)[\/]/.test(id)) return 'react';
          if (/node_modules[\/](three|@react-three)[\/]/.test(id)) return 'tres';
          if (/node_modules[\/]leaflet[\/]/.test(id)) return 'mapa';
          return undefined;
        },
      },
    },
  },
  test: { environment: 'node' },
});
