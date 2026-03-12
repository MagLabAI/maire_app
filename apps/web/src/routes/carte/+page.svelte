<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import SeoMeta from '$lib/components/SeoMeta.svelte';
	import { headerSearch } from '$lib/stores/headerSearch.svelte';
	import type { City } from '$lib/types/elections';
	import type { ExpressionSpecification } from 'maplibre-gl';
	import {
		createBaseStyle,
		addCityCircleLayer,
		addCityLabelLayer,
		applyDarkMode,
		watchDarkMode,
		setupCityInteraction,
		strokeColor
	} from '$lib/map/shared';

	type LayerKey = 'participation' | 'participation2014' | 'participation2008' | 'growth' | 'temperature' | 'temperature100' | 'debt' | 'income';

	interface LayerConfig {
		key: LayerKey;
		label: string;
		shortLabel: string;
		prop: string;
		unit: string;
		colorExpr: ExpressionSpecification;
		legendStops: { value: string; color: string }[];
		thresholds: [number, number];
		formatValue: (v: number) => string;
		axisLabels: [string, string];
		rangeLabels: [string, string];
	}

	const LAYERS: LayerConfig[] = [
		{
			key: 'participation',
			label: 'Participation 2020',
			shortLabel: 'Participation',
			prop: 't',
			unit: '%',
			colorExpr: [
				'case', ['has', 't'],
				['interpolate', ['linear'], ['get', 't'],
					0.25, '#fef3c7', 0.40, '#fcd34d', 0.55, '#e8a020', 0.70, '#c2410c', 0.85, '#7c2d12'
				],
				'#d0d0d0'
			],
			legendStops: [
				{ value: '25%', color: '#fef3c7' },
				{ value: '40%', color: '#fcd34d' },
				{ value: '55%', color: '#e8a020' },
				{ value: '70%', color: '#c2410c' },
				{ value: '85%', color: '#7c2d12' }
			],
			thresholds: [0.45, 0.60],
			formatValue: (v: number) => `${Math.round(v * 100)}%`,
			axisLabels: ['Faible', 'Forte'],
			rangeLabels: ['25%', '85%']
		},
		{
			key: 'participation2014',
			label: 'Participation 2014',
			shortLabel: 'Particip. 2014',
			prop: 't14',
			unit: '%',
			colorExpr: [
				'case', ['has', 't14'],
				['interpolate', ['linear'], ['get', 't14'],
					0.25, '#fef3c7', 0.40, '#fcd34d', 0.55, '#e8a020', 0.70, '#c2410c', 0.85, '#7c2d12'
				],
				'#d0d0d0'
			],
			legendStops: [
				{ value: '25%', color: '#fef3c7' },
				{ value: '40%', color: '#fcd34d' },
				{ value: '55%', color: '#e8a020' },
				{ value: '70%', color: '#c2410c' },
				{ value: '85%', color: '#7c2d12' }
			],
			thresholds: [0.45, 0.60],
			formatValue: (v: number) => `${Math.round(v * 100)}%`,
			axisLabels: ['Faible', 'Forte'],
			rangeLabels: ['25%', '85%']
		},
		{
			key: 'participation2008',
			label: 'Participation 2008',
			shortLabel: 'Particip. 2008',
			prop: 't08',
			unit: '%',
			colorExpr: [
				'case', ['has', 't08'],
				['interpolate', ['linear'], ['get', 't08'],
					0.25, '#fef3c7', 0.40, '#fcd34d', 0.55, '#e8a020', 0.70, '#c2410c', 0.85, '#7c2d12'
				],
				'#d0d0d0'
			],
			legendStops: [
				{ value: '25%', color: '#fef3c7' },
				{ value: '40%', color: '#fcd34d' },
				{ value: '55%', color: '#e8a020' },
				{ value: '70%', color: '#c2410c' },
				{ value: '85%', color: '#7c2d12' }
			],
			thresholds: [0.45, 0.60],
			formatValue: (v: number) => `${Math.round(v * 100)}%`,
			axisLabels: ['Faible', 'Forte'],
			rangeLabels: ['25%', '85%']
		},
		{
			key: 'growth',
			label: 'Evolution population',
			shortLabel: 'Croissance',
			prop: 'g',
			unit: '%/an',
			colorExpr: [
				'case', ['has', 'g'],
				['interpolate', ['linear'], ['get', 'g'],
					-1.5, '#b81c1c', -0.5, '#d87060', 0, '#e8e0d0', 0.5, '#60b070', 2, '#148038'
				],
				'#d0d0d0'
			],
			legendStops: [
				{ value: '-1.5%', color: '#b81c1c' },
				{ value: '0%', color: '#e8e0d0' },
				{ value: '+2%', color: '#148038' }
			],
			thresholds: [0, 0.8],
			formatValue: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`,
			axisLabels: ['Declin', 'Croissance'],
			rangeLabels: ['-1.5%/an', '+2%/an']
		},
		{
			key: 'temperature',
			label: 'Temperature 2050',
			shortLabel: 'Temp. 2050',
			prop: 'tm',
			unit: '°C',
			colorExpr: [
				'case', ['has', 'tm'],
				['interpolate', ['linear'], ['get', 'tm'],
					1.5, '#2563a8', 2.0, '#80b0d0', 2.2, '#e8c870', 2.6, '#d06030', 3.0, '#a81818'
				],
				'#d0d0d0'
			],
			legendStops: [
				{ value: '+1.5°C', color: '#2563a8' },
				{ value: '+2.2°C', color: '#e8c870' },
				{ value: '+3.0°C', color: '#a81818' }
			],
			thresholds: [2.0, 2.4],
			formatValue: (v: number) => `+${v.toFixed(1)}°C`,
			axisLabels: ['Frais', 'Chaud'],
			rangeLabels: ['+1.5°C', '+3°C']
		},
		{
			key: 'temperature100',
			label: 'Temperature 2100',
			shortLabel: 'Temp. 2100',
			prop: 'tm1',
			unit: '°C',
			colorExpr: [
				'case', ['has', 'tm1'],
				['interpolate', ['linear'], ['get', 'tm1'],
					2.0, '#2563a8', 3.0, '#80b0d0', 3.5, '#e8c870', 4.5, '#d06030', 5.5, '#a81818'
				],
				'#d0d0d0'
			],
			legendStops: [
				{ value: '+2°C', color: '#2563a8' },
				{ value: '+3.5°C', color: '#e8c870' },
				{ value: '+5.5°C', color: '#a81818' }
			],
			thresholds: [3.0, 4.0],
			formatValue: (v: number) => `+${v.toFixed(1)}°C`,
			axisLabels: ['Frais', 'Brulant'],
			rangeLabels: ['+2°C', '+5.5°C']
		},
		{
			key: 'debt',
			label: 'Dette par habitant 2019→2024',
			shortLabel: 'Dette/hab',
			prop: 'd',
			unit: '€/hab',
			colorExpr: [
				'case', ['has', 'd'],
				['interpolate', ['linear'], ['get', 'd'],
					-300, '#148038', -73, '#60b070', 0, '#e8e0d0', 200, '#d87060', 500, '#b81c1c'
				],
				'#d0d0d0'
			],
			legendStops: [
				{ value: '-300 €/hab', color: '#148038' },
				{ value: '-73 (médiane)', color: '#60b070' },
				{ value: '0', color: '#e8e0d0' },
				{ value: '+500 €/hab', color: '#b81c1c' }
			],
			thresholds: [0, 200],
			formatValue: (v: number) => `${v > 0 ? '+' : ''}${Math.round(v)} €/hab`,
			axisLabels: ['Désendettement', 'Hausse'],
			rangeLabels: ['-300 €/hab', '+500 €/hab']
		},
		{
			key: 'income',
			label: 'Revenu median',
			shortLabel: 'Revenu',
			prop: 'mi',
			unit: 'EUR',
			colorExpr: [
				'case', ['has', 'mi'],
				['interpolate', ['linear'], ['get', 'mi'],
					14000, '#8b5cf6', 18000, '#a78bfa', 21000, '#ddd6fe', 25000, '#6ee7b7', 32000, '#059669'
				],
				'#d0d0d0'
			],
			legendStops: [
				{ value: '14k', color: '#8b5cf6' },
				{ value: '21k', color: '#ddd6fe' },
				{ value: '32k', color: '#059669' }
			],
			thresholds: [18000, 25000],
			formatValue: (v: number) => `${(v / 1000).toFixed(0)}k EUR`,
			axisLabels: ['Faible', 'Eleve'],
			rangeLabels: ['14k€', '32k€']
		}
	];

	// Hand-tuned bivariate palettes for specific pairs
	// palette[row][col]: row=layerA low→high (bottom→top), col=layerB low→high (left→right)
	const MANUAL_PALETTES: Record<string, string[][]> = {
		// Cross-election participation: green = improved, coral = declined, diagonal = stable
		'participation-participation2014': [
			['#fef3c7', '#e8b878', '#d06848'],
			['#98c498', '#c0a868', '#b06838'],
			['#38884a', '#887828', '#7c2d12']
		],
		'participation-participation2008': [
			['#fef3c7', '#e8b878', '#d06848'],
			['#98c498', '#c0a868', '#b06838'],
			['#38884a', '#887828', '#7c2d12']
		],
		'participation2008-participation2014': [
			['#fef3c7', '#e8b878', '#d06848'],
			['#98c498', '#c0a868', '#b06838'],
			['#38884a', '#887828', '#7c2d12']
		],
		// New participation layers × existing layers (reuse existing palette patterns)
		'debt-participation2014': [
			['#f5d0a8', '#d4a060', '#a87030'],
			['#e8c8c0', '#c09060', '#906828'],
			['#d88888', '#b05050', '#882828']
		],
		'debt-participation2008': [
			['#f5d0a8', '#d4a060', '#a87030'],
			['#e8c8c0', '#c09060', '#906828'],
			['#d88888', '#b05050', '#882828']
		],
		'growth-participation2014': [
			['#dab0a0', '#c07858', '#983828'],
			['#d8d0a0', '#b0a058', '#887020'],
			['#a0c8a0', '#589848', '#306828']
		],
		'growth-participation2008': [
			['#dab0a0', '#c07858', '#983828'],
			['#d8d0a0', '#b0a058', '#887020'],
			['#a0c8a0', '#589848', '#306828']
		],
		'income-participation2014': [
			['#5040a0', '#7a5090', '#a04828'],
			['#9080c0', '#b08868', '#a86838'],
			['#60c0a0', '#68a858', '#788828']
		],
		'income-participation2008': [
			['#5040a0', '#7a5090', '#a04828'],
			['#9080c0', '#b08868', '#a86838'],
			['#60c0a0', '#68a858', '#788828']
		],
		'participation2008-temperature': [
			['#b0c8e8', '#d0b898', '#c09088'],
			['#6890b8', '#c09060', '#c06050'],
			['#4a3818', '#a85828', '#a01818']
		],
		'participation2008-temperature100': [
			['#b0c8e8', '#d0b898', '#c09088'],
			['#6890b8', '#c09060', '#c06050'],
			['#4a3818', '#a85828', '#a01818']
		],
		'participation2014-temperature': [
			['#b0c8e8', '#d0b898', '#c09088'],
			['#6890b8', '#c09060', '#c06050'],
			['#4a3818', '#a85828', '#a01818']
		],
		'participation2014-temperature100': [
			['#b0c8e8', '#d0b898', '#c09088'],
			['#6890b8', '#c09060', '#c06050'],
			['#4a3818', '#a85828', '#a01818']
		],
		'debt-participation': [
			['#f5d0a8', '#d4a060', '#a87030'],
			['#e8c8c0', '#c09060', '#906828'],
			['#d88888', '#b05050', '#882828']
		],
		'growth-participation': [
			['#dab0a0', '#c07858', '#983828'],
			['#d8d0a0', '#b0a058', '#887020'],
			['#a0c8a0', '#589848', '#306828']
		],
		'growth-temperature': [
			['#8868a0', '#a86868', '#a82828'],
			['#8898a8', '#a8a088', '#a88858'],
			['#308878', '#58884a', '#706828']
		],
		'income-participation': [
			['#5040a0', '#7a5090', '#a04828'],
			['#9080c0', '#b08868', '#a86838'],
			['#60c0a0', '#68a858', '#788828']
		],
		'participation-temperature': [
			['#b0c8e8', '#d0b898', '#c09088'],
			['#6890b8', '#c09060', '#c06050'],
			['#4a3818', '#a85828', '#a01818']
		],
		'participation-temperature100': [
			['#b0c8e8', '#d0b898', '#c09088'],
			['#6890b8', '#c09060', '#c06050'],
			['#4a3818', '#a85828', '#a01818']
		],
		// temp + temp: blue→purple→red, no green
		'temperature-temperature100': [
			['#3060b0', '#6858a0', '#903880'],
			['#6880b0', '#887090', '#a85070'],
			['#a05060', '#b84050', '#c82828']
		],
		// debt + temp: no green for high debt OR high temp
		'debt-temperature': [
			['#406898', '#886098', '#b84060'],
			['#80a0a0', '#a89088', '#b86050'],
			['#b87060', '#c05848', '#d02828']
		],
		'debt-temperature100': [
			['#406898', '#886098', '#b84060'],
			['#80a0a0', '#a89088', '#b86050'],
			['#b87060', '#c05848', '#d02828']
		],
		// debt + income: high debt = red, not green
		'debt-income': [
			['#6848b0', '#9070a0', '#407040'],
			['#987098', '#b08888', '#689060'],
			['#c05058', '#c06048', '#a87840']
		],
		'debt-growth': [
			['#287038', '#408848', '#509858'],
			['#987880', '#a89088', '#80a878'],
			['#884838', '#a86048', '#b87858']
		],
		'growth-income': [
			['#7848a0', '#886098', '#308878'],
			['#988088', '#a89888', '#60a878'],
			['#407838', '#509050', '#40a860']
		],
		'growth-temperature100': [
			['#8868a0', '#a86868', '#a82828'],
			['#8898a8', '#a8a088', '#a88858'],
			['#308878', '#58884a', '#706828']
		],
		'income-temperature': [
			['#4840a0', '#784888', '#a83848'],
			['#80a0b8', '#a89888', '#b07060'],
			['#30a078', '#60a060', '#908838']
		],
		'income-temperature100': [
			['#4840a0', '#784888', '#a83848'],
			['#80a0b8', '#a89888', '#b07060'],
			['#30a078', '#60a060', '#908838']
		]
	};

	function transpose(p: string[][]): string[][] {
		return p[0].map((_, i) => p.map(row => row[i]));
	}

	// Descriptive analysis text for each bivariate pair
	const CORRELATION_INSIGHTS: Record<string, string> = {
		'participation-participation2014': 'Évolution de la participation entre 2014 et 2020. Vert = participation en hausse, corail = en baisse. La diagonale montre les villes stables.',
		'participation-participation2008': 'Évolution de la participation entre 2008 et 2020. Vert = participation en hausse, corail = en baisse. Tendance sur 12 ans.',
		'participation2008-participation2014': 'Évolution de la participation entre 2008 et 2014. Vert = participation en hausse, corail = en baisse.',
		'debt-participation': 'Les villes où la dette/hab a le plus augmenté mobilisent-elles davantage leurs électeurs ? Médiane nationale : -73 €/hab (désendettement).',
		'debt-participation2014': 'Même analyse dette/hab × participation pour le scrutin 2014. Médiane nationale : -73 €/hab.',
		'debt-participation2008': 'Même analyse dette/hab × participation pour le scrutin 2008. Médiane nationale : -73 €/hab.',
		'growth-participation': 'Les villes en croissance votent-elles moins ? Observez si les zones en expansion démographique montrent un désengagement civique.',
		'growth-participation2014': 'Croissance et participation en 2014 : même dynamique qu\'en 2020 ?',
		'growth-participation2008': 'Croissance et participation en 2008 : les villes en déclin votaient-elles déjà moins ?',
		'income-participation': 'Revenus et participation sont-ils corrélés ? Les villes aisées participent-elles plus aux scrutins locaux ?',
		'income-participation2014': 'Revenus et participation 2014 : le lien richesse-vote existait-il déjà ?',
		'income-participation2008': 'Revenus et participation 2008 : les inégalités de vote remontent-elles loin ?',
		'participation2008-temperature': 'En 2008, le climat influençait-il déjà la participation locale ?',
		'participation2008-temperature100': 'Participation 2008 et projections 2100 : les zones menacées votaient-elles davantage ?',
		'participation2014-temperature': 'Climat et participation 2014 : les régions chaudes participent-elles moins ?',
		'participation2014-temperature100': 'Participation 2014 et projections 2100 : les futurs territoires chauds votent-ils différemment ?',
		'debt-growth': 'Les villes en croissance s\'endettent-elles pour financer leurs équipements ? Comparez hausse de dette/hab et croissance démographique. Médiane : -73 €/hab.',
		'debt-income': 'Les communes riches sont-elles moins endettées ? Repérez les anomalies : villes aisées mais dette/hab en forte hausse, ou modestes mais bien gérées.',
		'debt-temperature': 'Les villes du sud, plus exposées au réchauffement, voient-elles aussi leur dette/hab augmenter ? Double vulnérabilité climatique et financière.',
		'debt-temperature100': 'À horizon 2100 : les territoires les plus menacés par le réchauffement sont-ils aussi ceux dont la dette/hab augmente le plus ?',
		'growth-income': 'Quelles villes attirent : les riches ou les abordables ? Comparez croissance démographique et niveau de revenus.',
		'growth-temperature': 'Les régions chaudes perdent-elles des habitants, ou au contraire attirent-elles ? Migration et climat.',
		'growth-temperature100': 'À horizon 2100, les zones les plus chaudes seront-elles désertées ? Projection croisée climat-démographie.',
		'income-temperature': 'Les villes fraîches sont-elles plus riches ? Explorez le lien entre confort climatique et revenus des ménages.',
		'income-temperature100': 'Même analyse à horizon 2100 : les territoires les plus chauds concentrent-ils les populations les moins aisées ?',
		'participation-temperature': 'Le climat influence-t-il le vote local ? Comparez la participation entre les régions fraîches du nord et le sud méditerranéen.',
		'participation-temperature100': 'En 2100, les régions les plus chaudes voteront-elles moins ? Projection croisée climat-citoyenneté.',
		'temperature-temperature100': 'Comment le réchauffement s\'accélère entre 2050 et 2100 : les écarts se creusent-ils entre régions ?',
	};

	function getCorrelationInsight(keyA: LayerKey, keyB: LayerKey): string {
		const sorted = [keyA, keyB].sort().join('-');
		return CORRELATION_INSIGHTS[sorted] || '';
	}

	function getBivariatePalette(keyA: LayerKey, keyB: LayerKey): string[][] {
		const sorted = [keyA, keyB].sort() as [LayerKey, LayerKey];
		const cacheKey = sorted.join('-');
		const palette = MANUAL_PALETTES[cacheKey];
		if (!palette) {
			// Fallback: neutral grey grid
			return [
				['#c0c0c0', '#a0a0a0', '#808080'],
				['#a8a8a8', '#888888', '#686868'],
				['#909090', '#707070', '#505050']
			];
		}
		return keyA === sorted[0] ? palette : transpose(palette);
	}

	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let popup: maplibregl.Popup | null = null;
	let dataLoaded = $state(false);
	let dark = $state(browser && document.documentElement.classList.contains('dark'));
	let activeLayers = $state<LayerKey[]>(['participation']);
	let panelOpen = $state(true);
	let mobileLegendOpen = $state(false);

	let activeLayerConfigs = $derived(activeLayers.map(k => LAYERS.find(l => l.key === k)!));

	function getLayerConfig(key: LayerKey): LayerConfig {
		return LAYERS.find(l => l.key === key)!;
	}

	// Click checkbox area: toggle for correlation (add/remove up to 2)
	function toggleLayerCorrelation(key: LayerKey) {
		const idx = activeLayers.indexOf(key);
		if (idx !== -1) {
			const next = activeLayers.filter(k => k !== key);
			activeLayers = next.length === 0 ? ['participation'] : next;
		} else if (activeLayers.length < 2) {
			activeLayers = [...activeLayers, key];
		} else {
			activeLayers = [activeLayers[1], key];
		}
		updateMapColors();
	}

	// Click label area: switch to single layer
	function switchToLayer(key: LayerKey) {
		activeLayers = [key];
		updateMapColors();
	}

	function isActive(key: LayerKey): boolean {
		return activeLayers.includes(key);
	}

	// Long-press support for mobile layer pill correlation toggle
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;
	let longPressFired = false;
	function pillTouchStart(key: LayerKey) {
		longPressFired = false;
		longPressTimer = setTimeout(() => {
			longPressFired = true;
			toggleLayerCorrelation(key);
		}, 500);
	}
	function pillTouchEnd() {
		if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
	}

	function buildBivariateExpr(
		layerA: LayerConfig,
		layerB: LayerConfig
	): maplibregl.ExpressionSpecification {
		const palette = getBivariatePalette(layerA.key, layerB.key);
		const midA = (layerA.thresholds[0] + layerA.thresholds[1]) / 2;
		const midB = (layerB.thresholds[0] + layerB.thresholds[1]) / 2;
		const classA: maplibregl.ExpressionSpecification = [
			'step', ['coalesce', ['get', layerA.prop], midA],
			0, layerA.thresholds[0], 1, layerA.thresholds[1], 2
		];
		const classB: maplibregl.ExpressionSpecification = [
			'step', ['coalesce', ['get', layerB.prop], midB],
			0, layerB.thresholds[0], 1, layerB.thresholds[1], 2
		];
		const index: maplibregl.ExpressionSpecification = [
			'+', ['*', classA, 3], classB
		];
		return [
			'match', index,
			0, palette[0][0], 1, palette[0][1], 2, palette[0][2],
			3, palette[1][0], 4, palette[1][1], 5, palette[1][2],
			6, palette[2][0], 7, palette[2][1], 8, palette[2][2],
			'#cccccc'
		] as maplibregl.ExpressionSpecification;
	}

	function updateMapColors() {
		if (!map) return;

		if (activeLayers.length === 1) {
			const layer = getLayerConfig(activeLayers[0]);
			map.setPaintProperty('cities-circle', 'circle-color', layer.colorExpr);
		} else {
			const [layerA, layerB] = activeLayerConfigs;
			const expr = buildBivariateExpr(layerA, layerB);
			map.setPaintProperty('cities-circle', 'circle-color', expr);
		}

		map.setPaintProperty('cities-circle', 'circle-stroke-color', strokeColor(dark));
	}

	// Bivariate legend hover tooltip
	let hoveredCell = $state<{ row: number; col: number } | null>(null);
	function cellTooltip(row: number, col: number): string {
		if (activeLayers.length < 2) return '';
		const a = activeLayerConfigs[0];
		const b = activeLayerConfigs[1];
		const aLabels = [a.axisLabels[0], 'Moyen', a.axisLabels[1]];
		const bLabels = [b.axisLabels[0], 'Moyen', b.axisLabels[1]];
		return `${a.shortLabel}: ${aLabels[row]}\n${b.shortLabel}: ${bLabels[col]}`;
	}

	const DOM_TOM_LOCATIONS = [
		{ id: 'metropole', label: 'Métropole', center: [2.3, 46.7] as [number, number], zoom: 5.5 },
		{ id: 'guadeloupe', label: 'Guadeloupe', center: [-61.55, 16.2] as [number, number], zoom: 9.5 },
		{ id: 'martinique', label: 'Martinique', center: [-61.0, 14.65] as [number, number], zoom: 10 },
		{ id: 'guyane', label: 'Guyane', center: [-53.2, 3.9] as [number, number], zoom: 6.5 },
		{ id: 'reunion', label: 'Réunion', center: [55.53, -21.12] as [number, number], zoom: 10 },
		{ id: 'mayotte', label: 'Mayotte', center: [45.16, -12.78] as [number, number], zoom: 11 },
		{ id: 'spm', label: 'St-Pierre-Miquelon', center: [-56.2, 46.88] as [number, number], zoom: 10 },
		{ id: 'nouvelle-caledonie', label: 'Nlle-Calédonie', center: [165.5, -21.3] as [number, number], zoom: 7 },
	];

	function flyToLocation(loc: typeof DOM_TOM_LOCATIONS[0]) {
		if (!map) return;
		map.flyTo({ center: loc.center, zoom: loc.zoom, speed: 2 });
	}

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
			zoom: 5.5,
			minZoom: 4.5,
			maxZoom: 15,
			attributionControl: false
		});

		map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
		map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

		popup = new maplibregl.Popup({ closeButton: false, offset: 12, maxWidth: '260px' });

		map.on('load', async () => {
			if (!map || !popup) return;

			const response = await fetch('/data/map-data.json');
			const geojson = await response.json();
			dataLoaded = true;

			map.addSource('cities', { type: 'geojson', data: geojson });
			addCityCircleLayer(map, getLayerConfig('participation').colorExpr, dark);
			addCityLabelLayer(map, dark);

			setupCityInteraction(
				map, popup, buildPopupHTML,
				(f) => `/elections/municipales-2026/${f.s}`
			);

			// Wire header search to fly-to + popup on this map
			headerSearch.onSelect = (city: City) => {
				if (!map || !popup) return;
				const coords = findCityCoords(geojson, city.slug);
				if (!coords) return;
				map.flyTo({ center: coords, zoom: 11, duration: 1500 });
				popup.setLngLat(coords).setHTML(buildPopupHTML({
					n: city.name, p: city.population, s: city.slug
				})).addTo(map);
			};

			// Auto-focus on city from ?city= URL param
			const cityParam = $page.url.searchParams.get('city');
			if (cityParam) {
				const feature = geojson.features.find((f: GeoJSON.Feature) => f.properties?.s === cityParam);
				if (feature && feature.geometry.type === 'Point') {
					const coords = feature.geometry.coordinates as [number, number];
					map.flyTo({ center: coords, zoom: 11, duration: 1500 });
					popup.setLngLat(coords).setHTML(buildPopupHTML(feature.properties as Record<string, unknown>)).addTo(map);
				}
			}
		});

		return () => {
			darkWatcher.disconnect();
			popup?.remove();
			map?.remove();
			map = null;
		};
	});

	onDestroy(() => {
		if (browser) headerSearch.onSelect = null;
	});

	// Linear interpolation between color stops (matches MapLibre layer gradients)
	function lerpColor(value: number, stops: [number, string][]): string {
		if (value <= stops[0][0]) return stops[0][1];
		if (value >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
		for (let i = 0; i < stops.length - 1; i++) {
			const [v0, c0] = stops[i];
			const [v1, c1] = stops[i + 1];
			if (value <= v1) {
				const t = (value - v0) / (v1 - v0);
				const r0 = parseInt(c0.slice(1, 3), 16), g0 = parseInt(c0.slice(3, 5), 16), b0 = parseInt(c0.slice(5, 7), 16);
				const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
				const r = Math.round(r0 + t * (r1 - r0)), g = Math.round(g0 + t * (g1 - g0)), b = Math.round(b0 + t * (b1 - b0));
				return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
			}
		}
		return stops[stops.length - 1][1];
	}

	const participationStops: [number, string][] = [[0.25,'#fef3c7'],[0.40,'#fcd34d'],[0.55,'#e8a020'],[0.70,'#c2410c'],[0.85,'#7c2d12']];
	const growthStops: [number, string][] = [[-1.5,'#b81c1c'],[-0.5,'#d87060'],[0,'#e8e0d0'],[0.5,'#60b070'],[2,'#148038']];
	const temp50Stops: [number, string][] = [[1.5,'#2563a8'],[2.0,'#80b0d0'],[2.2,'#e8c870'],[2.6,'#d06030'],[3.0,'#a81818']];
	const temp100Stops: [number, string][] = [[2.0,'#2563a8'],[3.0,'#80b0d0'],[3.5,'#e8c870'],[4.5,'#d06030'],[5.5,'#a81818']];
	const debtStops: [number, string][] = [[-300,'#148038'],[-73,'#60b070'],[0,'#e8e0d0'],[200,'#d87060'],[500,'#b81c1c']];
	const incomeStops: [number, string][] = [[14000,'#8b5cf6'],[18000,'#a78bfa'],[21000,'#ddd6fe'],[25000,'#6ee7b7'],[32000,'#059669']];

	function buildPopupHTML(f: Record<string, unknown>): string {
		const popText = Number(f.p).toLocaleString('fr-FR');
		let dataRows = '';
		// Participation block: 2020 + 2014 + 2008 with evolution arrows
		const t20 = f.t ? Number(f.t) : null;
		const t14 = f.t14 ? Number(f.t14) : null;
		const t08 = f.t08 ? Number(f.t08) : null;
		if (t20 !== null) {
			const c20 = lerpColor(t20, participationStops);
			dataRows += `<div class="popup-row"><span class="popup-label">Participation 2020</span><span class="popup-value" style="color:${c20}">${Math.round(t20 * 100)}%</span></div>`;
		}
		if (t14 !== null) {
			const c14 = lerpColor(t14, participationStops);
			let delta = '';
			if (t20 !== null) {
				const diff = Math.round((t20 - t14) * 100);
				delta = diff > 0 ? ` <span style="color:#4a9d6e;font-size:0.6rem">+${diff}pts</span>` : ` <span style="color:#e07a5f;font-size:0.6rem">${diff}pts</span>`;
			}
			dataRows += `<div class="popup-row"><span class="popup-label">Participation 2014</span><span class="popup-value"><span style="color:${c14}">${Math.round(t14 * 100)}%</span>${delta}</span></div>`;
		}
		if (t08 !== null) {
			const c08 = lerpColor(t08, participationStops);
			let delta = '';
			if (t14 !== null) {
				const diff = Math.round((t14 - t08) * 100);
				delta = diff > 0 ? ` <span style="color:#4a9d6e;font-size:0.6rem">+${diff}pts</span>` : ` <span style="color:#e07a5f;font-size:0.6rem">${diff}pts</span>`;
			}
			dataRows += `<div class="popup-row"><span class="popup-label">Participation 2008</span><span class="popup-value"><span style="color:${c08}">${Math.round(t08 * 100)}%</span>${delta}</span></div>`;
		}
		if (f.g) { const v = Number(f.g); dataRows += `<div class="popup-row"><span class="popup-label">Croissance pop.</span><span class="popup-value" style="color:${lerpColor(v, growthStops)}">${v > 0 ? '+' : ''}${v.toFixed(1)}%</span></div>`; }
		if (f.tm) { const v = Number(f.tm); dataRows += `<div class="popup-row"><span class="popup-label">Temp. 2050</span><span class="popup-value" style="color:${lerpColor(v, temp50Stops)}">+${v.toFixed(1)}°C</span></div>`; }
		if (f.tm1) { const v = Number(f.tm1); dataRows += `<div class="popup-row"><span class="popup-label">Temp. 2100</span><span class="popup-value" style="color:${lerpColor(v, temp100Stops)}">+${v.toFixed(1)}°C</span></div>`; }
		if (f.d != null) { const v = Number(f.d); dataRows += `<div class="popup-row"><span class="popup-label">Dette/hab 2019→24</span><span class="popup-value" style="color:${lerpColor(v, debtStops)}">${v > 0 ? '+' : ''}${Math.round(v)} €/hab</span></div>`; }
		if (f.mi) { const v = Number(f.mi); dataRows += `<div class="popup-row"><span class="popup-label">Revenu median</span><span class="popup-value" style="color:${lerpColor(v, incomeStops)}">${(v / 1000).toFixed(0)}k EUR</span></div>`; }
		const mayorRow = f.m ? `<div class="popup-mayor">Maire : ${f.m}</div>` : '';
		return `
			<div class="carte-popup">
				<strong>${f.n}</strong>
				<div class="popup-meta">${popText} hab.</div>
				${mayorRow}
				${dataRows ? `<div class="popup-data">${dataRows}</div>` : ''}
				<a href="/elections/municipales-2026/${f.s}" class="popup-link">Voir la ville &rarr;</a>
			</div>
		`;
	}

	function findCityCoords(geojson: GeoJSON.FeatureCollection, slug: string): [number, number] | null {
		const feature = geojson.features.find(
			(f) => f.properties?.s === slug
		);
		if (!feature || feature.geometry.type !== 'Point') return null;
		return feature.geometry.coordinates as [number, number];
	}
</script>

<svelte:head>
	<title>Carte des communes de France — participation, climat, dette, revenus | maire.app</title>
	<meta name="description" content="Carte interactive des 34 000 communes françaises. Visualisez et comparez : taux de participation électorale (2008, 2014, 2020), projections climatiques DRIAS 2050 et 2100, dette par habitant (évolution 2019-2024), revenu médian et croissance démographique. Superposez deux indicateurs pour croiser les données." />
	<SeoMeta
		title="Carte des communes de France — participation, climat, dette, revenus | maire.app"
		description="Carte interactive des 34 000 communes françaises. Visualisez et comparez : participation électorale (2008-2020), projections climatiques 2050-2100, dette par habitant, revenu médian et croissance démographique."
		path="/carte"
	/>
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "Dataset",
		"name": "Carte interactive des communes de France — données municipales",
		"description": "Données socio-économiques et électorales de 34 000 communes françaises : participation aux élections municipales (2008, 2014, 2020), projections climatiques DRIAS (2050, 2100), dette par habitant (OFGL/DGFiP 2019-2024), revenu médian (INSEE) et croissance démographique.",
		"url": "https://maire.app/carte",
		"license": "https://www.etalab.gouv.fr/licence-ouverte-open-licence/",
		"creator": { "@type": "Organization", "name": "MagLab Studio", "url": "https://maire.app" },
		"temporalCoverage": "2008/2026",
		"spatialCoverage": { "@type": "Place", "name": "France", "geo": { "@type": "GeoShape", "box": "-5.14 41.33 9.56 51.09" } },
		"distribution": [
			{ "@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": "https://maire.app/data/map-data.json" }
		],
		"variableMeasured": [
			{ "@type": "PropertyValue", "name": "Participation électorale 2020", "unitText": "%" },
			{ "@type": "PropertyValue", "name": "Participation électorale 2014", "unitText": "%" },
			{ "@type": "PropertyValue", "name": "Participation électorale 2008", "unitText": "%" },
			{ "@type": "PropertyValue", "name": "Projection température 2050", "unitText": "°C" },
			{ "@type": "PropertyValue", "name": "Projection température 2100", "unitText": "°C" },
			{ "@type": "PropertyValue", "name": "Dette par habitant (évolution 2019-2024)", "unitText": "€/hab" },
			{ "@type": "PropertyValue", "name": "Revenu médian", "unitText": "€/an" },
			{ "@type": "PropertyValue", "name": "Croissance démographique", "unitText": "%/an" }
		],
		"keywords": ["communes france", "carte élections municipales", "participation électorale", "abstention", "projections climatiques", "dette municipale", "revenu médian", "démographie"]
	})}</script>`}
</svelte:head>

<div class="carte-page" class:dark>
	<h1 class="sr-only">Carte interactive des 34 000 communes de France — participation, climat, dette et revenus</h1>
	<div class="carte-map" bind:this={mapContainer}></div>

	<!-- DOM-TOM navigation -->
	<div class="domtom-nav">
		{#each DOM_TOM_LOCATIONS as loc}
			<button class="domtom-btn" onclick={() => flyToLocation(loc)}>
				{loc.label}
			</button>
		{/each}
	</div>

	{#if dataLoaded}
		<!-- Layer control panel -->
		<div class="layer-panel" class:collapsed={!panelOpen}>
			<button class="panel-toggle" onclick={() => panelOpen = !panelOpen} aria-label={panelOpen ? 'Replier' : 'Ouvrir le panneau'}>
				{#if panelOpen}
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				{:else}
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				{/if}
			</button>

			<!-- Collapsed legend: always-visible scale when panel is folded -->
			{#if !panelOpen}
				<div class="collapsed-legend">
					{#if activeLayers.length === 1}
						{@const layer = getLayerConfig(activeLayers[0])}
						<span class="collapsed-legend-title">{layer.shortLabel}</span>
						<div class="gradient-bar" style="background: linear-gradient(90deg, {layer.legendStops.map(s => s.color).join(', ')}); height: 8px; border-radius: 4px;"></div>
						<div class="collapsed-legend-labels">
							<span>{layer.legendStops[0].value}</span>
							<span>{layer.legendStops[layer.legendStops.length - 1].value}</span>
						</div>
					{:else}
						{@const biPalette = getBivariatePalette(activeLayerConfigs[0].key, activeLayerConfigs[1].key)}
						<span class="collapsed-legend-title">{activeLayerConfigs[0].shortLabel} × {activeLayerConfigs[1].shortLabel}</span>
						<div class="collapsed-bi-grid">
							{#each [2, 1, 0] as row}
								{#each [0, 1, 2] as col}
									<div class="collapsed-bi-cell" style="background: {biPalette[row][col]}"></div>
								{/each}
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			{#if panelOpen}
				<div class="panel-content">
					<h2 class="panel-title">Données</h2>
					<p class="panel-hint">Cliquez pour changer, cochez pour combiner</p>

					<div class="layer-options">
						{#each LAYERS as layer}
							<div class="layer-btn" class:active={isActive(layer.key)}>
								<button
									class="layer-check-zone"
									onclick={() => toggleLayerCorrelation(layer.key)}
									aria-label="Combiner {layer.label}"
								>
									<span class="layer-check">
										{#if isActive(layer.key)}
											<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
											</svg>
										{/if}
									</span>
								</button>
								<button
									class="layer-label-zone"
									onclick={() => switchToLayer(layer.key)}
								>
									{layer.label}
								</button>
							</div>
						{/each}
					</div>

					{#if activeLayers.length === 1}
						{@const layer = getLayerConfig(activeLayers[0])}
						<div class="legend-section">
							<span class="legend-title">{layer.label}</span>
							<div class="gradient-legend">
								<div class="gradient-bar" style="background: linear-gradient(90deg, {layer.legendStops.map(s => s.color).join(', ')})"></div>
								<div class="gradient-labels">
									{#each layer.legendStops as stop}
										<span>{stop.value}</span>
									{/each}
								</div>
							</div>
							{#if layer.key === 'participation' || layer.key === 'participation2014' || layer.key === 'participation2008'}
								<p class="legend-hint">Taux de participation aux élections municipales. Combinez deux années (cochez) pour visualiser l'évolution : <span style="color:#38884a">vert</span> = hausse, <span style="color:#d06848">corail</span> = baisse.</p>
							{/if}
						</div>
					{:else}
						{@const biPalette = getBivariatePalette(activeLayerConfigs[0].key, activeLayerConfigs[1].key)}
						<div class="legend-section">
							<span class="legend-title">{activeLayerConfigs[0].shortLabel} × {activeLayerConfigs[1].shortLabel}</span>
							<div class="bivariate-legend">
								<div class="bivariate-y-axis">
									<span class="axis-range">{activeLayerConfigs[0].rangeLabels[1]}</span>
									<span class="axis-max">{activeLayerConfigs[0].axisLabels[1]}</span>
									<span class="axis-label-vert">{activeLayerConfigs[0].shortLabel}</span>
									<span class="axis-min">{activeLayerConfigs[0].axisLabels[0]}</span>
									<span class="axis-range">{activeLayerConfigs[0].rangeLabels[0]}</span>
								</div>
								<div class="bivariate-main">
									<div class="bivariate-grid">
										{#each [2, 1, 0] as row}
											{#each [0, 1, 2] as col}
												<div
													class="bivariate-cell"
													class:hovered={hoveredCell?.row === row && hoveredCell?.col === col}
													style="background: {biPalette[row][col]}"
													title={cellTooltip(row, col)}
													onmouseenter={() => hoveredCell = { row, col }}
													onmouseleave={() => hoveredCell = null}
												></div>
											{/each}
										{/each}
									</div>
									<div class="bivariate-x-axis">
										<span class="axis-range">{activeLayerConfigs[1].rangeLabels[0]}</span>
										<span class="axis-min">{activeLayerConfigs[1].axisLabels[0]}</span>
										<span class="axis-label-horiz">{activeLayerConfigs[1].shortLabel}</span>
										<span class="axis-max">{activeLayerConfigs[1].axisLabels[1]}</span>
										<span class="axis-range">{activeLayerConfigs[1].rangeLabels[1]}</span>
									</div>
								</div>
							</div>
							{#if getCorrelationInsight(activeLayerConfigs[0].key, activeLayerConfigs[1].key)}
								<p class="correlation-insight">{getCorrelationInsight(activeLayerConfigs[0].key, activeLayerConfigs[1].key)}</p>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Mobile: bivariate legend overlay (bottom-left, always visible when 2 layers) -->
		{#if activeLayers.length === 2}
			{@const biPalette = getBivariatePalette(activeLayerConfigs[0].key, activeLayerConfigs[1].key)}
			<div class="mobile-bi-overlay" class:legend-expanded={mobileLegendOpen}>
				<span class="mobile-bi-overlay-title">{activeLayerConfigs[0].shortLabel} × {activeLayerConfigs[1].shortLabel}</span>
				<div class="mobile-bi-overlay-inner">
					<span class="mobile-bi-axis-y">{activeLayerConfigs[0].shortLabel}</span>
					<div>
						<div class="mobile-bi-grid">
							{#each [2, 1, 0] as row}
								{#each [0, 1, 2] as col}
									<div class="mobile-bi-cell" style="background: {biPalette[row][col]}" title={cellTooltip(row, col)}></div>
								{/each}
							{/each}
						</div>
						<div class="mobile-bi-axis-x">
							<span>{activeLayerConfigs[1].rangeLabels[0]}</span>
							<span class="mobile-bi-axis-label">{activeLayerConfigs[1].shortLabel}</span>
							<span>{activeLayerConfigs[1].rangeLabels[1]}</span>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Mobile bottom panel -->
		<div class="mobile-panel" class:expanded={mobileLegendOpen}>
			<!-- Drag handle + legend toggle -->
			<button class="mobile-panel-header" onclick={() => mobileLegendOpen = !mobileLegendOpen}>
				<span class="mobile-drag-handle"></span>
				<span class="mobile-panel-title">
					{#if activeLayers.length === 1}
						{getLayerConfig(activeLayers[0]).label}
					{:else}
						{activeLayerConfigs[0].shortLabel} × {activeLayerConfigs[1].shortLabel}
					{/if}
				</span>
				<svg class="mobile-chevron" class:flipped={mobileLegendOpen} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
				</svg>
			</button>

			<!-- Layer pills row (always visible) -->
			<div class="mobile-pills">
				{#each LAYERS as layer}
					<button
						class="mobile-pill"
						class:active={isActive(layer.key)}
						onclick={() => {
							if (longPressFired) return;
							if (activeLayers.length === 2 && isActive(layer.key)) {
								toggleLayerCorrelation(layer.key);
							} else if (activeLayers.length === 1 && isActive(layer.key)) {
								// already solo — do nothing
							} else {
								switchToLayer(layer.key);
							}
						}}
						ontouchstart={() => pillTouchStart(layer.key)}
						ontouchend={pillTouchEnd}
						ontouchcancel={pillTouchEnd}
						oncontextmenu={(e) => e.preventDefault()}
					>
						{layer.shortLabel}
					</button>
				{/each}
			</div>

			<!-- Gradient legend always visible for single layer -->
			{#if activeLayers.length === 1}
				{@const layer = getLayerConfig(activeLayers[0])}
				<div class="mobile-legend-always">
					<div class="gradient-bar" style="background: linear-gradient(90deg, {layer.legendStops.map(s => s.color).join(', ')})"></div>
					<div class="gradient-labels">
						{#each layer.legendStops as stop}
							<span>{stop.value}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Expanded content: full controls -->
			{#if mobileLegendOpen}
				<div class="mobile-panel-body">
					<p class="mobile-hint">Appui long pour combiner 2 couches</p>

					<div class="mobile-layer-list">
						{#each LAYERS as layer}
							<button
								class="mobile-layer-row"
								class:active={isActive(layer.key)}
								onclick={() => toggleLayerCorrelation(layer.key)}
							>
								<span class="mobile-layer-check">
									{#if isActive(layer.key)}
										<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
										</svg>
									{/if}
								</span>
								<span class="mobile-layer-name">{layer.label}</span>
							</button>
						{/each}
					</div>

					{#if activeLayers.length === 2 && getCorrelationInsight(activeLayerConfigs[0].key, activeLayerConfigs[1].key)}
						<p class="mobile-insight">{getCorrelationInsight(activeLayerConfigs[0].key, activeLayerConfigs[1].key)}</p>
					{:else if activeLayers.length === 1 && (activeLayers[0] === 'participation' || activeLayers[0] === 'participation2014' || activeLayers[0] === 'participation2008')}
						<p class="mobile-insight">Combinez 2 années de participation pour voir l'évolution : vert = hausse, corail = baisse.</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<div class="sr-only" aria-hidden="false">
		<h2>Données disponibles sur la carte</h2>
		<p>Cette carte interactive couvre les 34 000 communes de France métropolitaine et d'outre-mer (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte, Saint-Pierre-et-Miquelon, Nouvelle-Calédonie).</p>
		<h3>Participation électorale</h3>
		<p>Taux de participation aux élections municipales de 2008, 2014 et 2020. Comparez l'évolution de l'abstention entre deux scrutins en superposant les couches.</p>
		<h3>Projections climatiques</h3>
		<p>Hausse des températures moyennes à horizon 2050 et 2100 selon les données DRIAS TRACC-2023 (Météo-France, IPSL, CERFACS).</p>
		<h3>Finances municipales</h3>
		<p>Évolution de la dette par habitant entre 2019 et 2024 (source : OFGL, DGFiP). Médiane nationale : -73 €/hab.</p>
		<h3>Revenus et démographie</h3>
		<p>Revenu médian par ménage (INSEE) et taux de croissance démographique annuel par commune.</p>
	</div>
</div>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
	.carte-page {
		position: relative;
		width: 100%;
		height: calc(100vh - 44px);
		overflow: hidden;
	}

	@media (min-width: 768px) {
		.carte-page {
			height: calc(100vh - 52px);
		}
	}

	.carte-map {
		width: 100%;
		height: 100%;
	}

	/* DOM-TOM navigation — floating buttons, wraps to 1-2 lines */
	.domtom-nav {
		position: absolute;
		top: 0.5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 3;
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.25rem;
		max-width: calc(100% - 12rem);
	}

	@media (max-width: 767px) {
		.domtom-nav {
			max-width: calc(100% - 6rem);
		}
	}

	.domtom-btn {
		padding: 0.25rem 0.5rem;
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--color-foreground);
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		white-space: nowrap;
	}

	:global(.dark) .domtom-btn {
		background: rgba(30, 30, 30, 0.9);
		border-color: rgba(255, 255, 255, 0.15);
		color: #e6edf3;
	}

	.domtom-btn:hover {
		background: var(--color-gold);
		color: #fff;
		border-color: var(--color-gold);
	}

	/* Layer panel (desktop sidebar) */
	.layer-panel {
		display: none;
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		z-index: 2;
		background: rgba(255, 255, 255, 0.96);
		backdrop-filter: blur(12px);
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
		max-width: 250px;
		transition: all 0.2s ease;
	}

	@media (min-width: 768px) {
		.layer-panel {
			display: block;
		}
	}

	.layer-panel.collapsed {
		max-width: 180px;
	}

	.collapsed-legend {
		padding: 0.4rem 0.5rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.collapsed-legend-title {
		font-size: 0.6rem;
		font-weight: 700;
		color: var(--color-text);
		text-align: center;
	}

	.collapsed-legend-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.55rem;
		color: var(--color-text-muted);
	}

	.collapsed-bi-grid {
		display: grid;
		grid-template-columns: repeat(3, 22px);
		grid-template-rows: repeat(3, 22px);
		gap: 1px;
		border-radius: 3px;
		overflow: hidden;
		margin: 0 auto;
	}

	.collapsed-bi-cell {
		width: 100%;
		height: 100%;
	}

	.panel-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: none;
		background: transparent;
		color: var(--color-text);
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: background 0.15s ease;
	}

	.panel-toggle:hover {
		background: var(--color-cream-dark);
	}

	.panel-content {
		padding: 0 0.875rem 0.875rem;
	}

	.panel-title {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.125rem;
	}

	.panel-hint {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
	}

	/* Layer buttons with dual click zones */
	.layer-options {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-bottom: 1rem;
		max-height: 290px;
		overflow-y: auto;
	}

	.layer-btn {
		display: flex;
		align-items: center;
		background: var(--color-cream);
		border: 1.5px solid var(--color-card-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		transition: all 0.15s ease;
	}

	.layer-btn:hover {
		border-color: var(--color-gold-light);
	}

	.layer-btn.active {
		background: var(--color-navy);
		border-color: var(--color-navy);
	}

	.layer-check-zone {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.4rem 0.4rem;
		background: transparent;
		border: none;
		border-right: 1px solid rgba(0, 0, 0, 0.06);
		cursor: pointer;
		flex-shrink: 0;
	}

	.layer-btn.active .layer-check-zone {
		border-right-color: rgba(255, 255, 255, 0.15);
	}

	.layer-check {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border: 2px solid var(--color-text-muted);
		border-radius: 4px;
		transition: all 0.15s ease;
	}

	.layer-btn.active .layer-check {
		background: var(--color-gold);
		border-color: var(--color-gold);
		color: var(--color-navy);
	}

	.layer-label-zone {
		flex: 1;
		padding: 0.4rem 0.5rem;
		background: transparent;
		border: none;
		font-size: 0.73rem;
		font-weight: 500;
		color: var(--color-text);
		cursor: pointer;
		text-align: left;
		font-family: var(--font-body);
		transition: background 0.15s ease;
	}

	.layer-label-zone:hover {
		background: rgba(0, 0, 0, 0.03);
	}

	.layer-btn.active .layer-label-zone {
		color: #faf8f5;
	}

	.layer-btn.active .layer-label-zone:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	/* Legend section */
	.legend-section {
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-card-border);
	}

	.legend-title {
		display: block;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Gradient legend */
	.gradient-legend {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.gradient-bar {
		height: 10px;
		border-radius: 5px;
		width: 100%;
	}

	.gradient-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.6rem;
		color: var(--color-text-muted);
	}

	.legend-hint {
		font-size: 0.62rem;
		color: var(--color-text-light);
		line-height: 1.4;
		margin-top: 0.5rem;
		font-style: italic;
	}

	/* Bivariate legend with axis labels */
	.bivariate-legend {
		display: flex;
		gap: 0.4rem;
	}

	.bivariate-y-axis {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		padding: 0 0.15rem;
		min-width: 2.2rem;
	}

	.bivariate-main {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.axis-label-vert {
		font-size: 0.6rem;
		font-weight: 700;
		color: var(--color-text);
		writing-mode: vertical-rl;
		text-orientation: mixed;
		transform: rotate(180deg);
	}

	.axis-label-horiz {
		font-size: 0.6rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.axis-min, .axis-max {
		font-size: 0.55rem;
		color: var(--color-text-light);
		white-space: nowrap;
	}

	.axis-range {
		font-size: 0.5rem;
		color: var(--color-text-muted);
		white-space: nowrap;
		font-style: italic;
	}

	.bivariate-grid {
		display: grid;
		grid-template-columns: repeat(3, 34px);
		grid-template-rows: repeat(3, 34px);
		gap: 2px;
		border-radius: 5px;
		overflow: hidden;
	}

	.bivariate-cell {
		width: 100%;
		height: 100%;
		cursor: help;
		transition: transform 0.1s ease, box-shadow 0.1s ease;
	}

	.bivariate-cell.hovered {
		transform: scale(1.15);
		box-shadow: 0 0 0 2px white, 0 0 0 3px rgba(0, 0, 0, 0.3);
		z-index: 1;
		position: relative;
	}

	.bivariate-x-axis {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.2rem;
	}

	.correlation-insight {
		font-size: 0.65rem;
		color: var(--color-text-light);
		line-height: 1.4;
		margin: 0.5rem 0 0;
		padding-top: 0.5rem;
		border-top: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
		font-style: italic;
	}

	/* ═══ Mobile bottom panel ═══ */
	.mobile-panel {
		display: flex;
		flex-direction: column;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 2;
		background: rgba(255, 255, 255, 0.97);
		backdrop-filter: blur(12px);
		border-radius: 1rem 1rem 0 0;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
		max-height: 70vh;
		transition: max-height 0.3s ease;
		overflow: hidden;
	}

	.mobile-panel:not(.expanded) {
		max-height: 7rem;
	}

	@media (min-width: 768px) {
		.mobile-panel {
			display: none;
		}
	}

	.mobile-panel-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem 0.25rem;
		border: none;
		background: transparent;
		cursor: pointer;
		flex-direction: column;
	}

	.mobile-drag-handle {
		width: 2rem;
		height: 3px;
		background: var(--color-text-muted);
		border-radius: 2px;
		opacity: 0.4;
	}

	.mobile-panel-title {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--color-text);
		font-family: var(--font-body);
	}

	.mobile-chevron {
		position: absolute;
		right: 1rem;
		top: 0.75rem;
		color: var(--color-text-muted);
		transition: transform 0.2s ease;
	}

	.mobile-chevron.flipped {
		transform: rotate(180deg);
	}

	/* Layer pills (always visible) */
	.mobile-pills {
		display: flex;
		gap: 0.3rem;
		padding: 0.25rem 0.75rem 0.5rem;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.mobile-pills::-webkit-scrollbar {
		display: none;
	}

	.mobile-pill {
		padding: 0.3rem 0.6rem;
		font-size: 0.62rem;
		font-weight: 600;
		color: var(--color-text-light);
		border: 1.5px solid var(--color-card-border);
		background: transparent;
		cursor: pointer;
		border-radius: var(--radius-full);
		font-family: var(--font-body);
		white-space: nowrap;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.mobile-pill.active {
		background: var(--color-navy);
		border-color: var(--color-navy);
		color: #faf8f5;
	}

	/* Expanded body */
	.mobile-panel-body {
		padding: 0.25rem 0.75rem 1rem;
		overflow-y: auto;
		border-top: 1px solid var(--color-card-border);
	}

	.mobile-hint {
		font-size: 0.6rem;
		color: var(--color-text-muted);
		margin-bottom: 0.5rem;
		text-align: center;
	}

	.mobile-layer-list {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
	}

	.mobile-layer-row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.5rem;
		border: 1.5px solid var(--color-card-border);
		background: transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		font-family: var(--font-body);
		transition: all 0.15s ease;
	}

	.mobile-layer-row.active {
		background: var(--color-navy);
		border-color: var(--color-navy);
	}

	.mobile-layer-check {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		border: 2px solid var(--color-text-muted);
		border-radius: 3px;
		flex-shrink: 0;
	}

	.mobile-layer-row.active .mobile-layer-check {
		background: var(--color-gold);
		border-color: var(--color-gold);
		color: var(--color-navy);
	}

	.mobile-layer-name {
		font-size: 0.62rem;
		font-weight: 500;
		color: var(--color-text);
		text-align: left;
	}

	.mobile-layer-row.active .mobile-layer-name {
		color: #faf8f5;
	}

	/* Gradient legend always visible in bottom panel */
	.mobile-legend-always {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.25rem 0.75rem 0.5rem;
	}

	/* Bivariate overlay — bottom-left of map, above the panel */
	.mobile-bi-overlay {
		display: none;
		position: absolute;
		bottom: 8rem;
		left: 0.5rem;
		z-index: 2;
		background: rgba(255, 255, 255, 0.94);
		backdrop-filter: blur(8px);
		border-radius: var(--radius-md);
		padding: 0.4rem 0.5rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
	}

	@media (max-width: 767.99px) {
		.mobile-bi-overlay {
			display: block;
			transition: bottom 0.2s ease;
		}
		.mobile-bi-overlay.legend-expanded {
			bottom: 18rem;
		}
	}

	.mobile-bi-overlay-title {
		display: block;
		font-size: 0.55rem;
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: 0.25rem;
		text-align: center;
	}

	.mobile-bi-overlay-inner {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.mobile-bi-axis-y {
		font-size: 0.55rem;
		font-weight: 700;
		color: var(--color-text);
		writing-mode: vertical-rl;
		transform: rotate(180deg);
	}

	.mobile-bi-grid {
		display: grid;
		grid-template-columns: repeat(3, 28px);
		grid-template-rows: repeat(3, 28px);
		gap: 1.5px;
		border-radius: 4px;
		overflow: hidden;
	}

	.mobile-bi-cell {
		width: 100%;
		height: 100%;
	}

	.mobile-bi-axis-x {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: calc(3 * 28px + 3px);
		margin-top: 0.15rem;
	}

	.mobile-bi-axis-x span {
		font-size: 0.5rem;
		color: var(--color-text-muted);
	}

	.mobile-bi-axis-label {
		font-weight: 700 !important;
		color: var(--color-text) !important;
	}

	.mobile-insight {
		font-size: 0.62rem;
		color: var(--color-text-light);
		line-height: 1.4;
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-card-border);
		font-style: italic;
	}

	/* Popup styles for carte page */
	:global(.carte-popup) {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.65rem 0.8rem;
		min-width: 180px;
	}

	:global(.carte-popup strong) {
		font-family: var(--font-display);
		font-size: 0.95rem;
		color: var(--color-foreground);
	}

	:global(.popup-meta) {
		font-size: 0.75rem;
		color: var(--color-text-light);
	}

	:global(.popup-mayor) {
		font-size: 0.7rem;
		color: var(--color-text);
		font-weight: 500;
		margin-top: 0.15rem;
	}

	:global(.popup-data) {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		margin: 0.3rem 0;
		padding: 0.35rem 0;
		border-top: 1px solid var(--color-card-border);
		border-bottom: 1px solid var(--color-card-border);
	}

	:global(.popup-row) {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: 0.72rem;
	}

	:global(.popup-label) {
		color: var(--color-text-muted);
	}

	:global(.popup-value) {
		color: var(--color-foreground);
		font-weight: 600;
	}

	:global(.popup-link) {
		display: block;
		margin-top: 0.25rem;
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

	:global(.popup-link:hover) {
		background: var(--color-gold);
		color: var(--color-foreground);
	}

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

	/* ═══ Dark mode ═══ */
	.dark .layer-panel {
		background: rgba(22, 27, 34, 0.96);
	}

	.dark .panel-toggle:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.dark .layer-btn {
		background: #161b22;
		border-color: rgba(255, 255, 255, 0.08);
	}

	.dark .layer-btn:hover {
		border-color: var(--color-gold);
	}

	.dark .layer-check-zone {
		border-right-color: rgba(255, 255, 255, 0.06);
	}

	.dark .layer-label-zone {
		color: #e6edf3;
	}

	.dark .layer-label-zone:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.dark .bivariate-cell.hovered {
		box-shadow: 0 0 0 2px #161b22, 0 0 0 3px rgba(255, 255, 255, 0.4);
	}

	.dark .mobile-bi-overlay {
		background: rgba(22, 27, 34, 0.94);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
	}

	.dark .mobile-bi-overlay-title {
		color: #e6edf3;
	}

	.dark .mobile-panel {
		background: rgba(22, 27, 34, 0.97);
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
	}

	.dark .mobile-drag-handle {
		background: #8b949e;
	}

	.dark .mobile-panel-title {
		color: #e6edf3;
	}

	.dark .mobile-pill {
		color: #8b949e;
		border-color: rgba(255, 255, 255, 0.08);
	}

	.dark .mobile-panel-body {
		border-top-color: rgba(255, 255, 255, 0.08);
	}

	.dark .mobile-layer-row {
		border-color: rgba(255, 255, 255, 0.08);
	}

	.dark .mobile-layer-name {
		color: #e6edf3;
	}
</style>
