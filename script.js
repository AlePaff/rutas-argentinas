let map = L.map("map").setView([-38.4161, -63.6167], 5); // Centrar en Argentina

// Cargar tiles de OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

let rutasLayer = {}; // Almacena las rutas dibujadas

// Lista de Rutas Nacionales con sus relaciones OSM
let rutasNacionales = {
    "Ruta 1": 168423,
    "Ruta 3": 167894,
    "Ruta 5": 172941,
    "Ruta 7": 172937,
    "Ruta 8": 172947,
    "Ruta 9": 3429120
};

// Crear los checkboxes dinámicamente
let controlsDiv = document.getElementById("routes");
Object.keys(rutasNacionales).forEach(ruta => {
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = ruta;
    checkbox.addEventListener("change", () => toggleRoute(ruta, checkbox.checked));

    let label = document.createElement("label");
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + ruta));

    controlsDiv.appendChild(label);
    controlsDiv.appendChild(document.createElement("br"));
});

// Checkbox para activar/desactivar todas las rutas
document.getElementById("toggleAll").addEventListener("change", function () {
    let checked = this.checked;
    Object.keys(rutasNacionales).forEach(ruta => {
        let checkbox = document.getElementById(ruta);
        checkbox.checked = checked;
        toggleRoute(ruta, checked);
    });
});

// Función para obtener la ruta desde Overpass API
async function fetchRoute(relationId) {
    let query = `[out:json]; relation(${relationId});(._;>;); out body;`;
    let url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    let response = await fetch(url);
    let data = await response.json();

    return parseRouteData(data);
}

// Función para procesar los datos de Overpass
function parseRouteData(data) {
    let nodes = {};
    let ways = [];

    // Guardar nodos en un diccionario
    data.elements.forEach(el => {
        if (el.type === "node") {
            nodes[el.id] = [el.lat, el.lon];
        } else if (el.type === "way") {
            ways.push(el.nodes);
        }
    });

    // Convertir ways en coordenadas
    return ways.map(way => way.map(nodeId => nodes[nodeId])).filter(path => path.length > 0);
}

// Función para mostrar/ocultar rutas en el mapa
async function toggleRoute(ruta, show) {
    let relationId = rutasNacionales[ruta];

    if (show) {
        if (!rutasLayer[ruta]) {
            let paths = await fetchRoute(relationId);
            let polyline = L.polyline(paths, {
                color: "red",
                weight: 4,
                opacity: 0.7
            }).addTo(map);

            rutasLayer[ruta] = polyline;
        }
    } else {
        if (rutasLayer[ruta]) {
            map.removeLayer(rutasLayer[ruta]);
            delete rutasLayer[ruta];
        }
    }
}
