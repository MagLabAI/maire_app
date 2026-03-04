<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import {
		createBaseStyle,
		addCityCircleLayer,
		addCityLabelLayer,
		applyDarkMode,
		watchDarkMode,
		setupCityInteraction
	} from '$lib/map/shared';

	interface Props {
		election?: string;
		contained?: boolean;
	}

	let { election = 'municipales-2026', contained = false }: Props = $props();

	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let popup: maplibregl.Popup | null = null;
	let dataLoaded = $state(false);
	let dark = $state(browser && document.documentElement.classList.contains('dark'));

	const TURNOUT_COLOR: maplibregl.ExpressionSpecification = [
		'case',
		['has', 't'],
		['interpolate', ['linear'], ['get', 't'],
			0.25, '#fef3c7',
			0.40, '#fcd34d',
			0.55, '#e8a020',
			0.70, '#c2410c',
			0.85, '#7c2d12'
		],
		'#d0d0d0'
	];

	onMount(async () => {
		const maplibregl = await import('maplibre-gl');

		const darkWatcher = watchDarkMode((isDark) => {
			dark = isDark;
			if (map) applyDarkMode(map, isDark);
		});
		dark = darkWatcher.isDark;

		map = new maplibregl.Map({
			container: mapContainer,
			style: createBaseStyle(dark),
			center: [2.3, 46.7],
			zoom: 5.3,
			minZoom: 4.5,
			maxZoom: 14,
			attributionControl: false
		});

		map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
		map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

		popup = new maplibregl.Popup({ closeButton: false, offset: 12, maxWidth: '220px' });

		map.on('load', async () => {
			if (!map || !popup) return;

			const response = await fetch('/data/map-data.json');
			const geojson = await response.json();
			dataLoaded = true;

			map.addSource('cities', { type: 'geojson', data: geojson });
			addCityCircleLayer(map, TURNOUT_COLOR, dark);
			addCityLabelLayer(map, dark);

			setupCityInteraction(
				map,
				popup,
				(f) => {
					const popText = Number(f.p).toLocaleString('fr-FR');
					const turnoutPct = f.t ? `${Math.round(Number(f.t) * 100)}%` : null;
					const turnoutLine = turnoutPct
						? `<div class="map-popup-meta">Participation 2020 : ${turnoutPct}</div>`
						: '';
					return `
						<div class="map-popup">
							<strong>${f.n}</strong>
							<div class="map-popup-meta">${popText} hab.</div>
							${turnoutLine}
							<a href="/elections/${election}/${f.s}" class="map-popup-link">Voir la ville &rarr;</a>
						</div>
					`;
				},
				(f) => `/elections/${election}/${f.s}`
			);
		});

		return () => {
			darkWatcher.disconnect();
			popup?.remove();
			map?.remove();
			map = null;
		};
	});
</script>

<div class="map-wrapper" class:contained class:dark>
	{#if !dataLoaded}
		<div class="map-skeleton">
			<div class="skeleton-pulse"></div>
			<span class="skeleton-text">Chargement de la carte...</span>
		</div>
	{/if}

	<div class="map-container" bind:this={mapContainer}></div>

	{#if dataLoaded}
		<div class="map-legend">
			<span class="legend-gradient-title">Participation 2020</span>
			<div class="legend-gradient-row">
				<span class="legend-gradient-label">25%</span>
				<div class="legend-gradient-bar"></div>
				<span class="legend-gradient-label">85%</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.map-wrapper {
		position: relative;
		width: 100%;
		overflow: hidden;
	}

	.map-wrapper.contained {
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	}

	.map-container {
		width: 100%;
		height: 300px;
	}

	@media (min-width: 640px) {
		.map-container {
			height: 400px;
		}
	}

	@media (min-width: 1024px) {
		.map-container {
			height: 500px;
		}
	}

	/* Contained mode: smaller heights for homepage embed */
	.contained .map-container {
		height: 250px;
	}

	@media (min-width: 640px) {
		.contained .map-container {
			height: 300px;
		}
	}

	@media (min-width: 1024px) {
		.contained .map-container {
			height: 400px;
		}
	}

	/* Loading skeleton */
	.map-skeleton {
		position: absolute;
		inset: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-cream-dark);
		border-radius: inherit;
	}

	.skeleton-pulse {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			110deg,
			transparent 30%,
			rgba(201, 169, 98, 0.08) 50%,
			transparent 70%
		);
		animation: skeleton-shimmer 1.8s ease-in-out infinite;
	}

	@keyframes skeleton-shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}

	.skeleton-text {
		position: relative;
		z-index: 2;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.map-legend {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(8px);
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: var(--color-text-light);
		z-index: 2;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.legend-gradient-title {
		width: 100%;
		font-weight: 600;
		font-size: 0.7rem;
		color: var(--color-text);
	}

	.legend-gradient-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		width: 100%;
	}

	.legend-gradient-bar {
		flex: 1;
		height: 8px;
		border-radius: 4px;
		background: linear-gradient(90deg, #fef3c7 0%, #fcd34d 25%, #e8a020 50%, #c2410c 75%, #7c2d12 100%);
	}

	.legend-gradient-label {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	/* Dark mode — legend & skeleton */
	.dark .map-legend {
		background: rgba(22, 27, 34, 0.92);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
	}

	.dark .legend-gradient-title {
		color: #e6edf3;
	}

	.dark .legend-gradient-label {
		color: #8b949e;
	}

	.dark .map-skeleton {
		background: #161b22;
	}

	.dark .skeleton-pulse {
		background: linear-gradient(
			110deg,
			transparent 30%,
			rgba(212, 181, 106, 0.06) 50%,
			transparent 70%
		);
	}

	.dark .skeleton-text {
		color: #8b949e;
	}

	/* Popup styles */
	:global(.maplibregl-popup-content) {
		border-radius: var(--radius-md) !important;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
		padding: 0 !important;
		font-family: var(--font-body);
		background: var(--color-card-bg) !important;
	}

	:global(.maplibregl-popup-tip) {
		border-top-color: var(--color-card-bg) !important;
	}

	:global(.map-popup) {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.6rem 0.75rem;
	}

	:global(.map-popup strong) {
		font-family: var(--font-display);
		font-size: 0.9rem;
		color: var(--color-foreground);
	}

	:global(.map-popup-meta) {
		font-size: 0.75rem;
		color: var(--color-text-light);
	}

	:global(.map-popup-link) {
		display: block;
		margin-top: 0.35rem;
		padding: 0.3rem 0.5rem;
		background: var(--color-navy);
		color: #faf8f5;
		font-size: 0.7rem;
		font-weight: 600;
		border-radius: var(--radius-sm);
		text-decoration: none;
		text-align: center;
		transition: background 0.2s ease;
	}

	:global(.map-popup-link:hover) {
		background: var(--color-gold);
		color: var(--color-foreground);
	}
</style>
