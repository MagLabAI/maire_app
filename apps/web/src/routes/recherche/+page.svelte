<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import SeoMeta from '$lib/components/SeoMeta.svelte';
	import type { City } from '$lib/types/elections';
	import type Fuse from 'fuse.js';

	let query = $state('');
	let inputValue = $state('');
	let cities = $state<City[]>([]);
	let results = $state<City[]>([]);
	let fuseInstance: Fuse<City> | null = null;
	let loading = $state(true);

	function norm(s: string): string {
		return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/-/g, ' ');
	}

	// Group results by department number, then sort cities by population within each group
	let grouped = $derived(() => {
		const groups = new Map<string, { dept: string; cities: City[] }>();
		for (const city of results) {
			const dept = city.department;
			if (!groups.has(dept)) groups.set(dept, { dept, cities: [] });
			groups.get(dept)!.cities.push(city);
		}
		// Sort cities within each department by population desc
		for (const g of groups.values()) {
			g.cities.sort((a, b) => b.population - a.population);
		}
		// Sort departments by department number (extract numeric part)
		return [...groups.values()].sort((a, b) => {
			const numA = parseInt(a.dept.replace(/\D/g, '')) || 0;
			const numB = parseInt(b.dept.replace(/\D/g, '')) || 0;
			return numA - numB;
		});
	});

	onMount(async () => {
		const res = await fetch('/data/municipales-2026/cities.json');
		const data: { cities: City[] } = await res.json();
		cities = data.cities;

		const FuseModule = await import('fuse.js');
		fuseInstance = new FuseModule.default(cities, {
			keys: [
				{ name: 'name', weight: 0.7 },
				{ name: 'department', weight: 0.2 },
				{ name: 'slug', weight: 0.1 }
			],
			getFn: (obj: Record<string, unknown>, path: string | string[]) => {
				const key = Array.isArray(path) ? path[0] : path;
				const val = (obj as Record<string, unknown>)[key];
				return typeof val === 'string' ? norm(val) : val != null ? String(val) : '';
			},
			threshold: 0.3,
			distance: 80,
			minMatchCharLength: 2,
			shouldSort: true,
			includeScore: true
		});

		loading = false;

		// Read initial query from URL
		const q = $page.url.searchParams.get('q') || '';
		if (q) {
			query = q;
			inputValue = q;
			doSearch(q);
		}
	});

	// React to URL changes (back/forward navigation)
	$effect(() => {
		const q = $page.url.searchParams.get('q') || '';
		if (q !== query && fuseInstance) {
			query = q;
			inputValue = q;
			doSearch(q);
		}
	});

	function doSearch(q: string) {
		if (q.length < 2 || !fuseInstance) {
			results = [];
			return;
		}
		results = fuseInstance.search(norm(q), { limit: 200 }).map((r) => r.item);
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		const q = inputValue.trim();
		if (q.length < 2) return;
		goto(`/recherche?q=${encodeURIComponent(q)}`, { replaceState: true });
		query = q;
		doSearch(q);
	}
</script>

<svelte:head>
	<title>{query ? `« ${query} » — Recherche` : 'Recherche'} — maire.app</title>
	<SeoMeta
		title="{query ? `« ${query} » — Recherche` : 'Recherche'} — maire.app"
		description="Recherchez une commune parmi les 34 910 villes de France pour les élections municipales 2026."
		path="/recherche"
	/>
</svelte:head>

<div class="search-page">
	<div class="search-page-header">
		<h1>Rechercher une commune</h1>
		<form class="search-form" onsubmit={handleSubmit}>
			<div class="search-form-row">
				<input
					type="text"
					bind:value={inputValue}
					placeholder="Nom de ville, département..."
					class="search-field"
					autofocus
				/>
				<button type="submit" class="search-submit" disabled={inputValue.trim().length < 2}>
					Rechercher
				</button>
			</div>
		</form>
	</div>

	{#if loading}
		<p class="search-status">Chargement des communes...</p>
	{:else if query.length >= 2 && results.length === 0}
		<p class="search-status">Aucune commune trouvée pour « {query} »</p>
	{:else if query.length >= 2}
		<p class="search-count">{results.length} résultat{results.length > 1 ? 's' : ''} pour « {query} »</p>

		{#if grouped().length > 1}
			<nav class="dept-nav" aria-label="Navigation par département">
				{#each grouped() as group}
					<a href="#dept-{group.dept.replace(/\s/g, '-')}" class="dept-nav-btn">{group.dept}</a>
				{/each}
			</nav>
		{/if}

		{#each grouped() as group}
			<section class="dept-section" id="dept-{group.dept.replace(/\s/g, '-')}">
				<h2 class="dept-title">{group.dept}</h2>
				<div class="results-grid">
					{#each group.cities as city (city.slug)}
						<a href="/elections/municipales-2026/{city.slug}" class="result-card">
							<div class="result-card-main">
								<span class="result-card-name">{city.name}</span>
								<span class="result-card-pop">{city.population.toLocaleString('fr-FR')} hab.</span>
							</div>
							{#if city.listsCount > 0}
								<span class="result-card-badge">{city.listsCount} liste{city.listsCount > 1 ? 's' : ''}</span>
							{/if}
						</a>
					{/each}
				</div>
			</section>
		{/each}
	{:else}
		<p class="search-status">Entrez au moins 2 caractères pour lancer la recherche.</p>
	{/if}
</div>

<style>
	.search-page {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
	}

	.search-page-header {
		margin-bottom: 2rem;
	}

	.search-page-header h1 {
		font-family: 'Playfair Display', serif;
		font-size: 1.75rem;
		color: var(--color-foreground);
		margin-bottom: 1rem;
	}

	.search-form-row {
		display: flex;
		gap: 0.5rem;
	}

	.search-field {
		flex: 1;
		padding: 0.875rem 1rem;
		font-size: 1rem;
		background: var(--color-card-bg);
		border: 2px solid var(--color-card-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		min-height: 48px;
	}

	.search-field:focus {
		outline: none;
		border-color: var(--color-gold);
		box-shadow: 0 0 0 4px rgba(201, 169, 98, 0.15);
	}

	.search-submit {
		padding: 0.875rem 1.5rem;
		background: var(--color-gold);
		color: var(--color-navy);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 700;
		font-size: 0.95rem;
		cursor: pointer;
		transition: background 0.2s ease;
		white-space: nowrap;
	}

	.search-submit:hover:not(:disabled) {
		background: var(--color-gold-light);
	}

	.search-submit:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.search-status {
		text-align: center;
		color: var(--color-text-light);
		padding: 3rem 0;
	}

	.search-count {
		color: var(--color-text-light);
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
	}

	.dept-nav {
		display: flex;
		gap: 0.375rem;
		overflow-x: auto;
		padding: 0.75rem 0;
		margin-bottom: 1rem;
		position: sticky;
		top: 48px;
		z-index: 10;
		background: var(--color-background, var(--color-cream));
		scrollbar-width: thin;
		-webkit-overflow-scrolling: touch;
	}

	.dept-nav-btn {
		flex-shrink: 0;
		padding: 0.35rem 0.7rem;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-text-light);
		background: var(--color-card-bg);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-sm);
		text-decoration: none;
		white-space: nowrap;
		transition: all 0.15s ease;
	}

	.dept-nav-btn:hover {
		color: var(--color-navy);
		border-color: var(--color-gold);
		background: var(--color-gold-light);
	}

	.dept-section {
		margin-bottom: 1.5rem;
		scroll-margin-top: 6rem;
	}

	.dept-title {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-text-light);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--color-card-border);
		margin-bottom: 0.75rem;
	}

	.results-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.5rem;
	}

	@media (min-width: 600px) {
		.results-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.result-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: var(--color-card-bg);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.result-card:hover {
		border-color: var(--color-gold);
		background: var(--color-cream);
	}

	.result-card-main {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.result-card-name {
		font-weight: 600;
		color: var(--color-foreground);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-card-pop {
		font-size: 0.8rem;
		color: var(--color-text-light);
	}

	.result-card-badge {
		flex-shrink: 0;
		padding: 0.2rem 0.5rem;
		background: var(--color-cream-dark);
		color: var(--color-text-light);
		font-size: 0.72rem;
		font-weight: 600;
		border-radius: var(--radius-sm);
	}
</style>
