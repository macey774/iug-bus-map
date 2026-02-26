/**
 * ======================================================================
 * SYSTÈME DE SUIVI DE BUS - APPLICATION DE TRANSPORT EN COMMUN
 * Version professionnelle 3.0 - Popups unifiés version compacte
 * Auteur : Mabel Cédric Yvan
 * Description : Application de suivi en temps réel des bus avec
 *              calcul d'itinéraires, géolocalisation et interface moderne
 * 
 * Tous les popups d'arrêts utilisent le même format compact :
 * - Nom de l'arrêt
 * - Lignes de bus desservies
 * - Boutons favori (étoile) et itinéraire (direction)
 * ======================================================================
 */

// ======================================================================
// CONFIGURATION FIREBASE (activée pour le suivi réel des bus)
// ======================================================================
// AJOUT : Décommenté et initialisé
const firebaseConfig = {
  apiKey: "AIzaSyBcKo-baav4AZss0wibZFSPUonwOPeZEF8",
  authDomain: "bus-scolaire---iug.firebaseapp.com",
  databaseURL: "https://bus-scolaire---iug-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bus-scolaire---iug",
  storageBucket: "bus-scolaire---iug.firebasestorage.app",
  messagingSenderId: "527926199083",
  appId: "1:527926199083:web:c0f5057680762a33343b6e"
};
// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ======================================================================
// SECTION 1 : CONFIGURATION ET CONSTANTES GLOBALES
// ======================================================================

const CONFIG = {
    map: {
        defaultCenter: [4.040770, 9.752837],
        defaultZoom: 18,
        minZoom: 12,
        maxZoom: 18,
        zoomControl: true
    },
    bus: {
        animationSpeed: 200,
        averageSpeed: 20,
        averageSpeedMps: 5.56,
        updateInterval: 5000,
        maxRealisticDistance: 15000
    },
    geolocation: {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    },
    walking: {
        speedMps: 1.4,
        speedMpm: 84,
        comfortFactor: 1.2
    }
};

const COLORS = {
    primary: '#4285F4',
    success: '#34A853',
    warning: '#FBBC05',
    danger: '#EA4335',
    bus4: '#FFD700',
    bus8: '#34A853',
    white: '#FFFFFF',
    black: '#000000'
};

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
    bus4: {
        name: "BUS 4",
        company: "Socatur",
        type: "Standard",
        color: COLORS.bus4
    },
    bus8: {
        name: "BUS 8",
        company: "Coaster",
        type: "Express",
        color: COLORS.bus8
    }
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
// SECTION 2 : ICÔNES PERSONNALISÉES (BUS ET ARRÊTS)
// ======================================================================

const Icons = {
    bus: L.divIcon({
        className: 'custom-bus-icon',
        html: `
            <div class="bus-icon-container">
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
                    </filter>
                    <rect x="4" y="10" width="34" height="20" rx="4" fill="#4285F4" filter="url(#shadow)"/>
                    <rect x="8" y="13" width="8" height="6" rx="1" fill="#E1F5FE" stroke="white" stroke-width="0.5"/>
                    <rect x="18" y="13" width="8" height="6" rx="1" fill="#E1F5FE" stroke="white" stroke-width="0.5"/>
                    <rect x="28" y="13" width="6" height="6" rx="1" fill="#E1F5FE" stroke="white" stroke-width="0.5"/>
                    <circle cx="6" cy="18" r="2" fill="#FFD700"/>
                    <circle cx="36" cy="18" r="2" fill="#FFD700"/>
                    <circle cx="12" cy="30" r="5" fill="#333" stroke="#666" stroke-width="1.5"/>
                    <circle cx="30" cy="30" r="5" fill="#333" stroke="#666" stroke-width="1.5"/>
                    <circle cx="12" cy="30" r="2.5" fill="#AAA"/>
                    <circle cx="30" cy="30" r="2.5" fill="#AAA"/>
                    <rect x="4" y="10" width="34" height="4" fill="rgba(255,255,255,0.3)"/>
                    <rect x="8" y="6" width="26" height="4" rx="1" fill="#2C3E50"/>
                </svg>
                <div class="bus-label">BUS</div>
            </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 36],
        popupAnchor: [0, -36]
    }),

    bus4: L.divIcon({
        className: 'custom-bus-icon',
        html: `
            <div class="bus-icon-container bus4">
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <filter id="shadow4" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
                    </filter>
                    <rect x="4" y="10" width="34" height="20" rx="4" fill="#FFD700" filter="url(#shadow4)"/>
                    <rect x="8" y="13" width="8" height="6" rx="1" fill="#E1F5FE" stroke="white" stroke-width="0.5"/>
                    <rect x="18" y="13" width="8" height="6" rx="1" fill="#E1F5FE" stroke="white" stroke-width="0.5"/>
                    <rect x="28" y="13" width="6" height="6" rx="1" fill="#E1F5FE" stroke="white" stroke-width="0.5"/>
                    <circle cx="6" cy="18" r="2" fill="#FFD700"/>
                    <circle cx="36" cy="18" r="2" fill="#FFD700"/>
                    <circle cx="12" cy="30" r="5" fill="#333" stroke="#666" stroke-width="1.5"/>
                    <circle cx="30" cy="30" r="5" fill="#333" stroke="#666" stroke-width="1.5"/>
                    <circle cx="12" cy="30" r="2.5" fill="#AAA"/>
                    <circle cx="30" cy="30" r="2.5" fill="#AAA"/>
                    <rect x="4" y="10" width="34" height="4" fill="rgba(255,255,255,0.3)"/>
                    <rect x="8" y="6" width="26" height="4" rx="1" fill="#2C3E50"/>
                </svg>
                <div class="bus-label">BUS 4</div>
            </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 36],
        popupAnchor: [0, -36]
    }),

    bus8: L.divIcon({
        className: 'custom-bus-icon',
        html: `
            <div class="bus-icon-container bus8">
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <filter id="shadow8" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
                    </filter>
                    <rect x="4" y="10" width="34" height="20" rx="4" fill="#34A853" filter="url(#shadow8)"/>
                    <rect x="8" y="13" width="8" height="6" rx="1" fill="#E1F5FE" stroke="white" stroke-width="0.5"/>
                    <rect x="18" y="13" width="8" height="6" rx="1" fill="#E1F5FE" stroke="white" stroke-width="0.5"/>
                    <rect x="28" y="13" width="6" height="6" rx="1" fill="#E1F5FE" stroke="white" stroke-width="0.5"/>
                    <circle cx="6" cy="18" r="2" fill="#FFD700"/>
                    <circle cx="36" cy="18" r="2" fill="#FFD700"/>
                    <circle cx="12" cy="30" r="5" fill="#333" stroke="#666" stroke-width="1.5"/>
                    <circle cx="30" cy="30" r="5" fill="#333" stroke="#666" stroke-width="1.5"/>
                    <circle cx="12" cy="30" r="2.5" fill="#AAA"/>
                    <circle cx="30" cy="30" r="2.5" fill="#AAA"/>
                    <rect x="4" y="10" width="34" height="4" fill="rgba(255,255,255,0.3)"/>
                    <rect x="8" y="6" width="26" height="4" rx="1" fill="#2C3E50"/>
                </svg>
                <div class="bus-label">BUS 8</div>
            </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 36],
        popupAnchor: [0, -36]
    }),

    busStop: {
        bus4: L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        }),
        bus8: L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        })
    }
};

// ======================================================================
// SECTION 3 : SERVICE DE CARTE (MapService)
// ======================================================================

class MapService {
    constructor() {
        this.map = null;
        this.layers = {};
        this.routeCache = new Map();
        this.userLocationSet = false;
        this.init();
    }

    init() {
        this.map = L.map("map", {
            zoomControl: true,
            minZoom: CONFIG.map.minZoom,
            maxZoom: CONFIG.map.maxZoom
        }).setView(CONFIG.map.defaultCenter, CONFIG.map.defaultZoom);

        const mapSatellite = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            { attribution: "© Mabel Cédric Yvan" }
        );

        const mapStandard = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        );

        const mapLabels = L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
            { opacity: 0.9 }
        );

        mapStandard.addTo(this.map);
        mapLabels.addTo(this.map);

        this.layers = {
            bus4: L.layerGroup().addTo(this.map),
            bus8: L.layerGroup().addTo(this.map),
            bus4Line: L.layerGroup().addTo(this.map),
            bus8Line: L.layerGroup().addTo(this.map),
            campus: L.layerGroup().addTo(this.map),
            parking: L.layerGroup().addTo(this.map),
            followBus4: L.layerGroup(),
            followBus8: L.layerGroup()
        };

        return this.map;
    }

    centerOnUserLocation(lat, lng) {
        if (!this.userLocationSet) {
            this.map.setView([lat, lng], CONFIG.map.defaultZoom, {
                animate: true,
                duration: 1
            });
            this.userLocationSet = true;
        }
    }

    async getRoute(coords) {
        const key = JSON.stringify(coords);
        
        if (this.routeCache.has(key)) {
            return this.routeCache.get(key);
        }

        try {
            const points = coords.map(c => `${c[1]},${c[0]}`).join(";");
            const url = `https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson`;

            const response = await fetch(url);
            const data = await response.json();

            if (!data.routes?.[0]) {
                return coords;
            }

            const route = data.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
            this.routeCache.set(key, route);
            
            return route;
        } catch (error) {
            console.error("Erreur OSRM :", error);
            return coords;
        }
    }

    validateDistance(distance) {
        if (distance > CONFIG.bus.maxRealisticDistance) {
            console.warn(`Distance anormalement élevée : ${distance}m`);
            return CONFIG.bus.maxRealisticDistance;
        }
        return distance;
    }
}

// ======================================================================
// SECTION 4 : GESTIONNAIRE DES BUS (BusManager)
// ======================================================================

class BusManager {
    constructor(mapService) {
        this.mapService = mapService;
        this.busPositions = new Map();
        this.busRoutes = new Map();
        this.busMarkers = new Map();
        this.initRoutes();
        this.initStops();
        this.initPOI();
        // AJOUT : Lancer l'écoute Firebase
        this.listenToFirebase();
    }

    async initRoutes() {
        const route4 = await this.mapService.getRoute(BUS_STOPS.bus4.map(s => s.coords));
        const line4 = L.polyline(route4, { color: COLORS.bus4, weight: 6 });
        this.mapService.layers.bus4Line.addLayer(line4);
        this.mapService.layers.followBus4.addLayer(line4);
        this.busRoutes.set('bus4', route4);

        const route8 = await this.mapService.getRoute(BUS_STOPS.bus8.map(s => s.coords));
        const line8 = L.polyline(route8, { color: COLORS.bus8, weight: 6 });
        this.mapService.layers.bus8Line.addLayer(line8);
        this.mapService.layers.followBus8.addLayer(line8);
        this.busRoutes.set('bus8', route8);
    }

    initStops() {
        BUS_STOPS.bus4.forEach(stop => {
            const marker = L.marker(stop.coords, { icon: Icons.busStop.bus4 })
                .addTo(this.mapService.layers.bus4);
            this.updateStopPopup(marker, stop);
        });

        BUS_STOPS.bus8.forEach(stop => {
            const marker = L.marker(stop.coords, { icon: Icons.busStop.bus8 })
                .addTo(this.mapService.layers.bus8);
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
        const favorites = JSON.parse(localStorage.getItem('bus_favorites')) || [];
        const isFavorite = favorites.includes(stop.name);

        const popupContent = this.createStopPopup(stop.name, busLines, linesText, isFavorite);

        marker.bindPopup(popupContent, {
            autoClose: true,
            closeOnClick: true,
            maxWidth: 280,
            className: 'stop-popup'
        });

        marker.on('click', () => {
            const currentFavorites = JSON.parse(localStorage.getItem('bus_favorites')) || [];
            const currentIsFavorite = currentFavorites.includes(stop.name);
            
            const updatedPopupContent = this.createStopPopup(
                stop.name, 
                busLines, 
                linesText, 
                currentIsFavorite
            );
            
            marker.setPopupContent(updatedPopupContent);
        });
    }

    createStopPopup(stopName, busLines, linesText, isFavorite) {
        const favoriteIcon = isFavorite ? 'star' : 'star_border';
        
        return `
            <div class="stop-popup-container compact">
                <div class="stop-popup-name">${stopName}</div>
                <div class="stop-popup-lines">${linesText}</div>
                <div class="stop-popup-actions">
                    <button class="stop-popup-btn favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="window.busManager.toggleFavorite('${stopName}')"
                            title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                        <span class="material-icons">${favoriteIcon}</span>
                    </button>
                    <button class="stop-popup-btn route-btn" 
                            onclick="window.busManager.openRouteToStop('${stopName}')"
                            title="Calculer l'itinéraire">
                        <span class="material-icons">directions</span>
                    </button>
                </div>
            </div>
        `;
    }

    toggleFavorite(stopName) {
        const favoritesManager = window.favoritesManager;
        if (!favoritesManager) return;

        const isFavorite = favoritesManager.isFavorite(stopName);
        
        if (isFavorite) {
            favoritesManager.remove(stopName);
        } else {
            favoritesManager.add(stopName);
        }

        this.updateCurrentPopup(stopName);
    }

    openRouteToStop(stopName) {
        const endInput = document.getElementById('endInput');
        if (endInput) {
            endInput.value = stopName;
            
            const routeModal = document.getElementById('routeModal');
            if (routeModal) {
                routeModal.style.display = 'block';
            }
            
            setTimeout(() => {
                const traceBtn = document.getElementById('traceBtn');
                if (traceBtn) {
                    traceBtn.click();
                }
            }, 500);
        }
    }

    updateCurrentPopup(stopName) {
        const updateLayers = (layerGroup) => {
            layerGroup.eachLayer(layer => {
                if (layer instanceof L.Marker && layer.isPopupOpen()) {
                    const popup = layer.getPopup();
                    if (popup && popup.getContent().includes(stopName)) {
                        const favorites = JSON.parse(localStorage.getItem('bus_favorites')) || [];
                        const isFavorite = favorites.includes(stopName);
                        
                        const isInBus4 = BUS_STOPS.bus4.some(s => s.name === stopName);
                        const isInBus8 = BUS_STOPS.bus8.some(s => s.name === stopName);
                        const busLines = [];
                        if (isInBus4) busLines.push('BUS 4');
                        if (isInBus8) busLines.push('BUS 8');
                        const linesText = busLines.join(' • ');
                        
                        const newContent = this.createStopPopup(stopName, busLines, linesText, isFavorite);
                        layer.setPopupContent(newContent);
                    }
                }
            });
        };

        updateLayers(this.mapService.layers.bus4);
        updateLayers(this.mapService.layers.bus8);
    }

    initPOI() {
        POINTS_OF_INTEREST.campuses.forEach(c =>
            L.marker(c.coords).addTo(this.mapService.layers.campus).bindPopup(`🎓 ${c.name}`)
        );

        POINTS_OF_INTEREST.parkings.forEach(p =>
            L.marker(p.coords).addTo(this.mapService.layers.parking).bindPopup(`🅿️ ${p.name}`)
        );
    }

    findClosestStop(stops, position) {
        let closest = null;
        let minDistance = Infinity;
        let closestIndex = -1;

        stops.forEach((stop, index) => {
            const distance = this.mapService.map.distance(position, stop.coords);
            if (distance < minDistance) {
                minDistance = distance;
                closest = stop;
                closestIndex = index;
            }
        });

        return { stop: closest, distance: minDistance, index: closestIndex };
    }

    findNextStop(stops, currentStop, currentPosition, route) {
        if (!currentStop) return null;

        const currentIndex = stops.findIndex(s => s.name === currentStop.name);
        const nextIndex = (currentIndex + 1) % stops.length;
        const nextStop = stops[nextIndex];

        const distanceToNext = this.calculateDistanceAlongRoute(
            currentPosition,
            nextStop.coords,
            route
        );

        const validatedDistance = this.mapService.validateDistance(distanceToNext);
        const timeMinutes = this.calculateEstimatedTime(validatedDistance);

        return {
            stop: nextStop,
            distance: validatedDistance,
            timeMinutes: timeMinutes
        };
    }

    calculateDistanceAlongRoute(currentPos, nextStopCoords, route) {
        if (!route || route.length === 0) {
            return this.mapService.map.distance(currentPos, nextStopCoords);
        }

        let minDistToCurrent = Infinity;
        let minDistToNext = Infinity;
        let currentIndex = -1;
        let nextIndex = -1;

        route.forEach((point, index) => {
            const distToCurrent = this.mapService.map.distance(currentPos, point);
            const distToNext = this.mapService.map.distance(nextStopCoords, point);

            if (distToCurrent < minDistToCurrent) {
                minDistToCurrent = distToCurrent;
                currentIndex = index;
            }

            if (distToNext < minDistToNext) {
                minDistToNext = distToNext;
                nextIndex = index;
            }
        });

        return this.calculateRealisticDistance(route, currentIndex, nextIndex);
    }

    calculateRealisticDistance(route, startIndex, endIndex) {
        if (startIndex === endIndex) return 0;
        
        let distance = 0;
        const routeLength = route.length;
        
        if (endIndex > startIndex) {
            for (let i = startIndex; i < endIndex; i++) {
                distance += this.mapService.map.distance(route[i], route[i + 1]);
            }
        } else {
            for (let i = startIndex; i < routeLength - 1; i++) {
                distance += this.mapService.map.distance(route[i], route[i + 1]);
            }
            for (let i = 0; i < endIndex; i++) {
                distance += this.mapService.map.distance(route[i], route[i + 1]);
            }
        }
        
        return distance;
    }

    calculateEstimatedTime(distanceMeters) {
        const timeSeconds = distanceMeters / CONFIG.bus.averageSpeedMps;
        const timeMinutes = Math.ceil(timeSeconds / 60);
        const trafficFactor = 1.15;
        return Math.ceil(timeMinutes * trafficFactor);
    }

    createBusPopup(busInfo, currentStop, nextStopInfo) {
        const nextStopText = nextStopInfo ? 
            `${nextStopInfo.stop.name} (${nextStopInfo.timeMinutes} min)` : 
            "Terminus";

        return `
            <div class="bus-popup">
                <div class="bus-popup-header" style="background-color: ${busInfo.color};">
                    <span class="bus-popup-icon">🚌</span>
                    <span class="bus-popup-title">${busInfo.name}</span>
                </div>
                <div class="bus-popup-content">
                    <div class="bus-popup-row">
                        <span class="bus-popup-label">Compagnie:</span>
                        <span class="bus-popup-value">${busInfo.company}</span>
                    </div>
                    <div class="bus-popup-divider"></div>
                    <div class="bus-popup-row">
                        <span class="bus-popup-label">🚏 Arrêt actuel:</span>
                        <span class="bus-popup-value bus-popup-stop">${currentStop?.name || "En circulation"}</span>
                    </div>
                    <div class="bus-popup-row">
                        <span class="bus-popup-label">⏭️ Prochain:</span>
                        <span class="bus-popup-value bus-popup-next">${nextStopText}</span>
                    </div>
                </div>
            </div>
        `;
    }

    async animateBus(busId, stops, busInfo) {
        const fullRoute = await this.mapService.getRoute(stops.map(s => s.coords));
        let index = 0;

        const busIcon = busId === 'bus4' ? Icons.bus4 : Icons.bus8;
        
        const marker = L.marker(fullRoute[0], { 
            icon: busIcon,
            className: `bus-marker-${busId}`
        }).addTo(this.mapService.map);

        this.busMarkers.set(busId, marker);

        marker.bindPopup('', {
            autoClose: true,
            closeOnClick: true,
            autoPan: true
        });

        marker.on('click', () => {
            const currentPos = this.busPositions.get(busId) || fullRoute[index];
            const { stop: currentStop } = this.findClosestStop(stops, currentPos);
            const nextStopInfo = this.findNextStop(stops, currentStop, currentPos, fullRoute);
            
            const popupContent = this.createBusPopup(busInfo, currentStop, nextStopInfo);
            marker.setPopupContent(popupContent);
            marker.openPopup();
        });

        const move = () => {
            marker.setLatLng(fullRoute[index]);
            this.busPositions.set(busId, fullRoute[index]);

            const { stop: currentStop } = this.findClosestStop(stops, fullRoute[index]);
            const nextStopInfo = this.findNextStop(stops, currentStop, fullRoute[index], fullRoute);

            const popupContent = this.createBusPopup(busInfo, currentStop, nextStopInfo);
            marker.setPopupContent(popupContent);

            index = (index + 1) % fullRoute.length;

            requestAnimationFrame(() => {
                setTimeout(move, CONFIG.bus.animationSpeed);
            });
        };

        move();
        return marker;
    }

    getAllStops() {
        return [...BUS_STOPS.bus4, ...BUS_STOPS.bus8];
    }

    // ========== AJOUTS POUR FIREBASE ==========

    /**
     * Écoute les positions des bus sur Firebase et met à jour la carte
     */
    listenToFirebase() {
        const busRef = database.ref('bus_positions');
        busRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            // Pour chaque bus reçu
            for (let busId in data) {
                const pos = data[busId];
                // Mettre à jour le marqueur de ce bus
                this.updateBusPosition(busId, pos.lat, pos.lng, pos.speed);
            }
        });
    }

    /**
     * Met à jour (ou crée) le marqueur d'un bus avec sa nouvelle position
     */
    updateBusPosition(busId, lat, lng, speed) {
        const marker = this.busMarkers.get(busId);
        
        // Déterminer le type de bus et ses arrêts
        const busKey = busId.toLowerCase(); // "bus_4" ou "bus_8"
        const busInfo = busKey === 'bus_4' ? BUS_TYPES.bus4 : BUS_TYPES.bus8;
        const stops = busKey === 'bus_4' ? BUS_STOPS.bus4 : BUS_STOPS.bus8;
        const icon = busKey === 'bus_4' ? Icons.bus4 : Icons.bus8;

        if (marker) {
            // Animer le déplacement (optionnel, mais plus joli)
            this.animateMarkerToPosition(marker, [lat, lng]);
            
            // Mettre à jour le contenu du popup
            const currentStop = this.findClosestStop(stops, [lat, lng]).stop;
            const nextStopInfo = this.findNextStop(stops, currentStop, [lat, lng], this.busRoutes.get(busKey));
            const popupContent = this.createBusPopup(busInfo, currentStop, nextStopInfo);
            marker.setPopupContent(popupContent);
        } else {
            // Créer un nouveau marqueur
            const newMarker = L.marker([lat, lng], { icon: icon }).addTo(this.mapService.map);
            newMarker.bindPopup('', { autoClose: true, closeOnClick: true });
            newMarker.on('click', () => {
                const currentStop = this.findClosestStop(stops, [lat, lng]).stop;
                const nextStopInfo = this.findNextStop(stops, currentStop, [lat, lng], this.busRoutes.get(busKey));
                const popupContent = this.createBusPopup(busInfo, currentStop, nextStopInfo);
                newMarker.setPopupContent(popupContent);
                newMarker.openPopup();
            });
            this.busMarkers.set(busId, newMarker);
        }
    }

    /**
     * Anime le déplacement d'un marqueur d'un point à un autre (transition fluide)
     */
    animateMarkerToPosition(marker, newLatLng) {
        const duration = 1000; // 1 seconde
        const start = marker.getLatLng();
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const lat = start.lat + (newLatLng[0] - start.lat) * progress;
            const lng = start.lng + (newLatLng[1] - start.lng) * progress;
            marker.setLatLng([lat, lng]);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Assurer la position exacte à la fin
                marker.setLatLng(newLatLng);
            }
        };
        requestAnimationFrame(animate);
    }
}

// ======================================================================
// SECTION 5 : GESTIONNAIRE DE GÉOLOCALISATION (GeolocationManager)
// ======================================================================

class GeolocationManager {
    constructor(mapService) {
        this.mapService = mapService;
        this.userMarker = null;
        this.accuracyCircle = null;
        this.userCoords = null;
        this.watchId = null;
        this.autoFollow = true;
        this.initialLocationSet = false;
        this.init();
        this.startTracking(true);
    }

    init() {
        this.setupLocateButton();
        this.setupNearestStopButton();
    }

    setupLocateButton() {
        document.getElementById("locateBtn").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.userCoords) {
                this.centerOnUserAndShowPopup();
            } else {
                this.startTracking(false, true);
            }
        });
    }

    setupNearestStopButton() {
        document.getElementById('nearestStopBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.findNearestStop();
        });
    }

    centerOnUserAndShowPopup() {
        if (!this.userCoords) return;

        this.mapService.map.setView(this.userCoords, 19, {
            animate: true,
            duration: 1
        });

        if (this.userMarker) {
            this.userMarker.setPopupContent(`
                <div class="popup-container">
                    <div class="popup-title">📍 Ma position</div>
                    <div class="popup-content">Vous êtes ici</div>
                </div>
            `);
            
            this.userMarker.openPopup();
        }

        document.getElementById("locateBtn").classList.add('active');
        setTimeout(() => {
            document.getElementById("locateBtn").classList.remove('active');
        }, 1000);
    }

    findNearestStop() {
        if (!this.userCoords) {
            this.showNotification(
                "📍 Position requise", 
                "Cliquez d'abord sur 'Ma position'",
                'warning'
            );
            return;
        }

        this.showSearchIndicator();

        const busManager = window.busManager;
        const allStops = busManager.getAllStops();
        
        let nearestStop = null;
        let minDistance = Infinity;

        allStops.forEach(stop => {
            const stopLatLng = L.latLng(stop.coords[0], stop.coords[1]);
            const distance = this.userCoords.distanceTo(stopLatLng);
            
            if (distance < minDistance) {
                nearestStop = stop;
                minDistance = distance;
            }
        });

        if (!nearestStop) {
            this.hideSearchIndicator();
            this.showNotification("Aucun arrêt trouvé", "", 'error');
            return;
        }

        const stopLatLng = L.latLng(nearestStop.coords[0], nearestStop.coords[1]);

        const isInBus4 = BUS_STOPS.bus4.some(s => s.name === nearestStop.name);
        const isInBus8 = BUS_STOPS.bus8.some(s => s.name === nearestStop.name);
        const busLines = [];
        if (isInBus4) busLines.push('BUS 4');
        if (isInBus8) busLines.push('BUS 8');
        const linesText = busLines.join(' • ');
        const favorites = JSON.parse(localStorage.getItem('bus_favorites')) || [];
        const isFavorite = favorites.includes(nearestStop.name);

        const popupContent = busManager.createStopPopup(
            nearestStop.name,
            busLines,
            linesText,
            isFavorite
        );

        this.mapService.map.closePopup();

        L.popup({
            autoClose: true,
            closeOnClick: true,
            maxWidth: 280,
            className: 'stop-popup'
        })
            .setLatLng(stopLatLng)
            .setContent(popupContent)
            .openOn(this.mapService.map);

        this.mapService.map.setView(stopLatLng, 17, {
            animate: true,
            duration: 1
        });

        this.hideSearchIndicator();
    }

    showSearchIndicator() {
        const btn = document.getElementById('nearestStopBtn');
        btn.classList.add('loading');
        btn.disabled = true;
    }

    hideSearchIndicator() {
        const btn = document.getElementById('nearestStopBtn');
        btn.classList.remove('loading');
        btn.disabled = false;
    }

    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;
        
        notification.style.cssText = `
            position: absolute;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#667eea'};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 2000;
            font-family: Arial, sans-serif;
            animation: slideDown 0.3s ease;
            min-width: 280px;
            text-align: center;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    calculateRouteToStop(stopName) {
        const endInput = document.getElementById('endInput');
        if (endInput) {
            endInput.value = stopName;
            
            const routeModal = document.getElementById('routeModal');
            if (routeModal) {
                routeModal.style.display = 'block';
            }
            
            setTimeout(() => {
                const traceBtn = document.getElementById('traceBtn');
                if (traceBtn) {
                    traceBtn.click();
                }
            }, 500);
        }
    }

    startTracking(initialLoad = false, centerImmediately = false) {
        if (!navigator.geolocation) {
            this.showNotification("Géolocalisation non supportée", "", 'error');
            return;
        }

        const handlePosition = (position) => {
            this.onPositionUpdate(position, initialLoad);
            
            if (centerImmediately) {
                this.centerOnUserAndShowPopup();
            }
        };

        if (initialLoad) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    handlePosition(position);
                    this.watchId = navigator.geolocation.watchPosition(
                        position => this.onPositionUpdate(position, false),
                        error => this.onPositionError(error),
                        CONFIG.geolocation
                    );
                },
                error => {
                    console.warn("Impossible d'obtenir la position au démarrage");
                    this.onPositionError(error);
                },
                CONFIG.geolocation
            );
        } else if (this.watchId === null) {
            this.watchId = navigator.geolocation.watchPosition(
                position => this.onPositionUpdate(position, false),
                error => this.onPositionError(error),
                CONFIG.geolocation
            );
        }
    }

    onPositionUpdate(position, isInitial = false) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        this.userCoords = L.latLng(lat, lng);

        if (isInitial && !this.initialLocationSet) {
            this.mapService.centerOnUserLocation(lat, lng);
            this.initialLocationSet = true;
        }

        if (!this.userMarker) {
            this.createUserMarker(accuracy);
        } else {
            this.updateUserMarker(accuracy);
        }

        // AJOUT : Mettre à jour la progression de l'itinéraire
        if (window.routeManager) {
            window.routeManager.updateRouteProgress(this.userCoords);
        }
    }

    createUserMarker(accuracy) {
        this.userMarker = L.circleMarker(this.userCoords, {
            radius: 8,
            fillColor: COLORS.primary,
            color: COLORS.white,
            weight: 2,
            fillOpacity: 1,
            className: 'user-location-marker'
        }).addTo(this.mapService.map);

        this.userMarker.bindPopup(`
            <div class="popup-container">
                <div class="popup-title">📍 Ma position</div>
                <div class="popup-content">Vous êtes ici</div>
            </div>
        `, {
            autoClose: true,
            closeOnClick: true
        });

        this.userMarker.on('click', () => {
            this.userMarker.openPopup();
        });

        this.accuracyCircle = L.circle(this.userCoords, {
            radius: accuracy,
            color: COLORS.primary,
            fillColor: COLORS.primary,
            fillOpacity: 0.15,
            weight: 1
        }).addTo(this.mapService.map);
    }

    updateUserMarker(accuracy) {
        this.userMarker.setLatLng(this.userCoords);
        this.accuracyCircle.setLatLng(this.userCoords);
        this.accuracyCircle.setRadius(accuracy);
    }

    onPositionError(error) {
        console.warn("Erreur de géolocalisation:", error.message);
        
        let errorMessage = "Impossible d'obtenir votre position.";
        switch(error.code) {
            case 1:
                errorMessage = "Accès à la position refusé.";
                break;
            case 2:
                errorMessage = "Position indisponible.";
                break;
            case 3:
                errorMessage = "Délai d'attente dépassé.";
                break;
        }
        
        this.showNotification("Erreur", errorMessage, 'error');
    }

    getCurrentCoords() {
        return this.userCoords;
    }
}

// ======================================================================
// SECTION 6 : GESTIONNAIRE D'ITINÉRAIRES (RouteManager) - MODIFIÉ
// ======================================================================

class RouteManager {
    constructor(mapService, geolocationManager) {
        this.mapService = mapService;
        this.geolocationManager = geolocationManager;
        this.routeLine = null;
        // AJOUT : stocker la route complète et l'index précédent
        this.fullRouteCoords = null;
        this.lastIndex = null;
        this.init();
    }

    init() {
        this.setupRouteModal();
        this.setupTraceButton();
        this.setupClearButton();
    }

    setupRouteModal() {
        const routeBtn = document.getElementById('routeBtn');
        const routeModal = document.getElementById('routeModal');
        const closeRouteModal = document.getElementById('closeRouteModal');

        routeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            routeModal.style.display = 'block';
        });

        closeRouteModal.addEventListener('click', () => {
            routeModal.style.display = 'none';
        });

        document.addEventListener('click', (e) => {
            if (!routeModal.contains(e.target) && e.target !== routeBtn) {
                routeModal.style.display = 'none';
            }
        });
    }

    setupTraceButton() {
        document.getElementById("traceBtn").addEventListener("click", () => {
            this.calculateRoute();
        });
    }

    setupClearButton() {
        document.getElementById("clearRouteBtn").addEventListener("click", () => {
            this.clearRoute();
        });
    }

    async calculateRoute() {
        const userCoords = this.geolocationManager.getCurrentCoords();
        if (!userCoords) {
            alert("Cliquez d'abord sur 'Ma position'.");
            return;
        }

        const destinationText = document.getElementById("endInput").value.trim().toLowerCase();
        if (!destinationText) {
            alert("Veuillez entrer un arrêt.");
            return;
        }

        const busManager = window.busManager;
        const allStops = busManager.getAllStops();

        const matchedStop = allStops.find(stop =>
            stop.name.toLowerCase().includes(destinationText)
        );

        if (!matchedStop) {
            alert("Arrêt introuvable.");
            return;
        }

        const destLat = matchedStop.coords[0];
        const destLng = matchedStop.coords[1];

        const url = `https://router.project-osrm.org/route/v1/foot/${userCoords.lng},${userCoords.lat};${destLng},${destLat}?overview=full&geometries=geojson`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!data.routes?.[0]) {
                alert("Itinéraire non disponible.");
                return;
            }

            const route = data.routes[0];
            const routeCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

            // AJOUT : stocker la route complète
            this.fullRouteCoords = routeCoords;
            this.lastIndex = null;

            this.clearRoute();

            // Trace la ligne (complète au départ)
            this.routeLine = L.polyline(routeCoords, {
                color: COLORS.primary,
                weight: 6,
                opacity: 0.9
            }).addTo(this.mapService.map);

            this.mapService.map.fitBounds(this.routeLine.getBounds(), {
                padding: [60, 60]
            });

            // Affiche le popup de destination
            const isInBus4 = BUS_STOPS.bus4.some(s => s.name === matchedStop.name);
            const isInBus8 = BUS_STOPS.bus8.some(s => s.name === matchedStop.name);
            const busLines = [];
            if (isInBus4) busLines.push('BUS 4');
            if (isInBus8) busLines.push('BUS 8');
            const linesText = busLines.join(' • ');
            const favorites = JSON.parse(localStorage.getItem('bus_favorites')) || [];
            const isFavorite = favorites.includes(matchedStop.name);

            const popupContent = busManager.createStopPopup(
                matchedStop.name,
                busLines,
                linesText,
                isFavorite
            );

            L.popup({
                autoClose: true,
                closeOnClick: true,
                maxWidth: 280,
                className: 'stop-popup'
            })
                .setLatLng([destLat, destLng])
                .setContent(popupContent)
                .openOn(this.mapService.map);

        } catch (error) {
            alert("Erreur lors du calcul de l'itinéraire.");
            console.error("Erreur de routage:", error);
        }
    }

    // AJOUT : mise à jour de la ligne en fonction de la position
    updateRouteProgress(userCoords) {
        if (!this.fullRouteCoords || !this.routeLine) return;

        // Trouver l'index du point le plus proche
        let minDist = Infinity;
        let closestIndex = 0;
        for (let i = 0; i < this.fullRouteCoords.length; i++) {
            const dist = this.mapService.map.distance(userCoords, this.fullRouteCoords[i]);
            if (dist < minDist) {
                minDist = dist;
                closestIndex = i;
            }
        }

        // Si l'utilisateur est très proche du point suivant, on peut affiner (optionnel)
        // Ici on prend simplement la portion de closestIndex à la fin
        const remainingCoords = this.fullRouteCoords.slice(closestIndex);
        this.routeLine.setLatLngs(remainingCoords);

        this.lastIndex = closestIndex;
    }

    clearRoute() {
        if (this.routeLine) {
            this.mapService.map.removeLayer(this.routeLine);
            this.routeLine = null;
        }
        this.fullRouteCoords = null;
        this.lastIndex = null;
    }
}

// ======================================================================
// SECTION 7 : GESTIONNAIRE DES FAVORIS (FavoritesManager)
// ======================================================================

class FavoritesManager {
    constructor() {
        this.storageKey = "bus_favorites";
    }

    add(stopName) {
        let favorites = this.getAll();
        
        if (!favorites.includes(stopName)) {
            favorites.push(stopName);
            localStorage.setItem(this.storageKey, JSON.stringify(favorites));
            this.triggerFavoritesUpdated();
            this.showNotification('⭐ Favori ajouté', stopName);
        }
    }

    remove(stopName) {
        let favorites = this.getAll();
        favorites = favorites.filter(f => f !== stopName);
        localStorage.setItem(this.storageKey, JSON.stringify(favorites));
        this.triggerFavoritesUpdated();
        this.showNotification('⭐ Favori retiré', stopName);
    }

    getAll() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    isFavorite(stopName) {
        return this.getAll().includes(stopName);
    }

    triggerFavoritesUpdated() {
        const event = new CustomEvent('favoritesUpdated', {
            detail: { favorites: this.getAll() }
        });
        window.dispatchEvent(event);
    }

    showNotification(title, message) {
        const notification = document.createElement('div');
        notification.className = 'notification notification-info';
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }
}

// ======================================================================
// SECTION 8 : CONTRÔLES DE LA CARTE (MapControls)
// ======================================================================

class MapControls {
    constructor(mapService) {
        this.mapService = mapService;
        this.initLayerControl();
        this.setupGlobalClickHandler();
    }

    initLayerControl() {
        const titleLayer = L.layerGroup();

        const baseMaps = {
            "<b>TYPES DE CARTE</b>": titleLayer,
            "🗺️ Standard": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
            "🛰️ Satellite": L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            )
        };

        const overlayMaps = {
            "<b>DÉTAILS</b>": titleLayer,
            "🏷️ Libellés": L.tileLayer(
                "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
                { opacity: 0.9 }
            ),
            "🟡 Ligne BUS 4": this.mapService.layers.bus4Line,
            "🟢 Ligne BUS 8": this.mapService.layers.bus8Line,
            "🛑 Arrêts BUS 4": this.mapService.layers.bus4,
            "🛑 Arrêts BUS 8": this.mapService.layers.bus8,
            "🎓 Campus": this.mapService.layers.campus,
            "🅿️ Parkings": this.mapService.layers.parking
        };

        L.control.layers(baseMaps, overlayMaps, { collapsed: true }).addTo(this.mapService.map);
    }

    setupGlobalClickHandler() {
        this.mapService.map.on('click', (e) => {
            if (!e.originalEvent.target.classList.contains('leaflet-marker-icon')) {
                this.mapService.map.closePopup();
            }
        });
    }
}

// ======================================================================
// SECTION 9 : GESTIONNAIRE DE RECHERCHE (SearchManager)
// ======================================================================

class SearchManager {
    constructor(mapService, geolocationManager) {
        this.mapService = mapService;
        this.geolocationManager = geolocationManager;
        this.allStops = [];
        this.favorites = [];
        this.currentTab = 'all';
        this.searchTerm = '';
        this.init();
    }

    init() {
        this.getAllStops();
        this.loadFavorites();
        this.setupEventListeners();
        this.renderStopsList();
        
        window.addEventListener('favoritesUpdated', () => {
            this.loadFavorites();
            this.renderStopsList();
        });
    }

    getAllStops() {
        const bus4Stops = BUS_STOPS.bus4.map(stop => ({
            ...stop,
            lines: ['BUS 4']
        }));

        const bus8Stops = BUS_STOPS.bus8.map(stop => ({
            ...stop,
            lines: ['BUS 8']
        }));

        const stopsMap = new Map();
        
        [...bus4Stops, ...bus8Stops].forEach(stop => {
            if (stopsMap.has(stop.name)) {
                const existing = stopsMap.get(stop.name);
                existing.lines = [...new Set([...existing.lines, ...stop.lines])];
            } else {
                stopsMap.set(stop.name, { ...stop });
            }
        });

        this.allStops = Array.from(stopsMap.values());
    }

    loadFavorites() {
        this.favorites = JSON.parse(localStorage.getItem('bus_favorites')) || [];
    }

    setupEventListeners() {
        document.getElementById('menuToggle').addEventListener('click', () => {
            this.openDrawer();
        });

        document.getElementById('closeDrawer').addEventListener('click', () => {
            this.closeDrawer();
        });

        document.getElementById('drawerOverlay').addEventListener('click', () => {
            this.closeDrawer();
        });

        document.getElementById('drawerSearchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.renderStopsList();
        });

        document.querySelectorAll('.drawer-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                this.renderStopsList();
            });
        });

        const searchInput = document.getElementById('searchStop');
        const suggestionsList = document.getElementById('suggestionsList');

        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            if (value.length < 2) {
                suggestionsList.classList.remove('show');
                return;
            }

            const suggestions = this.allStops
                .filter(stop => stop.name.toLowerCase().includes(value))
                .slice(0, 5);

            this.showSuggestions(suggestions);
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                suggestionsList.classList.remove('show');
            }
        });

        document.getElementById('searchBtn').addEventListener('click', () => {
            const searchTerm = document.getElementById('searchStop').value;
            if (searchTerm) {
                this.searchAndGoToStop(searchTerm);
            }
        });

        document.getElementById('searchStop').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = e.target.value;
                if (searchTerm) {
                    this.searchAndGoToStop(searchTerm);
                }
            }
        });
    }

    showSuggestions(suggestions) {
        const suggestionsList = document.getElementById('suggestionsList');
        
        if (suggestions.length === 0) {
            suggestionsList.classList.remove('show');
            return;
        }

        suggestionsList.innerHTML = suggestions.map(stop => {
            const lines = stop.lines.map(line => 
                `<span class="line-badge ${line.toLowerCase().replace(' ', '')}">${line}</span>`
            ).join('');

            return `
                <div class="suggestion-item" onclick="searchManager.goToStop('${stop.name}')">
                    <span class="material-icons">location_on</span>
                    <div class="suggestion-content">
                        <div class="suggestion-name">${stop.name}</div>
                        <div class="suggestion-line">${lines}</div>
                    </div>
                </div>
            `;
        }).join('');

        suggestionsList.classList.add('show');
    }

    searchAndGoToStop(searchTerm) {
        const stop = this.allStops.find(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (stop) {
            this.goToStop(stop.name);
        }
    }

    goToStop(stopName) {
        const stop = this.allStops.find(s => s.name === stopName);
        if (!stop) return;

        document.getElementById('suggestionsList').classList.remove('show');
        this.closeDrawer();

        this.mapService.map.setView(stop.coords, 18, {
            animate: true,
            duration: 1
        });

        setTimeout(() => {
            const busManager = window.busManager;
            const linesText = stop.lines.join(' • ');
            const favorites = JSON.parse(localStorage.getItem('bus_favorites')) || [];
            const isFavorite = favorites.includes(stop.name);

            const popupContent = busManager.createStopPopup(
                stop.name,
                stop.lines,
                linesText,
                isFavorite
            );

            L.popup({
                autoClose: true,
                closeOnClick: true,
                maxWidth: 280,
                className: 'stop-popup'
            })
                .setLatLng(stop.coords)
                .setContent(popupContent)
                .openOn(this.mapService.map);
        }, 500);
    }

    getFilteredStops() {
        let stops = this.allStops;

        if (this.currentTab === 'bus4') {
            stops = stops.filter(stop => stop.lines.includes('BUS 4'));
        } else if (this.currentTab === 'bus8') {
            stops = stops.filter(stop => stop.lines.includes('BUS 8'));
        } else if (this.currentTab === 'favorites') {
            stops = stops.filter(stop => this.favorites.includes(stop.name));
        }

        if (this.searchTerm) {
            stops = stops.filter(stop => 
                stop.name.toLowerCase().includes(this.searchTerm)
            );
        }

        return stops;
    }

    renderStopsList() {
        const stopsList = document.getElementById('stopsList');
        const drawerStats = document.getElementById('drawerStats');
        
        const filteredStops = this.getFilteredStops();

        if (filteredStops.length === 0) {
            stopsList.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">search_off</span>
                    <p>Aucun arrêt trouvé</p>
                </div>
            `;
            drawerStats.textContent = '0 arrêt';
            return;
        }

        stopsList.innerHTML = filteredStops.map(stop => {
            const isFavorite = this.favorites.includes(stop.name);
            const busClass = stop.lines.includes('BUS 4') ? 'bus4' : 'bus8';
            
            let distanceText = '';
            if (this.geolocationManager.userCoords) {
                const distance = Math.round(this.geolocationManager.userCoords.distanceTo(
                    L.latLng(stop.coords[0], stop.coords[1])
                ));
                const validatedDistance = this.mapService.validateDistance(distance);
                distanceText = `
                    <div class="stop-card-distance">
                        <span class="material-icons">straighten</span>
                        ${validatedDistance} m
                    </div>
                `;
            }

            return `
                <div class="stop-card ${busClass} ${isFavorite ? 'favorite' : ''}" 
                     onclick="searchManager.goToStop('${stop.name}')">
                    <div class="stop-card-header">
                        <span class="stop-card-name">${stop.name}</span>
                        <span class="stop-card-favorite" 
                              onclick="event.stopPropagation(); searchManager.toggleFavorite('${stop.name}')">
                            <span class="material-icons">${isFavorite ? 'star' : 'star_border'}</span>
                        </span>
                    </div>
                    <div class="stop-card-details">
                        <span class="stop-card-line ${busClass}">${stop.lines.join(' • ')}</span>
                        ${distanceText}
                    </div>
                </div>
            `;
        }).join('');

        drawerStats.textContent = `${filteredStops.length} arrêt${filteredStops.length > 1 ? 's' : ''}`;
    }

    toggleFavorite(stopName) {
        if (this.favorites.includes(stopName)) {
            window.favoritesManager.remove(stopName);
        } else {
            window.favoritesManager.add(stopName);
        }
    }

    openDrawer() {
        document.getElementById('stopsDrawer').classList.add('open');
        document.getElementById('drawerOverlay').classList.add('active');
        this.renderStopsList();
    }

    closeDrawer() {
        document.getElementById('stopsDrawer').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('active');
    }
}

// ======================================================================
// SECTION 10 : APPLICATION PRINCIPALE
// ======================================================================

class Application {
    constructor() {
        this.mapService = null;
        this.busManager = null;
        this.geolocationManager = null;
        this.routeManager = null;
        this.favoritesManager = null;
        this.mapControls = null;
        this.searchManager = null;
    }

    async init() {
        console.log("🚀 Initialisation de l'application...");

        this.showLoadingMessage();

        this.mapService = new MapService();
        this.favoritesManager = new FavoritesManager();
        this.busManager = new BusManager(this.mapService);
        
        this.geolocationManager = new GeolocationManager(this.mapService);
        this.routeManager = new RouteManager(this.mapService, this.geolocationManager);
        this.mapControls = new MapControls(this.mapService);
        this.searchManager = new SearchManager(this.mapService, this.geolocationManager);

        // Exposer les instances globalement
        window.busManager = this.busManager;
        window.favoritesManager = this.favoritesManager;
        window.geolocationManager = this.geolocationManager;
        window.routeManager = this.routeManager;   // <-- AJOUT (déjà présent)
        window.searchManager = this.searchManager;

        setTimeout(() => {
            this.startBusAnimations();
            this.hideLoadingMessage();
        }, 2000);

        console.log("✅ Application initialisée avec succès");
    }

    showLoadingMessage() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-message';
        loadingDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 2000;
            text-align: center;
            font-family: Arial, sans-serif;
        `;
        loadingDiv.innerHTML = `
            <div style="margin-bottom: 10px;">
                <span class="material-icons" style="color: #667eea; font-size: 40px;">directions_bus</span>
            </div>
            <div style="font-weight: bold; margin-bottom: 5px;">Chargement de l'application...</div>
            <div style="font-size: 12px; color: #666;">Veuillez patienter</div>
        `;
        document.body.appendChild(loadingDiv);
    }

    hideLoadingMessage() {
        const loadingDiv = document.getElementById('loading-message');
        if (loadingDiv) {
            loadingDiv.style.opacity = '0';
            loadingDiv.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (loadingDiv.parentNode) {
                    loadingDiv.parentNode.removeChild(loadingDiv);
                }
            }, 500);
        }
    }

    startBusAnimations() {
        // Si vous utilisez Firebase, vous pouvez désactiver les animations simulées
        // en commentant les lignes suivantes :
        //this.busManager.animateBus('bus4', BUS_STOPS.bus4, BUS_TYPES.bus4);
        //this.busManager.animateBus('bus8', BUS_STOPS.bus8, BUS_TYPES.bus8);
    }
}

// ======================================================================
// SECTION 11 : DÉMARRAGE DE L'APPLICATION
// ======================================================================

document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    app.init().catch(error => {
        console.error("❌ Erreur lors de l'initialisation:", error);
    });
});
