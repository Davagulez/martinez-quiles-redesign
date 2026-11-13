/* J.R. Martínez Quiles · catálogo: destacadas, listado con filtros en la URL y ficha.
   Lee window.MQ_DATA (data/propiedades.js). Cuando exista la API de Top Inmobiliario, solo cambia el origen de MQ_DATA. */
(() => {
  'use strict';
  const DATA = window.MQ_DATA;
  const d = document;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  if (!DATA || !Array.isArray(DATA.propiedades)) return;
  const MQ = (window.MQ = window.MQ || {});
  const WA = '5493624302344';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Normalización de datos ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sinAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const slug = (s) => sinAcentos(String(s).toLowerCase()).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const SINGULAR = { 'Casas': 'Casa', 'Departamentos': 'Departamento', 'Locales': 'Local', 'Oficinas': 'Oficina', 'Terrenos/Fracciones/Loteos': 'Terreno', 'Depósitos/Industrias': 'Depósito', 'Propiedades Rurales': 'Propiedad rural', 'Cocheras Individuales': 'Cochera' };
  const MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'a', 'en']);
  const capitalizar = (s) => String(s).toLowerCase().replace(/[a-záéíóúñü]+/g, (w, i) => (i > 0 && MENORES.has(w) ? w : w[0].toUpperCase() + w.slice(1))).replace(/\bKm\b/g, 'km');
  const limpiarTexto = (s) => String(s).replace(/\s+\./g, '.').replace(/\.\.+/g, '.').replace(/mts2|m2\b/gi, 'm²').trim();
  const precioTxt = (p) => (p.precio && p.precio.valor ? `${p.precio.moneda === 'USD' ? 'U$S' : '$'} ${p.precio.valor.toLocaleString('es-AR')}` : 'Consultar');
  const fechaNum = (f) => { const m = /(\d+)\/(\d+)\/(\d+)/.exec(f || ''); return m ? Number(m[3] + m[2].padStart(2, '0') + m[1].padStart(2, '0')) : 0; };

  const PROPS = DATA.propiedades.map((p) => ({
    ...p,
    tipoUno: SINGULAR[p.tipo] || p.tipo,
    tipoSlug: slug(SINGULAR[p.tipo] || p.tipo),
    opSlug: slug(p.operacion),
    locSlug: slug(p.localidad),
    dir: capitalizar(p.direccion),
    resumenLimpio: limpiarTexto(p.resumen),
    orden: fechaNum(p.actualizado),
  }));
  const url = (p) => `propiedad.html?codigo=${encodeURIComponent(p.codigo)}`;
  const waUrl = (t) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
  const flecha = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

  const tarjeta = (p) => `
    <a class="tarjeta" href="${url(p)}" aria-label="${esc(p.tipoUno)} en ${esc(p.operacion.toLowerCase())}: ${esc(p.dir)}, ${esc(precioTxt(p))}">
      <div class="tarjeta__foto">
        <img src="${esc(p.fotos[0])}" alt="" loading="lazy" decoding="async" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'sin-foto',textContent:'Foto no disponible'}))">
        <span class="tarjeta__op">${esc(p.operacion)}</span>
        <span class="tarjeta__n">${p.fotos.length} foto${p.fotos.length === 1 ? '' : 's'}</span>
      </div>
      <div class="tarjeta__cuerpo">
        <p class="tarjeta__cod"><span class="barras" aria-hidden="true"><i></i><i></i><i></i></span>JRM ${esc(p.codigo)} · ${esc(p.tipoUno)}</p>
        <h3><span>${esc(p.dir)}</span></h3>
        <p class="tarjeta__dir">${esc(p.resumenLimpio)} ${esc(p.localidad)}.</p>
        <div class="tarjeta__pie"><span class="tarjeta__precio">${esc(precioTxt(p))}</span><span class="tarjeta__ver">Ver ficha →</span></div>
      </div>
    </a>`;

  // ---------- Inicio: destacadas y totales ----------
  (() => {
    const cont = $('[data-destacadas]');
    if (cont) {
      const orden = ['1635', '2252', '2263', '2291', '888', '2248', '2246', '1479'];
      const elegidas = orden.map((c) => PROPS.find((p) => p.codigo === c)).filter(Boolean);
      cont.innerHTML = (elegidas.length ? elegidas : PROPS.slice(0, 8)).map(tarjeta).join('');
    }
    $$('[data-total]').forEach((el) => { const v = DATA.totales && DATA.totales[el.dataset.total]; if (v) { el.dataset.count = v; el.textContent = v; } });
    $$('[data-fecha-datos]').forEach((el) => { el.textContent = DATA.generado.split('-').reverse().join('/'); });
  })();

  // ---------- Listado ----------
  (() => {
    const form = $('#filtros'), rej = $('#resultados');
    if (!form || !rej) return;
    const POR_PAGINA = 9;
    const unicos = (campoSlug, campoTxt) => [...new Map(PROPS.map((p) => [p[campoSlug], p[campoTxt]])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'es'));
    const llenar = (sel, pares, todos) => { sel.innerHTML = `<option value="">${todos}</option>` + pares.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join(''); };
    llenar(form.elements.tipo, unicos('tipoSlug', 'tipoUno'), 'Todos los tipos');
    llenar(form.elements.loc, unicos('locSlug', 'localidad'), 'Todas las localidades');

    const CLAVES = ['op', 'tipo', 'loc', 'q', 'moneda', 'min', 'max', 'orden'];
    const leerUrl = () => {
      const u = new URLSearchParams(location.search);
      CLAVES.forEach((k) => {
        const campo = form.elements[k]; if (!campo) return;
        const v = u.get(k) || '';
        if (campo instanceof RadioNodeList) { const r = [...campo].find((x) => x.value === v) || campo[0]; r.checked = true; }
        else campo.value = v;
        if (campo.value !== v && !(campo instanceof RadioNodeList)) campo.value = '';
      });
      return Math.max(1, Number(u.get('pag')) || 1);
    };
    const estado = () => Object.fromEntries(CLAVES.map((k) => [k, (form.elements[k] ? form.elements[k].value : '').trim()]));
    const escribirUrl = (e, pag) => {
      const u = new URLSearchParams();
      CLAVES.forEach((k) => { if (e[k]) u.set(k, e[k]); });
      if (pag > 1) u.set('pag', pag);
      const q = u.toString();
      history.replaceState(null, '', q ? `?${q}` : location.pathname);
    };
    const filtrar = (e) => {
      const q = sinAcentos(e.q.toLowerCase());
      let r = PROPS.filter((p) =>
        (!e.op || p.opSlug === e.op) && (!e.tipo || p.tipoSlug === e.tipo) && (!e.loc || p.locSlug === e.loc) &&
        (!e.moneda || (p.precio.valor && p.precio.moneda === e.moneda)) &&
        (!e.min || (p.precio.valor && p.precio.valor >= Number(e.min))) &&
        (!e.max || (p.precio.valor && p.precio.valor <= Number(e.max))) &&
        (!q || sinAcentos(`${p.codigo} jrm${p.codigo} ${p.dir} ${p.tipoUno} ${p.localidad} ${p.resumen}`.toLowerCase()).includes(q)));
      const porPrecio = (dir) => (a, b) => {
        if (!a.precio.valor !== !b.precio.valor) return a.precio.valor ? -1 : 1;           // "Consultar" al final
        if (a.precio.moneda !== b.precio.moneda) return a.precio.moneda === 'USD' ? -1 : 1; // no se mezclan monedas
        return dir * ((a.precio.valor || 0) - (b.precio.valor || 0));
      };
      if (e.orden === 'precio-asc') r.sort(porPrecio(1));
      else if (e.orden === 'precio-desc') r.sort(porPrecio(-1));
      else if (e.orden === 'direccion') r.sort((a, b) => a.dir.localeCompare(b.dir, 'es'));
      else r.sort((a, b) => b.orden - a.orden);
      return r;
    };
    const NOMBRES = { op: (v) => (v === 'venta' ? 'Venta' : 'Alquiler'), tipo: (v) => (PROPS.find((p) => p.tipoSlug === v) || {}).tipoUno, loc: (v) => (PROPS.find((p) => p.locSlug === v) || {}).localidad,
      q: (v) => `"${v}"`, moneda: (v) => (v === 'USD' ? 'En dólares' : 'En pesos'), min: (v) => `Desde ${Number(v).toLocaleString('es-AR')}`, max: (v) => `Hasta ${Number(v).toLocaleString('es-AR')}` };

    const nEl = $('#cantidad'), chips = $('#chips'), pagEl = $('#paginas'), titulo = $('#titulo-listado');
    let pagina = leerUrl(), primera = true;

    function pintar(mover) {
      const e = estado(), lista = filtrar(e);
      const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
      pagina = Math.min(pagina, paginas);
      escribirUrl(e, pagina);
      const trozo = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
      rej.innerHTML = trozo.length ? trozo.map(tarjeta).join('') : `
        <div class="vacio" style="grid-column:1/-1">
          <p class="titulo h-md">No hay propiedades con esos filtros.</p>
          <p>Probá quitando alguno, o escribinos y te avisamos cuando entre algo así.</p>
          <a class="btn btn--wa" target="_blank" rel="noopener" href="${waUrl('Hola, busco una propiedad y no la encontré en la web. Les cuento qué necesito:')}">Contarles qué busco <span class="btn__flecha">${flecha}</span></a>
        </div>`;
      if (nEl) { if (MQ.contar && !primera) MQ.contar(nEl, lista.length); else nEl.textContent = lista.length; }
      if (titulo) titulo.textContent = e.op === 'venta' ? 'Propiedades en venta' : e.op === 'alquiler' ? 'Propiedades en alquiler' : 'Todas las propiedades';
      d.title = `${titulo ? titulo.textContent : 'Propiedades'} en Resistencia, Chaco · J.R. Martínez Quiles`;
      const activos = CLAVES.filter((k) => k !== 'orden' && e[k]);
      chips.innerHTML = activos.map((k) => `<button type="button" class="chip" data-quitar="${k}" aria-label="Quitar filtro ${esc(NOMBRES[k](e[k]))}">${esc(NOMBRES[k](e[k]))} ✕</button>`).join('') +
        (activos.length ? '<button type="button" class="chip chip--limpiar" data-quitar="todo">Limpiar filtros</button>' : '');
      pagEl.innerHTML = paginas > 1 ? Array.from({ length: paginas }, (_, i) => `<button type="button" data-pag="${i + 1}" ${i + 1 === pagina ? 'aria-current="page"' : ''} aria-label="Página ${i + 1}">${i + 1}</button>`).join('') : '';
      if (MQ.entrar && !primera) MQ.entrar($$(':scope > *', rej));
      if (mover) $('#resumen').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
      primera = false;
    }

    let espera = 0;
    form.addEventListener('input', (ev) => { pagina = 1; clearTimeout(espera); espera = setTimeout(() => pintar(false), ev.target.type === 'search' || ev.target.type === 'number' ? 260 : 0); });
    form.addEventListener('submit', (ev) => { ev.preventDefault(); pintar(true); });
    chips.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-quitar]'); if (!b) return;
      const k = b.dataset.quitar;
      (k === 'todo' ? CLAVES.filter((c) => c !== 'orden') : [k]).forEach((c) => { const campo = form.elements[c]; if (campo instanceof RadioNodeList) campo[0].checked = true; else campo.value = ''; });
      pagina = 1; pintar(false);
    });
    pagEl.addEventListener('click', (ev) => { const b = ev.target.closest('[data-pag]'); if (!b) return; pagina = Number(b.dataset.pag); pintar(true); });
    const alt = $('.filtros__alternar');
    if (alt) alt.addEventListener('click', () => { const si = form.classList.toggle('filtros--abierto'); alt.setAttribute('aria-expanded', String(si)); alt.textContent = si ? 'Menos filtros' : 'Más filtros'; });
    const e0 = estado();
    if (alt && (e0.q || e0.moneda || e0.min || e0.max)) alt.click();
    pintar(false);
    $$('[data-muestra]').forEach((el) => { el.textContent = PROPS.length; });
    $$('[data-publicadas]').forEach((el) => { el.textContent = (DATA.totales.venta || 0) + (DATA.totales.alquiler || 0); });
  })();

  // ---------- Ficha ----------
  (() => {
    const cont = $('#ficha');
    if (!cont) return;
    const codigo = new URLSearchParams(location.search).get('codigo');
    const p = PROPS.find((x) => x.codigo === codigo);
    if (!p) {
      d.title = 'Propiedad no encontrada · J.R. Martínez Quiles';
      const m = d.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; d.head.append(m);
      cont.innerHTML = `
        <div class="wrap error404" style="min-height:70svh">
          <p class="ceja" data-pieza><span class="barras" aria-hidden="true"><i></i><i></i><i></i></span>Propiedad no encontrada</p>
          <h1 class="titulo h-lg" data-pieza>Esa propiedad ya no está publicada.</h1>
          <p class="bajada" data-pieza>${codigo ? `El código JRM ${esc(codigo)} no figura en el catálogo. ` : ''}Puede que se haya vendido o alquilado. Mirá las que están disponibles hoy.</p>
          <p data-pieza><a class="btn" href="propiedades.html">Ver propiedades <span class="btn__flecha">${flecha}</span></a></p>
        </div>`;
      return;
    }
    const titulo = `${p.tipoUno} en ${p.dir}`;
    const msg = `Hola, me interesa la propiedad código JRM ${p.codigo} (${p.tipoUno.toLowerCase()} en ${p.operacion.toLowerCase()}, ${p.dir}, ${p.localidad}). ¿Podemos coordinar una visita?`;
    d.title = `${titulo}, ${p.localidad} · ${p.operacion} · J.R. Martínez Quiles`;
    const desc = `${p.tipoUno} en ${p.operacion.toLowerCase()} en ${p.dir}, ${p.localidad}, Chaco. ${p.resumenLimpio} ${precioTxt(p)}. Código JRM ${p.codigo}.`;
    const meta = (sel, attr, v) => { const el = $(sel); if (el) el.setAttribute(attr, v); };
    meta('meta[name=description]', 'content', desc);
    meta('meta[property="og:title"]', 'content', d.title);
    meta('meta[property="og:description"]', 'content', desc);
    meta('meta[property="og:image"]', 'content', p.fotos[0]);
    const ld = d.createElement('script'); ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'RealEstateListing', name: titulo, description: desc, url: location.href, image: p.fotos, datePosted: p.actualizado.split('/').reverse().join('-'),
      ...(p.precio.valor ? { offers: { '@type': 'Offer', price: p.precio.valor, priceCurrency: p.precio.moneda, businessFunction: p.operacion === 'Venta' ? 'http://purl.org/goodrelations/v1#Sell' : 'http://purl.org/goodrelations/v1#LeaseOut' } } : {}),
      address: { '@type': 'PostalAddress', streetAddress: p.dir, addressLocality: p.localidad, addressRegion: 'Chaco', addressCountry: 'AR' } });
    d.head.append(ld);

    const similares = PROPS.filter((x) => x.codigo !== p.codigo && x.operacion === p.operacion).sort((a, b) => (b.tipo === p.tipo) - (a.tipo === p.tipo) || b.orden - a.orden).slice(0, 3);
    const chev = (dir) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="${dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;

    cont.innerHTML = `
      <div class="wrap">
        <nav class="migas" aria-label="Estás en" data-pieza><a href="index.html">Inicio</a> / <a href="propiedades.html?op=${p.opSlug}">${esc(p.operacion)}</a> / <span>JRM ${esc(p.codigo)}</span></nav>
        <header class="ficha__cab">
          <div class="ficha__meta" data-pieza><span class="pastilla pastilla--op">${esc(p.operacion)}</span><span class="pastilla">${esc(p.subtipo || p.tipoUno)}</span><span class="pastilla">Código JRM ${esc(p.codigo)}</span></div>
          <h1 class="titulo" data-pieza>${esc(titulo)}</h1>
          <p class="ficha__precio" data-pieza><span>${esc(precioTxt(p))}</span></p>
          <p class="bajada" data-pieza>${esc(p.localidad)}, Chaco · Actualizado al ${esc(p.actualizado)}</p>
        </header>
        <div class="ficha__rej">
          <div>
            <div class="galeria" data-pieza>
              <div class="galeria__principal">
                <div class="galeria__pista" id="pista" tabindex="0" aria-label="Fotos de la propiedad. Usá las flechas para pasar.">
                  ${p.fotos.map((f, i) => `<button type="button" data-foto-i="${i}" aria-label="Ampliar foto ${i + 1} de ${p.fotos.length}"><img src="${esc(f)}" alt="Foto ${i + 1} de ${esc(titulo)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></button>`).join('')}
                </div>
                ${p.fotos.length > 1 ? `<button type="button" class="galeria__nav galeria__nav--ant" data-mover="-1" aria-label="Foto anterior">${chev(-1)}</button><button type="button" class="galeria__nav galeria__nav--sig" data-mover="1" aria-label="Foto siguiente">${chev(1)}</button>` : ''}
                <span class="galeria__cuenta" aria-live="polite"><b id="cuenta">1</b> / ${p.fotos.length}</span>
              </div>
              ${p.fotos.length > 1 ? `<div class="galeria__minis" id="minis">${p.fotos.map((f, i) => `<button type="button" data-ir="${i}" aria-label="Ver foto ${i + 1}" ${i ? '' : 'aria-current="true"'}><img src="${esc(f)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>` : ''}
            </div>
            ${p.descripcion ? `<section class="ficha__bloque" data-reveal><h2 class="titulo h-md">Descripción</h2><p class="ficha__desc">${esc(p.descripcion)}</p></section>` : ''}
            ${p.caracteristicas.length ? `<section class="ficha__bloque" data-reveal><h2 class="titulo h-md">Características</h2><dl class="rasgos">${p.caracteristicas.map((c) => `<div><dt>${esc(c.nombre)}</dt><dd>${esc(limpiarTexto(c.valor))}</dd></div>`).join('')}</dl></section>` : ''}
            <section class="ficha__bloque" data-reveal><h2 class="titulo h-md">Ubicación</h2>
              <div class="mapa-pend"><p><b>${esc(p.dir)}, ${esc(p.localidad)}</b></p><p><span class="marcador">[MAPA: se activa con la latitud y longitud de la API de Top Inmobiliario]</span></p>
              <a class="enlace" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.dir}, ${p.localidad}, Chaco, Argentina`)}">Buscar la dirección en Google Maps →</a></div>
            </section>
          </div>
          <aside class="ficha__lado" data-oculta-barra>
            <div class="lado oscuro" data-pieza>
              <div><small>${p.operacion === 'Venta' ? 'Precio de venta' : 'Alquiler mensual'}</small><p class="lado__precio">${esc(precioTxt(p))}</p></div>
              <a class="btn btn--wa btn--ancho" data-magnetic target="_blank" rel="noopener" href="${waUrl(msg)}">Consultar por WhatsApp <span class="btn__flecha">${flecha}</span></a>
              <form class="form-lado" data-wa="Consulta por la propiedad JRM ${esc(p.codigo)} · ${esc(titulo)}" novalidate style="display:grid;gap:12px">
                <div class="campo"><label for="c-nombre">Nombre</label><input id="c-nombre" name="nombre" data-etiqueta="Nombre" autocomplete="name" required aria-describedby="c-nombre-error"><span class="campo__error" id="c-nombre-error" role="alert"></span></div>
                <div class="campo"><label for="c-tel">Teléfono</label><input id="c-tel" name="telefono" type="tel" inputmode="tel" data-etiqueta="Teléfono" data-regla="tel" autocomplete="tel" required aria-describedby="c-tel-error"><span class="campo__error" id="c-tel-error" role="alert"></span></div>
                <div class="campo"><label for="c-msg">Mensaje</label><textarea id="c-msg" name="mensaje" data-etiqueta="Mensaje">Quiero más información y coordinar una visita.</textarea></div>
                <div class="trampa" aria-hidden="true"><label>No completar<input name="website_check" tabindex="-1" autocomplete="off"></label></div>
                <button class="btn btn--ancho" type="submit">Enviar consulta <span class="btn__flecha">${flecha}</span></button>
                <div class="form__ok" hidden tabindex="-1" style="color:var(--ink)"><b>Se abrió WhatsApp con tu consulta.</b><a href="#" target="_blank" rel="noopener">Si no se abrió, tocá acá.</a></div>
              </form>
              <div class="lado__acciones">
                <button type="button" class="btn btn--linea" id="compartir">Compartir</button>
                <a class="btn btn--linea" href="tel:+543624421350">Llamar</a>
              </div>
              <small id="compartir-ok" role="status"></small>
            </div>
          </aside>
        </div>
        ${similares.length ? `<section class="seccion" style="padding-bottom:0"><div class="cabecera-sec"><p class="ceja"><span class="barras" aria-hidden="true"><i></i><i></i><i></i></span>También en ${esc(p.operacion.toLowerCase())}</p><h2 class="titulo h-lg" data-split>Propiedades similares</h2></div><div class="rejilla">${similares.map(tarjeta).join('')}</div></section>` : ''}
      </div>
      <div class="luz" id="luz" hidden role="dialog" aria-modal="true" aria-label="Fotos ampliadas">
        <div class="luz__barra"><span><b id="luz-n">1</b> / ${p.fotos.length}</span><button type="button" class="redondo" id="luz-cerrar" aria-label="Cerrar">✕</button></div>
        <div class="luz__img"><img id="luz-img" alt=""></div>
        <div class="luz__ctrl"><button type="button" class="redondo" data-luz="-1" aria-label="Foto anterior">${chev(-1)}</button><button type="button" class="redondo" data-luz="1" aria-label="Foto siguiente">${chev(1)}</button></div>
      </div>`;

    // Galería
    const pista = $('#pista'), minis = $('#minis'), cuenta = $('#cuenta');
    let actual = 0;
    const ir = (i, suave = true) => { i = (i + p.fotos.length) % p.fotos.length; pista.scrollTo({ left: i * pista.clientWidth, behavior: suave && !RM ? 'smooth' : 'auto' }); };
    const marcar = (i) => {
      if (i === actual) return; actual = i; cuenta.textContent = i + 1;
      if (minis) $$('button', minis).forEach((b, k) => { if (k === i) { b.setAttribute('aria-current', 'true'); b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: RM ? 'auto' : 'smooth' }); } else b.removeAttribute('aria-current'); });
    };
    pista.addEventListener('scroll', () => marcar(Math.round(pista.scrollLeft / pista.clientWidth)), { passive: true });
    cont.addEventListener('click', (e) => {
      const m = e.target.closest('[data-mover]'); if (m) return ir(actual + Number(m.dataset.mover));
      const t = e.target.closest('[data-ir]'); if (t) return ir(Number(t.dataset.ir));
      const f = e.target.closest('[data-foto-i]'); if (f) return abrirLuz(Number(f.dataset.fotoI));
      const l = e.target.closest('[data-luz]'); if (l) return luzIr(luzI + Number(l.dataset.luz));
    });
    pista.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1); } });

    // Fotos ampliadas
    const luz = $('#luz'), luzImg = $('#luz-img'), luzN = $('#luz-n');
    let luzI = 0, volverA = null;
    const luzIr = (i) => { luzI = (i + p.fotos.length) % p.fotos.length; luzImg.src = p.fotos[luzI]; luzImg.alt = `Foto ${luzI + 1} de ${titulo}`; luzN.textContent = luzI + 1; };
    function abrirLuz(i) { volverA = d.activeElement; luz.hidden = false; d.documentElement.style.overflow = 'hidden'; luzIr(i); $('#luz-cerrar').focus(); }
    const cerrarLuz = () => { luz.hidden = true; d.documentElement.style.overflow = ''; ir(luzI, false); if (volverA) volverA.focus(); };
    $('#luz-cerrar').addEventListener('click', cerrarLuz);
    luz.addEventListener('click', (e) => { if (e.target === luz || e.target.classList.contains('luz__img')) cerrarLuz(); });
    d.addEventListener('keydown', (e) => {
      if (luz.hidden) return;
      if (e.key === 'Escape') cerrarLuz();
      if (e.key === 'ArrowRight') luzIr(luzI + 1);
      if (e.key === 'ArrowLeft') luzIr(luzI - 1);
      if (e.key === 'Tab') { const f = $$('button', luz); const i = f.indexOf(d.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    });

    // Compartir
    $('#compartir').addEventListener('click', async () => {
      const ok = $('#compartir-ok'), datos = { title: d.title, text: `${titulo} · ${precioTxt(p)}`, url: location.href };
      try {
        if (navigator.share) await navigator.share(datos);
        else { await navigator.clipboard.writeText(location.href); ok.textContent = 'Enlace copiado. Ya podés pegarlo donde quieras.'; }
      } catch (e) { if (e && e.name !== 'AbortError') ok.textContent = 'No se pudo compartir. Copiá la dirección desde la barra del navegador.'; }
    });

    // La barra del celular apunta a esta propiedad
    const bw = $('.barra-movil a'); if (bw) bw.href = waUrl(msg);
  })();
})();
