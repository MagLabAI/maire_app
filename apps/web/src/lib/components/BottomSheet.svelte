<script lang="ts">
	import type { Candidate } from '$lib/types/elections';
	import { comparison } from '$lib/stores/comparison.svelte';
	import { wikiThumb } from '$lib/config';

	interface Props {
		candidate: Candidate | null;
		isOpen: boolean;
		onClose: () => void;
		citySlug?: string;
		cityName?: string;
	}

	let { candidate, isOpen, onClose, citySlug = '', cityName = '' }: Props = $props();

	let isSelected = $derived(candidate ? comparison.isSelected(candidate.id) : false);

	function handleSelect() {
		if (candidate) {
			comparison.toggle(candidate, citySlug, cityName);
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	const rarityLabel = {
		legendary: 'Légendaire',
		rare: 'Prometteur',
		common: 'Espoir'
	};

	// Generate Qwant news search URL
	function getQwantNewsUrl(name: string): string {
		const query = encodeURIComponent(name);
		return `https://www.qwant.com/?l=fr&q=${query}&t=news`;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && candidate}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="bottom-sheet-backdrop"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<div
			class="bottom-sheet"
			role="dialog"
			aria-modal="true"
			aria-labelledby="sheet-title"
		>
			<!-- Drag handle -->
			<div class="sheet-handle">
				<div class="handle-bar"></div>
			</div>

			<div class="sheet-content">
				<!-- Header -->
				<div class="sheet-header">
					<div class="sheet-avatar-wrapper">
						<div class="sheet-avatar">
							{#if candidate.photo}
								<img src={wikiThumb(candidate.photo, 200)} alt={candidate.fullName} />
							{:else}
								<span class="avatar-initials">
									{candidate.firstName[0]}{candidate.lastName[0]}
								</span>
							{/if}
						</div>
						{#if candidate.photo && candidate.photoLegend}
							<span class="sheet-photo-credit">{candidate.photoLegend}</span>
						{/if}
					</div>
					<div class="sheet-header-info">
						<h2 id="sheet-title" class="sheet-name">{candidate.fullName}</h2>
						<p class="sheet-role">{candidate.demographics.profession}</p>
						<span class="sheet-rarity rarity-{candidate.rarity}">
							{rarityLabel[candidate.rarity]}
						</span>
					</div>
				</div>

				<!-- Stats -->
				<div class="sheet-stats">
					<div class="sheet-stat">
						<span class="stat-value">{candidate.demographics.age}</span>
						<span class="stat-label">ans</span>
					</div>
					<div class="sheet-stat">
						<span class="stat-value">{candidate.experience.totalYearsElected}</span>
						<span class="stat-label">ans exp.</span>
					</div>
				</div>

				<!-- Current mandate -->
				{#if candidate.experience.currentMandate}
					<div class="sheet-section">
						<h3 class="section-title">Mandat actuel</h3>
						<p class="section-content">
							{candidate.experience.currentMandate.role}
							{#if candidate.experience.currentMandate.since}
								<span class="text-muted">(depuis {candidate.experience.currentMandate.since})</span>
							{/if}
						</p>
					</div>
				{/if}

				<!-- Previous mandates -->
				{#if candidate.experience.previousMandates.length > 0}
					<div class="sheet-section">
						<h3 class="section-title">Mandats précédents</h3>
						<ul class="mandates-list">
							{#each candidate.experience.previousMandates as mandate}
								<li>
									{mandate.role}
									{#if mandate.from && mandate.to}
										<span class="text-muted">({mandate.from}-{mandate.to})</span>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Program highlights -->
				{#if candidate.programHighlights && candidate.programHighlights.length > 0}
					<div class="sheet-section">
						<h3 class="section-title">Programme</h3>
						<ul class="program-list">
							{#each candidate.programHighlights as highlight}
								<li>
									<span class="bullet">•</span>
									{highlight}
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Links section -->
				<div class="sheet-social">
					{#if candidate.socialLinks?.twitter}
						<a
							href={candidate.socialLinks.twitter}
							target="_blank"
							rel="noopener noreferrer"
							class="social-link"
							aria-label="Profil X (Twitter) de {candidate.fullName}"
						>
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
							</svg>
							X / Twitter
						</a>
					{/if}
					{#if candidate.socialLinks?.website}
						<a
							href={candidate.socialLinks.website}
							target="_blank"
							rel="noopener noreferrer"
							class="social-link"
							aria-label="Site web de {candidate.fullName}"
						>
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
							Site web
						</a>
					{/if}
					<!-- Qwant News Link -->
					<a
						href={getQwantNewsUrl(candidate.fullName)}
						target="_blank"
						rel="noopener noreferrer"
						class="social-link news-link"
						aria-label="Actualités sur {candidate.fullName}"
					>
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
						</svg>
						Actualités
					</a>
				</div>

				<!-- Actions -->
				<div class="sheet-actions">
					<button
						class="action-btn compare"
						class:selected={isSelected}
						onclick={handleSelect}
					>
						{isSelected ? 'Sélectionné ✓' : 'Comparer'}
					</button>
					<button class="action-btn close" onclick={onClose}>
						Fermer
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.bottom-sheet-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(10, 22, 40, 0.5);
		z-index: 100;
		display: flex;
		align-items: flex-end;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.bottom-sheet {
		width: 100%;
		max-height: 85vh;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		animation: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.sheet-handle {
		padding: 0.75rem;
		display: flex;
		justify-content: center;
		flex-shrink: 0;
	}

	.handle-bar {
		width: 40px;
		height: 4px;
		background: var(--color-cream-dark);
		border-radius: 2px;
	}

	.sheet-content {
		padding: 0 1.5rem 2rem;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		/* Safe area for bottom of screen */
		padding-bottom: calc(2rem + env(safe-area-inset-bottom));
	}

	.sheet-header {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.sheet-avatar-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.sheet-photo-credit {
		font-size: 0.55rem;
		color: var(--color-text-muted);
		max-width: 80px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: center;
	}

	.sheet-avatar {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		overflow: hidden;
		background: var(--color-navy);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sheet-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-initials {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		color: #faf8f5;
		opacity: 0.5;
	}

	.sheet-header-info {
		flex: 1;
	}

	.sheet-name {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.25rem;
	}

	.sheet-role {
		font-size: 0.9rem;
		color: var(--color-text-light);
		margin: 0 0 0.5rem;
	}

	.sheet-rarity {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.sheet-rarity.rarity-legendary {
		background: linear-gradient(135deg, var(--color-gold), var(--color-coral));
		color: var(--color-foreground);
	}

	.sheet-rarity.rarity-rare {
		background: linear-gradient(135deg, #94a3b8, #cbd5e1);
		color: #1e293b;
	}

	.sheet-rarity.rarity-common {
		background: #e2e8f0;
		color: #64748b;
	}

	.sheet-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		margin-bottom: 1.5rem;
	}

	.sheet-stat {
		text-align: center;
	}

	.sheet-stat .stat-value {
		display: block;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.sheet-stat .stat-label {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.sheet-section {
		margin-bottom: 1.25rem;
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.5rem;
	}

	.section-content {
		font-size: 0.95rem;
		color: var(--color-text);
		margin: 0;
	}

	.text-muted {
		color: var(--color-text-light);
	}

	.mandates-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.mandates-list li {
		font-size: 0.9rem;
		color: var(--color-text);
		padding: 0.25rem 0;
	}

	.program-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.program-list li {
		font-size: 0.9rem;
		color: var(--color-text);
		padding: 0.25rem 0;
		display: flex;
		gap: 0.5rem;
	}

	.bullet {
		color: var(--color-gold);
		font-weight: 700;
	}

	.sheet-social {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.social-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text);
		transition: background 0.2s ease;
	}

	.social-link:hover {
		background: var(--color-gold);
		color: var(--color-foreground);
	}

	.sheet-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: auto;
	}

	.action-btn {
		flex: 1;
		padding: 1rem;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 0.95rem;
		min-height: 52px;
		transition: all 0.2s ease;
	}

	.action-btn.compare {
		background: var(--color-navy);
		color: #faf8f5;
	}

	.action-btn.compare:hover {
		background: var(--color-navy-light);
	}

	.action-btn.compare.selected {
		background: var(--color-gold);
		color: var(--color-foreground);
	}

	.action-btn.close {
		background: var(--color-cream);
		color: var(--color-text);
	}

	.action-btn.close:hover {
		background: var(--color-cream-dark);
	}

	/* Hide on desktop - cards flip instead */
	@media (min-width: 768px) {
		.bottom-sheet-backdrop {
			display: none;
		}
	}
</style>
