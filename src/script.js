/**
 * L = Leaflet library
 */

// Inicializar el mapa con centro en Argentina
var map = L.map('map').setView([-38.41, -63.61], 4);

// Capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Diccionario para guardar rutas activas
var routeLayers = {};

// Lista de rutas nacionales
const routes = ["RN1", "RN3", "RN5", "RN7", "RN8", "RN9", "RN40"];

// Agregar checkboxes dinámicamente
let routesContainer = document.getElementById("routes");
routes.forEach(route => {
    let label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" data-route="${route}"> ${route}`;
    routesContainer.appendChild(label);
});





// Función para obtener rutas desde Overpass
async function fetchRoute(route) {
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
        way["ref"="${route}"]( -55.2,-73.6,-21.8,-53.6 );
        out geom;
    `;

    
    let url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    
    try {
        let response = await fetch(url);
        let data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error cargando ${route}:`, error);
        return null;
    }
}

// Función para dibujar una ruta en el mapa
function drawRoute(route, data) {

    paths = osmtogeojson(data);

     let layer = L.geoJSON(paths, {
        style: { 
            color: "blue",
            weight: 3 

        }
    }).addTo(map);

    // agregar capa a
    routeLayers[route] = layer;
}

async function getLocalRoute(route) {
    //get from local file in ./R8.json

    console.log("ruta leida localmente")

    try{

        const response = await fetch(`./${route}.json`).then(response => response.json());
        return response;
    } catch (error) {
        console.error(`Error cargando ${route}:`, error);
        return null;
    }

    
}

function setLocalRoute(route, data) {
    if(!data){
        console.error("No se puede guardar una ruta vacía");
        return
    }
    localStorage.setItem(route, JSON.stringify(data));
}

async function getRoute(route) {
    // si esta guardada localmente, no hace falta hacer el fetch
    let data = null;
    // if(getLocalRoute(route)) {
    //     data = await getLocalRoute(route);
    // } else {
        data = await fetchRoute(route);
    //     setLocalRoute(route, data);
    // }

    return await data;
}

// Manejo de selección de rutas
document.getElementById("routes").addEventListener("change", async (event) => {
    let checkbox = event.target;
    let route = checkbox.getAttribute("data-route");

    if (checkbox.checked) {
        data = await getRoute(route);
        if (data) drawRoute(route, data);
    } else {
        map.removeLayer(routeLayers[route]);
        delete routeLayers[route];
    }
});

// Seleccionar todas las rutas
document.getElementById("toggleAll").addEventListener("change", async function() {
    let checked = this.checked;
    document.querySelectorAll("#routes input[type=checkbox]").forEach(async checkbox => {
        checkbox.checked = checked;
        let route = checkbox.getAttribute("data-route");

        if (checked) {
            let data = await fetchRoute(route);
            if (data) drawRoute(route, data);
        } else {
            map.removeLayer(routeLayers[route]);
            delete routeLayers[route];
        }
    });
});
