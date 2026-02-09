/**********************************************************
 * 1?? INITIALISATION DE LA CARTE
 **********************************************************/

const map = L.map('map').setView([4.040770, 9.752837], 18);

L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
).addTo(map);

const carIcon = L.icon({
    iconUrl: 'car.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

/**********************************************************
 * 2?? DÉFINITION DES ICÔNES
 **********************************************************/

const bus4StopIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const bus8StopIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const busIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61231.png',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

/**********************************************************
 * 3?? LAYERS
 **********************************************************/

const bus4Layer = L.layerGroup().addTo(map);
const bus8Layer = L.layerGroup().addTo(map);
const bus4LineLayer = L.layerGroup().addTo(map);
const bus8LineLayer = L.layerGroup().addTo(map);
const campusLayer = L.layerGroup().addTo(map);
const parkingLayer = L.layerGroup().addTo(map);

/**********************************************************
 * 4?? ARRÊTS
 **********************************************************/

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


// ?? Tracé ligne BUS 4 (OSRM)
getOSRMRoute(bus4Stops.map(s => s.coords)).then(route => {
    L.polyline(route, { color: 'yellow', weight: 5, opacity: 0.9 }).addTo(bus4LineLayer);
});

// ?? Tracé ligne BUS 8 (OSRM)
getOSRMRoute(bus8Stops.map(s => s.coords)).then(route => {
    L.polyline(route, { color: 'green', weight: 5, opacity: 0.9 }).addTo(bus8LineLayer);
});


/**********************************************************
 * 5?? AJOUT DES MARKERS
 **********************************************************/

bus4Stops.forEach(s => L.marker(s.coords, { icon: bus4StopIcon }).addTo(bus4Layer)
    .bindPopup("?? BUS 4<br><b>" + s.name + "</b>"));
bus8Stops.forEach(s => L.marker(s.coords, { icon: bus8StopIcon }).addTo(bus8Layer)
    .bindPopup("?? BUS 8<br><b>" + s.name + "</b>"));
campuses.forEach(c => L.marker(c.coords).addTo(campusLayer).bindPopup("?? " + c.name));
parkings.forEach(p => L.marker(p.coords).addTo(parkingLayer).bindPopup("??? " + p.name));

/**********************************************************
 * 6?? FONCTIONS UTILITAIRES
 **********************************************************/

async function getOSRMRoute(coords) {
    try {
        const points = coords.map(c => `${c[1]},${c[0]}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        if (!data.routes || !data.routes[0]) return coords;
        return data.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
    } catch (e) {
        console.error("Erreur OSRM", e);
        return coords;
    }
}

/**********************************************************
 * 7?? ANIMATION DES BUS AVEC ARRÊTS EXACTS
 **********************************************************/

function animateBusExactStops(route, stops, speed, label, busType) {
    let stopIndex = 0;
    const marker = L.marker(stops[0].coords, { icon: busIcon }).addTo(map);

    async function moveToNextStop() {
        const currentStop = stops[stopIndex];
        const nextStop = stops[(stopIndex + 1) % stops.length];

        // Trajet OSRM entre arrêt actuel et suivant
        const segment = await getOSRMRoute([currentStop.coords, nextStop.coords]);

        for (let i = 0; i < segment.length; i++) {
            marker.setLatLng(segment[i]);
            marker.bindPopup(
                `?? ${label}<br><b>Type :</b> ${busType}<br><b>Arrêt actuel :</b> ${currentStop.name}<br><b>Prochain arrêt :</b> ${nextStop.name}`
            );

            await new Promise(r => setTimeout(r, speed));
        }

        stopIndex = (stopIndex + 1) % stops.length;
        setTimeout(moveToNextStop, 2000); // pause 2 secondes à l'arrêt
    }

    moveToNextStop();
    return marker;
}

/**********************************************************
 * 8?? LANCEMENT DES BUS AVEC TRAJETS EXACTS
 **********************************************************/

let markerBus4, markerBus8;

markerBus4 = animateBusExactStops(bus4Stops, bus4Stops, 80, "BUS 4", "Socatur");
markerBus8 = animateBusExactStops(bus8Stops, bus8Stops, 90, "BUS 8", "Coaster");

/**********************************************************
 * 9?? CONTRÔLE DES COUCHES
 **********************************************************/

L.control.layers(null, {
    "?? Arrêts BUS 4": bus4Layer,
    "?? Arrêts BUS 8": bus8Layer,
    "?? Ligne BUS 4": bus4LineLayer,
    "?? Ligne BUS 8": bus8LineLayer,
    "?? Campus": campusLayer,
    "??? Parkings": parkingLayer
}).addTo(map);

/**********************************************************
 * ?? POSITION UTILISATEUR
 **********************************************************/
let userMarker = null;
document.getElementById("locateBtn").onclick = () => map.locate({ enableHighAccuracy: true });
map.on('locationfound', e => {
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.circleMarker(e.latlng, { radius: 7, color: 'blue', fillOpacity: 0.7 })
        .addTo(map).bindPopup("?? Vous êtes ici").openPopup();
});

/**********************************************************
 * 1??1?? SUIVI DU BUS LE PLUS PROCHE
 **********************************************************/
let followNearestInterval = null;
document.getElementById("followBusBtn").onclick = () => {
    if (!userMarker) { alert("?? Veuillez d'abord activer votre position !"); return; }
    const userLatLng = userMarker.getLatLng();
    const busMarkers = [markerBus4, markerBus8];

    function findNearestBus() {
        let nearestBus = null, minDistance = Infinity;
        busMarkers.forEach(bus => {
            if (!bus) return;
            const dist = userLatLng.distanceTo(bus.getLatLng());
            if (dist < minDistance) { minDistance = dist; nearestBus = bus; }
        });
        return nearestBus;
    }

    if (followNearestInterval) clearInterval(followNearestInterval);
    followNearestInterval = setInterval(() => {
        const nearestBus = findNearestBus();
        if (nearestBus) map.setView(nearestBus.getLatLng(), 16, { animate: true });
    }, 1000);

    alert("?? Suivi du bus le plus proche activé !");
};
