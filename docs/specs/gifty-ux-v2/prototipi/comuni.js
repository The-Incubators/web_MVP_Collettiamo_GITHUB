/* Gifty UX v2: parti comuni dei prototipi (intestazione, barra in basso, piè di pagina, icone, stati).
   Nel codice vero sono componenti condivisi: qui sono iniettati per non ripeterli in ogni file. */
(function () {
  const P = "../../../../public"; // radice degli asset reali del sito
  window.GIFTY_PUBLIC = P;
  const q = new URLSearchParams(location.search);
  window.STATO = q;
  if (q.get("scatto")) document.body.classList.add("scatto");

  /* ---------- icone (tratto 2 px, 24×24) ---------- */
  const I = {
    cuore: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    "cuore-pieno": '<path fill="currentColor" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    casa: '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
    idee: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>',
    gruppo: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/>',
    biglietto: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
    account: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    sx: '<path d="M15 5l-7 7 7 7"/>',
    dx: '<path d="M9 5l7 7-7 7"/>',
    giu: '<path d="M6 9l6 6 6-6"/>',
    chiudi: '<path d="M6 6l12 12M18 6 6 18"/>',
    play: '<path fill="currentColor" stroke="none" d="M6 4l14 8-14 8z"/>',
    piu: '<path d="M12 5v14M5 12h14"/>',
    meno: '<path d="M5 12h14"/>',
    copia: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    whatsapp: '<path d="M4 20l1.3-4A8 8 0 1 1 8.4 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-1.5-1-2-2l1-1-1-2Z" fill="currentColor" stroke="none"/>',
    campanella: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    spunta: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    matita: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    esterno: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    regalo: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3 9h18M12 9v11"/><path d="M12 9S10 4 7.5 5.5 9 9 12 9Zm0 0s2-5 4.5-3.5S15 9 12 9Z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    calendario: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    esci: '<path d="M10 4H5v16h5"/><path d="M15 8l4 4-4 4M19 12H9"/>',
    voto: '<path d="M5 12l4 4 10-10"/>',
    torta: '<path d="M4 20h16v-8H4z"/><path d="M4 15c2 1.5 4 1.5 5.3 0 1.4 1.5 4 1.5 5.4 0 1.3 1.5 3.3 1.5 5.3 0"/><path d="M12 12V8"/><path d="M12 5.5c.8-.8.8-1.7 0-2.5-.8.8-.8 1.7 0 2.5Z"/>',
    cestino: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
    cerca: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',
    orologio: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    lucchetto: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    tocco: '<path d="M8 13V6a2 2 0 1 1 4 0v5"/><path d="M12 11V9.5a2 2 0 1 1 4 0V12"/><path d="M16 12a2 2 0 1 1 4 0v3a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L5 14a1.8 1.8 0 0 1 3-2l0 1"/>',
  };
  window.icona = (n, cls = "") =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ""}</svg>`;
  document.querySelectorAll("[data-icona]").forEach((el) => el.insertAdjacentHTML("afterbegin", icona(el.dataset.icona)));

  const sez = document.body.dataset.sezione || "";
  const chrome = document.body.dataset.chrome !== "no";
  const voci = [
    ["idee", "idee.html", "Idee regalo"],
    ["gruppo", "regalo-di-gruppo.html", "Regalo di gruppo"],
    ["biglietto", "biglietto.html", "Biglietto"],
  ];
  const cur = (k) => (k === sez ? ' aria-current="page"' : "");

  /* utente: con ?ospite=1 la pagina si vede senza accesso */
  const ospite = q.get("ospite") === "1" || document.body.dataset.ospite === "si";
  const UTENTE = { nome: "Cri Ruggeri", iniziale: "C", email: "cri@esempio.it" };
  /* menu utente: le stesse voci nella tendina (desktop), nel foglio della barra in basso (telefono) e nel piè di pagina.
     Accedi ed Esci stanno solo qui (Cri, 5 nov, righe 5–9). */
  const VOCI_ACCOUNT = [
    ["regali", "regali.html", "I miei regali", "regalo"],
    ["biglietti", "biglietti.html", "I miei biglietti", "biglietto"],
    ["mio-account", "mio-account.html", "Il mio account", "account"],
  ];
  const pag = document.body.dataset.pagina || "";
  window.menuUtente = () => ospite
    ? `<div class="menu-utente"><a class="btn btn-primario" href="#" style="color:#fff">Accedi</a></div>`
    : `<div class="menu-utente"><div class="chi"><b>${UTENTE.nome}</b><span>${UTENTE.email}</span></div>
        ${VOCI_ACCOUNT.map(([k, h, t, i]) => `<a href="${h}"${k === pag ? ' aria-current="page"' : ""}>${icona(i)}${t}</a>`).join("")}
        <span class="sep" aria-hidden="true"></span><button type="button" class="voce">${icona("esci")}Esci</button></div>`;

  if (chrome) {
    const suScena = document.body.dataset.testa === "scena" ? " su-scena" : "";
    const menuAperto = q.get("menu") === "1";
    const tondo = ospite
      ? `<button type="button" class="tondo-account ospite" aria-haspopup="true" aria-expanded="${menuAperto}" aria-controls="tendina" aria-label="Account">${icona("account")}</button>`
      : `<button type="button" class="tondo-account" aria-haspopup="true" aria-expanded="${menuAperto}" aria-controls="tendina" aria-label="Il tuo account, Cri"${cur("account")}>${UTENTE.iniziale}</button>`;
    const testa = `<header class="testa${suScena}"><div class="testa-in">
      <a class="marchio" href="home.html" aria-label="Gifty, vai alla home"><img src="${P}/logo/gifty-nastro.svg" alt="" width="40" height="28"><span>Gifty</span></a>
      <nav class="menu" aria-label="Servizi">${voci.map(([k, h, t]) => `<a href="${h}"${cur(k)}>${t}</a>`).join("")}</nav>
      <div class="testa-azioni">
        <a class="cuore-testa" href="mio-account.html#preferiti" aria-label="Preferiti, 3 regali">${icona("cuore-pieno")}<span aria-hidden="true">3</span></a>
        ${tondo}
      </div>
      <div class="tendina" id="tendina" ${menuAperto && matchMedia("(min-width: 768px)").matches ? "" : "hidden"}>${menuUtente()}</div></div></header>`;
    document.body.insertAdjacentHTML("afterbegin", testa);

    const barra = [
      ["home", "home.html", "Home", "casa"],
      ["idee", "idee.html", "Idee regalo", "idee"],
      ["gruppo", "regalo-di-gruppo.html", "Gruppo", "gruppo"],
      ["biglietto", "biglietto.html", "Biglietto", "biglietto"],
    ];
    const apriTel = menuAperto && !matchMedia("(min-width: 768px)").matches;
    document.body.insertAdjacentHTML(
      "beforeend",
      `<nav class="barra-basso" aria-label="Menu">${barra.map(([k, h, t, i]) => `<a href="${h}"${cur(k)}>${icona(i)}<span>${t}</span></a>`).join("")}<button type="button" id="apri-account" aria-haspopup="dialog" aria-expanded="${apriTel}"${cur("account")}>${icona("account")}<span>Account</span></button></nav>
       <div class="velo" id="foglio-account" ${apriTel ? "" : "hidden"}><div class="foglio" role="dialog" aria-modal="true" aria-labelledby="t-account">
         <div class="foglio-testa"><h2 id="t-account" class="t-titolo">Account</h2><button type="button" class="icona-btn" data-chiudi aria-label="Chiudi">${icona("chiudi")}</button></div>${menuUtente()}</div></div>`
    );

    if (document.body.dataset.piede !== "no") {
      const piede = `<footer class="piede"><div class="pagina piede-in">
        <div><h2>Idee regalo</h2><a href="domande.html">Trova il regalo</a><a href="catalogo.html">Catalogo</a></div>
        <div><h2>Regalo di gruppo</h2><a href="crea.html">Organizza un regalo di gruppo</a><a href="regalo-di-gruppo.html">Come funziona</a></div>
        <div><h2>Biglietto</h2><a href="biglietto-editor.html">Crea un biglietto</a><a href="biglietto-apertura.html">Biglietto di esempio</a></div>
        <div><h2>Account</h2>${VOCI_ACCOUNT.map(([, h, t]) => `<a href="${h}">${t}</a>`).join("")}</div>
        <div class="piede-marchio"><a class="marchio" href="home.html" aria-label="Gifty, vai alla home"><img src="${P}/logo/gifty-nastro.svg" alt="" width="40" height="28"><span>Gifty</span></a><a href="#">Privacy e dati</a><a href="#">Termini e condizioni</a></div>
      </div></footer>`;
      document.querySelector("main").insertAdjacentHTML("afterend", piede);
    }

    document.addEventListener("click", (e) => {
      const t = document.getElementById("tendina");
      const b = e.target.closest(".tondo-account");
      if (b) { const ap = t.hidden; t.hidden = !ap; b.setAttribute("aria-expanded", String(ap)); return; }
      if (t && !t.hidden && !e.target.closest("#tendina")) { t.hidden = true; document.querySelector(".tondo-account").setAttribute("aria-expanded", "false"); }
      const f = document.getElementById("foglio-account");
      if (e.target.closest("#apri-account")) { f.hidden = false; document.getElementById("apri-account").setAttribute("aria-expanded", "true"); }
      else if (f && !f.hidden && (e.target.closest("[data-chiudi]") || e.target === f)) { f.hidden = true; document.getElementById("apri-account").setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- link agli stati del prototipo ---------- */
  const stati = document.body.dataset.stati;
  if (stati) {
    const lista = stati.split(",").map((s) => s.split("="));
    const ora = location.search.replace(/^\?/, "").replace(/&?scatto=1/, "");
    document.body.insertAdjacentHTML(
      "beforeend",
      `<nav class="proto-stati" aria-label="Stati del prototipo">${lista
        .map(([nome, query]) => `<a href="?${query}"${(query === ora || (!ora && query === lista[0][1])) ? ' aria-current="true"' : ""}>${nome}</a>`)
        .join("")}</nav>`
    );
  }

  /* ---------- comportamenti condivisi ---------- */
  document.addEventListener("click", (e) => {
    const c = e.target.closest(".cuore");
    if (c) { c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") === "true" ? "false" : "true"); e.preventDefault(); }
    const chip = e.target.closest("[data-multi] .chip");
    if (chip) chip.setAttribute("aria-pressed", chip.getAttribute("aria-pressed") === "true" ? "false" : "true");
    const radio = e.target.closest('[role="radiogroup"] [role="radio"]');
    if (radio) {
      radio.closest('[role="radiogroup"]').querySelectorAll('[role="radio"]').forEach((r) => r.setAttribute("aria-checked", r === radio ? "true" : "false"));
      if (radio.dataset.vai) location.href = radio.dataset.vai;
    }
  });

  /* cuore nelle tessere */
  window.cuoreBtn = (pieno, nome) =>
    `<button class="cuore" type="button" aria-pressed="${pieno ? "true" : "false"}" aria-label="Salva nei preferiti: ${nome}">${icona("cuore", "vuoto-i")}${icona("cuore-pieno", "pieno-i")}</button>`;

  /* ---------- prodotti reali del catalogo (lib/dati/catalogo-amazon.json) ---------- */
  window.PRODOTTI = {
    "PRD-017": { nome: "Speaker Bluetooth retrò verde", marca: "Generico", prezzo: 19.99, foto: "PRD-017.webp" },
    "PRD-014": { nome: "Lampada a libro pieghevole", marca: "Generico", prezzo: 25.29, foto: "PRD-014.webp" },
    "PRD-058": { nome: "Nessino arancione", marca: "Artemide", prezzo: 175.49, foto: "PRD-058.webp" },
    "PRD-044": { nome: "Instax mini Evo", marca: "Fujifilm", prezzo: 189.82, foto: "PRD-044.webp" },
    "PRD-004": { nome: "Diario di viaggio in lino", marca: "Lanpn", prezzo: 18.99, foto: "PRD-004.webp" },
    "PRD-054": { nome: "Stir It Up Lux, giradischi in bambù", marca: "House of Marley", prezzo: 299.5, foto: "PRD-054.webp" },
    "PRD-094": { nome: "Alvar Aalto, vaso ondulato", marca: "Iittala", prezzo: 186.77, foto: "PRD-094.webp" },
    "PRD-015": { nome: "Lampada Saturno levitante", marca: "NLIGHTING", prezzo: 49.9, foto: "PRD-015.webp" },
    "PRD-083": { nome: "Bellhop, lampada portatile", marca: "Flos", prezzo: 195.0, foto: "PRD-083.webp" },
    "PRD-003": { nome: "Mappamondo vintage in sughero", marca: "Generico", prezzo: 29.97, foto: "PRD-003.webp" },
    "PRD-011": { nome: "Mini speaker Bluetooth A106", marca: "EWA", prezzo: 24.99, foto: "PRD-011.webp" },
    "PRD-062": { nome: "Uovo Piccolo", marca: "FontanaArte", prezzo: 199.0, foto: "PRD-062.webp" },
    "PRD-038": { nome: "Aion 40 L, zaino da viaggio", marca: "Thule", prezzo: 165.64, foto: "PRD-038.webp" },
    "PRD-090": { nome: "Kintsugi, vaso porcellana e oro", marca: "Seletti", prezzo: 233.5, foto: "PRD-090.webp" },
    "PRD-016": { nome: "Lampada cubo specchio 4D", marca: "Generico", prezzo: 49.0, foto: "PRD-016.webp" },
    "PRD-057": { nome: "Giradischi verticale Mid Century", marca: "Fuse", prezzo: 224.0, foto: "PRD-057.webp" },
  };
  window.euro = (n) => { const t = (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0).replace(".", ","); return t.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "\u00a0€"; };
  window.foto = (id) => `${P}/foto-prodotti/${PRODOTTI[id].foto}`;
  window.tessera = (id, { pieno = false, azioni = "idee" } = {}) => {
    const p = PRODOTTI[id];
    const az =
      azioni === "idee"
        ? `<a class="btn btn-primario" href="#" >Guarda su Amazon</a>
           <a class="btn btn-quieto" href="crea.html?passo=1&partenza=b&da=${id}">${icona("gruppo")}Aggiungi a un regalo di gruppo</a>`
        : azioni;
    return `<article class="tessera">
      <a class="lastra" href="prodotto.html?id=${id}" aria-label="${p.nome}"><img src="${foto(id)}" alt="" loading="lazy"></a>
      ${cuoreBtn(pieno, p.nome)}
      <a class="nome" href="prodotto.html?id=${id}">${p.nome}</a>
      <div class="riga-prezzo"><span class="prezzo">${euro(p.prezzo)}</span><span class="marca">${p.marca}</span></div>
      <div class="azioni">${az}</div>
    </article>`;
  };


  /* Come funziona: i cinque passi tutti visibili, ognuno con chi lo fa e una scena (Cri, 5 nov: il racconto a schede non era chiaro) */
  window.montaRacconto = () => {
    const PASSI = [
      { t: "Giulia apre il regalo per Mauro", s: "Decide se raccogliere prima le adesioni, scegliere lei il regalo o farne votare qualcuno.",
        scena: `<div class="carta foglietto partenze-p"><p class="mano">Il regalo per Mauro</p>
          <span class="opz on"><i></i>Prima le adesioni</span><span class="opz"><i></i>Ho scelto il regalo</span><span class="opz"><i></i>Votiamo il regalo</span></div>` },
      { t: "Manda il link nella chat", s: "Lo incolla nel gruppo WhatsApp che avete già. Chi partecipa aderisce, vede la sua quota e, se serve, vota.",
        scena: `<div class="chat"><div class="fumetto">Facciamo il regalo a Mauro? <b>gifty.it/c/mauro</b></div>
          <div class="posti" aria-label="4 persone su 10 hanno aderito">${'<span class="iniziali c1"></span><span class="iniziali c2"></span><span class="iniziali c3"></span><span class="iniziali c4"></span>' + '<span class="iniziali vuoto"></span>'.repeat(6)}</div>
          <p class="t-piccolo muted">4 su 10 hanno aderito</p></div>` },
      { t: "Tutti firmano il biglietto", s: "Ognuno scrive il suo messaggio dal link, anche con una foto.",
        scena: `<div class="carta foglietto firma"><p class="mano">Buon compleanno, Mauro!</p>
          <p class="t-piccolo">Ti aspettiamo al campetto. <span class="muted">Luca</span></p><p class="t-piccolo">Cento di questi giri in bici. <span class="muted">Sara</span></p></div>` },
      { t: "Giulia compra e consegna il regalo", s: "Lo compra lei, su Amazon o dove preferisce, e lo dà a Mauro con il biglietto.",
        scena: `<div class="foto-consegna" role="img" aria-label="Il biglietto con il pacco regalo"></div>` },
      { t: "Gli altri le rimborsano la quota", s: "Con PayPal, Satispay o bonifico. Giulia segna chi ha pagato e con un tocco ricorda la quota a chi manca.",
        scena: `<div class="mini-registro"><div><span class="iniziali c2">LU</span>Luca<span class="s ok">ricevuto</span></div>
          <div><span class="iniziali c3">SA</span>Sara<span class="s ok">ricevuto</span></div>
          <div><span class="iniziali c4">DA</span>Davide<span class="s">da ricevere</span></div></div>` },
    ];
    document.getElementById("percorso").innerHTML = PASSI.map((x, i) => `<li class="passo-p">
        <span class="n" aria-hidden="true">${i + 1}</span>
        <div class="scena-p" aria-hidden="${i === 3 ? "false" : "true"}">${x.scena}</div>
        <h3 class="t-titolo">${x.t}</h3><p>${x.s}</p></li>`).join("");
  };

  /* ---------- biglietto sulla foto: omografia rettangolo → quadrilatero ---------- */
  function risolvi(A, b) {
    const n = b.length;
    for (let i = 0; i < n; i++) {
      let m = i;
      for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;
      [A[i], A[m]] = [A[m], A[i]]; [b[i], b[m]] = [b[m], b[i]];
      for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c < n; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; }
    }
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c]; x[i] = s / A[i][i]; }
    return x;
  }
  window.posaSullaFoto = (el, quad) => {
    const img = el.parentElement.querySelector("img");
    const box = (img || el.parentElement).getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight;
    const src = [[0, 0], [w, 0], [w, h], [0, h]];
    const dst = quad.map(([x, y]) => [(x / 100) * box.width, (y / 100) * box.height]);
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    const [a, bb, c, d, e, f, g, hh] = risolvi(A, b);
    el.style.transformOrigin = "0 0";
    el.style.transform = `matrix3d(${a},${d},0,${g},${bb},${e},0,${hh},0,0,1,0,${c},${f},0,1)`;
  };
})();
