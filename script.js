/**
 * BusEye · script.js
 * Suivi d'un bus scolaire — IUG Douala
 * Source : ThingSpeak (channel 3387395, clé 803BAR68N6ODE4Z3)
 * field1 = latitude, field2 = longitude – lecture toutes les 15 secondes
 */

'use strict';

// ══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════
const CONFIG = {
    map: {
        center: [4.040770, 9.752837],
        zoom: 15,
        minZoom: 12,
        maxZoom: 19,
    },
    thingspeak: {
        readApiKey: '803BAR68N6ODE4Z3',
        channelId: 3387395,
        updateInterval: 15000,          // 15 secondes
        fields: {
            bus_lat: 'field1',
            bus_lng: 'field2',
        }
    },
    bus: {
        speedMps: 5.5,                  // vitesse moyenne pour estimation ETA
        maxDistance: 12000,
    },
    geo: {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
    },
    admin: {
        password: 'iug2024',
    },
};

const COLORS = {
    primary: '#1a73e8',
    bus:     '#f9ab00',                // couleur unique pour le bus
    route:   '#1a73e8',
};

// ══════════════════════════════════════════════════════════════════
// DONNÉES : ARRÊTS (une seule ligne)
// ══════════════════════════════════════════════════════════════════
const BUS_STOPS = {
    bus: [                             // clé unique 'bus'
        { name: "Campus C",                           coords: [4.039735, 9.751857] },
        { name: "Carrefour Chefferie",                coords: [4.024806, 9.769245] },
        { name: "Saint Nicolas",                      coords: [4.020080, 9.761518] },
        { name: "Total Danger",                       coords: [4.012732, 9.757205] },
        { name: "Village Ndogpassi (Station Bocom)",  coords: [4.007123, 9.756094] },
        { name: "Tradex Borne 10",                    coords: [3.998247, 9.768313] },
        { name: "Carrefour Ari",                      coords: [3.995235, 9.782917] },
        { name: "Tradex Yassa",                       coords: [4.001153, 9.805164] },
        { name: "Entrée MAETUR Yassa",                coords: [4.009370, 9.800646] },
        { name: "Total Nkolmbong",                    coords: [4.018734, 9.795956] },
        { name: "Carrefour Nyalla Pariso",            coords: [4.024639, 9.793029] },
        { name: "Château Nyalla",                     coords: [4.033330, 9.786290] },
        { name: "Rails Nyalla",                       coords: [4.034902, 9.777759] },
        { name: "Campus C",                           coords: [4.039735, 9.751857] },
    ],
};

const BUS_INFO = {
    bus: { id: 'bus', label: 'BUS IUG', company: 'IUG', color: COLORS.bus, textColor: '#5f4300' },
};

const POI = {
    campuses: [
        { name: "Campus C",     coords: [4.039735, 9.751857] },
        { name: "Campus A & B", coords: [4.042103, 9.753392] },
    ],
    parkings: [
        { name: "Parking Bus IUG",  coords: [4.040770, 9.752837] },
        { name: "Parking Campus A", coords: [4.041985, 9.754494] },
    ],
};

// ══════════════════════════════════════════════════════════════════
// UTILITAIRES
// ══════════════════════════════════════════════════════════════════
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function haversine([lat1, lng1], [lat2, lng2]) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDistance(m) {
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function fmtDuration(sec) {
    if (sec < 60) return `< 1 min`;
    const min = Math.round(sec / 60);
    return min >= 60 ? `${Math.floor(min/60)} h ${min % 60} min` : `${min} min`;
}

// ══════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════
const Toast = (() => {
    const container = $('#toastContainer');
    const ICONS = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };

    function show(title, message = '', type = 'info', duration = 4000) {
        const existing = container.querySelector('.toast');
        if (existing) dismiss(existing, true);
        const el = document.createElement('div');
        el.className = `toast toast--${type}`;
        el.setAttribute('role', 'alert');
        el.innerHTML = `
            <span class="material-icons-round toast__icon">${ICONS[type] || 'info'}</span>
            <div class="toast__body">
                <div class="toast__title">${title}</div>
                ${message ? `<div class="toast__msg">${message}</div>` : ''}
            </div>
            <button class="toast__close" aria-label="Fermer">
                <span class="material-icons-round">close</span>
            </button>
        `;
        container.appendChild(el);
        el.querySelector('.toast__close').addEventListener('click', () => dismiss(el));
        const timer = setTimeout(() => dismiss(el), duration);
        el._timer = timer;
    }

    function dismiss(el, immediate = false) {
        clearTimeout(el._timer);
        if (immediate) { el.remove(); return; }
        el.classList.add('toast--exit');
        el.addEventListener('animationend', () => el.remove(), { once: true });
    }

    return { show };
})();

// ══════════════════════════════════════════════════════════════════
// FAVORIS
// ══════════════════════════════════════════════════════════════════
const Favorites = (() => {
    const KEY = 'buseye_favorites';
    function getAll() {
        try { return JSON.parse(localStorage.getItem(KEY)) || []; }
        catch { return []; }
    }
    function has(name) { return getAll().includes(name); }
    function toggle(name) {
        const favs = getAll();
        const idx = favs.indexOf(name);
        if (idx === -1) {
            favs.push(name);
            Toast.show('Favori ajouté', name, 'success');
        } else {
            favs.splice(idx, 1);
            Toast.show('Favori retiré', name, 'info');
        }
        localStorage.setItem(KEY, JSON.stringify(favs));
        window.dispatchEvent(new CustomEvent('favoritesChanged'));
        return idx === -1;
    }
    return { getAll, has, toggle };
})();

// ══════════════════════════════════════════════════════════════════
// PUSH
// ══════════════════════════════════════════════════════════════════
const PushManager = (() => {
    let permission = 'default';
    let badge = 0;
    async function request() {
        if (!('Notification' in window)) return false;
        permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    function push(title, body, icon = '🚌') {
        badge++;
        _updateBadge();
        if (permission === 'granted' && document.hidden) {
            new Notification(title, { body, icon: 'bus.png', badge: 'bus.png', tag: 'buseye' });
        } else {
            Toast.show(title, body, 'info');
        }
    }
    function _updateBadge() {
        const el = $('#notifBadge');
        if (!el) return;
        el.textContent = badge > 9 ? '9+' : badge;
        el.hidden = badge === 0;
    }
    function clearBadge() {
        badge = 0;
        _updateBadge();
    }
    return { request, push, clearBadge };
})();

// ══════════════════════════════════════════════════════════════════
// SERVICE WORKER
// ══════════════════════════════════════════════════════════════════
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/iug-bus-map/sw.js')
            .then(reg => console.log('SW enregistré', reg.scope))
            .catch(err => console.warn('SW non enregistré', err));
    }
}

// ══════════════════════════════════════════════════════════════════
// MAP SERVICE (suppression des couches bus8)
// ══════════════════════════════════════════════════════════════════
class MapService {
    constructor() {
        this.map = L.map('map', {
            zoomControl: true,
            minZoom: CONFIG.map.minZoom,
            maxZoom: CONFIG.map.maxZoom,
        }).setView(CONFIG.map.center, CONFIG.map.zoom);
        this._setupLayers();
        this._routeCache = new Map();
    }

    _setupLayers() {
        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
        });
        const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            opacity: 0.85,
        });
        osm.addTo(this.map);

        this.layers = {
            busStops:   L.layerGroup().addTo(this.map),   // unique couche d'arrêts
            busRoute:   L.layerGroup().addTo(this.map),   // unique couche de ligne
            campus:     L.layerGroup().addTo(this.map),
            parking:    L.layerGroup().addTo(this.map),
        };

        L.control.layers(
            { '🗺️ Standard': osm, '🛰️ Satellite': sat },
            {
                '🚌 Ligne du bus':   this.layers.busRoute,
                '🛑 Arrêts':         this.layers.busStops,
                '🎓 Campus':         this.layers.campus,
                '🅿️ Parkings':       this.layers.parking,
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
            const data = await res.json();
            if (!data.routes?.[0]) return coords;
            const route = data.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
            this._routeCache.set(key, route);
            return route;
        } catch {
            return coords;
        }
    }
}

// ══════════════════════════════════════════════════════════════════
// STOP MANAGER (une seule ligne, un seul bus)
// ══════════════════════════════════════════════════════════════════
class StopManager {
    constructor(mapService) {
        this.map = mapService;
        this._allStops = null;
        this._init();
    }

    _init() {
        const info = BUS_INFO.bus;
        // Ajouter les arrêts
        BUS_STOPS.bus.forEach(stop => {
            const icon = L.divIcon({
                className: '',
                html: `<div style="width:12px;height:12px;background:${info.color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
            });
            const marker = L.marker(stop.coords, { icon }).addTo(this.map.layers.busStops);
            marker.on('click', () => this._showStopPopup(marker, stop));
        });

        // POI
        POI.campuses.forEach(p => L.marker(p.coords).bindPopup(`<b>🎓 ${p.name}</b>`).addTo(this.map.layers.campus));
        POI.parkings.forEach(p => L.marker(p.coords).bindPopup(`<b>🅿️ ${p.name}</b>`).addTo(this.map.layers.parking));
    }

    _showStopPopup(marker, stop) {
        const lines = ['BUS IUG'];  // toujours cette ligne
        const isFav = Favorites.has(stop.name);
        const badges = lines.map(l => `<span class="badge badge--bus4">${l}</span>`).join(''); // on recycle le style badge--bus4

        const popup = L.popup({ className: '', maxWidth: 260 })
            .setLatLng(stop.coords)
            .setContent(`
                <div class="stop-popup">
                    <div class="stop-popup__header">
                        <div class="stop-popup__name">${stop.name}</div>
                        <div class="stop-popup__lines">${badges}</div>
                    </div>
                    <div class="stop-popup__body">
                        <button class="stop-popup__btn stop-popup__btn--fav ${isFav ? 'is-active' : ''}"
                                onclick="window._stopFavToggle('${stop.name}', this)">
                            <span class="material-icons-round" style="font-size:16px">${isFav ? 'star' : 'star_border'}</span>
                            ${isFav ? 'Retiré' : 'Favori'}
                        </button>
                        <button class="stop-popup__btn stop-popup__btn--route"
                                onclick="window._openRouteToStop('${stop.name}')">
                            <span class="material-icons-round" style="font-size:16px">directions</span>
                            Itinéraire
                        </button>
                        <button class="stop-popup__btn"
                                onclick="window._showEta('${stop.name}')">
                            <span class="material-icons-round" style="font-size:16px">schedule</span>
                            Horaires
                        </button>
                    </div>
                </div>
            `);
        popup.openOn(this.map.map);
    }

    getAllStops() {
        if (this._allStops) return this._allStops;
        this._allStops = BUS_STOPS.bus.map(s => ({ ...s, lines: ['BUS IUG'] }));
        return this._allStops;
    }

    getNearestStop(pos) {
        let nearest = null, minDist = Infinity;
        this.getAllStops().forEach(s => {
            const d = haversine(pos, s.coords);
            if (d < minDist) { minDist = d; nearest = s; }
        });
        return { stop: nearest, distance: minDist };
    }
}

// ══════════════════════════════════════════════════════════════════
// BUS MANAGER (ThingSpeak – un seul bus)
// ══════════════════════════════════════════════════════════════════
class BusManager {
    constructor(mapService) {
        this.map = mapService;
        this._marker = null;
        this._route = null;
        this._busData = null;
        this._lastFavNotif = null;
        this._status = 'loading';

        this._buildRoute();
        this._startPolling();
    }

    async _buildRoute() {
        const stops = BUS_STOPS.bus;
        const coords = stops.map(s => s.coords);
        const route = await this.map.fetchRoute(coords);
        this._route = route;

        L.polyline(route, {
            color: COLORS.bus,
            weight: 5,
            opacity: .85,
        }).addTo(this.map.layers.busRoute);
    }

    _startPolling() {
        const fetchData = async () => {
            try {
                const url = `https://api.thingspeak.com/channels/${CONFIG.thingspeak.channelId}/feeds/last.json?api_key=${CONFIG.thingspeak.readApiKey}`;
                const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (!data) return;

                const lat = parseFloat(data[CONFIG.thingspeak.fields.bus_lat]);
                const lng = parseFloat(data[CONFIG.thingspeak.fields.bus_lng]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    this._updateBusPosition(lat, lng, Date.now());
                }
                this._setStatus('live');
            } catch (err) {
                console.warn('Erreur ThingSpeak :', err);
                this._setStatus('offline');
            }
        };

        fetchData();
        this._pollTimer = setInterval(fetchData, CONFIG.thingspeak.updateInterval);
    }

    _updateBusPosition(lat, lng, timestamp) {
        const info = BUS_INFO.bus;
        const stops = BUS_STOPS.bus;
        const pos = [lat, lng];

        const { stop: currentStop } = this._findClosest(stops, pos);
        const nextStop = this._findNext(stops, currentStop, pos);

        // Notification si arrive à un arrêt favori
        const favStops = Favorites.getAll();
        const favMatch = stops.find(s => favStops.includes(s.name));
        if (favMatch) {
            const eta = this._calcEta(pos, favMatch.coords);
            if (eta !== null && eta <= 5 * 60 && !this._lastFavNotif) {
                PushManager.push(`${info.label} arrive bientôt`, `${fmtDuration(eta)} avant ${favMatch.name}`);
                this._lastFavNotif = Date.now();
            }
            if (this._lastFavNotif && Date.now() - this._lastFavNotif > 600000) {
                this._lastFavNotif = null;
            }
        }

        this._busData = { lat, lng, timestamp, currentStop, nextStop };

        if (this._marker) {
            this._animateMarker(this._marker, pos);
            this._marker.setPopupContent(this._makePopup());
        } else {
            const icon = this._makeIcon(info);
            const marker = L.marker(pos, { icon }).addTo(this.map.map);
            marker.bindPopup(this._makePopup(), { maxWidth: 280 });
            marker.on('click', () => marker.openPopup());
            this._marker = marker;
        }
    }

    _makeIcon(info) {
        return L.divIcon({
            className: '',
            html: `<div class="bus-marker bus-marker--bus4">
                       <div class="bus-marker__body">
                           <span class="material-icons-round bus-marker__icon">directions_bus</span>
                           ${info.label}
                       </div>
                   </div>`,
            iconSize: [54, 38],
            iconAnchor: [27, 44],
            popupAnchor: [0, -44],
        });
    }

    _makePopup() {
        const data = this._busData;
        const info = BUS_INFO.bus;
        if (!data) return '';

        const { currentStop, nextStop, timestamp } = data;
        const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

        return `<div class="bus-popup">
            <div class="bus-popup__header bus-popup__header--bus4">
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
                    <span class="bus-popup__value bus-popup__value--stop">${currentStop?.name || 'En circulation'}</span>
                </div>
                <div class="bus-popup__row">
                    <span class="material-icons-round">navigate_next</span>
                    <span class="bus-popup__label">Prochain</span>
                    <span class="bus-popup__value bus-popup__value--next">${nextStop ? nextStop.stop.name : 'Terminus'}</span>
                </div>
                ${nextStop ? `<div class="bus-popup__row">
                    <span class="material-icons-round">schedule</span>
                    <span class="bus-popup__label">ETA</span>
                    <span class="bus-popup__value bus-popup__value--eta">${fmtDuration(nextStop.eta)}</span>
                </div>` : ''}
                <div class="bus-popup__row">
                    <span class="material-icons-round">speed</span>
                    <span class="bus-popup__label">Vitesse</span>
                    <span class="bus-popup__value">—</span>
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
        const start     = marker.getLatLng();
        const startTime = performance.now();
        const animate   = (now) => {
            const t = Math.min(1, (now - startTime) / duration);
            const ease = t < .5 ? 2*t*t : -1+(4-2*t)*t;
            marker.setLatLng([
                start.lat + (newPos[0] - start.lat) * ease,
                start.lng + (newPos[1] - start.lng) * ease,
            ]);
            if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    _findClosest(stops, pos) {
        let nearest = null, minDist = Infinity;
        stops.forEach(s => {
            const d = haversine(pos, s.coords);
            if (d < minDist) { minDist = d; nearest = s; }
        });
        return { stop: nearest, distance: minDist };
    }

    _findNext(stops, currentStop, pos) {
        if (!currentStop) return null;
        const idx = stops.findIndex(s => s.name === currentStop.name);
        const nextIdx = (idx + 1) % stops.length;
        const next = stops[nextIdx];
        const eta = this._calcEta(pos, next.coords);
        return { stop: next, eta };
    }

    _calcEta(pos, destCoords) {
        if (!this._route || this._route.length === 0) {
            const dist = haversine(pos, destCoords);
            return dist / CONFIG.bus.speedMps;
        }
        let idxPos = 0, idxDest = 0, minPos = Infinity, minDest = Infinity;
        this._route.forEach((p, i) => {
            const dp = haversine(pos, p);
            const dd = haversine(destCoords, p);
            if (dp < minPos)  { minPos  = dp; idxPos  = i; }
            if (dd < minDest) { minDest = dd; idxDest = i; }
        });
        let dist = 0;
        if (idxDest >= idxPos) {
            for (let i = idxPos; i < idxDest; i++) dist += haversine(this._route[i], this._route[i+1]);
        } else {
            for (let i = idxPos; i < this._route.length - 1; i++) dist += haversine(this._route[i], this._route[i+1]);
            for (let i = 0; i < idxDest; i++) dist += haversine(this._route[i], this._route[i+1]);
        }
        return Math.min(dist / CONFIG.bus.speedMps, CONFIG.bus.maxDistance / CONFIG.bus.speedMps);
    }

    _setStatus(state) {
        const dot   = $('.status-dot');
        const label = $('.status-label');
        if (!dot || !label) return;
        dot.className = `status-dot status-dot--${state}`;
        label.textContent = { live: 'En direct', offline: 'Hors ligne', loading: 'Connexion…' }[state] || state;
        this._status = state;
    }

    // Méthode publique pour l'ETA vers un arrêt
    getEtaForStop(stopName) {
        if (!this._busData) return [];
        const stop = BUS_STOPS.bus.find(s => s.name === stopName);
        if (!stop) return [];
        const eta = this._calcEta([this._busData.lat, this._busData.lng], stop.coords);
        return [{ busId: 'bus', info: BUS_INFO.bus, eta, currentStop: this._busData.currentStop }];
    }

    getBusData() { return this._busData; }
}

// ══════════════════════════════════════════════════════════════════
// GEOLOCATION MANAGER (inchangé, adapté pour l'arrêt le plus proche)
// ══════════════════════════════════════════════════════════════════
class GeoManager {
    constructor(mapService) {
        this.map    = mapService;
        this.coords = null;
        this._marker = null;
        this._watch  = null;
        this._follow = false;
        this._bindButtons();
        this._startWatch();
    }
    _bindButtons() {
        $('#locateBtn').addEventListener('click', () => this.centerOnUser());
        $('#followBtn').addEventListener('click', () => this.toggleFollow());
        $('#nearestStopBtn').addEventListener('click', () => this.goToNearest());
    }
    _startWatch() {
        if (!navigator.geolocation) {
            Toast.show('Géolocalisation indisponible', '', 'error');
            return;
        }
        this._watch = navigator.geolocation.watchPosition(
            pos => this._onUpdate(pos),
            err => this._onError(err),
            CONFIG.geo,
        );
    }
    _onUpdate(pos) {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.coords = [lat, lng];
        if (!this._marker) {
            const icon = L.divIcon({
                className: 'user-marker',
                html: `<div class="user-marker__ring"></div><div class="user-marker__core"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });
            this._marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(this.map.map);
            this._marker.bindPopup('<b>📍 Ma position</b>');
        } else {
            this._marker.setLatLng([lat, lng]);
        }
        if (this._follow) {
            this.map.map.setView([lat, lng], this.map.map.getZoom(), { animate: true });
        }
        window.dispatchEvent(new CustomEvent('userMoved'));
    }
    _onError(err) {
        const msgs = { 1: 'Accès refusé.', 2: 'Position indisponible.', 3: 'Délai dépassé.' };
        Toast.show('Erreur GPS', msgs[err.code] || 'Erreur inconnue', 'warning');
    }
    centerOnUser() {
        if (!this.coords) { Toast.show('Position non disponible', '', 'warning'); return; }
        this.map.map.setView(this.coords, 17, { animate: true });
        this._marker?.openPopup();
    }
    toggleFollow() {
        this._follow = !this._follow;
        const btn = $('#followBtn');
        btn.classList.toggle('is-active', this._follow);
        btn.setAttribute('aria-pressed', String(this._follow));
        Toast.show(this._follow ? 'Suivi activé' : 'Suivi désactivé', '', this._follow ? 'success' : 'info');
        if (this._follow && this.coords) {
            this.map.map.setView(this.coords, this.map.map.getZoom(), { animate: true });
        }
    }
    goToNearest() {
        if (!this.coords) { Toast.show('Position inconnue', '', 'warning'); return; }
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
// ROUTE MANAGER (inchangé, une seule ligne)
// ══════════════════════════════════════════════════════════════════
class RouteManager {
    constructor(mapService, geoManager) {
        this.map = mapService;
        this.geo = geoManager;
        this._line = null;
        this._init();
    }
    _init() {
        $('#routeModalBackdrop').addEventListener('click', () => this.closeModal());
        $('#closeRouteModal').addEventListener('click', () => this.closeModal());
        $('#traceBtn').addEventListener('click', () => this.calculate());
        $('#clearRouteBtn').addEventListener('click', () => { this.clear(); this.closeModal(); });
        const endInput = $('#endInput');
        const endSug   = $('#endSuggestions');
        endInput.addEventListener('input', () => this._suggest(endInput.value, endSug));
        document.addEventListener('click', e => {
            if (!endInput.contains(e.target)) endSug.innerHTML = '';
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') this.closeModal(); });
    }
    _suggest(term, container) {
        container.innerHTML = '';
        if (term.length < 2) return;
        const stops = window._stopManager.getAllStops()
            .filter(s => s.name.toLowerCase().includes(term.toLowerCase()))
            .slice(0, 6);
        stops.forEach(s => {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            li.setAttribute('role', 'option');
            li.innerHTML = `
                <div class="suggestion-item__icon suggestion-item__icon--bus4">
                    <span class="material-icons-round">location_on</span>
                </div>
                <div class="suggestion-item__body">
                    <div class="suggestion-item__name">${s.name}</div>
                    <div class="suggestion-item__meta">
                        <span class="badge badge--bus4">BUS IUG</span>
                    </div>
                </div>
            `;
            li.addEventListener('click', () => {
                $('#endInput').value = s.name;
                container.innerHTML = '';
            });
            container.appendChild(li);
        });
    }
    openModal() {
        const modal = $('#routeModal');
        modal.classList.add('is-open');
        modal.removeAttribute('aria-hidden');
        $('#endInput').focus();
    }
    closeModal() {
        const modal = $('#routeModal');
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
    }
    async calculate() {
        const userCoords = this.geo.getCoords();
        if (!userCoords) { Toast.show('Position requise', '', 'warning'); return; }
        const destName = $('#endInput').value.trim();
        if (!destName) { Toast.show('Destination manquante', '', 'warning'); return; }
        const stop = window._stopManager.getAllStops()
            .find(s => s.name.toLowerCase().includes(destName.toLowerCase()));
        if (!stop) { Toast.show('Arrêt introuvable', '', 'error'); return; }
        Toast.show('Calcul en cours…', '', 'info', 2000);
        try {
            const [uo, ul] = userCoords;
            const [do_, dl] = stop.coords;
            const url = `https://router.project-osrm.org/route/v1/foot/${ul},${uo};${dl},${do_}?overview=full&geometries=geojson&steps=false`;
            const res  = await fetch(url);
            const data = await res.json();
            if (!data.routes?.[0]) throw new Error('Aucun itinéraire');
            const route    = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            const distM    = data.routes[0].distance;
            const durSec   = data.routes[0].duration;
            this.clear();
            this._line = L.polyline(route, {
                color:  COLORS.route,
                weight: 5,
                opacity: .85,
                dashArray: '10, 6',
            }).addTo(this.map.map);
            this.map.map.fitBounds(this._line.getBounds(), { padding: [60, 60] });
            const info = $('#routeInfo');
            if (info) {
                $('#routeDistance').textContent = fmtDistance(distM);
                $('#routeDuration').textContent = fmtDuration(durSec);
                info.hidden = false;
            }
            Toast.show('Itinéraire tracé', `${fmtDistance(distM)} · ${fmtDuration(durSec)}`, 'success');
            this.closeModal();
        } catch (err) {
            Toast.show('Erreur itinéraire', 'Impossible de calculer le trajet', 'error');
        }
    }
    clear() {
        if (this._line) { this.map.map.removeLayer(this._line); this._line = null; }
        const info = $('#routeInfo');
        if (info) info.hidden = true;
    }
}

// ══════════════════════════════════════════════════════════════════
// SEARCH & DRAWER MANAGER (un seul bus, suppression de l'onglet BUS 8)
// ══════════════════════════════════════════════════════════════════
class SearchManager {
    constructor(mapService, geoManager) {
        this.map = mapService;
        this.geo = geoManager;
        this._activeTab = 'all';
        this._init();
    }

    _init() {
        // Cacher l'onglet BUS 8 car il n'y a qu'un bus
        const tabBus8 = $('.drawer__tab[data-tab="bus8"]');
        if (tabBus8) tabBus8.style.display = 'none';

        $('#menuToggle').addEventListener('click', () => this.openDrawer());
        $('#closeDrawer').addEventListener('click', () => this.closeDrawer());
        $('#drawerOverlay').addEventListener('click', () => this.closeDrawer());
        $('#drawerSearchInput').addEventListener('input', () => this._renderList());
        $$('.drawer__tab').forEach(t => t.addEventListener('click', () => this._switchTab(t)));

        const toggle = $('#searchToggleBtn');
        const panel  = $('#searchPanel');
        const input  = $('#searchInput');
        const clearBtn = $('#searchClearBtn');
        const sugg   = $('#searchSuggestions');

        toggle.addEventListener('click', e => {
            e.stopPropagation();
            const open = panel.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(open));
            panel.setAttribute('aria-hidden', String(!open));
            if (open) input.focus();
        });

        input.addEventListener('input', () => {
            clearBtn.hidden = input.value.length === 0;
            this._suggest(input.value, sugg);
        });

        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.hidden = true;
            sugg.innerHTML = '';
            input.focus();
        });

        document.addEventListener('click', e => {
            if (!panel.contains(e.target) && e.target !== toggle) {
                panel.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
                panel.setAttribute('aria-hidden', 'true');
            }
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && panel.classList.contains('is-open')) {
                panel.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        $('#notifBtn').addEventListener('click', async () => {
            const granted = await PushManager.request();
            PushManager.clearBadge();
            Toast.show(granted ? 'Notifications activées' : 'Notifications refusées', '', granted ? 'success' : 'warning');
        });

        window.addEventListener('favoritesChanged', () => this._renderList());
        window.addEventListener('userMoved', () => this._renderList());

        this._renderList();
    }

    _suggest(term, container) {
        container.innerHTML = '';
        if (term.length < 2) return;
        const stops = window._stopManager.getAllStops()
            .filter(s => s.name.toLowerCase().includes(term.toLowerCase()))
            .slice(0, 6);

        stops.forEach(s => {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            li.setAttribute('role', 'option');
            li.innerHTML = `
                <div class="suggestion-item__icon suggestion-item__icon--bus4">
                    <span class="material-icons-round">location_on</span>
                </div>
                <div class="suggestion-item__body">
                    <div class="suggestion-item__name">${s.name}</div>
                    <div class="suggestion-item__meta">
                        <span class="badge badge--bus4">BUS IUG</span>
                    </div>
                </div>
            `;
            li.addEventListener('click', () => {
                this.goToStop(s.name);
                $('#searchPanel').classList.remove('is-open');
                $('#searchInput').value = '';
                container.innerHTML = '';
            });
            container.appendChild(li);
        });
    }

    goToStop(name) {
        const stop = window._stopManager.getAllStops().find(s => s.name === name);
        if (!stop) return;
        this.map.map.setView(stop.coords, 18, { animate: true });
        setTimeout(() => {
            L.popup({ maxWidth: 260 })
                .setLatLng(stop.coords)
                .setContent(`
                    <div class="stop-popup">
                        <div class="stop-popup__header">
                            <div class="stop-popup__name">${stop.name}</div>
                            <div class="stop-popup__lines">
                                <span class="badge badge--bus4">BUS IUG</span>
                            </div>
                        </div>
                        <div class="stop-popup__body">
                            <button class="stop-popup__btn stop-popup__btn--fav ${Favorites.has(name) ? 'is-active' : ''}"
                                    onclick="window._stopFavToggle('${name}', this)">
                                <span class="material-icons-round" style="font-size:16px">${Favorites.has(name) ? 'star' : 'star_border'}</span>
                                Favori
                            </button>
                            <button class="stop-popup__btn stop-popup__btn--route"
                                    onclick="window._openRouteToStop('${name}')">
                                <span class="material-icons-round" style="font-size:16px">directions</span>
                                Itinéraire
                            </button>
                            <button class="stop-popup__btn" onclick="window._showEta('${name}')">
                                <span class="material-icons-round" style="font-size:16px">schedule</span>
                                Horaires
                            </button>
                        </div>
                    </div>
                `)
                .openOn(this.map.map);
        }, 400);
        this.closeDrawer();
    }

    openDrawer() {
        $('#stopsDrawer').classList.add('is-open');
        $('#stopsDrawer').setAttribute('aria-hidden', 'false');
        $('#drawerOverlay').classList.add('is-active');
        $('#menuToggle').setAttribute('aria-expanded', 'true');
        this._renderList();
    }

    closeDrawer() {
        $('#stopsDrawer').classList.remove('is-open');
        $('#stopsDrawer').setAttribute('aria-hidden', 'true');
        $('#drawerOverlay').classList.remove('is-active');
        $('#menuToggle').setAttribute('aria-expanded', 'false');
    }

    _switchTab(tab) {
        $$('.drawer__tab').forEach(t => {
            t.classList.remove('drawer__tab--active');
            t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('drawer__tab--active');
        tab.setAttribute('aria-selected', 'true');
        this._activeTab = tab.dataset.tab;
        this._renderList();
    }

    _renderList() {
        const term    = $('#drawerSearchInput')?.value.toLowerCase() || '';
        const tab     = this._activeTab;
        const userPos = this.geo.getCoords();
        let stops = window._stopManager.getAllStops();

        if (tab === 'bus4')      stops = stops.filter(s => s.lines.includes('BUS IUG'));
        if (tab === 'bus8')      stops = [];  // ne devrait plus apparaître, onglet caché
        if (tab === 'favorites') stops = stops.filter(s => Favorites.has(s.name));
        if (term)                stops = stops.filter(s => s.name.toLowerCase().includes(term));

        if (userPos) {
            stops = stops.map(s => ({ ...s, _dist: haversine(userPos, s.coords) }))
                         .sort((a, b) => a._dist - b._dist);
        }

        const list = $('#stopsList');
        if (!list) return;

        if (stops.length === 0) {
            list.innerHTML = `<li class="empty-state"><span class="material-icons-round">search_off</span><p>Aucun arrêt trouvé</p></li>`;
            $('#drawerStats').textContent = '0 arrêt';
            return;
        }

        list.innerHTML = stops.map(s => {
            const isFav = Favorites.has(s.name);
            const distHtml = s._dist !== undefined
                ? `<span class="stop-card__dist"><span class="material-icons-round">straighten</span>${fmtDistance(s._dist)}</span>`
                : '';

            return `
                <li class="stop-card stop-card--bus4 ${isFav ? 'stop-card--favorite' : ''}"
                    onclick="window._searchManager.goToStop('${s.name}')"
                    role="button" tabindex="0" aria-label="Aller à l'arrêt ${s.name}">
                    <div class="stop-card__icon stop-card__icon--bus4">
                        <span class="material-icons-round">location_on</span>
                    </div>
                    <div class="stop-card__body">
                        <div class="stop-card__name">${s.name}</div>
                        <div class="stop-card__meta">
                            <span class="badge badge--bus4">BUS IUG</span>
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
                </li>
            `;
        }).join('');

        $('#drawerStats').textContent = `${stops.length} arrêt${stops.length > 1 ? 's' : ''}`;
    }
}

// ══════════════════════════════════════════════════════════════════
// ETA PANEL (un seul bus)
// ══════════════════════════════════════════════════════════════════
function showEtaPanel(stopName) {
    const panel = $('#etaPanel');
    if (!panel) return;

    $('#etaStopName').textContent = stopName;
    const etas = window._busManager.getEtaForStop(stopName);
    const container = $('#etaBuses');

    if (etas.length === 0) {
        container.innerHTML = '<div style="color:var(--clr-text-secondary);font-size:.85rem;text-align:center;padding:8px">Aucun bus en service</div>';
    } else {
        container.innerHTML = etas.map(e => `
            <div class="eta-row">
                <span class="eta-row__badge badge badge--bus4">${e.info.label}</span>
                <span class="eta-row__stop">${e.currentStop?.name || 'En circulation'}</span>
                <span class="eta-row__time">${fmtDuration(e.eta)}</span>
            </div>
        `).join('');
    }

    panel.classList.add('is-visible');
    panel.setAttribute('aria-hidden', 'false');
}

// ══════════════════════════════════════════════════════════════════
// ADMIN PANEL (simplifié)
// ══════════════════════════════════════════════════════════════════
class AdminManager {
    constructor() {
        this._authed = false;
        this._init();
    }
    _init() {
        let clicks = 0;
        $('#brandLogo').addEventListener('click', () => {
            clicks++;
            if (clicks >= 3) { clicks = 0; this.openModal(); }
            setTimeout(() => { clicks = 0; }, 600);
        });
        $('#adminModalBackdrop').addEventListener('click', () => this.closeModal());
        $('#closeAdminModal').addEventListener('click', () => this.closeModal());
        $('#adminLoginBtn').addEventListener('click', () => this._login());
        $('#adminPassword').addEventListener('keydown', e => { if (e.key === 'Enter') this._login(); });
        $('#adminLogout').addEventListener('click', () => {
            this._authed = false;
            $('#adminLogin').hidden = false;
            $('#adminDashboard').hidden = true;
            $('#adminPassword').value = '';
        });
    }
    _login() {
        const pw = $('#adminPassword').value;
        const err = $('#adminLoginError');
        if (pw === CONFIG.admin.password) {
            this._authed = true;
            $('#adminLogin').hidden = true;
            $('#adminDashboard').hidden = false;
            err.hidden = true;
            this._refreshDashboard();
        } else {
            err.hidden = false;
            $('#adminPassword').value = '';
            $('#adminPassword').focus();
        }
    }
    _refreshDashboard() {
        const stops = window._stopManager?.getAllStops() || [];
        $('#adminStopCount').textContent = stops.length;
        $('#adminBusCount').textContent = '1';

        const busData = window._busManager?.getBusData();
        const list = $('#adminBusStatus');
        if (list && busData) {
            list.innerHTML = `<div class="admin-bus-row">
                <div class="admin-bus-row__dot" style="background:${COLORS.bus}"></div>
                <div class="admin-bus-row__name">BUS IUG</div>
                <div class="admin-bus-row__status">${busData.currentStop?.name || '—'}</div>
            </div>`;
        }

        // Afficher les infos de connexion
        $('#adminRelayUrl').value = `${CONFIG.thingspeak.readApiKey} (canal ${CONFIG.thingspeak.channelId})`;
        $('#adminRelayUrl').disabled = true;
        $('#adminSaveRelay').disabled = true;
        $('#adminSimToggle').parentElement.style.display = 'none';
    }
    openModal() {
        const modal = $('#adminModal');
        modal.classList.add('is-open');
        modal.removeAttribute('aria-hidden');
        if (this._authed) this._refreshDashboard();
        else $('#adminPassword').focus();
    }
    closeModal() {
        const modal = $('#adminModal');
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
    }
}

// ══════════════════════════════════════════════════════════════════
// CALLBACKS GLOBAUX
// ══════════════════════════════════════════════════════════════════
window._stopFavToggle = (name, btn) => {
    const added = Favorites.toggle(name);
    if (btn) {
        btn.classList.toggle('is-active', added);
        const icon = btn.querySelector('.material-icons-round');
        if (icon) icon.textContent = added ? 'star' : 'star_border';
        const text = btn.childNodes[btn.childNodes.length - 1];
        if (text?.nodeType === 3) text.textContent = added ? ' Retiré' : ' Favori';
    }
};
window._openRouteToStop = (name) => {
    $('#endInput').value = name;
    window._routeManager.openModal();
    window._mapService.map.closePopup();
};
window._showEta = (name) => {
    showEtaPanel(name);
    window._mapService.map.closePopup();
};

// ══════════════════════════════════════════════════════════════════
// INITIALISATION
// ══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    const splash = $('#splashScreen');

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

    $('#etaPanelClose')?.addEventListener('click', () => {
        const p = $('#etaPanel');
        p.classList.remove('is-visible');
        p.setAttribute('aria-hidden', 'true');
    });

    registerSW();

    setTimeout(() => {
        splash?.classList.add('is-hidden');
        setTimeout(() => splash?.remove(), 500);
    }, 1600);

    Toast.show('BusEye prêt', '1 bus suivi via ThingSpeak · IUG', 'success');
});
