export class MapManager {
    constructor(mapId) {
        // Inicializar el mapa con centro en Argentina
        this.map = L.map(mapId).setView([-38.41, -63.61], 4);
        // Capa base de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        this.routeLayers = {}; // Almacena las capas de rutas activas
        this.routeIcons = {};  // Almacena los iconos de las rutas
        this.regionLayers = {}; // Almacena las capas de regiones activas
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




    drawRegion(region_key, region_data, geoJsonData) {
        // filtrar puntos. Quedarse solo con los poligonos
        let filteredGeoJsonData = geoJsonData.features.filter(feature => feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon");
        
        const layer = L.geoJSON(filteredGeoJsonData, {
            style: { 
                // stroke options
                color: region_data.region_color,
                weight: 0.5,
                opacity: 0.5,

                // fill options
                fillOpacity: 0.5,
            }
        }).addTo(this.map);

        // agregar a la lista de regiones
        this.regionLayers[region_key] = {
            layer: layer,
            coordinates: filteredGeoJsonData.flatMap(feature => feature.geometry.coordinates.map(coord => [coord[1], coord[0]])) // Convertir [lng, lat] -> [lat, lng]
        };

        // Calcular el centroide del conjunto de polígonos
        const centroide = region_data.title_coords;
        
        // Agregar un marcador con texto en el centroide. Tambien dibujar punto
        displayRegionName = L.marker(centroide, {
            icon: L.divIcon({
                className: "region-label",
                html: `<div>${region_data.display_name}</div>`,
                iconSize: [100, 30], // Tamaño del cuadro de texto
                iconAnchor: [0, 0] // Centramos el texto en el punto
            })
        }).addTo(this.map);

        
        this.regionLayers[region_key].centroid = displayRegionName;

        // dibujar punto en color rojo
        L.circle(centroide, {
            color: 'blue',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: 100
        }).addTo(this.map);




        // this.routeLayers[region_id] = {
        //     layer: layer,
        //     coordinates: geoJsonData.features.flatMap(feature => feature.geometry.coordinates.map(coord => [coord[1], coord[0]])) // Convertir [lng, lat] -> [lat, lng]
        // };

        // this.updateRouteIcon(region_id);

        this.map.whenReady(() => {
            console.log(`Finalizado region.`);
        });
    }


    removeRegions() {
        Object.values(this.regionLayers).forEach(region => {
            this.map.removeLayer(region.layer);
            this.map.removeLayer(region.centroid);
        });
        this.regionLayers = {};
    }


}