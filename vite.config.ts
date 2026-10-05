import { defineConfig } from 'vite';

// base relativa: el mismo build sirve en GitHub Pages (https://usuario.github.io/Equilibrio/)
// y en Vercel (raíz del dominio). Vite reescribe /fonts/... del CSS como ../fonts/...
export default defineConfig({
  base: './',
});
