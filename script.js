// Bulles d'eau qui montent dans les bandeaux
document.querySelectorAll('.hero, .page-hero, .cta-band, .contact, .diff, .faq').forEach(zone => {
  const box = document.createElement('div');
  box.className = 'bubbles';
  const n = zone.classList.contains('hero') ? 18 : 10;
  for (let i = 0; i < n; i++) {
    const b = document.createElement('span');
    const t = 10 + Math.random() * 46;
    b.className = 'bubble';
    b.style.cssText = `width:${t}px;height:${t}px;left:${Math.random() * 100}%;bottom:${-60 + Math.random() * 40}px;` +
      `animation-duration:${10 + Math.random() * 14}s;animation-delay:${-Math.random() * 20}s`;
    box.appendChild(b);
  }
  zone.prepend(box);
});

// Apparition au défilement
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }), { threshold: .05, rootMargin: '0px 0px 80px 0px' });
document.querySelectorAll('.reveal').forEach(el => {
  if (el.getBoundingClientRect().top < innerHeight) el.classList.add('on'); // déjà visible à l'écran : tout de suite
  else io.observe(el);
});
// Sécurité : si l'effet ne se déclenche pas (certains écrans/navigateurs), tout s'affiche quand même
setTimeout(() => document.querySelectorAll('.reveal').forEach(el => el.classList.add('on')), 1200);

// Menu mobile + page active
const menu = document.getElementById('menu');
document.querySelector('.burger').addEventListener('click', () => menu.classList.toggle('open'));
const page = location.pathname.split('/').pop() || 'index.html';
menu.querySelectorAll('a').forEach(a => { if (a.getAttribute('href') === page) a.classList.add('active'); });

// Communes desservies : position (lat, lng). Distance = estimation par la route depuis Varces.
const VARCES = [45.0917, 5.6806];
const COMMUNES = {
  'Varces-Allières-et-Risset': VARCES, 'Le Pont-de-Claix': [45.1236, 5.6981], 'Claix': [45.1203, 5.6731],
  'Vif': [45.0553, 5.6714], 'Saint-Paul-de-Varces': [45.0717, 5.6417], 'Seyssins': [45.1550, 5.6869],
  'Échirolles': [45.1436, 5.7194], 'Seyssinet-Pariset': [45.1789, 5.6922], 'Grenoble': [45.1885, 5.7245],
  'Eybens': [45.1478, 5.7503], 'Champagnier': [45.1131, 5.7247], 'Jarrie': [45.1131, 5.7586],
  'Fontaine': [45.1928, 5.6856], "Saint-Martin-d'Hères": [45.1672, 5.7653], 'Sassenage': [45.2050, 5.6650],
  'Meylan': [45.2092, 5.7792]
};
function trajet(nom) {
  const [a, b] = [VARCES, COMMUNES[nom]], r = Math.PI / 180;
  const d = 2 * 6371 * Math.asin(Math.sqrt(Math.sin((b[0] - a[0]) * r / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin((b[1] - a[1]) * r / 2) ** 2));
  const km = nom === 'Varces-Allières-et-Risset' ? 0 : Math.max(2, Math.round(d * 1.3)); // route ≈ 1,3 × vol d'oiseau
  return { km, min: Math.max(5, Math.round(km * 1.5 + 4)), sup: km <= 10 ? 0 : km <= 25 ? 5 : 10 };
}
const lien = page => document.getElementById('p-' + page) ? '#' + page : page + '.html'; // marche aussi dans le fichier unique
const euros = n => n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
function memoCommune(nom) { try { sessionStorage.setItem('vitrelis-commune', nom); } catch (e) {} }
function communeMemo() { try { return sessionStorage.getItem('vitrelis-commune'); } catch (e) { return null; } }
// Prévient les autres parties du site (calculateur, formulaire) qu'une commune a été choisie
function choisirCommune(nom) {
  memoCommune(nom);
  const sel = document.getElementById('simVille');
  if (sel && sel.value !== nom) { sel.value = nom; sel.dispatchEvent(new Event('change')); }
  const ville = document.querySelector('#devis input[name="ville"]');
  if (ville) ville.value = nom;
}

// Carte satellite (page Zone d'intervention) — point sur Varces
const blocCarte = document.getElementById('carte');
if (blocCarte) {
  if (window.L) {
    const varces = VARCES;
    const carte = L.map(blocCarte, { scrollWheelZoom: false, zoomControl: true }).setView(varces, 11);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18, attribution: 'Imagerie © Esri, Maxar, Earthstar Geographics'
    }).addTo(carte);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18, opacity: .9
    }).addTo(carte);
    const zone25 = L.circle(varces, { radius: 25000, color: '#a9cbea', weight: 2, dashArray: '8 8', fillColor: '#a9cbea', fillOpacity: .12 }).addTo(carte);
    L.circle(varces, { radius: 10000, color: '#4f86c6', weight: 3, fillColor: '#4f86c6', fillOpacity: .22 }).addTo(carte);
    L.marker(varces, { icon: L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }) })
      .addTo(carte)
      .bindTooltip('Vitrelis · Varces', { permanent: true, direction: 'top', offset: [0, -14], className: 'etiquette' });
    carte.fitBounds(zone25.getBounds(), { padding: [10, 10] });
    window.carteVitrelis = { carte, zone25 };
  } else {
    blocCarte.innerHTML = '<div class="hors-ligne">📍 Vitrelis est basé à Varces.<br>La carte s\'affiche avec une connexion internet.</div>';
  }
}

// Clic sur une commune : distance, temps, coût du déplacement + tracé sur la carte
const boiteTrajet = document.getElementById('trajet');
if (boiteTrajet) {
  let calque = null;
  const montrer = (nom, bouton) => {
    document.querySelectorAll('.towns span').forEach(s => s.classList.toggle('sel', s === bouton));
    const t = trajet(nom), base = 57;
    const dep = t.sup ? '+' + t.sup + ' €' : 'Inclus';
    boiteTrajet.innerHTML = `
      <h3>📍 ${nom}</h3>
      <div class="trajet-chiffres">
        <div><b>${t.km ? '≈ ' + t.km + ' km' : 'Sur place'}</b><span>depuis Varces</span></div>
        <div><b>≈ ${t.min} min</b><span>de trajet</span></div>
        <div><b>${dep}</b><span>déplacement</span></div>
      </div>
      <p class="trajet-exemple">Exemple : 6 fenêtres + 1 baie vitrée = 57 €${t.sup ? ' + ' + t.sup + ' € de déplacement' : ', déplacement inclus'} → <strong>${euros(base + t.sup)}</strong></p>
      <div class="actions">
        <a class="btn btn-primary" href="${lien('tarifs')}">Calculer mon prix</a>
        <a class="btn btn-ghost" href="${lien('contact')}">Devis pour ${nom}</a>
      </div>`;
    choisirCommune(nom);
    if (window.carteVitrelis) {
      const { carte } = carteVitrelis, pos = COMMUNES[nom];
      if (calque) carte.removeLayer(calque);
      calque = L.layerGroup([
        L.polyline([VARCES, pos], { color: '#fff', weight: 3, dashArray: '6 8' }),
        L.circleMarker(pos, { radius: 9, color: '#fff', weight: 3, fillColor: '#4f86c6', fillOpacity: 1 })
          .bindTooltip(nom + (t.km ? ' · ≈ ' + t.km + ' km' : ''), { permanent: true, direction: 'right', offset: [10, 0], className: 'etiquette' })
      ]).addTo(carte);
      if (t.km) carte.flyToBounds(L.latLngBounds([VARCES, pos]).pad(.6), { duration: .8 });
    }
  };
  document.querySelectorAll('.towns span').forEach(s => {
    s.setAttribute('role', 'button'); s.tabIndex = 0;
    s.addEventListener('click', () => montrer(s.textContent, s));
    s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); montrer(s.textContent, s); } });
  });
}

// Simulateur de prix (page Tarifs)
if (document.getElementById('simNet')) {
  const prix = { f: 7, b: 15, v: 20 }, qte = { f: 6, b: 1, v: 0 };
  const sel = document.getElementById('simVille');
  sel.innerHTML = '<option value="">Choisir…</option>' + Object.keys(COMMUNES).map(n => `<option>${n}</option>`).join('') + '<option value="autre">Autre commune</option>';
  const memo = communeMemo(); if (memo && COMMUNES[memo]) sel.value = memo;
  const calc = () => {
    let total = Math.max(qte.f * prix.f + qte.b * prix.b + qte.v * prix.v, 30), txt = 'déplacement inclus';
    if (COMMUNES[sel.value]) {
      const t = trajet(sel.value); total += t.sup;
      txt = t.sup ? `dont ${t.sup} € de déplacement (≈ ${t.km} km)` : 'déplacement inclus';
    } else if (sel.value === 'autre') txt = 'déplacement selon la distance (devis)';
    document.getElementById('simNet').textContent = euros(total);
    document.getElementById('simDep').textContent = txt;
  };
  sel.addEventListener('change', () => { if (COMMUNES[sel.value]) memoCommune(sel.value); calc(); });
  document.querySelectorAll('.stepper').forEach(s => {
    const k = s.dataset.k, out = s.querySelector('output'), [moins, plus] = s.querySelectorAll('button');
    moins.onclick = () => { qte[k] = Math.max(0, qte[k] - 1); out.textContent = qte[k]; calc(); };
    plus.onclick = () => { qte[k] = Math.min(50, qte[k] + 1); out.textContent = qte[k]; calc(); };
  });
  calc();
}

// Formulaire de devis (page Contact) : envoi direct à vitrelis.pro@gmail.com (service Web3Forms),
// sans ouvrir la messagerie du visiteur.
const devis = document.getElementById('devis');
if (devis) {
  const memoVille = communeMemo();
  if (memoVille && !devis.ville.value) devis.ville.value = memoVille; // commune choisie sur la page Zone
  devis.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(devis);
    const bouton = devis.querySelector('button[type="submit"]');
    const ok = document.getElementById('formOk'), err = document.getElementById('formErr');
    ok.style.display = err.style.display = 'none';
    bouton.disabled = true; bouton.textContent = 'Envoi en cours…';
    const stop = new AbortController();
    const minuteur = setTimeout(() => stop.abort(), 12000); // on n'attend pas plus de 12 secondes
    try {
      const rep = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        signal: stop.signal,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: '5b1432f2-e42d-43bb-9c6c-3a4c122c5631', // clé publique liée à la boîte Vitrelis
          subject: 'Nouvelle demande de devis Vitrelis',
          from_name: 'Site Vitrelis',
          email: f.get('email'), // sert aussi d'adresse de réponse
          'Nom': f.get('nom'),
          'Téléphone': f.get('tel'),
          'Vous êtes': f.get('type'),
          'Commune': f.get('ville'),
          'Besoin': f.get('message')
        })
      });
      const data = await rep.json().catch(() => ({}));
      if (!rep.ok || data.success !== true) throw new Error(data.message || rep.status);
      ok.style.display = 'block';
      devis.reset();
    } catch (x) {
      err.style.display = 'block';
    }
    clearTimeout(minuteur);
    bouton.disabled = false; bouton.textContent = 'Envoyer ma demande';
  });
}
