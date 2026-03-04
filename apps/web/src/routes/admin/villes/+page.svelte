<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const cities = $derived(data.cities);
	let showImportModal = $state($page.url.searchParams.get('import') === 'true');
	let importJson = $state('');
	let importError = $state('');
	let importPreview = $state<{
		city: string;
		candidates: number;
		lists: number;
	} | null>(null);

	function closeModal() {
		showImportModal = false;
		importJson = '';
		importError = '';
		importPreview = null;
		goto('/admin/villes', { replaceState: true });
	}

	function parseJson() {
		importError = '';
		importPreview = null;

		if (!importJson.trim()) {
			return;
		}

		try {
			const data = JSON.parse(importJson);

			// Check for Grok research format
			if (data.city_info || data.incumbent_analysis) {
				importPreview = {
					city: data.city_info?.city_name || 'Ville inconnue',
					candidates: data.incumbent_analysis?.likely_candidates_2026?.length || 0,
					lists: 0
				};
				return;
			}

			// Check for maire.app city format
			if (data.city && data.candidates) {
				importPreview = {
					city: data.city.name || 'Ville inconnue',
					candidates: data.candidates.length || 0,
					lists: data.lists?.length || 0
				};
				return;
			}

			importError = 'Format JSON non reconnu';
		} catch {
			importError = 'JSON invalide';
		}
	}

	function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			importJson = e.target?.result as string;
			parseJson();
		};
		reader.readAsText(file);
	}

	async function submitImport() {
		if (!importPreview) return;

		// For now, show the transformed JSON - actual file writing would need a server endpoint
		// This is a static site so we'll download the transformed JSON
		try {
			const data = JSON.parse(importJson);
			const transformed = transformGrokToMaireFormat(data);
			const blob = new Blob([JSON.stringify(transformed, null, '\t')], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${transformed.city.slug}.json`;
			a.click();
			URL.revokeObjectURL(url);
			closeModal();
		} catch (err) {
			importError = 'Erreur lors de la transformation';
		}
	}

	function transformGrokToMaireFormat(grokData: Record<string, unknown>) {
		// If already in maire format, return as-is
		if ((grokData as { city?: unknown }).city && (grokData as { candidates?: unknown }).candidates) {
			return grokData;
		}

		const cityInfo = grokData.city_info as Record<string, unknown> | undefined;
		const incumbent = grokData.incumbent_analysis as Record<string, unknown> | undefined;
		const issues = grokData.top_10_local_issues as Array<Record<string, unknown>> | undefined;

		const cityName = (cityInfo?.city_name as string) || 'Ville';
		const slug = cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');

		const candidates = ((incumbent?.likely_candidates_2026 as Array<Record<string, unknown>>) || []).map((c, i) => ({
			id: ((c.name as string) || `candidate-${i}`).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
			firstName: ((c.name as string) || '').split(' ')[0],
			lastName: ((c.name as string) || '').split(' ').slice(1).join(' '),
			fullName: c.name as string,
			listId: `list-${i}`,
			position: 1,
			isHead: true,
			photo: null,
			demographics: {
				birthYear: c.birth_year as number || null,
				age: c.age as number || null,
				gender: 'M',
				profession: c.profession as string || c.current_role as string || '',
				professionCategory: ''
			},
			experience: {
				currentMandate: c.current_role ? {
					role: c.current_role as string,
					since: 2020,
					yearsInRole: 4
				} : null,
				previousMandates: [],
				totalYearsElected: (c.political_experience_years as number) || 0
			},
			stats: {
				experienceScore: Math.min(100, ((c.political_experience_years as number) || 0) * 5),
				socialPresence: 50,
				programClarity: 60
			},
			rarity: ((c.political_experience_years as number) || 0) > 20 ? 'legendary' : ((c.political_experience_years as number) || 0) > 10 ? 'rare' : 'common',
			programHighlights: (c.key_proposals as string[]) || []
		}));

		const lists = candidates.map((c, i) => ({
			id: `list-${i}`,
			name: c.fullName,
			nuance: '',
			headCandidate: c.id,
			candidatesCount: 1
		}));

		return {
			city: {
				id: slug,
				slug,
				name: cityName,
				department: (cityInfo?.department as string) || '',
				region: (cityInfo?.region as string) || '',
				population: (cityInfo?.population as number) || 0,
				country: 'FR',
				seatsTotal: 49,
				incumbent: incumbent?.current_incumbent ? {
					name: (incumbent.current_incumbent as Record<string, unknown>)?.name as string,
					party: (incumbent.current_incumbent as Record<string, unknown>)?.party as string,
					since: (incumbent.current_incumbent as Record<string, unknown>)?.year_elected as number
				} : null,
				listsCount: lists.length,
				candidatesCount: candidates.length
			},
			lists,
			candidates,
			localIssues: (issues || []).slice(0, 5).map((issue, i) => ({
				rank: i + 1,
				issue: issue.issue as string,
				description: issue.description as string
			})),
			lastUpdated: new Date().toISOString()
		};
	}
</script>

<svelte:head>
	<title>Villes - Admin maire.app</title>
</svelte:head>

<div class="cities-page">
	<header class="page-header">
		<div>
			<h1>Villes</h1>
			<p>{cities.length} villes avec données</p>
		</div>
		<button class="btn-primary" onclick={() => (showImportModal = true)}>
			+ Importer JSON
		</button>
	</header>

	<div class="cities-table-container">
		<table class="cities-table">
			<thead>
				<tr>
					<th>Ville</th>
					<th>Département</th>
					<th>Population</th>
					<th>Candidats</th>
					<th>Listes</th>
					<th>Maire sortant</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each cities as city}
					<tr>
						<td class="city-name">{city.name}</td>
						<td>{city.department}</td>
						<td>{city.population?.toLocaleString('fr-FR')}</td>
						<td>{city.candidatesCount || 0}</td>
						<td>{city.listsCount || 0}</td>
						<td class="incumbent">
							{#if city.incumbent}
								{city.incumbent.name}
								<span class="party">{city.incumbent.party}</span>
							{:else}
								-
							{/if}
						</td>
						<td>
							<a href="/admin/villes/{city.slug}" class="btn-edit">Modifier</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if showImportModal}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={closeModal} role="presentation">
		<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onclick={(e) => e.stopPropagation()}>
			<header class="modal-header">
				<h2 id="modal-title">Importer des données</h2>
				<button class="modal-close" onclick={closeModal}>&times;</button>
			</header>

			<div class="modal-body">
				<div class="import-info">
					<p>Formats supportés :</p>
					<ul>
						<li>JSON de recherche Grok (city_info, incumbent_analysis...)</li>
						<li>JSON maire.app (city, candidates, lists...)</li>
					</ul>
				</div>

				<div class="file-upload">
					<label class="file-label">
						<input type="file" accept=".json" onchange={handleFileUpload} />
						<span class="file-button">Choisir un fichier</span>
						<span class="file-hint">ou coller le JSON ci-dessous</span>
					</label>
				</div>

				<textarea
					class="json-input"
					placeholder="Coller le JSON ici..."
					bind:value={importJson}
					oninput={parseJson}
				></textarea>

				{#if importError}
					<div class="error-msg">{importError}</div>
				{/if}

				{#if importPreview}
					<div class="preview">
						<div class="preview-title">Aperçu</div>
						<div class="preview-content">
							<div class="preview-item">
								<span class="preview-label">Ville</span>
								<span class="preview-value">{importPreview.city}</span>
							</div>
							<div class="preview-item">
								<span class="preview-label">Candidats</span>
								<span class="preview-value">{importPreview.candidates}</span>
							</div>
							{#if importPreview.lists > 0}
								<div class="preview-item">
									<span class="preview-label">Listes</span>
									<span class="preview-value">{importPreview.lists}</span>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<footer class="modal-footer">
				<button class="btn-cancel" onclick={closeModal}>Annuler</button>
				<button
					class="btn-primary"
					disabled={!importPreview}
					onclick={submitImport}
				>
					Télécharger JSON transformé
				</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	.cities-page {
		max-width: 1200px;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-family: var(--font-heading);
		font-size: 1.75rem;
		color: var(--color-foreground);
		margin: 0;
	}

	.page-header p {
		color: var(--color-text-light);
		margin: 0.25rem 0 0;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: var(--color-gold);
		color: var(--color-foreground);
		font-weight: 600;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary:hover {
		background: var(--color-gold-light);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.cities-table-container {
		background: var(--color-card-bg);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.cities-table {
		width: 100%;
		border-collapse: collapse;
	}

	.cities-table th {
		text-align: left;
		padding: 1rem;
		background: var(--color-cream);
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--color-text-light);
		border-bottom: 1px solid var(--color-cream-dark);
	}

	.cities-table td {
		padding: 1rem;
		border-bottom: 1px solid var(--color-cream-dark);
		font-size: 0.9rem;
	}

	.cities-table tr:last-child td {
		border-bottom: none;
	}

	.city-name {
		font-weight: 500;
		color: var(--color-foreground);
	}

	.incumbent {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.party {
		font-size: 0.75rem;
		background: var(--color-cream);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		color: var(--color-text-light);
	}

	.btn-edit {
		font-size: 0.8rem;
		color: var(--color-gold);
		text-decoration: none;
		font-weight: 500;
	}

	.btn-edit:hover {
		text-decoration: underline;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		z-index: 100;
	}

	.modal {
		background: var(--color-card-bg);
		border-radius: 16px;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--color-cream-dark);
	}

	.modal-header h2 {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		color: var(--color-foreground);
		margin: 0;
	}

	.modal-close {
		width: 32px;
		height: 32px;
		border: none;
		background: var(--color-cream);
		border-radius: 50%;
		cursor: pointer;
		font-size: 1.25rem;
		color: var(--color-text-light);
		transition: all 0.2s;
	}

	.modal-close:hover {
		background: var(--color-cream-dark);
		color: var(--color-text);
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
	}

	.import-info {
		background: var(--color-cream);
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.85rem;
	}

	.import-info p {
		margin: 0 0 0.5rem;
		font-weight: 500;
	}

	.import-info ul {
		margin: 0;
		padding-left: 1.25rem;
		color: var(--color-text-light);
	}

	.file-upload {
		margin-bottom: 1rem;
	}

	.file-label {
		display: flex;
		align-items: center;
		gap: 1rem;
		cursor: pointer;
	}

	.file-label input {
		display: none;
	}

	.file-button {
		padding: 0.5rem 1rem;
		background: var(--color-navy);
		color: white;
		font-size: 0.85rem;
		border-radius: 6px;
	}

	.file-hint {
		font-size: 0.85rem;
		color: var(--color-text-light);
	}

	.json-input {
		width: 100%;
		height: 200px;
		padding: 1rem;
		border: 1px solid var(--color-cream-dark);
		border-radius: 8px;
		font-family: monospace;
		font-size: 0.8rem;
		resize: vertical;
	}

	.json-input:focus {
		outline: none;
		border-color: var(--color-gold);
	}

	.error-msg {
		margin-top: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: #fef2f2;
		color: #dc2626;
		border-radius: 6px;
		font-size: 0.85rem;
	}

	.preview {
		margin-top: 1rem;
		background: var(--color-cream);
		border-radius: 8px;
		overflow: hidden;
	}

	.preview-title {
		padding: 0.75rem 1rem;
		background: var(--color-gold);
		color: var(--color-foreground);
		font-weight: 600;
		font-size: 0.85rem;
	}

	.preview-content {
		padding: 1rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 1rem;
	}

	.preview-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.preview-label {
		font-size: 0.75rem;
		color: var(--color-text-light);
		text-transform: uppercase;
	}

	.preview-value {
		font-weight: 600;
		color: var(--color-foreground);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--color-cream-dark);
	}

	.btn-cancel {
		padding: 0.75rem 1.25rem;
		background: var(--color-card-bg);
		border: 1px solid var(--color-cream-dark);
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--color-text);
	}

	.btn-cancel:hover {
		background: var(--color-cream);
	}

	@media (max-width: 768px) {
		.cities-table th:nth-child(3),
		.cities-table td:nth-child(3),
		.cities-table th:nth-child(5),
		.cities-table td:nth-child(5) {
			display: none;
		}
	}
</style>
