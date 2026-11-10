/* ============ VMF v2 · APP ============ */
const WA_NUMBER = "50578051963";
let products = [], cart = [], favorites = new Set();
const $ = s => document.querySelector(s);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

try {
  favorites = new Set(JSON.parse(localStorage.getItem("vmf-favs") || "[]"));
  cart = JSON.parse(localStorage.getItem("vmf-cart") || "[]");
} catch (e) { favorites = new Set(); cart = []; }
const saveState = () => { try { localStorage.setItem("vmf-favs", JSON.stringify([...favorites])); localStorage.setItem("vmf-cart", JSON.stringify(cart)); } catch (e) {} };
const img = p => `images/${p.id}.jpg`;
const fallbackImg = e => { e.target.onerror = null; e.target.src = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="#161310"/><text x="50%" y="50%" text-anchor="middle" font-family="serif" font-size="42" fill="#ff4d8d">VMF</text></svg>'); };

/* ---------- carga ---------- */
async function init() {
  try {
    const r = await fetch("src/data/productos.json");
    if (!r.ok) throw new Error("HTTP " + r.status);
    products = await r.json();
    if (!Array.isArray(products) || !products.length) throw new Error("Catálogo vacío");
    buildFilters(); render(); bind(); counters(); observeAll(); buildRing(); startParticles(); startMagnetic(); startSpotlight(); startCounters(); startHeroScroll(); startLetters(); startGridTilt(); startMarqueeSkew();

  } catch (err) {
    console.error("VMF:", err);
    const g = $("#products");
    if (g) g.innerHTML = '<p class="empty">No se pudo cargar el catálogo.</p>';
  } finally {
    setTimeout(() => $("#loader").classList.add("done"), reduceMotion ? 0 : 900);
  }
}

/* ---------- filtros ---------- */
function buildFilters() {
  const brands = [...new Set(products.map(p => p.marca).filter(Boolean))].sort();
  const colors = [...new Set(products.flatMap(p => p.colores || []))].sort();
  brands.forEach(x => $("#brand").add(new Option(x, x)));
  colors.forEach(x => $("#color").add(new Option(x, x)));
}
function filtered() {
  const q = $("#search").value.toLowerCase().trim();
  const a = $("#audience").value, c = $("#category").value, b = $("#brand").value, k = $("#color").value;
  return products.filter(p =>
    (!q || [p.producto, p.codigo, p.codi, p.marca].filter(Boolean).join(" ").toLowerCase().includes(q)) &&
    (!a || p.publico === a) && (!c || p.categoria === c) && (!b || p.marca === b) && (!k || (p.colores || []).includes(k)));
}

/* ---------- render ---------- */
function render() {
  const list = filtered();
  $("#result-count").textContent = `${list.length} de ${products.length} piezas`;
  $("#empty-state").hidden = list.length > 0;
  $("#products").innerHTML = list.map((p, i) => {
    const fav = favorites.has(p.id);
    return `<article class="card" data-id="${p.id}" style="transition-delay:${Math.min(i * 40, 400)}ms">
      <div class="card-media" data-detail="${p.id}">
        <img src="${img(p)}" alt="${p.producto}" loading="lazy" decoding="async" onerror="fallbackImg(event)">
        <span class="card-shine"></span>
        ${p.codigo ? `<span class="card-badge">${p.codigo}</span>` : ""}
        <button class="heart ${fav ? "on" : ""}" data-fav="${p.id}" aria-label="Favorito"><svg viewBox="0 0 24 24"><path d="M12 21c-6-4.5-9-8-9-11.5A5 5 0 0 1 12 6a5 5 0 0 1 9 3.5C21 13 18 16.5 12 21z"/></svg></button>
        <div class="card-actions"><div class="row"><button data-detail="${p.id}">Ver detalles</button></div><div class="row"><button data-add="${p.id}">Añadir a la bolsa</button></div></div>
      </div>
      <div class="card-info">
        <div class="card-brand">${p.marca || "Colección VMF"} · ${p.publico || ""}</div>
        <h3 data-detail="${p.id}">${p.producto}</h3>
        <div class="card-meta">${(p.colores || []).join(" · ")}</div>
      </div>
    </article>`;
  }).join("");
  requestAnimationFrame(() => $("#products").querySelectorAll(".card").forEach(el => {
    el.classList.add("in");
    el.style.transitionDelay = "";
  }));
  bindTilt();
}

/* ---------- interacción ---------- */
function showToast(t) { const e = $("#toast"); e.textContent = t; e.classList.add("show"); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove("show"), 2200); }
function openDrawer(title, html) { $("#drawer-title").textContent = title; $("#drawer-content").innerHTML = html; $("#drawer").classList.add("show"); $("#overlay").classList.add("show"); }
function closeDrawer() { $("#drawer").classList.remove("show"); if (!$("#product-modal").classList.contains("show")) $("#overlay").classList.remove("show"); }
function counters() { $("#cart-count").textContent = cart.length; const f = $("#fav-count"); f.textContent = favorites.size; f.hidden = favorites.size === 0; }

function details(id) {
  const p = products.find(x => x.id === id); if (!p) return;
  const waMsg = encodeURIComponent(`Hola, me interesa este producto:\n\n${p.producto}\nCódigo: ${p.codigo || p.id}${p.marca ? "\nMarca: " + p.marca : ""}${p.codi ? "\nCodi: " + p.codi : ""}`);
  $("#modal-content").innerHTML = `<div class="modal-grid">
    <div class="modal-media"><img src="${img(p)}" alt="${p.producto}" onerror="fallbackImg(event)"></div>
    <div class="modal-body">
      <p class="eyebrow">${p.marca || "VARIEDADES MENDEZ FAFFORD"}</p>
      <h2>${p.producto}</h2>
      <p><b>Colores:</b> ${(p.colores || []).join(", ")}</p>
      <p><b>Tallas:</b> ${p.tallas ? p.tallas.join(", ") : "No especificadas"}</p>
      <p><b>Público:</b> ${p.publico || "—"} · <b>Categoría:</b> ${p.categoria || "—"}</p>
      <div class="modal-divider"></div>
      <p><b>Código:</b> ${p.codigo || "—"}<br><b>Codi:</b> ${p.codi || "—"}<br><b>Precio:</b> Por confirmar</p>
      <div class="modal-actions">
        <button class="cta-solid" id="modal-add">Agregar a la bolsa</button>
        <a class="cta-ghost" target="_blank" rel="noopener" href="https://wa.me/${WA_NUMBER}?text=${waMsg}">Consultar por WhatsApp ↗</a>
      </div>
    </div></div>`;
  $("#product-modal").classList.add("show"); $("#overlay").classList.add("show");
  $("#modal-add").onclick = () => { add(id); $("#product-modal").classList.remove("show"); $("#overlay").classList.remove("show"); };
}
function add(id) { cart.push({ id }); saveState(); counters(); showToast("Añadido a tu bolsa ✓"); }
function cartWhatsApp() {
  const lines = cart.map(x => { const p = products.find(pr => pr.id === x.id); return p ? `• ${p.producto}${p.codigo ? " (Código: " + p.codigo + ")" : ""}` : ""; }).filter(Boolean);
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hola, quisiera pedir:\n\n" + lines.join("\n") + "\n\nGracias.")}`;
}
function showCart() {
  let html;
  if (cart.length) {
    html = cart.map((x, i) => {
      const p = products.find(pr => pr.id === x.id); if (!p) return "";
      const waMsg = encodeURIComponent(`Hola, quisiera pedir:\n\n${p.producto}\nCódigo: ${p.codigo || p.id}\n`);
      return `<div class="drawer-item"><img src="${img(p)}" alt="" onerror="this.style.display='none'"><span style="flex:1">${p.producto}<br><small style="color:var(--muted)">${p.codigo || p.id}</small></span><span style="display:flex;flex-direction:column;gap:8px;align-items:flex-end"><a href="https://wa.me/${WA_NUMBER}?text=${waMsg}" target="_blank" rel="noopener" style="font-size:10px;letter-spacing:1.4px;color:var(--gold)">PEDIR ↗</a><button data-remove="${i}">Quitar</button></span></div>`;
    }).join("") + `<div class="modal-divider"></div><a class="cta-solid" style="width:100%;justify-content:center" href="${cartWhatsApp()}" target="_blank" rel="noopener">Enviar pedido por WhatsApp</a><p class="muted" style="margin-top:14px;font-size:11px">Los precios están pendientes de confirmar.</p>`;
  } else html = `<p class="drawer-empty">Tu bolsa está vacía.</p>`;
  openDrawer("Tu bolsa", html);
}
function showFav() {
  const ids = [...favorites];
  openDrawer("Tus favoritos", ids.length ? ids.map(id => {
    const p = products.find(pr => pr.id === id); if (!p) return "";
    return `<div class="drawer-item"><img src="${img(p)}" alt="" onerror="this.style.display='none'"><span style="flex:1">${p.producto}</span><button data-detail="${id}">Ver</button></div>`;
  }).join("") : `<p class="drawer-empty">Aún no tienes favoritos.</p>`);
}

/* ---------- eventos ---------- */
function bind() {
  ["search", "audience", "category", "brand", "color"].forEach(id => $("#" + id).addEventListener("input", render));
  document.body.addEventListener("click", e => {
    const f = e.target.closest("[data-fav]");
    if (f) { const id = f.dataset.fav; favorites.has(id) ? favorites.delete(id) : favorites.add(id); saveState(); counters(); f.classList.toggle("on"); showToast(favorites.has(id) ? "Guardado en favoritos ♥" : "Eliminado de favoritos"); return; }
    const a = e.target.closest("[data-add]"); if (a) { add(a.dataset.add); return; }
    const d = e.target.closest("[data-detail]"); if (d && !e.target.closest(".heart") && !e.target.closest("#drawer-content")) details(d.dataset.detail);
    const dd = e.target.closest("#drawer-content [data-detail]"); if (dd) details(dd.dataset.detail);
    const rm = e.target.closest("[data-remove]"); if (rm) { cart.splice(+rm.dataset.remove, 1); saveState(); counters(); showCart(); }
  });
  document.querySelectorAll(".col-card").forEach(b => b.onclick = () => { $("#category").value = b.dataset.category; render(); $("#tienda").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); });
  $("#cart-open").onclick = showCart;
  $("#fav-shortcut").onclick = showFav;
  $("#drawer-close").onclick = closeDrawer;
  $("#overlay").onclick = () => { $("#product-modal").classList.remove("show"); closeDrawer(); };
  $("#modal-close").onclick = () => { $("#product-modal").classList.remove("show"); $("#overlay").classList.remove("show"); };
  $("#clear-filters").onclick = () => { ["search", "audience", "category", "brand", "color"].forEach(id => $("#" + id).value = ""); render(); };
  $("#search-open").onclick = () => { $("#search").focus(); $("#tienda").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); };
  $("#menu-toggle").onclick = () => $("#nav").classList.toggle("open");
  document.querySelectorAll("#nav a").forEach(a => a.onclick = () => $("#nav").classList.remove("open"));
  window.addEventListener("keydown", e => { if (e.key === "Escape") { $("#product-modal").classList.remove("show"); closeDrawer(); } });
}

/* ---------- animaciones de escena ---------- */
function observeAll() {
  if (reduceMotion || !("IntersectionObserver" in window)) {
    document.querySelectorAll("[data-reveal]").forEach(el => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll("[data-reveal]").forEach(el => io.observe(el));
  window.addEventListener("scroll", () => {
    $("#progress").style.width = (window.scrollY / (document.body.scrollHeight - innerHeight) * 100) + "%";
    $("#header").classList.toggle("scrolled", window.scrollY > 50);
  }, { passive: true });
  bindParallax(); bindMouse();
}
function bindParallax() {
  if (reduceMotion) return;
  const els = [...document.querySelectorAll("[data-parallax]")];
  let tick = false;
  const update = () => {
    const vh = innerHeight;
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const sp = parseFloat(el.dataset.parallax) || .25;
      el.style.transform = `translate3d(0,${((r.top + r.height / 2 - vh / 2) * -sp).toFixed(1)}px,0)`;
    });
    tick = false;
  };
  addEventListener("scroll", () => { if (!tick) { requestAnimationFrame(update); tick = true; } }, { passive: true });
  update();
}
function bindMouse() {
  if (reduceMotion || !matchMedia("(hover:hover)").matches) return;
  const hero = document.querySelector(".hero");
  const floats = document.querySelectorAll(".hero-img");
  hero.addEventListener("mousemove", e => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    floats.forEach(el => {
      const d = parseFloat(el.dataset.depth) || .4;
      el.style.marginLeft = `${(-x * d * 60).toFixed(1)}px`;
      el.style.marginTop = `${(-y * d * 40).toFixed(1)}px`;
    });
  });
  document.querySelectorAll("[data-tilt]").forEach(el => {
    el.addEventListener("mousemove", ev => {
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(1000px) rotateX(${(-y * 6).toFixed(1)}deg) rotateY(${(x * 6).toFixed(1)}deg)`;
    });
    el.addEventListener("mouseleave", () => el.style.transform = "");
  });
}
function bindTilt() {
  if (reduceMotion || !matchMedia("(hover:hover)").matches) return;
  document.querySelectorAll(".card-media").forEach(el => {
    if (el._tilt) return; el._tilt = true;
    el.addEventListener("mousemove", ev => {
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .5;
      el.style.transform = `rotateX(${(-y * 7).toFixed(1)}deg) rotateY(${(x * 7).toFixed(1)}deg) scale(1.02)`;
    });
    el.addEventListener("mouseleave", () => el.style.transform = "");
  });
}

init();

/* ============ LETRAS 3D EN TÍTULOS ============ */
function startLetters() {
  document.querySelectorAll(".sec-head h2, .story-text h2, .ed-title span, .contact-title").forEach(h => {
    if (h._split) return; h._split = true;
    const text = h.textContent;
    h.textContent = "";
    let delay = 0;
    [...text].forEach(ch => {
      const s = document.createElement("span");
      if (ch === " ") { s.className = "lt space"; h.appendChild(s); return; }
      s.className = "lt"; s.textContent = ch;
      s.style.transition = `opacity .8s cubic-bezier(.19,1,.22,1) ${delay.toFixed(2)}s, transform .8s cubic-bezier(.19,1,.22,1) ${delay.toFixed(2)}s`;
      h.appendChild(s); delay += 0.045;
    });
  });
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: .3 });
  document.querySelectorAll(".lt").forEach(() => {});
  document.querySelectorAll(".sec-head h2, .story-text h2, .ed-title span, .contact-title").forEach(h => io.observe(h));
}

/* ============ CUADRÍCULA 3D QUE SIGUE EL CURSOR ============ */
function startGridTilt() {
  if (reduceMotion || !matchMedia("(hover:hover)").matches) return;
  const grid = document.querySelector(".grid"); if (!grid) return;
  const wrap = document.createElement("div"); wrap.className = "grid-wrap";
  grid.parentNode.insertBefore(wrap, grid); wrap.appendChild(grid);
  wrap.addEventListener("mousemove", e => {
    const r = wrap.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    grid.classList.add("grid-tilt");
    grid.style.setProperty("--gx", (y * -3).toFixed(2) + "deg");
    grid.style.setProperty("--gy", (x * 3).toFixed(2) + "deg");
  });
  wrap.addEventListener("mouseleave", () => grid.classList.remove("grid-tilt"));
}

/* ============ MARQUESINAS QUE REACCIONAN AL SCROLL ============ */
function startMarqueeSkew() {
  if (reduceMotion) return;
  const mq = document.querySelector(".marquee-track"); if (!mq) return;
  const box = mq.parentElement;
  let lastY = scrollY, skew = 0, tick = false;
  const update = () => {
    const dy = scrollY - lastY; lastY = scrollY;
    skew += (Math.max(Math.min(dy * .35, 10), -10) - skew) * .1;
    box.style.transform = `skewX(${skew.toFixed(2)}deg)`;
    tick = false;
    requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

/* ============ CARRUSEL 3D GIRATORIO ============ */
function buildRing() {
  const ring = $("#ring"); if (!ring || reduceMotion) return;
  const ids = ["VMF-029","VMF-006","VMF-004","VMF-020","VMF-012","VMF-016","VMF-001","VMF-008"];
  const items = ids.map(id => products.find(p => p.id === id)).filter(Boolean);
  const n = items.length; if (!n) return;
  const R = Math.round((ring.offsetWidth / 2) / Math.tan(Math.PI / n)) + 90;
  ring.innerHTML = items.map((p, i) =>
    `<div class="panel" data-detail="${p.id}" style="transform:rotateY(${i * 360 / n}deg) translateZ(${R}px)"><img src="${img(p)}" alt="${p.producto}" draggable="false"><span>${p.marca || "VMF"} · ${p.codigo || ""}</span></div>`
  ).join("");
  let angle = 0, speed = 0.12, target = 0, dragging = false, lastX = 0, vel = 0, paused = false;
  const scene = $("#scene");
  scene.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; vel = 0; scene.style.cursor = "grabbing"; });
  addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    target += dx * 0.35; vel = dx * 0.35;
  });
  addEventListener("pointerup", () => { dragging = false; scene.style.cursor = "grab"; });
  ring.addEventListener("click", e => { const d = e.target.closest("[data-detail]"); if (d && Math.abs(vel) < 2) details(d.dataset.detail); });
  const io = new IntersectionObserver(es => es.forEach(en => paused = !en.isIntersecting));
  io.observe(scene);
  (function loop() {
    if (!paused) {
      target += dragging ? 0 : speed;
      if (!dragging && Math.abs(vel) > 0.05) { target += vel; vel *= 0.95; }
      angle += (target - angle) * 0.08;
      ring.style.transform = `translateZ(-${R}px) rotateY(${angle.toFixed(2)}deg)`;
    }
    requestAnimationFrame(loop);
  })();
}

/* ============ PARTÍCULAS DORADAS ============ */
function startParticles() {
  const c = $("#particles"); if (!c || reduceMotion) return;
  const ctx = c.getContext("2d"); let W, H, parts = [];
  const resize = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
  resize(); addEventListener("resize", resize);
  for (let i = 0; i < 45; i++) parts.push({
    x: Math.random() * W, y: Math.random() * H,
    r: Math.random() * 1.6 + .4, s: Math.random() * .35 + .1,
    o: Math.random() * .5 + .15, ph: Math.random() * Math.PI * 2
  });
  (function draw() {
    ctx.clearRect(0, 0, W, H);
    const t = performance.now() / 1000;
    parts.forEach(p => {
      p.y -= p.s; if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      const tw = p.o * (0.6 + 0.4 * Math.sin(t * 2 + p.ph));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fillStyle = `rgba(255,77,141,${tw.toFixed(2)})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  })();
}

/* ============ BOTONES MAGNÉTICOS ============ */
function startMagnetic() {
  if (reduceMotion || !matchMedia("(hover:hover)").matches) return;
  document.querySelectorAll(".magnetic").forEach(el => {
    el.addEventListener("mousemove", e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .3}px)`;
    });
    el.addEventListener("mouseleave", () => el.style.transform = "");
    el.style.transition = "transform .25s ease-out, background .35s, box-shadow .35s";
  });
}

/* ============ FOCO DE LUZ ============ */
function startSpotlight() {
  if (reduceMotion) return;
  const sp = $("#spotlight");
  addEventListener("pointermove", e => {
    sp.style.setProperty("--mx", e.clientX + "px");
    sp.style.setProperty("--my", e.clientY + "px");
  }, { passive: true });
}

/* ============ CONTADORES ANIMADOS ============ */
function startCounters() {
  const els = document.querySelectorAll(".stat"); if (!els.length || reduceMotion) return;
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return; io.unobserve(en.target);
    const el = en.target, end = +el.dataset.count, suf = el.dataset.suffix || "";
    const t0 = performance.now();
    (function tick(now) {
      const k = Math.min((now - t0) / 1400, 1), ease = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * ease) + suf;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }), { threshold: .4 });
  els.forEach(el => io.observe(el));
}

/* ============ ROTACIÓN 3D DEL HERO AL DESLIZAR ============ */
function startHeroScroll() {
  if (reduceMotion) return;
  const hero = document.querySelector(".hero"), floats = document.querySelectorAll(".hero-img"), h1 = document.querySelector(".hero h1");
  let tick = false;
  const update = () => {
    const y = Math.min(scrollY, innerHeight);
    if (y > 0 && hero) {
      floats.forEach(el => { el.style.translate = `0 ${y * .25}px`; });
      if (h1) { h1.style.transform = `translateY(${y * .18}px) rotateX(${Math.min(y * .03, 9)}deg)`; h1.style.opacity = Math.max(1 - y / (innerHeight * .7), 0); }
    }
    tick = false;
  };
  addEventListener("scroll", () => { if (!tick) { requestAnimationFrame(update); tick = true; } }, { passive: true });
}

