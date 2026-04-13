/**
 * BusEye · script.js (version améliorée)
 * - Dark mode
 * - Service Worker externe
 * - Sécurité admin simplifiée (démo)
 * - Notifications push améliorées
 * - Découplage des popups via événements
 */

"use strict";

// ══════════════════════════════════════════════════════════════════
// CONFIGURATION CENTRALE
// ══════════════════════════════════════════════════════════════════
const CONFIG = {
  map: {
    center: [4.04077, 9.752837],
    zoom: 15,
    minZoom: 12,
    maxZoom: 19
  },
  bus: {
    speedMps: 5.5, // ~20 km/h
    updateInterval: 3000,
    maxDistance: 12000
  },
  geo: {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000
  },
  simulation: {
    enabled: true,
    stepInterval: 3000,
    stepSize: 3
  }
};

const COLORS = {
  primary: "#1a73e8",
  bus4: "#f9ab00",
  bus8: "#1e8e3e",
  route: "#1a73e8"
};

// ══════════════════════════════════════════════════════════════════
// DONNÉES : ARRÊTS & BUS
// ══════════════════════════════════════════════════════════════════
const BUS_STOPS = {
  bus4: [
    { name: "Campus C", coords: [4.039735, 9.751857] },
    { name: "Carrefour Chefferie", coords: [4.024806, 9.769245] },
    { name: "Saint Nicolas", coords: [4.02008, 9.761518] },
    { name: "Total Danger", coords: [4.012732, 9.757205] },
    { name: "Village Ndogpassi (Station Bocom)", coords: [4.007123, 9.756094] },
    { name: "Tradex Borne 10", coords: [3.998247, 9.768313] },
    { name: "Carrefour Ari", coords: [3.995235, 9.782917] },
    { name: "Tradex Yassa", coords: [4.001153, 9.805164] },
    { name: "Entrée MAETUR Yassa", coords: [4.00937, 9.800646] },
    { name: "Total Nkolmbong", coords: [4.018734, 9.795956] },
    { name: "Carrefour Nyalla Pariso", coords: [4.024639, 9.793029] },
    { name: "Château Nyalla", coords: [4.03333, 9.78629] },
    { name: "Rails Nyalla", coords: [4.034902, 9.777759] },
    { name: "Campus C", coords: [4.039735, 9.751857] }
  ],
  bus8: [
    { name: "Village Ndogpassi (Station Bocom)", coords: [4.007123, 9.756094] },
    { name: "Total Danger", coords: [4.012732, 9.757205] },
    { name: "Saint Nicolas", coords: [4.02008, 9.761518] },
    { name: "Carrefour Chefferie", coords: [4.024806, 9.769245] },
    { name: "Campus C", coords: [4.039735, 9.751857] }
  ]
};

const BUS_INFO = {
  bus4: {
    id: "bus4",
    label: "BUS 4",
    company: "Socatur",
    color: COLORS.bus4,
    textColor: "#5f4300"
  },
  bus8: {
    id: "bus8",
    label: "BUS 8",
    company: "Coaster",
    color: COLORS.bus8,
    textColor: "#ffffff"
  }
};

const POI = {
  campuses: [
    { name: "Campus C", coords: [4.039735, 9.751857] },
    { name: "Campus A & B", coords: [4.042103, 9.753392] }
  ],
  parkings: [
    { name: "Parking Bus IUG", coords: [4.04077, 9.752837] },
    { name: "Parking Campus A", coords: [4.041985, 9.754494] }
  ]
};

// ══════════════════════════════════════════════════════════════════
// UTILITAIRES
// ══════════════════════════════════════════════════════════════════
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function haversine([lat1, lng1], [lat2, lng2]) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDistance(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function fmtDuration(sec) {
  if (sec < 60) return `< 1 min`;
  const min = Math.round(sec / 60);
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

// ══════════════════════════════════════════════════════════════════
// NOTIFICATIONS (Toast)
// ══════════════════════════════════════════════════════════════════
const Toast = (() => {
  const container = $("#toastContainer");
  const ICONS = {
    success: "check_circle",
    error: "error",
    warning: "warning",
    info: "info"
  };

  function show(title, message = "", type = "info", duration = 4000) {
    const existing = container.querySelector(".toast");
    if (existing) dismiss(existing, true);

    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.setAttribute("role", "alert");
    el.innerHTML = `
      <span class="material-icons-round toast__icon">${ICONS[type] || "info"}</span>
      <div class="toast__body">
        <div class="toast__title">${title}</div>
        ${message ? `<div class="toast__msg">${message}</div>` : ""}
      </div>
      <button class="toast__close" aria-label="Fermer">
        <span class="material-icons-round">close</span>
      </button>
    `;

    container.appendChild(el);
    el.querySelector(".toast__close").addEventListener("click", () => dismiss(el));
    const timer = setTimeout(() => dismiss(el), duration);
    el._timer = timer;
  }

  function dismiss(el, immediate = false) {
    clearTimeout(el._timer);
    if (immediate) {
      el.remove();
      return;
    }
    el.classList.add("toast--exit");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }

  return { show };
})();

// ══════════════════════════════════════════════════════════════════
// FAVORIS
// ══════════════════════════════════════════════════════════════════
const Favorites = (() => {
  const KEY = "buseye_favorites";

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  }

  function has(name) {
    return getAll().includes(name);
  }

  function toggle(name) {
    const favs = getAll();
    const idx = favs.indexOf(name);
    if (idx === -1) {
      favs.push(name);
      Toast.show("Favori ajouté", name, "success");
    } else {
      favs.splice(idx, 1);
      Toast.show("Favori retiré", name, "info");
    }
    localStorage.setItem(KEY, JSON.stringify(favs));
    window.dispatchEvent(new CustomEvent("favoritesChanged"));
    return idx === -1;
  }

  return { getAll, has, toggle };
})();

// ══════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS (amélioré)
// ══════════════════════════════════════════════════════════════════
const PushManager = (() => {
  let permission = 'default';
  let badge = 0;
  let swRegistration = null;

  async function init() {
    if (!('Notification' in window)) return false;
    if ('serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.ready;
    }
    permission = Notification.permission;
    return permission === 'granted';
  }

  async function request() {
    if (!('Notification' in window)) return false;
    permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  function push(title, body, icon = '🚌') {
    badge++;
    _updateBadge();
    if (permission === 'granted' && document.hidden && swRegistration) {
      swRegistration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'buseye',
        renotify: true
      });
    } else {
      Toast.show(title, body, 'info');
    }
  }

  function _updateBadge() {
    const el = $("#notifBadge");
    if (!el) return;
    el.textContent = badge > 9 ? "9+" : badge;
    el.hidden = badge === 0;
  }

  function clearBadge() {
    badge = 0;
    _updateBadge();
  }

  return { init, request, push, clearBadge };
})();

// ══════════════════════════════════════════════════════════════════
// SERVICE WORKER (fichier externe)
// ══════════════════════════════════════════════════════════════════
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('SW enregistré', reg);
        PushManager.init();
      })
      .catch(err => console.warn('Échec SW', err));
  }
}

// ══════════════════════════════════════════════════════════════════
// DARK MODE MANAGER
// ══════════════════════════════════════════════════════════════════
const DarkMode = (() => {
  const TOGGLE_BTN = '#darkModeToggle';
  const STORAGE_KEY = 'theme';
  const root = document.documentElement;

  function init() {
    const btn = $(TOGGLE_BTN);
    if (!btn) return;
    updateIcon();
    btn.addEventListener('click', toggle);
  }

  function toggle() {
    const isDark = root.classList.toggle('dark-mode');
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    updateIcon();
  }

  function updateIcon() {
    const btn = $(TOGGLE_BTN);
    if (!btn) return;
    const icon = btn.querySelector('.material-icons-round');
    icon.textContent = root.classList.contains('dark-mode') ? 'light_mode' : 'dark_mode';
  }

  return { init };
})();

// ══════════════════════════════════════════════════════════════════
// MAP SERVICE
// ══════════════════════════════════════════════════════════════════
class MapService {
  constructor() {
    this.map = L.map("map", {
      zoomControl: true,
      minZoom: CONFIG.map.minZoom,
      maxZoom: CONFIG.map.maxZoom
    }).setView(CONFIG.map.center, CONFIG.map.zoom);

    this._setupLayers();
    this._routeCache = new Map();
  }

  _setupLayers() {
    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    });

    const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "© Esri",
      opacity: 0.85
    });

    osm.addTo(this.map);

    this.layers = {
      bus4Stops: L.layerGroup().addTo(this.map),
      bus8Stops: L.layerGroup().addTo(this.map),
      bus4Route: L.layerGroup().addTo(this.map),
      bus8Route: L.layerGroup().addTo(this.map),
      campus: L.layerGroup().addTo(this.map),
      parking: L.layerGroup().addTo(this.map)
    };

    L.control.layers(
      { "🗺️ Standard": osm, "🛰️ Satellite": sat },
      {
        "🟡 Ligne BUS 4": this.layers.bus4Route,
        "🟢 Ligne BUS 8": this.layers.bus8Route,
        "🛑 Arrêts BUS 4": this.layers.bus4Stops,
        "🛑 Arrêts BUS 8": this.layers.bus8Stops,
        "🎓 Campus": this.layers.campus,
        "🅿️ Parkings": this.layers.parking
      },
      { collapsed: true }
    ).addTo(this.map);
  }

  async fetchRoute(coords) {
    const key = coords.map(c => c.join(',')).join('|');
    if (this._routeCache.has(key)) return this._routeCache.get(key);

    try {
      const pts = coords.map(c => `${c[1]},${c[0]}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${pts}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.routes?.[0]) throw new Error('Aucun itinéraire');
      const route = data.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
      this._routeCache.set(key, route);
      return route;
    } catch (err) {
      console.warn('OSRM failed, using straight line', err);
      Toast.show('Calcul d\'itinéraire dégradé', 'Trajet approximatif utilisé', 'warning');
      return coords;
    }
  }

  distance(a, b) {
    return haversine(a, b);
  }
}

// ══════════════════════════════════════════════════════════════════
// STOP MANAGER
// ══════════════════════════════════════════════════════════════════
class StopManager {
  constructor(mapService) {
    this.map = mapService;
    this._stopMarkers = [];
    this._allStops = null;
    this._init();
  }

  _init() {
    BUS_STOPS.bus4.forEach(s => this._addStopMarker(s, "bus4"));
    BUS_STOPS.bus8.forEach(s => this._addStopMarker(s, "bus8"));

    POI.campuses.forEach(p =>
      L.marker(p.coords)
        .bindPopup(`<b>🎓 ${p.name}</b>`)
        .addTo(this.map.layers.campus)
    );

    POI.parkings.forEach(p =>
      L.marker(p.coords)
        .bindPopup(`<b>🅿️ ${p.name}</b>`)
        .addTo(this.map.layers.parking)
    );
  }

  _addStopMarker(stop, busId) {
    const info = BUS_INFO[busId];
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:12px;height:12px;background:${info.color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    const layer = busId === "bus4" ? this.map.layers.bus4Stops : this.map.layers.bus8Stops;
    const marker = L.marker(stop.coords, { icon }).addTo(layer);
    marker.on("click", () => this._showStopPopup(marker, stop));
    this._stopMarkers.push({ marker, stop, busId });
  }

  _showStopPopup(marker, stop) {
    const lines = this._getLinesForStop(stop.name);
    const isFav = Favorites.has(stop.name);
    const badges = lines.map(l => `<span class="badge badge--${l.toLowerCase().replace(' ', '')}">${l}</span>`).join('');

    const container = document.createElement('div');
    container.className = 'stop-popup';
    container.innerHTML = `
      <div class="stop-popup__header">
        <div class="stop-popup__name">${stop.name}</div>
        <div class="stop-popup__lines">${badges}</div>
      </div>
      <div class="stop-popup__body">
        <button class="stop-popup__btn stop-popup__btn--fav ${isFav ? 'is-active' : ''}" data-action="fav" data-stop="${stop.name}">
          <span class="material-icons-round" style="font-size:16px">${isFav ? 'star' : 'star_border'}</span>
          <span>${isFav ? 'Retiré' : 'Favori'}</span>
        </button>
        <button class="stop-popup__btn stop-popup__btn--route" data-action="route" data-stop="${stop.name}">
          <span class="material-icons-round" style="font-size:16px">directions</span>
          Itinéraire
        </button>
        <button class="stop-popup__btn" data-action="eta" data-stop="${stop.name}">
          <span class="material-icons-round" style="font-size:16px">schedule</span>
          Horaires
        </button>
      </div>
    `;

    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const stopName = btn.dataset.stop;
        switch (action) {
          case 'fav':
            const added = Favorites.toggle(stopName);
            const icon = btn.querySelector('.material-icons-round');
            const span = btn.querySelector('span:last-child');
            icon.textContent = added ? 'star' : 'star_border';
            span.textContent = added ? ' Retiré' : ' Favori';
            btn.classList.toggle('is-active', added);
            break;
          case 'route':
            window._routeManager.openModal();
            $('#endInput').value = stopName;
            this.map.map.closePopup();
            break;
          case 'eta':
            showEtaPanel(stopName);
            this.map.map.closePopup();
            break;
        }
      });
    });

    L.popup({ maxWidth: 260 })
      .setLatLng(stop.coords)
      .setContent(container)
      .openOn(this.map.map);
  }

  _getLinesForStop(name) {
    const lines = [];
    if (BUS_STOPS.bus4.some(s => s.name === name)) lines.push("BUS 4");
    if (BUS_STOPS.bus8.some(s => s.name === name)) lines.push("BUS 8");
    return lines;
  }

  getAllStops() {
    if (this._allStops) return this._allStops;
    const map = new Map();
    [...BUS_STOPS.bus4, ...BUS_STOPS.bus8].forEach(s => {
      if (!map.has(s.name)) {
        map.set(s.name, { ...s, lines: this._getLinesForStop(s.name) });
      }
    });
    this._allStops = [...map.values()];
    return this._allStops;
  }

  getNearestStop(pos) {
    let nearest = null, minDist = Infinity;
    this.getAllStops().forEach(s => {
      const d = haversine(pos, s.coords);
      if (d < minDist) {
        minDist = d;
        nearest = s;
      }
    });
    return { stop: nearest, distance: minDist };
  }
}

// ══════════════════════════════════════════════════════════════════
// BUS MANAGER
// ══════════════════════════════════════════════════════════════════
class BusManager {
  constructor(mapService) {
    this.map = mapService;
    this._markers = new Map();
    this._routes = new Map();
    this._simState = new Map();
    this._simTimers = new Map();
    this._busData = new Map();
    this._relayUrl = localStorage.getItem("buseye_relay") || "";
    this._simEnabled = true;

    this._buildRoutes();
  }

  async _buildRoutes() {
    for (const [busId, stops] of Object.entries(BUS_STOPS)) {
      const coords = stops.map(s => s.coords);
      const route = await this.map.fetchRoute(coords);
      const layer = busId === "bus4" ? this.map.layers.bus4Route : this.map.layers.bus8Route;
      const info = BUS_INFO[busId];

      L.polyline(route, {
        color: info.color,
        weight: 5,
        opacity: 0.85,
        dashArray: null
      }).addTo(layer);

      this._routes.set(busId, route);

      if (this._simEnabled) {
        this._startSimulation(busId, route);
      }
    }
  }

  _startSimulation(busId, route) {
    if (!route || route.length === 0) return;
    this._simState.set(busId, { stepIndex: 0 });

    const tick = () => {
      const state = this._simState.get(busId);
      const total = route.length;
      state.stepIndex = (state.stepIndex + CONFIG.simulation.stepSize) % total;
      const [lat, lng] = route[state.stepIndex];
      const speed = 4 + Math.random() * 4;
      this._updateBusPosition(busId, lat, lng, speed, Date.now());
    };

    tick();
    const timer = setInterval(tick, CONFIG.simulation.stepInterval);
    this._simTimers.set(busId, timer);
  }

  stopSimulation(busId) {
    clearInterval(this._simTimers.get(busId));
    this._simTimers.delete(busId);
  }

  restartSimulation() {
    this._simTimers.forEach((_, id) => this.stopSimulation(id));
    for (const [busId, route] of this._routes.entries()) {
      this._startSimulation(busId, route);
    }
  }

  async fetchPositions() {
    if (!this._relayUrl) return;
    try {
      const res = await fetch(this._relayUrl, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      for (const [id, pos] of Object.entries(data)) {
        if (pos?.lat && pos?.lng) {
          const busId = id.toLowerCase().includes("4") ? "bus4" : "bus8";
          this._updateBusPosition(busId, pos.lat, pos.lng, pos.speed ?? 0, pos.timestamp ?? Date.now());
        }
      }
      this._setStatus("live");
    } catch {
      this._setStatus("offline");
    }
  }

  _setStatus(state) {
    const dot = $(".status-dot");
    const label = $(".status-label");
    if (!dot || !label) return;
    dot.className = `status-dot status-dot--${state}`;
    label.textContent = { live: "En direct", offline: "Hors ligne", loading: "Connexion…" }[state] || state;
  }

  _updateBusPosition(busId, lat, lng, speed, timestamp) {
    const info = BUS_INFO[busId];
    const stops = BUS_STOPS[busId];
    const pos = [lat, lng];

    const { stop: currentStop } = this._findClosest(stops, pos);
    const nextStop = this._findNext(stops, currentStop, pos, busId);

    // Notification favoris
    const favStops = Favorites.getAll();
    const favMatch = stops.find(s => favStops.includes(s.name));
    if (favMatch) {
      const eta = this._calcEta(pos, favMatch.coords, busId);
      if (eta !== null && eta <= 5 * 60 && !this._lastFavNotif?.[busId]) {
        PushManager.push(`${info.label} arrive bientôt`, `${fmtDuration(eta)} avant ${favMatch.name}`);
        this._lastFavNotif = { ...(this._lastFavNotif || {}), [busId]: Date.now() };
      }
      if (this._lastFavNotif?.[busId] && Date.now() - this._lastFavNotif[busId] > 600000) {
        delete this._lastFavNotif[busId];
      }
    }

    this._busData.set(busId, { lat, lng, speed, timestamp, currentStop, nextStop });

    if (this._markers.has(busId)) {
      this._animateMarker(this._markers.get(busId), pos);
      this._markers.get(busId).setPopupContent(this._makePopup(busId));
    } else {
      const icon = this._makeIcon(info);
      const marker = L.marker(pos, { icon }).addTo(this.map.map);
      marker.bindPopup(this._makePopup(busId), { maxWidth: 280 });
      marker.on("click", () => marker.openPopup());
      this._markers.set(busId, marker);
    }
  }

  _makeIcon(info) {
    return L.divIcon({
      className: "",
      html: `<div class="bus-marker bus-marker--${info.id}">
               <div class="bus-marker__body">
                 <span class="material-icons-round bus-marker__icon">directions_bus</span>
                 ${info.label}
               </div>
             </div>`,
      iconSize: [54, 38],
      iconAnchor: [27, 44],
      popupAnchor: [0, -44]
    });
  }

  _makePopup(busId) {
    const data = this._busData.get(busId);
    const info = BUS_INFO[busId];
    if (!data) return "";

    const { currentStop, nextStop, speed, timestamp } = data;
    const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
    const speedStr = speed ? `${(speed * 3.6).toFixed(0)} km/h` : "—";

    return `<div class="bus-popup">
      <div class="bus-popup__header bus-popup__header--${busId}">
        <div class="bus-popup__header-icon"><span class="material-icons-round">directions_bus</span></div>
        <div>
          <div class="bus-popup__name">${info.label}</div>
          <div class="bus-popup__company">${info.company}</div>
        </div>
      </div>
      <div class="bus-popup__body">
        <div class="bus-popup__row">
          <span class="material-icons-round">location_on</span>
          <span class="bus-popup__label">Arrêt actuel</span>
          <span class="bus-popup__value bus-popup__value--stop">${currentStop?.name || "En circulation"}</span>
        </div>
        <div class="bus-popup__row">
          <span class="material-icons-round">navigate_next</span>
          <span class="bus-popup__label">Prochain</span>
          <span class="bus-popup__value bus-popup__value--next">${nextStop ? nextStop.stop.name : "Terminus"}</span>
        </div>
        ${nextStop ? `<div class="bus-popup__row">
          <span class="material-icons-round">schedule</span>
          <span class="bus-popup__label">ETA</span>
          <span class="bus-popup__value bus-popup__value--eta">${fmtDuration(nextStop.eta)}</span>
        </div>` : ""}
        <div class="bus-popup__row">
          <span class="material-icons-round">speed</span>
          <span class="bus-popup__label">Vitesse</span>
          <span class="bus-popup__value">${speedStr}</span>
        </div>
        <div class="bus-popup__row">
          <span class="material-icons-round">access_time</span>
          <span class="bus-popup__label">Mise à jour</span>
          <span class="bus-popup__value">${timeStr}</span>
        </div>
      </div>
    </div>`;
  }

  _animateMarker(marker, newPos, duration = 1200) {
    const start = marker.getLatLng();
    const startTime = performance.now();
    const animate = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - (1 - t) * (1 - t);
      marker.setLatLng([
        start.lat + (newPos[0] - start.lat) * ease,
        start.lng + (newPos[1] - start.lng) * ease
      ]);
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  _findClosest(stops, pos) {
    let nearest = null, minDist = Infinity;
    stops.forEach(s => {
      const d = haversine(pos, s.coords);
      if (d < minDist) {
        minDist = d;
        nearest = s;
      }
    });
    return { stop: nearest, distance: minDist };
  }

  _findNext(stops, currentStop, pos, busId) {
    if (!currentStop) return null;
    const idx = stops.findIndex(s => s.name === currentStop.name);
    const nextIdx = (idx + 1) % stops.length;
    const next = stops[nextIdx];
    const eta = this._calcEta(pos, next.coords, busId);
    return { stop: next, eta };
  }

  _calcEta(pos, destCoords, busId) {
    const route = this._routes.get(busId);
    if (!route || route.length === 0) {
      const dist = haversine(pos, destCoords);
      return dist / CONFIG.bus.speedMps;
    }

    let idxPos = 0, idxDest = 0, minPos = Infinity, minDest = Infinity;
    route.forEach((p, i) => {
      const dp = haversine(pos, p);
      const dd = haversine(destCoords, p);
      if (dp < minPos) { minPos = dp; idxPos = i; }
      if (dd < minDest) { minDest = dd; idxDest = i; }
    });

    let dist = 0;
    if (idxDest >= idxPos) {
      for (let i = idxPos; i < idxDest; i++) dist += haversine(route[i], route[i + 1]);
    } else {
      for (let i = idxPos; i < route.length - 1; i++) dist += haversine(route[i], route[i + 1]);
      for (let i = 0; i < idxDest; i++) dist += haversine(route[i], route[i + 1]);
    }

    return Math.min(dist / CONFIG.bus.speedMps, CONFIG.bus.maxDistance / CONFIG.bus.speedMps);
  }

  getEtaForStop(stopName) {
    const result = [];
    for (const [busId, data] of this._busData.entries()) {
      const stops = BUS_STOPS[busId];
      const target = stops.find(s => s.name === stopName);
      if (!target) continue;
      const eta = this._calcEta([data.lat, data.lng], target.coords, busId);
      result.push({ busId, info: BUS_INFO[busId], eta, currentStop: data.currentStop });
    }
    return result;
  }

  getBusData(busId) { return this._busData.get(busId); }
  getAllBusData() { return this._busData; }

  setRelayUrl(url) {
    this._relayUrl = url;
    localStorage.setItem("buseye_relay", url);
  }

  setSimEnabled(enabled) {
    this._simEnabled = enabled;
    if (enabled) this.restartSimulation();
    else this._simTimers.forEach((_, id) => this.stopSimulation(id));
  }
}

// ══════════════════════════════════════════════════════════════════
// GEOLOCATION MANAGER
// ══════════════════════════════════════════════════════════════════
class GeoManager {
  constructor(mapService) {
    this.map = mapService;
    this.coords = null;
    this._marker = null;
    this._watch = null;
    this._follow = false;

    this._bindButtons();
    this._startWatch();
  }

  _bindButtons() {
    $("#locateBtn").addEventListener("click", () => this.centerOnUser());
    $("#followBtn").addEventListener("click", () => this.toggleFollow());
    $("#nearestStopBtn").addEventListener("click", () => this.goToNearest());
  }

  _startWatch() {
    if (!navigator.geolocation) {
      Toast.show("Géolocalisation indisponible", "Votre navigateur ne la supporte pas", "error");
      return;
    }
    this._watch = navigator.geolocation.watchPosition(
      pos => this._onUpdate(pos),
      err => this._onError(err),
      CONFIG.geo
    );
  }

  _onUpdate(pos) {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    this.coords = [lat, lng];

    if (!this._marker) {
      const icon = L.divIcon({
        className: "user-marker",
        html: `<div class="user-marker__ring"></div><div class="user-marker__core"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      this._marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(this.map.map);
      this._marker.bindPopup("<b>📍 Ma position</b>");
    } else {
      this._marker.setLatLng([lat, lng]);
    }

    if (this._follow) {
      this.map.map.setView([lat, lng], this.map.map.getZoom(), { animate: true });
    }

    window.dispatchEvent(new CustomEvent("userMoved"));
  }

  _onError(err) {
    const msgs = { 1: "Accès à la position refusé.", 2: "Position non disponible.", 3: "Délai dépassé." };
    Toast.show("Erreur GPS", msgs[err.code] || "Erreur inconnue", "warning");
  }

  centerOnUser() {
    if (!this.coords) {
      Toast.show("Position non disponible", "Activez la géolocalisation", "warning");
      return;
    }
    this.map.map.setView(this.coords, 17, { animate: true });
    this._marker?.openPopup();
  }

  toggleFollow() {
    this._follow = !this._follow;
    const btn = $("#followBtn");
    btn.classList.toggle("is-active", this._follow);
    btn.setAttribute("aria-pressed", String(this._follow));
    Toast.show(this._follow ? "Suivi activé" : "Suivi désactivé", this._follow ? "La carte suit votre position" : "", this._follow ? "success" : "info");
    if (this._follow && this.coords) {
      this.map.map.setView(this.coords, this.map.map.getZoom(), { animate: true });
    }
  }

  goToNearest() {
    if (!this.coords) {
      Toast.show("Position inconnue", "Activez d'abord la géolocalisation", "warning");
      return;
    }
    const { stop, distance } = window._stopManager.getNearestStop(this.coords);
    if (!stop) return;
    this.map.map.setView(stop.coords, 17, { animate: true });
    L.popup()
      .setLatLng(stop.coords)
      .setContent(`<div class="stop-popup__header"><div class="stop-popup__name">${stop.name}</div><small>Distance : ${fmtDistance(distance)}</small></div>`)
      .openOn(this.map.map);
  }

  getCoords() { return this.coords; }
}

// ══════════════════════════════════════════════════════════════════
// ROUTE MANAGER
// ══════════════════════════════════════════════════════════════════
class RouteManager {
  constructor(mapService, geoManager) {
    this.map = mapService;
    this.geo = geoManager;
    this._line = null;
    this._init();
  }

  _init() {
    $("#routeModalBackdrop").addEventListener("click", () => this.closeModal());
    $("#closeRouteModal").addEventListener("click", () => this.closeModal());
    $("#traceBtn").addEventListener("click", () => this.calculate());
    $("#clearRouteBtn").addEventListener("click", () => { this.clear(); this.closeModal(); });

    const endInput = $("#endInput");
    const endSug = $("#endSuggestions");
    endInput.addEventListener("input", () => this._suggest(endInput.value, endSug));
    document.addEventListener("click", e => { if (!endInput.contains(e.target)) endSug.innerHTML = ""; });
    document.addEventListener("keydown", e => { if (e.key === "Escape") this.closeModal(); });
  }

  _suggest(term, container) {
    container.innerHTML = "";
    if (term.length < 2) return;
    const stops = window._stopManager.getAllStops()
      .filter(s => s.name.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 6);

    stops.forEach(s => {
      const iconClass = s.lines.includes("BUS 4") && s.lines.includes("BUS 8") ? "both" : s.lines.includes("BUS 4") ? "bus4" : "bus8";
      const li = document.createElement("li");
      li.className = "suggestion-item";
      li.setAttribute("role", "option");
      li.innerHTML = `
        <div class="suggestion-item__icon suggestion-item__icon--${iconClass}">
          <span class="material-icons-round">location_on</span>
        </div>
        <div class="suggestion-item__body">
          <div class="suggestion-item__name">${s.name}</div>
          <div class="suggestion-item__meta">
            ${s.lines.map(l => `<span class="badge badge--${l.toLowerCase().replace(' ', '')}">${l}</span>`).join('')}
          </div>
        </div>
      `;
      li.addEventListener("click", () => {
        $("#endInput").value = s.name;
        container.innerHTML = "";
      });
      container.appendChild(li);
    });
  }

  openModal() {
    const modal = $("#routeModal");
    modal.classList.add("is-open");
    modal.removeAttribute("aria-hidden");
    $("#endInput").focus();
  }

  closeModal() {
    const modal = $("#routeModal");
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  async calculate() {
    const userCoords = this.geo.getCoords();
    if (!userCoords) {
      Toast.show("Position requise", "Activez la géolocalisation d'abord", "warning");
      return;
    }

    const destName = $("#endInput").value.trim();
    if (!destName) {
      Toast.show("Destination manquante", "Entrez un nom d'arrêt", "warning");
      return;
    }

    const stop = window._stopManager.getAllStops().find(s => s.name.toLowerCase().includes(destName.toLowerCase()));
    if (!stop) {
      Toast.show("Arrêt introuvable", "Vérifiez le nom", "error");
      return;
    }

    Toast.show("Calcul en cours…", "", "info", 2000);

    try {
      const [uo, ul] = userCoords;
      const [do_, dl] = stop.coords;
      const url = `https://router.project-osrm.org/route/v1/foot/${ul},${uo};${dl},${do_}?overview=full&geometries=geojson&steps=false`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.routes?.[0]) throw new Error("Aucun itinéraire");

      const route = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      const distM = data.routes[0].distance;
      const durSec = data.routes[0].duration;

      this.clear();
      this._line = L.polyline(route, { color: COLORS.route, weight: 5, opacity: 0.85, dashArray: "10, 6" }).addTo(this.map.map);
      this.map.map.fitBounds(this._line.getBounds(), { padding: [60, 60] });

      const info = $("#routeInfo");
      if (info) {
        $("#routeDistance").textContent = fmtDistance(distM);
        $("#routeDuration").textContent = fmtDuration(durSec);
        info.hidden = false;
      }

      Toast.show("Itinéraire tracé", `${fmtDistance(distM)} · ${fmtDuration(durSec)}`, "success");
      this.closeModal();
    } catch (err) {
      Toast.show("Erreur itinéraire", "Impossible de calculer le trajet", "error");
      this.clear();
    }
  }

  clear() {
    if (this._line) {
      this.map.map.removeLayer(this._line);
      this._line = null;
    }
    const info = $("#routeInfo");
    if (info) info.hidden = true;
  }
}

// ══════════════════════════════════════════════════════════════════
// SEARCH & DRAWER MANAGER
// ══════════════════════════════════════════════════════════════════
class SearchManager {
  constructor(mapService, geoManager) {
    this.map = mapService;
    this.geo = geoManager;
    this._activeTab = "all";
    this._init();
  }

  _init() {
    $("#menuToggle").addEventListener("click", () => this.openDrawer());
    $("#closeDrawer").addEventListener("click", () => this.closeDrawer());
    $("#drawerOverlay").addEventListener("click", () => this.closeDrawer());
    $("#drawerSearchInput").addEventListener("input", () => this._renderList());
    $$(".drawer__tab").forEach(t => t.addEventListener("click", () => this._switchTab(t)));

    const toggle = $("#searchToggleBtn");
    const panel = $("#searchPanel");
    const input = $("#searchInput");
    const clearBtn = $("#searchClearBtn");
    const sugg = $("#searchSuggestions");

    toggle.addEventListener("click", e => {
      e.stopPropagation();
      const open = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      panel.setAttribute("aria-hidden", String(!open));
      if (open) input.focus();
    });

    input.addEventListener("input", () => {
      clearBtn.hidden = input.value.length === 0;
      this._suggest(input.value, sugg);
    });

    clearBtn.addEventListener("click", () => {
      input.value = "";
      clearBtn.hidden = true;
      sugg.innerHTML = "";
      input.focus();
    });

    document.addEventListener("click", e => {
      if (!panel.contains(e.target) && e.target !== toggle) {
        panel.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        panel.setAttribute("aria-hidden", "true");
      }
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && panel.classList.contains("is-open")) {
        panel.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    $("#notifBtn").addEventListener("click", async () => {
      const granted = await PushManager.request();
      PushManager.clearBadge();
      Toast.show(granted ? "Notifications activées" : "Notifications refusées", granted ? "Vous serez alerté à l'approche d'un bus favori" : "", granted ? "success" : "warning");
    });

    window.addEventListener("favoritesChanged", () => this._renderList());
    window.addEventListener("userMoved", () => this._renderList());

    this._renderList();
  }

  _suggest(term, container) {
    container.innerHTML = "";
    if (term.length < 2) return;
    const stops = window._stopManager.getAllStops()
      .filter(s => s.name.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 6);

    stops.forEach(s => {
      const iconClass = s.lines.includes("BUS 4") && s.lines.includes("BUS 8") ? "both" : s.lines.includes("BUS 4") ? "bus4" : "bus8";
      const li = document.createElement("li");
      li.className = "suggestion-item";
      li.setAttribute("role", "option");
      li.innerHTML = `
        <div class="suggestion-item__icon suggestion-item__icon--${iconClass}">
          <span class="material-icons-round">location_on</span>
        </div>
        <div class="suggestion-item__body">
          <div class="suggestion-item__name">${s.name}</div>
          <div class="suggestion-item__meta">
            ${s.lines.map(l => `<span class="badge badge--${l.toLowerCase().replace(' ', '')}">${l}</span>`).join('')}
          </div>
        </div>
      `;
      li.addEventListener("click", () => {
        this.goToStop(s.name);
        $("#searchPanel").classList.remove("is-open");
        $("#searchInput").value = "";
        container.innerHTML = "";
      });
      container.appendChild(li);
    });
  }

  goToStop(name) {
    const stop = window._stopManager.getAllStops().find(s => s.name === name);
    if (!stop) return;
    this.map.map.setView(stop.coords, 18, { animate: true });
    setTimeout(() => {
      const container = document.createElement('div');
      container.className = 'stop-popup';
      const isFav = Favorites.has(name);
      container.innerHTML = `
        <div class="stop-popup__header">
          <div class="stop-popup__name">${stop.name}</div>
          <div class="stop-popup__lines">
            ${stop.lines.map(l => `<span class="badge badge--${l.toLowerCase().replace(' ', '')}">${l}</span>`).join('')}
          </div>
        </div>
        <div class="stop-popup__body">
          <button class="stop-popup__btn stop-popup__btn--fav ${isFav ? 'is-active' : ''}" data-action="fav" data-stop="${name}">
            <span class="material-icons-round" style="font-size:16px">${isFav ? 'star' : 'star_border'}</span>
            <span>${isFav ? 'Retiré' : 'Favori'}</span>
          </button>
          <button class="stop-popup__btn stop-popup__btn--route" data-action="route" data-stop="${name}">
            <span class="material-icons-round" style="font-size:16px">directions</span>
            Itinéraire
          </button>
          <button class="stop-popup__btn" data-action="eta" data-stop="${name}">
            <span class="material-icons-round" style="font-size:16px">schedule</span>
            Horaires
          </button>
        </div>
      `;

      container.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          const stopName = btn.dataset.stop;
          switch (action) {
            case 'fav':
              const added = Favorites.toggle(stopName);
              const icon = btn.querySelector('.material-icons-round');
              const span = btn.querySelector('span:last-child');
              icon.textContent = added ? 'star' : 'star_border';
              span.textContent = added ? ' Retiré' : ' Favori';
              btn.classList.toggle('is-active', added);
              break;
            case 'route':
              window._routeManager.openModal();
              $('#endInput').value = stopName;
              this.map.map.closePopup();
              break;
            case 'eta':
              showEtaPanel(stopName);
              this.map.map.closePopup();
              break;
          }
        });
      });

      L.popup({ maxWidth: 260 })
        .setLatLng(stop.coords)
        .setContent(container)
        .openOn(this.map.map);
    }, 400);
    this.closeDrawer();
  }

  openDrawer() {
    $("#stopsDrawer").classList.add("is-open");
    $("#stopsDrawer").setAttribute("aria-hidden", "false");
    $("#drawerOverlay").classList.add("is-active");
    $("#menuToggle").setAttribute("aria-expanded", "true");
    this._renderList();
  }

  closeDrawer() {
    $("#stopsDrawer").classList.remove("is-open");
    $("#stopsDrawer").setAttribute("aria-hidden", "true");
    $("#drawerOverlay").classList.remove("is-active");
    $("#menuToggle").setAttribute("aria-expanded", "false");
  }

  _switchTab(tab) {
    $$(".drawer__tab").forEach(t => {
      t.classList.remove("drawer__tab--active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("drawer__tab--active");
    tab.setAttribute("aria-selected", "true");
    this._activeTab = tab.dataset.tab;
    this._renderList();
  }

  _renderList() {
    const term = $("#drawerSearchInput")?.value.toLowerCase() || "";
    const tab = this._activeTab;
    const userPos = this.geo.getCoords();
    let stops = window._stopManager.getAllStops();

    if (tab === "bus4") stops = stops.filter(s => s.lines.includes("BUS 4"));
    if (tab === "bus8") stops = stops.filter(s => s.lines.includes("BUS 8"));
    if (tab === "favorites") stops = stops.filter(s => Favorites.has(s.name));
    if (term) stops = stops.filter(s => s.name.toLowerCase().includes(term));

    if (userPos) {
      stops = stops.map(s => ({ ...s, _dist: haversine(userPos, s.coords) }))
                   .sort((a, b) => a._dist - b._dist);
    }

    const list = $("#stopsList");
    if (!list) return;

    if (stops.length === 0) {
      list.innerHTML = `<li class="empty-state"><span class="material-icons-round">search_off</span><p>Aucun arrêt trouvé</p></li>`;
      $("#drawerStats").textContent = "0 arrêt";
      return;
    }

    list.innerHTML = stops.map(s => {
      const isFav = Favorites.has(s.name);
      const iconClass = s.lines.includes("BUS 4") && s.lines.includes("BUS 8") ? "both" : s.lines.includes("BUS 4") ? "bus4" : "bus8";
      const borderClass = s.lines.includes("BUS 4") ? "bus4" : "bus8";
      const distHtml = s._dist !== undefined ? `<span class="stop-card__dist"><span class="material-icons-round">straighten</span>${fmtDistance(s._dist)}</span>` : "";

      return `<li class="stop-card stop-card--${borderClass} ${isFav ? 'stop-card--favorite' : ''}"
                  onclick="window._searchManager.goToStop('${s.name}')" role="button" tabindex="0"
                  aria-label="Aller à l'arrêt ${s.name}">
                <div class="stop-card__icon stop-card__icon--${iconClass}">
                  <span class="material-icons-round">location_on</span>
                </div>
                <div class="stop-card__body">
                  <div class="stop-card__name">${s.name}</div>
                  <div class="stop-card__meta">
                    ${s.lines.map(l => `<span class="badge badge--${l.toLowerCase().replace(' ', '')}">${l}</span>`).join('')}
                    ${distHtml}
                  </div>
                </div>
                <div class="stop-card__actions" onclick="event.stopPropagation()">
                  <button class="stop-card__action ${isFav ? 'is-active' : ''}"
                          onclick="window._stopFavToggle('${s.name}', this)"
                          aria-label="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                    <span class="material-icons-round">${isFav ? 'star' : 'star_border'}</span>
                  </button>
                </div>
              </li>`;
    }).join('');

    $("#drawerStats").textContent = `${stops.length} arrêt${stops.length > 1 ? 's' : ''}`;
  }
}

// Callback global pour favoris dans le drawer
window._stopFavToggle = (name, btn) => {
  const added = Favorites.toggle(name);
  if (btn) {
    btn.classList.toggle("is-active", added);
    const icon = btn.querySelector(".material-icons-round");
    if (icon) icon.textContent = added ? "star" : "star_border";
  }
};

// ══════════════════════════════════════════════════════════════════
// ETA PANEL
// ══════════════════════════════════════════════════════════════════
function showEtaPanel(stopName) {
  const panel = $("#etaPanel");
  if (!panel) return;

  $("#etaStopName").textContent = stopName;

  const etas = window._busManager.getEtaForStop(stopName);
  const container = $("#etaBuses");

  if (etas.length === 0) {
    container.innerHTML = '<div style="color:var(--clr-text-secondary);font-size:.85rem;text-align:center;padding:8px">Aucun bus en service actuellement</div>';
  } else {
    container.innerHTML = etas.map(e => `
      <div class="eta-row">
        <span class="eta-row__badge badge badge--${e.busId}">${e.info.label}</span>
        <span class="eta-row__stop">${e.currentStop?.name || "En circulation"}</span>
        <span class="eta-row__time">${fmtDuration(e.eta)}</span>
      </div>
    `).join('');
  }

  panel.classList.add("is-visible");
  panel.setAttribute("aria-hidden", "false");
}

// ══════════════════════════════════════════════════════════════════
// ADMIN PANEL (accès simplifié)
// ══════════════════════════════════════════════════════════════════
class AdminManager {
  constructor() {
    this._init();
  }

  _init() {
    let clicks = 0;
    $("#brandLogo").addEventListener("click", () => {
      clicks++;
      if (clicks >= 3) {
        clicks = 0;
        this.openModal();
        Toast.show("Mode administrateur", "Accès démo", "info");
      }
      setTimeout(() => clicks = 0, 600);
    });

    $("#adminModalBackdrop").addEventListener("click", () => this.closeModal());
    $("#closeAdminModal").addEventListener("click", () => this.closeModal());

    // Masquer login, afficher dashboard directement
    $("#adminLogin").hidden = true;
    $("#adminDashboard").hidden = false;

    $("#adminSaveRelay").addEventListener("click", () => {
      const url = $("#adminRelayUrl").value.trim();
      window._busManager.setRelayUrl(url);
      Toast.show("URL enregistrée", url || "(effacée)", "success");
    });

    $("#adminSimToggle").addEventListener("change", e => {
      window._busManager.setSimEnabled(e.target.checked);
      Toast.show(e.target.checked ? "Simulation activée" : "Simulation désactivée", "", "info");
    });

    $("#adminLogout").addEventListener("click", () => this.closeModal());

    this._refreshDashboard();
  }

  _refreshDashboard() {
    const stops = window._stopManager?.getAllStops() || [];
    $("#adminStopCount").textContent = stops.length;

    const busData = window._busManager?.getAllBusData();
    const list = $("#adminBusStatus");
    if (list && busData) {
      list.innerHTML = [...busData.entries()].map(([id, d]) => {
        const info = BUS_INFO[id];
        return `<div class="admin-bus-row">
          <div class="admin-bus-row__dot" style="background:${info.color}"></div>
          <div class="admin-bus-row__name">${info.label}</div>
          <div class="admin-bus-row__status">${d.currentStop?.name || "—"}</div>
        </div>`;
      }).join('');
    }

    $("#adminRelayUrl").value = localStorage.getItem("buseye_relay") || "";
    $("#adminSimToggle").checked = window._busManager?._simEnabled ?? true;
  }

  openModal() {
    const modal = $("#adminModal");
    modal.classList.add("is-open");
    modal.removeAttribute("aria-hidden");
    this._refreshDashboard();
  }

  closeModal() {
    const modal = $("#adminModal");
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }
}

// ══════════════════════════════════════════════════════════════════
// INITIALISATION
// ══════════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", async () => {
  const splash = $("#splashScreen");

  const mapService = new MapService();
  window._mapService = mapService;

  const stopManager = new StopManager(mapService);
  window._stopManager = stopManager;

  const busManager = new BusManager(mapService);
  window._busManager = busManager;

  const geoManager = new GeoManager(mapService);
  window._geoManager = geoManager;

  const routeManager = new RouteManager(mapService, geoManager);
  window._routeManager = routeManager;

  const searchManager = new SearchManager(mapService, geoManager);
  window._searchManager = searchManager;

  new AdminManager();

  DarkMode.init();

  $("#etaPanelClose")?.addEventListener("click", () => {
    const p = $("#etaPanel");
    p.classList.remove("is-visible");
    p.setAttribute("aria-hidden", "true");
  });

  setInterval(() => busManager.fetchPositions(), CONFIG.bus.updateInterval);

  registerSW();

  setTimeout(() => {
    splash?.classList.add("is-hidden");
    setTimeout(() => splash?.remove(), 500);
  }, 1600);

  Toast.show("BusEye prêt", "Suivi en temps réel · IUG", "success");
});
