import * as L from 'leaflet';
var SelectAreaFeature = L.Handler.extend({
    options: {
        color: 'green',
        weight: 2,
        dashArray: '5, 5, 1, 5',
        selCursor: 'crosshair',
        normCursor: ''
    },
    initialize: function (map, options) {
        this.map = map;
        this.preLatLng = null;
        this.postLatLng = null;
        this.latLngLines = [];
        this.latLngs = [];
        this.areaPolygonLayers = [];
        this.areaLine = null;
        this.areaLineNew = null;
        L.Util.setOptions(this, options);
    },
    addHooks: function () {
        this.map.on('mousedown', this.onMouseDown, this);
        this.map.on('mouseup', this.onMouseUp, this);
        this.map.dragging.disable();
        this.map.getContainer().style.cursor = this.options.selCursor;
    },
    removeHooks: function () {
        this.map.off('mousemove');
        this.map.off('mousedown');
        this.map.off('mouseup');
        this.map.getContainer().style.cursor = this.options.normCursor;
        this.map.dragging.enable();
    },
    onMouseUp: function (ev) {
        if (this.latLngs.length < 1) {
            this.map.off('mousemove');
            return;
        }
        this.preLatLng = null;
        this.postLatLng = null;
        this.latLngLines = [];
        this.areaPolygonLayers.push(L.polygon(this.latLngs, { color: this.options.color }).addTo(this.map));
        if (this.areaLine && this.map.hasLayer(this.areaLine)) {
            this.map.removeLayer(this.areaLine);
        }
        if (this.areaLineNew && this.map.hasLayer(this.areaLineNew)) {
            this.map.removeLayer(this.areaLineNew);
        }
        this.map.off('mousemove');
        this.map.fireEvent('selectarea:drawend', ev);
    },
    onMouseDown: function (ev) {
        this.latLngs = [];
        this.areaLineNew = null;
        this.areaLine = null;
        this.map.on('mousemove', this.onMouseMove, this);
    },
    onMouseMove: function (ev) {
        this.latLngs.push(ev.latlng);
        if (!this.preLatLng) {
            this.preLatLng = ev.latlng;
            this.latLngLines.push(this.preLatLng);
        }
        else if (this.preLatLng && (!this.postLatLng)) {
            this.postLatLng = ev.latlng;
            this.latLngLines.push(this.postLatLng);
        }
        else {
            this.preLatLng = this.postLatLng;
            this.postLatLng = ev.latlng;
            this.latLngLines.push(this.preLatLng);
            this.latLngLines.push(this.postLatLng);
        }
        if (this.preLatLng && this.postLatLng) {
            if (!this.areaLineNew && !this.areaLine) {
                this.areaLine = L.polyline(this.latLngLines, {
                    color: this.options.color,
                    weight: this.options.weight,
                    dashArray: this.options.dashArray
                });
                this.areaLine.addTo(this.map);
            }
            if (!this.areaLineNew && this.areaLine) {
                this.areaLineNew = L.polyline(this.latLngLines, {
                    color: this.options.color,
                    weight: this.options.weight,
                    dashArray: this.options.dashArray
                });
                this.areaLineNew.addTo(this.map);
                this.map.removeLayer(this.areaLine);
            }
            if (this.areaLineNew && this.areaLine) {
                this.areaLine = L.polyline(this.latLngLines, {
                    color: this.options.color,
                    weight: this.options.weight,
                    dashArray: this.options.dashArray
                });
                this.areaLine.addTo(this.map);
                this.map.removeLayer(this.areaLineNew);
                this.areaLineNew = null;
            }
        }
    },
    getAreaLatLng: function () {
        return this.latLngs;
    },
    removeAllArea: function () {
        var i = 0;
        while (i < this.areaPolygonLayers.length) {
            this.map.removeLayer(this.areaPolygonLayers[i]);
            i++;
        }
        this.areaPolygonLayers.splice(0, i);
    },
    removeLastArea: function () {
        var index = this.areaPolygonLayers.length - 1;
        this.map.removeLayer(this.areaPolygonLayers[index]);
        this.areaPolygonLayers.splice(index, 1);
    },
    getFeaturesSelected: function (layertype) {
        var layersFound = [];
        var pol;
        var i = 0;
        var areaPolygonLayers = this.areaPolygonLayers;
        var map = this.map;
        while (i < areaPolygonLayers.length) {
            pol = areaPolygonLayers[i].getBounds();
            map.eachLayer(function (layer) {
                if ((layertype === 'polygon' || layertype === 'all') &&
                    layer instanceof L.Polygon &&
                    !pol.equals(layer.getBounds())) {
                    if (pol.contains(layer.getBounds())) {
                        layersFound.push(layer);
                    }
                }
                if ((layertype === 'polyline' || layertype === 'all') &&
                    layer instanceof L.Polyline &&
                    !pol.equals(layer.getBounds())) {
                    if (pol.contains(layer.getBounds())) {
                        layersFound.push(layer);
                    }
                }
                if ((layertype === 'circle' || layertype === 'all') &&
                    layer instanceof L.Circle &&
                    !pol.equals(layer.getBounds())) {
                    if (pol.contains(layer.getBounds())) {
                        layersFound.push(layer);
                    }
                }
                if ((layertype === 'rectangle' || layertype === 'all') &&
                    layer instanceof L.Rectangle &&
                    !pol.equals(layer.getBounds())) {
                    if (pol.contains(layer.getBounds())) {
                        layersFound.push(layer);
                    }
                }
                if ((layertype === 'marker' || layertype === 'all') && layer instanceof L.Marker) {
                    if (pol.contains(layer.getLatLng())) {
                        layersFound.push(layer);
                    }
                }
                if ((layertype === 'circlemarker' || layertype === 'all') && layer instanceof L.CircleMarker) {
                    if (pol.contains(layer.getLatLng())) {
                        layersFound.push(layer);
                    }
                }
            });
            i++;
        }
        if (layersFound.length === 0) {
            return null;
        }
        return layersFound;
    }
});
L.SelectAreaFeature = SelectAreaFeature;
L.Map.addInitHook('addHandler', 'selectAreaFeature', L.SelectAreaFeature);
