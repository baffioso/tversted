let satellite = true

mapboxgl.accessToken = 'pk.eyJ1IjoiYmFmZmlvc28iLCJhIjoiT1JTS1lIMCJ9.f5ubY91Bi42yPnTrgiq-Gw';

var map = new mapboxgl.Map({
    container: 'map', // container ID
    style: {
        version: 8,
        glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
        sources: {
            orto: {
                type: 'raster',
                tiles: [
                    'https://services.datafordeler.dk/GeoDanmarkOrto/orto_foraar/1.0.0/WMS?username=DTMMBNXGMB&password=LvA$*001&VERSION=1.1.1&REQUEST=GetMap&BBOX={bbox-epsg-3857}&SRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=orto_foraar&STYLES=&FORMAT=image/jpeg'
                ],
                tileSize: 256
            }
        },
        layers: [
            {
                id: 'orto',
                type: 'raster',
                source: 'orto',
                paint: {
                    'raster-opacity': 1
                },
                layout: {
                    visibility: 'visible'
                }
            }
        ]
    },
    center: [10.226000, 57.598860], // starting position [lng, lat]
    zoom: 16, // starting zoom
    hash: true
});

map.addControl(new mapboxgl.NavigationControl({ showZoom: false }));
map.addControl(new mapboxgl.ScaleControl());


// Add geolocate control to the map.
map.addControl(
    new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        fitBoundsOptions: { maxZoom: 19 },
        trackUserLocation: true
    }),
    'bottom-right'
);

map.addControl(
    new mapboxgl.FullscreenControl(),
    'bottom-right'
);

const updateDrawing = (e) => {
    let data = draw.getAll();

    if (data.features.length > 0) {
        data.features = data.features.map(i => {
            return { ...i, properties: { length: Math.round(turf.length(i.geometry) * 1000) } }
        })
        addLineLength(data)
    } else {
        if (e.type === 'draw.delete' && data.features.length === 0) {
            if (map.getLayer('measure-line-length')) {
                map.removeLayer('measure-line-length')
                map.removeSource('measure-line-length')
            }
        }
    }

}

const addLineLength = (lineString) => {
    if (map.getLayer('measure-line-length')) {
        map.removeLayer('measure-line-length')
        map.removeSource('measure-line-length')
    }

    map.addSource('measure-line-length', {
        type: 'geojson',
        data: lineString
    })

    map.addLayer({
        id: 'measure-line-length',
        type: 'symbol',
        source: 'measure-line-length',
        "layout": {
            "text-field": ['concat', ["get", "length"], ' m'],
            "text-size": 18,
            "symbol-placement": "line-center",
            "text-rotation-alignment": "map",
            "text-keep-upright": true
        },
        "paint": {
            "text-color": "rgba(247, 247, 247, 1)",
            "text-halo-width": 1,
            "text-halo-color": "black"
        }
    })
}

draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
        //polygon: true,
        trash: true,
        line_string: true
    }
})

map.on('load', () => {

    // Add dawa sources
    ['jordstykker', 'bygninger', 'vejstykker', 'adgangsadresser'].forEach(source => {
        map.addSource(source, {
            'type': 'geojson',
            'data': `https://api.dataforsyningen.dk/${source}?cirkel=10.226000,57.598860,1000&format=geojson`
        });
    })

    map.addSource('mose', {
        'type': 'geojson',
        'data': './data/mose.geojson'
    });

    map.addSource('vejmidte', {
        'type': 'geojson',
        'data': './data/vejmidte.geojson'
    });

    map.addLayer({
        'id': 'bygninger',
        'type': 'fill',
        'source': 'bygninger', // reference the data source
        'layout': {},
        'paint': {
            'fill-color': 'green', // blue color fill
            'fill-opacity': 0.6
        }
    });

    map.addLayer({
        'id': 'mose',
        'type': 'fill',
        'source': 'mose', // reference the data source
        'layout': {},
        'paint': {
            'fill-color': 'brown', // blue color fill
            'fill-opacity': 0.6
        }
    });

    // Add a black outline around the polygon.
    map.addLayer({
        'id': 'jordstykker',
        'type': 'line',
        'source': 'jordstykker',
        'layout': {},
        'paint': {
            'line-color': 'red',
            'line-width': 2
        }
    });

    map.addLayer({
        'id': 'vej',
        'type': 'line',
        'source': 'vejmidte',
        'layout': {},
        'paint': {
            'line-color': 'white',
            'line-width': 3,
            'line-opacity': 0.6
        }
    });

    map.addLayer({
        'id': 'vejnavn',
        'type': 'symbol',
        'source': 'vejstykker',
        "layout": {
            "symbol-placement": "line",
            "text-anchor": "center",
            "text-field": "{navn}",
            "text-offset": [0, 0.15],
            "text-size": {
                "base": 1,
                "stops": [[13, 12], [14, 13]]
            }
        },
        "paint": {
            "text-color": "white",
            "text-halo-blur": 0.5,
            "text-halo-width": 1,
            "text-halo-color": "rgba(0, 0, 0, 1)"

        }
    });

    map.addLayer({
        'id': 'husnr',
        'type': 'symbol',
        'source': 'adgangsadresser',
        "layout": {
            "text-field": "{husnr}",
            "text-size": 10
        },
        "paint": {
            "text-color": "white",
            "text-halo-blur": 0.5,
            "text-halo-width": 1,
            "text-halo-color": "rgba(0, 0, 0, 1)"

        }
    });

    map.addControl(draw, 'top-left');
    map.on('draw.create', updateDrawing);
    map.on('draw.delete', updateDrawing);
    map.on('draw.update', updateDrawing);
});