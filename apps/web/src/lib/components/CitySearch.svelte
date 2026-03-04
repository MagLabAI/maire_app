<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { City } from '$lib/types/elections';
	import type Fuse from 'fuse.js';

	interface Props {
		cities: City[];
		electionSlug?: string;
		compact?: boolean;
		onSelect?: (city: City) => void;
	}

	let { cities, electionSlug = 'municipales-2026', compact = false, onSelect }: Props = $props();

	let query = $state('');
	let isOpen = $state(false);
	let selectedIndex = $state(-1);
	let results = $state<City[]>([]);
	let fuseInstance: Fuse<City> | null = null;
	let debounceTimer: ReturnType<typeof setTimeout>;

	// Build Fuse index once when cities change
	let lastCitiesRef: City[] | null = null;

	async function ensureFuse() {
		if (fuseInstance && lastCitiesRef === cities) return;
		lastCitiesRef = cities;
		const FuseModule = await import('fuse.js');
		const FuseClass = FuseModule.default;
		fuseInstance = new FuseClass(cities, {
			keys: [
				{ name: 'name', weight: 0.7 },
				{ name: 'department', weight: 0.2 },
				{ name: 'slug', weight: 0.1 }
			],
			threshold: 0.3,
			distance: 80,
			minMatchCharLength: 2,
			shouldSort: true,
			includeScore: true
		});
	}

	onMount(() => {
		if (cities.length > 0) ensureFuse();
	});

	function doSearch(q: string) {
		if (q.length < 2 || !fuseInstance) {
			results = [];
			return;
		}
		results = fuseInstance.search(q, { limit: 8 }).map((r) => r.item);
	}

	function handleInput() {
		clearTimeout(debounceTimer);
		const q = query;
		if (q.length < 2) {
			results = [];
			return;
		}
		// Ensure Fuse is loaded (first keystroke after cities arrive)
		ensureFuse().then(() => {
			debounceTimer = setTimeout(() => doSearch(q), 80);
		});
	}

	function handleSelect(city: City) {
		if (onSelect) {
			onSelect(city);
		} else {
			goto(`/elections/${electionSlug}/${city.slug}`);
		}
		query = '';
		results = [];
		isOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen || results.length === 0) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (e.key === 'Enter' && selectedIndex >= 0) {
			e.preventDefault();
			handleSelect(results[selectedIndex]);
		} else if (e.key === 'Escape') {
			isOpen = false;
		}
	}

	function handleFocus() {
		isOpen = true;
	}

	function handleBlur() {
		setTimeout(() => {
			isOpen = false;
			selectedIndex = -1;
		}, 200);
	}
</script>

<div class="search-container" class:compact>
	<div class="search-input-wrapper">
		<svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
		</svg>
		<input
			type="text"
			bind:value={query}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeydown}
			placeholder="Chercher une ville..."
			class="search-input"
			aria-label="Rechercher une ville"
			autocomplete="off"
		/>
		{#if query.length > 0}
			<button
				class="search-clear"
				onclick={() => { query = ''; results = []; }}
				aria-label="Effacer la recherche"
			>
				×
			</button>
		{/if}
	</div>

	{#if isOpen && results.length > 0}
		<div class="search-results">
			{#each results as city, i}
				<button
					class="search-result"
					class:selected={i === selectedIndex}
					onclick={() => handleSelect(city)}
				>
					<div class="result-info">
						<span class="result-name">{city.name}</span>
						<span class="result-meta">
							{city.department} · {city.population.toLocaleString('fr-FR')} hab.
						</span>
					</div>
					{#if city.listsCount > 0}
						<span class="result-badge">
							{city.listsCount} listes
						</span>
					{/if}
				</button>
			{/each}
		</div>
	{:else if isOpen && query.length >= 2 && results.length === 0}
		<div class="search-results">
			<div class="search-empty">
				Aucune ville trouvée pour "{query}"
			</div>
		</div>
	{/if}
</div>

<style>
	.search-container {
		position: relative;
		width: 100%;
		max-width: 500px;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-text-light);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 1rem 3rem 1rem 3rem;
		font-size: 1rem;
		background: var(--color-card-bg);
		border: 2px solid var(--color-card-border);
		border-radius: var(--radius-lg);
		color: var(--color-text);
		transition: all 0.2s ease;
		min-height: 56px;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-gold);
		box-shadow: 0 0 0 4px rgba(201, 169, 98, 0.15);
	}

	.search-input::placeholder {
		color: var(--color-text-muted);
	}

	.search-clear {
		position: absolute;
		right: 1rem;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-cream-dark);
		border-radius: 50%;
		color: var(--color-text-light);
		font-size: 16px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.search-clear:hover {
		background: var(--color-coral);
		color: white;
	}

	/* Results Dropdown */
	.search-results {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card-hover);
		overflow: hidden;
		z-index: 50;
		animation: fade-in 0.2s ease;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.search-result {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 1rem;
		text-align: left;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.search-result:hover,
	.search-result.selected {
		background: var(--color-cream);
	}

	.search-result:not(:last-child) {
		border-bottom: 1px solid var(--color-card-border);
	}

	.result-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.result-name {
		font-weight: 600;
		color: var(--color-foreground);
	}

	.result-meta {
		font-size: 0.85rem;
		color: var(--color-text-light);
	}

	.result-badge {
		padding: 0.25rem 0.5rem;
		background: var(--color-cream);
		color: var(--color-text-light);
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: var(--radius-sm);
	}

	.search-empty {
		padding: 1.5rem;
		text-align: center;
		color: var(--color-text-light);
	}

	/* Compact mode */
	.compact .search-input {
		padding: 0.5rem 2.5rem 0.5rem 2.25rem;
		font-size: 0.85rem;
		min-height: 36px;
		border-width: 1px;
		border-radius: var(--radius-md);
	}

	.compact .search-icon {
		left: 0.75rem;
		width: 1rem;
		height: 1rem;
	}

	.compact .search-clear {
		right: 0.5rem;
		width: 18px;
		height: 18px;
		font-size: 12px;
	}

	.compact .search-results {
		border-radius: var(--radius-md);
	}

	.compact .search-result {
		padding: 0.75rem;
	}

	.compact .result-name {
		font-size: 0.9rem;
	}

	.compact .result-meta {
		font-size: 0.75rem;
	}
</style>
