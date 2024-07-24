const map = L.map('map').setView([48.3794, 31.1656], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const drawnItems = L.featureGroup().addTo(map);

const drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    }
});
map.addControl(drawControl);

fetch('field.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: {
                color: "#ff7800",
                weight: 5,
                opacity: 0.65
            },
            onEachFeature: (feature, layer) => {
                layer.on('click', () => {
                    L.popup()
                      .setLatLng(layer.getBounds().getCenter())
                      .setContent(`<strong>${feature.properties.name || 'No Name'}</strong><br>Area: ${feature.properties.area || 'Unknown'} sq.m`)
                      .openOn(map);
                });
            }
        }).addTo(map);
    });

map.on(L.Draw.Event.CREATED, (e) => {
    const layer = e.layer;
    drawnItems.addLayer(layer);
    const geoJson = drawnItems.toGeoJSON();
    saveGeoJSON(geoJson);
});

function saveGeoJSON(data) {
    fetch('/.netlify/functions/save-geojson', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => console.log(result.message))
    .catch(error => console.error('Error:', error));
}
