<script lang="ts">
	import type { CoverageData } from './+page';
	import SeoMeta from '$lib/components/SeoMeta.svelte';

	let { data } = $props();
	let cov: CoverageData = $derived(data.coverage);

	const PAGE_SIZE = 50;
	let currentPage = $state(0);
	let totalPages = $derived(Math.ceil(cov.enrichedCities.length / PAGE_SIZE));

	// Lazy-loaded full city list (fetched on demand to avoid 3MB+ page payload)
	const ALL_PAGE_SIZE = 100;
	let allCurrentPage = $state(0);
	let allCities = $state<Array<{ slug: string; name: string; department: string; population: number; incumbent?: { name: string; party: string } }>>([]);
	let allTotalPages = $derived(Math.ceil(allCities.length / ALL_PAGE_SIZE));
	let allPageCities = $derived(allCities.slice(allCurrentPage * ALL_PAGE_SIZE, (allCurrentPage + 1) * ALL_PAGE_SIZE));
	let allListOpen = $state(false);
	let allListLoading = $state(false);

	async function openAllCities() {
		allListOpen = !allListOpen;
		if (allListOpen && allCities.length === 0) {
			allListLoading = true;
			try {
				const res = await fetch('/data/municipales-2026/cities.json');
				const idx = await res.json();
				allCities = (idx.cities || []).sort((a: { population?: number }, b: { population?: number }) => (b.population || 0) - (a.population || 0));
			} finally {
				allListLoading = false;
			}
		}
	}

	function chunk<T>(arr: T[], size: number): T[][] {
		const pages: T[][] = [];
		for (let i = 0; i < arr.length; i += size) {
			pages.push(arr.slice(i, i + size));
		}
		return pages;
	}

	let cityPages = $derived(chunk(cov.enrichedCities, PAGE_SIZE));

	const PARTY_LABELS: Record<string, string> = {
		SOC: 'Parti Socialiste',
		DVG: 'Divers gauche',
		VEC: 'Écologistes',
		ECO: 'Écologistes',
		DVD: 'Divers droite',
		DVC: 'Divers centre',
		HOR: 'Horizons',
		PS: 'Parti Socialiste'
	};

	function partyLabel(code: string): string {
		return PARTY_LABELS[code] || code;
	}

	function formatPop(n: number): string {
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
		if (n >= 1_000) return Math.round(n / 1_000) + ' k';
		return n.toString();
	}

	function goToPage(page: number) {
		currentPage = Math.max(0, Math.min(page, totalPages - 1));
	}
</script>

<svelte:head>
	<title>Couverture | maire.app</title>
	<meta
		name="description"
		content="Couverture de maire.app : {cov.enrichedTotal} villes analysées sur {cov.citiesOver1000.toLocaleString('fr-FR')} communes de plus de 1 000 habitants."
	/>
	<SeoMeta
		title="Couverture | maire.app"
		description="Couverture de maire.app : {cov.enrichedTotal} villes analysées sur {cov.citiesOver1000.toLocaleString('fr-FR')} communes."
		path="/couverture"
	/>
</svelte:head>

<section class="page-header">
	<div class="container-app">
		<h1 class="page-title">Couverture de maire.app</h1>
		<p class="page-subtitle">
			Transparence totale sur notre couverture — {cov.enrichedTotal} villes analysées, {cov.totalCities.toLocaleString('fr-FR')}
			communes indexées
		</p>
	</div>
</section>

<section class="cov-section">
	<div class="container-app">
		<div class="cov-content">
			<!-- Stat cards -->
			<div class="stat-cards">
				<div class="stat-card stat-card--gold">
					<span class="stat-value">{cov.enrichedTotal}</span>
					<span class="stat-label">villes analysées</span>
					<span class="stat-detail">fiches détaillées</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{cov.researchPopulationPct}%</span>
					<span class="stat-label">population couverte</span>
					<span class="stat-detail">{formatPop(cov.researchPopulation)} hab. analysés</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{cov.citiesOver1000.toLocaleString('fr-FR')}</span>
					<span class="stat-label">communes &gt; 1 000 hab.</span>
					<span class="stat-detail">objectif de couverture</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{cov.totalCities.toLocaleString('fr-FR')}</span>
					<span class="stat-label">communes indexées</span>
					<span class="stat-detail">INSEE, climat, dette</span>
				</div>
			</div>

			<!-- Progress -->
			<div class="cov-card">
				<h2>Progression de l'analyse</h2>
				<p>
					Couverture des {cov.citiesOver1000.toLocaleString('fr-FR')} communes de plus de 1 000 habitants en France.
				</p>

				<!-- Research progress (full research with candidates) -->
				<div class="progress-row">
					<span class="progress-row-label">Recherches complètes</span>
					<div class="progress-bar">
						<div
							class="progress-fill progress-fill--research"
							style="width: {Math.min((cov.researchCount / cov.citiesOver1000) * 100, 100)}%"
						></div>
					</div>
					<span class="progress-row-value">{cov.researchCount} / {cov.citiesOver1000.toLocaleString('fr-FR')} ({cov.researchPct}%)</span>
				</div>

				<!-- Analysis progress (all enriched cities) -->
				<div class="progress-row">
					<span class="progress-row-label">Villes analysées</span>
					<div class="progress-bar">
						<div
							class="progress-fill progress-fill--analysis"
							style="width: {Math.min((cov.enrichedTotal / cov.citiesOver1000) * 100, 100)}%"
						></div>
					</div>
					<span class="progress-row-value">{cov.enrichedTotal} / {cov.citiesOver1000.toLocaleString('fr-FR')} ({cov.analysisPct}%)</span>
				</div>

				<!-- Tier breakdown -->
				<div class="tier-breakdown">
					<div class="tier-bar">
						<div
							class="tier-segment tier-segment--research"
							style="width: {(cov.researchCount / cov.citiesOver1000) * 100}%"
							title="{cov.researchCount} recherches complètes"
						></div>
						<div
							class="tier-segment tier-segment--analysis"
							style="width: {(cov.analysisCount / cov.citiesOver1000) * 100}%"
							title="{cov.analysisCount} villes analysées"
						></div>
					</div>
					<div class="tier-legend">
						<span class="tier-legend-item"><span class="tier-dot tier-dot--research"></span> Recherches complètes ({cov.researchCount})</span>
						<span class="tier-legend-item"><span class="tier-dot tier-dot--analysis"></span> Analyses ({cov.analysisCount})</span>
						<span class="tier-legend-item"><span class="tier-dot tier-dot--baseline"></span> Non couvertes ({(cov.citiesOver1000 - cov.enrichedTotal).toLocaleString('fr-FR')})</span>
					</div>
				</div>
			</div>

			<!-- All enriched cities with pagination -->
			<div class="cov-card">
				<h2>Villes avec fiche détaillée ({cov.enrichedTotal})</h2>
				<p>
					Ces villes disposent d'une fiche enrichie : contexte politique, maires sortants et enjeux locaux.
				</p>

				{#each cityPages as page, pageIdx}
					<div class="city-page" class:city-page--active={pageIdx === currentPage}>
						<div class="city-list">
							{#each page as city}
								<a href="/elections/municipales-2026/{city.slug}" class="city-item">
									<span class="city-item-name">
										{city.name}
										{#if city.dataTier === 'research'}
											<span class="city-item-tier">recherche</span>
										{/if}
									</span>
									<span class="city-item-dept">{city.department}</span>
									<span class="city-item-pop">{city.population.toLocaleString('fr-FR')} hab.</span>
									{#if city.incumbent}
										<span class="city-item-mayor">{city.incumbent.name}</span>
									{:else}
										<span class="city-item-mayor">—</span>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				{/each}

				{#if totalPages > 1}
					<div class="pagination">
						<button class="pagination-btn" disabled={currentPage === 0} onclick={() => goToPage(currentPage - 1)}>
							Précédent
						</button>
						<div class="pagination-pages">
							{#each Array(totalPages) as _, i}
								{#if i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 2}
									<button
										class="pagination-page"
										class:pagination-page--active={i === currentPage}
										onclick={() => goToPage(i)}
									>
										{i + 1}
									</button>
								{:else if i === 1 || i === totalPages - 2}
									<span class="pagination-ellipsis">...</span>
								{/if}
							{/each}
						</div>
						<button class="pagination-btn" disabled={currentPage === totalPages - 1} onclick={() => goToPage(currentPage + 1)}>
							Suivant
						</button>
					</div>
				{/if}
			</div>

			<!-- Stats overview -->
			<div class="cov-card">
				<h2>En un coup d'oeil</h2>
				<div class="insights-grid">
					<div class="insight">
						<span class="insight-value">{cov.enrichedTotal}</span>
						<span class="insight-label">fiches détaillées</span>
					</div>
					<div class="insight">
						<span class="insight-value">{cov.totalCities.toLocaleString('fr-FR')}</span>
						<span class="insight-label">communes indexées</span>
					</div>
					<div class="insight">
						<span class="insight-value">{cov.regionsCount}</span>
						<span class="insight-label">régions couvertes</span>
					</div>
					<div class="insight">
						<span class="insight-value">{cov.departmentsCount}</span>
						<span class="insight-label">départements</span>
					</div>
					<div class="insight">
						<span class="insight-value">{cov.uniqueParties}</span>
						<span class="insight-label">étiquettes politiques</span>
					</div>
					<div class="insight">
						<span class="insight-value">{cov.historicalCities.toLocaleString('fr-FR')}</span>
						<span class="insight-label">villes avec résultats 2020</span>
					</div>
				</div>
			</div>

			<!-- Regions -->
			<div class="cov-card">
				<h2>Par région</h2>
				<div class="region-grid">
					{#each cov.regions as region}
						<div class="region-item">
							<div class="region-header">
								<span class="region-name">{region.name}</span>
								<span class="region-count"
									>{region.cities.toLocaleString('fr-FR')} commune{region.cities > 1 ? 's' : ''}</span
								>
							</div>
							<div class="region-bar-bg">
								<div
									class="region-bar"
									style="width: {(region.cities / Math.max(...cov.regions.map((r) => r.cities))) * 100}%"
								></div>
							</div>
							<span class="region-pop">{formatPop(region.population)} hab.</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Political landscape -->
			{#if cov.parties.length > 0}
				<div class="cov-card">
					<h2>Paysage politique</h2>
					<p class="disclaimer">
						Répartition factuelle des étiquettes politiques des maires sortants. Aucun jugement ni recommandation.
					</p>
					<div class="party-chart">
						{#each cov.parties as p}
							<div class="party-row">
								<span class="party-label" title={partyLabel(p.party)}>{p.party}</span>
								<div class="party-bar-bg">
									<div class="party-bar" style="width: {(p.count / cov.parties[0].count) * 100}%"></div>
								</div>
								<span class="party-count">{p.count}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Full communes table (paginated, first page SSR for SEO) -->
			<div class="cov-card">
				<button class="full-list-summary" onclick={openAllCities}>
					{allListOpen ? 'Masquer' : 'Voir'} les {cov.totalCities.toLocaleString('fr-FR')} communes (données INSEE)
					<svg class="summary-chevron" class:open={allListOpen} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if allListOpen}
					<div class="all-cities-paginated">
						{#if allListLoading}
							<p class="loading-text">Chargement des communes...</p>
						{:else}
						<div class="all-cities-header">
							<span class="all-cities-showing">
								{(allCurrentPage * ALL_PAGE_SIZE + 1).toLocaleString('fr-FR')}–{Math.min((allCurrentPage + 1) * ALL_PAGE_SIZE, allCities.length).toLocaleString('fr-FR')} sur {allCities.length.toLocaleString('fr-FR')}
							</span>
						</div>
						<div class="table-wrapper">
							<table class="cities-table">
								<thead>
									<tr>
										<th>Ville</th>
										<th>Dép.</th>
										<th>Population</th>
										<th>Maire sortant</th>
									</tr>
								</thead>
								<tbody>
									{#each allPageCities as city}
										<tr>
											<td>
												<a href="/elections/municipales-2026/{city.slug}">{city.name}</a>
											</td>
											<td>{city.department}</td>
											<td class="num">{city.population.toLocaleString('fr-FR')}</td>
											<td>
												{#if city.incumbent}
													{city.incumbent.name}
													<span class="party-tag">{city.incumbent.party}</span>
												{:else}
													—
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						{#if allTotalPages > 1}
							<div class="pagination">
								<button class="pagination-btn" disabled={allCurrentPage === 0} onclick={() => allCurrentPage = Math.max(0, allCurrentPage - 1)}>
									Précédent
								</button>
								<div class="pagination-pages">
									{#each Array(allTotalPages) as _, i}
										{#if i === 0 || i === allTotalPages - 1 || Math.abs(i - allCurrentPage) <= 2}
											<button
												class="pagination-page"
												class:pagination-page--active={i === allCurrentPage}
												onclick={() => allCurrentPage = i}
											>
												{i + 1}
											</button>
										{:else if (i === 1 && allCurrentPage > 3) || (i === allTotalPages - 2 && allCurrentPage < allTotalPages - 4)}
											<span class="pagination-ellipsis">...</span>
										{/if}
									{/each}
								</div>
								<button class="pagination-btn" disabled={allCurrentPage === allTotalPages - 1} onclick={() => allCurrentPage = Math.min(allTotalPages - 1, allCurrentPage + 1)}>
									Suivant
								</button>
							</div>
						{/if}
					{/if}
					</div>
				{/if}

				<!-- SEO: top 200 cities as hidden links (crawlable but not displayed) -->
				<nav class="seo-city-links" aria-label="Toutes les communes">
					{#each cov.topCities as city}
						<a href="/elections/municipales-2026/{city.slug}">{city.name}</a>
					{/each}
				</nav>
			</div>

			<p class="last-updated">
				Dernière mise à jour : {new Date(cov.lastUpdated).toLocaleDateString('fr-FR', {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				})}
			</p>
		</div>
	</div>
</section>

<!-- Cross-links -->
<section class="crosslinks-section">
	<div class="container-app">
		<div class="crosslinks-grid">
			<a href="/gouvernance" class="crosslink-card">
				<h3>Gouvernance municipale</h3>
				<p>Comment fonctionne une mairie, le scrutin et les listes électorales</p>
			</a>
			<a href="/elections/municipales-2026" class="crosslink-card">
				<h3>Municipales 2026</h3>
				<p>Découvrez les candidats et enjeux dans votre ville</p>
			</a>
			<a href="/corrections/stats" class="crosslink-card">
				<h3>Statistiques de vérification</h3>
				<p>Sources vérifiées, taux de confirmation et corrections</p>
			</a>
		</div>
	</div>
</section>

<style>
	.cov-section {
		padding: 3rem 0 4rem;
		background: var(--color-cream);
	}

	.cov-content {
		max-width: 900px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Stat cards */
	.stat-cards {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}

	@media (max-width: 640px) {
		.stat-cards {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.stat-card {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		padding: 1.5rem;
		text-align: center;
	}

	.stat-card--gold {
		border: 2px solid var(--color-gold);
	}

	.stat-value {
		display: block;
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-gold-dark);
	}

	.stat-label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-top: 0.25rem;
	}

	.stat-detail {
		display: block;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}

	/* Cards */
	.cov-card {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		padding: 2rem;
	}

	.cov-card h2 {
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.75rem;
	}

	.cov-card > p {
		font-size: 0.9rem;
		color: var(--color-text);
		line-height: 1.6;
		margin: 0 0 1rem;
	}

	.disclaimer {
		font-size: 0.8rem !important;
		color: var(--color-text-muted) !important;
		font-style: italic;
	}

	/* Progress rows */
	.progress-row {
		display: grid;
		grid-template-columns: 160px 1fr 200px;
		gap: 0.75rem;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.progress-row-label {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.progress-row-value {
		font-size: 0.78rem;
		color: var(--color-text-light);
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 640px) {
		.progress-row {
			grid-template-columns: 1fr;
			gap: 0.25rem;
		}
		.progress-row-value {
			text-align: left;
		}
	}

	.progress-bar {
		height: 16px;
		background: var(--color-cream-dark);
		border-radius: 8px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 8px;
		transition: width 0.8s ease;
	}

	.progress-fill--research {
		background: linear-gradient(90deg, var(--color-gold), var(--color-gold-light));
	}

	.progress-fill--analysis {
		background: linear-gradient(90deg, var(--color-navy-light), var(--color-navy));
	}

	/* Tier breakdown bar */
	.tier-breakdown {
		margin-top: 1rem;
	}

	.tier-bar {
		display: flex;
		height: 10px;
		border-radius: 5px;
		overflow: hidden;
		background: var(--color-cream-dark);
	}

	.tier-segment {
		height: 100%;
		min-width: 2px;
	}

	.tier-segment--research {
		background: var(--color-gold);
	}

	.tier-segment--analysis {
		background: var(--color-navy-light);
	}

	.tier-legend {
		display: flex;
		gap: 1.25rem;
		margin-top: 0.5rem;
		flex-wrap: wrap;
	}

	.tier-legend-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: var(--color-text-light);
	}

	.tier-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.tier-dot--research {
		background: var(--color-gold);
	}

	.tier-dot--analysis {
		background: var(--color-navy-light);
	}

	.tier-dot--baseline {
		background: var(--color-cream-dark);
		border: 1px solid var(--color-text-muted);
	}

	/* City paginated list */
	.city-page {
		display: none;
	}

	.city-page--active {
		display: block;
	}

	.city-list {
		display: flex;
		flex-direction: column;
	}

	.city-item {
		display: grid;
		grid-template-columns: 1fr 50px 110px 1fr;
		gap: 0.5rem;
		align-items: center;
		padding: 0.6rem 0.75rem;
		text-decoration: none !important;
		border-bottom: 1px solid var(--color-cream-dark);
		transition: background 0.1s ease;
	}

	.city-item:hover {
		background: var(--color-cream);
	}

	.city-item-name {
		font-weight: 600;
		color: var(--color-foreground);
		font-size: 0.88rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.city-item-tier {
		display: inline-block;
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 0.1rem 0.35rem;
		background: rgba(201, 169, 98, 0.15);
		color: var(--color-gold-dark);
		border-radius: 3px;
	}

	.city-item-dept {
		font-size: 0.78rem;
		color: var(--color-text-light);
		text-align: center;
	}

	.city-item-pop {
		font-size: 0.8rem;
		color: var(--color-text-light);
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.city-item-mayor {
		font-size: 0.78rem;
		color: var(--color-text-muted);
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.city-item {
			grid-template-columns: 1fr 40px 80px;
		}
		.city-item-mayor {
			display: none;
		}
	}

	/* Pagination */
	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1.25rem;
		flex-wrap: wrap;
	}

	.pagination-btn {
		padding: 0.4rem 0.75rem;
		font-size: 0.8rem;
		font-weight: 600;
		background: var(--color-cream);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-sm);
		color: var(--color-foreground);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.pagination-btn:hover:not(:disabled) {
		background: var(--color-cream-dark);
	}

	.pagination-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.pagination-pages {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}

	.pagination-page {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		font-weight: 600;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		color: var(--color-text-light);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.pagination-page:hover {
		background: var(--color-cream);
	}

	.pagination-page--active {
		background: var(--color-navy);
		color: #faf8f5;
		border-color: var(--color-navy);
	}

	.pagination-ellipsis {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		padding: 0 0.25rem;
	}

	/* Insights grid */
	.insights-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	@media (max-width: 640px) {
		.insights-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.insight {
		text-align: center;
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
	}

	.insight-value {
		display: block;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.insight-label {
		font-size: 0.72rem;
		color: var(--color-text-light);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	/* Regions */
	.region-grid {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.region-item {
		padding: 0.5rem 0;
	}

	.region-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.3rem;
	}

	.region-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.region-count {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-gold-dark);
	}

	.region-bar-bg {
		height: 8px;
		background: var(--color-cream);
		border-radius: 4px;
		overflow: hidden;
	}

	.region-bar {
		height: 100%;
		background: var(--color-gold);
		border-radius: 4px;
	}

	.region-pop {
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	/* Party chart */
	.party-chart {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.party-row {
		display: grid;
		grid-template-columns: 50px 1fr 30px;
		align-items: center;
		gap: 0.75rem;
	}

	.party-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.party-bar-bg {
		height: 20px;
		background: var(--color-cream);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.party-bar {
		height: 100%;
		background: var(--color-navy-light);
		border-radius: var(--radius-sm);
	}

	.party-count {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text);
		text-align: right;
	}

	.party-tag {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.1rem 0.35rem;
		background: var(--color-cream-dark);
		border-radius: 3px;
		margin-left: 0.3rem;
		vertical-align: middle;
	}

	/* Full list toggle */
	.full-list-summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-foreground);
		cursor: pointer;
		padding: 0.5rem 0;
		background: none;
		border: none;
		width: 100%;
		text-align: left;
	}

	.full-list-summary:hover {
		color: var(--color-gold-dark);
	}

	.summary-chevron {
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.summary-chevron.open {
		transform: rotate(180deg);
	}

	.all-cities-paginated {
		margin-top: 1rem;
	}

	.all-cities-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.all-cities-showing {
		font-size: 0.8rem;
		color: var(--color-text-light);
	}

	.loading-text {
		text-align: center;
		padding: 2rem;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	/* SEO links: visually hidden but crawlable */
	.seo-city-links {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
	}

	.seo-city-links a {
		display: inline;
	}

	.table-wrapper {
		overflow-x: auto;
		margin-top: 1rem;
	}

	.cities-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}

	.cities-table th {
		text-align: left;
		padding: 0.6rem 0.75rem;
		background: var(--color-navy);
		color: #faf8f5;
		font-weight: 600;
		font-size: 0.8rem;
	}

	.cities-table th:first-child {
		border-radius: var(--radius-sm) 0 0 0;
	}
	.cities-table th:last-child {
		border-radius: 0 var(--radius-sm) 0 0;
	}

	.cities-table td {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--color-cream-dark);
		vertical-align: middle;
	}

	.cities-table td.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.cities-table tbody tr:nth-child(even) {
		background: var(--color-cream);
	}

	.cities-table a {
		color: var(--color-foreground);
		font-weight: 600;
		text-decoration: none;
	}

	.cities-table a:hover {
		color: var(--color-gold-dark);
	}

	.last-updated {
		text-align: center;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.5rem;
	}

	/* Cross-links */
	.crosslinks-section {
		padding: 2rem 0 3rem;
		background: var(--color-cream-dark);
	}

	.crosslinks-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	@media (max-width: 767px) {
		.crosslinks-grid {
			grid-template-columns: 1fr;
		}
	}

	.crosslink-card {
		padding: 1.5rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		text-decoration: none !important;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.crosslink-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(10, 22, 40, 0.12);
	}

	.crosslink-card h3 {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.25rem;
	}

	.crosslink-card p {
		font-size: 0.8rem;
		color: var(--color-text-light);
		line-height: 1.4;
		margin: 0;
	}
</style>
