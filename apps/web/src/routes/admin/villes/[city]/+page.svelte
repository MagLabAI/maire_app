<script lang="ts">
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const city = $derived(data.cityData?.city);
	const candidates = $derived(data.cityData?.candidates || []);
	const lists = $derived(data.cityData?.lists || []);
	const issues = $derived(data.cityData?.localIssues || []);

	function downloadJson() {
		if (!data.cityData) return;
		const blob = new Blob([JSON.stringify(data.cityData, null, '\t')], {
			type: 'application/json'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${city?.slug || 'city'}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>{city?.name || 'Ville'} - Admin maire.app</title>
</svelte:head>

<div class="city-page">
	<header class="page-header">
		<div class="header-left">
			<a href="/admin/villes" class="back-link">&larr; Retour aux villes</a>
			<h1>{city?.name || 'Ville inconnue'}</h1>
			{#if city}
				<p class="city-meta">
					{city.department} - {city.region} - {city.population?.toLocaleString('fr-FR')} habitants
				</p>
			{/if}
		</div>
		<div class="header-actions">
			<a href="/elections/municipales-2026/{city?.slug}" class="btn-view" target="_blank">
				Voir sur le site
			</a>
			<button class="btn-secondary" onclick={downloadJson}>
				Télécharger JSON
			</button>
		</div>
	</header>

	{#if !city}
		<div class="empty-state">
			<p>Aucune donnée trouvée pour cette ville</p>
			<a href="/admin/villes?import=true" class="btn-primary">Importer des données</a>
		</div>
	{:else}
		<div class="content-grid">
			<!-- City Info -->
			<section class="card">
				<h2>Informations générales</h2>
				<dl class="info-list">
					<div class="info-item">
						<dt>Maire sortant</dt>
						<dd>
							{#if city.incumbent}
								{city.incumbent.name}
								<span class="tag">{city.incumbent.party}</span>
								<span class="since">depuis {city.incumbent.since}</span>
							{:else}
								-
							{/if}
						</dd>
					</div>
					<div class="info-item">
						<dt>Sièges au conseil</dt>
						<dd>{city.seatsTotal || 49}</dd>
					</div>
					<div class="info-item">
						<dt>Nombre de listes</dt>
						<dd>{lists.length}</dd>
					</div>
					<div class="info-item">
						<dt>Nombre de candidats</dt>
						<dd>{candidates.length}</dd>
					</div>
				</dl>
			</section>

			<!-- Local Issues -->
			<section class="card">
				<h2>Enjeux locaux</h2>
				{#if issues.length > 0}
					<ol class="issues-list">
						{#each issues as issue}
							<li>
								<strong>{issue.issue}</strong>
								{#if issue.description}
									<span class="issue-desc">{issue.description}</span>
								{/if}
							</li>
						{/each}
					</ol>
				{:else}
					<p class="empty-text">Aucun enjeu défini</p>
				{/if}
			</section>

			<!-- Candidates -->
			<section class="card full-width">
				<h2>Candidats ({candidates.length})</h2>
				{#if candidates.length > 0}
					<div class="candidates-table-container">
						<table class="candidates-table">
							<thead>
								<tr>
									<th>Nom</th>
									<th>Liste</th>
									<th>Âge</th>
									<th>Profession</th>
									<th>Expérience</th>
									<th>Rareté</th>
								</tr>
							</thead>
							<tbody>
								{#each candidates as candidate}
									<tr>
										<td class="candidate-name">
											{candidate.fullName}
											{#if candidate.isHead}
												<span class="badge-head">Tête de liste</span>
											{/if}
										</td>
										<td>
											{#if candidate.listId}
												{@const list = lists.find((l) => l.id === candidate.listId)}
												{list?.name || candidate.listId}
											{:else}
												-
											{/if}
										</td>
										<td>{candidate.demographics?.age || '-'}</td>
										<td>{candidate.demographics?.profession || '-'}</td>
										<td>{candidate.experience?.totalYearsElected || 0} ans</td>
										<td>
											<span class="rarity rarity-{candidate.rarity}">
												{candidate.rarity === 'legendary'
													? 'Légendaire'
													: candidate.rarity === 'rare'
														? 'Prometteur'
														: 'Espoir'}
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="empty-text">Aucun candidat défini</p>
				{/if}
			</section>

			<!-- Lists -->
			<section class="card full-width">
				<h2>Listes ({lists.length})</h2>
				{#if lists.length > 0}
					<div class="lists-grid">
						{#each lists as list}
							<div class="list-card">
								<div class="list-name">{list.name}</div>
								<div class="list-meta">
									{#if list.nuance}
										<span class="tag">{list.nuance}</span>
									{/if}
									<span>{list.candidatesCount || 1} candidats</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="empty-text">Aucune liste définie</p>
				{/if}
			</section>
		</div>
	{/if}
</div>

<style>
	.city-page {
		max-width: 1200px;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 1rem;
	}

	.back-link {
		font-size: 0.85rem;
		color: var(--color-text-light);
		text-decoration: none;
	}

	.back-link:hover {
		color: var(--color-gold);
	}

	.page-header h1 {
		font-family: var(--font-heading);
		font-size: 1.75rem;
		color: var(--color-foreground);
		margin: 0.5rem 0 0;
	}

	.city-meta {
		color: var(--color-text-light);
		margin: 0.25rem 0 0;
		font-size: 0.9rem;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.btn-view,
	.btn-secondary {
		padding: 0.6rem 1rem;
		border-radius: 8px;
		font-size: 0.85rem;
		text-decoration: none;
		cursor: pointer;
		border: none;
	}

	.btn-view {
		background: var(--color-navy);
		color: white;
	}

	.btn-secondary {
		background: var(--color-card-bg);
		border: 1px solid var(--color-cream-dark);
		color: var(--color-text);
	}

	.btn-secondary:hover {
		background: var(--color-cream);
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: var(--color-card-bg);
		border-radius: 12px;
	}

	.empty-state p {
		color: var(--color-text-light);
		margin-bottom: 1.5rem;
	}

	.btn-primary {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: var(--color-gold);
		color: var(--color-foreground);
		font-weight: 600;
		border-radius: 8px;
		text-decoration: none;
	}

	.content-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.card {
		background: var(--color-card-bg);
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.card.full-width {
		grid-column: 1 / -1;
	}

	.card h2 {
		font-family: var(--font-heading);
		font-size: 1.1rem;
		color: var(--color-foreground);
		margin: 0 0 1rem;
	}

	.info-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-cream-dark);
	}

	.info-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.info-item dt {
		font-size: 0.85rem;
		color: var(--color-text-light);
	}

	.info-item dd {
		font-weight: 500;
		color: var(--color-foreground);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.tag {
		font-size: 0.75rem;
		background: var(--color-cream);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		color: var(--color-text-light);
	}

	.since {
		font-size: 0.8rem;
		font-weight: 400;
		color: var(--color-text-light);
	}

	.issues-list {
		padding-left: 1.25rem;
		margin: 0;
	}

	.issues-list li {
		margin-bottom: 0.75rem;
	}

	.issues-list li:last-child {
		margin-bottom: 0;
	}

	.issue-desc {
		display: block;
		font-size: 0.85rem;
		color: var(--color-text-light);
		margin-top: 0.25rem;
	}

	.empty-text {
		color: var(--color-text-light);
		font-style: italic;
	}

	.candidates-table-container {
		overflow-x: auto;
	}

	.candidates-table {
		width: 100%;
		border-collapse: collapse;
	}

	.candidates-table th {
		text-align: left;
		padding: 0.75rem;
		background: var(--color-cream);
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--color-text-light);
	}

	.candidates-table td {
		padding: 0.75rem;
		border-bottom: 1px solid var(--color-cream-dark);
		font-size: 0.9rem;
	}

	.candidates-table tr:last-child td {
		border-bottom: none;
	}

	.candidate-name {
		font-weight: 500;
		color: var(--color-foreground);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.badge-head {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		background: var(--color-gold);
		color: var(--color-foreground);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
	}

	.rarity {
		font-size: 0.8rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.rarity-legendary {
		background: linear-gradient(135deg, #fef3c7, #fcd34d);
		color: #92400e;
	}

	.rarity-rare {
		background: linear-gradient(135deg, #e5e7eb, #d1d5db);
		color: #374151;
	}

	.rarity-common {
		background: var(--color-cream);
		color: var(--color-text-light);
	}

	.lists-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.list-card {
		padding: 1rem;
		background: var(--color-cream);
		border-radius: 8px;
	}

	.list-name {
		font-weight: 500;
		color: var(--color-foreground);
		margin-bottom: 0.5rem;
	}

	.list-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.85rem;
		color: var(--color-text-light);
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
		}

		.header-actions {
			width: 100%;
		}

		.content-grid {
			grid-template-columns: 1fr;
		}

		.candidates-table th:nth-child(4),
		.candidates-table td:nth-child(4),
		.candidates-table th:nth-child(5),
		.candidates-table td:nth-child(5) {
			display: none;
		}
	}
</style>
