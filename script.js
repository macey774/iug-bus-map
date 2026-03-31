/**
 * BusEye - Application de suivi des bus scolaires
 * Version 5.3 - Splash screen avec image personnalisée
 * Auteur : Mabel Cédric Yvan
 */

// ======================================================================
// CONFIGURATION
// ======================================================================
const RELAY_URL = "https://bus-relais.onrender.com/api/positions";
const OSRM_URL = "https://router.project-osrm.org";

const CONFIG = {
    map: { defaultCenter: [4.040770, 9.752837], defaultZoom: 18, minZoom: 12, maxZoom: 19 },
    bus: { averageSpeedMps: 5.56, updateInterval: 2000, maxRealisticDistance: 15000 },
    geolocation: { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    walking: { speedMps: 1.4 }
};

const COLORS = { primary: '#4285F4', bus4: '#FFD700', bus8: '#34A853' };

const BUS_STOPS = {
    bus4: [
        { name: "Campus C", coords: [4.039735, 9.751857] },
        { name: "Carrefour Chefferie", coords: [4.024806, 9.769245] },
        { name: "Saint Nicolas", coords: [4.020080, 9.761518] },
        { name: "Total Danger", coords: [4.012732, 9.757205] },
        { name: "Village Ndogpassi (Station Bocom)", coords: [4.007123, 9.756094] },
        { name: "Tradex Borne 10", coords: [3.998247, 9.768313] },
        { name: "Carrefour Ari", coords: [3.995235, 9.782917] },
        { name: "Tradex Yassa", coords: [4.001153, 9.805164] },
        { name: "Entrée MAETUR Yassa", coords: [4.009370, 9.800646] },
        { name: "Total Nkolmbong", coords: [4.018734, 9.795956] },
        { name: "Carrefour Nyalla Pariso", coords: [4.024639, 9.793029] },
        { name: "Château Nyalla", coords: [4.033330, 9.786290] },
        { name: "Rails Nyalla", coords: [4.034902, 9.777759] },
        { name: "Campus C", coords: [4.039735, 9.751857] }
    ],
    bus8: [
        { name: "Village Ndogpassi (Station Bocom)", coords: [4.007123, 9.756094] },
        { name: "Total Danger", coords: [4.012732, 9.757205] },
        { name: "Saint Nicolas", coords: [4.020080, 9.761518] },
        { name: "Carrefour Chefferie", coords: [4.024806, 9.769245] },
        { name: "Campus C", coords: [4.039735, 9.751857] }
    ]
};

const BUS_TYPES = {
    bus4: { name: "BUS 4", company: "Socatur", color: COLORS.bus4 },
    bus8: { name: "BUS 8", company: "Coaster", color: COLORS.bus8 }
};

const POINTS_OF_INTEREST = {
    campuses: [
        { name: "Campus C", coords: [4.039735, 9.751857] },
        { name: "Campus A et B", coords: [4.042103, 9.753392] }
    ],
    parkings: [
        { name: "Parking bus IUG", coords: [4.040770, 9.752837] },
        { name: "Parking Campus A", coords: [4.041985, 9.754494] }
    ]
};

// ======================================================================
// ICÔNES
// ======================================================================
const Icons = {
    bus4: L.divIcon({
        className: 'custom-bus-icon',
        html: `<div class="bus-icon-container bus4"><svg width="42" height="42" viewBox="0 0 42 42"><rect x="4" y="10" width="34" height="20" rx="4" fill="#FFD700"/><circle cx="12" cy="30" r="5" fill="#333"/><circle cx="30" cy="30" r="5" fill="#333"/><rect x="8" y="6" width="26" height="4" rx="1" fill="#2C3E50"/></svg><div class="bus-label">BUS 4</div></div>`,
        iconSize: [42, 42], iconAnchor: [21, 36], popupAnchor: [0, -36]
    }),
    bus8: L.divIcon({
        className: 'custom-bus-icon',
        html: `<div class="bus-icon-container bus8"><svg width="42" height="42" viewBox="0 0 42 42"><rect x="4" y="10" width="34" height="20" rx="4" fill="#34A853"/><circle cx="12" cy="30" r="5" fill="#333"/><circle cx="30" cy="30" r="5" fill="#333"/><rect x="8" y="6" width="26" height="4" rx="1" fill="#2C3E50"/></svg><div class="bus-label">BUS 8</div></div>`,
        iconSize: [42, 42], iconAnchor: [21, 36], popupAnchor: [0, -36]
    }),
    busStop: {
        bus4: L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png", iconSize: [25, 41], iconAnchor: [12, 41] }),
        bus8: L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png", iconSize: [25, 41], iconAnchor: [12, 41] })
    }
};

// ======================================================================
// MAP SERVICE
// ======================================================================
class MapService {
    constructor() {
        this.map = L.map("map", {
            zoomControl: false,
            minZoom: CONFIG.map.minZoom,
            maxZoom: CONFIG.map.maxZoom
        }).setView(CONFIG.map.defaultCenter, CONFIG.map.defaultZoom);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(this.map);
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { opacity: 0.5 }).addTo(this.map);

        this.layers = {
            bus4: L.layerGroup().addTo(this.map),
            bus8: L.layerGroup().addTo(this.map),
            bus4Line: L.layerGroup().addTo(this.map),
            bus8Line: L.layerGroup().addTo(this.map),
            campus: L.layerGroup().addTo(this.map),
            parking: L.layerGroup().addTo(this.map)
        };
        this.routeCache = new Map();
    }

    async getRoute(coords) {
        const key = JSON.stringify(coords);
        if (this.routeCache.has(key)) return this.routeCache.get(key);
        try {
            const points = coords.map(c => `${c[1]},${c[0]}`).join(";");
            const url = `${OSRM_URL}/route/v1/driving/${points}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const data = await res.json();
            if (!data.routes?.[0]) return coords;
            const route = data.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
            this.routeCache.set(key, route);
            return route;
        } catch (e) { console.error("Erreur OSRM", e); return coords; }
    }

    validateDistance(d) { return Math.min(d, CONFIG.bus.maxRealisticDistance); }
}

// ======================================================================
// BUS MANAGER
// ======================================================================
class BusManager {
    constructor(mapService) {
        this.mapService = mapService;
        this.busMarkers = new Map();
        this.busRoutes = new Map();
        this.initRoutes();
        this.initStops();
        this.initPOI();
        this.startPolling();
    }

    async initRoutes() {
        const route4 = await this.mapService.getRoute(BUS_STOPS.bus4.map(s => s.coords));
        const line4 = L.polyline(route4, { color: COLORS.bus4, weight: 6 });
        this.mapService.layers.bus4Line.addLayer(line4);
        this.busRoutes.set('bus4', route4);

        const route8 = await this.mapService.getRoute(BUS_STOPS.bus8.map(s => s.coords));
        const line8 = L.polyline(route8, { color: COLORS.bus8, weight: 6 });
        this.mapService.layers.bus8Line.addLayer(line8);
        this.busRoutes.set('bus8', route8);
    }

    initStops() {
        BUS_STOPS.bus4.forEach(stop => {
            const marker = L.marker(stop.coords, { icon: Icons.busStop.bus4 }).addTo(this.mapService.layers.bus4);
            this.updateStopPopup(marker, stop);
        });
        BUS_STOPS.bus8.forEach(stop => {
            const marker = L.marker(stop.coords, { icon: Icons.busStop.bus8 }).addTo(this.mapService.layers.bus8);
            this.updateStopPopup(marker, stop);
        });
    }

    updateStopPopup(marker, stop) {
        const isInBus4 = BUS_STOPS.bus4.some(s => s.name === stop.name);
        const isInBus8 = BUS_STOPS.bus8.some(s => s.name === stop.name);
        const busLines = [];
        if (isInBus4) busLines.push('BUS 4');
        if (isInBus8) busLines.push('BUS 8');
        const linesText = busLines.join(' • ');
        const isFavorite = window.favoritesManager?.isFavorite(stop.name) || false;

        const popupContent = `
            <div class="stop-popup-container compact">
                <div class="stop-popup-name">${stop.name}</div>
                <div class="stop-popup-lines">${linesText}</div>
                <div class="stop-popup-actions">
                    <button class="stop-popup-btn favorite-btn ${isFavorite ? 'active' : ''}" onclick="window.busManager.toggleFavorite('${stop.name}')">
                        <span class="material-icons">${isFavorite ? 'star' : 'star_border'}</span>
                    </button>
                    <button class="stop-popup-btn route-btn" onclick="window.busManager.openRouteToStop('${stop.name}')">
                        <span class="material-icons">directions</span>
                    </button>
                </div>
            </div>
        `;
        marker.bindPopup(popupContent, { className: 'stop-popup', maxWidth: 280 });
    }

    toggleFavorite(stopName) {
        if (window.favoritesManager.isFavorite(stopName)) window.favoritesManager.remove(stopName);
        else window.favoritesManager.add(stopName);
        this.refreshOpenPopup(stopName);
    }

    refreshOpenPopup(stopName) {
        this.mapService.map.eachLayer(layer => {
            if (layer instanceof L.Marker && layer.isPopupOpen()) {
                const popup = layer.getPopup();
                if (popup && popup.getContent().includes(stopName)) {
                    const stop = this.getAllStops().find(s => s.name === stopName);
                    if (stop) this.updateStopPopup(layer, stop);
                }
            }
        });
    }

    openRouteToStop(stopName) {
        document.getElementById('endInput').value = stopName;
        document.getElementById('routeModal').style.display = 'block';
        setTimeout(() => document.getElementById('traceBtn').click(), 500);
    }

    initPOI() {
        POINTS_OF_INTEREST.campuses.forEach(c => L.marker(c.coords).addTo(this.mapService.layers.campus).bindPopup(`🎓 ${c.name}`));
        POINTS_OF_INTEREST.parkings.forEach(p => L.marker(p.coords).addTo(this.mapService.layers.parking).bindPopup(`🅿️ ${p.name}`));
    }

    getAllStops() {
        const stopsMap = new Map();
        [...BUS_STOPS.bus4, ...BUS_STOPS.bus8].forEach(stop => {
            if (stopsMap.has(stop.name)) {
                const existing = stopsMap.get(stop.name);
                existing.lines = [...new Set([...existing.lines, ...(stop.lines || [])])];
            } else {
                stopsMap.set(stop.name, { ...stop, lines: [] });
            }
        });
        return Array.from(stopsMap.values());
    }

    findClosestStop(stops, pos) {
        let closest = null, minDist = Infinity;
        stops.forEach(stop => {
            const dist = this.mapService.map.distance(pos, stop.coords);
            if (dist < minDist) { minDist = dist; closest = stop; }
        });
        return { stop: closest, distance: minDist };
    }

    findNextStop(stops, currentStop, currentPos, route) {
        if (!currentStop) return null;
        const idx = stops.findIndex(s => s.name === currentStop.name);
        const nextIdx = (idx + 1) % stops.length;
        const nextStop = stops[nextIdx];
        const dist = this.calcDistanceAlongRoute(currentPos, nextStop.coords, route);
        const time = Math.ceil((dist / CONFIG.bus.averageSpeedMps) / 60);
        return { stop: nextStop, distance: dist, timeMinutes: time };
    }

    calcDistanceAlongRoute(currentPos, nextCoords, route) {
        if (!route || route.length === 0) return this.mapService.map.distance(currentPos, nextCoords);
        let minDistCurrent = Infinity, minDistNext = Infinity, idxCurr = -1, idxNext = -1;
        route.forEach((p, i) => {
            const dCurr = this.mapService.map.distance(currentPos, p);
            const dNext = this.mapService.map.distance(nextCoords, p);
            if (dCurr < minDistCurrent) { minDistCurrent = dCurr; idxCurr = i; }
            if (dNext < minDistNext) { minDistNext = dNext; idxNext = i; }
        });
        if (idxCurr === -1 || idxNext === -1) return 0;
        let dist = 0;
        if (idxNext > idxCurr) {
            for (let i = idxCurr; i < idxNext; i++) dist += this.mapService.map.distance(route[i], route[i + 1]);
        } else {
            for (let i = idxCurr; i < route.length - 1; i++) dist += this.mapService.map.distance(route[i], route[i + 1]);
            for (let i = 0; i < idxNext; i++) dist += this.mapService.map.distance(route[i], route[i + 1]);
        }
        return this.mapService.validateDistance(dist);
    }

    createBusPopup(busInfo, currentStop, nextStopInfo, timestamp) {
        const nextText = nextStopInfo ? `${nextStopInfo.stop.name} (${nextStopInfo.timeMinutes} min)` : "Terminus";
        const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString('fr-FR') : "inconnue";
        return `
            <div class="bus-popup">
                <div class="bus-popup-header" style="background: ${busInfo.color}">
                    <span class="bus-popup-icon">🚌</span>
                    <span class="bus-popup-title">${busInfo.name}</span>
                </div>
                <div class="bus-popup-content">
                    <div>Compagnie: ${busInfo.company}</div>
                    <div>🚏 Arrêt: ${currentStop?.name || "En circulation"}</div>
                    <div>⏭️ Prochain: ${nextText}</div>
                    <div>🕒 MAJ: ${timeStr}</div>
                </div>
            </div>
        `;
    }

    startPolling() {
        const fetchPositions = async () => {
            try {
                const res = await fetch(RELAY_URL);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                for (let [id, pos] of Object.entries(data)) {
                    if (pos && typeof pos.lat === 'number' && typeof pos.lng === 'number') {
                        this.updateBusPosition(id, pos.lat, pos.lng, pos.speed, pos.timestamp);
                    }
                }
            } catch (err) {
                console.error("Erreur relais", err);
                window.notify("Erreur réseau", "Impossible de contacter le serveur de bus", "error");
            }
        };
        fetchPositions();
        setInterval(fetchPositions, CONFIG.bus.updateInterval);
    }

    updateBusPosition(busId, lat, lng, speed, timestamp) {
        const busKey = busId.toLowerCase() === 'bus_4' ? 'bus4' : 'bus8';
        const stops = busKey === 'bus4' ? BUS_STOPS.bus4 : BUS_STOPS.bus8;
        const busInfo = BUS_TYPES[busKey];
        const icon = Icons[busKey];
        const route = this.busRoutes.get(busKey);

        if (this.busMarkers.has(busId)) {
            this.animateMarker(this.busMarkers.get(busId), [lat, lng]);
            const currentStop = this.findClosestStop(stops, [lat, lng]).stop;
            const nextStopInfo = this.findNextStop(stops, currentStop, [lat, lng], route);
            this.busMarkers.get(busId).setPopupContent(this.createBusPopup(busInfo, currentStop, nextStopInfo, timestamp));
        } else {
            const marker = L.marker([lat, lng], { icon }).addTo(this.mapService.map);
            marker.bindPopup(this.createBusPopup(busInfo, null, null, timestamp));
            marker.on('click', () => marker.openPopup());
            this.busMarkers.set(busId, marker);
        }
    }

    animateMarker(marker, newPos) {
        const start = marker.getLatLng();
        const startTime = performance.now();
        const duration = 1000;
        const animate = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / duration);
            const lat = start.lat + (newPos[0] - start.lat) * t;
            const lng = start.lng + (newPos[1] - start.lng) * t;
            marker.setLatLng([lat, lng]);
            if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}

// ======================================================================
// GEOLOCATION MANAGER
// ======================================================================
class GeolocationManager {
    constructor(mapService) {
        this.mapService = mapService;
        this.userMarker = null;
        this.userCoords = null;
        this.watchId = null;
        this.followMode = false;
        this.init();
    }

    init() {
        document.getElementById('locateBtn').addEventListener('click', () => this.centerOnUser());
        document.getElementById('followBtn').addEventListener('click', () => this.toggleFollow());
        document.getElementById('nearestStopBtn').addEventListener('click', () => this.findNearestStop());
        this.startTracking();
    }

    startTracking() {
        if (!navigator.geolocation) return window.notify("Géolocalisation non supportée", "", "error");
        this.watchId = navigator.geolocation.watchPosition(
            pos => this.onPositionUpdate(pos),
            err => this.onPositionError(err),
            CONFIG.geolocation
        );
    }

    onPositionUpdate(pos) {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        this.userCoords = L.latLng(lat, lng);

        if (!this.userMarker) {
            // Création du marqueur utilisateur avec un effet de vague pulsante
            const customIcon = L.divIcon({
                className: 'user-marker',
                html: `
                    <div class="pulse-ring"></div>
                    <div class="core"></div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                popupAnchor: [0, -12]
            });
            this.userMarker = L.marker([lat, lng], { icon: customIcon }).addTo(this.mapService.map);
            this.userMarker.bindPopup(`<div>📍 Ma position</div>`);
        } else {
            this.userMarker.setLatLng([lat, lng]);
        }

        if (this.followMode) {
            this.mapService.map.setView([lat, lng], this.mapService.map.getZoom(), { animate: true });
        }
    }

    onPositionError(err) {
        let msg = "Impossible d'obtenir votre position.";
        if (err.code === 1) msg = "Accès refusé.";
        else if (err.code === 2) msg = "Position indisponible.";
        else if (err.code === 3) msg = "Délai dépassé.";
        window.notify("Erreur géolocalisation", msg, "error");
    }

    centerOnUser() {
        if (this.userCoords) {
            this.mapService.map.setView(this.userCoords, 19, { animate: true });
            this.userMarker.openPopup();
        } else {
            window.notify("Position non disponible", "Activez la géolocalisation", "warning");
        }
    }

    toggleFollow() {
        this.followMode = !this.followMode;
        const btn = document.getElementById('followBtn');
        if (this.followMode) {
            btn.classList.add('active');
            window.notify("Suivi activé", "La carte suivra votre position", "success");
            if (this.userCoords) this.mapService.map.setView(this.userCoords, this.mapService.map.getZoom());
        } else {
            btn.classList.remove('active');
            window.notify("Suivi désactivé", "", "info");
        }
    }

    findNearestStop() {
        if (!this.userCoords) return window.notify("Position inconnue", "Cliquez d'abord sur 'Ma position'", "warning");
        const allStops = window.busManager.getAllStops();
        let nearest = null, minDist = Infinity;
        allStops.forEach(stop => {
            const dist = this.mapService.map.distance(this.userCoords, stop.coords);
            if (dist < minDist) { minDist = dist; nearest = stop; }
        });
        if (nearest) {
            this.mapService.map.setView(nearest.coords, 17, { animate: true });
            L.popup().setLatLng(nearest.coords).setContent(`<b>${nearest.name}</b><br>Distance: ${Math.round(minDist)} m`).openOn(this.mapService.map);
        } else window.notify("Aucun arrêt trouvé", "", "error");
    }

    getCurrentCoords() { return this.userCoords; }
}

// ======================================================================
// ROUTE MANAGER
// ======================================================================
class RouteManager {
    constructor(mapService, geolocationManager) {
        this.mapService = mapService;
        this.geolocationManager = geolocationManager;
        this.routeLine = null;
        this.init();
    }

    init() {
        document.getElementById('routeBtn').addEventListener('click', () => document.getElementById('routeModal').style.display = 'block');
        document.getElementById('closeRouteModal').addEventListener('click', () => document.getElementById('routeModal').style.display = 'none');
        document.getElementById('traceBtn').addEventListener('click', () => this.calculateRoute());
        document.getElementById('clearRouteBtn').addEventListener('click', () => this.clearRoute());
        this.setupEndInputSuggestions();
    }

    setupEndInputSuggestions() {
        const input = document.getElementById('endInput');
        const suggestionsDiv = document.getElementById('endSuggestions');
        input.addEventListener('input', () => {
            const term = input.value.toLowerCase();
            if (term.length < 2) { suggestionsDiv.classList.remove('show'); return; }
            const stops = window.busManager.getAllStops().filter(s => s.name.toLowerCase().includes(term));
            if (stops.length === 0) return;
            suggestionsDiv.innerHTML = stops.map(stop => `
                <div class="suggestion-item" onclick="document.getElementById('endInput').value='${stop.name}'; document.getElementById('endSuggestions').classList.remove('show');">
                    <span class="material-icons">location_on</span>
                    <div class="suggestion-content">
                        <div class="suggestion-name">${stop.name}</div>
                        <div class="suggestion-line">${stop.lines.join(' • ')}</div>
                    </div>
                </div>
            `).join('');
            suggestionsDiv.classList.add('show');
        });
        document.addEventListener('click', e => { if (!input.contains(e.target)) suggestionsDiv.classList.remove('show'); });
    }

    async calculateRoute() {
        const userCoords = this.geolocationManager.getCurrentCoords();
        if (!userCoords) return window.notify("Position requise", "Activez d'abord la géolocalisation", "warning");
        const destName = document.getElementById('endInput').value.trim();
        if (!destName) return window.notify("Destination manquante", "Entrez un arrêt", "warning");
        const allStops = window.busManager.getAllStops();
        const destStop = allStops.find(s => s.name.toLowerCase().includes(destName.toLowerCase()));
        if (!destStop) return window.notify("Arrêt introuvable", "Vérifiez le nom", "error");
        const url = `${OSRM_URL}/route/v1/foot/${userCoords.lng},${userCoords.lat};${destStop.coords[1]},${destStop.coords[0]}?overview=full&geometries=geojson`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (!data.routes?.[0]) throw new Error("Aucune route");
            const route = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            this.clearRoute();
            this.routeLine = L.polyline(route, { color: COLORS.primary, weight: 6 }).addTo(this.mapService.map);
            this.mapService.map.fitBounds(this.routeLine.getBounds(), { padding: [60, 60] });
            L.popup().setLatLng(destStop.coords).setContent(`<b>${destStop.name}</b>`).openOn(this.mapService.map);
        } catch (err) {
            console.error(err);
            window.notify("Erreur itinéraire", "Impossible de calculer le trajet", "error");
        }
    }

    clearRoute() {
        if (this.routeLine) { this.mapService.map.removeLayer(this.routeLine); this.routeLine = null; }
    }
}

// ======================================================================
// FAVORITES MANAGER
// ======================================================================
class FavoritesManager {
    constructor() {
        this.storageKey = "bus_favorites";
    }
    getAll() { return JSON.parse(localStorage.getItem(this.storageKey)) || []; }
    isFavorite(name) { return this.getAll().includes(name); }
    add(name) { let favs = this.getAll(); if (!favs.includes(name)) { favs.push(name); localStorage.setItem(this.storageKey, JSON.stringify(favs)); window.dispatchEvent(new CustomEvent('favoritesUpdated')); window.notify("⭐ Favori ajouté", name, "success"); } }
    remove(name) { let favs = this.getAll(); favs = favs.filter(f => f !== name); localStorage.setItem(this.storageKey, JSON.stringify(favs)); window.dispatchEvent(new CustomEvent('favoritesUpdated')); window.notify("⭐ Favori retiré", name, "info"); }
}

// ======================================================================
// SEARCH MANAGER
// ======================================================================
class SearchManager {
    constructor(mapService, geolocationManager) {
        this.mapService = mapService;
        this.geolocationManager = geolocationManager;
        this.init();
    }

    init() {
        document.getElementById('menuToggle').addEventListener('click', () => this.openDrawer());
        document.getElementById('closeDrawer').addEventListener('click', () => this.closeDrawer());
        document.getElementById('drawerOverlay').addEventListener('click', () => this.closeDrawer());
        document.getElementById('drawerSearchInput').addEventListener('input', () => this.renderStopsList());
        document.querySelectorAll('.drawer-tab').forEach(tab => tab.addEventListener('click', () => this.switchTab(tab)));
        window.addEventListener('favoritesUpdated', () => this.renderStopsList());
        this.renderStopsList();

        // Gestion de la recherche expansible
        const searchToggle = document.getElementById('searchToggleBtn');
        const searchPanel = document.getElementById('searchPanel');
        const searchInputExp = document.getElementById('searchStop');
        const searchBtnExp = document.getElementById('searchBtnExp');
        const suggestionsListExp = document.getElementById('suggestionsList');

        const openSearchPanel = () => {
            searchPanel.classList.add('open');
            searchInputExp.focus();
            document.addEventListener('click', closeSearchOnClickOutside);
            document.addEventListener('keydown', closeSearchOnEscape);
        };

        const closeSearchPanel = () => {
            searchPanel.classList.remove('open');
            document.removeEventListener('click', closeSearchOnClickOutside);
            document.removeEventListener('keydown', closeSearchOnEscape);
        };

        const closeSearchOnClickOutside = (e) => {
            if (!searchPanel.contains(e.target) && e.target !== searchToggle) {
                closeSearchPanel();
            }
        };

        const closeSearchOnEscape = (e) => {
            if (e.key === 'Escape') {
                closeSearchPanel();
            }
        };

        searchToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (searchPanel.classList.contains('open')) {
                closeSearchPanel();
            } else {
                openSearchPanel();
            }
        });

        // Suggestions pour le panneau expansible
        searchInputExp.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            if (term.length < 2) {
                suggestionsListExp.classList.remove('show');
                return;
            }
            const stops = window.busManager.getAllStops().filter(s => s.name.toLowerCase().includes(term)).slice(0, 5);
            if (stops.length === 0) return;
            suggestionsListExp.innerHTML = stops.map(stop => `
                <div class="suggestion-item" onclick="searchManager.goToStop('${stop.name}'); document.getElementById('searchPanel').classList.remove('open');">
                    <span class="material-icons">location_on</span>
                    <div class="suggestion-content">
                        <div class="suggestion-name">${stop.name}</div>
                        <div class="suggestion-line">${stop.lines.map(l => `<span class="line-badge ${l.toLowerCase().replace(' ', '')}">${l}</span>`).join('')}</div>
                    </div>
                </div>
            `).join('');
            suggestionsListExp.classList.add('show');
        });

        // Fermer les suggestions quand on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!searchInputExp.contains(e.target) && !suggestionsListExp.contains(e.target)) {
                suggestionsListExp.classList.remove('show');
            }
        });

        searchBtnExp.addEventListener('click', () => {
            const term = searchInputExp.value;
            if (term) {
                this.searchAndGoToStop(term);
                closeSearchPanel();
            }
        });

        searchInputExp.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const term = searchInputExp.value;
                if (term) {
                    this.searchAndGoToStop(term);
                    closeSearchPanel();
                }
            }
        });
    }

    searchAndGoToStop(term) {
        const stop = window.busManager.getAllStops().find(s => s.name.toLowerCase().includes(term.toLowerCase()));
        if (stop) this.goToStop(stop.name);
        else window.notify("Arrêt introuvable", "Essayez un autre nom", "error");
    }

    goToStop(name) {
        const stop = window.busManager.getAllStops().find(s => s.name === name);
        if (stop) {
            this.mapService.map.setView(stop.coords, 18, { animate: true });
            setTimeout(() => {
                const isFav = window.favoritesManager.isFavorite(name);
                const lines = stop.lines.join(' • ');
                const popup = `<div class="stop-popup-container compact"><div class="stop-popup-name">${name}</div><div class="stop-popup-lines">${lines}</div><div class="stop-popup-actions"><button class="stop-popup-btn favorite-btn ${isFav ? 'active' : ''}" onclick="window.favoritesManager.${isFav ? 'remove' : 'add'}('${name}')"><span class="material-icons">${isFav ? 'star' : 'star_border'}</span></button><button class="stop-popup-btn route-btn" onclick="window.busManager.openRouteToStop('${name}')"><span class="material-icons">directions</span></button></div></div>`;
                L.popup().setLatLng(stop.coords).setContent(popup).openOn(this.mapService.map);
            }, 500);
            this.closeDrawer();
        }
    }

    openDrawer() { document.getElementById('stopsDrawer').classList.add('open'); document.getElementById('drawerOverlay').classList.add('active'); }
    closeDrawer() { document.getElementById('stopsDrawer').classList.remove('open'); document.getElementById('drawerOverlay').classList.remove('active'); }

    switchTab(tab) {
        document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderStopsList();
    }

    renderStopsList() {
        const activeTab = document.querySelector('.drawer-tab.active').dataset.tab;
        const searchTerm = document.getElementById('drawerSearchInput').value.toLowerCase();
        let stops = window.busManager.getAllStops();
        if (activeTab === 'bus4') stops = stops.filter(s => s.lines.includes('BUS 4'));
        if (activeTab === 'bus8') stops = stops.filter(s => s.lines.includes('BUS 8'));
        if (activeTab === 'favorites') stops = stops.filter(s => window.favoritesManager.isFavorite(s.name));
        if (searchTerm) stops = stops.filter(s => s.name.toLowerCase().includes(searchTerm));
        const container = document.getElementById('stopsList');
        if (stops.length === 0) { container.innerHTML = '<div class="empty-state"><span class="material-icons">search_off</span><p>Aucun arrêt</p></div>'; return; }
        container.innerHTML = stops.map(stop => {
            const isFav = window.favoritesManager.isFavorite(stop.name);
            const busClass = stop.lines.includes('BUS 4') ? 'bus4' : 'bus8';
            let distanceHtml = '';
            if (this.geolocationManager.userCoords) {
                const dist = Math.round(this.geolocationManager.userCoords.distanceTo(L.latLng(stop.coords)));
                distanceHtml = `<div class="stop-card-distance"><span class="material-icons">straighten</span>${dist} m</div>`;
            }
            return `
                <div class="stop-card ${busClass} ${isFav ? 'favorite' : ''}" onclick="searchManager.goToStop('${stop.name}')">
                    <div class="stop-card-header">
                        <span class="stop-card-name">${stop.name}</span>
                        <span class="stop-card-favorite" onclick="event.stopPropagation(); window.favoritesManager.isFavorite('${stop.name}') ? window.favoritesManager.remove('${stop.name}') : window.favoritesManager.add('${stop.name}')">
                            <span class="material-icons">${isFav ? 'star' : 'star_border'}</span>
                        </span>
                    </div>
                    <div class="stop-card-details">
                        <span class="stop-card-line ${busClass}">${stop.lines.join(' • ')}</span>
                        ${distanceHtml}
                    </div>
                </div>
            `;
        }).join('');
        document.getElementById('drawerStats').innerText = `${stops.length} arrêt${stops.length > 1 ? 's' : ''}`;
    }
}

// ======================================================================
// NOTIFICATION GLOBALE (TOASTS) - une seule à la fois
// ======================================================================
window.notify = (title, message, type = 'info', duration = 2000) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Supprimer la notification existante (s'il y en a une)
    const existingToast = container.querySelector('.toast');
    if (existingToast) {
        existingToast.classList.add('toast-exit');
        setTimeout(() => {
            if (existingToast.parentNode) existingToast.remove();
            // Après suppression, créer la nouvelle notification
            createToast();
        }, 300);
    } else {
        createToast();
    }

    function createToast() {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'info';
        if (type === 'success') icon = 'check_circle';
        if (type === 'error') icon = 'error';
        if (type === 'warning') icon = 'warning';
        if (type === 'info') icon = 'info';
        
        toast.innerHTML = `
            <span class="material-icons toast-icon">${icon}</span>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Fermer">✖</button>
        `;
        
        container.appendChild(toast);
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            removeToast(toast);
        });
        
        const timeout = setTimeout(() => {
            removeToast(toast);
        }, duration);
        
        function removeToast(toastElement) {
            if (!toastElement.parentNode) return;
            toastElement.classList.add('toast-exit');
            setTimeout(() => {
                if (toastElement.parentNode) toastElement.remove();
            }, 300);
            clearTimeout(timeout);
        }
    }
};

// ======================================================================
// INITIALISATION AVEC MASQUAGE DU SPLASH SCREEN
// ======================================================================
document.addEventListener('DOMContentLoaded', () => {
    const mapService = new MapService();
    window.favoritesManager = new FavoritesManager();
    window.busManager = new BusManager(mapService);
    window.geolocationManager = new GeolocationManager(mapService);
    window.routeManager = new RouteManager(mapService, window.geolocationManager);
    window.searchManager = new SearchManager(mapService, window.geolocationManager);

    // Masquer le splash screen après un délai ou dès que la carte est prête
    const splash = document.getElementById('splashScreen');
    if (splash) {
        // Attendre que les éléments essentiels soient chargés (un peu de délai pour l'animation)
        setTimeout(() => {
            splash.classList.add('hidden');
            setTimeout(() => splash.remove(), 500);
        }, 1500);
    }

    window.notify("BusEye prêt", "Suivi en temps réel", "success");
});
