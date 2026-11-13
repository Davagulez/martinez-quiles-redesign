// Genera data/propiedades.json leyendo las páginas PÚBLICAS del sitio actual.
// Uso: node scripts/snapshot-propiedades.mjs
// Es un puente temporal: cuando haya credenciales de la API de Top Inmobiliario (código JRM),
// este script se reemplaza por una llamada a buscadorinmobiliaria.php / consultaroferta.php.
import { writeFile, mkdir } from 'node:fs/promises';

const BASE = 'https://inmobiliariamartinezquiles.com.ar/';
const MAX_VENTA = 14;
const MAX_ALQUILER = 10;
const PAUSA_MS = 350;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function decodificar(buf) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
  catch { return new TextDecoder('latin1').decode(buf); }
}

let cookie = '';
async function traer(ruta) {
  const res = await fetch(BASE + ruta, { headers: cookie ? { cookie } : {} });
  const set = res.headers.getSetCookie?.() ?? [];
  if (set.length) cookie = set.map((c) => c.split(';')[0]).join('; ');
  if (!res.ok) return null;
  return decodificar(await res.arrayBuffer());
}

const limpiar = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function leerPrecio(texto) {
  const t = limpiar(texto);
  const moneda = /U\$S/i.test(t) ? 'USD' : 'ARS';
  const valor = Number((t.match(/[\d.]+/) || ['0'])[0]);
  // En el CRM hay precios de relleno como "U$S 1": se publican como "Consultar".
  return { moneda, valor: valor > 100 ? Math.round(valor) : null };
}

function leerTarjetas(html, operacion) {
  const bloques = html.split('<div class="cajaresultado').slice(1);
  return bloques.map((b) => {
    const codigo = (b.match(/codigoinm=(\d+)/) || [])[1];
    const h2 = [...b.matchAll(/<h2>(.*?)<\/h2>/gs)].map((m) => limpiar(m[1]));
    const resumen = limpiar((b.match(/<strong>(.*?)<\/strong>/s) || ['', ''])[1]);
    const lineas = (b.split('</strong>')[1] || '').split(/<br\s*\/?>/).map(limpiar).filter(Boolean);
    const actualizado = (b.match(/Actualizado al:\s*([\d/]+)/) || [])[1] || null;
    return {
      codigo, operacion, tipo: h2[0] || '', resumen,
      direccion: (lineas[0] || '').replace(/,\s*Otras zonas$/i, ''),
      actualizado, precio: leerPrecio(h2[1] || ''),
    };
  }).filter((t) => t.codigo);
}

async function leerListado(codop, operacion) {
  const primera = await traer(`propiedades.php?codop=${codop}`);
  const total = Number((primera.match(/Resultados Encontrados:\s*<\/strong>\s*(\d+)/) || [])[1] || 0);
  const paginas = Math.max(1, ...[...primera.matchAll(/pag_actual=(\d+)/g)].map((m) => Number(m[1])));
  let tarjetas = leerTarjetas(primera, operacion);
  for (let p = 2; p <= paginas; p++) {
    await esperar(PAUSA_MS);
    const html = await traer(`propiedades.php?pag_actual=${p}`);
    if (html) tarjetas = tarjetas.concat(leerTarjetas(html, operacion));
  }
  return { total, tarjetas };
}

// Reparte la muestra entre tipos de inmueble para que el catálogo de demostración sea variado.
function elegirVariado(tarjetas, max) {
  const porTipo = new Map();
  for (const t of tarjetas) { if (!porTipo.has(t.tipo)) porTipo.set(t.tipo, []); porTipo.get(t.tipo).push(t); }
  const colas = [...porTipo.values()];
  const elegidas = [];
  while (elegidas.length < max && colas.some((c) => c.length)) {
    for (const c of colas) { if (c.length && elegidas.length < max) elegidas.push(c.shift()); }
  }
  return elegidas;
}

async function leerFicha(t) {
  const html = await traer(`resultadoporcodigo.php?codigoinm=${t.codigo}`);
  if (!html) return null;
  const titulo = limpiar((html.match(/<h1>(.*?)<\/h1>/s) || ['', ''])[1]);
  const fotos = [...new Set([...html.matchAll(/<li><a href="(https:\/\/www\.topinmobiliario\.com\/[^"]+)"/g)].map((m) => m[1]))];
  const subtipo = limpiar((html.match(/letragrande3">(.*?)<\/span>/s) || ['', ''])[1]);
  let descripcion = (html.match(/<div class="izquierda margenes">(.*?)<\/div>/s) || ['', ''])[1];
  descripcion = limpiar(descripcion.replace(/Oferta provista por el sistema SOM.*$/s, ''));
  const caracteristicas = [...html.matchAll(/<li>([^<:]+):\s*([^<]*)<\/li>/g)]
    .map((m) => ({ nombre: m[1].trim(), valor: m[2].trim() }))
    .filter((c) => c.valor && !/^No( m2)?$/i.test(c.valor));
  const localidad = (titulo.match(/-\s*([^,]+),\s*Prov\./) || [])[1]?.trim() || 'Resistencia';
  return { ...t, titulo, subtipo, localidad, descripcion, caracteristicas, fotos };
}

const venta = await leerListado(1, 'Venta');
await esperar(PAUSA_MS);
const alquiler = await leerListado(2, 'Alquiler');

const muestra = [...elegirVariado(venta.tarjetas, MAX_VENTA), ...elegirVariado(alquiler.tarjetas, MAX_ALQUILER)];
const propiedades = [];
for (const t of muestra) {
  await esperar(PAUSA_MS);
  const ficha = await leerFicha(t);
  if (ficha && ficha.fotos.length) propiedades.push(ficha);
  else console.warn('sin ficha o sin fotos:', t.codigo);
}

const salida = {
  fuente: BASE,
  generado: new Date().toISOString().slice(0, 10),
  nota: 'Muestra congelada de propiedades publicadas. Se reemplaza por la API de Top Inmobiliario (JRM).',
  totales: { venta: venta.total, alquiler: alquiler.total },
  propiedades,
};
await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(new URL('../data/propiedades.json', import.meta.url), JSON.stringify(salida, null, 2), 'utf8');
// El sitio es estático y también debe abrir con doble clic (file://), donde fetch() de un JSON no funciona:
// por eso se publica además como script.
await writeFile(new URL('../data/propiedades.js', import.meta.url), 'window.MQ_DATA = ' + JSON.stringify(salida) + ';
', 'utf8');
console.log(`venta ${venta.total} (leídas ${venta.tarjetas.length}), alquiler ${alquiler.total} (leídas ${alquiler.tarjetas.length}), guardadas ${propiedades.length}`);
console.log(propiedades.map((p) => `${p.codigo} ${p.operacion} ${p.tipo} | ${p.fotos.length} fotos | ${p.precio.moneda} ${p.precio.valor}`).join('\n'));
