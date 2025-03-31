
export class RouteController {
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
            let vialidadCheckbox = document.getElementById('vialidad');
            vialidadCheckbox.addEventListener('click', () => {
                this.toggleRoutesFilter();
                this.toggleRegionDisplay(vialidadCheckbox);
            });
        });
    }

    // filtrar rutas (search box)
    filterRoutes(query) {
        // minuscula e ignorar diacríticos
        const lowerCaseQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        

        Object.entries(this.routes).forEach(([route_key, route_values]) => {
            const routeDiv = this.routeElements[route_key];
            const matchesQuery = 
                // buscar por numero
                route_values.number.includes(lowerCaseQuery) ||
                // por nombre                     
                route_values.name.toLowerCase().includes(lowerCaseQuery) ||
                // si contiene el nombre de una provincia
                route_values.provinces.some(province => province.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(lowerCaseQuery));

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

                    // agregar rutas de la region
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

    // mostrar regiones en el mapa
    toggleRegionDisplay(vialidadCheckboxDiv){
        // mostrar todas las regiones en el mapa con distintos colores
        // iterar CLASIFICACION_RN.regiones.regiones y obtene la query de cada uno
        vialidadCheckboxDiv.classList.toggle("selected");
        
        if(vialidadCheckboxDiv.classList.contains("selected")){
            Object.entries(CLASIFICACION_RN.regiones.regiones).forEach(async ([region_key, region_values]) => {
                console.log("region_key", region_key);
                console.log("region_values", region_values);

                // si no hay data saltea
                if(region_values.osm_query.length == 0){
                    return;
                }

                let query = region_values.osm_query;
                let data = await this.routeFetcher.getRegion(region_key, query);
                if (data) {
                    let geoJson = osmtogeojson(data);
                    this.mapManager.drawRegion(region_key, region_values, geoJson);
                }
            });
        } else {
            // borrar todas las regiones
            this.mapManager.removeRegions();
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
        // advertencia de "esta seguro? puede tardar"
        if(!confirm("¿Está seguro que desea cargar todas las rutas? Puede tardar unos minutos.")){
            return;
        }        

        let checked = document.getElementById("toggleAll").checked;
        document.querySelectorAll("#routes input[type=checkbox]").forEach(async checkbox => {
            checkbox.checked = checked;
            let route = checkbox.getAttribute("data-route");

            toogleRoute(checkbox, route);
        });
    }
}
