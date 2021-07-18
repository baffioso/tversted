var map = new maplibregl.Map({
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
    zoom: 15,
    hash: true,
    accessToken: 'pk.eyJ1IjoiYmFmZmlvc28iLCJhIjoiT1JTS1lIMCJ9.f5ubY91Bi42yPnTrgiq-Gw'
});

map.addControl(new maplibregl.NavigationControl({ showZoom: false }));
map.addControl(new maplibregl.ScaleControl());


// Add geolocate control to the map.
map.addControl(
    new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        fitBoundsOptions: { maxZoom: 19 },
        trackUserLocation: true
    }),
    'bottom-right'
);

map.addControl(
    new maplibregl.FullscreenControl(),
    'bottom-right'
);

const updateDrawing = (e) => {
    let data = draw.getAll();

    let line = data.features.filter(feature => feature.geometry.type === 'LineString')
    let polygon = data.features.filter(feature => feature.geometry.type === 'Polygon')

    if (line.length > 0) {
        const lineString = line.map(feature => {
            return { ...feature, properties: { measure: Math.round(turf.length(feature.geometry) * 1000) } }
        })

        addLineLengthLabel({
            "type": "FeatureCollection",
            "features": lineString
        });
    }

    if (polygon.length > 0) {
        const polygons = polygon.map(feature => {
            return { ...feature, properties: { measure: Math.round(turf.area(feature.geometry)) } }
        })

        addPolygonAreaLabel({
            "type": "FeatureCollection",
            "features": polygons
        });
    }

    if (e.type === 'draw.delete' && data.features.length === 0) {
        if (map.getLayer('measure-line-length')) {
            map.removeLayer('measure-line-length')
            map.removeSource('measure-line-length')
        }

        if (map.getLayer('measure-polygon-area')) {
            map.removeLayer('measure-polygon-area')
            map.removeSource('measure-polygon-area')
        }
    }

}

const addPolygonAreaLabel = (polygon) => {
    if (map.getLayer('measure-polygon-area')) {
        map.removeLayer('measure-polygon-area')
        map.removeSource('measure-polygon-area')
    }

    map.addSource('measure-polygon-area', {
        type: 'geojson',
        data: polygon
    })

    map.addLayer(
        {
            "id": "measure-polygon-area",
            "type": "symbol",
            "source": "measure-polygon-area",
            "layout": {
                "text-field": ['concat', ["get", "measure"], ' m2'],
                "text-size": 18,

            },
            "paint": {
                "text-color": "white",
                "text-halo-color": "black",
                "text-halo-width": 1
            }
        }
    )

}

const addLineLengthLabel = (lineString) => {
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
            "text-field": ['concat', ["get", "measure"], ' m'],
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
        polygon: true,
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
        'id': 'jordstykker',
        'type': 'line',
        'source': 'jordstykker',
        'layout': {},
        'paint': {
            'line-color': [
                "match",
                ["get", "matrikelnr"],
                "94b",
                "#2d5aff",
                "red"
            ],
            'line-width': 2
        }
    });

    map.addLayer({
        'id': 'jordstykker_fill',
        'type': 'fill',
        'source': 'jordstykker',
        'layout': {
        },
        'paint': {
            'fill-opacity': [
                "match",
                ["get", "matrikelnr"],
                "94b",
                0,
                "94ap",
                0,
                0.3
            ]
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

    // map.loadImage(
    //     "icons/pattern.png",
    //     (err, image) => {
    //         // Throw an error if something goes wrong.
    //         if (err) throw err;

    //         // Add the image to the map style.
    //         map.addImage('pattern', image);

    //         // Create a new layer and style it using `fill-pattern`.
    //         map.addLayer({
    //             'id': 'mose_pattern',
    //             'type': 'fill',
    //             'source': 'mose',
    //             'paint': {
    //                 'fill-pattern': 'pattern'
    //             }
    //         });
    //     }
    // );

    map.addLayer({
        'id': 'mose_label',
        'type': 'symbol',
        'source': 'mose',
        "layout": {
            "text-field": "Mose",
            "text-size": 11
        },
        "paint": {
            "text-color": "white"
        },
        minzoom: 15
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

        },
        minzoom: 14
    });

    map.addControl(draw, 'top-left');
    map.on('draw.create', updateDrawing);
    map.on('draw.delete', updateDrawing);
    map.on('draw.update', updateDrawing);
});