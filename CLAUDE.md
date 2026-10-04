# Equilibrio — guía para Claude Code

Juego web de puzzle para el curso *Composición Digital de Apps y UI Kits* (Tadeo, Bogotá, prof. John Melo). Se evalúa con las **Leyes de la Simplicidad de John Maeda**. Santiago (el dueño) habla en español colombiano informal: responde y comenta el código en español. Los textos de la interfaz van en español.

## La esencia del juego (en una frase)
Eres ingeniero de vías de Bogotá. **Tocas una vía para abrirla o cerrarla** y los carros se reparten solos; tu meta es que el promedio de minutos por carro (**TOTAL**) baje hasta el **ÓPTIMO**. La sorpresa (paradoja de Braess): a veces *cerrar* una vía hace que todos lleguen más rápido.

Un solo gesto: tocar. No hay otra acción.

## Reglas del juego
- Los carros son grupos que van de un origen a un destino. Cada carro elige la ruta más rápida; todos los de un grupo terminan usando rutas de igual tiempo (equilibrio de Wardrop). Lo calcula `src/engine/equilibrio.ts`.
- **Ancha**: tiempo fijo, nunca se llena. **Angosta**: el tiempo crece con los carros (~ x/100 min por carro, según `k`). **Cable** (atajo, magenta): a veces ayuda y a veces estorba, por eso se llama *atajo*, no *trampa*. **Obra**: no se puede tocar. **Cerrada**: vía gris con una X; se abre tocándola.
- **TOTAL** = minutos promedio por carro. **ÓPTIMO** = el mejor TOTAL alcanzable abriendo/cerrando vías. **Se gana cuando TOTAL ≤ ÓPTIMO + 0,3** (`enEquilibrio`). Mensaje: «Equilibrio alcanzado en N toque(s)».
- **Un toque que deja a un grupo sin ruta no se permite** (`equilibrio()` devuelve `null`): la vía vibra y vuelve a su estado, sin mensaje de error largo.
- **Hora pico** (niveles 05, 08, 14, 15): hay dos fases, *Hora valle* (carros × `factor` < 1) y *Hora pico* (× 1). El TOTAL es el promedio ponderado por carros de las dos fases. El jugador alterna la vista con el selector «Hora valle | Hora pico»; las pastillas muestran la fase seleccionada. Los toques son los mismos en ambas fases.
- **Tope de toques** (`nivel.toques`, niveles 05, 14, 15): el indicador «TOQUES ○○○» se va llenando; al agotarse no se puede tocar más, solo reiniciar. Si el campo no existe, toques ilimitados.
- Cada nivel se juega con **Reiniciar** y **Pausa** (botones redondos abajo a la izquierda).

## Los 15 niveles (datos en `data/niveles.json`)
| # | Nombre | Bloque | Líneas | Grupos | Cables | TOTAL → ÓPTIMO | Toques mín. | Extras |
|---|---|---|---|---|---|---|---|---|
| 01 | Línea única | Fácil | 2 | 1 | 0 | 60,0 → 45,0 | 1 | leyenda, mensaje |
| 02 | Estación de paso | Fácil | 2 | 1 | 0 | 80,0 → 50,0 | 2 | — |
| 03 | El puente | Fácil | 2 | 1 | 1 | 80,0 → 65,0 | 1 | leyenda, mensaje |
| 04 | El puente bueno | Fácil | 2 | 1 | 1 | 30,0 → 20,0 | 1 | — |
| 05 | Dos puentes | Fácil | 4 | 2 | 2 | 83,8 → 72,2 | 1 | hora pico, tope 1 toques, mensaje |
| 06 | Dos portales | Intermedio | 4 | 2 | 2 | 57,5 → 46,8 | 2 | mensaje |
| 07 | Expreso y local | Intermedio | 3 | 2 | 4 | 98,5 → 81,3 | 2 | — |
| 08 | Hora pico | Intermedio | 4 | 2 | 2 | 65,6 → 54,3 | 2 | hora pico, mensaje |
| 09 | Tres grupos | Intermedio | 4 | 3 | 4 | 86,2 → 72,4 | 2 | — |
| 10 | Obra en San Victorino | Intermedio | 4 | 2 | 2 | 62,5 → 52,5 | 2 | obra, leyenda, mensaje |
| 11 | Tres corredores | Difícil | 6 | 1 | 3 | 71,3 → 63,1 | 3 | — |
| 12 | Tres grupos, seis líneas | Difícil | 6 | 3 | 3 | 70,0 → 60,1 | 3 | — |
| 13 | Cruzar la ciudad | Difícil | 4 | 3 | 4 | 121,1 → 102,8 | 4 | — |
| 14 | Hora pico, dos toques | Difícil | 4 | 3 | 4 | 130,7 → 113,3 | 2 | hora pico, tope 2 toques, mensaje |
| 15 | La ciudad | Difícil | 6 | 4 | 6 | 129,7 → 123,4 | 3 | hora pico, tope 3 toques, mensaje |

La dificultad se ve en el **número de líneas** (Fácil 2–4, Intermedio 3–4, Difícil 4–6). Cada nivel es una *estación* del plano de la red (3 líneas de metro: amarilla = Fácil, naranja = Intermedio, azul = Difícil).

### Esquema de `niveles.json` (arreglo de niveles)
```
num, name, block(1|2|3), lineas, cables, grupos
start (TOTAL inicial), optimo, cambios (toques mínimos), solucion: string[] (ids a alternar)
msg: string|null   → píldora negra, solo cuando aparece algo nuevo
legend: string[]|null → leyenda, solo en niveles 01, 03 y 10
phases?: [{name, factor}], toques?: number
groups: [{from, to, cars}]
nodes: { id: {x, y, label, kind: 'terminal'|'station'|'bar'|'capsule', y1?, y2?} }   // lienzo 1440×900
links: [{ id, from, to, kind: 'ancha'|'angosta'|'cable', a, b, k, open, locked, both,
          line: 'amarilla'|'naranja'|'azul'|'lila'|'cafe'|'cian'|null,
          pts: [[x,y],…],            // polilínea; se dibuja con esquinas redondeadas (radio 22)
          t0,x0, t1,x1, open_solved }]  // t/x = minutos y carros mostrados al empezar (t0,x0) y en la solución (t1,x1)
```
`both: true` → el cable se puede recorrer en los dos sentidos (niveles 07 y 09). No inventes datos: todo sale de este JSON.

## Sistema visual (fuente de verdad: Figma, pero aquí van los valores)
Figma: https://www.figma.com/design/M4LovFmMXxTkbaNocJByti/Equilibrio (Page 3, secciones «Equilibrio v3 · …»). En `reference/figma-preview/` hay capturas de cómo debe verse. Estilo: **plano de metro claro, no una app**.

**Lienzo:** 1440×900. Dibuja con un `<svg viewBox="0 0 1440 900">` que escala a la ventana (`preserveAspectRatio="xMidYMid meet"`), y los controles HTML, si los hay, encima.

**Color — 5 capas, cada color tiene un solo trabajo:**
| Capa | Tokens |
|---|---|
| 1 Territorio | tierra `#F2F1EC` (fondo) · agua `#D3DEE6` · parque `#DDE6D3` |
| 2 Red (identidad de línea) | amarilla `#F0B429` · naranja `#E8772E` · azul `#2E62B5` · lila `#8565C4` · café `#8B5E3C` · cian `#2FA8D5` |
| 3 Estaciones | tinta `#1F2329` · blanco `#FFFFFF` |
| 4 Estados | cerrada `#B8BCC3` · cable `#D6338A` · costo alto `#D93A35` · meta `#2E8B57` |
| 5 Información | texto `#1F2329` · secundario `#5B616B` · borde `#D5D8DC` |

**Regla:** las líneas NUNCA usan rojo, verde ni magenta; esos tres son solo para costo alto, meta y cable.

**Tipografía:** Barlow 800 para números grandes, Barlow 700/600 para títulos y botones, Barlow 500 para texto, **Barlow Condensed 700 para estaciones** (MAYÚSCULAS, letter-spacing .8). Los .woff2 están en `public/fonts/` (licencia OFL); cárgalos con `@font-face` local, sin Google Fonts.

**Anatomía de una vía (el grosor es la regla):**
- Ancha: trazo de 14 px del color de la línea + guiones blancos al centro (2,5 px, dash 9/9, cap butt).
- Angosta: trazo de 7 px del color de la línea.
- Cerrada: 4 px gris `cerrada`, dash 8/8, con círculo blanco r11 (borde gris 2 px) y una X gris en el centro del tramo más largo.
- Cable: 5 px magenta, dash 0.1/11, cap round (puntos).
- Obra: 13 px tinta con dash 2,5/9 (rayado) sobre la vía naranja, y una píldora negra «Obra · no se toca».
- Todas con stroke-linejoin round y esquinas redondeadas radio 22.

**Estaciones:** terminal = círculo tinta r15 con punto blanco r6; estación de paso = círculo blanco r11 con borde tinta 4; barra (*bar*) = rectángulo tinta de 24 px de ancho con extremos redondos; cápsula (*capsule*) = rectángulo blanco 30×112 con borde tinta 4 (transbordo). Etiquetas en Barlow Condensed 700, 12 px, mayúsculas.

**Carros:** círculo **tinta r5,5 con borde blanco 2,5**. Su número en cada vía es ∝ `x` (≈ 1 por cada 650 carros, máx. 6) y se mueven a lo largo de la vía a una velocidad ∝ 1/tiempo de esa vía (más lento en una angosta llena). Se ubican a ambos lados de la pastilla de costo, nunca debajo de ella.

**Pastilla de costo:** blanca, borde 1,5, una por tramo (en el segmento más largo), «45 min» (número en Barlow 700 14 px + «min» 9 px). Roja si la angosta está llena (tiempo − a ≥ 20); magenta si es cable. Número entero.

**HUD (arriba a la derecha, 330×118):** tarjeta blanca con «TOTAL · MIN POR CARRO» y «ÓPTIMO» (Barlow Condensed 10), los dos números en Barlow 800 44 px (TOTAL rojo si está por encima, verde al llegar; ÓPTIMO tinta) y una barra de progreso de 4 px. Al ganar: borde verde y «Equilibrio alcanzado en N toques». **No** poner «Faltan X min».

**Título (arriba a la izquierda):** círculo con el número (amarillo Fácil, naranja Intermedio, azul Difícil), nombre en Barlow 700 26 px y subtítulo «FÁCIL · NIVEL 03 DE 15 · 2 LÍNEAS · 1 CABLE» en Barlow Condensed.

### Simplicidad (Maeda) aplicada — no la rompas
1. **Reducir:** un solo gesto; sin fórmulas ni jerga en pantalla; dos números en el HUD.
2. **Organizar:** 5 capas de color con un trabajo cada una; todos los niveles con la misma estructura.
3. **Tiempo:** el resultado de cada toque se ve de inmediato (recalcular y animar < 300 ms).
4. **Aprender:** la leyenda solo aparece donde se aprende algo (niveles 01, 03 y 10); la píldora negra solo cuando aparece algo nuevo (primer cable, segundo grupo, hora pico, obra).
5. **Diferencias:** el grosor distingue ancha y angosta; el color distingue línea; el estado raro (cerrada, cable, costo alto) es lo único que usa color de estado.
6. **Contexto, Emoción, Confianza, Fracasos, La única:** fondo discreto de ciudad; bitácora con frase humana; el óptimo siempre verificado; reiniciar sin castigo; una sola cosa que ahorrar (minutos).

## Pantallas y flujo
Carga de la app → **Inicio** («Seguir en el nivel 08», chips Plano de la red · Bitácora · Ajustes) → Plano de la red (opcional) → Carga del nivel → (nivel 01: **Tutorial de 4 pasos**) → Nivel → **Bitácora** («Hoy cerré el cable y la ciudad respiró.», 80 → 65) → Siguiente nivel.
El texto exacto y la geometría del tutorial y de las pantallas de carga están en `reference/tutorial_y_cargas.js`; el resto de pantallas (inicio, plano, bitácora, sistema) en `reference/escena.js`. Esos dos archivos son el **código que generó los diseños de Figma**: portarlos a TypeScript da el resultado idéntico. Progreso guardado en `localStorage` (nivel actual, niveles resueltos, mejores toques).

**Bitácora (decidido por Santiago):** el JSON solo trae la frase del nivel 03, así que todas salen de la plantilla de `src/game/bitacora.ts` según lo que hizo el jugador: «Hoy cerré el cable y la ciudad respiró.» + «Cerraste una vía y todos llegaron 15 minutos antes.». No escribir frases a mano por nivel.

**Flujo implementado (`src/app.ts`):** el tutorial sale al entrar al nivel 01 mientras no esté resuelto; «Jugar»/«Saltar» reinician el 01 para que lo juegue el jugador. Al ganar aparece «Ver bitácora» (como en Figma). El chip «Bitácora» del inicio solo aparece si ya hay una entrada y abre la del último nivel resuelto. En el plano se tocan los niveles resueltos y el actual. El menú de pausa (Seguir · Reiniciar · Plano de la red · Inicio) **no tiene diseño en Figma**: es provisional con las mismas piezas. La flecha → de los botones se dibuja (la fuente latin de Barlow no trae el glifo).

**Ajustes:** el chip se queda. La sección existe (`src/screens/ajustes.ts`, solo título y «Volver») y el diseño lo hará Santiago en Figma; no le pongas contenido hasta que llegue.

## Arquitectura recomendada
- Vite + TypeScript estricto, **sin frameworks de UI**, dibujo en SVG, estado en un store pequeño.
- `src/engine/` — motor puro (ya está hecho y probado). **No lo reescribas**; si cambias algo, corre `npm test`.
- `src/render/` — portar `reference/escena.js` a TS (primitivas ter/red/est/sta/inf → elementos SVG con los mismos nombres de capa).
- `src/game/` — estado del nivel (vías abiertas, toques, fase), tocar una vía, victoria, animación de carros.
- `src/screens/` — inicio, carga, tutorial, nivel, bitácora, plano, pausa.
- `data/niveles.json` — fuente de verdad de los niveles.

## Comandos (Windows, PowerShell)
```
npm install
npm test       # motor (15 niveles) + estado del nivel + bitácora + verificar
npm run verificar  # los 15 niveles se resuelven con nivel.solucion y el HUD coincide con el JSON
npm run dev    # http://localhost:5173/   (solo en dev, ver src/dev/navegacion.ts: ?nivel=N · ?toques=a,b · ?pantalla=… · ?tutorial=1 · ?pausa=1 · ?borrar=1)
npm run build  # tsc estricto + vite build → dist/
```
Repo: https://github.com/Tiaguitoo09/Equilibrio (rama `main`).

## Estado del proyecto (al 4 de octubre de 2026)
Prompts de `PROMPT.md`: **1, 2 y 3 hechos** y subidos a GitHub. **Siguiente: prompt 4** (pulido y publicación).

Hecho: los 15 niveles jugables con hora pico, tope de toques y obras; todas las pantallas (carga, inicio, plano, carga del nivel, tutorial, bitácora, pausa, Ajustes vacío) y el progreso en `localStorage`. `npm test` y `npm run build` pasan.

Falta, en orden:
1. **Prompt 4 · Pulido:**
   - transiciones < 300 ms al tocar una vía (hoy todo se redibuja de golpe);
   - accesibilidad: hoy las vías no tienen foco con teclado ni `aria-label`, y al redibujar se pierde el foco;
   - revisar el uso táctil en el celular;
   - desplegar en GitHub Pages o Vercel: falta `vite.config.ts` con `base`; ojo con las rutas `/fonts/...` del CSS.
2. **Ajustes:** Santiago trae el diseño de Figma (y un prompt con el JSON); hasta entonces no se le pone contenido.
3. **Menú de pausa:** es provisional porque no tiene diseño en Figma; ajustarlo si lo diseñan.
4. **Prompt 5 · Íconos** (ver abajo).

Detalles que conviene saber:
- Las capturas de `reference/figma-preview/` de los niveles 13 y 14 tienen números viejos (125 → 109 y 111,7 → 103,7); manda el JSON.
- En los cables con `both: true` (niveles 07 y 09) los carros se animan siempre en el sentido de `pts`, porque el motor no da la dirección del flujo.
- Pruebas de punta a punta: se hicieron con Chrome sin ventana por CDP (scripts temporales, no están en el repo).

## Pendientes conocidos
- **Íconos**: las compañeras de Santiago los están diseñando. Hoy los botones de reiniciar y pausa son provisionales (círculo tinta con símbolo). Cuando lleguen (SVG), se cambian en un solo módulo `src/ui/iconos.ts`; deja ese punto de extensión.
- Sonido (opcional, solo si sobra tiempo; siempre con interruptor y apagado por defecto).
- Mostrar en el plano de la red las estrellas/toques mejores por nivel (opcional).

## Cómo trabajar con Santiago
Pasos pequeños y verificables; antes de un cambio grande, explica el plan en pocas líneas y espera el visto bueno. Prefiere respuestas concisas, con ejemplos que pueda copiar y pegar. Recomendaciones técnicas para **Windows**.
