/* J.R. Martínez Quiles · movimiento e interacción. Orden: ayudantes, lo que sirve siempre, efectos, arranque. */
(() => {
  'use strict';

  // ---------- 1. Ayudantes, banderas y tokens de movimiento ----------
  const d = document, html = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const safe = (fn) => { try { fn(); } catch (e) { console.warn('[mq]', e); } };
  const M = { ease: 'power4.out', easeIO: 'power3.inOut', pop: 'power4.out', dur: 1.05, stagger: 0.08, dist: 26, lerp: 0.1 };
  const WA = '5493624302344';
  const waUrl = (texto) => `https://wa.me/${WA}?text=${encodeURIComponent(texto)}`;

  const telon = $('.telon'), cortina = $('.cortina');
  // El JS está vivo: se apaga el rescate por tiempo del CSS.
  [telon, cortina].forEach((el) => { if (el) el.style.animation = 'none'; });

  if (!hasGSAP) html.classList.remove('js');
  else {
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
  const ANIMA = hasGSAP && !RM;

  // Puntos de un hexágono de punta arriba (la forma del símbolo), en px.
  const hexPts = (cx, cy, R) => {
    const a = R * 0.866, b = R * 0.5;
    return [[cx, cy - R], [cx + a, cy - b], [cx + a, cy + b], [cx, cy + R], [cx - a, cy + b], [cx - a, cy - b]]
      .map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(',');
  };

  // ---------- 2. Scroll con inercia ----------
  let lenis = null;
  safe(() => {
    if (!ANIMA || !window.Lenis) return;
    lenis = new Lenis({ lerp: M.lerp, anchors: { offset: -76 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  });
  const frenar = (si) => { if (lenis) si ? lenis.stop() : lenis.start(); html.style.overflow = si ? 'hidden' : ''; };

  // ---------- 3. Lo que debe servir siempre ----------
  // Año del pie
  safe(() => $$('[data-anio]').forEach((el) => { el.textContent = new Date().getFullYear(); }));

  // Cabecera: sólida al bajar, se esconde bajando y vuelve subiendo. Barra de progreso.
  safe(() => {
    const cab = $('.cab'), prog = $('.progreso');
    if (!cab) return;
    let antes = 0, tic = false;
    const leer = () => {
      const y = window.scrollY, max = d.documentElement.scrollHeight - innerHeight;
      cab.classList.toggle('cab--solida', y > 16);
      cab.classList.toggle('cab--oculta', y > 320 && y > antes && !html.classList.contains('menu-abierto'));
      if (prog) prog.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      antes = y; tic = false;
    };
    addEventListener('scroll', () => { if (!tic) { tic = true; requestAnimationFrame(leer); } }, { passive: true });
    leer();
  });

  // Menú móvil: se abre como la ventana hexagonal, desde el botón.
  safe(() => {
    const boton = $('.cab__menu'), menu = $('.menu');
    if (!boton || !menu) return;
    const estado = { s: 0 };
    const pintar = () => {
      const r = boton.getBoundingClientRect();
      const R = estado.s * Math.hypot(innerWidth, innerHeight) * 1.25;
      menu.style.clipPath = `polygon(${hexPts(r.left + r.width / 2, r.top + r.height / 2, R)})`;
    };
    const abrir = (si) => {
      boton.setAttribute('aria-expanded', String(si));
      boton.setAttribute('aria-label', si ? 'Cerrar menú' : 'Abrir menú');
      frenar(si);
      if (!ANIMA) { html.classList.toggle('menu-abierto', si); menu.style.clipPath = ''; return; }
      gsap.killTweensOf(estado);
      if (si) {
        html.classList.add('menu-abierto');
        gsap.to(estado, { s: 1, duration: 0.9, ease: M.easeIO, onUpdate: pintar });
        gsap.fromTo($$('.menu__lista a, .menu__pie > *', menu), { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: M.ease, stagger: 0.055, delay: 0.25 });
      } else {
        gsap.to(estado, { s: 0, duration: 0.6, ease: M.easeIO, onUpdate: pintar, onComplete: () => html.classList.remove('menu-abierto') });
      }
    };
    boton.addEventListener('click', () => abrir(!html.classList.contains('menu-abierto')));
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && html.classList.contains('menu-abierto')) { abrir(false); boton.focus(); } });
    matchMedia('(min-width:1080px)').addEventListener('change', (e) => { if (e.matches && html.classList.contains('menu-abierto')) abrir(false); });
  });

  // Carril de destacadas: flechas, arrastre con mouse y cursor con etiqueta.
  safe(() => {
    $$('[data-carril]').forEach((carril) => {
      const zona = carril.closest('section') || d;
      const ant = $('[data-carril-ant]', zona), sig = $('[data-carril-sig]', zona);
      const paso = () => (carril.firstElementChild ? carril.firstElementChild.getBoundingClientRect().width + 18 : 320);
      const estado = () => {
        if (ant) ant.disabled = carril.scrollLeft < 8;
        if (sig) sig.disabled = carril.scrollLeft > carril.scrollWidth - carril.clientWidth - 8;
      };
      if (ant) ant.addEventListener('click', () => carril.scrollBy({ left: -paso(), behavior: RM ? 'auto' : 'smooth' }));
      if (sig) sig.addEventListener('click', () => carril.scrollBy({ left: paso(), behavior: RM ? 'auto' : 'smooth' }));
      carril.addEventListener('scroll', estado, { passive: true });
      setTimeout(estado, 300);
      if (!FINE) return;
      let x0 = 0, s0 = 0, activo = false, movio = 0;
      carril.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; activo = true; movio = 0; x0 = e.clientX; s0 = carril.scrollLeft; });
      addEventListener('pointermove', (e) => {
        if (!activo) return;
        movio = Math.abs(e.clientX - x0);
        if (movio > 6) { carril.classList.add('arrastrando'); carril.scrollLeft = s0 - (e.clientX - x0); }
      });
      addEventListener('pointerup', () => { if (!activo) return; activo = false; setTimeout(() => carril.classList.remove('arrastrando'), 0); });
      carril.addEventListener('click', (e) => { if (movio > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
      carril.addEventListener('dragstart', (e) => e.preventDefault());
      // Cursor hexagonal "Arrastrá"
      const cursor = $('.cursor');
      if (!cursor || !ANIMA) return;
      const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' }), yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
      carril.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });
      carril.addEventListener('pointerenter', () => gsap.to(cursor, { autoAlpha: 1, scale: 1, duration: 0.35, ease: M.ease }));
      carril.addEventListener('pointerleave', () => gsap.to(cursor, { autoAlpha: 0, scale: 0.4, duration: 0.3 }));
    });
  });

  // Mapa: se carga recién cuando la persona lo pide.
  safe(() => {
    $$('.mapa__carga').forEach((b) => b.addEventListener('click', () => {
      const f = d.createElement('iframe');
      f.src = b.dataset.src; f.title = 'Mapa de la oficina: Catamarca 267, Resistencia'; f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      b.replaceWith(f);
    }));
  });

  // Barra fija del celular: se esconde al llegar al contacto y al pie.
  safe(() => {
    const barra = $('.barra-movil');
    if (!barra || !('IntersectionObserver' in window)) return;
    const visibles = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)));
      barra.classList.toggle('barra-movil--fuera', visibles.size > 0);
    }, { threshold: 0.12 });
    $$('[data-oculta-barra], .pie').forEach((el) => io.observe(el));
  });

  // Formularios: validan y arman el mensaje de WhatsApp (no hay servidor de correo).
  safe(() => {
    const reglas = {
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Revisá el correo: falta algo, por ejemplo nombre@dominio.com',
      tel: (v) => v.replace(/\D/g, '').length >= 8 || 'El teléfono necesita al menos 8 números, con característica',
    };
    $$('form[data-wa]').forEach((form) => {
      const errorDe = (campo) => $(`#${campo.id}-error`, form);
      const validar = (campo) => {
        const v = campo.value.trim();
        let msg = '';
        if (campo.required && !v) msg = 'Este dato es necesario';
        else if (v && reglas[campo.dataset.regla]) { const r = reglas[campo.dataset.regla](v); if (r !== true) msg = r; }
        campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
        const e = errorDe(campo); if (e) e.textContent = msg;
        return !msg;
      };
      const campos = $$('input:not([type=hidden]):not(.trampa input), select, textarea', form).filter((c) => !c.closest('.trampa'));
      campos.forEach((c) => c.addEventListener('blur', () => { if (c.value || c.getAttribute('aria-invalid') === 'true') validar(c); }));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const trampa = $('.trampa input', form);
        if (trampa && trampa.value) return; // robots
        const malos = campos.filter((c) => !validar(c));
        if (malos.length) { malos[0].focus(); return; }
        const lineas = [form.dataset.wa];
        campos.forEach((c) => { if (c.value.trim()) lineas.push(`${c.dataset.etiqueta || c.name}: ${c.value.trim()}`); });
        const url = waUrl(lineas.join('\n'));
        const ok = $('.form__ok', form);
        if (ok) { ok.hidden = false; const a = $('a', ok); if (a) a.href = url; ok.focus(); }
        window.open(url, '_blank', 'noopener');
      });
    });
  });

  // Paso entre páginas: el telón sube con las tres barras y recién ahí se navega.
  safe(() => {
    if (!telon || !ANIMA) return;
    d.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || !/^(https?|file):$/.test(u.protocol)) return;
      if (u.pathname === location.pathname && u.search === location.search) return; // ancla en la misma página
      e.preventDefault();
      gsap.set(telon, { display: 'grid', visibility: 'visible', yPercent: 100 });
      gsap.fromTo($$('.barras i', telon), { scaleY: 0 }, { scaleY: 1, duration: 0.45, stagger: 0.07, delay: 0.15, ease: 'power3.out' });
      gsap.to(telon, { yPercent: 0, duration: 0.55, ease: M.easeIO, onComplete: () => { location.href = a.href; } });
    });
    addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(telon, { display: 'none' }); });
  });

  if (!hasGSAP) return;

  // ---------- 4. Efectos de mouse (solo con puntero fino) ----------
  safe(() => {
    if (!FINE || RM) return;
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' }), yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.18); yTo((e.clientY - r.top - r.height / 2) * 0.28);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
    // La foto de la portada acompaña apenas al mouse
    const foto = $('[data-foto]'), portada = $('.portada');
    if (foto && portada) {
      const xTo = gsap.quickTo(foto, 'x', { duration: 0.9, ease: 'power3.out' }), yTo = gsap.quickTo(foto, 'y', { duration: 0.9, ease: 'power3.out' });
      portada.addEventListener('pointermove', (e) => { xTo((e.clientX / innerWidth - 0.5) * -18); yTo((e.clientY / innerHeight - 0.5) * -12); });
    }
  });

  // ---------- 5. Menos movimiento: todo visible y quieto ----------
  if (RM) { [telon, cortina].forEach((el) => el && (el.style.display = 'none')); return; }

  // ---------- 6. Efectos de scroll ----------
  const una = (trigger, start = 'top 86%') => ({ trigger, start, once: true });

  // Piezas nuevas que aparecen (tarjetas al filtrar)
  window.MQ = window.MQ || {};
  window.MQ.entrar = (els) => gsap.fromTo(els, { autoAlpha: 0, y: M.dist }, { autoAlpha: 1, y: 0, duration: 0.8, ease: M.ease, stagger: 0.05, overwrite: true });
  window.MQ.contar = (el, hasta) => {
    const o = { v: Number(el.textContent.replace(/\D/g, '')) || 0 };
    gsap.to(o, { v: hasta, duration: 0.7, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } });
  };

  function dibujarIso(svg, st) {
    const barras = $$('[data-barra]', svg), hexa = $('[data-hexa]', svg);
    if (!hexa) return;
    const L = hexa.getTotalLength();
    gsap.set(barras, { scaleY: 0, transformOrigin: '50% 100%' });
    gsap.set(hexa, { strokeDasharray: L, strokeDashoffset: L });
    gsap.timeline({ scrollTrigger: st })
      .to(barras, { scaleY: 1, duration: 0.7, stagger: 0.11, ease: 'power3.out' })
      .to(hexa, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.25)
      .set(hexa, { strokeDasharray: 'none' });
  }

  function efectosDeScroll() {
    // Títulos: suben por líneas desde su ranura
    safe(() => $$('[data-split]').forEach((el) => {
      if (!window.SplitText) { gsap.from(el, { autoAlpha: 0, y: M.dist, duration: M.dur, ease: M.ease, scrollTrigger: una(el) }); return; }
      SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
        onSplit: (s) => gsap.from(s.lines, { yPercent: 108, duration: M.dur, ease: M.ease, stagger: M.stagger, scrollTrigger: una(el) }) });
    }));
    // Las tres barras crecen junto a cada ceja
    safe(() => $$('.ceja .barras').forEach((b) => gsap.from($$('i', b), { scaleY: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, scrollTrigger: una(b, 'top 90%') })));
    // La línea amarilla se dibuja
    safe(() => $$('.sub:not([data-sub])').forEach((s) => gsap.from(s, { '--sub': '0%', duration: 0.9, ease: 'power3.inOut', delay: 0.45, scrollTrigger: una(s, 'top 88%') })));
    // Revelados en cascada
    safe(() => {
      const piezas = $$('[data-reveal]');
      if (!piezas.length) return;
      gsap.set(piezas, { autoAlpha: 0, y: M.dist });
      ScrollTrigger.batch(piezas, { start: 'top 90%', once: true, onEnter: (b) => gsap.to(b, { autoAlpha: 1, y: 0, duration: M.dur, ease: M.ease, stagger: M.stagger, overwrite: true }) });
    });
    // Ventanas hexagonales: se asientan, el contorno se dibuja y la foto se desplaza por dentro
    safe(() => $$('[data-hex]').forEach((h) => {
      const marco = $('.marco', h), img = $('.marco img', h), contorno = $('.contorno polygon', h);
      if (marco) gsap.from(marco, { scale: 0.86, autoAlpha: 0, duration: 1.3, ease: M.ease, scrollTrigger: una(h, 'top 82%') });
      if (contorno) { const L = contorno.getTotalLength(); gsap.fromTo(contorno, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', delay: 0.3, scrollTrigger: una(h, 'top 82%') }); }
      if (img) gsap.fromTo(img, { yPercent: 0 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: true } });
    }));
    // Fotos con desplazamiento interno
    safe(() => $$('[data-parallax]').forEach((img) => gsap.fromTo(img, { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } })));
    // Barras decorativas de las tarjetas planas
    safe(() => $$('.que__deco').forEach((q) => gsap.from($$('i', q), { scaleY: 0, duration: 1, ease: 'power3.out', stagger: 0.12, scrollTrigger: una(q, 'top 92%') })));
    // Cifras reales que cuentan
    safe(() => $$('[data-count]').forEach((el) => {
      const hasta = Number(el.dataset.count), o = { v: 0 };
      gsap.to(o, { v: hasta, duration: 1.8, ease: 'power2.out', scrollTrigger: una(el, 'top 90%'), onUpdate: () => { el.textContent = Math.round(o.v); } });
    }));
    // Manifiesto: las palabras se encienden al bajar
    safe(() => $$('[data-palabras]').forEach((el) => {
      if (!window.SplitText) return;
      const s = SplitText.create(el, { type: 'words' });
      gsap.fromTo(s.words, { opacity: 0.16 }, { opacity: 1, ease: 'none', stagger: 0.4, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 55%', scrub: true } });
    }));
    // Línea de los pasos
    safe(() => $$('.pasos__linea i').forEach((l) => gsap.fromTo(l, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: l.parentElement, start: 'top 70%', end: 'bottom 60%', scrub: true } })));
    // El símbolo se vuelve a armar (pie y portadas interiores)
    safe(() => $$('[data-iso-scroll]').forEach((svg) => dibujarIso(svg, una(svg, 'top 92%'))));
    // Lema del pie: sube con el scroll
    safe(() => { const l = $('.pie__lema'); if (l) gsap.from(l, { y: 60, autoAlpha: 0, duration: 1.3, ease: M.ease, scrollTrigger: una(l, 'top 98%') }); });
    ScrollTrigger.refresh();
  }

  // ---------- 7. Arranque ----------
  // Entrada de la primera pantalla (portada del inicio o portada interior)
  function entradaPrimeraPantalla(tl, en) {
    const zona = $('.portada') || $('.tapa') || $('.ficha') || $('main');
    if (!zona) return;
    const lineas = $$('.linea__in', zona), piezas = $$('[data-pieza]', zona);
    if (lineas.length) tl.fromTo(lineas, { yPercent: 108 }, { yPercent: 0, duration: M.dur, stagger: M.stagger + 0.03, ease: M.ease }, en);
    if (piezas.length) tl.fromTo(piezas, { autoAlpha: 0, y: M.dist }, { autoAlpha: 1, y: 0, duration: M.dur, stagger: M.stagger, ease: M.ease }, en + 0.2);
    const img = $('[data-foto] .marco img', zona), contorno = $('[data-contorno]', zona), sub = $('[data-sub]', zona);
    if (img) tl.fromTo(img, { scale: 1.16 }, { scale: 1, duration: 1.7, ease: M.ease }, en - 0.25);
    if (contorno) { const L = contorno.getTotalLength(); tl.fromTo(contorno, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, en + 0.3); }
    if (sub) tl.fromTo(sub, { '--sub': '0%' }, { '--sub': '100%', duration: 0.9, ease: 'power3.inOut' }, en + 0.75);
  }

  // La firma: los edificios se levantan, el hexágono los rodea y se abre como ventana sobre la portada.
  function firma() {
    const hueco = { s: 0 };
    const pintar = () => {
      const w = innerWidth, h = innerHeight;
      cortina.style.clipPath = `polygon(evenodd,0 0,${w}px 0,${w}px ${h}px,0 ${h}px,0 0,${hexPts(w / 2, h / 2, hueco.s * Math.hypot(w, h) * 0.62)},${hexPts(w / 2, h / 2, hueco.s * Math.hypot(w, h) * 0.62).split(',')[0]})`;
    };
    const barras = $$('[data-barra]', cortina), hexa = $('[data-hexa]', cortina), iso = $('svg', cortina);
    const L = hexa.getTotalLength();
    const tl = gsap.timeline({ defaults: { ease: M.ease } });
    frenar(true);
    tl.set(barras, { scaleY: 0, transformOrigin: '50% 100%' })
      .set(hexa, { strokeDasharray: L, strokeDashoffset: L })
      .to(barras, { scaleY: 1, duration: 0.7, stagger: 0.11, ease: 'power3.out' }, 0.15)
      .to(hexa, { strokeDashoffset: 0, duration: 0.85, ease: 'power2.inOut' }, 0.45)
      .set(hexa, { strokeDasharray: 'none' })
      .addLabel('abre', 1.75)
      .to(iso, { scale: 1.5, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 'abre')
      .to(hueco, { s: 1, duration: 1.15, ease: M.easeIO, onUpdate: pintar }, 'abre+=0.05')
      .call(() => { frenar(false); efectosDeScroll(); }, null, 'abre+=0.3')
      .set(cortina, { display: 'none' }, 'abre+=1.25');
    entradaPrimeraPantalla(tl, 2.25);
    // Se salta con un toque
    cortina.addEventListener('pointerdown', () => { if (tl.time() < tl.labels.abre) tl.seek('abre'); }, { once: true });
    addEventListener('keydown', () => { if (tl.time() < tl.labels.abre) tl.seek('abre'); }, { once: true });
    return tl;
  }

  function entradaConTelon() {
    if (cortina) cortina.style.display = 'none';
    const tl = gsap.timeline();
    if (telon) {
      tl.fromTo($$('.barras i', telon), { scaleY: 0 }, { scaleY: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' }, 0)
        .to(telon, { yPercent: -100, duration: 0.75, ease: M.easeIO }, 0.3)
        .set(telon, { display: 'none', yPercent: 0 });
    }
    tl.call(efectosDeScroll, null, telon ? 0.45 : 0);
    entradaPrimeraPantalla(tl, telon ? 0.6 : 0.1);
  }

  let visto = false;
  try { visto = sessionStorage.getItem('mq-visto') === '1'; sessionStorage.setItem('mq-visto', '1'); } catch (e) { /* sin almacenamiento: se muestra la firma */ }

  Promise.race([d.fonts ? d.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]).then(() => safe(() => {
    try {
      if (cortina && !visto) { if (telon) telon.style.display = 'none'; firma(); }
      else entradaConTelon();
    } catch (e) { // si la entrada falla, nada queda tapado
      [telon, cortina].forEach((el) => el && (el.style.display = 'none'));
      frenar(false); throw e;
    }
  }));
})();
