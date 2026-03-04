<script lang="ts">
	import type { PageData } from './$types';
	import SeoMeta from '$lib/components/SeoMeta.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Élections | maire.app</title>
	<meta name="description" content="Toutes les élections couvertes : municipales, européennes, législatives. Passées et à venir." />
	<SeoMeta
		title="Élections | maire.app"
		description="Toutes les élections couvertes : municipales, européennes, législatives. Passées et à venir."
		path="/elections"
	/>
</svelte:head>

<section class="page-header">
	<div class="container-app">
		<h1 class="page-title">Élections</h1>
		<p class="page-subtitle">Toutes les élections couvertes par maire.app</p>
	</div>
</section>

<section class="elections-section">
	<div class="container-app">
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

					<h2 class="election-name">{election.name}</h2>

					<div class="election-date">
						{#if election.dates.round1}
							{new Date(election.dates.round1).toLocaleDateString('fr-FR', {
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							})}
						{/if}
						{#if election.dates.round2}
							<span class="date-separator">→</span>
							{new Date(election.dates.round2).toLocaleDateString('fr-FR', {
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							})}
						{/if}
					</div>

					{#if election.citiesCount}
						<div class="election-meta">
							{election.citiesCount} villes couvertes
						</div>
					{/if}

					<div class="election-country">
						{election.country === 'FR' ? '🇫🇷 France' : '🇪🇺 Union Européenne'}
					</div>

					<div class="election-arrow">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
						</svg>
					</div>
				</a>
			{/each}
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
	}

	.elections-section {
		padding: 3rem 0;
	}

	.elections-grid {
		display: grid;
		gap: 1.5rem;
	}

	.election-card {
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 1rem;
		align-items: center;
		padding: 1.5rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		transition: all 0.3s ease;
	}

	.election-card:hover {
		transform: translateX(8px);
		box-shadow: var(--shadow-card-hover);
	}

	.election-card.active {
		border-left: 4px solid var(--color-gold);
	}

	.election-card.past {
		opacity: 0.7;
	}

	.election-card.future {
		opacity: 0.6;
	}

	@media (max-width: 768px) {
		.election-card {
			grid-template-columns: 1fr;
		}
	}

	.election-status {
		grid-column: 1 / -1;
	}

	@media (min-width: 768px) {
		.election-status {
			grid-column: auto;
		}
	}

	.status-badge {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 700;
		border-radius: var(--radius-full);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-badge.upcoming {
		background: var(--color-gold);
		color: var(--color-foreground);
	}

	.status-badge.past {
		background: var(--color-cream-dark);
		color: var(--color-text-light);
	}

	.status-badge.future {
		background: var(--color-navy-light);
		color: #faf8f5;
	}

	.election-name {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.election-date {
		font-size: 0.95rem;
		color: var(--color-text);
	}

	.date-separator {
		margin: 0 0.5rem;
		color: var(--color-gold);
	}

	.election-meta {
		font-size: 0.85rem;
		color: var(--color-text-light);
	}

	.election-country {
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.election-arrow {
		color: var(--color-gold);
		transition: transform 0.2s ease;
	}

	.election-card:hover .election-arrow {
		transform: translateX(4px);
	}

	@media (max-width: 768px) {
		.election-arrow {
			display: none;
		}
	}
</style>
