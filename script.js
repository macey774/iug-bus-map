/**********************************************************
 * 1?? INITIALISATION DE LA CARTE
 **********************************************************/

// Création de la carte centrée sur l'IUG
const map = L.map('map').setView([4.040770, 9.752837], 14);

// Fond de carte OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; Mabel Cédric Yvan'
}).addTo(map);


/**********************************************************
 * 2?? DÉFINITION DES ICÔNES
 **********************************************************/

// Arrêts BUS 4 (jaune)
const bus4StopIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Arrêts BUS 8 (vert)
const bus8StopIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Bus en mouvement
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

/**********************************************************
 * ?? ARRÊTS BUS 4 — TRAJET RÉEL DEMANDÉ
 * Campus C ? Arrêts BUS 8 ? Arrêts propres BUS 4 ? Campus C
 **********************************************************/

const bus4Stops = [

    // ?? Départ Campus
    { name: "Campus C", coords: [4.039735, 9.751857] },

    // ?? Arrêts BUS 8 (ordre demandé)
    { name: "Carrefour Chefferie", coords: [4.024806, 9.769245] },
    { name: "Saint Nicolas", coords: [4.020080, 9.761518] },
    { name: "Total Danger", coords: [4.012732, 9.757205] },
    { name: "Village Ndogpassi (Station Bocom)", coords: [4.007123, 9.756094] },

    // ?? Arrêts propres BUS 4
    { name: "Tradex Borne 10", coords: [3.998247, 9.768313] },
    { name: "Carrefour Ari", coords: [3.995235, 9.782917] },
    { name: "Tradex Yassa", coords: [4.001153, 9.805164] },
    { name: "Entrée MAETUR Yassa", coords: [4.009370, 9.800646] },
    { name: "Total Nkolmbong", coords: [4.018734, 9.795956] },
    { name: "Carrefour Nyalla Pariso", coords: [4.024639, 9.793029] },
    { name: "Château Nyalla", coords: [4.033330, 9.786290] },
    { name: "Rails Nyalla", coords: [4.034902, 9.777759] },

    // ?? Retour Campus (fermeture de boucle)
    { name: "Campus C", coords: [4.039735, 9.751857] }
];


const bus8Stops = [
  
  
    { name: "Village Ndogpassi (Station Bocom)", coords: [4.007123, 9.756094] },
    { name: "Total Danger", coords: [4.012732, 9.757205] },
    { name: "Saint Nicolas", coords: [4.020080, 9.761518] },
    { name: "Carrefour Chefferie", coords: [4.024806, 9.769245] },
  
  // ?? Retour Campus (fermeture de boucle)
    { name: "Campus C", coords: [4.039735, 9.751857] }
];

// Campus
const campuses = [
    { name: "Campus C", coords: [4.039735, 9.751857] },
    { name: "Campus A et B", coords: [4.042103, 9.753392] }
];

// Parkings
const parkings = [
    { name: "Parking bus IUG", coords: [4.040770, 9.752837] },
    { name: "Parking Campus A", coords: [4.041985, 9.754494] }
];


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
 * 6?? LIGNES DES TRAJETS
 **********************************************************/

// Lignes visibles
L.polyline(bus4Stops.map(s => s.coords), { color: 'yellow', weight: 5 }).addTo(bus4LineLayer);
L.polyline(bus8Stops.map(s => s.coords), { color: 'green', weight: 5 }).addTo(bus8LineLayer);

// Ligne invisible (connexion logique entre Bus 8 et Bus 4)
L.polyline([
    [4.007123, 9.756094],
    [3.998247, 9.768313]
], { opacity: 0 }).addTo(map);


/**********************************************************
 * 7?? FONCTIONS UTILITAIRES
 **********************************************************/

function interpolateRoute(coords, steps = 25) {
    let result = [];
    for (let i = 0; i < coords.length - 1; i++) {
        for (let j = 0; j <= steps; j++) {
            result.push([
                coords[i][0] + (coords[i + 1][0] - coords[i][0]) * j / steps,
                coords[i][1] + (coords[i + 1][1] - coords[i][1]) * j / steps
            ]);
        }
    }
    return result;
}

function formatTime(minutes) {
    return minutes < 60 ? minutes + " min" : Math.floor(minutes / 60) + "h " + (minutes % 60) + " min";
}

/***************************************************************/
function findNearestStop(userLatLng, stops) {
    let nearest = null;
    let minDist = Infinity;

    stops.forEach(stop => {
        const d = userLatLng.distanceTo(L.latLng(stop.coords));
        if (d < minDist) {
            minDist = d;
            nearest = { ...stop, distance: d };
        }
    });

    return nearest;
}

/**************************************************************/
function calculateETA(busLatLng, stopCoords, speedMs) {
    if (!stopCoords) return "—";
    const distance = busLatLng.distanceTo(L.latLng(stopCoords)); // mètres
    const seconds = distance / speedMs;
    const minutes = Math.round(seconds / 60);
    return minutes <= 1 ? "Imminent" : minutes + " min";
}


/**********************************************************
 * 8?? ANIMATION BUS 4 (TOUT LE TRAJET BUS 8 + SES PROPRES ARRÊTS)
 **********************************************************/

function animateBus4Loop(combinedStops, speed, label, busType) {

    // Crée la route fluide
    const route = interpolateRoute(combinedStops.map(s => s.coords));
    let pointIndex = 0;
    let stopIndex = 0;
    let waiting = false;

    // Marker du bus
    const marker = L.marker(route[0], { icon: busIcon }).addTo(map);

    setInterval(() => {
        if (waiting) return;

        // Déplacement
        marker.setLatLng(route[pointIndex]);

        // Arrêt actuel et prochain arrêt
        const current = combinedStops[stopIndex].name;
        const next = combinedStops[(stopIndex + 1) % combinedStops.length].name;

        // Popup dynamique
        marker.bindPopup(
            "?? " + label +
            "<br><b>Type :</b> " + busType +
            "<br><b>Arrêt actuel :</b> " + current +
            "<br><b>Prochain arrêt :</b> " + next
        );

        pointIndex++;

        // Pause 2 secondes à chaque arrêt
        if (pointIndex % 25 === 0) {
            waiting = true;
            setTimeout(() => {
                stopIndex = (stopIndex + 1) % combinedStops.length;
                waiting = false;
            }, 2000);
        }

        // Rebouclage
        if (pointIndex >= route.length - 1) {
            pointIndex = 0;
            stopIndex = 0;
        }

    }, speed);
}



/*********************************************************/
function arrivalAlert(busLatLng, stopCoords, stopName) {
    const distance = busLatLng.distanceTo(L.latLng(stopCoords));
    if (distance < 200) {
        alert("?? Le bus arrive à l’arrêt : " + stopName);
        return true;
    }
    return false;
}


/************************************************************/

/**********************************************************
 * 9?? ANIMATION BUS 8 (ALLER / RETOUR)
 **********************************************************/

function animateBus8(stops, speed, label, busType) {

    let direction = 1;
    let stopIndex = 0;
    let waiting = false;

    let route = interpolateRoute(stops.map(s => s.coords));
    let pointIndex = 0;

    const marker = L.marker(route[0], { icon: busIcon }).addTo(map);

    setInterval(() => {
        if (waiting) return;

        marker.setLatLng(route[pointIndex]);

        const current = stops[stopIndex]?.name || "—";
        const next = stops[stopIndex + direction]?.name || "Terminus";

        marker.bindPopup(
            "?? " + label +
            "<br><b>Type :</b> " + busType +
            "<br><b>Arrêt actuel :</b> " + current +
            "<br><b>Prochain arrêt :</b> " + next
        );

        pointIndex++;

        if (pointIndex % 25 === 0 && stopIndex < stops.length - 1) {
            waiting = true;
            setTimeout(() => {
                stopIndex += direction;
                waiting = false;
            }, 2000);
        }

        // Changement de direction pour aller / retour
        if (pointIndex >= route.length - 1) {
            direction *= -1;
            stops.reverse();
            route = interpolateRoute(stops.map(s => s.coords));
            pointIndex = 0;
            stopIndex = 0;
        }

    }, speed);
}


/**********************************************************
 * ?? LANCEMENT DES BUS
 **********************************************************/

// BUS 4 ? boucle complète incluant les arrêts du BUS 8
const bus4CombinedRoute = [
    { name: "Campus C", coords: [4.039735, 9.751857] }, // Départ
    ...bus8Stops,  // Passe par tous les arrêts du bus 8
    ...bus4Stops   // Ensuite ses propres arrêts
];
animateBus4Loop(bus4CombinedRoute, 80, "BUS 4", "Socatur");

// BUS 8 ? Aller / retour normal
animateBus8(bus8Stops, 90, "BUS 8", "Coaster");


/**********************************************************
 * ??? TITRE PROFESSIONNEL – CONTRÔLE DES COUCHES
 **********************************************************/

const layersInfo = L.control({ position: 'topright' });

layersInfo.onAdd = function () {
    const div = L.DomUtil.create('div', 'layers-info');
    div.innerHTML = `
        <div style="
            background: rgba(255,255,255,0.95);
            padding: 8px 12px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            font-size: 13px;
            line-height: 1.4;
            margin-bottom: 6px;
        ">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">
                ??? Gestion de la carte
            </div>
            <div style="font-size: 12px; color: #555;">
                Active ou désactive les éléments<br>
                (bus, lignes, campus, parkings)
            </div>
        </div>
    `;
    return div;
};

layersInfo.addTo(map);


/**********************************************************
 * 1??1?? CONTRÔLE DES COUCHES
 **********************************************************/

L.control.layers(null, {
    "?? Arrêts BUS 4": bus4Layer,
    "?? Arrêts BUS 8": bus8Layer,
    "?? Ligne BUS 4": bus4LineLayer,
    "?? Ligne BUS 8": bus8LineLayer,
    "?? Campus": campusLayer,
    "??? Parkings": parkingLayer
}).addTo(map);











let userMarker = null;

document.getElementById("locateBtn").onclick = () => {
    map.locate({ enableHighAccuracy: true });
};

map.on('locationfound', e => {
    if (userMarker) map.removeLayer(userMarker);

    userMarker = L.circleMarker(e.latlng, {
        radius: 7,
        color: 'blue',
        fillOpacity: 0.7
    }).addTo(map).bindPopup("?? Vous êtes ici").openPopup();

    const nearest = findNearestStop(e.latlng, bus8Stops);
    if (nearest) {
        L.popup()
            .setLatLng(nearest.coords)
            .setContent(
                "?? Arrêt le plus proche<br><b>" +
                nearest.name +
                "</b><br>?? " +
                Math.round(nearest.distance) +
                " m"
            )
            .openOn(map);
    }
});













