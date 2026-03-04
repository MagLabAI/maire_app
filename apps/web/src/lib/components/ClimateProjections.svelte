<script lang="ts">
	interface IndicatorValue {
		median: number | null;
		low: number | null;
		high: number | null;
	}

	interface CityClimate {
		slug: string;
		name: string;
		inseeCode: string;
		horizons: Record<string, Record<string, IndicatorValue>>;
	}

	interface Props {
		climateData: CityClimate | null;
	}

	let { climateData }: Props = $props();

	type Horizon = '2030' | '2050' | '2100';
	let selectedHorizon = $state<Horizon>('2050');

	const HORIZONS: { key: Horizon; label: string; warming: string }[] = [
		{ key: '2030', label: '2030', warming: '+2,0°C' },
		{ key: '2050', label: '2050', warming: '+2,7°C' },
		{ key: '2100', label: '2100', warming: '+4,0°C' },
	];

	// Indicator display config: key matches DRIAS variable name
	const CARDS = [
		{
			key: 'TX30D',
			icon: '🌡️',
			title: 'Canicule',
			subtitle: (v: number) => `+${formatNum(v)} jours au-dessus de 30°C l'été`,
			unit: 'jours',
			prefix: '+',
			thresholds: [5, 15] as [number, number],
			impacts: [
				{ text: 'Fermeture écoles et crèches lors des pics (>35°C protocole national)', source: 'Min. Éducation nationale' },
			],
		},
		{
			key: 'TR',
			icon: '🌙',
			title: 'Nuits tropicales',
			subtitle: (v: number) => `+${formatNum(v)} nuits où la température ne descend pas sous 20°C`,
			unit: 'nuits/an',
			prefix: '+',
			thresholds: [10, 30] as [number, number],
			impacts: [
				{ text: 'Baisse de 15% de la qualité du sommeil au-delà de 20°C', source: 'Inserm, 2022' },
				{ text: '+25% de consultations pour troubles du sommeil', source: 'Santé publique France, 2019' },
			],
		},
		{
			key: 'SWI04D',
			icon: '💧',
			title: 'Stress hydrique',
			subtitle: (v: number) => `+${formatNum(v)} jours où il pleut moins que ce qui s'évapore`,
			unit: 'jours/an',
			prefix: '+',
			thresholds: [20, 45] as [number, number],
			impacts: [
				{ text: 'Restrictions d\'eau potable possibles', source: 'Préfectures' },
				{ text: 'Baisse de 30% du débit des nappes phréatiques', source: 'BRGM' },
			],
		},
		{
			key: 'TMm',
			icon: '☀️',
			title: 'Température estivale',
			subtitle: (v: number) => `+${formatNum(v)}°C en moyenne l'été (juin, juillet, août)`,
			unit: '°C',
			prefix: '+',
			thresholds: [1.5, 3.0] as [number, number],
			impacts: [
				{ text: 'Inconfort thermique généralisé (>26°C = seuil d\'inconfort)', source: 'Inserm' },
			],
		},
	] as const;

	type SeverityLevel = 'low' | 'moderate' | 'critical';

	function severity(value: number | null, thresholds: [number, number]): SeverityLevel {
		if (value == null) return 'low';
		if (value >= thresholds[1]) return 'critical';
		if (value >= thresholds[0]) return 'moderate';
		return 'low';
	}

	function formatNum(v: number): string {
		return v % 1 === 0 ? String(v) : v.toFixed(1).replace('.', ',');
	}

	let horizonData = $derived(climateData?.horizons?.[selectedHorizon] ?? null);

	const SEVERITY_LABELS: Record<SeverityLevel, string> = {
		low: 'Faible',
		moderate: 'Modéré',
		critical: 'Critique',
	};

	let isExpanded = $state(true);
	let expandedCard = $state<string | null>(null);
	function toggleCard(key: string) {
		expandedCard = expandedCard === key ? null : key;
	}
</script>

{#if climateData && horizonData}
	<section class="climate-section">
		<button class="climate-header" onclick={() => isExpanded = !isExpanded}>
			<h3 class="climate-title">
				<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 2v6m0 0a4 4 0 100 8 4 4 0 000-8zm-6.93 5H2m3.07 5.93L3.51 20.49M12 18v4m5.93-2.07l1.56 1.56M22 13h-3.07M20.49 3.51l-1.56 1.56" />
				</svg>
				Projections climatiques
			</h3>
			<span class="climate-badge">{HORIZONS.find(h => h.key === selectedHorizon)?.warming}</span>
		</button>

		{#if isExpanded}
		<div class="climate-body">
			<div class="horizon-tabs">
				{#each HORIZONS as h (h.key)}
					<button
						class="horizon-tab"
						class:active={selectedHorizon === h.key}
						onclick={() => selectedHorizon = h.key}
					>
						<span class="tab-year">{h.label}</span>
						<span class="tab-warming">{h.warming}</span>
					</button>
				{/each}
			</div>

			<!-- Indicator cards -->
			<div class="climate-cards">
				{#each CARDS as card (card.key)}
					{@const indicator = horizonData[card.key]}
					{@const val = indicator?.median}
					{@const sev = severity(val, card.thresholds)}
					<button class="climate-card severity-{sev}" onclick={() => toggleCard(card.key)}>
						<div class="card-top">
							<span class="card-icon">{card.icon}</span>
							<span class="card-title">{card.title}</span>
						</div>
						<div class="card-value">
							{#if val != null}
								<span class="big-number">{card.prefix}{formatNum(val)}</span>
								<span class="value-unit">{card.unit}</span>
							{:else}
								<span class="big-number">—</span>
							{/if}
						</div>
						<div class="severity-bar">
							<div class="severity-track">
								<div class="severity-fill" style="width: {val != null ? Math.min(val / card.thresholds[1] * 100, 100) : 0}%"></div>
							</div>
							<span class="severity-label">{SEVERITY_LABELS[sev]}</span>
						</div>
						{#if val != null}
							<p class="card-subtitle">{card.subtitle(val)}</p>
						{/if}

						{#if expandedCard === card.key}
							<div class="card-impacts">
								{#each card.impacts as impact (impact.text)}
									<p class="impact-line">
										<span class="impact-text">{impact.text}</span>
										<span class="impact-source">({impact.source})</span>
									</p>
								{/each}
								{#if indicator?.low != null && indicator?.high != null}
									<p class="confidence-range">
										Fourchette : {card.prefix}{formatNum(indicator.low)} à {card.prefix}{formatNum(indicator.high)}
									</p>
								{/if}
							</div>
						{/if}
					</button>
				{/each}
			</div>

			<p class="climate-source">
				Source : Météo-France, DRIAS-TRACC 2023
				<br>
				<span class="climate-note">Projections selon la trajectoire de réchauffement de référence pour l'adaptation (TRACC). Écart vs. période 1976-2005.</span>
			</p>
		</div>
		{/if}
	</section>
{/if}

<style>
	.climate-section {
		background: var(--color-cream-dark);
		border: 1px solid color-mix(in srgb, var(--color-gold) 20%, transparent);
		border-radius: 12px;
		overflow: hidden;
	}

	.climate-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 12px 16px;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
	}
	.climate-header:hover {
		background: color-mix(in srgb, var(--color-gold) 5%, transparent);
	}

	.climate-title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: 'Playfair Display', serif;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}
	.climate-title svg {
		width: 16px;
		height: 16px;
		color: var(--color-gold);
	}

	.climate-badge {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 10px;
		background: color-mix(in srgb, var(--color-coral) 15%, transparent);
		color: var(--color-coral);
	}

	.climate-body {
		padding: 0 16px 16px;
	}
	/* Horizon tabs */
	.horizon-tabs {
		display: flex;
		gap: 4px;
		margin-bottom: 12px;
		background: color-mix(in srgb, var(--color-navy) 5%, transparent);
		border-radius: 8px;
		padding: 3px;
	}
	.horizon-tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
		padding: 6px 8px;
		border: none;
		border-radius: 6px;
		background: transparent;
		cursor: pointer;
		transition: all 0.2s;
	}
	.horizon-tab.active {
		background: var(--color-cream);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	.tab-year {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-text);
	}
	.tab-warming {
		font-size: 0.65rem;
		color: var(--color-text-light);
	}
	.horizon-tab.active .tab-warming {
		color: var(--color-coral);
		font-weight: 600;
	}

	/* Cards grid */
	.climate-cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 12px;
	}

	.climate-card {
		background: var(--color-cream);
		border: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
		border-radius: 10px;
		padding: 10px;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.climate-card:hover {
		border-color: var(--color-gold-light);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	/* Severity border accents */
	.climate-card.severity-low {
		border-left: 3px solid var(--color-success);
	}
	.climate-card.severity-moderate {
		border-left: 3px solid var(--color-gold);
	}
	.climate-card.severity-critical {
		border-left: 3px solid var(--color-coral);
	}

	.card-top {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.card-icon {
		font-size: 1rem;
	}
	.card-title {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-text-light);
	}

	.card-value {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}
	.big-number {
		font-family: 'Playfair Display', serif;
		font-size: 1.6rem;
		font-weight: 700;
		line-height: 1;
	}
	.severity-low .big-number { color: var(--color-success); }
	.severity-moderate .big-number { color: var(--color-gold-dark); }
	.severity-critical .big-number { color: var(--color-coral); }

	.value-unit {
		font-size: 0.7rem;
		color: var(--color-text-light);
	}

	/* Severity bar */
	.severity-bar {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.severity-track {
		flex: 1;
		height: 3px;
		background: color-mix(in srgb, var(--color-text) 10%, transparent);
		border-radius: 2px;
		overflow: hidden;
	}
	.severity-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.4s ease;
	}
	.severity-low .severity-fill { background: var(--color-success); }
	.severity-moderate .severity-fill { background: var(--color-gold); }
	.severity-critical .severity-fill { background: var(--color-coral); }

	.severity-label {
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}
	.severity-low .severity-label { color: var(--color-success); }
	.severity-moderate .severity-label { color: var(--color-gold-dark); }
	.severity-critical .severity-label { color: var(--color-coral); }

	.card-subtitle {
		font-size: 0.65rem;
		color: var(--color-text-light);
		line-height: 1.3;
		margin: 0;
	}

	/* Expanded impacts */
	.card-impacts {
		margin-top: 6px;
		padding-top: 6px;
		border-top: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.impact-line {
		margin: 0;
		font-size: 0.65rem;
		line-height: 1.4;
	}
	.impact-text {
		color: var(--color-text);
	}
	.impact-source {
		color: var(--color-text-muted);
		font-style: italic;
	}
	.confidence-range {
		margin: 4px 0 0;
		font-size: 0.6rem;
		color: var(--color-text-muted);
		font-style: italic;
	}

	/* Source footer */
	.climate-source {
		font-size: 0.6rem;
		color: var(--color-text-muted);
		line-height: 1.4;
		margin: 0;
	}
	.climate-note {
		font-style: italic;
	}

	/* Single column on very narrow screens */
	@media (max-width: 360px) {
		.climate-cards {
			grid-template-columns: 1fr;
		}
	}
</style>
