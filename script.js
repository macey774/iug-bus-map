/**
 * ======================================================================
 * SYSTÈME DE SUIVI DE BUS - APPLICATION DE TRANSPORT EN COMMUN
 * Version professionnelle 2.0
 * Auteur : Mabel Cédric Yvan
 * Description : Application de suivi en temps réel des bus avec
 *              calcul d'itinéraires, géolocalisation et interface moderne
 * ======================================================================
 */

/**
 * ======================================================================
 * SECTION 1 : CONFIGURATION ET CONSTANTES GLOBALES
 * ======================================================================
 */

const CONFIG = {
    map: {
        defaultCenter: [4.040770, 9.752837],
        defaultZoom: 18,
        minZoom: 12,           // Zoom minimum ajouté
        maxZoom: 18,           // Zoom maximum
        zoomControl: true
    },
    bus: {
        animationSpeed: 20,
        averageSpeed: 30,
        averageSpeedMps: 8.33,
        updateInterval: 3000
    },
    geolocation: {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    },
    walking: {
        speedMps: 1.4,
        speedMpm: 83.33
    }
};

const COLORS = {
    primary: '#4285F4',
    success: '#34A853',
    warning: '#FBBC05',
    danger: '#EA4335',
    bus4: '#FFD700', // Jaune
    bus8: '#34A853', // Vert
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

/**
 * ======================================================================
 * SECTION 2 : ICÔNES ET STYLES
 * ======================================================================
 */

const Icons = {
    bus: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61231.png",
        iconSize: [36, 36],
        iconAnchor: [18, 18]
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
    },
    car: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    })
};

/**
 * ======================================================================
 * SECTION 3 : INITIALISATION DE LA CARTE (MODIFIÉE)
 * ======================================================================
 */

class MapService {
    constructor() {
        this.map = null;
        this.layers = {};
        this.routeCache = new Map();
        this.userLocationSet = false; // Flag pour savoir si la position utilisateur a été définie
        this.init();
    }

    init() {
        // Initialisation de la carte avec minZoom et maxZoom
        this.map = L.map("map", {
            zoomControl: true,
            minZoom: CONFIG.map.minZoom,
            maxZoom: CONFIG.map.maxZoom
        }).setView(CONFIG.map.defaultCenter, CONFIG.map.defaultZoom);

        // Fonds de carte
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

        // Initialisation des layers
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

    /**
     * Centre la carte sur la position de l'utilisateur au démarrage
     */
    centerOnUserLocation(lat, lng) {
        if (!this.userLocationSet) {
            this.map.setView([lat, lng], CONFIG.map.defaultZoom, {
                animate: true,
                duration: 1
            });
            this.userLocationSet = true;
        }
    }

    /**
     * Service de routage OSRM avec cache
     */
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
}

/**
 * ======================================================================
 * SECTION 4 : GESTION DES BUS (VERSION MODIFIÉE)
 * ======================================================================
 */

class BusManager {
    constructor(mapService) {
        this.mapService = mapService;
        this.buses = [];
        this.busPositions = new Map(); // Stocke les positions actuelles des bus
        this.busRoutes = new Map(); // Stocke les routes complètes
        this.busMarkers = new Map(); // Stocke les références aux marqueurs
        this.initRoutes();
        this.initStops();
        this.initPOI();
    }

    async initRoutes() {
        // Bus 4
        const route4 = await this.mapService.getRoute(BUS_STOPS.bus4.map(s => s.coords));
        const line4 = L.polyline(route4, { color: COLORS.bus4, weight: 6 });
        this.mapService.layers.bus4Line.addLayer(line4);
        this.mapService.layers.followBus4.addLayer(line4);
        this.busRoutes.set('bus4', route4);

        // Bus 8
        const route8 = await this.mapService.getRoute(BUS_STOPS.bus8.map(s => s.coords));
        const line8 = L.polyline(route8, { color: COLORS.bus8, weight: 6 });
        this.mapService.layers.bus8Line.addLayer(line8);
        this.mapService.layers.followBus8.addLayer(line8);
        this.busRoutes.set('bus8', route8);
    }

    initStops() {
        // Arrêts Bus 4
        BUS_STOPS.bus4.forEach(stop => {
            L.marker(stop.coords, { icon: Icons.busStop.bus4 })
                .addTo(this.mapService.layers.bus4)
                .bindPopup(this.createStopPopup("BUS 4", stop.name));
        });

        // Arrêts Bus 8
        BUS_STOPS.bus8.forEach(stop => {
            L.marker(stop.coords, { icon: Icons.busStop.bus8 })
                .addTo(this.mapService.layers.bus8)
                .bindPopup(this.createStopPopup("BUS 8", stop.name));
        });
    }

    createStopPopup(busNumber, stopName) {
        return `
            <div class="popup-container">
                <div class="popup-title">🛑 ${busNumber}</div>
                <div class="popup-content"><b>${stopName}</b></div>
                <button onclick="favoritesManager.add('${stopName}')" class="popup-btn">
                    ⭐ Ajouter aux favoris
                </button>
            </div>
        `;
    }

    initPOI() {
        // Campus
        POINTS_OF_INTEREST.campuses.forEach(c =>
            L.marker(c.coords).addTo(this.mapService.layers.campus).bindPopup(`🎓 ${c.name}`)
        );

        // Parkings
        POINTS_OF_INTEREST.parkings.forEach(p =>
            L.marker(p.coords).addTo(this.mapService.layers.parking).bindPopup(`🅿️ ${p.name}`)
        );
    }

    /**
     * Trouve l'arrêt le plus proche d'une position donnée
     */
    findClosestStop(stops, position, excludeStop = null) {
        let closest = null;
        let minDistance = Infinity;
        let closestIndex = -1;

        stops.forEach((stop, index) => {
            // Si on veut exclure un arrêt spécifique (pour trouver le prochain)
            if (excludeStop && stop.name === excludeStop.name) {
                return;
            }
            
            const distance = this.mapService.map.distance(position, stop.coords);
            if (distance < minDistance) {
                minDistance = distance;
                closest = stop;
                closestIndex = index;
            }
        });

        return { stop: closest, distance: minDistance, index: closestIndex };
    }

    /**
     * Trouve le prochain arrêt sur le trajet
     */
    findNextStop(stops, currentStop, currentPosition, route) {
        if (!currentStop) return null;

        // Trouver l'index de l'arrêt actuel dans la liste
        const currentIndex = stops.findIndex(s => s.name === currentStop.name);
        
        // Si c'est le dernier arrêt, le prochain est le premier (boucle)
        const nextIndex = (currentIndex + 1) % stops.length;
        const nextStop = stops[nextIndex];

        // Calculer la distance restante jusqu'au prochain arrêt
        const distanceToNext = this.calculateDistanceAlongRoute(
            currentPosition,
            nextStop.coords,
            route
        );

        // Calculer le temps estimé
        const timeMinutes = this.calculateEstimatedTime(distanceToNext);

        return {
            stop: nextStop,
            distance: distanceToNext,
            timeMinutes: timeMinutes
        };
    }

    /**
     * Calcule la distance entre deux points le long de la route
     */
    calculateDistanceAlongRoute(currentPos, nextStopCoords, route) {
        // Trouver les segments les plus proches
        let minDistToCurrent = Infinity;
        let minDistToNext = Infinity;
        let currentSegmentIndex = -1;
        let nextSegmentIndex = -1;

        // Parcourir la route pour trouver les points les plus proches
        for (let i = 0; i < route.length; i++) {
            const distToCurrent = this.mapService.map.distance(currentPos, route[i]);
            const distToNext = this.mapService.map.distance(nextStopCoords, route[i]);

            if (distToCurrent < minDistToCurrent) {
                minDistToCurrent = distToCurrent;
                currentSegmentIndex = i;
            }

            if (distToNext < minDistToNext) {
                minDistToNext = distToNext;
                nextSegmentIndex = i;
            }
        }

        // Si on a trouvé les indices, calculer la distance le long de la route
        if (currentSegmentIndex !== -1 && nextSegmentIndex !== -1) {
            let distance = 0;
            
            // Si l'index du prochain arrêt est après l'index actuel
            if (nextSegmentIndex > currentSegmentIndex) {
                for (let i = currentSegmentIndex; i < nextSegmentIndex; i++) {
                    distance += this.mapService.map.distance(route[i], route[i + 1]);
                }
            } 
            // Si on est à la fin du trajet (retour au début)
            else {
                for (let i = currentSegmentIndex; i < route.length - 1; i++) {
                    distance += this.mapService.map.distance(route[i], route[i + 1]);
                }
                // Ajouter la distance du dernier au premier point
                distance += this.mapService.map.distance(route[route.length - 1], route[0]);
            }

            return distance;
        }

        // Fallback: distance directe
        return this.mapService.map.distance(currentPos, nextStopCoords);
    }

    /**
     * Calcule le temps estimé en minutes basé sur la distance
     */
    calculateEstimatedTime(distanceMeters) {
        const timeSeconds = distanceMeters / CONFIG.bus.averageSpeedMps;
        const timeMinutes = Math.ceil(timeSeconds / 60);
        return timeMinutes;
    }

    /**
     * Crée le contenu du popup pour un bus
     */
    createBusPopup(busInfo, currentStop, nextStopInfo) {
        const nextStopText = nextStopInfo ? 
            `${nextStopInfo.stop.name} (Dans environ ${nextStopInfo.timeMinutes} min)` : 
            "Terminus";

        return `
            <div class="bus-popup">
                <div class="bus-popup-header" style="background-color: ${busInfo.color};">
                    <span class="bus-popup-icon">🚌</span>
                    <span class="bus-popup-title">${busInfo.name}</span>
                </div>
                <div class="bus-popup-content">
                    <div class="bus-popup-row">
                        <span class="bus-popup-label">Type :</span>
                        <span class="bus-popup-value">${busInfo.type}</span>
                    </div>
                    <div class="bus-popup-row">
                        <span class="bus-popup-label">Compagnie :</span>
                        <span class="bus-popup-value">${busInfo.company}</span>
                    </div>
                    <div class="bus-popup-divider"></div>
                    <div class="bus-popup-row">
                        <span class="bus-popup-label">📍 Arrêt actuel :</span>
                        <span class="bus-popup-value bus-popup-stop">${currentStop?.name || "En circulation"}</span>
                    </div>
                    <div class="bus-popup-row">
                        <span class="bus-popup-label">⏭️ Prochain arrêt :</span>
                        <span class="bus-popup-value bus-popup-next">${nextStopText}</span>
                    </div>
                    <div class="bus-popup-footer">
                        <span class="bus-popup-time">
                            <span class="material-icons" style="font-size: 12px;">schedule</span>
                            Mis à jour en temps réel
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Met à jour le contenu du popup sans l'ouvrir automatiquement
     */
    updateBusPopup(busId, busInfo, currentStop, nextStopInfo) {
        const marker = this.busMarkers.get(busId);
        if (marker) {
            const popupContent = this.createBusPopup(busInfo, currentStop, nextStopInfo);
            marker.setPopupContent(popupContent);
        }
    }

    async animateBus(busId, stops, busInfo, colorLayer) {
        const fullRoute = await this.mapService.getRoute(stops.map(s => s.coords));
        let index = 0;

        // Créer le marqueur sans popup ouvert
        const marker = L.marker(fullRoute[0], { 
            icon: Icons.bus 
        }).addTo(this.mapService.map);

        // Stocker la référence du marqueur
        this.busMarkers.set(busId, marker);

        // Configuration du popup - ne s'ouvre que sur clic
        marker.bindPopup('', {
            autoClose: true,      // Ferme automatiquement les autres popups
            closeOnClick: true,   // Ferme quand on clique ailleurs
            autoPan: true         // Ajuste la carte si nécessaire
        });

        // Gestionnaire d'événements pour le clic sur le marqueur
        marker.on('click', () => {
            // Mettre à jour le contenu du popup avec les dernières informations
            const currentPos = this.busPositions.get(busId) || fullRoute[index];
            const { stop: currentStop } = this.findClosestStop(stops, currentPos);
            const nextStopInfo = this.findNextStop(stops, currentStop, currentPos, fullRoute);
            
            const popupContent = this.createBusPopup(busInfo, currentStop, nextStopInfo);
            marker.setPopupContent(popupContent);
            
            // Ouvrir le popup
            marker.openPopup();
        });

        // Gestionnaire pour fermer le popup quand on clique ailleurs sur la carte
        this.mapService.map.on('click', () => {
            marker.closePopup();
        });

        const move = () => {
            // Mettre à jour la position
            marker.setLatLng(fullRoute[index]);
            
            // Sauvegarder la position actuelle
            this.busPositions.set(busId, fullRoute[index]);

            // Trouver l'arrêt le plus proche (arrêt actuel)
            const { stop: currentStop } = this.findClosestStop(stops, fullRoute[index]);

            // Trouver le prochain arrêt
            const nextStopInfo = this.findNextStop(stops, currentStop, fullRoute[index], fullRoute);

            // Mettre à jour le contenu du popup pour quand il sera ouvert
            const popupContent = this.createBusPopup(busInfo, currentStop, nextStopInfo);
            marker.setPopupContent(popupContent);

            // Passer à la position suivante
            index = (index + 1) % fullRoute.length;

            // Planifier la prochaine animation
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
}

/**
 * ======================================================================
 * SECTION 5 : GESTION DE LA GÉOLOCALISATION (VERSION CORRIGÉE)
 * ======================================================================
 */

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
        // Démarrer automatiquement la géolocalisation au chargement
        this.startTracking(true);
    }

    init() {
        this.setupLocateButton();
        this.setupNearestStopButton();
    }

    setupLocateButton() {
        const locateBtn = document.getElementById("locateBtn");
        
        locateBtn.addEventListener("click", (e) => {
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
        const nearestStopBtn = document.getElementById('nearestStopBtn');
        
        nearestStopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.findNearestStop();
        });
    }

    centerOnUserAndShowPopup() {
        if (!this.userCoords) return;

        this.mapService.map.setView(this.userCoords, 19, {
            animate: true,
            duration: 1,
            easeLinearity: 0.5
        });

        if (this.userMarker) {
            this.userMarker.setPopupContent(`
                <div class="popup-container">
                    <div class="popup-title">📍 Ma position</div>
                    <div class="popup-content">Vous êtes ici</div>
                    <div class="popup-content" style="font-size: 11px; color: #999;">
                        ${new Date().toLocaleTimeString()}
                    </div>
                </div>
            `);
            
            this.userMarker.openPopup();
        }

        const locateBtn = document.getElementById("locateBtn");
        locateBtn.classList.add('active');
        
        setTimeout(() => {
            locateBtn.classList.remove('active');
        }, 1000);
    }

    /**
     * Trouve et affiche l'arrêt le plus proche avec un popup détaillé
     * SANS TRACER DE LIGNE
     */
    findNearestStop() {
        // Vérifier si la position utilisateur est disponible
        if (!this.userCoords) {
            this.showNotification(
                "📍 Position requise", 
                "Cliquez d'abord sur 'Ma position' pour activer la géolocalisation",
                'warning'
            );
            return;
        }

        // Afficher un indicateur de recherche
        this.showSearchIndicator();

        const busManager = window.busManager;
        const allStops = busManager.getAllStops();
        
        // Calculer l'arrêt le plus proche
        let nearestStop = null;
        let minDistance = Infinity;
        let secondNearest = null;
        let secondMinDistance = Infinity;

        allStops.forEach(stop => {
            const stopLatLng = L.latLng(stop.coords[0], stop.coords[1]);
            const distance = this.userCoords.distanceTo(stopLatLng);
            
            if (distance < minDistance) {
                secondNearest = nearestStop;
                secondMinDistance = minDistance;
                nearestStop = stop;
                minDistance = distance;
            } else if (distance < secondMinDistance) {
                secondNearest = stop;
                secondMinDistance = distance;
            }
        });

        if (!nearestStop) {
            this.hideSearchIndicator();
            this.showNotification(
                "Aucun arrêt trouvé", 
                "Aucun arrêt n'est disponible dans votre zone",
                'error'
            );
            return;
        }

        // Calculer les informations détaillées
        const stopLatLng = L.latLng(nearestStop.coords[0], nearestStop.coords[1]);
        const walkingTime = Math.round(minDistance / CONFIG.walking.speedMpm);
        const walkingTimeSeconds = Math.round(minDistance / CONFIG.walking.speedMps);
        
        // Déterminer la ligne de bus
        const isBus4 = BUS_STOPS.bus4.some(s => s.name === nearestStop.name);
        const isBus8 = BUS_STOPS.bus8.some(s => s.name === nearestStop.name);
        const busLines = [];
        if (isBus4) busLines.push('BUS 4 (Jaune)');
        if (isBus8) busLines.push('BUS 8 (Verte)');
        
        // Trouver les arrêts à proximité (dans un rayon de 200m)
        const nearbyStops = allStops.filter(stop => {
            if (stop.name === nearestStop.name) return false;
            const dist = this.userCoords.distanceTo(L.latLng(stop.coords[0], stop.coords[1]));
            return dist <= 300; // Rayon de 300m
        }).slice(0, 3); // Maximum 3 arrêts

        // Créer le contenu du popup détaillé
        const popupContent = this.createDetailedStopPopup(
            nearestStop, 
            minDistance, 
            walkingTime, 
            walkingTimeSeconds,
            busLines,
            nearbyStops,
            secondNearest,
            secondMinDistance
        );

        // Fermer tous les popups existants
        this.mapService.map.closePopup();

        // Ouvrir le popup sur l'arrêt
        L.popup({
            autoClose: true,
            closeOnClick: true,
            maxWidth: 350,
            className: 'detailed-popup'
        })
            .setLatLng(stopLatLng)
            .setContent(popupContent)
            .openOn(this.mapService.map);

        // Centrer la carte sur l'arrêt (optionnel - vous pouvez commenter si vous préférez)
        this.mapService.map.setView(stopLatLng, 17, {
            animate: true,
            duration: 1
        });

        // Ajouter un effet de surbrillance subtil sur l'arrêt (optionnel)
        this.highlightStop(nearestStop);

        // Cacher l'indicateur de recherche
        this.hideSearchIndicator();

        // Afficher une notification de confirmation
        this.showNotification(
            "✅ Arrêt trouvé", 
            `${nearestStop.name} est à ${Math.round(minDistance)} mètres`,
            'success'
        );
    }

    /**
     * Crée un popup détaillé pour l'arrêt le plus proche
     */
    createDetailedStopPopup(stop, distance, walkingTime, walkingTimeSeconds, busLines, nearbyStops, secondNearest, secondMinDistance) {
        const distanceFormatted = distance < 1000 
            ? `${Math.round(distance)} m` 
            : `${(distance / 1000).toFixed(1)} km`;
        
        const walkingTimeFormatted = walkingTime < 60 
            ? `${walkingTime} min` 
            : `${Math.floor(walkingTime / 60)}h ${walkingTime % 60}min`;

        // Calculer l'heure d'arrivée estimée
        const now = new Date();
        const arrivalTime = new Date(now.getTime() + walkingTimeSeconds * 1000);
        const arrivalTimeFormatted = arrivalTime.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Déterminer le type d'arrêt
        let stopType = "Arrêt standard";
        let stopIcon = "🛑";
        if (busLines.length === 2) {
            stopType = "Arrêt principal (correspondance)";
            stopIcon = "🔄";
        } else if (busLines.includes('BUS 4 (Jaune)')) {
            stopType = "Arrêt BUS 4";
        } else if (busLines.includes('BUS 8 (Verte)')) {
            stopType = "Arrêt BUS 8";
        }

        return `
            <div class="detailed-popup-container">
                <!-- En-tête -->
                <div class="popup-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div class="popup-header-icon">${stopIcon}</div>
                    <div class="popup-header-title">Arrêt le plus proche</div>
                </div>
                
                <!-- Corps principal -->
                <div class="popup-body">
                    <!-- Nom et type -->
                    <div class="stop-name-section">
                        <div class="stop-name">${stop.name}</div>
                        <div class="stop-type">${stopType}</div>
                    </div>
                    
                    <!-- Distance et temps -->
                    <div class="distance-section">
                        <div class="distance-item">
                            <span class="material-icons distance-icon">straighten</span>
                            <div class="distance-info">
                                <span class="distance-label">Distance</span>
                                <span class="distance-value">${distanceFormatted}</span>
                            </div>
                        </div>
                        <div class="distance-item">
                            <span class="material-icons distance-icon">directions_walk</span>
                            <div class="distance-info">
                                <span class="distance-label">À pied</span>
                                <span class="distance-value">~${walkingTimeFormatted}</span>
                            </div>
                        </div>
                        <div class="distance-item">
                            <span class="material-icons distance-icon">schedule</span>
                            <div class="distance-info">
                                <span class="distance-label">Arrivée estimée</span>
                                <span class="distance-value">${arrivalTimeFormatted}</span>
                            </div>
                        </div>
                    </div>
                    
                 
                    
                    <!-- Autres arrêts à proximité -->
                    ${nearbyStops.length > 0 ? `
                        <div class="nearby-stops-section">
                            <div class="section-title">
                                <span class="material-icons">near_me</span>
                                Arrêts à proximité
                            </div>
                            <div class="nearby-stops">
                                ${nearbyStops.map(nearby => {
                                    const nearbyDist = this.userCoords.distanceTo(L.latLng(nearby.coords[0], nearby.coords[1]));
                                    return `
                                        <div class="nearby-stop-item" onclick="window.geolocationManager.goToStop('${nearby.name}')">
                                            <span class="nearby-stop-name">${nearby.name}</span>
                                            <span class="nearby-stop-distance">${Math.round(nearbyDist)} m</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Boutons d'action -->
                    <div class="popup-actions">
                        <button class="action-btn primary" onclick="window.geolocationManager.calculateRouteToStop('${stop.name}')">
                            <span class="material-icons">directions</span>
                            Itinéraire
                        </button>
                        <button class="action-btn secondary" onclick="window.favoritesManager.add('${stop.name}')">
                            <span class="material-icons">star_border</span>
                            Favori
                        </button>
                    </div>
                    
                    <!-- Note d'information -->
                    <div class="popup-note">
                        <span class="material-icons">info</span>
                        Les temps sont estimés à 5km/h (vitesse moyenne de marche)
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Met en surbrillance un arrêt (optionnel - version subtile)
     */
    highlightStop(stop) {
        const stopLatLng = L.latLng(stop.coords[0], stop.coords[1]);
        
        // Ajouter un cercle très subtil
        const highlightCircle = L.circle(stopLatLng, {
            radius: 15,
            color: '#667eea',
            fillColor: '#667eea',
            fillOpacity: 0.1,
            weight: 2,
            opacity: 0.3,
            className: 'subtle-highlight'
        }).addTo(this.mapService.map);

        // Supprimer après 2 secondes
        setTimeout(() => {
            this.mapService.map.removeLayer(highlightCircle);
        }, 2000);
    }

    /**
     * Affiche un indicateur de recherche
     */
    showSearchIndicator() {
        const btn = document.getElementById('nearestStopBtn');
        btn.classList.add('loading');
        btn.disabled = true;
    }

    /**
     * Cache l'indicateur de recherche
     */
    hideSearchIndicator() {
        const btn = document.getElementById('nearestStopBtn');
        btn.classList.remove('loading');
        btn.disabled = false;
    }

    /**
     * Affiche une notification
     */
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
        }, 3000);
    }

    /**
     * Calcule l'itinéraire vers un arrêt
     */
    calculateRouteToStop(stopName) {
        const endInput = document.getElementById('endInput');
        if (endInput) {
            endInput.value = stopName;
            
            // Ouvrir le modal et déclencher le calcul
            const routeModal = document.getElementById('routeModal');
            if (routeModal) {
                routeModal.style.display = 'block';
            }
            
            // Déclencher le calcul d'itinéraire
            setTimeout(() => {
                const traceBtn = document.getElementById('traceBtn');
                if (traceBtn) {
                    traceBtn.click();
                }
            }, 500);
        }
    }

    /**
     * Va directement à un arrêt
     */
    goToStop(stopName) {
        const busManager = window.busManager;
        const allStops = busManager.getAllStops();
        const stop = allStops.find(s => s.name === stopName);
        
        if (stop) {
            this.mapService.map.setView([stop.coords[0], stop.coords[1]], 18, {
                animate: true,
                duration: 1
            });
            
            // Ouvrir le popup de l'arrêt
            setTimeout(() => {
                L.popup()
                    .setLatLng([stop.coords[0], stop.coords[1]])
                    .setContent(`
                        <div class="popup-container">
                            <div class="popup-title">🛑 ${stop.name}</div>
                            <div class="popup-content">Arrêt sélectionné</div>
                        </div>
                    `)
                    .openOn(this.mapService.map);
            }, 500);
        }
    }

    startTracking(initialLoad = false, centerImmediately = false) {
        if (!navigator.geolocation) {
            this.showNotification(
                "Géolocalisation non supportée", 
                "Votre navigateur ne supporte pas la géolocalisation",
                'error'
            );
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
        } 
        else if (this.watchId === null) {
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
                <div class="popup-content" style="font-size: 11px; color: #999;">
                    ${new Date().toLocaleTimeString()}
                </div>
            </div>
        `, {
            autoClose: true,
            closeOnClick: true,
            autoPan: true
        });

        this.userMarker.on('click', () => {
            this.userMarker.openPopup();
        });

        this.accuracyCircle = L.circle(this.userCoords, {
            radius: accuracy,
            color: COLORS.primary,
            fillColor: COLORS.primary,
            fillOpacity: 0.15,
            weight: 1,
            className: 'accuracy-circle'
        }).addTo(this.mapService.map);
    }

    updateUserMarker(accuracy) {
        this.userMarker.setLatLng(this.userCoords);
        this.accuracyCircle.setLatLng(this.userCoords);
        this.accuracyCircle.setRadius(accuracy);
        
        this.userMarker.setPopupContent(`
            <div class="popup-container">
                <div class="popup-title">📍 Ma position</div>
                <div class="popup-content">Vous êtes ici</div>
                <div class="popup-content" style="font-size: 11px; color: #999;">
                    ${new Date().toLocaleTimeString()}
                </div>
            </div>
        `);
    }

    onPositionError(error) {
        console.warn("Erreur de géolocalisation:", error.message);
        
        let errorMessage = "Impossible d'obtenir votre position.";
        
        switch(error.code) {
            case 1:
                errorMessage = "Accès à la position refusé. Veuillez autoriser la géolocalisation.";
                break;
            case 2:
                errorMessage = "Position indisponible. Vérifiez votre connexion GPS.";
                break;
            case 3:
                errorMessage = "Délai d'attente dépassé. Réessayez.";
                break;
        }
        
        this.showNotification("Erreur de localisation", errorMessage, 'error');
    }

    getCurrentCoords() {
        return this.userCoords;
    }
}

/**
 * ======================================================================
 * SECTION 6 : GESTION DES ITINÉRAIRES
 * ======================================================================
 */

class RouteManager {
    constructor(mapService, geolocationManager) {
        this.mapService = mapService;
        this.geolocationManager = geolocationManager;
        this.routeLine = null;
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

            this.clearRoute();

            this.routeLine = L.polyline(routeCoords, {
                color: COLORS.primary,
                weight: 6,
                opacity: 0.9,
                lineJoin: "round",
                lineCap: "round"
            }).addTo(this.mapService.map);

            this.mapService.map.fitBounds(this.routeLine.getBounds(), {
                padding: [60, 60]
            });

            const distance = Math.round(route.distance);
            const duration = Math.round(route.duration / 60);

            L.popup()
                .setLatLng([destLat, destLng])
                .setContent(`
                    <div class="popup-container">
                        <div class="popup-title">${matchedStop.name}</div>
                        <div class="popup-content">Distance : ${distance} m</div>
                        <div class="popup-content">Durée : ~${duration} min à pied</div>
                    </div>
                `)
                .openOn(this.mapService.map);

        } catch (error) {
            alert("Erreur lors du calcul de l'itinéraire.");
            console.error("Erreur de routage:", error);
        }
    }

    clearRoute() {
        if (this.routeLine) {
            this.mapService.map.removeLayer(this.routeLine);
            this.routeLine = null;
        }
    }
}

/**
 * ======================================================================
 * SECTION 7 : GESTION DES FAVORIS
 * ======================================================================
 */

class FavoritesManager {
    constructor() {
        this.storageKey = "bus_favorites";
    }

    add(stopName) {
        let favorites = this.getAll();
        
        if (!favorites.includes(stopName)) {
            favorites.push(stopName);
            localStorage.setItem(this.storageKey, JSON.stringify(favorites));
            alert("⭐ Arrêt ajouté aux favoris");
        }
    }

    remove(stopName) {
        let favorites = this.getAll();
        favorites = favorites.filter(f => f !== stopName);
        localStorage.setItem(this.storageKey, JSON.stringify(favorites));
    }

    getAll() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    isFavorite(stopName) {
        return this.getAll().includes(stopName);
    }
}

/**
 * ======================================================================
 * SECTION 8 : CONTRÔLES DE LA CARTE (MODIFIÉ POUR GÉRER LES POPUPS)
 * ======================================================================
 */

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
            "🅿️ Parkings": this.mapService.layers.parking,
            "🚍 Suivre BUS 4 uniquement": this.mapService.layers.followBus4,
            "🚍 Suivre BUS 8 uniquement": this.mapService.layers.followBus8
        };

        L.control.layers(baseMaps, overlayMaps, { collapsed: true }).addTo(this.mapService.map);
    }

    /**
     * Configure un gestionnaire global pour fermer tous les popups
     */
    setupGlobalClickHandler() {
        // Fermer tous les popups quand on clique sur la carte (en dehors des marqueurs)
        this.mapService.map.on('click', (e) => {
            // Vérifier si le clic n'est pas sur un marqueur
            if (!e.originalEvent.target.classList.contains('leaflet-marker-icon')) {
                this.mapService.map.closePopup();
            }
        });

        // Fermer les popups quand on change de couche
        this.mapService.map.on('overlayadd overlayremove', () => {
            this.mapService.map.closePopup();
        });
    }
}

/**
 * ======================================================================
 * SECTION 9 : INITIALISATION DE L'APPLICATION (MODIFIÉE)
 * ======================================================================
 */

class Application {
    async init() {
        console.log("🚀 Initialisation de l'application...");

        this.showLoadingMessage();

        this.mapService = new MapService();
        this.favoritesManager = new FavoritesManager();
        this.busManager = new BusManager(this.mapService);
        
        this.geolocationManager = new GeolocationManager(this.mapService);
        window.geolocationManager = this.geolocationManager;
        
        this.routeManager = new RouteManager(this.mapService, this.geolocationManager);
        this.mapControls = new MapControls(this.mapService);
        
        // Initialiser le SearchManager
        this.searchManager = new SearchManager(this.mapService, this.geolocationManager);
        window.searchManager = this.searchManager;

        window.busManager = this.busManager;
        window.favoritesManager = this.favoritesManager;

        setTimeout(() => {
            this.startBusAnimations();
            this.hideLoadingMessage();
        }, 2000);

        console.log("✅ Application initialisée avec succès");
    }
    // ... reste du code


    showLoadingMessage() {
        // Créer un indicateur de chargement
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
                <span class="material-icons" style="color: #667eea; font-size: 40px;">my_location</span>
            </div>
            <div style="font-weight: bold; margin-bottom: 5px;">Recherche de votre position...</div>
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
        // Bus 4
        this.busManager.animateBus(
            'bus4',
            BUS_STOPS.bus4,
            BUS_TYPES.bus4,
            this.mapService.layers.bus4Line
        );

        // Bus 8
        this.busManager.animateBus(
            'bus8',
            BUS_STOPS.bus8,
            BUS_TYPES.bus8,
            this.mapService.layers.bus8Line
        );
    }
}

/**
 * ======================================================================
 * SECTION 10 : DÉMARRAGE DE L'APPLICATION
 * ======================================================================
 */

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    app.init().catch(error => {
        console.error("❌ Erreur lors de l'initialisation:", error);
    });
});


 /**
 * ======================================================================
 * SECTION 10 : GESTIONNAIRE DE RECHERCHE ET LISTE DES ARRÊTS
 * ======================================================================
 */

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
    }

    getAllStops() {
        // Récupérer tous les arrêts avec leurs lignes
        const bus4Stops = BUS_STOPS.bus4.map(stop => ({
            ...stop,
            lines: ['BUS 4']
        }));

        const bus8Stops = BUS_STOPS.bus8.map(stop => ({
            ...stop,
            lines: ['BUS 8']
        }));

        // Fusionner et éviter les doublons (arrêts communs aux deux lignes)
        const stopsMap = new Map();
        
        [...bus4Stops, ...bus8Stops].forEach(stop => {
            if (stopsMap.has(stop.name)) {
                // Arrêt existant, ajouter la ligne
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
        // Bouton menu pour ouvrir le drawer
        document.getElementById('menuToggle').addEventListener('click', () => {
            this.openDrawer();
        });

        // Fermer le drawer
        document.getElementById('closeDrawer').addEventListener('click', () => {
            this.closeDrawer();
        });

        document.getElementById('drawerOverlay').addEventListener('click', () => {
            this.closeDrawer();
        });

        // Recherche dans le drawer
        document.getElementById('drawerSearchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.renderStopsList();
        });

        // Tabs du drawer
        document.querySelectorAll('.drawer-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                this.renderStopsList();
            });
        });

        // Recherche principale avec autocomplete
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

        // Cacher les suggestions quand on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                suggestionsList.classList.remove('show');
            }
        });

        // Bouton de recherche
        document.getElementById('searchBtn').addEventListener('click', () => {
            const searchTerm = document.getElementById('searchStop').value;
            if (searchTerm) {
                this.searchAndGoToStop(searchTerm);
            }
        });

        // Recherche avec Entrée
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
        } else {
            alert('Arrêt non trouvé. Veuillez réessayer.');
        }
    }

    goToStop(stopName) {
        const stop = this.allStops.find(s => s.name === stopName);
        if (!stop) return;

        // Fermer les suggestions et le drawer
        document.getElementById('suggestionsList').classList.remove('show');
        this.closeDrawer();

        // Centrer la carte sur l'arrêt
        this.mapService.map.setView(stop.coords, 18, {
            animate: true,
            duration: 1
        });

        // Ouvrir un popup sur l'arrêt
        setTimeout(() => {
            const distance = this.geolocationManager.userCoords 
                ? Math.round(this.geolocationManager.userCoords.distanceTo(L.latLng(stop.coords)))
                : null;

            const distanceText = distance ? `<div class="popup-content">Distance: ${distance} m</div>` : '';

            L.popup({
                autoClose: true,
                closeOnClick: true
            })
                .setLatLng(stop.coords)
                .setContent(`
                    <div class="popup-container">
                        <div class="popup-title">🛑 ${stop.name}</div>
                        <div class="popup-content">Lignes: ${stop.lines.join(' - ')}</div>
                        ${distanceText}
                        <button class="popup-btn" onclick="searchManager.addToFavorites('${stop.name}')">
                            ⭐ Ajouter aux favoris
                        </button>
                    </div>
                `)
                .openOn(this.mapService.map);
        }, 500);
    }

    addToFavorites(stopName) {
        window.favoritesManager.add(stopName);
        this.loadFavorites();
        this.renderStopsList();
    }

    removeFromFavorites(stopName) {
        window.favoritesManager.remove(stopName);
        this.loadFavorites();
        this.renderStopsList();
    }

    toggleFavorite(stopName) {
        if (this.favorites.includes(stopName)) {
            this.removeFromFavorites(stopName);
        } else {
            this.addToFavorites(stopName);
        }
    }

    getFilteredStops() {
        let stops = this.allStops;

        // Filtrer par onglet
        if (this.currentTab === 'bus4') {
            stops = stops.filter(stop => stop.lines.includes('BUS 4'));
        } else if (this.currentTab === 'bus8') {
            stops = stops.filter(stop => stop.lines.includes('BUS 8'));
        } else if (this.currentTab === 'favorites') {
            stops = stops.filter(stop => this.favorites.includes(stop.name));
        }

        // Filtrer par recherche
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
            
            // Calculer la distance si la position utilisateur est disponible
            let distanceText = '';
            if (this.geolocationManager.userCoords) {
                const distance = Math.round(this.geolocationManager.userCoords.distanceTo(
                    L.latLng(stop.coords[0], stop.coords[1])
                ));
                distanceText = `
                    <div class="stop-card-distance">
                        <span class="material-icons">straighten</span>
                        ${distance} m
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

    openDrawer() {
        document.getElementById('stopsDrawer').classList.add('open');
        document.getElementById('drawerOverlay').classList.add('active');
        this.renderStopsList(); // Rafraîchir la liste
    }

    closeDrawer() {
        document.getElementById('stopsDrawer').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('active');
    }
}

// Ajouter cette ligne à la fin du fichier pour rendre le searchManager accessible globalement
window.searchManager = null;
