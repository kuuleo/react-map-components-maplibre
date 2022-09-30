import React, { useRef, useEffect, useState } from 'react';

import useLayer from '../../hooks/useLayer';
import useMap from '../../hooks/useMap';

import { v4 as uuidv4 } from 'uuid';

import getDefaultPaintPropsByType from './util/getDefaultPaintPropsByType';
import getDefaulLayerTypeByGeometry from './util/getDefaultLayerTypeByGeometry';
import { Feature, FeatureCollection } from '@turf/turf';



import {
	LineLayerSpecification,
	CircleLayerSpecification,
	FillLayerSpecification,
	MapLayerMouseEvent,
	LayerSpecification,
} from 'maplibre-gl';


type MlGeoJsonLayerProps = {
	/**
	 * Id of the target MapLibre instance in mapContext
	 */
	mapId?: string;
	/**
	 * Id of an existing layer in the mapLibre instance to help specify the layer order
	 * This layer will be visually beneath the layer with the "insertBeforeLayer" id.
	 * This layer will not be added to the maplibre-gl instance until a layer with an
	 * id that matches the value of insertBeforeLayer is created.
	 */
	insertBeforeLayer?: string;
	/**
	 * Id of the new layer and source that are added to the MapLibre instance
	 */
	layerId?: string;
	/**
	 * GeoJSON data that is supposed to be rendered by this component.
	 */
	geojson: Feature | FeatureCollection | undefined;
	/**
	 * Type of the layer that will be added to the MapLibre instance.
	 * Possible values: "line", "circle", "fill"
	 */
	type?: 'fill' | 'line' | 'circle';
	/**
	 * Paint property object, that is passed to the addLayer call.
	 * Possible props depend on the layer type.
	 * https://maplibre.org/maplibre-gl-js-docs/style-spec/layers/#line
	 * https://maplibre.org/maplibre-gl-js-docs/style-spec/layers/#circle
	 * https://maplibre.org/maplibre-gl-js-docs/style-spec/layers/#fill
	 */
	paint?:
		| CircleLayerSpecification['paint']
		| FillLayerSpecification['paint']
		| LineLayerSpecification['paint'];
	/**
	 * Layout property object, that is passed to the addLayer call.
	 * Possible props depend on the layer type.
	 * https://maplibre.org/maplibre-gl-js-docs/style-spec/layers/#line
	 * https://maplibre.org/maplibre-gl-js-docs/style-spec/layers/#circle
	 * https://maplibre.org/maplibre-gl-js-docs/style-spec/layers/#fill
	 */
	layout?:
		| CircleLayerSpecification['layout']
		| FillLayerSpecification['layout']
		| LineLayerSpecification['layout'];
	/**
	 * Javascript object that is spread into the addLayer commands first parameter.
	 */
	options?: CircleLayerSpecification | FillLayerSpecification | LineLayerSpecification;
	/**
	 * Javascript object with optional properties "fill", "line", "circle" to override implicit layer type default paint properties.
	 */
	defaultPaintOverrides?: {
		circle?: CircleLayerSpecification['paint'];
		fill?: FillLayerSpecification['paint'];
		line?: LineLayerSpecification['paint'];
	};
	/**
	 * Hover event handler that is executed whenever a geometry rendered by this component is hovered.
	 */
	onHover?: MapLayerMouseEvent;
	/**
	 * Click event handler that is executed whenever a geometry rendered by this component is clicked.
	 */
	onClick?: MapLayerMouseEvent;
	/**
	 * Leave event handler that is executed whenever a geometry rendered by this component is
	 * left/unhovered.
	 */
	onLeave?: MapLayerMouseEvent;
};

/**
 * Adds source and layer of types "line", "fill" or "circle" to display GeoJSON data on the map.
 *
 * @component
 */



const MlGeoJsonLayer = (props: MlGeoJsonLayerProps) => {
	const layerType = props.type || getDefaulLayerTypeByGeometry(props.geojson);
	// Use a useRef hook to reference the layer object to be able to access it later inside useEffect hooks
	useLayer({
		mapId: props.mapId,
		layerId: props.layerId || 'MlGeoJsonLayer-' + uuidv4(),
		geojson: props.geojson,
		options: {
			paint: props.paint || getDefaultPaintPropsByType(layerType, props.defaultPaintOverrides),
			layout: props.layout || {},
			...props.options,
			type: layerType as LayerSpecification['type'],
		},
		insertBeforeLayer: props.insertBeforeLayer,
		onHover: props.onHover,
		onClick: props.onClick,
		onLeave: props.onLeave,
	});

	const mapHook = useMap({
		mapId: props.mapId,
		waitForLayer: props.insertBeforeLayer,
	});

	const initializedRef = useRef(false);

	useEffect(() => {
		if (!mapHook.map || initializedRef.current) return;
		// the MapLibre-gl instance (mapHook.map) is accessible here
		// initialize the layer and add it to the MapLibre-gl instance or do something else with it
		initializedRef.current = true;

		mapHook.map.map.setCenter([7.100175528281227, 50.73487992742369]);
		mapHook.map.map.setZoom(15);
	}, [mapHook.map, props.mapId]);

	return (
		<>
			 
		</>
	);
};

export default MlGeoJsonLayer;
