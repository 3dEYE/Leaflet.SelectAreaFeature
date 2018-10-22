import * as L from 'leaflet';

declare module 'leaflet' {
    export interface SelectAreaFeatureOptions {
        color: string;
        weight: number;
        dashArray: string;
        selCursor: string;
        normCursor: string;
    }

    export class SelectAreaFeature extends Handler {
        options: L.SelectAreaFeatureOptions;
        map: L.Map;
        preLatLng: L.LatLng | null;
        postLatLng: L.LatLng | null;
        latLngLines: any[];
        latLngs: any[];
        areaPolygonLayers: L.Polygon[];
        areaLine: L.Layer | null;
        areaLineNew: L.Layer | null;
        onMouseDown: L.LeafletEventHandlerFn;
        onMouseMove: L.LeafletEventHandlerFn;
        onMouseUp: L.LeafletEventHandlerFn;
        getFeaturesSelected: (layertype: 'all' | 'polyline' | 'polygon' | 'circle' | 'marker' | 'rectangle' | 'circlemarker') => L.Layer[] | null;
        removeLastArea: () => void;
        removeAllArea: () => void;
        constructor(map: L.Map, options?: SelectAreaFeatureOptions);
    }

    interface Map {
        selectAreaFeature: SelectAreaFeature;
    }
}

const SelectAreaFeature = L.Handler.extend({
    options: {
        color: 'green',
        weight: 2,
        dashArray: '5, 5, 1, 5',
        selCursor: 'crosshair',
        normCursor: ''
    },

    initialize(this: L.SelectAreaFeature, map: L.Map, options: L.SelectAreaFeatureOptions) {
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

    addHooks(this: L.SelectAreaFeature) {
        this.map.on('mousedown', this.onMouseDown, this);
        this.map.on('mouseup', this.onMouseUp, this);

        this.map.dragging.disable();

        this.map.getContainer().style.cursor = this.options.selCursor;
    },

    removeHooks(this: L.SelectAreaFeature) {
        this.map.off('mousemove');
        this.map.off('mousedown');
        this.map.off('mouseup');
        this.map.getContainer().style.cursor = this.options.normCursor;

        this.map.dragging.enable();
    },

    onMouseUp(this: L.SelectAreaFeature, ev: L.LeafletMouseEvent) {
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

    onMouseDown(this: L.SelectAreaFeature, ev: L.LeafletMouseEvent) {
        this.latLngs = [];
        this.areaLineNew = null;
        this.areaLine = null;

        this.map.on('mousemove', this.onMouseMove, this);
    },

    onMouseMove(this: L.SelectAreaFeature, ev: L.LeafletMouseEvent) {
        this.latLngs.push(ev.latlng);
        if (!this.preLatLng) {
            this.preLatLng = ev.latlng;
            this.latLngLines.push(this.preLatLng);
        } else if (this.preLatLng && (!this.postLatLng)) {
            this.postLatLng = ev.latlng;
            this.latLngLines.push(this.postLatLng);
        } else {
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

    getAreaLatLng(this: L.SelectAreaFeature) {
        return this.latLngs;
    },

    removeAllArea(this: L.SelectAreaFeature) {
        let i = 0;
        while (i < this.areaPolygonLayers.length) {
            this.map.removeLayer(this.areaPolygonLayers[i]);
            i++;
        }
        this.areaPolygonLayers.splice(0, i);
    },

    removeLastArea(this: L.SelectAreaFeature) {
        const index = this.areaPolygonLayers.length - 1;
        this.map.removeLayer(this.areaPolygonLayers[index]);
        this.areaPolygonLayers.splice(index, 1);
    },

    getFeaturesSelected(this: L.SelectAreaFeature, layertype: 'all'|'polyline'|'polygon'|'circle'|'marker'|'rectangle'|'circlemarker') {
        const layersFound: L.Layer[] = [];
        let pol: L.LatLngBounds;
        let i = 0;

        const areaPolygonLayers = this.areaPolygonLayers as L.Polygon[];
        const map = this.map as L.Map;

        while (i < areaPolygonLayers.length) {
            const polygon = areaPolygonLayers[i];
            pol = areaPolygonLayers[i].getBounds();

            map.eachLayer(layer => {
                if (
                    (layertype === 'polygon' || layertype === 'all') &&
                    layer instanceof L.Polygon &&
                    !pol.equals(layer.getBounds())
                ) {
                    if (pol.contains(layer.getBounds())) {
                        layersFound.push(layer);
                    }
                }
                if (
                    (layertype === 'polyline' || layertype === 'all') &&
                    layer instanceof L.Polyline &&
                    !pol.equals(layer.getBounds())
                ) {
                    if (pol.contains(layer.getBounds())) {
                        layersFound.push(layer);
                    }
                }
                if (
                    (layertype === 'circle' || layertype === 'all') &&
                    layer instanceof L.Circle &&
                    !pol.equals(layer.getBounds())
                ) {
                    if (pol.contains(layer.getBounds())) {
                        layersFound.push(layer);
                    }
                }
                if (
                    (layertype === 'rectangle' || layertype === 'all') &&
                    layer instanceof L.Rectangle &&
                    !pol.equals(layer.getBounds())
                ) {
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

(L as any).SelectAreaFeature = SelectAreaFeature;
L.Map.addInitHook('addHandler', 'selectAreaFeature', L.SelectAreaFeature);
