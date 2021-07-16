mapboxgl.accessToken = 'pk.eyJ1IjoiYmFmZmlvc28iLCJhIjoiT1JTS1lIMCJ9.f5ubY91Bi42yPnTrgiq-Gw';

var map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/satellite-v9', // style URL
    center: [10.226000, 57.598860], // starting position [lng, lat]
    zoom: 16 // starting zoom
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

map.addControl(new mapboxgl.FullscreenControl(),
    'bottom-right'
);

map.on('load', function () {
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
        'id': 'outline',
        'type': 'line',
        'source': 'matrikel',
        'layout': {},
        'paint': {
            'line-color': 'red',
            'line-width': 2
        }
    });
});