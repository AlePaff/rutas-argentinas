export class RouteFetcher {
    constructor() {
        this.bbox = BBOX_ARG; // Límite para Argentina
        this._pavimentoGeojson = null; // Para almacenar el GeoJSON de pavimento
    }

    async preloadPavimentoGeojson() {
        if (!this._pavimentoGeojson) {
            try {
                console.log("Cargando highways/pavimento.geojson...");
                const response = await fetch("highways/pavimento.geojson");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                this._pavimentoGeojson = await response.json();
                console.log(`Pavimento GeoJSON cargado: ${this._pavimentoGeojson.features.length} features`);
            } catch (error) {
                console.error("Error precargando pavimento.geojson:", error);
                this._pavimentoGeojson = null;
            }
        }
    }

    async fetchRoute(route, query) {
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
        if(!data || !data.elements || data.elements.length === 0) return;

        const cache = await caches.open("routes-cache");
        cache.put(routeId, new Response(JSON.stringify(data)));
    }

    async saveToCacheFromFile(routeId, data) {
        // Para GeoJSON, verificar que tenga features
        if(!data || !data.features || data.features.length === 0) return;

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


    async getRoute(route_id) {
        // Si existe en cache, devolver desde allí
        let localData = await this.getFromCache(route_id);
        if (localData) return localData;


        // query mas pesada
        // let query = `
        //     [out:json];
        //     way["highway"]["ref"="${route_id}"];
        //     (._; >;);
        //     out;
        // `;

        // query mas liviana pero cambiante, pueden llegar a eliminar las relaciones
        // let query = `[out:json]; relation(172947);(._;>;); out body;`;

        // equilibrio entre las dos, 'liviana' y mantenible. NOTE: Puede llegar a incluir rutas de paises vecinos o lo que sea que este viendo el usuario
        // se fija que empiece con RN y cualquier combinación (ya que hay rutas marcadas como combinacion RN40|RN60)
        let query = `
            [out:json][bbox:${this.bbox}];
            way["ref"~"^RN.*"]["ref"~"(^|;)${route_id}(;|$)"];
            out geom;
        `;

        // let query = `
        // [out:json];
        // area["name"="Córdoba"]->.searchArea;
        // way["ref"~"RP.*"](area.searchArea);
        // out geom;
        // `
        let data = await this.fetchRoute(route_id, query);
        if (data) this.saveToCache(route_id, data);
        return data;
    }

    // idem que getRoute pero separado para que quede más claro
    async getRegionFromQuery(region_id, query) {
        let localData = await this.getFromCache(region_id);
        if (localData) return localData

        let data = await this.fetchRoute(region_id, query);
        if (data) this.saveToCache(region_id, data);

        let geoJson = osmtogeojson(data);

        return geoJson;
    }

    async getRegionFromFile(region_id, path) {
        let localData = await this.getFromCache(region_id);
        if (localData) return localData;

        let response = await fetch(path);
        let data = await response.json();
        if (data) this.saveToCacheFromFile(region_id, data);
        return data;
    }

    async fetchRouteFromFile(route_id) {
        // Extraer solo el número de la ruta (ej: "RN5" -> "5", "5" -> "5")
        let routeNumber = route_id.toString().replace(/^RN/, '');
        // Convertir a string y rellenar con ceros a la izquierda (ej: "5" -> "0005")
        let codRuta = routeNumber.padStart(4, "0");
        
        // console.log(`DEBUG: Procesando ruta ${route_id} -> número ${routeNumber} -> código ${codRuta}`);
        
        // Cargar el archivo pavimento.geojson solo una vez
        if (!this._pavimentoGeojson) {
            console.warn("Pavimento GeoJSON no estaba precargado, cargando ahora...");
            await this.preloadPavimentoGeojson();
        }
         // Si aún no se pudo cargar, retornar null
        if (!this._pavimentoGeojson) {
            console.error("No se pudo cargar el archivo pavimento.geojson");
            return null;
        }
        
        // Filtrar las features que coincidan con el cod_ruta
        const features = this._pavimentoGeojson.features.filter(
            f => f.properties && f.properties.cod_ruta === codRuta
        );
        
        // console.log(`DEBUG: Buscando ruta ${codRuta}, encontradas ${features.length} features`);
        
        if (features.length === 0) {
            console.warn(`No se encontraron features para la ruta ${codRuta}`);
            return null;
        }
        
        // Verificar que las features tengan geometría válida
        const validFeatures = features.filter(f => 
            f.geometry && 
            (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString') &&
            f.geometry.coordinates && 
            f.geometry.coordinates.length > 0
        );
        
        // Retornar un FeatureCollection con las features encontradas
        const result = {
            type: "FeatureCollection",
            features: validFeatures
        };
        
        return result;
    }
}