# J.R. Martínez Quiles Inmobiliaria — sitio nuevo

Rediseño de https://inmobiliariamartinezquiles.com.ar/ · construido el 13/11/2026 · sitio estático (HTML, CSS y JS, sin instalación).

## Cómo verlo

Abrí `index.html` con doble clic en Chrome. No necesita servidor ni `npm install`.

La animación de apertura corre una sola vez por sesión del navegador. Para volver a verla: cerrá la pestaña y abrila de nuevo.

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | Inicio: portada, "¿Qué estás buscando?", destacadas, Pueblo Mío, la firma, servicios, contacto |
| `propiedades.html` | Listado con filtros en la URL, orden, contador y paginación |
| `propiedad.html?codigo=2252` | Ficha: galería, precio, características, WhatsApp, consulta, compartir, similares |
| `tasar.html` | "Quiero vender": pasos y formulario de tasación |
| `servicios.html`, `empresa.html`, `contacto.html` | Contenido institucional |
| `404.html` | Página de error |
| `css/sitio.css` | Todos los estilos y los valores de diseño (arriba de todo, en `:root`) |
| `js/main.js` | Movimiento e interacción |
| `js/catalogo.js` | Destacadas, listado y ficha |
| `data/propiedades.js` / `.json` | Muestra de 23 propiedades reales |
| `scripts/snapshot-propiedades.mjs` | Vuelve a generar la muestra desde el sitio actual |
| `vendor/` | GSAP 3.13.0 (con ScrollTrigger y SplitText) y Lenis 1.3.11 |
| `fonts/` | Archivo (variable) y Poppins 400/500/600 |
| `direccion-de-arte.html` | Hoja de muestra aprobada. No se publica |
| `materiales/` | Logo original y referencias. No se publica |
| `.work/` | Capturas de revisión. No se publica |

## Dirección de arte aprobada: "Se levanta"

La página se construye como un edificio: todo sube desde abajo, sin rebotes.

### Colores

| Valor | HEX | Papel |
|---|---|---|
| `--ink` | `#211E20` | Textos, botones, secciones de peso |
| `--yellow` | `#F0E12C` | Subrayados, flechas, etiquetas. Nunca como color de letra sobre claro |
| `--bg` | `#F4F2EC` | Fondo general |
| `--stone` | `#E8E4D9` | Fondos de apoyo |
| `--surface` | `#FFFFFF` | Tarjetas y formularios |
| `--muted` | `#5E5A57` | Texto secundario |
| `--wa` | `#128C4A` | Botones de WhatsApp |

Contrastes: negro sobre papel 14,6:1 · blanco sobre negro 16,4:1 · negro sobre amarillo 12,3:1 · gris secundario sobre papel 6,1:1 · blanco sobre verde WhatsApp 4,6:1.

### Letras

- Títulos: Archivo, peso 760, ancho 112 %.
- Textos: Poppins (la que ya usaba el sitio).

### Elementos propios (salen del símbolo del logo)

1. **Tres barras**: marcan cada título y crecen al aparecer.
2. **Ventana hexagonal**: marco de las fotos importantes y forma de la apertura y del menú.
3. **Línea amarilla**: subraya la palabra clave y los enlaces.
4. **Esquina en corte**: en fotos, tarjetas, etiquetas y botones.

### Movimiento

| Token | Valor |
|---|---|
| Curva de entrada | `power4.out` / `cubic-bezier(.22,1,.36,1)` |
| Curva de cortinas | `power3.inOut` / `cubic-bezier(.76,0,.24,1)` |
| Duración base | 1,05 s |
| Recorrido | 26 px |
| Escalonado | 0,08 s |
| Rebote | Ninguno |
| Inercia del scroll (Lenis) | 0,1 |

**Firma (inicio, 3 s, se salta con un toque o una tecla):** pantalla negra → las tres barras crecen → el hexágono se dibuja → se abre como ventana sobre la portada → el titular sube línea por línea y la línea amarilla se dibuja.

**Rima:** telón con las tres barras entre páginas, menú móvil que se abre como hexágono, símbolo que se rearma en el pie y en las portadas interiores.

**Otros efectos:** barra de progreso amarilla, cabecera que se esconde al bajar, títulos por líneas, fotos con desplazamiento interno, cifras que cuentan, texto que se enciende al bajar, botones magnéticos y cursor "Arrastrá" (solo con mouse), carril arrastrable, galería con fotos ampliadas.

Con "Reducir movimiento" o sin JavaScript todo se ve completo y quieto.

## Qué editar fácil

| Quiero cambiar | Dónde |
|---|---|
| Colores, radios, tiempos | `css/sitio.css`, bloque `:root` |
| Carácter del movimiento | `js/main.js`, objeto `M` |
| Número de WhatsApp | constante `WA` en `js/main.js` y `js/catalogo.js`, y los enlaces `wa.me` de cada HTML |
| Propiedades destacadas | lista `orden` en `js/catalogo.js` |
| Textos | directo en cada HTML |

Después de editar CSS o JS, cambiá el `?v=20261116b` de los HTML para que el hosting no sirva la versión vieja.

## De dónde salió cada dato

| Dato | Fuente | Fecha |
|---|---|---|
| Propiedades, fotos, precios | Páginas públicas del sitio actual | 13/11/2026 |
| 74 en venta / 57 en alquiler | Contador del sitio actual | 13/11/2026 |
| Pueblo Mío (600 m², 20 × 30, $ 20.400.000, 120 cuotas UVI, 15 % contado, laguna) | Publicación JRM 2229 | 23/09/2026 |
| Trayectoria, fundador, dirección, credenciales | `empresa.html` y `servicios.html` del sitio actual | Mapeo del 11/11/2026 |
| Dirección, WhatsApp, Facebook | Sitio actual | 11/11/2026 |
| Teléfono 3624 421350 | Directorio público de Top Inmobiliario | 11/11/2026 |

## Problemas del sitio viejo resueltos

| # del mapeo | Estado |
|---|---|
| 1. Sin consulta ni WhatsApp en la ficha | Resuelto: botón con código precargado y formulario |
| 2. Código inexistente da HTTP 500 | Resuelto en pantalla: mensaje "ya no está publicada". El código 404 real requiere servidor (ver pendientes) |
| 3. Sin `robots.txt` ni `sitemap.xml` | Resuelto para las páginas fijas |
| 4. Sin Open Graph | Resuelto. En la ficha se completa con JS |
| 5. Meta description repetida | Resuelto: una por página |
| 6. Filtros en la sesión | Resuelto: van en la URL |
| 7. Ficha sin mapa | Resuelto con mapa por dirección (aproximado). El punto exacto llega con la latitud y longitud de la API |
| 8. Enlace de email roto | Quitado |
| 9. Precios "U$S 1" y `Alquier` | Resuelto: "Consultar" y "Alquiler" |
| 10. "Tasasiones" y "© 2024" | Resuelto: año automático |
| 11. 7 hojas CSS | Resuelto: una sola |
| 12. Formularios sin validar | Resuelto: email y teléfono |
| 13. Búsqueda limitada | Resuelto: precio, moneda, código/calle/barrio y orden |

## Por validar (decisiones tomadas sin consultar)

1. **Símbolo redibujado.** El logo solo existe como GIF de 530 × 130. Se redibujó el símbolo en vector para animarlo. En el menú va el GIF original. Pedir el vector a quien diseñó el logo.
2. **Formularios por WhatsApp.** No hay servidor ni casilla confirmada: validan, arman el mensaje y abren WhatsApp. Se quitó reCAPTCHA y CSRF (no aplican sin servidor); queda el campo trampa.
3. **Fotos enlazadas** a topinmobiliario.com, igual que el sitio actual.
4. **Filtros con lo que hay en la muestra.** Tipos y localidades salen de las 23 propiedades. "Alquiler turístico" e "Inversión con renta" quedan en el formulario de tasación, no en el filtro, porque la muestra no tiene ninguna.
5. **Pasos de la tasación** ("Nos contás / Te contactamos / Tasamos"): redactados por mí. Confirmar que así trabajan.
6. **Manifiesto y bajadas**: redactados a partir del contenido institucional.
7. **Orden por precio**: no mezcla monedas. Primero dólares, después pesos; "Consultar" al final.
8. **Google Analytics 4** (`G-5YYN19STQM`) no está activo. Hay un comentario en el `<head>` de cada página.
9. **Mapas a la vista** (pedido del 14/11/2026): el de la oficina y el de cada ficha se cargan solos. El de la ficha busca por la dirección publicada, así que es aproximado; si la dirección no tiene calle (ej. JRM 2197) muestra la localidad.
10. **Menú**: se acortó "Quiero Alquilar / Comprar / Vender" a "Alquilar / Comprar / Vender". Se mantienen las 7 secciones.
11. **Banner Pueblo Mío**: se reemplazó la imagen con lightbox por una sección con datos de la publicación.
12. **Opiniones de Google**: nota 4,0 con 81 opiniones y tres opiniones de 5 estrellas copiadas a mano de la ficha pública el 14/11/2026 (texto original; en una se corrigió mayúscula y tilde inicial). No se actualizan solas: para eso hace falta la API de Google Places con clave y un servidor. Los botones usan el Place ID `ChIJgapC2VgMRZQRHr39D0rkBJw`.
13. **Fotos de "Vender" y "Tasar"** (`img/que-vender.png`, `img/que-tasar.webp`): las pasó David. Confirmar que tienen licencia de uso antes de publicar.

## Pendientes

| Pendiente | De quién depende |
|---|---|
| Credenciales de la API de Top Inmobiliario (JRM) | Cliente / SOM |
| Backend para la API: catálogo completo (131), 404 real, sitemap y Open Graph por propiedad, mapa con latitud/longitud | Equipo, cuando haya credenciales |
| Casilla de correo para los formularios | Cliente |
| `[FOTO DE LA OFICINA O DEL EQUIPO]` en La inmobiliaria | Cliente |
| Logo en vector | Cliente / diseñador |
| Confirmar si se mantiene GA4 `G-5YYN19STQM` | Cliente |
| Aviso de seguridad a SOM (credenciales expuestas en `script.js` de Top Inmobiliario) | Equipo |

## Cómo publicar

Subir todo menos `materiales/`, `scripts/`, `.work/`, `direccion-de-arte.html` y este archivo. Configurar en el hosting que los errores 404 muestren `404.html`.

No conviene publicar mientras quede el marcador amarillo entre corchetes (foto de la oficina).

## Revisión hecha (13/11/2026)

Chrome 157 sin ventana, a 375 × 812 y 1440 × 900, en las 8 páginas: sin desborde lateral, sin contenido oculto, sin errores de consola, sin imágenes rotas, fuentes cargadas. También con "Reducir movimiento" y sin JavaScript.

No verificado: envío real de los formularios por WhatsApp, navegadores distintos de Chrome, y dispositivos físicos.
