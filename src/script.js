
/**
 * L = Leaflet library
 */




class MapManager {
    constructor(mapId) {
        // Inicializar el mapa con centro en Argentina
        this.map = L.map(mapId).setView([-38.41, -63.61], 4);
        // Capa base de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
        this.routeLayers = {}; // Almacena las capas de rutas activas
    }

    drawRoute(route, geoJsonData) {
        // Función para dibujar una ruta en el mapa
        const layer = L.geoJSON(geoJsonData, {
            style: { 
                color: "blue",
                weight: 3 
            }
        }).addTo(this.map);
        this.routeLayers[route] = layer;
    }

    removeRoute(route) {
        if (this.routeLayers[route]) {
            this.map.removeLayer(this.routeLayers[route]);
            delete this.routeLayers[route];
        }
    }
}


class RouteFetcher {
    constructor() {
        this.bbox = "-55.2,-73.6,-21.8,-53.6"; // Límite para Argentina
    }

    async fetchRoute(route) {

        // query mas pesada
        // let query = `
        //     [out:json];
        //     way["highway"]["ref"="${route}"];
        //     (._; >;);
        //     out;
        // `;

        // query mas liviana pero cambiante, pueden llegar a eliminar las relaciones
        // let query = `[out:json]; relation(172947);(._;>;); out body;`;

        // equilibrio entre las dos, 'liviana' y mantenible. NOTE: Puede llegar a incluir rutas de paises vecinos o lo que sea que este viendo el usuario
        let query = `
            [out:json];
            way["ref"="${route}"](${this.bbox});
            out geom;
        `;
        let url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

        try {
            let response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error(`Error cargando ${route}:`, error);
            return null;
        }
    }

    setLocalRoute(route, data) {
        if (data) {
            localStorage.setItem(route, JSON.stringify(data));
        }
    }

    
    // Guardar datos en cache
    async saveToCache(routeId, data) {
        const cache = await caches.open("routes-cache");
        cache.put(routeId, new Response(JSON.stringify(data)));
    }

    // Recuperar datos desde el cache
    async getFromCache(routeId) {
        const cache = await caches.open("routes-cache");
        const response = await cache.match(routeId);
        if (response) {
            return await response.json();
        } else {
            console.log("No cached data found for", routeId);
            return null;
        }
    }


    async getRoute(route) {
        // Si existe en cache, devolver desde allí
        let localData = await this.getFromCache(route);
        if (localData) return localData;

        let data = await this.fetchRoute(route);
        if (data) this.saveToCache(route, data);
        return data;
    }
}




class RouteController {
    constructor(mapManager, routeFetcher) {
        this.mapManager = mapManager;
        this.routeFetcher = routeFetcher;
        this.routes = [];

        this.loadData().then(() => this.initUI());
    }

    async loadData() {
        // read routes from file
        const response = await fetch('data/routes.json')
        const data = await response.json()

        // obtener cada id y convertirlo en array
        this.routes = Object.values(data).map(route => route.id);
    }

    initUI() {
        let routesContainer = document.getElementById("routes");

        // Agregar checkboxes dinámicamente
        this.routes.forEach(route => {
            let routeDiv = document.createElement("div");
            routeDiv.classList.add("route");
            routeDiv.setAttribute("data-route", route);

            // Usamos una imagen de ejemplo, reemplaza la URL con la ruta real
            routeDiv.innerHTML = `
                <img src="assets/RN1.png" alt="${route}" class="route-img">
            `;

            routesContainer.appendChild(routeDiv);

            // Agregar el evento para seleccionar la ruta
            routeDiv.addEventListener("click", () => this.toggleRoute(routeDiv, route));
        });

    }

    async toggleRoute(routeDiv, route) {
        routeDiv.classList.toggle("selected");

        if (routeDiv.classList.contains("selected")) {
            let data = await this.routeFetcher.getRoute(route);
            if (data) {
                let geoJson = osmtogeojson(data);
                this.mapManager.drawRoute(route, geoJson);
            }
        } else {
            this.mapManager.removeRoute(route);
        }
    }

    async toggleAllRoutes() {
        let checked = document.getElementById("toggleAll").checked;
        document.querySelectorAll("#routes input[type=checkbox]").forEach(async checkbox => {
            checkbox.checked = checked;
            let route = checkbox.getAttribute("data-route");

            if (checked) {
                let data = await this.routeFetcher.getRoute(route);
                if (data) {
                    let geoJson = osmtogeojson(data);
                    this.mapManager.drawRoute(route, geoJson);
                }
            } else {
                this.mapManager.removeRoute(route);
            }
        });
    }
}

// Inicializar la aplicación
const mapManager = new MapManager("map");
const routeFetcher = new RouteFetcher();
const routeController = new RouteController(mapManager, routeFetcher);





