import * as L from 'leaflet';
declare module 'leaflet' {
    interface SelectAreaFeatureOptions {
        color: string;
        weight: number;
        dashArray: string;
        selCursor: string;
        normCursor: string;
    }
    class SelectAreaFeature extends Handler {
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
