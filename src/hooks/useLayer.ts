import { useState, useEffect, useCallback, useRef } from 'react';

import useMap, { useMapType } from './useMap';

import { SourceSpecification, LayerSpecification } from 'maplibre-gl';

import MapLibreGlWrapper from '../components/MapLibreMap/lib/MapLibreGlWrapper';

import { MapLayerMouseEvent } from 'maplibre-gl';
import { GeoJSONObject } from '@turf/turf';

type useLayerType = {
	map: MapLibreGlWrapper | undefined;
	layer: LayerSpecification;
	layerId: string;
	componentId: string;
	mapHook: useMapType;
};

interface useLayerProps {
	mapId?: string;
	layerId?: string;
	idPrefix?: string;
	insertBeforeLayer?: string;
	insertBeforeFirstSymbolLayer?: boolean;
	geojson?: GeoJSONObject;
	source?: SourceSpecification | string;
	options: Partial<LayerSpecification>;
	onHover?: MapLayerMouseEvent;
	onClick?: MapLayerMouseEvent;
	onLeave?: MapLayerMouseEvent;
}

const legalLayerTypes = [
	'fill',
	'line',
	'symbol',
	'circle',
	'heatmap',
	'fill-extrusion',
	'raster',
	'hillshade',
	'background',
];

function useLayer(props: useLayerProps): useLayerType {
	const mapHook = useMap({
		mapId: props.mapId,
		waitForLayer: props.insertBeforeLayer,
	});

	const layerTypeRef = useRef<string>('');
	const layerPaintConfRef = useRef<string>('');
	const layerLayoutConfRef = useRef<string>('');

	const [layer, setLayer] = useState<any>();

	const initializedRef = useRef<boolean>(false);
	const layerId = useRef(
		props.layerId || (props.idPrefix ? props.idPrefix : 'Layer-') + mapHook.componentId
	);

	const createLayer = useCallback(() => {
		if (!mapHook.map) return;

		if (mapHook.map.map.getLayer(layerId.current)) {
			mapHook.cleanup();
		}
		if (mapHook.map.map.getSource(layerId.current)) {
			mapHook.map.map.removeSource(layerId.current);
		}

		if (typeof props.source === 'string') {
			if (props.source === '' || !mapHook.map.map.getSource(props.source)) {
				return;
			}
		}

		initializedRef.current = true;

		mapHook.map.addLayer(
			{
				...props.options,
				...(props.geojson && !props.source
					? {
							source: {
								type: 'geojson',
								data: props.geojson,
							},
					  }
					: {}),
				...(props.source
					? {
							source: props.source,
					  }
					: {}),
				id: layerId.current,
			},
			props.insertBeforeLayer
				? props.insertBeforeLayer
				: props.insertBeforeFirstSymbolLayer
				? mapHook.map.firstSymbolLayer
				: undefined,
			mapHook.componentId
		);

		setLayer(mapHook.map.map.getLayer(layerId.current));

		if (typeof props.onHover !== 'undefined') {
			mapHook.map.on('mousemove', layerId.current, props.onHover, mapHook.componentId);
		}

		if (typeof props.onClick !== 'undefined') {
			mapHook.map.on('click', layerId.current, props.onClick, mapHook.componentId);
		}

		if (typeof props.onLeave !== 'undefined') {
			mapHook.map.on('mouseleave', layerId.current, props.onLeave, mapHook.componentId);
		}

		// recreate layer if style has changed
		mapHook.map.on(
			'styledata',
			() => {
				if (initializedRef.current && !mapHook.map?.map.getLayer(layerId.current)) {
					console.log('Recreate Layer');
					createLayer();
				}
			},
			mapHook.componentId
		);

		layerPaintConfRef.current = JSON.stringify(props.options?.paint);
		layerLayoutConfRef.current = JSON.stringify(props.options?.layout);
		layerTypeRef.current = props.options.type as LayerSpecification['type'];
	}, [props, mapHook.map]);

	useEffect(() => {
		if (!mapHook.map) return;

		if (
			initializedRef.current &&
			(legalLayerTypes.indexOf(props.options.type as LayerSpecification['type']) === -1 ||
				(legalLayerTypes.indexOf(props.options.type as LayerSpecification['type']) !== -1 &&
					props.options.type === layerTypeRef.current))
		) {
			return;
		}

		createLayer();
	}, [mapHook.map, props.options, createLayer]);

	useEffect(() => {
		if (!initializedRef.current || !mapHook.map?.map?.getSource(layerId.current)) return;

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore setData only exists on GeoJsonSource
		mapHook.map.map.getSource(layerId.current)?.setData?.(props.geojson);
	}, [props.geojson, mapHook.map, props.options.type]);

	useEffect(() => {
		if (
			!mapHook.map ||
			!mapHook.map?.map?.getLayer?.(layerId.current) ||
			!initializedRef.current ||
			props.options.type !== layerTypeRef.current
		)
			return;

		let key;

		const layoutString = JSON.stringify(props.options.layout);
		if (props.options.layout && layoutString !== layerLayoutConfRef.current) {
			const oldLayout = JSON.parse(layerLayoutConfRef.current);

			for (key in props.options.layout) {
				if (props.options.layout?.[key] && props.options.layout[key] !== oldLayout[key]) {
					mapHook.map.map.setLayoutProperty(layerId.current, key, props.options.layout[key]);
				}
			}
			layerLayoutConfRef.current = layoutString;
		}

		const paintString = JSON.stringify(props.options.paint);
		if (paintString !== layerPaintConfRef.current) {
			const oldPaint = JSON.parse(layerPaintConfRef.current);
			for (key in props.options.paint) {
				if (props.options.paint?.[key] && props.options.paint[key] !== oldPaint[key]) {
					mapHook.map.map.setPaintProperty(layerId.current, key, props.options.paint[key]);
				}
			}
			layerPaintConfRef.current = paintString;
		}
	}, [props.options, mapHook.map]);

	useEffect(() => {
		return () => {
			initializedRef.current = false;
			mapHook.cleanup();
		};
	}, []);

	return {
		map: mapHook.map,
		layer: layer,
		layerId: layerId.current,
		componentId: mapHook.componentId,
		mapHook: mapHook,
	};
}

export default useLayer;
