var map = new maplibregl.Map({
    container: 'map', // container ID
    style: 'style.json',
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

    map.on('click', 'bbr_bygninger', (e) => {
        new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(bbrFeatureHtml(e.features[0]))
            .addTo(map);
    });

    map.on('touchend', 'bbr_bygninger', (e) => {
        new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(bbrFeatureHtml(e.features[0]))
            .addTo(map);
    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', 'bbr_bygninger', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'bbr_bygninger', () => {
        map.getCanvas().style.cursor = '';
    });

    // Add dawa sources
    ['jordstykker', 'bygninger', 'vejstykker', 'adgangsadresser',].forEach(source => {
        map.addSource(source, {
            'type': 'geojson',
            'data': `https://api.dataforsyningen.dk/${source}?cirkel=10.226000,57.598860,1000&format=geojson`
        });
    })

    map.addSource('bbr_bygninger', {
        type: 'geojson',
        data: 'https://api.dataforsyningen.dk/bbrlight/bygninger?cirkel=10.226000,57.598860,1000&format=geojson'
    })

    map.addSource('byggefelt', {
        'type': 'geojson',
        'data': './data/byggefelt.geojson'
    });

    map.addSource('mose', {
        'type': 'geojson',
        'data': './data/mose.geojson'
    });

    map.addSource('contour', {
        'type': 'geojson',
        'data': './data/contour.geojson'
    });


    map.addSource('vejmidte', {
        'type': 'geojson',
        'data': './data/vejmidte.geojson'
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
        'id': 'byggefelt',
        'type': 'fill',
        'source': 'byggefelt',
        'layout': {},
        'paint': {
            'fill-color': 'rgb(255, 165, 0)',
            'fill-opacity': 0.4
        }
    });

    map.addLayer({
        'id': 'contour',
        'type': 'line',
        'source': 'contour',
        'layout': {},
        'paint': {
            'line-color': 'white',
            'line-width': [
                "match",
                ["%", ["get", "hoejde"], 1],
                0,
                0.7,
                0.4
            ],
            'line-opacity': [
                "interpolate", ["linear"], ["zoom"],
                16, 0,
                17, 1
            ]
        },
        minzoom: 16
    });

    map.addLayer({
        'id': 'contour_label',
        'type': 'symbol',
        'source': 'contour',
        "layout": {
            "symbol-placement": "line",
            "text-anchor": "center",
            "text-field": "{hoejde}",
            "text-offset": [0, 0.15],
            "text-size": 11,
        },
        "paint": {
            "text-color": "white",
            "text-halo-blur": 0.5,
            "text-halo-width": 1,
            "text-halo-color": "rgba(0, 0, 0, 1)"

        },
        minzoom: 17
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

    map.loadImage(
        "icons/hus.png",
        (err, image) => {
            // Throw an error if something goes wrong.
            if (err) throw err;

            // Add the image to the map style.
            map.addImage('home', image);

            // Create a new layer and style it using `fill-pattern`.
            map.addLayer({
                'id': 'bbr_bygninger',
                'type': 'symbol',
                'source': 'bbr_bygninger', // reference the data source
                'layout': {
                    'icon-image': 'home',
                    'icon-size': 0.15
                },
                'paint': {},
                minzoom: 18
            });
        }
    );

    map.addControl(draw, 'top-left');
    map.on('draw.create', updateDrawing);
    map.on('draw.delete', updateDrawing);
    map.on('draw.update', updateDrawing);
});

const bbrFeatureHtml = (feature) => {

    const allowedProps = [
        'ETAGER_ANT',
        'BYG_BEBYG_ARL',
        'ERHV_ARL_SAML',
        'BYG_BOLIG_ARL_SAML',
        'BYG_ARL_SAML',
        'BYG_ANVEND_KODE',
        'BYG_AFLOEB_TILL',
        'BYG_AFLOEB_KODE',
        'YDERVAEG_KODE',
        'TAG_KODE'
    ]

    const props = Object.keys(feature.properties)
        .filter(key => allowedProps.includes(key))
        .reduce((obj, key) => {
            obj[key] = feature.properties[key];
            return obj;
        }, {});

    let html = '<table class="popup-table">'
    for (const key in props) {
        html += `
        <tr>
            <td>${key}</td>
            <td>${props[key]}</td>
        </tr>
        `
    }
    html += '</table>'

    return html

}
