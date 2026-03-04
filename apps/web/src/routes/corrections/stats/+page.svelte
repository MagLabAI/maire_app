<script lang="ts">
	import type { StatsData } from './+page';
	import SeoMeta from '$lib/components/SeoMeta.svelte';

	let { data } = $props();
	let stats: StatsData = $derived(data.stats);

	const PAGE_SIZE = 25;
	let currentPage = $state(0);
	let totalPages = $derived(Math.ceil(stats.perCity.length / PAGE_SIZE));
	let pagedCities = $derived(stats.perCity.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE));
</script>

<svelte:head>
	<title>Statistiques | maire.app</title>
	<meta name="description" content="Statistiques de couverture, vérification des sources et corrections sur maire.app." />
	<SeoMeta
		title="Statistiques de vérification | maire.app"
		description="Statistiques de couverture, vérification des sources et corrections sur maire.app."
		path="/corrections/stats"
	/>
</svelte:head>

<section class="page-header">
	<div class="container-app">
		<h1 class="page-title">Statistiques</h1>
		<p class="page-subtitle">Couverture des données, vérification des sources, et suivi des corrections</p>
	</div>
</section>

<section class="stats-section">
	<div class="container-app">
		<div class="stats-content">

			<!-- Stat cards -->
			<div class="stat-cards">
				<div class="stat-card">
					<span class="stat-value">{stats.citiesResearched}</span>
					<span class="stat-label">Villes recherchées</span>
					<span class="stat-detail">sur {stats.citiesIndexed} indexées</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{stats.totalCandidates}</span>
					<span class="stat-label">Candidats suivis</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{stats.totalSources}</span>
					<span class="stat-label">Sources web citées</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{stats.totalClaims}</span>
					<span class="stat-label">Affirmations analysées</span>
					{#if stats.totalClaims > 0}
						<span class="stat-detail">{stats.confirmedClaims} confirmées ({stats.overallVerificationRate}%)</span>
					{/if}
				</div>
			</div>

			<!-- Verification rate -->
			{#if stats.totalClaims > 0}
				<div class="method-card">
					<h2>Taux de vérification global</h2>
					<div class="verification-bar-container">
						<div class="verification-bar">
							<div class="verification-fill" style="width: {stats.overallVerificationRate}%"></div>
						</div>
						<span class="verification-pct">{stats.overallVerificationRate}%</span>
					</div>
					<p class="verification-note">
						{stats.confirmedClaims} affirmations confirmées par des sources sur {stats.totalClaims} analysées.
						Les affirmations non vérifiées ne sont pas nécessairement fausses — elles n'ont simplement
						pas pu être recoupées avec une source web identifiable.
					</p>
				</div>
			{/if}

			<!-- Per-city table -->
			<div class="method-card">
				<h2>Détail par ville <span class="table-count">({stats.perCity.length})</span></h2>
				<div class="table-wrapper">
					<table class="city-table">
						<thead>
							<tr>
								<th>Ville</th>
								<th>Candidats</th>
								<th>Sources</th>
								<th>Vérification</th>
							</tr>
						</thead>
						<tbody>
							{#each pagedCities as city}
								<tr>
									<td>
										<a href="/elections/municipales-2026/{city.slug}">{city.name}</a>
									</td>
									<td>{city.candidates}</td>
									<td>{city.sources || '—'}</td>
									<td>
										{#if city.totalClaims > 0}
											<span class="badge badge-verified">{city.verificationRate}%</span>
										{:else}
											<span class="badge badge-pending">En attente</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if totalPages > 1}
					<div class="pagination">
						<button class="page-btn" disabled={currentPage === 0} onclick={() => currentPage = 0}>&laquo;</button>
						<button class="page-btn" disabled={currentPage === 0} onclick={() => currentPage--}>&lsaquo;</button>
						<span class="page-info">{currentPage + 1} / {totalPages}</span>
						<button class="page-btn" disabled={currentPage >= totalPages - 1} onclick={() => currentPage++}>&rsaquo;</button>
						<button class="page-btn" disabled={currentPage >= totalPages - 1} onclick={() => currentPage = totalPages - 1}>&raquo;</button>
					</div>
				{/if}
			</div>

			<!-- Corrections placeholder -->
			<div class="method-card">
				<h2>Corrections</h2>
				<p>
					Le suivi des corrections sera disponible prochainement.
					Les signalements sont traités via
					<a href="https://github.com/MagLabAI/maire.app/issues?q=label%3Aerreur-contenu" target="_blank" rel="noopener">GitHub Issues</a>
					et le <a href="/corrections">formulaire de contact</a>.
				</p>
			</div>

			<!-- Back link -->
			<div class="back-link">
				<a href="/corrections">&larr; Signaler une erreur</a>
			</div>

		</div>
	</div>
</section>

<style>
	.page-header {
		background: var(--color-navy);
		color: #faf8f5;
		padding: 3rem 0;
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 2.5rem;
		font-weight: 700;
		color: #faf8f5;
		margin-bottom: 0.5rem;
	}

	.page-subtitle {
		color: var(--color-text-light);
		max-width: 600px;
		line-height: 1.5;
	}

	.stats-section {
		padding: 2rem 0 4rem;
	}

	.stats-content {
		display: grid;
		gap: 1.5rem;
		max-width: 900px;
	}

	/* Stat cards */
	.stat-cards {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}

	@media (max-width: 768px) {
		.stat-cards {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 1.25rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.stat-value {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-gold);
		line-height: 1;
	}

	.stat-label {
		font-size: 0.85rem;
		color: var(--color-foreground);
		font-weight: 500;
		margin-top: 0.5rem;
	}

	.stat-detail {
		font-size: 0.7rem;
		color: var(--color-text-light);
		margin-top: 0.25rem;
	}

	/* Method card (shared) */
	.method-card {
		padding: 1.5rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.method-card h2 {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.75rem;
	}

	.method-card p {
		color: var(--color-text);
		line-height: 1.6;
		font-size: 0.95rem;
		margin-bottom: 0.75rem;
	}

	.method-card p:last-child {
		margin-bottom: 0;
	}

	.method-card a {
		color: var(--color-gold);
		text-decoration: underline;
	}

	.method-card a:hover {
		color: var(--color-coral);
	}

	/* Verification bar */
	.verification-bar-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.verification-bar {
		flex: 1;
		height: 12px;
		background: var(--color-cream-dark);
		border-radius: 6px;
		overflow: hidden;
	}

	.verification-fill {
		height: 100%;
		background: var(--color-success);
		border-radius: 6px;
		transition: width 0.5s ease;
	}

	.verification-pct {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.25rem;
		color: var(--color-success);
		min-width: 50px;
		text-align: right;
	}

	.verification-note {
		font-size: 0.85rem;
		color: var(--color-text-light);
	}

	/* Table */
	.table-wrapper {
		overflow-x: auto;
	}

	.city-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.city-table th {
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-light);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.5rem 0.75rem;
		border-bottom: 2px solid var(--color-cream-dark);
	}

	.city-table td {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--color-cream-dark);
		color: var(--color-text);
	}

	.city-table a {
		color: var(--color-foreground);
		font-weight: 500;
		text-decoration: none;
	}

	.city-table a:hover {
		color: var(--color-gold);
	}

	.badge {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
	}

	.badge-verified {
		background: rgba(74, 157, 110, 0.12);
		color: var(--color-success);
	}

	.badge-pending {
		background: var(--color-cream-dark);
		color: var(--color-text-light);
	}

	.table-count {
		font-size: 0.85rem;
		font-weight: 400;
		color: var(--color-text-light);
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-cream-dark);
	}

	.page-btn {
		background: var(--color-cream-dark);
		border: none;
		border-radius: 4px;
		padding: 0.35rem 0.65rem;
		font-size: 0.85rem;
		color: var(--color-foreground);
		cursor: pointer;
		transition: background 0.15s;
	}

	.page-btn:hover:not(:disabled) {
		background: var(--color-gold-light);
	}

	.page-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.page-info {
		font-size: 0.8rem;
		color: var(--color-text-light);
		min-width: 60px;
		text-align: center;
	}

	.back-link {
		padding-top: 0.5rem;
	}

	.back-link a {
		color: var(--color-gold);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.back-link a:hover {
		text-decoration: underline;
	}
</style>
