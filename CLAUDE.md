# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**Regla:** las líneas NUNCA usan rojo, verde ni magenta; esos tres son solo para costo alto, meta y cable. **Excepción (aprobada por Santiago):** los íconos del equipo (`src/assets/iconos/`) traen sus propios colores y no se cambian, aunque usen rojo, verde o magenta (decisión del prompt 5).

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
Carga de la app → **Inicio** («Seguir en el nivel 08», chips Plano de la red · Bitácora · Ajustes) → Plano de la red (opcional) → Carga del nivel → (nivel 01: **Tutorial de 4 pasos**) → Nivel → **Bitácora** («Hoy cerré el cable y la ciudad respiró.», 80 → 65) → Siguiente nivel. Después del 15: Bitácora → **Terminar** → **Fin del juego**. Mapa completo: `pantallas-que-faltan/reference/figma/flujo_de_pantallas.png`.
El texto exacto y la geometría del tutorial y de las pantallas de carga están en `reference/tutorial_y_cargas.js`; el resto de pantallas (inicio, plano, bitácora, sistema) en `reference/escena.js`. Esos dos archivos son el **código que generó los diseños de Figma**: portarlos a TypeScript da el resultado idéntico. Progreso guardado en `localStorage` (nivel actual, niveles resueltos, mejores toques).

**Bitácora (decidido por Santiago, prompt 6):** la frase de cada nivel sale de `data/bitacora.json` (escrita por el equipo), tanto en la bitácora al ganar como en la Bitácora completa. La plantilla de `src/game/bitacora.ts` queda **solo** para la línea de detalle («Cerraste una vía y todos llegaron 15 minutos antes.»). No inventes frases: si falta una, va en `data/bitacora.json`.

**Flujo implementado (`src/app.ts`):** el tutorial sale al entrar al nivel 01 mientras no esté resuelto; «Jugar»/«Saltar» reinician el 01 para que lo juegue el jugador. Al ganar aparece «Ver bitácora» (como en Figma). El chip «Bitácora» del inicio abre la **Bitácora completa** y sale apenas hay algún nivel resuelto. En el plano se tocan los niveles resueltos y el actual. **No hay forma de saltarse niveles** (decisión de Santiago): sin botones ni teclas para pasar de nivel; un nivel nuevo se abre solo al resolver el anterior. Pausa, Ajustes, Bitácora completa, Sin toques y Fin del juego están portados de `pantallas-que-faltan/reference/pantallas_nuevas.js` (mismas posiciones, textos y tamaños). Los botones llevan íconos del equipo (la flecha de «Siguiente» es el ícono `siguiente`; la fuente latin de Barlow no trae el glifo →).

**Ajustes:** sonido (apagado por defecto) y vibración (encendida) con interruptor, guardados en `localStorage` (`equilibrio.preferencias.v1`, `src/game/preferencias.ts`); «Borrar progreso» pide confirmación; créditos con los nombres del equipo. **Sonidos** (`src/ui/sonido.ts`): Web Audio sin archivos (tic al tocar, otro cuando el toque no se permite, acorde al llegar al óptimo); el audio arranca con el primer toque del jugador.

**Celular: bloqueado (decisión de Santiago).** Equilibrio se juega en computador o en tablet acostada. Si la red de 1440×900 quedaría a menos de 0,55 de escala (`ESCALA_MINIMA`), `src/ui/bloqueo.ts` muestra un aviso HTML (`#bloqueo` en `index.html`) en vez del juego: «se juega en computador» (celular), «gira la pantalla» (tablet de pie) o «agranda la ventana» (escritorio). El juego sigue detrás, oculto, y vuelve al girar o agrandar. Medido antes de bloquear: en un celular de 390 px los íconos quedaban de 6–9 px y las zonas para tocar las vías de 8 px. Si algún día se quiere jugar en celular, hace falta un diseño propio para pantallas pequeñas (no basta con escalar).

**Sin toques:** en los niveles con tope, ~0,6 s después del último toque si no se llegó al óptimo (`pantallaNivel.ts`). **Bitácora completa:** encabezado fijo; la lista (capa `est`, recortada) se desplaza con rueda, arrastre/dedo y teclado, con degradado abajo.

## Arquitectura (cómo está hecho)
Vite + TypeScript estricto, **sin frameworks de UI**, todo dibujado en un solo `<svg id="escena">`.

- **`src/engine/`**: motor puro, ya probado. **No lo reescribas.** `puntaje()` calcula todas las fases y tarda unos 21 ms en el peor nivel; devuelve `null` si algún grupo queda sin ruta.
- **Del dibujo a la pantalla:** una función arma una `Escena` (`src/render/primitivas.ts`, port de `S()` de `escena.js`): una lista de primitivas `p/e/r/g/t/pill`, cada una con su capa `L`. Luego `pintar()` (`src/render/svg.ts`) **borra el SVG y lo vuelve a crear entero** con un `<g data-capa>` por capa, en este orden: `ter · red · carros · est · sta · toque · inf · top`. No hay comparación de cambios: cada cambio de estado redibuja todo.
- **Texto:** la `y` es el borde superior de la caja, como en Figma, y la línea base queda en `y + z`. Las pastillas se miden con un canvas, por eso `main.ts` espera a que carguen las fuentes. Sin DOM (en las pruebas) se usa un ancho aproximado.
- **Botones:** toda primitiva llamada `btn:algo` se vuelve botón con `data-btn="algo"` (`activarBotones`). Para conectar los clics y el teclado están `escucharBotones` y `montarEscena` (`src/screens/montar.ts`).
- **Toques en las vías:** cada vía tiene un trazo invisible de 30 px con `data-tocar` en la capa `toque`. En el CSS, todo tiene `pointer-events: none` salvo `.toque`, `.btn` y el velo `[data-n$=":velo"]`, que bloquea lo de abajo durante el tutorial y la pausa.
- **Nivel** (`src/screens/pantallaNivel.ts`): junta `EstadoNivel` (`src/game`, envuelve el motor), `escenaNivel` y `Carros`. `Carros` anima con `requestAnimationFrame` y conserva el avance de cada vía al redibujar. El tutorial y la pausa se dibujan en la capa `top`; el tutorial «levanta» copias de primitivas de la escena del nivel por encima del velo.
- **Flujo** (`src/app.ts`): `ir(Destino)` cierra la pantalla actual y abre la siguiente. **Cada pantalla devuelve `{ cerrar() }` y debe quitar ahí sus listeners del SVG.** El progreso son funciones puras en `src/game/progreso.ts` y se guarda en `localStorage` con la clave `equilibrio.progreso.v1`.
- **Herramientas de pruebas** (`src/dev/navegacion.ts`): `main.ts` las carga con `import()` dentro de `import.meta.env.DEV`, así que no llegan al build.
- **`tsconfig`:** excluye `*.test.ts` (tsc no los revisa). `noUnusedParameters` está desactivado porque el motor tiene un parámetro sin usar.

## Comandos (Windows, PowerShell)
```
npm install
npm test       # motor (15 niveles) + estado del nivel + bitácora + verificar
npm run verificar  # los 15 niveles se resuelven con nivel.solucion y el HUD coincide con el JSON
npm run dev    # http://localhost:5173/   (solo en dev, ver src/dev/navegacion.ts: ?nivel=N · ?toques=a,b · ?pantalla=… · ?tutorial=1 · ?pausa=1 · ?borrar=1)
npm run build  # tsc estricto + vite build → dist/
npm run typecheck              # solo tsc
npx tsx src/game/progreso.test.ts   # una sola prueba (cualquier *.test.ts)
```
Las pruebas son scripts `tsx` simples, sin framework: tienen su propio `ok()`, imprimen `✗` en cada fallo y terminan con código 1 si algo falla. Corren en Node, sin DOM.
Repo (público): https://github.com/Tiaguitoo09/Equilibrio (rama `main`) · juego: https://tiaguitoo09.github.io/Equilibrio/
Los commits usan el correo privado de GitHub (`199398288+Tiaguitoo09@users.noreply.github.com`, configurado en la carpeta): no pongas el correo personal en commits ni en archivos.

## Estado del proyecto (al 5 de octubre de 2026)
Prompts: **1 a 6 hechos** (el 5 con `actualizacion-iconos/PROMPT_5.md`, el 6 con `pantallas-que-faltan/PROMPT_6.md`: Ajustes, Bitácora completa, Sin toques, Fin del juego, pausa según el diseño y sonidos). **Publicado** en https://tiaguitoo09.github.io/Equilibrio/ (repo público; cada push a `main` prueba y vuelve a publicar).

Hecho: los 15 niveles; todas las pantallas; progreso en `localStorage`. Pulido del prompt 4:
- **Transición de un toque (260 ms, `animarCambio` en `pantallaNivel.ts`):** la vía que cambia aparece, las pastillas que cambian laten y el TOTAL y el punto del HUD corren hasta su valor. Con `prefers-reduced-motion` no se anima.
- **Teclado:**
  - cada vía es un botón con `tabindex` y `aria-label` (`etiquetaVia` en `src/render/nivel.ts`); Enter o Espacio la tocan;
  - Esc abre y cierra la pausa;
  - el foco se conserva al redibujar y cada pantalla lo pone en su acción principal (`montarEscena(…, foco)`);
  - con el tutorial o la pausa abiertos, lo de abajo queda con `tabindex=-1`.
- **Lectores de pantalla y foco visible:** `#anuncio` (aria-live, `src/ui/anuncio.ts`) dice el resultado de cada toque. Los anillos de foco son color tinta: un halo en las vías y, en los botones, un `.anillo` con su misma forma.
- **Contraste:** `C.verdeTexto` (#297C4D) y `C.cableTexto` (#C52F7F) se usan SOLO en texto pequeño; el verde y el magenta de Figma no llegaban a 4,5:1. Los números grandes, los bordes y las líneas siguen con los colores de Figma.
- **Despliegue:**
  - `vite.config.ts` con `base: './'`: el mismo build sirve en Pages y en Vercel; `/fonts/…` del CSS sale como `../fonts/…`;
  - `.github/workflows/deploy.yml` publica en GitHub Pages en cada push a `main` y corre `npm test` antes;
  - URL: https://tiaguitoo09.github.io/Equilibrio/ (en *Settings → Pages* hay que elegir *GitHub Actions* una vez).
- **Íconos (prompt 5): ya están.**
  - Los 22 SVG del equipo están en `src/assets/iconos/` (copiados de `actualizacion-iconos/iconos/svg_color/`) y se cargan con `import.meta.glob` en `src/ui/iconos.ts`.
  - Para usarlos: `icono(nombre, tamaño, cx, cy)`, la primitiva `s.i(...)`, o `ico`/`icoFin` en las pastillas y `icono`/`iconoFin` en los botones (`src/render/piezas.ts`).
  - **La bitácora usa el ícono de óptimo** (chip «Bitácora», «Ver bitácora» y HUD).
  - **Escala** (`src/ui/escala.ts`, igual que en Figma): `TAM = { s: 24, m: 32, l: 72 }`, siempre proporcional y con 5–8 px (`AIRE` = 6) entre ícono y texto.
    - **s (24)**, junto a texto: píldoras y chips, HUD (tiempo y óptimo), origen y destino, grupos de carros, leyenda (a 6 px de cada muestra), candado del plano (en un círculo de 34 px), cifras del fin y píldora de obra. Las píldoras crecen de alto con el ícono, centradas en el mismo punto.
    - **m (32)**: botones redondos, todos de 44 px (`R_BOTON`), y los íconos de los títulos (Pausa, Ajustes, Sonido, Bitácora completa). En el tutorial, el ícono del paso va arriba a la derecha, junto a «PASO N DE 4».
    - **l (72)**: ingeniero en el inicio (círculo de 100 px) y en la bitácora; logro en Fin del juego.
    - El logo va aparte: 104 en el inicio y 120 en la carga.
    - `TAM` vive fuera de `iconos.ts` para que las pruebas de Node no carguen los SVG (`import.meta.glob` solo existe en Vite).
  - El inicio ya no lleva «UN JUEGO DE VÍAS · BOGOTÁ» ni el pie de Maeda, como en el Figma actualizado.
  - Ícono de la app: los archivos de `public/` y `public/manifest.webmanifest`.

Falta, en orden:
1. Nada obligatorio. Push solo cuando Santiago dice «súbelo».
2. `actualizacion-iconos/`, `Equilibrio_prompt5_iconos.zip` y `pantallas-que-faltan/` quedaron fuera de git (son el material original que mandó el equipo).

Detalles que conviene saber:
- Las capturas de `reference/figma-preview/` de los niveles 13 y 14 tienen números viejos (125 → 109 y 111,7 → 103,7); manda el JSON.
- En los cables con `both: true` (niveles 07 y 09) los carros se animan siempre en el sentido de `pts`, porque el motor no da la dirección del flujo.
- Pruebas de punta a punta: se hicieron con Chrome sin ventana por CDP (scripts temporales, no están en el repo).

## Pendientes conocidos
- **Íconos**: integrados (ver «Estado del proyecto»). Para cambiar uno basta con reemplazar su archivo en `src/assets/iconos/`.
- Sonido: hecho (ver «Ajustes»).
- Mostrar en el plano de la red las estrellas/toques mejores por nivel (opcional).

## Cómo trabajar con Santiago
Pasos pequeños y verificables; antes de un cambio grande, explica el plan en pocas líneas y espera el visto bueno. Prefiere respuestas concisas, con ejemplos que pueda copiar y pegar. Recomendaciones técnicas para **Windows**.
