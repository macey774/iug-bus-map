/* =========================================================
   🌍 GLOBAL RESET
========================================================= */

* {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent; /* Supprime flash bleu mobile */
}

html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    font-family: 'Arial', sans-serif;
}

body {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden; /* Empêche scroll parasite mobile */
}



/* =========================================================
   🧭 HEADER
========================================================= */

.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: #4285f4;
    color: #ffffff;
    box-shadow: 0 2px 5px rgba(0,0,0,0.15);
    z-index: 1000;
}

.header-title {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 600;
}

/* ----------- Barre de recherche ----------- */

.search-wrapper {
    display: flex;
    align-items: center;
}

.search-bar-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 300px;
}

.search-bar {
    width: 100%;
    padding: 8px 110px 8px 12px;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 25px;
    outline: none;
    box-shadow: 0 2px 5px rgba(0,0,0,0.15);
    transition: all 0.2s ease;
}

.search-bar:focus {
    border-color: #4285f4;
    box-shadow: 0 0 8px rgba(66,133,244,0.3);
}

.search-buttons {
    position: absolute;
    right: 4px;
    display: flex;
    gap: 4px;
}

/* Boutons header */

.search-btn,
.route-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 10px;
    border: none;
    border-radius: 20px;
    background-color: #ffffff;
    color: #4285f4;
    cursor: pointer;
    font-size: 0.9rem;
    box-shadow: 0 2px 5px rgba(0,0,0,0.15);
    transition: all 0.2s ease;
}

.search-btn:hover,
.route-btn:hover {
    background-color: #f0f0f0;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}


/* =========================================================
   🗺️ MAP
========================================================= */

#map {
    flex: 1;
    width: 100%;
}


/* =========================================================
   📌 BOUTONS FLOTTANTS
========================================================= */

.mobile-btn {
    position: fixed;
    right: 20px;
    width: 50px;
    height: 50px;
    background-color: #ffffff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s ease, background-color 0.2s ease;
    z-index: 1000;
}

.mobile-btn:hover {
    background-color: #f0f0f0;
    transform: scale(1.1);
}

.mobile-btn .material-icons {
    font-size: 28px;
    color: #4285f4;
}

#locateBtn { bottom: 65px; }
#nearestStopBtn { bottom: 135px; }


/* =========================================================
   🪟 MINI FENÊTRE ITINÉRAIRE
========================================================= */

.route-modal {
    display: none;
    position: fixed;
    top: 70px;
    right: 20px;
    width: 320px;
    background: #ffffff;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.25);
    z-index: 1500;
    animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
}

.route-modal-content h3 {
    margin: 0 0 12px;
    font-size: 1.2rem;
    color: #4285f4;
}

/* Champs */

.input-wrapper {
    position: relative;
    margin-bottom: 10px;
}

.input-wrapper input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    font-size: 0.95rem;
    border: 1px solid #ccc;
    border-radius: 12px;
    transition: all 0.2s ease;
}

.input-wrapper input:focus {
    border-color: #4285f4;
    box-shadow: 0 0 6px rgba(66,133,244,0.3);
    outline: none;
}

.input-wrapper input[readonly] {
    background-color: #f1f3f4;
    color: #555;
}

.input-wrapper .material-icons {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 20px;
    color: #4285f4;
}

/* Boutons itinéraire */

.trace-btn,
.clear-btn {
    width: 100%;
    padding: 10px;
    margin-top: 8px;
    border: none;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

/* Tracer */
.trace-btn {
    background-color: #4285f4;
    color: #ffffff;
    box-shadow: 0 3px 8px rgba(0,0,0,0.2);
}

.trace-btn:hover {
    background-color: #3367d6;
}

.trace-btn:active {
    transform: scale(0.98);
}

/* Effacer */
.clear-btn {
    background-color: #d93025;
    color: #ffffff;
}

.clear-btn:hover {
    background-color: #b3261e;
}

.clear-btn:active {
    transform: scale(0.98);
}

/* Bouton fermer */
.close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    border: none;
    background: transparent;
    font-size: 18px;
    cursor: pointer;
}


/* =========================================================
   🧾 POPUPS MODERNES STYLE GOOGLE
========================================================= */

.leaflet-popup-content-wrapper {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.25);
    padding: 10px 15px;
}

.leaflet-popup-content {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.4;
    color: #333;
}

.popup-title {
    font-weight: 600;
    color: #4285f4;
    margin-bottom: 5px;
}

.popup-distance,
.popup-duration {
    font-size: 0.85rem;
    color: #555;
}

.leaflet-popup-tip {
    background: #ffffff;
}


/* =========================================================
   📱 RESPONSIVE MOBILE
========================================================= */

@media (max-width: 768px) {

    .search-bar-wrapper {
        width: 100%;
    }

    .header-container {
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
    }

    .route-modal {
        width: 90%;
        right: 5%;
    }
}


/* =========================================================
   FOOTER FIXE PROPRE
========================================================= */

.footer {
    position: fixed;        /* 🔥 toujours visible */
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50px;

    background: none;
    color: #333;

    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 14px;
    font-weight: 500;

    box-shadow: 0 -2px 10px rgba(0,0,0,0.08);
    z-index: 9999;          /* 🔥 au-dessus de Leaflet */
  pointer-events: none; /* 🔥 ne bloque pas les interactions de la carte */
}


.footer-title {
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
    text-shadow:
        2px 2px 4px rgba(0,0,0,0.9),
        -2px -2px 4px rgba(0,0,0,0.9),
        0 0 6px rgba(0,0,0,0.7);
}




html, body {
    height: 100%;
}

body {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

main {
    flex: 1;
    display: flex;
    min-height: 0; /* 🔥 important pour flex overflow */
}

#map {
    flex: 1;
}




  
  .popup-container {
      font-family: Arial, sans-serif;
      padding: 8px;
  }
  
  .popup-title {
      font-size: 15px;
      font-weight: bold;
      color: #1E90FF;
      margin-bottom: 4px;
  }
  
  .popup-content {
      font-size: 13px;
      color: #555;
      margin: 2px 0;
  }
  
 .popup-btn {
      background: #4285F4;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 8px;
      font-size: 12px;
  }
  
  .popup-btn:hover {
      background: #3367D6;
  }
 
/* Styles pour les popups de bus */
  .bus-popup {
      font-family: Arial, sans-serif;
      border-radius: 8px;
      overflow: hidden;
      width: 260px;
  }
  
  .bus-popup-header {
      padding: 10px;
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
  }
  
  .bus-popup-icon {
      font-size: 20px;
  }
  
  .bus-popup-title {
      font-size: 16px;
      font-weight: bold;
  }
  
  .bus-popup-content {
      padding: 12px;
      background: white;
  }
  
  .bus-popup-row {
      margin: 6px 0;
      display: flex;
      align-items: baseline;
  }
  
  .bus-popup-label {
      font-size: 12px;
      color: #666;
      width: 95px;
      flex-shrink: 0;
  }
  
  .bus-popup-value {
      font-size: 13px;
      color: #333;
      font-weight: 500;
      flex: 1;
  }
  
  .bus-popup-stop {
      color: #1E90FF;
      font-weight: bold;
  }
  
  .bus-popup-next {
      color: #34A853;
      font-weight: bold;
  }
  
  .bus-popup-divider {
      height: 1px;
      background: #eee;
      margin: 8px 0;
  }
  
  .bus-popup-footer {
      margin-top: 8px;
      text-align: right;
  }
  
  .bus-popup-time {
      font-size: 11px;
      color: #999;
  }
 



/* ===================================================== */
/* INDICATEUR DE CHARGEMENT
/* ===================================================== */

#loading-message {
    animation: fadeIn 0.3s ease;
}

#loading-message::after {
    content: '';
    display: block;
    width: 30px;
    height: 30px;
    margin: 10px auto 0;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translate(-50%, -60%);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%);
    }
}

/* ===================================================== */
/* RESTRICTIONS DE ZOOM
/* ===================================================== */

/* Indicateur visuel quand le zoom minimum est atteint */
.leaflet-zoom-min {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Style pour le contrôle de zoom */
.leaflet-control-zoom {
    border: none !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
}

.leaflet-control-zoom a {
    background-color: white !important;
    color: #667eea !important;
    border: none !important;
    transition: background-color 0.2s ease;
}

.leaflet-control-zoom a:hover {
    background-color: #f5f5f5 !important;
}

.leaflet-control-zoom a.leaflet-disabled {
    color: #ccc !important;
    cursor: not-allowed;
}

/* ===================================================== */
/* AMÉLIORATIONS POUR LA GÉOLOCALISATION
/* ===================================================== */

/* Animation pour le point de position utilisateur */
@keyframes pulse-ring {
    0% {
        transform: scale(0.8);
        opacity: 0.5;
    }
    50% {
        transform: scale(1.2);
        opacity: 0.2;
    }
    100% {
        transform: scale(0.8);
        opacity: 0.5;
    }
}

.user-location-pulse::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: rgba(66, 133, 244, 0.3);
    border-radius: 50%;
    animation: pulse-ring 2s infinite;
}

/* Bouton de localisation actif */
#locateBtn.active {
    background: #667eea;
    color: white;
}

#locateBtn.active .material-icons {
    animation: pulse 2s infinite;
}

/* ===================================================== */
/* BOUTON MA POSITION AMÉLIORÉ
/* ===================================================== */

#locateBtn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

#locateBtn.active {
    background: #667eea;
    color: white;
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

#locateBtn.active .material-icons {
    animation: pulse 1s ease;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.2);
    }
    100% {
        transform: scale(1);
    }
}

/* ===================================================== */
/* MARQUEUR DE POSITION UTILISATEUR AMÉLIORÉ
/* ===================================================== */

.user-location-marker {
    transition: all 0.3s ease;
}

.user-location-marker::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    top: -6px;
    left: -6px;
    background: rgba(66, 133, 244, 0.3);
    border-radius: 50%;
    animation: radar-pulse 2s infinite;
}

@keyframes radar-pulse {
    0% {
        transform: scale(0.5);
        opacity: 0.8;
    }
    50% {
        transform: scale(1.5);
        opacity: 0.2;
    }
    100% {
        transform: scale(0.5);
        opacity: 0.8;
    }
}

.accuracy-circle {
    transition: all 0.3s ease;
    animation: fade-in 0.5s ease;
}

@keyframes fade-in {
    from {
        opacity: 0;
        transform: scale(0.8);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* ===================================================== */
/* NOTIFICATIONS
/* ===================================================== */

@keyframes slideDown {
    from {
        transform: translate(-50%, -20px);
        opacity: 0;
    }
    to {
        transform: translate(-50%, 0);
        opacity: 1;
    }
}

.notification {
    font-family: Arial, sans-serif;
    font-weight: 500;
    letter-spacing: 0.3px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
}

.notification-error {
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
}

.notification-info {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}



/* ===================================================== */
/* ÉTAT DE CHARGEMENT POUR LE BOUTON
/* ===================================================== */

#locateBtn.loading {
    pointer-events: none;
    opacity: 0.7;
}

#locateBtn.loading .material-icons {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}



/* ===================================================== */
/* POPUP DÉTAILLÉ POUR ARRÊT LE PLUS PROCHE
/* ===================================================== */

.detailed-popup .leaflet-popup-content-wrapper {
    border-radius: 16px !important;
    padding: 0 !important;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
}

.detailed-popup-container {
    width: 320px;
    max-width: 100%;
    font-family: Arial, sans-serif;
}

/* En-tête */
.popup-header {
    padding: 16px;
    color: white;
    display: flex;
    align-items: center;
    gap: 12px;
}

.popup-header-icon {
    font-size: 28px;
    background: rgba(255,255,255,0.2);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.popup-header-title {
    font-size: 18px;
    font-weight: bold;
}

/* Corps */
.popup-body {
    padding: 20px;
    background: white;
}

/* Section nom */
.stop-name-section {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
}

.stop-name {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
}

.stop-type {
    font-size: 13px;
    color: #667eea;
    font-weight: 500;
}

/* Section distance */
.distance-section {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 20px;
}

.distance-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.distance-item:last-child {
    margin-bottom: 0;
}

.distance-icon {
    color: #667eea;
    font-size: 20px;
    width: 24px;
}

.distance-info {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.distance-label {
    font-size: 13px;
    color: #666;
}

.distance-value {
    font-size: 15px;
    font-weight: bold;
    color: #333;
}

/* Section lignes de bus */
.bus-lines-section,
.nearby-stops-section {
    margin-bottom: 20px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: bold;
    color: #555;
    margin-bottom: 10px;
}

.section-title .material-icons {
    font-size: 18px;
    color: #667eea;
}

.bus-lines {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.bus-line-item {
    background: #f8f9fa;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
}

.bus-line-name {
    color: #333;
}

/* Arrêts à proximité */
.nearby-stops {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.nearby-stop-item {
    background: #f8f9fa;
    padding: 10px 15px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.nearby-stop-item:hover {
    background: #e8eef7;
    transform: translateX(5px);
}

.nearby-stop-name {
    font-size: 13px;
    color: #333;
    font-weight: 500;
}

.nearby-stop-distance {
    font-size: 12px;
    color: #667eea;
    font-weight: bold;
}

/* Boutons d'action */
.popup-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.action-btn {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-btn.primary {
    background: #667eea;
    color: white;
}

.action-btn.primary:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.action-btn.secondary {
    background: #f8f9fa;
    color: #666;
    border: 1px solid #e0e0e0;
}

.action-btn.secondary:hover {
    background: #e8eef7;
    transform: translateY(-2px);
}

/* Note */
.popup-note {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #999;
    padding-top: 10px;
    border-top: 1px dashed #eee;
}

.popup-note .material-icons {
    font-size: 14px;
}

/* ===================================================== */
/* MARQUEUR DE DISTANCE
/* ===================================================== */

.distance-marker {
    background: white;
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: bold;
    color: #667eea;
    border: 2px solid #667eea;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    white-space: nowrap;
}

/* ===================================================== */
/* CERCLE PULSANT POUR SURBRILLANCE
/* ===================================================== */

.pulse-circle {
    animation: circle-pulse 1.5s ease-out infinite;
}

@keyframes circle-pulse {
    0% {
        opacity: 0.8;
        transform: scale(0.8);
    }
    50% {
        opacity: 0.4;
        transform: scale(1.5);
    }
    100% {
        opacity: 0.8;
        transform: scale(0.8);
    }
}

/* ===================================================== */
/* NOTIFICATIONS AMÉLIORÉES
/* ===================================================== */

.notification {
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
}

.notification-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 5px;
}

.notification-message {
    font-size: 13px;
    opacity: 0.9;
}

/* ===================================================== */
/* ÉTAT DE CHARGEMENT POUR LE BOUTON
/* ===================================================== */

#nearestStopBtn.loading {
    position: relative;
    pointer-events: none;
    opacity: 0.8;
}

#nearestStopBtn.loading .material-icons {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}















/* ===================================================== */
/* MENU HAMBURGER ET BARRE DE RECHERCHE AMÉLIORÉE
/* ===================================================== */

.menu-toggle {
    background: rgba(255,255,255,0.25);
    border: none;
    border-radius: 10px 0 0 10px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: white;
    margin-right: 2px;
}

.menu-toggle:hover {
    background: rgba(255,255,255,0.35);
    transform: scale(1.05);
}

.menu-toggle .material-icons {
    font-size: 24px;
}

.search-bar-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(255,255,255,0.15);
    border-radius: 12px;
    padding: 4px 4px 4px 0;
    backdrop-filter: blur(10px);
}

.search-container {
    flex: 1;
    position: relative;
}

.search-bar {
    width: 100%;
    background: transparent;
    border: none;
    color: white;
    font-size: 14px;
    padding: 10px 12px;
    outline: none;
}

.search-bar::placeholder {
    color: rgba(255,255,255,0.7);
}

/* ===================================================== */
/* LISTE DE SUGGESTIONS (AUTOCOMPLETE)
/* ===================================================== */

.suggestions-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border-radius: 0 0 12px 12px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    max-height: 300px;
    overflow-y: auto;
    z-index: 2100;
    display: none;
    margin-top: 4px;
}

.suggestions-list.show {
    display: block;
    animation: slideDown 0.2s ease;
}

.suggestion-item {
    padding: 12px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.2s ease;
}

.suggestion-item:last-child {
    border-bottom: none;
}

.suggestion-item:hover {
    background: #f5f5f5;
}

.suggestion-item .material-icons {
    color: #667eea;
    font-size: 18px;
}

.suggestion-content {
    flex: 1;
}

.suggestion-name {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 2px;
}

.suggestion-line {
    font-size: 11px;
    color: #999;
    display: flex;
    gap: 8px;
}

.line-badge {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: bold;
    color: white;
}

.line-badge.bus4 {
    background: #FFD700;
    color: #333;
}

.line-badge.bus8 {
    background: #34A853;
}

/* ===================================================== */
/* DRAWER (MENU LATÉRAL) POUR LA LISTE COMPLÈTE
/* ===================================================== */

.stops-drawer {
    position: fixed;
    top: 0;
    left: -350px;
    width: 350px;
    max-width: 85%;
    height: 100vh;
    background: white;
    box-shadow: 2px 0 20px rgba(0,0,0,0.2);
    z-index: 3000;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.stops-drawer.open {
    left: 0;
}

.drawer-header {
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.drawer-title {
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
}

.drawer-title .material-icons {
    font-size: 24px;
}

.close-drawer {
    background: rgba(255,255,255,0.2);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    transition: all 0.2s ease;
}

.close-drawer:hover {
    background: rgba(255,255,255,0.3);
    transform: rotate(90deg);
}

.close-drawer .material-icons {
    font-size: 20px;
}

.drawer-search {
    padding: 15px;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f8f9fa;
}

.drawer-search .material-icons {
    color: #999;
    font-size: 20px;
}

.drawer-search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    outline: none;
    padding: 8px 0;
}

.drawer-search-input::placeholder {
    color: #999;
}

.drawer-tabs {
    display: flex;
    border-bottom: 1px solid #eee;
    background: white;
}

.drawer-tab {
    flex: 1;
    padding: 12px 0;
    background: none;
    border: none;
    font-size: 13px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.drawer-tab.active {
    color: #667eea;
}

.drawer-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20%;
    width: 60%;
    height: 3px;
    background: #667eea;
    border-radius: 3px 3px 0 0;
}

.drawer-tab:hover {
    color: #333;
    background: #f5f5f5;
}

.stops-list {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    background: #fafafa;
}

.stop-card {
    background: white;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    cursor: pointer;
    transition: all 0.2s ease;
    border-left: 4px solid transparent;
}

.stop-card:hover {
    transform: translateX(5px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stop-card.bus4 {
    border-left-color: #FFD700;
}

.stop-card.bus8 {
    border-left-color: #34A853;
}

.stop-card.favorite {
    background: #fff9e6;
}

.stop-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.stop-card-name {
    font-size: 15px;
    font-weight: 600;
    color: #333;
}

.stop-card-favorite {
    color: #FFD700;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.stop-card-favorite:hover {
    transform: scale(1.2);
}

.stop-card-favorite .material-icons {
    font-size: 20px;
}

.stop-card-details {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 12px;
    color: #666;
}

.stop-card-line {
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: bold;
    color: white;
}

.stop-card-line.bus4 {
    background: #FFD700;
    color: #333;
}

.stop-card-line.bus8 {
    background: #34A853;
}

.stop-card-distance {
    display: flex;
    align-items: center;
    gap: 4px;
}

.stop-card-distance .material-icons {
    font-size: 14px;
    color: #999;
}

.drawer-footer {
    padding: 15px;
    border-top: 1px solid #eee;
    background: white;
}

.drawer-stats {
    font-size: 12px;
    color: #999;
    text-align: center;
}

.drawer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 2500;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.drawer-overlay.active {
    opacity: 1;
    visibility: visible;
}

/* ===================================================== */
/* RESPONSIVE POUR LE DRAWER
/* ===================================================== */

@media (max-width: 480px) {
    .stops-drawer {
        width: 100%;
        left: -100%;
    }
    
    .menu-toggle {
        width: 44px;
        height: 44px;
    }
    
    .menu-toggle .material-icons {
        font-size: 22px;
    }
    
    .stop-card {
        padding: 12px;
    }
    
    .stop-card-name {
        font-size: 14px;
    }
}

/* ===================================================== */
/* ANIMATIONS POUR LE DRAWER
/* ===================================================== */

@keyframes slideIn {
    from {
        transform: translateX(-100%);
    }
    to {
        transform: translateX(0);
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
    }
    to {
        transform: translateX(-100%);
    }
}






/* ===================================================== */
/* ÉTAT VIDE
/* ===================================================== */

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #999;
}

.empty-state .material-icons {
    font-size: 48px;
    margin-bottom: 10px;
    color: #ddd;
}

.empty-state p {
    font-size: 14px;
    margin: 0;
}
