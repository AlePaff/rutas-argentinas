
export class RouteController {
    constructor(mapManager, routeFetcher) {
        this.mapManager = mapManager;
        this.routeFetcher = routeFetcher;
        this.routes = [];
        this.routeElements = {};        // html de las rutas
        this.controlRegiones = null;    // control de regiones
        this.layerRegionGroup = null; // capa de regiones

        this.startApp();
    }

    async startApp() {
        console.log("Inicializando la app");
        await this.loadData();
        console.log("Datos cargados");
        console.log("Inicializando UI");
        await this.initUI();
        console.log("UI inicializada");

        let loadingDiv = document.getElementById("loading");
        loadingDiv.style.display = "none";
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
            routeDiv.setAttribute("data-route-number", route_values.number);

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
            console.log("Todos los SVG cargados");
            this.classifyRoutesVialidad();

            this.addEventListeners();
            
        });

        // cargar todas las regiones
        await this.initRegionLayer();
        
    }

    addEventListeners() {
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

        
        
        // listener para el filtro de Vialidad Nacional
        let vialidadCheckbox = document.getElementById('vialidad');
        vialidadCheckbox.addEventListener('change', async () => {
            this.toggleRoutesFilter();
            this.toggleRegionDisplay(vialidadCheckbox);
        });


        // listener para el checkbox de seleccionar todas las rutas
        console.log("Inicializando listeners de checkboxes");
        let labelAllRoutesHtml = document.querySelector("#toggleAll");
        labelAllRoutesHtml.addEventListener("change", () => {
            this.toggleSomeRoutes(labelAllRoutesHtml, document);
        });

        let toggleRegionsHtml = document.querySelectorAll(".route-classification");
        console.log(`Se encontraron ${toggleRegionsHtml.length} elementos`);
        toggleRegionsHtml.forEach((toggleRegionsDiv) => {
            let labelElem = toggleRegionsDiv.querySelector("label");

            labelElem.addEventListener("change", () => {
                this.toggleSomeRoutes(labelElem, toggleRegionsDiv);
            });
        })
    }


    async initRegionLayer(){
        // mostrar todas las regiones en el mapa con distintos colores
        // iterar CLASIFICACION_RN.regiones.regiones y obtene la query de cada uno
        let groupRegionLayers = []

        // obtener layers
        for (const [region_key, region_values] of Object.entries(CLASIFICACION_RN.regiones.regiones)) {
            // si no hay data saltea
            if(region_values.osm_query.length == 0){
                return;
            }

            let query = region_values.osm_query;
            let data = await this.routeFetcher.getRegion(region_key, query);
            if (data) {
                let geoJson = osmtogeojson(data);
                
                let regionLayers = this.mapManager.calculateRegion(region_values, geoJson);
                // iterar cada elemento del array y agregar
                for (const regionLayer of regionLayers) {
                    groupRegionLayers.push(regionLayer);
                }
            }
            
        };
        groupRegionLayers = await Promise.all(groupRegionLayers);

        // agrupar y mostrar regiones
        this.layerRegionGroup = L.layerGroup(groupRegionLayers);
        // regionGroup.addTo(this.mapManager.map);

        // control de regiones
        this.controlRegiones = L.control.layers(null, {
            "Regiones": this.layerRegionGroup
        }, { collapsed: false })
        
        // cuando termine de dibujar mandar por consola
        console.log("Regiones cargadas en el mapa");
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
            // checkbox para seleccionar todos
            let seleccionarTodo = "<label class='select-all'><input type='checkbox' id='select-all-" + key + "'>Seleccionar todas</label>";
            section.insertAdjacentHTML("beforeend", seleccionarTodo);

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

                    seleccionarTodo = "<label class='select-all'><input type='checkbox' id='select-all-" + region_key + "'>Seleccionar todas</label>";
                    regionSection.insertAdjacentHTML("beforeend", seleccionarTodo);

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

    // mostrar regiones en el mapa junto a su control
    async toggleRegionDisplay(vialidadCheckboxDiv){
        vialidadCheckboxDiv.classList.toggle("selected");
        
        if(vialidadCheckboxDiv.classList.contains("selected")){
            // mostrar regiones
            this.layerRegionGroup.addTo(this.mapManager.map);     // mostar capas
            this.controlRegiones.addTo(this.mapManager.map);        // mostrar control
            // mostrar botones de seleccionar todos
            let label = document.querySelectorAll(".select-all");
            label.forEach(label => {
                label.style.display = "block";
            });
        } else{
            // borrar todas las regiones            
            this.layerRegionGroup.remove(); // borrar capas
            this.controlRegiones.remove(); // borrar control
            // ocultar botones de seleccionar todos
            let label = document.querySelectorAll(".select-all");
            label.forEach(label => {
                label.style.display = "none";
            });
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


    async toggleSomeRoutes(labelHtml, fatherElementHtml) {
        let checkbox = labelHtml.querySelector("input");
        // seleccionar todas las rutas
        if(checkbox.checked){
            // click to all routes
            const allRoutes = fatherElementHtml.querySelectorAll(".route:not(.selected)");

            // si son mas de 20 elementos preguntar
            if(allRoutes.length > 20){
                let confirmation = confirm("¿Desea seleccionar todas las rutas? Puede tardar unos minutos");
                if(!confirmation){
                    checkbox.checked = false;
                    return;
                }
            }
            allRoutes.forEach(routeDiv => {
                this.toggleRoute(routeDiv, routeDiv.getAttribute("data-route"));
            });
        } else {
            // clickear todas las rutas seleccioandas
            const allRoutes = fatherElementHtml.querySelectorAll(".route.selected");
            allRoutes.forEach(routeDiv => {
                this.toggleRoute(routeDiv, routeDiv.getAttribute("data-route"));
            });
        }
    }
}
