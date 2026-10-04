/** Progreso: ganar avanza el nivel actual, guarda y se recupera de datos dañados. */
import { cargarProgreso, disponible, guardarProgreso, progresoVacio, registrarVictoria } from './progreso';

let fallos = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    fallos++;
    console.log('  ✗', msg);
  }
};
const memoria = new Map<string, string>();
const almacen = { getItem: (k: string) => memoria.get(k) ?? null, setItem: (k: string, v: string) => void memoria.set(k, v) };
const entrada = { cita: '«Hoy cerré el cable y la ciudad respiró.»', detalle: '', antes: '80', despues: '65' };

let p = progresoVacio();
ok(p.actual === 1 && disponible(p, 1) && !disponible(p, 2), 'al empezar solo está el nivel 01');
p = registrarVictoria(p, 1, 1, entrada);
ok(p.actual === 2 && p.resueltos.join() === '1' && p.ultima === 1, 'ganar el 01 abre el 02');
p = registrarVictoria(p, 2, 3, entrada);
p = registrarVictoria(p, 1, 2, entrada);
ok(p.actual === 3 && p.mejores[1] === 1 && p.ultima === 1, 'repetir un nivel no retrocede y guarda los mejores toques');
let q = progresoVacio();
for (let n = 1; n <= 15; n++) q = registrarVictoria(q, n, 1, entrada);
ok(q.actual === 15 && q.resueltos.length === 15, 'después del 15 se queda en el 15');

guardarProgreso(p, almacen);
const r = cargarProgreso(almacen);
ok(r.actual === 3 && r.resueltos.join() === '1,2' && r.bitacora[1].cita === entrada.cita, 'guardar y cargar');
memoria.set('equilibrio.progreso.v1', '{roto');
ok(cargarProgreso(almacen).actual === 1, 'datos dañados → progreso vacío');
ok(cargarProgreso(undefined).actual === 1, 'sin localStorage → progreso vacío');

console.log(fallos === 0 ? 'Progreso: todo bien.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
