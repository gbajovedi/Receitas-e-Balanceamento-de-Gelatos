import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => {
  // Em produção (build) usa o subcaminho do GitHub Pages.
  // No localhost (dev), usa a raiz '/' para abrir direto em http://localhost:5173/
  const isBuild = command === 'build';
  const base = isBuild ? '/Receitas-e-Balanceamento-de-Gelatos/' : '/';

  return {
    base,
    server: {
      port: 5173,
      host: true, // Permite acesso também pelo IP da rede local (ex: celular ou tablet no Wi-Fi)
      strictPort: false
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'Calculadora & Balanceadora de Gelatos',
          short_name: 'Gelato Balancer',
          description: 'Balanceamento e formulação profissional de receitas de gelato artesanal',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait-primary',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
        }
      })
    ]
  };
});
