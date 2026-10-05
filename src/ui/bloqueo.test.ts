/** Bloqueo de pantallas pequeñas: el celular no, el computador y la tablet acostada sí. */
import { motivoBloqueo } from './bloqueo';

let fallos = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    fallos++;
    console.log('  ✗', msg);
  }
};

ok(motivoBloqueo(1440, 900, false) === null, 'computador 1440×900: se juega');
ok(motivoBloqueo(1366, 768, false) === null, 'portátil 1366×768: se juega');
ok(motivoBloqueo(1280, 720, false) === null, 'ventana 1280×720: se juega');
ok(motivoBloqueo(1024, 768, true) === null, 'tablet acostada 1024×768: se juega');
ok(motivoBloqueo(390, 844, true) === 'celular', 'celular de pie: bloqueado');
ok(motivoBloqueo(844, 390, true) === 'celular', 'celular acostado: bloqueado');
ok(motivoBloqueo(768, 1024, true) === 'girar', 'tablet de pie: que la gire');
ok(motivoBloqueo(700, 500, false) === 'ventana', 'ventana de escritorio muy pequeña: que la agrande');

console.log(fallos === 0 ? 'Bloqueo de pantallas: todo bien.' : `\n${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
