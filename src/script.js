/**
 * L = Leaflet library
*/

// import files
import { MapManager } from "./MapManager.js";
import { RouteFetcher } from "./RouteFetcher.js";
import { RouteController } from "./RouteController.js";


// Inicializar la aplicación
const mapManager = new MapManager("map");
const routeFetcher = new RouteFetcher();
const routeController = new RouteController(mapManager, routeFetcher);


// actualizar iconos cuando se mueve o se hace zoom en el mapa
mapManager.map.on('zoomend moveend', () => {
    Object.keys(mapManager.routeLayers).forEach(route => mapManager.updateRouteIcon(route));
});

// evento que al clickear borra el caché
document.getElementById("clear-cache").addEventListener("click", async () => {
    const cache = await caches.open("routes-cache");
    cache.keys().then(keys => keys.forEach(request => cache.delete(request)));
    console.log("Cache cleared!");
});



