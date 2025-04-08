const BBOX_ARG = '-55.2,-73.6,-21.8,-53.6';

// const PROVINCIAS = {
//     "Jujuy": {
//         "display_name": "Jujuy",
//         "relation_id": 172947,
//     },
//     "Salta": {
//         "display_name": "Salta",
//         "relation_id": 172947,
//     },
//     "Tucumán": {
//         "display_name": "Tucumán",
//         "relation_id": 172947,
//     },
//     "Catamarca": {
//         "display_name": "Catamarca",
//         "relation_id": 172947,
//     },
//     "La Rioja": {
//         "display_name": "La Rioja",
//         "relation_id": 172947,
//     },
//     "Formosa": {
//         "display_name": "Formosa",
//         "relation_id": 172947,
//     },
//     "Chaco": {
//         "display_name": "Chaco",
//         "relation_id": 172947,
//     },
//     "Santiago del Estero": {
//         "display_name": "Santiago del Estero",
//         "relation_id": 172947,
//     },
//     "Norte de Santa Fe": {
//         "display_name": "Norte de Santa Fe",
//         "relation_id": 172947,
//     },
//     "Misiones": {
//         "display_name": "Misiones",
//         "relation_id": 172947,
//     },
//     "Corrientes": {
//         "display_name": "Corrientes",
//         "relation_id": 172947,
//     },
//     "Entre Ríos": {
//         "display_name": "Entre Ríos",
//         "relation_id": 172947,
//     },
//     "San Juan": {
//         "display_name": "San Juan",
//         "relation_id": 172947,
//     },
//     "Mendoza": {
//         "display_name": "Mendoza",
//         "relation_id": 172947,
//     },
//     "San Luis": {
//         "display_name": "San Luis",
//         "relation_id": 172947,
//     },
//     "La Pampa": {
//         "display_name": "La Pampa",
//         "relation_id": 172947,
//     },
//     "Córdoba": {
//         "display_name": "Córdoba",
//         "relation_id": 172947,
//     },
//     "Centro - Sur de Santa Fe": {
//         "display_name": "Centro - Sur de Santa Fe",
//         "relation_id": 172947,
//     },
//     "Ciudad Autónoma de Buenos Aires": {
//         "display_name": "Ciudad Autónoma de Buenos Aires",
//         "relation_id": 172947,
//     },
//     "Buenos Aires": {
//         "display_name": "Buenos Aires",
//         "relation_id": 172947,
//         "alt_names": ["Provincia de Buenos Aires"],
//     },
//     "Neuquén": {
//         "display_name": "Neuquén",
//         "relation_id": 172947,
//     },
//     "Río Negro": {
//         "display_name": "Río Negro",
//         "relation_id": 123,
//     },
//     "Chubut": {
//         "display_name": "Chubut",
//         "relation_id": 1234,
//     },
//     "Santa Cruz": {
//         "display_name": "Santa Cruz",
//         "relation_id": 1234,
//     },
//     "Tierra del Fuego": {
//         "display_name": "Tierra del Fuego",
//         "relation_id": 1234,
//     },
// }



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
                "display_name": "Región I",
                "description": "Zona Andina del Norte, (Jujuy, Salta, Catamarca, Tucumán, La Rioja). Números del 51 al 80.",
                "rutas": [51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80],
                "provincias": ["Jujuy", "Salta", "Tucumán", "Catamarca", "La Rioja"],
                "osm_query": `
                    [out:json][bbox:${BBOX_ARG}];
                    (
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="JJY"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="SA"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="TU"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="CTM"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="LR"];
                    );
                    out geom;
                `,
                "region_color": "#e3ffe3",
                "title_coords": [-25.2049, -66.1377],
            },
            "region_2": {
                "display_name": "Región II",
                "description": "Región Chaqueña, (Formosa, Chaco, Santiago del Estero, Santa Fe norte). Números del 81 al 100.",
                "rutas": [81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100],
                "provincias": ["Formosa", "Chaco", "Santiago del Estero", "Norte de Santa Fe"],
                "osm_query": `
                    [out:json][bbox:${BBOX_ARG}];
                    (
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="FSA"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="CCO"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="SDE"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="SF"];
                    );
                    out geom;
                `,
                "region_color": "#ffeec0",
                "title_coords": [-28.0720, -61.6333],
            },
            "region_3": {
                "display_name": "Región III",
                "description": "Mesopotámica, (Entre Ríos, Corrientes Misiones). Números del 101 al 140.",
                "rutas": [101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140],
                "provincias": ["Misiones", "Corrientes", "Entre Ríos"],
                "osm_query": `
                    [out:json][bbox:${BBOX_ARG}];
                    (
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="MIS"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="CRR"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="ER"];
                    );
                    out geom;
                `,
                "region_color": "#ffe3e3",
                "title_coords": [-28.2463, -57.2388],
            },
            "region_4": {
                "display_name": "Región IV",
                "description": "Cuyo y La Pampa, (San Juan, Mendoza, San Luis y La Pampa). Números del 141 al 155.",
                "rutas": [141,142,143,144,145,146,147,148,149,150,151,152,153,154,155],
                "provincias": ["San Juan", "Mendoza", "San Luis", "La Pampa"],
                "osm_query": `
                    [out:json][bbox:${BBOX_ARG}];
                    (
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="SJ"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="MZA"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="SL"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="LP"];
                    );
                    out geom;
                `,
                "region_color": "#e3e3ff",
                "title_coords": [-34.1436, -67.2363],
            },
            "region_5": {
                "display_name": "Región V",
                "description": "Centro, (Córdoba, centro y sur de Santa Fe) : Números del 156 al 185.",
                "rutas": [156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185],
                "provincias": ["Córdoba", "Centro - Sur de Santa Fe"],
                "osm_query": `
                    [out:json][bbox:${BBOX_ARG}];
                    (
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="CBA"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="SF"];
                    );
                    out geom;
                `,
                "region_color": "#ffffd0",
                "title_coords": [-31.8402, -62.1606],
            },
            "region_6": {
                "display_name": "Región VI",
                "description": "Capital Federal y Buenos Aires. Números del 186 al 230.",
                "rutas": [186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230],
                "provincias": ["Ciudad Autónoma de Buenos Aires", "Provincia de Buenos Aires"],
                "osm_query": `
                    [out:json][bbox:${BBOX_ARG}];
                    (
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="BA"];
                    );
                    out geom;
                `,
                "region_color": "#ffeec0",
                "title_coords": [-36.4566, -60.0513],
            },            
            "region_7": {
                "display_name": "Región VII",
                "description": "Neuquén y Río Negro. Números del 231 al 255.",
                "rutas": [231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255],
                "provincias": ["Neuquén", "Río Negro"],
                "osm_query": `
                    [out:json][bbox:${BBOX_ARG}];
                    (
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="NQN"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="RN"];
                    );
                    out geom;
                `,
                "region_color": "#ffceff",
                "title_coords": [-40.1117, -68.1592],
            },
            "region_8": {
                "display_name": "Región VIII",
                "description": "Chubut, Santa Cruz y Tierra del Fuego. Números del 256 al 300.",
                "rutas": [256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300],
                "provincias": ["Chubut", "Santa Cruz", "Tierra del Fuego AIAS"],
                "osm_query": `
                    [out:json][bbox:${BBOX_ARG}];
                    (
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="CHB"];
                        relation["admin_level"="4"]["boundary"="administrative"]["name"="Santa Cruz"];
                        relation["admin_level"="4"]["boundary"="administrative"]["ref"="TDF"];
                    );
                    out geom;
                `,
                "region_color": "#ceeef3",
                "title_coords": [-47.1242, -70.5542],
            }
        }
    }
}
