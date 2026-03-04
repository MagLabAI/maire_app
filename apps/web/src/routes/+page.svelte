<script lang="ts">
	import type { PageData } from './$types';
	import type { City, Candidate } from '$lib/types/elections';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import CountdownTimer from '$lib/components/CountdownTimer.svelte';
	import CitySearch from '$lib/components/CitySearch.svelte';
	import CandidateCard from '$lib/components/CandidateCard.svelte';
	import CompareBar from '$lib/components/CompareBar.svelte';
	import SeoMeta from '$lib/components/SeoMeta.svelte';
	import { headerSearch } from '$lib/stores/headerSearch.svelte';

	let { data }: { data: PageData } = $props();

	let featuredElection = $derived(data.elections.find((e) => e.id === data.featuredElection));
	let electionDate = $derived(featuredElection?.dates.round1 || '2026-03-15');
	let popularCities = $derived(data.cities.slice(0, 8));

	// --- Lazy-load map ---
	let mapVisible = $state(false);
	let mapSentinel: HTMLDivElement;
	let CityMap: typeof import('$lib/components/CityMap.svelte').default | null = $state(null);

	// --- Client-side featured candidates ---
	interface FeaturedCandidate extends Candidate {
		cityName: string;
		citySlug: string;
	}
	let featuredCandidates = $state<FeaturedCandidate[]>([]);
	let featuredLoading = $state(true);
	const CARD_COUNT = 8;

	// --- IP geolocation ---
	let geoDismissed = $state(false);
	let suggestedCity = $state<City | null>(null);

	// --- Header search observer ---
	let heroSearchEl: HTMLDivElement;
	let searchObserver: IntersectionObserver | null = null;

	function pickRandom<T>(arr: T[], n: number): T[] {
		const shuffled = [...arr].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, n);
	}

	onMount(async () => {
		headerSearch.cities = data.cities;

		const mapObserver = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					mapVisible = true;
					import('$lib/components/CityMap.svelte').then((m) => { CityMap = m.default; });
					mapObserver.disconnect();
				}
			},
			{ rootMargin: '300px' }
		);
		mapObserver.observe(mapSentinel);

		searchObserver = new IntersectionObserver(
			([entry]) => { headerSearch.visible = !entry.isIntersecting; },
			{ threshold: 0 }
		);
		if (heroSearchEl) searchObserver.observe(heroSearchEl);

		loadFeaturedCandidates();
		loadGeoSuggestion();

		return () => { mapObserver.disconnect(); };
	});

	onDestroy(() => {
		if (browser) {
			headerSearch.visible = false;
		}
		searchObserver?.disconnect();
	});

	async function loadFeaturedCandidates() {
		// Only pick cities with candidates (have individual JSON files)
		const withCandidates = data.cities.filter((c: City) => c.candidatesCount > 0);
		const big = withCandidates.filter((c: City) => c.population >= 200000);
		const medium = withCandidates.filter((c: City) => c.population >= 30000 && c.population < 200000);
		const small = withCandidates.filter((c: City) => c.population >= 5000 && c.population < 30000);

		const selectedCities = [
			...pickRandom(big, 4),
			...pickRandom(medium, 3),
			...pickRandom(small, 1)
		];

		const results: FeaturedCandidate[] = [];
		await Promise.all(
			selectedCities.map(async (city) => {
				try {
					const res = await fetch(`/data/cities/${city.slug}.json`);
					if (!res.ok) return;
					const cityData = await res.json();
					const heads = (cityData.candidates || []).filter((c: Candidate) => c.isHead);
					if (heads.length === 0) return;
					const pick = heads[Math.floor(Math.random() * heads.length)];
					results.push({ ...pick, cityName: cityData.city.name, citySlug: city.slug });
				} catch {
					// City data not available
				}
			})
		);

		featuredCandidates = results.slice(0, CARD_COUNT);
		featuredLoading = false;
	}

	async function loadGeoSuggestion() {
		try {
			const res = await fetch('/api/geo');
			const { city: cfCity } = await res.json();
			if (!cfCity) return;
			const normalize = (s: string) =>
				s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
			const target = normalize(cfCity);
			suggestedCity =
				data.cities.find((c: City) => normalize(c.name) === target) ||
				data.cities.find((c: City) => normalize(c.name).startsWith(target) && c.population > 5000) ||
				null;
		} catch {
			// Expected on localhost
		}
	}
</script>

<svelte:head>
	<title>maire.app — Élections Municipales 2026 | Candidats et programmes</title>
	<meta name="description" content="Comparez les candidats et listes aux élections municipales 2026 dans votre commune. Programmes, profils, cartes interactives et outil de comparaison. Plateforme citoyenne indépendante — données ouvertes sur 34 000 communes." />
	<SeoMeta
		title="maire.app — Élections Municipales 2026 | Candidats et programmes"
		description="Comparez les candidats et listes aux élections municipales 2026 dans votre commune. Programmes, profils, cartes interactives et outil de comparaison. Plateforme citoyenne indépendante — données ouvertes sur 34 000 communes."
		path="/"
	/>
</svelte:head>

<!-- Hero Section — compact, centered -->
<section class="hero">
	<div class="hero-bg"></div>
	<div class="container-app relative z-10">
		<div class="hero-content animate-fade-in-up">
			<div class="hero-badge">
				<span class="badge-dot"></span>
				<span>Élections Municipales 2026</span>
			</div>

			<h1 class="hero-title">
				Découvrez vos
				<span class="text-gradient-gold">candidats</span>
			</h1>

			<p class="hero-subtitle">
				Explorez les programmes, comparez les profils et faites un choix éclairé pour votre ville.
			</p>

			<!-- Participation callout — visible early on mobile -->
			<div class="participation-inline">
				<span class="participation-inline-stat">44%</span>
				<span class="participation-inline-text">de participation en 2020. Informez-vous pour 2026.</span>
			</div>

			<div class="hero-countdown">
				<CountdownTimer targetDate={electionDate} label="1er tour" />
			</div>

			<!-- Geolocation suggestion -->
			{#if suggestedCity && !geoDismissed}
				<a href="/elections/municipales-2026/{suggestedCity.slug}" class="geo-suggestion">
					<svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					<span>Vous êtes à <strong>{suggestedCity.name}</strong> ? Voir les candidats →</span>
					<button
						class="geo-dismiss"
						onclick={(e) => { e.preventDefault(); e.stopPropagation(); geoDismissed = true; }}
						aria-label="Fermer"
					>✕</button>
				</a>
			{/if}

			<!-- Search -->
			<div class="hero-search" bind:this={heroSearchEl}>
				<CitySearch cities={data.cities} />
			</div>

			<div class="hero-popular">
				<span class="popular-label">Villes populaires :</span>
				<div class="popular-cities">
					{#each popularCities as city}
						<a href="/elections/municipales-2026/{city.slug}" class="popular-city">
							{city.name}
						</a>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Map Showcase — full-width, prominent -->
<section class="map-showcase" bind:this={mapSentinel}>
	<div class="map-showcase-header">
		<div class="container-app">
			<div class="map-showcase-title-row">
				<h2 class="map-showcase-title">34 968 communes, une carte</h2>
				<a href="/carte" class="map-showcase-cta">
					Explorer en plein écran
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
					</svg>
				</a>
			</div>
		</div>
	</div>

	<div class="map-showcase-body">
		{#if CityMap}
			<CityMap election="municipales-2026" />
		{:else if mapVisible}
			<div class="map-loading">
				<div class="map-loading-pulse"></div>
				<span class="map-loading-text">Chargement de la carte...</span>
			</div>
		{:else}
			<div class="map-loading">
				<svg class="map-loading-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
				</svg>
				<span class="map-loading-text">Carte interactive — participation 2020</span>
			</div>
		{/if}
	</div>
</section>

<!-- Featured Candidates -->
<section class="featured-section">
	<div class="container-app">
		<div class="section-header">
			<h2 class="section-title">Candidats à la une</h2>
			<p class="section-subtitle">Têtes de liste, des grandes villes aux communes</p>
		</div>

		<div class="featured-grid">
			{#if featuredLoading}
				{#each Array(CARD_COUNT) as _, i}
					<div class="card-skeleton" style="animation-delay: {i * 60}ms">
						<div class="skeleton-photo"></div>
						<div class="skeleton-line wide"></div>
						<div class="skeleton-line medium"></div>
						<div class="skeleton-line narrow"></div>
					</div>
				{/each}
			{:else}
				{#each featuredCandidates as candidate, i}
					<div class="card-stagger" style="animation-delay: {i * 80}ms">
						<a href="/elections/municipales-2026/{candidate.citySlug}" class="candidate-city-label">{candidate.cityName}</a>
						<CandidateCard
							{candidate}
							citySlug={candidate.citySlug}
							cityName={candidate.cityName}
						/>
					</div>
				{/each}
			{/if}
		</div>

		<div class="section-cta">
			<a href="/elections/municipales-2026" class="btn btn-primary">
				Voir toutes les villes
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
				</svg>
			</a>
		</div>
	</div>
</section>

<!-- Trust Signals -->
<section class="trust-section">
	<div class="container-app">
		<div class="trust-grid">
			<div class="trust-item">
				<svg class="trust-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
				</svg>
				<div>
					<span class="trust-title">IA transparente</span>
					<span class="trust-desc">Modèle, date et sources affichés</span>
				</div>
			</div>
			<div class="trust-item">
				<svg class="trust-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
				</svg>
				<div>
					<span class="trust-title">Code source ouvert</span>
					<span class="trust-desc">Vérifiable par tous sur GitHub</span>
				</div>
			</div>
			<div class="trust-item">
				<svg class="trust-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<span class="trust-title">Données ouvertes</span>
					<span class="trust-desc">34 968 communes, accès libre</span>
				</div>
			</div>
			<div class="trust-item">
				<svg class="trust-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<span class="trust-title">Sans but lucratif</span>
					<span class="trust-desc">Projet communautaire indépendant</span>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Key Facts -->
<section class="facts-section">
	<div class="container-app">
		<div class="section-header">
			<h2 class="section-title">Les municipales en chiffres</h2>
			<p class="section-subtitle">Comprendre l'enjeu du scrutin des 15 et 22 mars 2026</p>
		</div>

		<div class="facts-grid">
			<div class="fact-card">
				<span class="fact-number">34 968</span>
				<span class="fact-label">communes en France</span>
				<span class="fact-detail">Toutes passent au scrutin de liste paritaire en 2026</span>
			</div>
			<div class="fact-card">
				<span class="fact-number">74%</span>
				<span class="fact-label">sensibles à l'écologie</span>
				<span class="fact-detail">Des électeurs attentifs aux propositions environnementales</span>
			</div>
			<div class="fact-card">
				<span class="fact-number">41%</span>
				<span class="fact-label">priorité sécurité</span>
				<span class="fact-detail">Première préoccupation des électeurs pour leur commune</span>
			</div>
			<div class="fact-card">
				<span class="fact-number">58%</span>
				<span class="fact-label">maires se représentent</span>
				<span class="fact-detail">Mais 46% renoncent quand le conseil est conflictuel</span>
			</div>
		</div>

		<p class="facts-source">
			Sources : Institut Terram/Project Tempo, AMF/CEVIPOF 2025
		</p>
	</div>
</section>

<!-- Elections Overview -->
<section class="elections-section">
	<div class="container-app">
		<div class="section-header">
			<h2 class="section-title">Élections couvertes</h2>
			<p class="section-subtitle">Passées, en cours et à venir</p>
		</div>

		<div class="elections-grid">
			{#each data.elections as election}
				<a
					href="/elections/{election.slug}"
					class="election-card"
					class:active={election.status === 'upcoming'}
					class:past={election.status === 'past'}
					class:future={election.status === 'future'}
				>
					<div class="election-status">
						{#if election.status === 'upcoming'}
							<span class="status-badge upcoming">En cours</span>
						{:else if election.status === 'past'}
							<span class="status-badge past">Terminée</span>
						{:else}
							<span class="status-badge future">À venir</span>
						{/if}
					</div>

					<h3 class="election-name">{election.nameShort}</h3>

					<div class="election-date">
						{#if election.dates.round1}
							{new Date(election.dates.round1).toLocaleDateString('fr-FR', {
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							})}
						{/if}
					</div>

					{#if election.citiesCount}
						<div class="election-meta">
							{election.citiesCount} villes
						</div>
					{/if}

					<div class="election-country">
						{election.country === 'FR' ? '🇫🇷 France' : '🇪🇺 Europe'}
					</div>
				</a>
			{/each}
		</div>
	</div>
</section>

<!-- How it works -->
<section class="howto-section">
	<div class="container-app">
		<div class="section-header">
			<h2 class="section-title">Comment ça marche ?</h2>
		</div>

		<div class="howto-grid">
			<div class="howto-step">
				<div class="step-number">1</div>
				<h3 class="step-title">Trouvez votre ville</h3>
				<p class="step-desc">Recherchez parmi les 950 villes de plus de 10 000 habitants</p>
			</div>
			<div class="howto-step">
				<div class="step-number">2</div>
				<h3 class="step-title">Explorez les candidats</h3>
				<p class="step-desc">Découvrez les profils, parcours et programmes de chaque tête de liste</p>
			</div>
			<div class="howto-step">
				<div class="step-number">3</div>
				<h3 class="step-title">Comparez</h3>
				<p class="step-desc">Sélectionnez jusqu'à 4 candidats pour une comparaison détaillée</p>
			</div>
		</div>
	</div>
</section>

<CompareBar />

<style>
	/* ═══ Hero ═══ */
	.hero {
		position: relative;
		display: flex;
		align-items: center;
		padding: 1.5rem 0 2rem;
		overflow: hidden;
	}

	@media (min-width: 640px) {
		.hero { padding: 2rem 0 2.5rem; }
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, var(--color-cream) 0%, var(--color-cream-dark) 100%);
	}

	.hero-bg::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -20%;
		width: 80%;
		height: 150%;
		background: radial-gradient(ellipse at center, rgba(201, 169, 98, 0.08) 0%, transparent 70%);
	}

	.hero-content {
		max-width: 720px;
		margin: 0 auto;
		text-align: center;
	}

	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: rgba(201, 169, 98, 0.15);
		border: 1px solid rgba(201, 169, 98, 0.3);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.75rem;
	}

	@media (min-width: 640px) {
		.hero-badge {
			padding: 0.5rem 1rem;
			font-size: 0.85rem;
			margin-bottom: 1rem;
		}
	}

	.badge-dot {
		width: 8px;
		height: 8px;
		background: var(--color-success);
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.hero-title {
		font-family: var(--font-display);
		font-size: 2.25rem;
		font-weight: 700;
		line-height: 1.1;
		color: var(--color-foreground);
		margin-bottom: 0.75rem;
	}

	@media (min-width: 640px) {
		.hero-title { font-size: 3rem; margin-bottom: 1rem; }
	}

	@media (min-width: 1024px) {
		.hero-title { font-size: 3.5rem; }
	}

	.hero-subtitle {
		font-size: 0.95rem;
		color: var(--color-text-light);
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	@media (min-width: 640px) {
		.hero-subtitle { font-size: 1.05rem; margin-bottom: 1.25rem; }
	}

	/* Participation inline callout — early on mobile */
	.participation-inline {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		margin-bottom: 1rem;
		background: var(--color-navy);
		border-radius: var(--radius-full);
	}

	@media (min-width: 640px) {
		.participation-inline { margin-bottom: 1.25rem; }
	}

	.participation-inline-stat {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-gold);
		line-height: 1;
	}

	.participation-inline-text {
		font-size: 0.8rem;
		color: rgba(250, 248, 245, 0.85);
	}

	.hero-countdown {
		margin-bottom: 1rem;
	}

	@media (min-width: 640px) {
		.hero-countdown { margin-bottom: 1.25rem; }
	}

	.geo-suggestion {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		margin-bottom: 1rem;
		background: var(--color-gold);
		color: var(--color-navy);
		border-radius: var(--radius-full);
		font-size: 0.85rem;
		font-weight: 500;
		text-decoration: none;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		animation: geo-fade-in 0.5s ease-out;
	}

	.geo-suggestion:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(201, 169, 98, 0.3);
	}

	.geo-dismiss {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		margin-left: 0.25rem;
		background: rgba(10, 22, 40, 0.15);
		border: none;
		border-radius: 50%;
		color: var(--color-navy);
		font-size: 0.7rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.geo-dismiss:hover { background: rgba(10, 22, 40, 0.3); }

	@keyframes geo-fade-in {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.hero-search {
		display: flex;
		justify-content: center;
		margin-bottom: 1.25rem;
	}

	.hero-popular {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
	}

	.popular-label {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.popular-cities {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.popular-city {
		padding: 0.3rem 0.6rem;
		background: var(--color-card-bg);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		color: var(--color-foreground);
		transition: all 0.2s ease;
	}

	.popular-city:hover {
		background: var(--color-gold);
		border-color: var(--color-gold);
	}

	/* ═══ Map Showcase ═══ */
	.map-showcase {
		background: var(--color-cream-dark);
	}

	.map-showcase-header {
		padding: 1rem 0 0.75rem;
	}

	.map-showcase-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.map-showcase-title {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	@media (min-width: 640px) {
		.map-showcase-title { font-size: 1.3rem; }
	}

	.map-showcase-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-gold);
		text-decoration: none;
		white-space: nowrap;
		transition: color 0.2s ease;
	}

	.map-showcase-cta:hover { color: var(--color-coral); }

	.map-showcase-body {
		margin: 0 1rem 1rem;
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: 0 4px 24px rgba(10, 22, 40, 0.1);
	}

	@media (min-width: 640px) {
		.map-showcase-body {
			margin: 0 1.5rem 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.map-showcase-body {
			margin: 0 2rem 2rem;
			border-radius: var(--radius-xl);
		}
	}

	.map-loading {
		width: 100%;
		height: 300px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		background: var(--color-cream);
		position: relative;
		overflow: hidden;
	}

	@media (min-width: 640px) {
		.map-loading { height: 400px; }
	}

	@media (min-width: 1024px) {
		.map-loading { height: 500px; }
	}

	.map-loading-pulse {
		position: absolute;
		inset: 0;
		background: linear-gradient(110deg, transparent 30%, rgba(201, 169, 98, 0.06) 50%, transparent 70%);
		animation: map-shimmer 1.8s ease-in-out infinite;
	}

	@keyframes map-shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}

	.map-loading-icon {
		width: 32px;
		height: 32px;
		color: var(--color-text-muted);
		opacity: 0.5;
	}

	.map-loading-text {
		position: relative;
		z-index: 1;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	/* ═══ Sections shared ═══ */
	.featured-section,
	.elections-section,
	.howto-section {
		padding: 2rem 0;
	}

	@media (min-width: 640px) {
		.featured-section,
		.elections-section,
		.howto-section {
			padding: 3rem 0;
		}
	}

	.elections-section {
		background: var(--color-cream-dark);
	}

	.section-header {
		text-align: center;
		margin-bottom: 1.25rem;
	}

	@media (min-width: 640px) {
		.section-header { margin-bottom: 2rem; }
	}

	.section-title {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.25rem;
	}

	@media (min-width: 640px) {
		.section-title { font-size: 2rem; margin-bottom: 0.5rem; }
	}

	.section-subtitle {
		color: var(--color-text-light);
		font-size: 0.9rem;
	}

	/* ═══ Featured Grid ═══ */
	.featured-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
		justify-items: center;
	}

	@media (min-width: 640px) {
		.featured-grid { gap: 2rem; }
	}

	.card-skeleton {
		width: 100%;
		max-width: 340px;
		aspect-ratio: 3/4;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		animation: skeleton-fade-in 0.4s ease-out both;
	}

	@keyframes skeleton-fade-in {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.skeleton-photo {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: var(--color-cream-dark);
		margin: 0 auto;
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}

	.skeleton-line {
		height: 14px;
		border-radius: 7px;
		background: var(--color-cream-dark);
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}

	.skeleton-line.wide { width: 80%; margin: 0 auto; }
	.skeleton-line.medium { width: 60%; margin: 0 auto; }
	.skeleton-line.narrow { width: 40%; margin: 0 auto; }

	@keyframes skeleton-pulse {
		0%, 100% { opacity: 0.6; }
		50% { opacity: 1; }
	}

	.candidate-city-label {
		display: block;
		text-align: center;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-light);
		margin-bottom: 0.5rem;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.candidate-city-label:hover { color: var(--color-gold); }

	.section-cta {
		text-align: center;
		margin-top: 2.5rem;
	}

	/* ═══ Trust Signals ═══ */
	.trust-section {
		padding: 1.5rem 0;
		background: var(--color-cream-dark);
		border-top: 1px solid var(--color-card-border);
	}

	@media (min-width: 640px) {
		.trust-section { padding: 2rem 0; }
	}

	.trust-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.trust-grid {
			grid-template-columns: repeat(4, 1fr);
			gap: 1.5rem;
		}
	}

	.trust-item {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
	}

	.trust-icon {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
		color: var(--color-gold);
		margin-top: 0.1rem;
	}

	.trust-title {
		display: block;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-foreground);
		line-height: 1.2;
	}

	.trust-desc {
		display: block;
		font-size: 0.72rem;
		color: var(--color-text-light);
		line-height: 1.3;
		margin-top: 0.1rem;
	}

	/* ═══ Elections Grid ═══ */
	.elections-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.election-card {
		padding: 1.5rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.election-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-card-hover);
	}

	.election-card.active { border: 2px solid var(--color-gold); }
	.election-card.past { background: var(--color-cream-dark); }
	.election-card.future { background: var(--color-cream-dark); }

	.election-status { display: flex; }

	.status-badge {
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 700;
		border-radius: var(--radius-full);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-badge.upcoming { background: var(--color-gold); color: var(--color-navy); }
	.status-badge.past { background: var(--color-cream-dark); color: var(--color-text); }
	.status-badge.future { background: var(--color-navy-light); color: #faf8f5; }

	.election-name {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.election-date { font-size: 0.9rem; color: var(--color-text); }
	.election-meta { font-size: 0.85rem; color: var(--color-text-light); }
	.election-country { font-size: 0.85rem; color: var(--color-text-light); margin-top: auto; }

	/* ═══ Key Facts ═══ */
	.facts-section {
		background: var(--color-navy);
		color: #faf8f5;
		padding: 2rem 0;
	}

	@media (min-width: 640px) {
		.facts-section { padding: 3.5rem 0; }
	}

	.facts-section .section-title { color: #faf8f5; }
	.facts-section .section-subtitle { color: var(--color-text-light); }

	.facts-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.facts-grid { grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
	}

	.fact-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 1.25rem 0.75rem;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(201, 169, 98, 0.2);
		border-radius: var(--radius-lg);
		transition: border-color 0.3s ease;
	}

	.fact-card:hover { border-color: var(--color-gold); }

	.fact-number {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-gold);
		line-height: 1;
		margin-bottom: 0.25rem;
	}

	@media (min-width: 640px) {
		.fact-number { font-size: 2.5rem; }
	}

	.fact-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #faf8f5;
		margin-bottom: 0.375rem;
	}

	.fact-detail {
		font-size: 0.75rem;
		color: var(--color-text-light);
		line-height: 1.3;
	}

	.facts-source {
		text-align: center;
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
		margin-top: 1rem;
	}

	/* ═══ How To ═══ */
	.howto-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
	}

	.howto-step {
		text-align: center;
		padding: 1.5rem;
	}

	.step-number {
		width: 48px;
		height: 48px;
		margin: 0 auto 1rem;
		background: var(--color-gold);
		color: var(--color-foreground);
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.step-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.5rem;
	}

	.step-desc {
		color: var(--color-text-light);
		font-size: 0.95rem;
	}
</style>
