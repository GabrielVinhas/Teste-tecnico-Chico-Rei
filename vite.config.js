import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue2';
import { fileURLToPath } from 'node:url';

// O front chama /api/products e o proxy entrega ao json-server. O rewrite tira
// o /api porque o json-server serve em /products. `vite preview` tem
// configuração própria e não herda a de `server`, então as duas usam isto.
const proxy = {
  '/api': {
    target: 'http://localhost:3333',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
};

export default defineConfig({
  plugins: [vue()],

  resolve: {
    // `import.meta.dirname` só existe a partir do Node 20.11; resolver pela URL
    // do módulo mantém o projeto rodando no Node 18 declarado no README.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },

  server: { port: 5173, proxy },
  preview: { port: 5173, proxy },

  build: {
    rollupOptions: {
      output: {
        // Vue e router mudam muito menos que o código da loja: em chunk
        // separado, o cache do navegador sobrevive aos nossos deploys.
        manualChunks: { vendor: ['vue', 'vue-router', 'pinia'] },
      },
    },
  },
});
