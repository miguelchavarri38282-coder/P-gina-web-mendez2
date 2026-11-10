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
const fallbackImg = e => { e.target.onerror = null; e.target.src = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="#161310"/><text x="50%" y="50%" text-anchor="middle" font-family="serif" font-size="42" fill="#d8b878">VMF</text></svg>'); };

/* ---------- carga ---------- */
async function init() {
  try {
    const r = await fetch("src/data/productos.json");
    if (!r.ok) throw new Error("HTTP " + r.status);
    products = await r.json();
    if (!Array.isArray(products) || !products.length) throw new Error("Catálogo vacío");
    buildFilters(); render(); bind(); counters(); observeAll();
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
