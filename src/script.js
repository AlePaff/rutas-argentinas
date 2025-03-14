
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
        this.routeIcons = {};  // Almacena los iconos de las rutas
    }

    //** 
    // * 
    // 
    drawRoute(route, geoJsonData) {
        const layer = L.geoJSON(geoJsonData, {
            style: { color: "blue", weight: 3 }
        }).addTo(this.map);

        this.routeLayers[route] = {
            layer: layer,
            coordinates: geoJsonData.features.flatMap(feature => feature.geometry.coordinates.map(coord => [coord[1], coord[0]])) // Convertir [lng, lat] -> [lat, lng]
        };

        this.updateRouteIcon(route);
    }

    updateRouteIcon(route) {
        // coloca el icono aproximadamente a la mitad de la ruta
        // considera la mitad obteniendo el indice medio de la lista de coordenadas de la ruta
        // ej) (1,0), (3,0), (20,0) -> (3,0) es el punto medio
        if (!this.routeLayers[route]) return;

        const bounds = this.map.getBounds();
        const points = this.routeLayers[route].coordinates;

        // Filtrar TODOS los puntos dentro del viewport actual
        const visiblePoints = points.filter(([lat, lng]) => bounds.contains([lat, lng]));

        if (visiblePoints.length > 0) {
            // Calcular el punto medio de los visibles
            let midIndex = Math.floor(visiblePoints.length / 2);
            let midPoint = visiblePoints[midIndex];

            // Si ya existe un icono, actualiza su posición
            if (this.routeIcons[route]) {
                this.routeIcons[route].setLatLng(midPoint);
            } else {
                // Crear un nuevo icono
                const routeSvg = document.querySelector(`[data-route="${route}"] svg`).outerHTML;

                const icon = L.divIcon({
                    className: 'route-icon-map',
                    html: routeSvg,  // Usa el SVG en lugar del emoji
                    iconSize: [40, 40], // Ajusta el tamaño si es necesario
                    iconAnchor: [20, 40]
                });


                const marker = L.marker(midPoint, { icon }).addTo(this.map);
                this.routeIcons[route] = marker;
            }
        } else {
            // Si la ruta está fuera de vista, ocultar el icono
            if (this.routeIcons[route]) {
                this.map.removeLayer(this.routeIcons[route]);
                delete this.routeIcons[route];
            }
        }
    }


    removeRoute(route) {
        if (this.routeLayers[route]) {
            this.map.removeLayer(this.routeLayers[route].layer);
            if (this.routeIcons[route]) {
                this.map.removeLayer(this.routeIcons[route]);
                delete this.routeIcons[route];
            }
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

        // let query = `
        // [out:json];
        // area["name"="Córdoba"]->.searchArea;
        // way["ref"~"RP.*"](area.searchArea);
        // out geom;
        // `
        let url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

        try {
            let response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error(`Error cargando ${route}:`, error);
            return null;
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
        this.routeElements = {};        // html de las rutas

        this.loadData().then(() => this.initUI());
    }

    async loadData() {
        // read routes from file
        const response = await fetch('data/routes.json')
        const data = await response.json()

        // obtener cada id y convertirlo en array
        this.routes = data //Object.values(data).map(route => route.id);
    }

    initUI() {
        let routesContainer = document.getElementById("routes");

        // Agregar checkboxes y numeros dinámicamente
        Object.entries(this.routes).forEach(([route_key, route_values]) => {
            let routeDiv = document.createElement("div");
            routeDiv.classList.add("route");
            routeDiv.classList.add("route-img");
            routeDiv.setAttribute("data-route", route_key);
    
            // Cargar el SVG dinámicamente
            fetch("assets/RNX.svg")
                .then(response => response.text())  // Convertir a texto
                .then(svgData => {
                    routeDiv.innerHTML = svgData;  // Insertar el SVG en el div
                    routesContainer.appendChild(routeDiv);
    
                    // Ahora sí puedes modificar el SVG
                    let textElement = routeDiv.querySelector("#numero-ruta-nacional");
                    if (textElement) {
                        textElement.textContent = route_values.number;  // Modifica el texto dinámicamente
                    }
                    routeDiv.addEventListener("click", () => this.toggleRoute(routeDiv, route_key));

                    // Guardar referencia al elemento
                    this.routeElements[route_key] = routeDiv;
                })
                .catch(error => console.error("Error cargando el SVG:", error));
            
        });

        // listener para la busqueda
        document.getElementById("search-input").addEventListener("input", (e) => this.filterRoutes(e.target.value));

        // si al buscar se presiona enter, se selecciona la primer ruta
        document.getElementById("search-input").addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                // primer elemennto con display != none
                let firstRoute = Object.keys(this.routeElements).find(key => this.routeElements[key].style.display !== "none");
                this.toggleRoute(this.routeElements[firstRoute], firstRoute);
            }
        });

    }

    // filtrar rutas (search box)
    filterRoutes(query) {
        const lowerCaseQuery = query.toLowerCase();

        Object.entries(this.routes).forEach(([route_key, route_values]) => {
            const routeDiv = this.routeElements[route_key];
            const matchesQuery = route_values.number.includes(lowerCaseQuery) ||
                                 route_values.name.toLowerCase().includes(lowerCaseQuery);

            // Mostrar u ocultar según si coincide con la búsqueda
            routeDiv.style.display = matchesQuery ? "" : "none";
        });
    }

    // mostrar u ocultar ruta
    async toggleRoute(routeDiv, routeNumber) {
        routeDiv.classList.toggle("selected");

        if (routeDiv.classList.contains("selected")) {
            let data = await this.routeFetcher.getRoute(routeNumber);
            if (data) {
                let geoJson = osmtogeojson(data);
                this.mapManager.drawRoute(routeNumber, geoJson);
            }
        } else {
            this.mapManager.removeRoute(routeNumber);
        }
    }

    async toggleAllRoutes() {
        let checked = document.getElementById("toggleAll").checked;
        document.querySelectorAll("#routes input[type=checkbox]").forEach(async checkbox => {
            checkbox.checked = checked;
            let route = checkbox.getAttribute("data-route");

            toogleRoute(checkbox, route);
        });
    }
}

// Inicializar la aplicación
const mapManager = new MapManager("map");
const routeFetcher = new RouteFetcher();
const routeController = new RouteController(mapManager, routeFetcher);


// actualizar iconos cuando se mueve o se hace zoom en el mapa
mapManager.map.on('zoomend moveend', () => {
    Object.keys(mapManager.routeLayers).forEach(route => mapManager.updateRouteIcon(route));
});

