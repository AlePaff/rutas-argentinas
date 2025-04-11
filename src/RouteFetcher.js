
export class RouteFetcher {
    constructor() {
        this.bbox = BBOX_ARG; // Límite para Argentina
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
        if (data) this.saveToCache(region_id, data);
        return data;
    }



    

    
}