<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(isoDate: string | null): string {
		if (!isoDate) return '—';
		const date = new Date(isoDate);
		return date.toLocaleString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatCost(cost: number): string {
		return `$${cost.toFixed(3)}`;
	}

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'pending':
				return 'badge-pending';
			case 'processing':
				return 'badge-processing';
			case 'completed':
				return 'badge-success';
			case 'failed':
				return 'badge-error';
			default:
				return '';
		}
	}

	function getSourceLabel(source: string): string {
		switch (source) {
			case 'user':
				return 'Utilisateur';
			case 'auto-refresh':
				return 'Auto-refresh';
			case 'admin':
				return 'Admin';
			default:
				return source;
		}
	}

	async function triggerWorker() {
		try {
			const res = await fetch('/api/_scheduled/process-queue');
			const result = await res.json();
			alert(JSON.stringify(result, null, 2));
			location.reload();
		} catch (e) {
			alert('Error: ' + (e instanceof Error ? e.message : 'Unknown'));
		}
	}
</script>

<svelte:head>
	<title>File de recherche | Admin maire.app</title>
</svelte:head>

<div class="queue-page">
	<header class="page-header">
		<div>
			<h1>File de recherche</h1>
			<p>Gestion de la file d'attente Grok-4</p>
		</div>
		<button class="btn-trigger" onclick={triggerWorker}>
			Lancer recherche
		</button>
	</header>

	{#if data.error}
		<div class="error-banner">
			<strong>Erreur :</strong> {data.error}
		</div>
	{/if}

	<!-- Stats Overview -->
	<section class="stats-grid">
		<div class="stat-card">
			<span class="stat-value pending">{data.stats.pending}</span>
			<span class="stat-label">En attente</span>
		</div>
		<div class="stat-card">
			<span class="stat-value processing">{data.stats.processing}</span>
			<span class="stat-label">En cours</span>
		</div>
		<div class="stat-card">
			<span class="stat-value success">{data.stats.completed}</span>
			<span class="stat-label">Terminées</span>
		</div>
		<div class="stat-card">
			<span class="stat-value error">{data.stats.failed}</span>
			<span class="stat-label">Échouées</span>
		</div>
		<div class="stat-card">
			<span class="stat-value cost">{formatCost(data.stats.totalCost)}</span>
			<span class="stat-label">Coût total</span>
		</div>
	</section>

	<!-- Current Queue -->
	<section class="section">
		<h2>File d'attente actuelle</h2>
		{#if data.queue.length === 0}
			<p class="empty-state">Aucune recherche en attente</p>
		{:else}
			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							<th>Ville</th>
							<th>Statut</th>
							<th>Priorité</th>
							<th>Source</th>
							<th>Demandée</th>
							<th>Erreur</th>
						</tr>
					</thead>
					<tbody>
						{#each data.queue as job}
							<tr>
								<td class="city-cell">
									<strong>{job.city_name}</strong>
									<span class="slug">{job.city_slug}</span>
								</td>
								<td>
									<span class="badge {getStatusBadgeClass(job.status)}">
										{job.status}
									</span>
								</td>
								<td class="center">{job.priority}</td>
								<td>{getSourceLabel(job.request_source)}</td>
								<td>{formatDate(job.requested_at)}</td>
								<td class="error-cell">
									{#if job.error_message}
										<span title={job.error_message}>
											{job.error_message.slice(0, 30)}...
										</span>
									{:else}
										—
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<!-- Recent Completed -->
	<section class="section">
		<h2>Recherches terminées récentes</h2>
		{#if data.recentCompleted.length === 0}
			<p class="empty-state">Aucune recherche terminée</p>
		{:else}
			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							<th>Ville</th>
							<th>Source</th>
							<th>Terminée</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recentCompleted as job}
							<tr>
								<td>
									<a href="/elections/municipales-2026/{job.city_slug}">
										{job.city_name}
									</a>
								</td>
								<td>{getSourceLabel(job.request_source)}</td>
								<td>{formatDate(job.completed_at)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<!-- Cities Metadata -->
	<section class="section">
		<h2>Villes indexées</h2>
		{#if data.cities.length === 0}
			<p class="empty-state">Aucune ville indexée</p>
		{:else}
			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							<th>Ville</th>
							<th>Source</th>
							<th>Dernière recherche</th>
							<th>Prochain refresh</th>
							<th>Coût</th>
						</tr>
					</thead>
					<tbody>
						{#each data.cities as city}
							<tr>
								<td>
									<a href="/elections/municipales-2026/{city.city_slug}">
										{city.city_name}
									</a>
								</td>
								<td>
									<span class="badge badge-source">{city.data_source}</span>
								</td>
								<td>{formatDate(city.last_researched_at)}</td>
								<td>{formatDate(city.next_refresh_at)}</td>
								<td>{formatCost(city.research_cost_usd)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>

<style>
	.queue-page {
		padding: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-family: var(--font-display);
		font-size: 1.75rem;
		color: var(--color-foreground);
		margin: 0 0 0.25rem;
	}

	.page-header p {
		color: var(--color-text-muted);
		margin: 0;
	}

	.btn-trigger {
		padding: 0.75rem 1.25rem;
		background: var(--color-gold);
		color: var(--color-foreground);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-trigger:hover {
		background: var(--color-gold-light);
	}

	.error-banner {
		padding: 1rem;
		background: rgba(224, 122, 95, 0.15);
		border: 1px solid var(--color-coral);
		border-radius: var(--radius-md);
		color: var(--color-coral);
		margin-bottom: 1.5rem;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: var(--color-card-bg);
		padding: 1.25rem;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 2rem;
		font-weight: 700;
		line-height: 1;
		margin-bottom: 0.5rem;
	}

	.stat-value.pending { color: var(--color-gold); }
	.stat-value.processing { color: #3b82f6; }
	.stat-value.success { color: var(--color-success); }
	.stat-value.error { color: var(--color-coral); }
	.stat-value.cost { color: var(--color-foreground); font-size: 1.5rem; }

	.stat-label {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	/* Sections */
	.section {
		background: var(--color-card-bg);
		padding: 1.5rem;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		margin-bottom: 1.5rem;
	}

	.section h2 {
		font-family: var(--font-display);
		font-size: 1.1rem;
		color: var(--color-foreground);
		margin: 0 0 1rem;
	}

	.empty-state {
		color: var(--color-text-muted);
		text-align: center;
		padding: 2rem;
	}

	/* Tables */
	.table-wrapper {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th, td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid var(--color-card-border);
	}

	th {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--color-text-muted);
		background: var(--color-cream);
	}

	td {
		font-size: 0.875rem;
	}

	.center {
		text-align: center;
	}

	.city-cell {
		display: flex;
		flex-direction: column;
	}

	.city-cell .slug {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.error-cell {
		font-size: 0.75rem;
		color: var(--color-coral);
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	a {
		color: var(--color-gold);
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	/* Badges */
	.badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.badge-pending {
		background: rgba(201, 169, 98, 0.15);
		color: var(--color-gold);
	}

	.badge-processing {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}

	.badge-success {
		background: rgba(74, 157, 110, 0.15);
		color: var(--color-success);
	}

	.badge-error {
		background: rgba(224, 122, 95, 0.15);
		color: var(--color-coral);
	}

	.badge-source {
		background: var(--color-navy);
		color: #faf8f5;
	}
</style>
