import { defineConfig } from 'vite';

// base — путь, по которому игра лежит на GitHub Pages (имя репозитория).
// Локально (npm run dev) базой остаётся '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/cozy-rpg/' : '/',
  server: {
    host: true, // доступ с телефона по локальной сети
  },
  build: {
    outDir: 'dist',
  },
}));
