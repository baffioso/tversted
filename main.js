let satellite = true

mapboxgl.accessToken = 'pk.eyJ1IjoiYmFmZmlvc28iLCJhIjoiT1JTS1lIMCJ9.f5ubY91Bi42yPnTrgiq-Gw';

var map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/satellite-v9', // style URL
    center: [10.226000, 57.598860], // starting position [lng, lat]
    zoom: 16, // starting zoom
    hash: true
});

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
        console.log(data)
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
            "text-field": ["get", "length"],
            "text-size": 17,
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
map.addControl(draw, 'top-left');
map.on('draw.create', updateDrawing);
map.on('draw.delete', updateDrawing);
map.on('draw.update', updateDrawing);

map.on('load', () => {
    // Add a data source containing GeoJSON data.
    map.addSource('matrikel', {
        'type': 'geojson',
        'data': './data/matrikel.geojson'
    });

    map.addSource('bygning', {
        'type': 'geojson',
        'data': './data/bygning.geojson'
    });

    map.addSource('mose', {
        'type': 'geojson',
        'data': './data/mose.geojson'
    });

    map.addSource('vejstykke', {
        'type': 'geojson',
        'data': './data/vejstykke.geojson'
    });

    map.addSource('vejmidte', {
        'type': 'geojson',
        'data': './data/vejmidte.geojson'
    });

    map.addSource('adresse', {
        'type': 'geojson',
        'data': './data/adresse.geojson'
    });

    // // Add a new layer to visualize the polygon.
    map.addLayer({
        'id': 'bygning',
        'type': 'fill',
        'source': 'bygning', // reference the data source
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
        'id': 'matrikel',
        'type': 'line',
        'source': 'matrikel',
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
        'source': 'vejstykke',
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
        'id': 'adresse',
        'type': 'symbol',
        'source': 'adresse',
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
});

// const toggleLayer = () => {
//     console.log('OI')
//     if (satellite) {
//         satellite = false;
//         map.removeLayer('satellite');
//         map.addLayer('dem')
//     } else {
//         satellite = true;
//         map.removeLayer('dem');
//         map.addLayer('satelite')
//     }
// }

// class MyCustomControl {
//     onAdd(map) {
//         this.map = map;
//         this._btn = document.createElement('button');
//         this._btn.className = "mapboxgl-ctrl-icon" + " " + "toggle-baselayer";
//         // this._btn.className = 'toggle-baselayer';
//         this._btn.textContent = 'Skift baggrundskort';
//         return this._btn;
//     }
//     onRemove() {
//         this._btn.parentNode.removeChild(this._btn);
//         this.map = undefined;
//     }
// }

// const myCustomControl = new MyCustomControl();

// map.addControl(myCustomControl);

    // map.addLayer(
    //     {
    //         id: 'dem',
    //         type: 'raster',
    //         source: 'dem',
    //         paint: {
    //             'raster-opacity': 1
    //         },
    //         layout: {
    //             visibility: 'visible'
    //         }
    //     });
    // console.log(map.getStyle().layers)
    //const firstSymbolId = map.getStyle().layers.find(layer => layer.type === 'symbol').id;

    // map.addSource('dem', {
    //     'type': 'raster',
    //     'tiles': [
    //         'https://tiles.baffioso.dk/data/tversted/{z}/{x}/{y}.png'
    //     ],
    //     'tileSize': 256
    // })