# Equilibrio — paquete inicial para programar

Contenido:
- `CLAUDE.md` — todo el contexto del juego (Claude Code lo lee solo al abrir la carpeta).
- `PROMPT.md` — los prompts para ir pegando, en orden.
- `data/niveles.json` — los 15 niveles completos (fuente de verdad).
- `src/engine/` — motor del equilibrio en TypeScript + pruebas (`npm install` y `npm test`).
- `public/fonts/` — Barlow y Barlow Condensed (licencia OFL).
- `reference/escena.js` y `reference/tutorial_y_cargas.js` — el código que generó los diseños de Figma (para portar a TS).
- `reference/figma-preview/` — capturas de cómo debe verse.
- `reference/python/` — solver original en Python (solo referencia).

Cómo arrancar (Windows): instala Node.js LTS y VS Code, descomprime esta carpeta, ábrela con Claude Code y pega el prompt 1 de `PROMPT.md`.
