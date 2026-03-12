<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import CitySearch from '$lib/components/CitySearch.svelte';
	import SeoMeta from '$lib/components/SeoMeta.svelte';

	let { data }: { data: PageData } = $props();

	// Filter state - initialized from URL params
	let selectedRegion = $state<string | null>(null);
	let selectedDepartment = $state<string | null>(null);
	let sortBy = $state<'name' | 'population' | 'candidates'>('population');

	// Initialize from URL on mount
	onMount(() => {
		const params = $page.url.searchParams;
		const regionParam = params.get('region');
		const deptParam = params.get('dept');

		if (regionParam && data.regions.some(r => r.slug === regionParam)) {
			selectedRegion = regionParam;
		}
		if (deptParam && data.departments[deptParam]) {
			selectedDepartment = deptParam;
		}
	});

	// Update URL to reflect filter state
	function updateUrl(region: string | null, dept: string | null) {
		const params = new URLSearchParams();
		if (region) params.set('region', region);
		if (dept) params.set('dept', dept);
		const queryString = params.toString();
		const newUrl = queryString ? `?${queryString}` : $page.url.pathname;
		goto(newUrl, { replaceState: true, keepFocus: true, noScroll: true });
	}

	// Get region slug from city region name
	function getRegionSlug(regionName: string): string {
		const found = data.regions.find(r => r.name === regionName);
		return found?.slug || '';
	}

	// Get departments for selected region
	let availableDepartments = $derived(() => {
		if (!selectedRegion) return [];
		const region = data.regions.find(r => r.slug === selectedRegion);
		if (!region) return [];
		return region.departments
			.filter(d => data.departments[d])
			.map(d => ({ code: d, name: data.departments[d].name }))
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	// Filtered and sorted cities
	let filteredCities = $derived(() => {
		let cities = [...data.cities];

		// Filter by region
		if (selectedRegion) {
			const region = data.regions.find(r => r.slug === selectedRegion);
			if (region) {
				cities = cities.filter(c => region.departments.includes(c.department));
			}
		}

		// Filter by department
		if (selectedDepartment) {
			cities = cities.filter(c => c.department === selectedDepartment);
		}

		// Sort
		switch (sortBy) {
			case 'name':
				cities.sort((a, b) => a.name.localeCompare(b.name));
				break;
			case 'candidates':
				cities.sort((a, b) => b.candidatesCount - a.candidatesCount);
				break;
			case 'population':
			default:
				cities.sort((a, b) => b.population - a.population);
		}

		return cities;
	});

	// Group cities by region for overview
	let citiesByRegion = $derived(() => {
		const grouped: Record<string, typeof data.cities> = {};
		for (const city of data.cities) {
			const regionSlug = getRegionSlug(city.region);
			if (!grouped[regionSlug]) grouped[regionSlug] = [];
			grouped[regionSlug].push(city);
		}
		return grouped;
	});

	// Regions with city counts
	let regionsWithCounts = $derived(() => {
		return data.regions
			.map(r => ({
				...r,
				cityCount: citiesByRegion()[r.slug]?.length || 0,
				totalPopulation: citiesByRegion()[r.slug]?.reduce((sum, c) => sum + c.population, 0) || 0
			}))
			.filter(r => r.cityCount > 0)
			.sort((a, b) => b.totalPopulation - a.totalPopulation);
	});

	function selectRegion(slug: string | null) {
		selectedRegion = slug;
		selectedDepartment = null;
		updateUrl(slug, null);
	}

	function selectDepartment(code: string | null) {
		selectedDepartment = code;
		updateUrl(selectedRegion, code);
	}

	// Pagination: show cities in batches to avoid rendering 34K DOM nodes
	const PAGE_SIZE = 100;
	let displayLimit = $state(PAGE_SIZE);

	// Reset display limit when filters change
	$effect(() => {
		// Track filter deps so limit resets on change
		selectedRegion;
		selectedDepartment;
		sortBy;
		displayLimit = PAGE_SIZE;
	});

	let displayedCities = $derived(filteredCities().slice(0, displayLimit));
	let hasMore = $derived(filteredCities().length > displayLimit);

	function formatPopulation(n: number): string {
		if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
		if (n >= 1000) return `${Math.round(n / 1000)}k`;
		return n.toString();
	}
</script>

<svelte:head>
	{#if data.election}
		{@const isUpcoming = data.election.slug.includes('2026')}
		{@const hubDesc = isUpcoming
			? `Élections municipales 2026 : comparez les candidats et programmes dans ${data.cities.length.toLocaleString('fr-FR')} communes. Listes officielles, statistiques INSEE, finances municipales, projections climatiques et participation.`
			: `Résultats des ${data.election.name}. ${data.cities.length} villes couvertes — participation, élus, composition des conseils municipaux.`}
		<title>{data.election.name} — candidats, programmes et statistiques | maire.app</title>
		<meta name="description" content={hubDesc} />
		<SeoMeta
			title="{data.election.name} — candidats, programmes et statistiques | maire.app"
			description={hubDesc}
			path="/elections/{data.election.slug}"
		/>
		{@html `<script type="application/ld+json">${JSON.stringify({
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			"name": data.election.name,
			"url": `https://maire.app/elections/${data.election.slug}`,
			"description": hubDesc,
			"inLanguage": "fr",
			"isPartOf": { "@type": "WebSite", "@id": "https://maire.app" },
			"mainEntity": {
				"@type": "ItemList",
				"name": `Communes — ${data.election.name}`,
				"numberOfItems": data.cities.length,
				"itemListElement": data.cities.slice(0, 20).map((c: {name: string; slug: string}, i: number) => ({
					"@type": "ListItem",
					"position": i + 1,
					"name": c.name,
					"url": `https://maire.app/elections/${data.election.slug}/${c.slug}`
				}))
			}
		})}</script>`}
	{:else}
		<title>Élection non trouvée | maire.app</title>
	{/if}
</svelte:head>

{#if data.election}
	<!-- Compact Header -->
	<section class="page-header">
		<div class="container-app">
			<div class="header-row">
				<div class="header-main">
					<a href="/elections" class="back-link" aria-label="Retour aux élections">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</a>
					<h1 class="page-title">{data.election.nameShort} — candidats et programmes</h1>
				</div>
				<div class="header-meta">
					<span class="meta-date">
						{new Date(data.election.dates.round1).toLocaleDateString('fr-FR', {
							day: 'numeric',
							month: 'short'
						})}
					</span>
					<span class="meta-count">{data.cities.length} villes</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Filter Bar -->
	<section class="filter-section">
		<div class="container-app">
			<div class="filter-bar">
				<!-- Search -->
				<div class="search-box">
					<CitySearch cities={data.cities} electionSlug={data.election.slug} compact />
				</div>

				<!-- Region Filter -->
				<div class="filter-group">
					<select
						value={selectedRegion}
						onchange={(e) => selectRegion(e.currentTarget.value || null)}
						class="filter-select"
					>
						<option value="">Toutes les régions</option>
						{#each regionsWithCounts() as region}
							<option value={region.slug}>
								{region.name} ({region.cityCount})
							</option>
						{/each}
					</select>
				</div>

				<!-- Department Filter -->
				{#if selectedRegion && availableDepartments().length > 0}
					<div class="filter-group">
						<select
							value={selectedDepartment}
							onchange={(e) => selectDepartment(e.currentTarget.value || null)}
							class="filter-select"
						>
							<option value="">Tous les départements</option>
							{#each availableDepartments() as dept}
								<option value={dept.code}>{dept.code} - {dept.name}</option>
							{/each}
						</select>
					</div>
				{/if}

				<!-- Sort -->
				<select bind:value={sortBy} class="filter-select sort-select">
					<option value="population">Pop.</option>
					<option value="name">A-Z</option>
					<option value="candidates">Candidats</option>
				</select>
			</div>

			<!-- Active Filters -->
			{#if selectedRegion || selectedDepartment}
				<div class="active-filters">
					{#if selectedRegion}
						{@const region = data.regions.find(r => r.slug === selectedRegion)}
						<button class="filter-chip" onclick={() => selectRegion(null)}>
							{region?.name}
							<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
					{#if selectedDepartment}
						<button class="filter-chip" onclick={() => selectDepartment(null)}>
							{data.departments[selectedDepartment]?.name}
							<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
					<span class="filter-count">{filteredCities().length} villes</span>
				</div>
			{/if}
		</div>
	</section>

	<!-- Regions Overview (when no filter selected) -->
	{#if !selectedRegion}
		<section class="regions-section">
			<div class="container-app">
				<h2 class="section-title-compact">Par région</h2>
				<div class="regions-grid">
					{#each regionsWithCounts() as region}
						<button
							class="region-card"
							onclick={() => selectRegion(region.slug)}
						>
							<span class="region-name">{region.name}</span>
							<span class="region-stats">
								{region.cityCount} ville{region.cityCount > 1 ? 's' : ''} · {formatPopulation(region.totalPopulation)} hab.
							</span>
						</button>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- Cities List -->
	<section class="cities-section">
		<div class="container-app">
			{#if selectedRegion}
				<h2 class="section-title-compact">
					{filteredCities().length} ville{filteredCities().length > 1 ? 's' : ''}
					{#if selectedDepartment}
						dans {data.departments[selectedDepartment]?.name}
					{:else}
						{@const region = data.regions.find(r => r.slug === selectedRegion)}
						en {region?.name}
					{/if}
				</h2>
			{:else}
				<h2 class="section-title-compact">Toutes les villes</h2>
			{/if}

			<div class="cities-list">
				{#each displayedCities as city, i (city.slug)}
					<a
						href="/elections/{data.election.slug}/{city.slug}"
						class="city-row"
					>
						<div class="city-info">
							<span class="city-name">{city.name}</span>
							<span class="city-dept">{city.department} · {city.region}</span>
						</div>
						<div class="city-pop">{formatPopulation(city.population)}</div>
						<div class="city-stats-mini">
							{#if city.listsCount > 0}
								<span>{city.listsCount} listes</span>
							{/if}
							{#if city.candidatesCount > 0}
								<span>{city.candidatesCount} cand.</span>
							{/if}
						</div>
						{#if city.incumbent}
							<div class="city-incumbent-mini">
								{city.incumbent.name}
								<span class="party">({city.incumbent.party})</span>
							</div>
						{/if}
						<svg class="city-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
				{/each}
			</div>

			{#if hasMore}
				<div class="load-more">
					<button
						class="load-more-btn"
						onclick={() => displayLimit += PAGE_SIZE}
					>
						Voir plus de villes ({filteredCities().length - displayLimit} restantes)
					</button>
				</div>
			{/if}

			{#if filteredCities().length === 0}
				<div class="no-results">
					<p>Aucune ville trouvée</p>
				</div>
			{/if}
		</div>
	</section>
{:else}
	<section class="error-section">
		<div class="container-app">
			<div class="error-content">
				<h1>Élection non trouvée</h1>
				<p>{data.error}</p>
				<a href="/elections" class="btn btn-primary">Voir toutes les élections</a>
			</div>
		</div>
	</section>
{/if}

<style>
	/* Compact Header */
	.page-header {
		background: var(--color-navy);
		padding: 0.75rem 0;
	}

	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.header-main {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.back-link {
		color: var(--color-text-light);
		display: flex;
		padding: 0.25rem;
	}

	.back-link:hover {
		color: var(--color-gold);
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		color: #faf8f5;
		margin: 0;
	}

	@media (min-width: 640px) {
		.page-title {
			font-size: 1.5rem;
		}
	}

	.header-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.8rem;
		color: var(--color-text-light);
	}

	.meta-date {
		padding: 0.25rem 0.5rem;
		background: rgba(201, 169, 98, 0.2);
		border-radius: var(--radius-sm);
		color: var(--color-gold);
		font-weight: 600;
	}

	/* Filter Section */
	.filter-section {
		background: var(--color-cream-dark);
		padding: 0.75rem 0;
		position: sticky;
		top: 48px;
		z-index: 40;
		border-bottom: 1px solid var(--color-card-border);
	}

	@media (min-width: 768px) {
		.filter-section {
			top: 52px;
		}
	}

	.filter-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.search-box {
		flex: 1;
		min-width: 150px;
		max-width: 280px;
	}

	.filter-group {
		flex-shrink: 0;
	}

	.filter-select {
		padding: 0.5rem 0.75rem;
		background: var(--color-card-bg);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		color: var(--color-text);
		min-height: 36px;
		cursor: pointer;
	}

	.sort-select {
		width: 80px;
		margin-left: auto;
	}

	.active-filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.filter-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		background: var(--color-navy);
		color: #faf8f5;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: var(--radius-full);
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.filter-chip:hover {
		background: var(--color-coral);
	}

	.filter-count {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-left: auto;
	}

	/* Regions Grid */
	.regions-section {
		padding: 1rem 0;
		border-bottom: 1px solid var(--color-card-border);
	}

	.section-title-compact {
		font-family: var(--font-display);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
	}

	.regions-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.region-card {
		padding: 0.5rem 0.75rem;
		background: var(--color-card-bg);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
	}

	.region-card:hover {
		border-color: var(--color-gold);
		background: rgba(201, 169, 98, 0.05);
	}

	.region-name {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.region-stats {
		display: block;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		margin-top: 0.125rem;
	}

	/* Cities List */
	.cities-section {
		padding: 1rem 0 2rem;
	}

	.cities-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.city-row {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 0.75rem;
		align-items: center;
		padding: 0.625rem 0.75rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		transition: all 0.15s ease;
	}

	.city-row:hover {
		border-color: var(--color-gold);
		background: rgba(201, 169, 98, 0.03);
	}

	@media (min-width: 640px) {
		.city-row {
			grid-template-columns: 1fr 80px 120px 150px 24px;
			padding: 0.75rem 1rem;
		}
	}

	.city-info {
		min-width: 0;
	}

	.city-name {
		display: block;
		font-weight: 600;
		color: var(--color-foreground);
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.city-dept {
		display: block;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.city-pop {
		font-family: var(--font-display);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-foreground);
		text-align: right;
	}

	.city-stats-mini {
		display: none;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--color-text-light);
	}

	@media (min-width: 640px) {
		.city-stats-mini {
			display: flex;
		}
	}

	.city-incumbent-mini {
		display: none;
		font-size: 0.75rem;
		color: var(--color-text-light);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.city-incumbent-mini .party {
		color: var(--color-text-muted);
	}

	@media (min-width: 640px) {
		.city-incumbent-mini {
			display: block;
		}
	}

	.city-arrow {
		width: 16px;
		height: 16px;
		color: var(--color-gold);
		flex-shrink: 0;
	}

	@media (max-width: 639px) {
		.city-arrow {
			display: none;
		}
	}

	.load-more {
		text-align: center;
		padding: 1.5rem;
	}
	.load-more-btn {
		background: var(--color-gold);
		color: var(--color-navy);
		border: none;
		padding: 0.75rem 2rem;
		border-radius: 9999px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.2s;
	}
	.load-more-btn:hover {
		background: var(--color-gold-light);
	}

	.no-results {
		text-align: center;
		padding: 2rem;
		color: var(--color-text-light);
	}

	/* Error */
	.error-section {
		min-height: 50vh;
		display: flex;
		align-items: center;
	}

	.error-content {
		text-align: center;
		max-width: 400px;
		margin: 0 auto;
	}

	.error-content h1 {
		font-family: var(--font-display);
		font-size: 2rem;
		color: var(--color-foreground);
		margin-bottom: 1rem;
	}

	.error-content p {
		color: var(--color-text-light);
		margin-bottom: 2rem;
	}
</style>
