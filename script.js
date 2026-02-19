/******************************************************************
 * 🚌 SYSTÈME PROFESSIONNEL DE SUIVI DES BUS – VERSION OPTIMISÉE
 * Auteur : Mabel Cédric Yvan
 ******************************************************************/

/* ================================================================
   1️⃣ INITIALISATION DE LA CARTE
================================================================ */

const DEFAULT_CENTER = [4.040770, 9.752837];
const DEFAULT_ZOOM = 18;

const map = L.map("map", {
    zoomControl: true
}).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

/* ==================== FONDS DE CARTE ==================== */

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

mapSatellite.addTo(map);
mapLabels.addTo(map);

/* ================================================================
   2️⃣ DÉFINITION DES ICÔNES
================================================================ */

const carIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

const busIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61231.png",
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

const bus4StopIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const bus8StopIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

/* ================================================================
   3️⃣ LAYERS
================================================================ */

const bus4Layer = L.layerGroup().addTo(map);
const bus8Layer = L.layerGroup().addTo(map);
const bus4LineLayer = L.layerGroup().addTo(map);
const bus8LineLayer = L.layerGroup().addTo(map);
const campusLayer = L.layerGroup().addTo(map);
const parkingLayer = L.layerGroup().addTo(map);

const followBus4Layer = L.layerGroup();
const followBus8Layer = L.layerGroup();

/* ================================================================
   4️⃣ DONNÉES
================================================================ */

const bus4Stops = [
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
];

const bus8Stops = [
    { name: "Village Ndogpassi (Station Bocom)", coords: [4.007123, 9.756094] },
    { name: "Total Danger", coords: [4.012732, 9.757205] },
    { name: "Saint Nicolas", coords: [4.020080, 9.761518] },
    { name: "Carrefour Chefferie", coords: [4.024806, 9.769245] },
    { name: "Campus C", coords: [4.039735, 9.751857] }
];

const campuses = [
    { name: "Campus C", coords: [4.039735, 9.751857] },
    { name: "Campus A et B", coords: [4.042103, 9.753392] }
];

const parkings = [
    { name: "Parking bus IUG", coords: [4.040770, 9.752837] },
    { name: "Parking Campus A", coords: [4.041985, 9.754494] }
];

/* ================================================================
   5️⃣ FONCTION OSRM AVEC CACHE (OPTIMISATION PERFORMANCE)
================================================================ */

const routeCache = {};

async function getOSRMRoute(coords) {

    const key = JSON.stringify(coords);

    if (routeCache[key]) return routeCache[key];

    try {
        const points = coords.map(c => `${c[1]},${c[0]}`).join(";");
        const url = `https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.routes || !data.routes[0]) return coords;

        const route = data.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
        routeCache[key] = route;

        return route;

    } catch (error) {
        console.error("Erreur OSRM :", error);
        return coords;
    }
}

/* ================================================================
   6️⃣ TRACÉ DES LIGNES
================================================================ */

async function drawRoutes() {

    const route4 = await getOSRMRoute(bus4Stops.map(s => s.coords));
    const line4 = L.polyline(route4, { color: "yellow", weight: 6 });
    bus4LineLayer.addLayer(line4);
    followBus4Layer.addLayer(line4);

    const route8 = await getOSRMRoute(bus8Stops.map(s => s.coords));
    const line8 = L.polyline(route8, { color: "green", weight: 6 });
    bus8LineLayer.addLayer(line8);
    followBus8Layer.addLayer(line8);
}

drawRoutes();

/* ================================================================
   7️⃣ AJOUT DES MARKERS
================================================================ */

function addMarkers() {

    bus4Stops.forEach(stop => {
        L.marker(stop.coords, { icon: bus4StopIcon })
            .addTo(bus4Layer)
            .bindPopup(`
                🛑 BUS 4<br>
                <b>${stop.name}</b><br>
                <button onclick="addFavorite('${stop.name}')">⭐ Favori</button>
            `);
    });

    bus8Stops.forEach(stop => {
        L.marker(stop.coords, { icon: bus8StopIcon })
            .addTo(bus8Layer)
            .bindPopup(`
                🛑 BUS 8<br>
                <b>${stop.name}</b><br>
                <button onclick="addFavorite('${stop.name}')">⭐ Favori</button>
            `);
    });

    campuses.forEach(c =>
        L.marker(c.coords).addTo(campusLayer).bindPopup("🎓 " + c.name)
    );

    parkings.forEach(p =>
        L.marker(p.coords).addTo(parkingLayer).bindPopup("🅿️ " + p.name)
    );
}

addMarkers();

/* ================================================================
   🚀 ANIMATION ULTRA FLUIDE (SANS PAUSE OSRM)
   - 1 seul calcul OSRM
   - Mouvement continu
================================================================ */

async function animateBusSmooth(stops, speed, label, company, colorLayer) {

    // 1️⃣ On calcule UNE SEULE FOIS toute la route complète
    const fullRoute = await getOSRMRoute(stops.map(s => s.coords));

    let index = 0;

    const marker = L.marker(fullRoute[0], { icon: busIcon }).addTo(map);

    function move() {

        marker.setLatLng(fullRoute[index]);

        // 🔍 Détection arrêt le plus proche
        let closestStop = null;
        let minDistance = Infinity;

        stops.forEach(stop => {
            const distance = map.distance(fullRoute[index], stop.coords);
            if (distance < minDistance) {
                minDistance = distance;
                closestStop = stop;
            }
        });

        marker.bindPopup(`
            🚌 ${label}<br>
            <b>Compagnie :</b> ${company}<br>
            <b>Position :</b> En circulation<br>
            <b>Arrêt proche :</b> ${closestStop?.name || "—"}
        `);

        index++;

        if (index >= fullRoute.length) {
            index = 0; // boucle infinie
        }

        requestAnimationFrame(() => {
            setTimeout(move, speed);
        });
    }

    move();

    return marker;
}

/* ================================================================
   🎬 LANCEMENT DES BUS
================================================================ */
/*
const markerBus4 = animateBusSmooth(
    bus4Stops,
    20,               // plus petit = plus rapide
    "BUS 4",
    "Socatur",
    bus4LineLayer
);

const markerBus8 = animateBusSmooth(
    bus8Stops,
    22,
    "BUS 8",
    "Coaster",
    bus8LineLayer
);

*/
/* ================================================================
   9️⃣ PANNEAU DE CONTRÔLE STYLE GOOGLE MAPS
================================================================ */

const titleLayer = L.layerGroup();

const baseMaps = {
    "<b>TYPES DE CARTE</b>": titleLayer,
    "🗺️ Standard": mapStandard,
    "🛰️ Satellite": mapSatellite
};

const overlayMaps = {
    "<b>DÉTAILS</b>": titleLayer,
    "🏷️ Libellés": mapLabels,
    "🟡 Ligne BUS 4": bus4LineLayer,
    "🟢 Ligne BUS 8": bus8LineLayer,
    "🛑 Arrêts BUS 4": bus4Layer,
    "🛑 Arrêts BUS 8": bus8Layer,
    "🎓 Campus": campusLayer,
    "🅿️ Parkings": parkingLayer,
    "🚍 Suivre BUS 4 uniquement": followBus4Layer,
    "🚍 Suivre BUS 8 uniquement": followBus8Layer
};

L.control.layers(baseMaps, overlayMaps, { collapsed: true }).addTo(map);

/* ================================================================
   🔟 FAVORIS (LocalStorage)
================================================================ */

function addFavorite(stopName) {

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    if (!favorites.includes(stopName)) {

        favorites.push(stopName);
        localStorage.setItem("favorites", JSON.stringify(favorites));

        alert("⭐ Arrêt ajouté aux favoris");
    }
}
















/**********************************************************
 * 🗑 BOUTON EFFACER ITINÉRAIRE
 **********************************************************/

document.getElementById("clearRouteBtn").addEventListener("click", () => {

    // Supprimer la ligne
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }

    // Supprimer le point bleu
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }

    // Fermer les popups
    map.closePopup();

});











































































// Récupération des éléments
const routeBtn = document.getElementById('routeBtn');
const routeModal = document.getElementById('routeModal');
const closeRouteModal = document.getElementById('closeRouteModal');
const endInput = document.getElementById('endInput');



// Ouvrir la mini fenêtre quand on clique sur le bouton Itinéraire
routeBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // empêche la fermeture immédiate
    
    routeModal.style.display = 'block';
});

// Fermer la fenêtre quand on clique sur le bouton ✖
closeRouteModal.addEventListener('click', () => {
    routeModal.style.display = 'none';
});

// Fermer la fenêtre si on clique n'importe où en dehors
document.addEventListener('click', (e) => {
    if (!routeModal.contains(e.target) && e.target !== routeBtn) {
        routeModal.style.display = 'none';
    }
});



/**********************************************************
 * 📍 ARRÊT LE PLUS PROCHE
 **********************************************************/

const nearestStopBtn = document.getElementById("nearestStopBtn");

nearestStopBtn.addEventListener("click", () => {

    if (!navigator.geolocation) {
        alert("La géolocalisation n'est pas supportée.");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {

        const userLatLng = L.latLng(
            position.coords.latitude,
            position.coords.longitude
        );

        // Fusionner tous les arrêts
        const allStops = [...bus4Stops, ...bus8Stops];

        let nearestStop = null;
        let minDistance = Infinity;

        allStops.forEach(stop => {

            const stopLatLng = L.latLng(stop.coords[0], stop.coords[1]);

            // Distance en mètres (fonction native Leaflet)
            const distance = userLatLng.distanceTo(stopLatLng);

            if (distance < minDistance) {
                minDistance = distance;
                nearestStop = stop;
            }
        });

        if (!nearestStop) return;

        const stopLatLng = L.latLng(nearestStop.coords[0], nearestStop.coords[1]);

         // Popup moderne
        const popupContent = `
            <div style="
                font-family: Arial;
                text-align: center;
                padding: 8px;
            ">
                <div style="
                    font-size: 15px;
                    font-weight: bold;
                    color: #1E90FF;
                    margin-bottom: 4px;
                ">
                    Arrêt le plus proche
                </div>
                <div style="font-size: 14px;">
                   <b> ${nearestStop.name}</b>
                </div>
                <div style="
                    margin-top: 6px;
                    font-size: 13px;
                    color: #555;
                ">
                    Distance : <b>${Math.round(minDistance)} m</b>
                </div>
            </div>
        `;

        L.popup({
            closeButton: true,
            autoClose: true
        })
            .setLatLng(stopLatLng)
            .setContent(popupContent)
            .openOn(map);

        // Zoom automatique
        map.setView(stopLatLng, 22);

    }, () => {
        alert("Impossible d'obtenir votre position.");
    });

});


















// ==================== Variables globales ====================

let routeLine = null;  // ligne OSRM / polyline tracée


// Fonction pour calculer la distance en mètres entre deux points (Leaflet)
function calcDistance(latlng1, latlng2) {
    return latlng1.distanceTo(latlng2); // renvoie la distance en mètres
}

// Fonction pour calculer durée approximative à pied (5 km/h = 83.33 m/min)
function calcWalkingTime(distanceMeters) {
    const minutes = distanceMeters / 83.33;
    return Math.round(minutes);
}

/**********************************************************
 * 📍 GPS + ORIENTATION — VERSION ULTRA PRO
 **********************************************************/

let userMarker = null;
let accuracyCircle = null;
let directionMarker = null;
let userCoords = null;
let watchId = null;
let autoFollow = true;

// ==================== BOUTON ACTIVER GPS ====================

const locateBtn = document.getElementById("locateBtn");

locateBtn.addEventListener("click", () => {

    if (!navigator.geolocation) {
        alert("La géolocalisation n'est pas supportée.");
        return;
    }

    if (watchId !== null) return;

    watchId = navigator.geolocation.watchPosition(

        position => {

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            userCoords = L.latLng(lat, lng);

            if (!userMarker) {

                // 🔵 POINT BLEU CENTRAL
                userMarker = L.circleMarker(userCoords, {
                    radius: 8,
                    fillColor: "#1a73e8",
                    color: "#ffffff",
                    weight: 3,
                    fillOpacity: 1
                }).addTo(map);

                // 🔵 CERCLE STYLE GOOGLE
                accuracyCircle = L.circle(userCoords, {
                    radius: 40,
                    color: "#1a73e8",
                    fillColor: "#1a73e8",
                    fillOpacity: 0.12,
                    weight: 1
                }).addTo(map);

                // 🔺 CÔNE DIRECTION
                directionMarker = L.marker(userCoords, {
                    icon: L.divIcon({
                        className: "direction-arrow",
                        html: `<div class="arrow"></div>`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20]
                    })
                }).addTo(map);

            } else {

                userMarker.setLatLng(userCoords);
                accuracyCircle.setLatLng(userCoords);
                directionMarker.setLatLng(userCoords);
            }

            // 🚗 MODE UBER (centrage auto)
            if (autoFollow) {
                map.setView(userCoords, map.getZoom(), {
                    animate: true,
                    duration: 0.5
                });
            }

        },

        error => {
            alert("Impossible d'obtenir votre position.");
        },

        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
        }
    );

    enableOrientation(); // Active rotation
});


// ==================== ORIENTATION TÉLÉPHONE ====================

function enableOrientation() {

    function handleOrientation(event) {

        if (!directionMarker) return;

        let heading = event.alpha;

        if (heading === null) return;

        const arrow = document.querySelector(".arrow");

        if (arrow) {
            arrow.style.transform = `rotate(${heading}deg)`;
        }
    }

    // Android
    if (window.DeviceOrientationEvent && 
        typeof DeviceOrientationEvent.requestPermission !== "function") {

        window.addEventListener("deviceorientation", handleOrientation);
    }

    // iPhone
    if (typeof DeviceOrientationEvent.requestPermission === "function") {

        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === "granted") {
                    window.addEventListener("deviceorientation", handleOrientation);
                }
            })
            .catch(console.error);
    }
}


// ==================== MODE UBER INTELLIGENT ====================

// Si l'utilisateur déplace la carte → stop centrage
map.on("dragstart", () => {
    autoFollow = false;
});

// Double clic sur bouton → réactiver centrage
locateBtn.addEventListener("dblclick", () => {

    autoFollow = true;

    if (userCoords) {
        map.setView(userCoords, 18, {
            animate: true,
            duration: 0.5
        });
    }
});


// ==================== ARRÊTER LE SUIVI ====================

function stopTracking() {

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }

    if (accuracyCircle) {
        map.removeLayer(accuracyCircle);
        accuracyCircle = null;
    }

    if (directionMarker) {
        map.removeLayer(directionMarker);
        directionMarker = null;
    }

    autoFollow = true;
}



// ==================== ARRÊTER LE SUIVI (optionnel) ====================

function stopTracking() {

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }

    if (accuracyCircle) {
        map.removeLayer(accuracyCircle);
        accuracyCircle = null;
    }

    autoFollow = true;
}




// ==================== Bouton "Arrêt le plus proche" ====================
document.getElementById('nearestStopBtn').addEventListener('click', () => {
    if (!userCoords) {
        alert("Cliquez d'abord sur 'Ma position'.");
        return;
    }

    // Calculer l'arrêt le plus proche parmi bus4Stops et bus8Stops
    const allStops = bus4Stops.concat(bus8Stops);
    let nearest = allStops[0];
    let minDist = userCoords.distanceTo(L.latLng(nearest.coords));

    allStops.forEach(stop => {
        const dist = userCoords.distanceTo(L.latLng(stop.coords));
        if (dist < minDist) {
            minDist = dist;
            nearest = stop;
        }
    });

    // Créer un popup moderne sur le marker de l'arrêt
    const stopLatLng = L.latLng(nearest.coords);
    const walkingTime = calcWalkingTime(minDist);

    L.popup({autoClose: true, closeOnClick: true})
        .setLatLng(stopLatLng)
        .setContent(`
            <div class="popup-title">${nearest.name}</div>
            <div class="popup-distance">Arrêt le plus proche de vous</div>
            <div class="popup-distance">Distance : ${minDist.toFixed(0)} m</div>
            <div class="popup-distance">Durée à pied : ~${walkingTime} min</div>
        `)
        .openOn(map);

    // Recentre la carte sur l'arrêt
    map.setView(stopLatLng, 18);
});

/**********************************************************
 * 🧭 BOUTON TRACER — VRAIE ROUTE (OSRM)
 **********************************************************/



document.getElementById("traceBtn").addEventListener("click", () => {

    if (!userCoords) {
        alert("Cliquez d'abord sur 'Ma position'.");
        return;
    }

    const destinationText = document.getElementById("endInput").value.trim().toLowerCase();
    if (!destinationText) {
        alert("Veuillez entrer un arrêt.");
        return;
    }

    const allStops = [...bus4Stops, ...bus8Stops];

    const matchedStop = allStops.find(stop =>
        stop.name.toLowerCase().includes(destinationText)
    );

    if (!matchedStop) {
        alert("Arrêt introuvable.");
        return;
    }

    const destLat = matchedStop.coords[0];
    const destLng = matchedStop.coords[1];

    // URL OSRM
    const url = `https://router.project-osrm.org/route/v1/foot/${userCoords.lng},${userCoords.lat};${destLng},${destLat}?overview=full&geometries=geojson`;

    fetch(url)
        .then(response => response.json())
        .then(data => {

            if (!data.routes || data.routes.length === 0) {
                alert("Itinéraire non disponible.");
                return;
            }

            const route = data.routes[0];

            const routeCoords = route.geometry.coordinates.map(coord => [
                coord[1], coord[0]
            ]);

            // Supprimer ancienne route
            if (routeLine) {
                map.removeLayer(routeLine);
            }

            // Tracé réel suivant la route
            routeLine = L.polyline(routeCoords, {
                color: "#4285F4",
                weight: 6,
                opacity: 0.9,
                lineJoin: "round",
                lineCap: "round"
            }).addTo(map);

            // Zoom automatique
            map.fitBounds(routeLine.getBounds(), {
                padding: [60, 60]
            });

            // Distance et durée réelles (OSRM)
            const distance = route.distance; // en mètres
            const duration = route.duration; // en secondes

            const distanceMeters = Math.round(distance);
            const durationMinutes = Math.round(duration / 60);

            // Popup moderne sur l'arrêt
            L.popup()
                .setLatLng([destLat, destLng])
                .setContent(`
                    <div class="popup-title">${matchedStop.name}</div>
                    <div class="popup-distance">
                        <span>Distance</span> : ${distanceMeters} m
                    </div>
                    <div class="popup-duration">
                        <span>Durée</span> : ~${durationMinutes} min à pied
                    </div>
                `)
                .openOn(map);

        })
        .catch(() => {
            alert("Erreur lors du calcul de l'itinéraire.");
        });

});


