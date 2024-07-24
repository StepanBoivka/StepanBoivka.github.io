function handleLayer(layer) {
    if (!layer || !layer.getLatLngs) return;

    var feature = layer.feature = layer.feature || {};
    feature.type = feature.type || "Feature";
    var props = feature.properties = feature.properties || {};
    props.name = prompt("Введіть назву поля:", props.name || "");

    if (layer instanceof L.Polygon) {
        props.area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
    }

    var geojson = drawnItems.toGeoJSON();
    saveChanges(geojson);
}
