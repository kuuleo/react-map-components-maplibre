import { useState, useEffect, useCallback, useRef } from 'react';

import useMap, { useMapType } from './useMap';

import {
	GeoJSONSourceSpecification,
	LayerSpecification,
	MapMouseEvent,
	Style,
	MapEventType,
	Map,
	FilterSpecification,
} from 'maplibre-gl';

import MapLibreGlWrapper from '../components/MapLibreMap/lib/MapLibreGlWrapper';

import { GeoJSONObject } from '@turf/turf';

type getLayerType = Style['getLayer'];

type useLayerType = {
	map: MapLibreGlWrapper | undefined;
	layer: ReturnType<getLayerType> | undefined;
	layerId: string;
	componentId: string;
	mapHook: useMapType;
};

export type MapEventHandler = (
	ev: MapMouseEvent & {
		features?: GeoJSON.Feature[] | undefined;
	} & Record<string, unknown>
) => void;

export interface useLayerProps {
	mapId?: string;
	layerId?: string;
	idPrefix?: string;
	insertBeforeLayer?: string;
	insertBeforeFirstSymbolLayer?: boolean;
	geojson?: GeoJSONObject;
	options: Partial<
		LayerSpecification & {
			source?: GeoJSONSourceSpecification | string;
			id?: string;
			filter?: FilterSpecification;
		}
	>;
	onHover?: (ev: MapEventType & unknown) => Map | void;
	onClick?: (ev: MapEventType & unknown) => Map | void;
	onLeave?: (ev: MapEventType & unknown) => Map | void;
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

	const [layer, setLayer] = useState<ReturnType<getLayerType>>();

	const initializedRef = useRef<boolean>(false);
	const layerId = useRef(
		props.layerId || (props.idPrefix ? props.idPrefix : 'Layer-') + mapHook.componentId
	);

	const createLayer = useCallback(() => {
		if (!mapHook.map || mapHook?.map.cancelled) return;

		if (mapHook.map.map.getLayer(layerId.current)) {
			mapHook.cleanup();
		}
		if (typeof props?.options?.source !== 'string' && mapHook.map.map.getSource(layerId.current)) {
			mapHook.map.map.removeSource(layerId.current);
		}

		if (typeof props.options.source === 'string') {
			if (props.options.source === '' || !mapHook.map.map.getSource(props.options.source)) {
				return;
			}
		}
		if (
			typeof props?.options?.source !== 'string' &&
			!props.geojson &&
			!props?.options?.source?.data &&
			props?.options?.type !== 'background'
		) {
			return;
		}

		if (typeof props.options.type === 'undefined') {
			return;
		}

		initializedRef.current = true;

		try {
			mapHook.map.addLayer(
				{
					...props.options,
					...(props.geojson &&
					(!props.options?.source ||
						(typeof props?.options?.source !== 'string' &&
							props.options?.source?.attribution &&
							!props.options?.source?.type)) // if either options.source isn't defined or only options.source.attribution is defined
						? {
								source: {
									type: 'geojson',
									data: props.geojson,
									attribution: typeof props?.options?.source !== 'string' && props.options.source?.attribution
										? props.options.source?.attribution
										: '',
								},
								// eslint-disable-next-line no-mixed-spaces-and-tabs
						  }
						: {}),
					...(typeof props.options?.source === 'string'
						? {
								source: props.options.source,
								// eslint-disable-next-line no-mixed-spaces-and-tabs
						  }
						: {}),
					id: layerId.current,
				} as LayerSpecification,
				props.insertBeforeLayer
					? props.insertBeforeLayer
					: props.insertBeforeFirstSymbolLayer
					? mapHook.map.firstSymbolLayer
					: undefined,
				mapHook.componentId
			);
		} catch (e) {
			console.log(e);
		}
		setLayer(() => mapHook.map?.map.getLayer(layerId.current));

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
					createLayer();
				}
			},
			mapHook.componentId
		);

		layerPaintConfRef.current = JSON.stringify(props.options?.paint);
		layerLayoutConfRef.current = JSON.stringify(props.options?.layout);
		layerTypeRef.current = props.options.type as LayerSpecification['type'];
	}, [props, mapHook]);

	useEffect(() => {
		if (!mapHook.map) return;
		if (!props.geojson && !props.options.source && props?.options?.type !== 'background') return;

		if (
			mapHook.map?.cancelled === false &&
			initializedRef.current &&
			mapHook?.map?.map?.getLayer?.(layerId.current) &&
			(legalLayerTypes.indexOf(props.options.type as LayerSpecification['type']) === -1 ||
				(legalLayerTypes.indexOf(props.options.type as LayerSpecification['type']) !== -1 &&
					props.options.type === layerTypeRef.current))
		) {
			return;
		}

		createLayer();
	}, [mapHook.map, mapHook.mapIsReady, props, createLayer]);

	useEffect(() => {
		if (
			mapHook.map?.cancelled === true ||
			!initializedRef.current ||
			!mapHook.map?.map?.getSource?.(layerId.current)
		)
			return;

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore setData only exists on GeoJsonSource
		mapHook.map.map.getSource(layerId.current)?.setData?.(props.geojson);
	}, [props.geojson, mapHook.map, props.options.type]);

	useEffect(() => {
		if (
			mapHook.map?.cancelled === true ||
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
		if (
			!props.insertBeforeLayer ||
			!mapHook.map ||
			!mapHook.map.getLayer(props.insertBeforeLayer) ||
			!mapHook.map.getLayer(layerId.current)
		)
			return;

		mapHook.map.moveLayer(layerId.current, props.insertBeforeLayer);
	}, [mapHook.map, props.insertBeforeLayer]);

	useEffect(() => {
		return () => {
			initializedRef.current = false;
			mapHook.cleanup();
		};
	}, []);

	useEffect(() => {
		if (
			typeof props?.options?.source !== 'string' ||
			!mapHook.map ||
			(typeof props?.options?.source === 'string' &&
				mapHook?.map?.getLayer?.(layerId.current) &&
				mapHook?.map?.getSource?.(props.options.source))
		) {
			return;
		}

		const findSourceHandler = () => {
			if (
				typeof props?.options?.source === 'string' &&
				mapHook?.map?.getSource?.(props.options.source)
			) {
				createLayer();
			}
		};

		mapHook.map.on('sourcedata', findSourceHandler);

		return () => {
			if (mapHook?.map) {
				mapHook.map.off('sourcedata', findSourceHandler);
			}
		};
	}, [mapHook.map, props.options?.source]);

	return {
		map: mapHook.map,
		layer: layer,
		layerId: layerId.current,
		componentId: mapHook.componentId,
		mapHook: mapHook,
	};
}

useLayer.defaultProps = {};

export default useLayer;
