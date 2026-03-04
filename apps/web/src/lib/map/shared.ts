/**
 * Shared MapLibre utilities for CityMap (homepage) and /carte (explorer).
 * Centralizes tile sources, layer expressions, dark mode, and interaction patterns.
 */

import type {
	StyleSpecification,
	ExpressionSpecification,
	Map as MLMap,
	RasterTileSource,
	Popup,
	MapLayerMouseEvent
} from 'maplibre-gl';

// CARTO basemap tiles — light and dark variants without labels
export const LIGHT_TILES = [
	'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
	'https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
	'https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
];
export const DARK_TILES = [
	'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
	'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
	'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png'
];

const ATTRIBUTION =
	'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Build the base MapLibre style object with CARTO raster tiles */
export function createBaseStyle(isDark: boolean): StyleSpecification {
	return {
		version: 8,
		glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
		sources: {
			carto: {
				type: 'raster',
				tiles: isDark ? DARK_TILES : LIGHT_TILES,
				tileSize: 256,
				attribution: ATTRIBUTION
			}
		},
		layers: [{ id: 'carto', type: 'raster', source: 'carto' }]
	};
}

// 8 population tiers via step on 'p' property, interpolated across zoom levels
export const CIRCLE_RADIUS: ExpressionSpecification = [
	'interpolate', ['linear'], ['zoom'],
	5,  ['step', ['get', 'p'], 1.5,  500, 1.5,  1000, 1.5,  10000, 2,   20000, 2.5,  50000, 3.5,  100000, 4.5,  200000, 6],
	8,  ['step', ['get', 'p'], 3,    500, 3.5,  1000, 4,    10000, 5,   20000, 6,    50000, 8,    100000, 11,   200000, 14],
	10, ['step', ['get', 'p'], 3.5,  500, 4,    1000, 5,    10000, 6,   20000, 7.5,  50000, 10,   100000, 13,   200000, 17],
	13, ['step', ['get', 'p'], 4,    500, 5,    1000, 6,    10000, 7,   20000, 9,    50000, 12,   100000, 16,   200000, 20]
];

// Progressive opacity reveal: small cities fade in at higher zoom
export const CIRCLE_OPACITY: ExpressionSpecification = [
	'interpolate', ['linear'], ['zoom'],
	5, ['step', ['get', 'p'], 0.3, 1000, 0.5, 10000, 0.7, 50000, 0.9, 200000, 1],
	7, 1
];

export const CIRCLE_STROKE_OPACITY: ExpressionSpecification = [
	'interpolate', ['linear'], ['zoom'],
	5, ['step', ['get', 'p'], 0.2, 1000, 0.4, 10000, 0.6, 50000, 0.8, 200000, 1],
	7, 1
];

export const STROKE_WIDTH: ExpressionSpecification = [
	'interpolate', ['linear'], ['zoom'],
	5, 1, 10, 1.5, 13, 2
];

// City name labels — progressive visibility by population tier across zoom
export const LABEL_TEXT_SIZE: ExpressionSpecification = [
	'interpolate', ['linear'], ['zoom'],
	5,  ['step', ['get', 'p'], 0, 50000, 10, 200000, 12],
	6,  ['step', ['get', 'p'], 0, 20000, 9, 50000, 10, 100000, 11, 200000, 13],
	7,  ['step', ['get', 'p'], 0, 10000, 9, 20000, 10, 50000, 11, 100000, 12, 200000, 14],
	9,  ['step', ['get', 'p'], 0, 3000, 8, 5000, 9, 10000, 10, 20000, 11, 50000, 12, 100000, 13, 200000, 14],
	10, ['step', ['get', 'p'], 0, 1000, 8, 3000, 9, 5000, 10, 10000, 11, 20000, 12, 50000, 13, 100000, 14, 200000, 15],
	11, ['step', ['get', 'p'], 7, 200, 8, 500, 9, 1000, 10, 3000, 11, 5000, 12, 10000, 13, 50000, 14, 100000, 15, 200000, 16]
];

// Dark-mode-aware colors for circle strokes and labels
export function strokeColor(isDark: boolean): string {
	return isDark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.95)';
}
export function labelColor(isDark: boolean): string {
	return isDark ? '#e6edf3' : '#2c3e50';
}
export function labelHaloColor(isDark: boolean): string {
	return isDark ? 'rgba(13,17,23,0.85)' : 'rgba(255,255,255,0.9)';
}

/** Add the cities-circle layer with a given color expression */
export function addCityCircleLayer(
	map: MLMap,
	colorExpr: ExpressionSpecification,
	isDark: boolean
) {
	map.addLayer({
		id: 'cities-circle',
		type: 'circle',
		source: 'cities',
		paint: {
			'circle-radius': CIRCLE_RADIUS,
			'circle-color': colorExpr,
			'circle-stroke-width': STROKE_WIDTH,
			'circle-stroke-color': strokeColor(isDark),
			'circle-opacity': CIRCLE_OPACITY,
			'circle-stroke-opacity': CIRCLE_STROKE_OPACITY
		}
	});
}

/** Add the cities-labels symbol layer */
export function addCityLabelLayer(map: MLMap, isDark: boolean) {
	map.addLayer({
		id: 'cities-labels',
		type: 'symbol',
		source: 'cities',
		layout: {
			'text-field': ['get', 'n'],
			'text-font': ['Open Sans Bold'],
			'text-size': LABEL_TEXT_SIZE,
			'text-offset': [0, 1.5],
			'text-anchor': 'top',
			'text-allow-overlap': false,
			'text-ignore-placement': false,
			'text-optional': true,
			'symbol-sort-key': ['-', ['get', 'p']]
		},
		paint: {
			'text-color': labelColor(isDark),
			'text-halo-color': labelHaloColor(isDark),
			'text-halo-width': 1.5
		}
	});
}

/** Swap basemap tiles and update stroke/label paint for dark/light mode */
export function applyDarkMode(map: MLMap, isDark: boolean) {
	if (!map.isStyleLoaded()) return;
	const src = map.getSource('carto') as RasterTileSource | undefined;
	if (src) src.setTiles(isDark ? DARK_TILES : LIGHT_TILES);

	map.setPaintProperty('cities-circle', 'circle-stroke-color', strokeColor(isDark));
	map.setPaintProperty('cities-labels', 'text-color', labelColor(isDark));
	map.setPaintProperty('cities-labels', 'text-halo-color', labelHaloColor(isDark));
}

/**
 * Watch html.dark class for theme changes.
 * Returns current dark state and a cleanup function.
 */
export function watchDarkMode(
	onChange: (isDark: boolean) => void
): { isDark: boolean; disconnect: () => void } {
	const isDark = document.documentElement.classList.contains('dark');
	const observer = new MutationObserver(() => {
		onChange(document.documentElement.classList.contains('dark'));
	});
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
	return { isDark, disconnect: () => observer.disconnect() };
}

/**
 * Set up hover cursor + popup on the cities-circle layer.
 * Handles touch vs mouse: touch = tap shows popup, mouse = hover popup + click navigates.
 */
export function setupCityInteraction(
	map: MLMap,
	popup: Popup,
	buildHTML: (properties: Record<string, unknown>) => string,
	getUrl: (properties: Record<string, unknown>) => string
) {
	map.on('mouseenter', 'cities-circle', () => {
		map.getCanvas().style.cursor = 'pointer';
	});
	map.on('mouseleave', 'cities-circle', () => {
		map.getCanvas().style.cursor = '';
		popup.remove();
	});

	const isTouch = 'ontouchstart' in window;

	function showPopup(e: MapLayerMouseEvent) {
		if (!e.features?.length) return;
		const props = e.features[0].properties;
		const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
		popup.setLngLat(coords).setHTML(buildHTML(props)).addTo(map);
	}

	if (!isTouch) {
		map.on('mousemove', 'cities-circle', showPopup);
		map.on('click', 'cities-circle', (e) => {
			if (!e.features?.length) return;
			window.location.href = getUrl(e.features[0].properties);
		});
	} else {
		map.on('click', 'cities-circle', showPopup);
	}
}
