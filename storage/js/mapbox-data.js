/**
 * Creates and initializes a Mapbox map
 * 
 * @param {Object} mapboxgl - MapBox GL instance
 */
export function createMap(mapboxgl) {

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v11',           // streets / outdoors / light / dark
        cooperativeGestures: true,                          // ctrl or ⌘ required to scroll
        // center: [14.585443098832256, 50.01570035124198],
        center: [14.5851400000000, 50.013],
        zoom: 15.6,
        pitch: 50,
        bearing: 30,
    });
    map.addControl(new mapboxgl.NavigationControl());

    // Toggles the static image off when the map has loaded completely (waits until Mapbox fires the load event)
    map.on('load', () => {
        const mapContainerEl = document.getElementById('map');
        mapContainerEl.style.visibility = 'visible';
    });

    // The 'building' layer in the mapbox-streets vector source contains building-height
    // data from OpenStreetMap.
    map.on('load', function () {
        // Insert the layer beneath any symbol layer.
        map.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
        });

        // add a sky layer that will show when the map is highly pitched
        map.addLayer({
            'id': 'sky',
            'type': 'sky',
            'paint': {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 0.0],
                'sky-atmosphere-sun-intensity': 10
            }
        });



        var layers = map.getStyle().layers;

        var labelLayerId;
        for (var i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                labelLayerId = layers[i].id;
                break;
            }
        }

        map.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
                'fill-extrusion-color': '#c5c5c5',

                // use an 'interpolate' expression to add a smooth transition effect to the
                // buildings as the user zooms in
                'fill-extrusion-height': [
                    "interpolate", ["linear"], ["zoom"],
                    15, 0,
                    15.05, ["get", "height"]
                ],
                'fill-extrusion-base': [
                    "interpolate", ["linear"], ["zoom"],
                    15, 0,
                    15.05, ["get", "min_height"]
                ],
                'fill-extrusion-opacity': .75
            }
        }, labelLayerId);


        map.addLayer({
            'id': 'pitkovice',
            'type': 'fill',
            'source': {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': [[
                            [14.5842487, 50.0141426],
                            [14.5843881, 50.0133463],
                            [14.5846483, 50.012712],
                            [14.5874056, 50.0121087],
                            [14.5871776, 50.0115192],
                            [14.5869282, 50.0115054],
                            [14.5866868, 50.0115364],
                            [14.5821404, 50.0124793],
                            [14.5821512, 50.0126982],
                            [14.5840099, 50.0123845],
                            [14.5840046, 50.0126258],
                            [14.5838463, 50.0141357],
                            [14.5842487, 50.0141426]
                        ]]
                    }
                }
            },
            'layout': {},
            'paint': {
                'fill-color': '#b1e19d',
                'fill-opacity': 0.5,
                'fill-outline-color': '#538028',
            }
        });

        map.addLayer({
            "id": "obrys",
            "type": "line",
            "source": {
                "type": "geojson",
                "data": {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [14.5842487, 50.0141426],
                            [14.5843881, 50.0133463],
                            [14.5846483, 50.012712],
                            [14.5874056, 50.0121087],
                            [14.5871776, 50.0115192],
                            [14.5869282, 50.0115054],
                            [14.5866868, 50.0115364],
                            [14.5821404, 50.0124793],
                            [14.5821512, 50.0126982],
                            [14.5840099, 50.0123845],
                            [14.5840046, 50.0126258],
                            [14.5838463, 50.0141357],
                            [14.5842487, 50.0141426]
                        ]
                    }
                }
            },
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": {
                "line-color": "#737373",
                "line-width": 2
            }
        });

    });

    // pin markers
    var geojson = {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [14.5851392, 50.0122793]
            },
            properties: {
                title: 'Viladomy Pitkovice',
                description: '',
            }
        },
        ]
    };

    // add markers to map
    geojson.features.forEach((marker) => {

        // create a HTML element for each feature
        var logoMarker = document.createElement('div');
        logoMarker.className = 'marker-194-rd';

        // make a marker for each feature and add to the map
        new mapboxgl.Marker(logoMarker)
            .setLngLat(marker.geometry.coordinates)
        new mapboxgl.Marker(logoMarker)
            .setLngLat(marker.geometry.coordinates)
            // .setPopup(new mapboxgl.Popup({ offset: 50 }) // add popups
            // .setHTML('<div class="pop-flex"><div><div class="pop-inner"><h2>' + marker.properties.title + '</h2><p>' + marker.properties.description + '</p></div><div class="pop-features"><h2><i class="fa fa-subway" aria-hidden="true"></i>10 min.</h2><p>metro C – Háje</p><h2><i class="fa fa-shopping-cart" aria-hidden="true"></i>10 min.</h2><p>OC Čestlice</p><h2><i class="fa fa-tree" aria-hidden="true"></i>30 min.</h2><p>Přírodní park Botič-Milíčov</p></div></div><div class="pop-img"><img src="https://www.central-group.cz/storage/CG/map_images/194-img.jpg"></div></div>'))
            .addTo(map);
    });

    // image points

    var geojson = {
        "type": "FeatureCollection",
        "features": [

            {
                "type": "Feature",
                "properties": { "description": "Autobusová zastávka", "title": "", "iconSize": [50, 67], "iconId": ["bus"], },
                "geometry": { "type": "Point", "coordinates": [14.584215, 50.017054] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Autobusová zastávka", "title": "", "iconSize": [50, 67], "iconId": ["bus"], },
                "geometry": { "type": "Point", "coordinates": [14.580318, 50.020472] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Metro C- Háje", "title": "", "iconSize": [50, 67], "iconId": ["metro"], },
                "geometry": { "type": "Point", "coordinates": [14.527388, 50.030739] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Metro C- Opatov", "title": "", "iconSize": [50, 67], "iconId": ["metro"], },
                "geometry": { "type": "Point", "coordinates": [14.507560, 50.027937] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Restaurace", "title": "", "iconSize": [50, 67], "iconId": ["restaurace"], },
                "geometry": { "type": "Point", "coordinates": [14.583539, 50.018127] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Pitkovický park", "title": "", "iconSize": [50, 67], "iconId": ["park"], },
                "geometry": { "type": "Point", "coordinates": [14.585692, 50.017945] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Pitkovické rybníky", "title": "", "iconSize": [50, 67], "iconId": ["park"], },
                "geometry": { "type": "Point", "coordinates": [14.586803, 50.019066] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Dětské hřiště", "title": "", "iconSize": [50, 67], "iconId": ["playground"], },
                "geometry": { "type": "Point", "coordinates": [14.586001, 50.015921] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Dětské hřiště", "title": "", "iconSize": [50, 67], "iconId": ["playground"], },
                "geometry": { "type": "Point", "coordinates": [14.587238, 50.014352] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Dětské hřiště", "title": "", "iconSize": [50, 67], "iconId": ["playground"], },
                "geometry": { "type": "Point", "coordinates": [14.583425, 50.017818] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Fitpark Pitkovice", "title": "", "iconSize": [50, 67], "iconId": ["fitness"], },
                "geometry": { "type": "Point", "coordinates": [14.586650, 50.015301] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Venkovní posilovna", "title": "", "iconSize": [50, 67], "iconId": ["fitness"], },
                "geometry": { "type": "Point", "coordinates": [14.585181, 50.018494] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Minigolf Nové Pitkovice", "title": "", "iconSize": [50, 67], "iconId": ["sport"], },
                "geometry": { "type": "Point", "coordinates": [14.588954, 50.017106] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Aquapalace Praha", "title": "", "iconSize": [50, 67], "iconId": ["sport"], },
                "geometry": { "type": "Point", "coordinates": [14.571783, 50.007479] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Základní škola", "title": "", "iconSize": [50, 67], "iconId": ["skola"], },
                "geometry": { "type": "Point", "coordinates": [14.604010, 50.029788] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Mateřská škola", "title": "", "iconSize": [50, 67], "iconId": ["skolka"], },
                "geometry": { "type": "Point", "coordinates": [14.585101, 50.017384] }
            },
            {
                "type": "Feature",
                "properties": { "description": "OC Čestlice", "title": "", "iconSize": [50, 67], "iconId": ["shop"], },
                "geometry": { "type": "Point", "coordinates": [14.574433, 50.003903] }
            },
            {
                "type": "Feature",
                "properties": { "description": "ÚMČ Praha 22", "title": "", "iconSize": [50, 67], "iconId": ["urad"], },
                "geometry": { "type": "Point", "coordinates": [14.599375, 50.031792] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Železniční stanice Praha - Uhříněves", "title": "", "iconSize": [50, 67], "iconId": ["vlak"], },
                "geometry": { "type": "Point", "coordinates": [14.591502, 50.033785] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Supermarket Billa", "title": "", "iconSize": [50, 67], "iconId": ["shop"], },
                "geometry": { "type": "Point", "coordinates": [14.594287, 50.030283] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Supermarket Billa", "title": "", "iconSize": [50, 67], "iconId": ["shop"], },
                "geometry": { "type": "Point", "coordinates": [14.594746588034539, 50.02996634652382] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Supermarket Billa", "title": "", "iconSize": [50, 67], "iconId": ["sport"], },
                "geometry": { "type": "Point", "coordinates": [14.603141597728373, 50.03081003250047] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Divadlo", "title": "", "iconSize": [50, 67], "iconId": ["divadlo"], },
                "geometry": { "type": "Point", "coordinates": [14.605706447405268, 50.029092457722555] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Tenisové kurty", "title": "", "iconSize": [50, 67], "iconId": ["sport"], },
                "geometry": { "type": "Point", "coordinates": [14.60550697435551, 50.0282491836834] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Pivovar Uhříněves", "title": "", "iconSize": [50, 67], "iconId": ["restaurace"], },
                "geometry": { "type": "Point", "coordinates": [14.606902200558062, 50.02797746851985] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Restaurace", "title": "", "iconSize": [50, 67], "iconId": ["restaurace"], },
                "geometry": { "type": "Point", "coordinates": [14.597858321638594, 50.03194695516206] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Supermarket Norma", "title": "", "iconSize": [50, 67], "iconId": ["shop"], },
                "geometry": { "type": "Point", "coordinates": [14.59731860077843, 50.03221491977072] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Ordinace lékaře", "title": "", "iconSize": [50, 67], "iconId": ["lekar"], },
                "geometry": { "type": "Point", "coordinates": [14.59912081948685, 50.032781437340994] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Ordinace lékaře", "title": "", "iconSize": [50, 67], "iconId": ["lekar"], },
                "geometry": { "type": "Point", "coordinates": [14.595148451907345, 50.03358337215834] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Mateřská škola", "title": "", "iconSize": [50, 67], "iconId": ["skolka"], },
                "geometry": { "type": "Point", "coordinates": [14.594947119961223, 50.03467989373725] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Základní škola", "title": "", "iconSize": [50, 67], "iconId": ["skola"], },
                "geometry": { "type": "Point", "coordinates": [14.59529896059904, 50.03617386430532] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Obora v Uhříněvsi", "title": "", "iconSize": [50, 67], "iconId": ["park"], },
                "geometry": { "type": "Point", "coordinates": [14.599521866131225, 50.03473010699396] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Supermarket Lidl", "title": "", "iconSize": [50, 67], "iconId": ["shop"], },
                "geometry": { "type": "Point", "coordinates": [14.56561044964837, 50.00423052152259] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Restaurace", "title": "", "iconSize": [50, 67], "iconId": ["restaurace"], },
                "geometry": { "type": "Point", "coordinates": [14.561469080731605, 50.00220731036052] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Průhonický zámek", "title": "", "iconSize": [50, 67], "iconId": ["pamatka"], },
                "geometry": { "type": "Point", "coordinates": [14.557137428028026, 50.00049225719945] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Průhonický park", "title": "", "iconSize": [50, 67], "iconId": ["park"], },
                "geometry": { "type": "Point", "coordinates": [14.557731608513945, 49.99782333861716] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Dendrologická zahrada", "title": "", "iconSize": [50, 67], "iconId": ["park"], },
                "geometry": { "type": "Point", "coordinates": [14.5658319925543, 50.00768148754289] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Supermarket Kaufland", "title": "", "iconSize": [50, 67], "iconId": ["shop"], },
                "geometry": { "type": "Point", "coordinates": [14.569059, 50.008342] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Pošta", "title": "", "iconSize": [50, 67], "iconId": ["posta"], },
                "geometry": { "type": "Point", "coordinates": [14.577070323768307, 50.00502620370687] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Základní a mateřská škola", "title": "", "iconSize": [50, 67], "iconId": ["skola"], },
                "geometry": { "type": "Point", "coordinates": [14.603384503421664, 50.027313148426224] }
            },
            {
                "type": "Feature",
                "properties": { "description": "Restaurace", "title": "", "iconSize": [50, 67], "iconId": ["restaurace"], },
                "geometry": { "type": "Point", "coordinates": [14.605443728837741, 50.02332767266405] }
            },
        ]
    };


    // add markers to map
    geojson.features.forEach((marker) => {
        // create a DOM element for the marker
        var el = document.createElement('div');
        el.className = 'marker2';
        el.style.backgroundImage = 'url(https://www.central-group.cz/storage/CG/map_iconset/' + marker.properties.iconId + ('.svg)');
        el.style.width = marker.properties.iconSize[0] + 'px';
        el.style.height = marker.properties.iconSize[0] + 'px';


        // add marker to map
        new mapboxgl.Marker(el)
            .setLngLat(marker.geometry.coordinates)

            .setPopup(new mapboxgl.Popup({ offset: 20 }) // add popups
                .setHTML('<div class="pop-places"><h3>' + marker.properties.title + '</h3><p class="description-misc">' + marker.properties.description + '</p></div>'))
            .addTo(map);
        // map.rotateTo(-10, { duration: 60000 });
    });

}