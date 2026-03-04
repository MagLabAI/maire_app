<script lang="ts">
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const stats = $derived(data.stats);
	const recentCities = $derived(data.recentCities);
</script>

<svelte:head>
	<title>Admin - maire.app</title>
</svelte:head>

<div class="dashboard">
	<header class="dashboard-header">
		<h1>Tableau de bord</h1>
		<p>Bienvenue sur l'administration de maire.app</p>
	</header>

	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-value">{stats.citiesCount}</div>
			<div class="stat-label">Villes</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{stats.candidatesCount}</div>
			<div class="stat-label">Candidats</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{stats.listsCount}</div>
			<div class="stat-label">Listes</div>
		</div>
		<div class="stat-card highlight">
			<div class="stat-value">{stats.daysUntilElection}</div>
			<div class="stat-label">Jours avant les élections</div>
		</div>
	</div>

	<section class="section">
		<div class="section-header">
			<h2>Villes avec données</h2>
			<a href="/admin/villes" class="btn-secondary">Voir toutes</a>
		</div>
		<div class="cities-list">
			{#each recentCities as city}
				<a href="/admin/villes/{city.slug}" class="city-item">
					<div class="city-info">
						<span class="city-name">{city.name}</span>
						<span class="city-dept">{city.department}</span>
					</div>
					<div class="city-stats">
						<span class="city-candidates">{city.candidatesCount} candidats</span>
						<span class="city-lists">{city.listsCount} listes</span>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<section class="section">
		<h2>Actions rapides</h2>
		<div class="actions-grid">
			<a href="/admin/villes?import=true" class="action-card">
				<div class="action-icon">+</div>
				<div class="action-title">Importer JSON</div>
				<div class="action-desc">Ajouter une ville depuis un fichier de recherche</div>
			</a>
			<a href="/" class="action-card" target="_blank">
				<div class="action-icon">&#8599;</div>
				<div class="action-title">Voir le site</div>
				<div class="action-desc">Ouvrir maire.app dans un nouvel onglet</div>
			</a>
		</div>
	</section>
</div>

<style>
	.dashboard {
		max-width: 1000px;
	}

	.dashboard-header {
		margin-bottom: 2rem;
	}

	.dashboard-header h1 {
		font-family: var(--font-heading);
		font-size: 1.75rem;
		color: var(--color-foreground);
		margin: 0;
	}

	.dashboard-header p {
		color: var(--color-text-light);
		margin: 0.5rem 0 0;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: var(--color-card-bg);
		border-radius: 12px;
		padding: 1.5rem;
		text-align: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.stat-card.highlight {
		background: var(--color-gold);
		color: var(--color-foreground);
	}

	.stat-value {
		font-family: var(--font-heading);
		font-size: 2.25rem;
		font-weight: 700;
	}

	.stat-label {
		font-size: 0.85rem;
		color: var(--color-text-light);
		margin-top: 0.25rem;
	}

	.stat-card.highlight .stat-label {
		color: var(--color-foreground);
		opacity: 0.8;
	}

	.section {
		background: var(--color-card-bg);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.section h2 {
		font-family: var(--font-heading);
		font-size: 1.1rem;
		color: var(--color-foreground);
		margin: 0;
	}

	.btn-secondary {
		font-size: 0.85rem;
		color: var(--color-gold);
		text-decoration: none;
		font-weight: 500;
	}

	.btn-secondary:hover {
		text-decoration: underline;
	}

	.cities-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.city-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.875rem 1rem;
		background: var(--color-cream);
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: background 0.2s;
	}

	.city-item:hover {
		background: var(--color-cream-dark);
	}

	.city-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.city-name {
		font-weight: 500;
		color: var(--color-foreground);
	}

	.city-dept {
		font-size: 0.8rem;
		color: var(--color-text-light);
		background: var(--color-card-bg);
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
	}

	.city-stats {
		display: flex;
		gap: 1rem;
		font-size: 0.85rem;
		color: var(--color-text-light);
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.action-card {
		display: block;
		padding: 1.25rem;
		background: var(--color-cream);
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
		border: 2px solid transparent;
	}

	.action-card:hover {
		border-color: var(--color-gold);
		background: var(--color-card-bg);
	}

	.action-icon {
		font-size: 1.5rem;
		color: var(--color-gold);
		margin-bottom: 0.5rem;
	}

	.action-title {
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.25rem;
	}

	.action-desc {
		font-size: 0.8rem;
		color: var(--color-text-light);
	}

	@media (max-width: 640px) {
		.city-stats {
			display: none;
		}
	}
</style>
