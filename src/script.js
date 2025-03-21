/**
 * L = Leaflet library
*/


const CLASIFICACION_RN = {
    radiales: {
        "display_name": "Radiales",
        "description": "Las rutas nacionales radiales son aquellas que parten de la Ciudad Autónoma de Buenos Aires y se dirigen hacia el interior del país.",
        "rutas": [1,2,3,4,5,6,7,8,9,10,11,12,13,14],
    },    
    este_oeste: {
        "display_name": "Este - Oeste",
        "description": "Las rutas nacionales este-oeste son aquellas que conectan las costas del océano Atlántico con las del océano Pacífico.",
        "rutas": [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],
    },
    norte_sur: {
        "display_name": "Norte - Sur",
        "description": "Las rutas nacionales norte-sur son aquellas que conectan la frontera norte con la frontera sur del país.",
        "rutas": [32, 33, 34,35,36,37,38,39,40],
    },
    futuras_ampliaciones: {
        "display_name": "Futuras ampliaciones",
        "description": "Rutas nacionales que están proyectadas para ser construidas en el futuro.",
        "rutas": [41,42,43,44,45,46,47,48,49,50],
    },
    regiones: {
        "display_name": "Regiones",
        "description": "Rutas nacionales que conectan diferentes regiones del país. De la 51 a la 300.",
        "regiones": {
            "region_1": {
                "display_name": "Región 1",
                "description": "",
                "rutas": [51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80],
                "provincias": ["Jujuy", "Salta", "Tucumán", "Catamarca", "La Rioja"],
            },
            "region_2": {
                "display_name": "Región 2",
                "description": "",
                "rutas": [81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100],
                "provincias": ["Formosa", "Chaco", "Santiago del Estero", "Norte de Santa Fe"],
            },
            "region_3": {
                "display_name": "Región 3",
                "description": "",
                "rutas": [101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140],
                "provincias": ["Misiones", "Corrientes", "Entre Ríos"],
            },
            "region_4": {
                "display_name": "Región 4",
                "description": "",
                "rutas": [141,142,143,144,145,146,147,148,149,150,151,152,153,154,155],
                "provincias": ["San Juan", "Mendoza", "San Luis", "La Pampa"],
            },
            "region_5": {
                "display_name": "Región 5",
                "description": "",
                "rutas": [156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185],
                "provincias": ["Córdoba", "Centro - Sur de Santa Fe"],
            },
            "region_6": {
                "display_name": "Región 6",
                "description": "",
                "rutas": [186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230],
                "provincias": ["Ciudad Autónoma de Buenos Aires", "Provincia de Buenos Aires"],
            },            
            "region_7": {
                "display_name": "Región 7",
                "description": "",
                "rutas": [231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255],
                "provincias": ["Neuquén", "Río Negro"],
            },
            "region_8": {
                "display_name": "Región 8",
                "description": "",
                "rutas": [256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300],
                "provincias": ["Chubut", "Santa Cruz", "Tierra del Fuego AIAS"],
            }
        }
    }
}



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

    drawRoute(route, geoJsonData) {
        const layer = L.geoJSON(geoJsonData, {
            style: { color: "blue", weight: 3 }
        }).addTo(this.map);

        this.routeLayers[route] = {
            layer: layer,
            coordinates: geoJsonData.features.flatMap(feature => feature.geometry.coordinates.map(coord => [coord[1], coord[0]])) // Convertir [lng, lat] -> [lat, lng]
        };

        this.updateRouteIcon(route);

        this.map.whenReady(() => {
            console.log(`Route ${route} has been fully loaded on the map.`);
            // Change the route icon color dynamically
            const routeDiv = document.querySelector(`[data-route="${route}"]`);
            if (routeDiv) {
                // delete class "loading-route-icon"
                routeDiv.classList.remove("loading-route-icon");
            }
        });
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
        // se fija que empiece con RN y cualquier combinación (ya que hay rutas marcadas como combinacion RN40|RN60)
        let query = `
            [out:json][bbox:${this.bbox}];
            way["ref"~"^RN.*"]["ref"~"(^|;)${route}(;|$)"];
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

    async initUI() {
        let routesContainer = document.getElementById("routes");

        // Crear un array de promesas para esperar a que todos los SVG se carguen
        let svgPromises = [];

        // Agregar checkboxes y numeros dinámicamente
        Object.entries(this.routes).forEach(([route_key, route_values]) => {
            let routeDiv = document.createElement("div");
            routeDiv.classList.add("route");
            routeDiv.classList.add("route-img");
            routeDiv.setAttribute("data-route", route_key);

            // Crear barra de carga
            let loadingBar = document.createElement("div");
            loadingBar.classList.add("loading-bar");
            routeDiv.appendChild(loadingBar);

            // Cargar el SVG dinámicamente y agregar la promesa al array
            let svgPromise = fetch("assets/RNX.svg")
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

            svgPromises.push(svgPromise);
        });

        // Esperar a que todas las promesas de SVG se resuelvan
        Promise.all(svgPromises).then(() => {
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

            this.classifyRoutesVialidad();
            
            // listener para el filtro de Vialidad Nacional
            document.getElementById('vialidad').addEventListener('click', () => {
                this.toggleRoutesFilter();
            });
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

    // clasificar rutas según vialidad nacional
    classifyRoutesVialidad() {
        const routesFilterContainer = document.getElementById("routes");
        routesFilterContainer.innerHTML = ""; // Clear existing routes

        // Clasificar rutas según CLASIFICACION_RN
        Object.entries(CLASIFICACION_RN).forEach(([key, value]) => {
            // rutas dividades por secciones
            let section = document.createElement("div");
            section.classList.add("route-classification");
            let title = document.createElement("h4");
            title.textContent = value.display_name;
            section.appendChild(title);

            // clasificaciones normales
            if(value.rutas){
                value.rutas.forEach(routeNumber => {
                    let routeKey = Object.keys(this.routes).find(key => this.routes[key].number == routeNumber);
                    if (routeKey) {
                        section.appendChild(this.routeElements[routeKey]);
                    }
                });
            }
            // clasificaciones por regiones
            if(value.regiones){
                Object.entries(value.regiones).forEach(([region_key, region_values]) => {
                    let regionSection = document.createElement("div");
                    regionSection.classList.add("route-classification");
                    let regionTitle = document.createElement("h5");
                    regionTitle.textContent = region_values.display_name;
                    regionSection.appendChild(regionTitle);

                    region_values.rutas.forEach(routeNumber => {
                        let routeKey = Object.keys(this.routes).find(key => this.routes[key].number == routeNumber);
                        if (routeKey) {
                            regionSection.appendChild(this.routeElements[routeKey]);
                        }
                    });
                    section.appendChild(regionSection);
                });
            }
            
            routesFilterContainer.appendChild(section);
        });
    }

    // mostrar u ocultar filtro de clasificacion de rutas
    toggleRoutesFilter() {
        const routesDiv = document.getElementsByClassName("route-classification");
        for (let i = 0; i < routesDiv.length; i++) {
            routesDiv[i].classList.toggle("active");
        }
        
    }

    // mostrar u ocultar ruta
    async toggleRoute(routeDiv, routeNumber) {
        routeDiv.classList.toggle("selected");
        
        if (routeDiv.classList.contains("selected")) {
            routeDiv.classList.add("loading-route-icon");
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

// evento que al clickear borra el caché
document.getElementById("clear-cache").addEventListener("click", async () => {
    const cache = await caches.open("routes-cache");
    cache.keys().then(keys => keys.forEach(request => cache.delete(request)));
    console.log("Cache cleared!");
});



