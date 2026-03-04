<script lang="ts">
	import type { Candidate } from '$lib/types/elections';
	import { comparison } from '$lib/stores/comparison.svelte';
	import { wikiThumb } from '$lib/config';

	interface Props {
		candidate: Candidate;
		showSelect?: boolean;
		programUrl?: string;
		listName?: string;
		citySlug?: string;
		cityName?: string;
		isPastElection?: boolean;
		isStub?: boolean;
		onInterest?: () => void;
	}

	let { candidate, showSelect = true, programUrl, listName, citySlug = '', cityName = '', isPastElection = false, isStub = false, onInterest }: Props = $props();

	let isFlipped = $state(false);
	let isSelected = $derived(comparison.isSelected(candidate.id));

	function handleFlip(e: Event) {
		const target = e.target as HTMLElement;
		if (target.closest('a, button')) return;
		isFlipped = !isFlipped;
	}

	function handleSelect(e: Event) {
		e.stopPropagation();
		comparison.toggle(candidate, citySlug, cityName);
	}

	const rarityClass: Record<string, string> = {
		legendary: 'card-legendary',
		rare: 'card-rare',
		common: ''
	};

	const rarityLabel: Record<string, string> = {
		legendary: 'Sortant',
		rare: 'Expérimenté',
		common: 'Renouveau'
	};

	const rarityColors: Record<string, string> = {
		legendary: 'bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-coral)] text-[var(--color-navy)]',
		rare: 'bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800',
		common: 'bg-slate-200 text-slate-600'
	};

	let experienceLabel = $derived(() => {
		const years = candidate.experience.totalYearsElected;
		if (years === 0) return 'Nouveau';
		return `${years} an${years > 1 ? 's' : ''} d'exp.`;
	});

	let photoSrc = $derived(candidate.photo ? wikiThumb(candidate.photo) : '');

	function getNewsSearchUrl(name: string): string {
		const searchTerms = isPastElection ? `${name} 2020 municipale` : name;
		return `https://www.qwant.com/?l=fr&q=${encodeURIComponent(searchTerms)}&t=news`;
	}
</script>

<div
	class="card-container"
	style="perspective: 1000px;"
	role="button"
	tabindex="0"
	onclick={handleFlip}
	onkeydown={(e) => e.key === 'Enter' && handleFlip(e)}
>
	<div class="card-flipper" class:flipped={isFlipped}>
		<!-- ═══ FRONT ═══ -->
		<div class="card-face card-front card-holo {rarityClass[candidate.rarity]} {isSelected ? 'card-selected' : ''}">
			<!-- Photo -->
			<div class="card-photo">
				{#if candidate.photo}
					<img src={photoSrc} alt={candidate.fullName} class="w-full h-full object-cover" loading="lazy" />
					{#if candidate.photoLegend}
						<div class="photo-credit">{candidate.photoLegend}</div>
					{/if}
				{:else}
					<div class="w-full h-full bg-gradient-to-br from-[var(--color-navy-light)] to-[var(--color-navy)] flex items-center justify-center">
						<span class="text-2xl sm:text-4xl font-display font-bold text-[#faf8f5] opacity-50">
							{candidate.firstName[0]}{candidate.lastName[0]}
						</span>
					</div>
				{/if}

				<!-- Rarity (top left) -->
				<div class="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5">
					<span class="px-1.5 py-0.5 text-[0.55rem] sm:text-xs font-bold rounded-full {rarityColors[candidate.rarity]}">
						{rarityLabel[candidate.rarity]}
					</span>
				</div>

				<!-- Check (top right) -->
				{#if isSelected}
					<div class="check-badge absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-5 h-5 sm:w-6 sm:h-6 bg-[var(--color-gold)] text-[var(--color-navy)] rounded-full flex items-center justify-center font-bold text-[0.55rem] sm:text-xs z-20">✓</div>
				{/if}

				<!-- Actus + Programme buttons (bottom right of photo) -->
				<div class="photo-actions">
					<a href={getNewsSearchUrl(candidate.fullName)} target="_blank" rel="noopener noreferrer" title="Actualités sur {candidate.fullName}" class="photo-action-link">
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
						Actus
					</a>
					{#if programUrl}
						<a href={programUrl} target="_blank" rel="noopener noreferrer" title="Programme de {candidate.fullName}" class="photo-action-link program-link">
							<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
							Programme
						</a>
					{/if}
				</div>

				<!-- Head of list (bottom left) -->
				{#if candidate.isHead && !isPastElection}
					<div class="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2.5">
						<span class="px-1.5 py-0.5 text-[0.55rem] sm:text-xs font-bold bg-[var(--color-navy)] text-[var(--color-gold)] rounded-full">Tête de liste</span>
					</div>
				{/if}

				{#if isPastElection && candidate.electionResult}
					<div class="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2.5">
						<span class="election-result-badge" class:elected={candidate.electionResult.elected}>
							{#if candidate.electionResult.elected}✓ {candidate.electionResult.role || 'Élu'}{:else}Non élu{/if}
						</span>
					</div>
				{/if}
			</div>

			<!-- Info -->
			<div class="card-info">
				<div class="card-top">
					<h3 class="card-name">{candidate.fullName}</h3>
					<p class="card-profession">{candidate.demographics.profession}</p>
				</div>

				{#if listName}
					<span class="card-list-name" title={listName}>{listName}</span>
				{/if}

				<div class="card-middle">
					{#if isStub}
						<div class="stub-content">
							<span class="stub-badge-inline">Analyse en cours</span>
							<button
								class="stub-interest-btn"
								onclick={(e) => {
									e.stopPropagation();
									const btn = e.currentTarget;
									btn.classList.add('interest-sent');
									btn.disabled = true;
									if (onInterest) onInterest();
								}}
							>
								<span class="interest-default">Ce candidat m'intéresse !</span>
								<span class="interest-thanks">Merci !</span>
							</button>
						</div>
					{:else}
						{#if candidate.positioning}
							<p class="card-positioning">{candidate.positioning}</p>
						{/if}

						{#if candidate.programHighlights?.length}
							<div class="card-program-teaser">
								{#each candidate.programHighlights.slice(0, 2) as h}
									<span class="teaser-item">{h}</span>
								{/each}
							</div>
						{/if}
					{/if}
				</div>

				<div class="card-bottom">
					<div class="card-experience">
						<span class="exp-label">{experienceLabel()}</span>
						{#if candidate.experience.currentMandate?.role}
							<span class="exp-dot">·</span>
							<span class="exp-role">{candidate.experience.currentMandate.role}</span>
						{/if}
					</div>

					{#if showSelect && !isPastElection}
						<button class="card-action-btn" class:selected={isSelected} onclick={handleSelect}>
							{isSelected ? 'Sélectionné ✓' : 'Comparer'}
						</button>
					{:else if isPastElection && candidate.electionResult}
						<div class="past-result-summary">
							{#if candidate.electionResult.elected}
								<span class="result-elected">✓ Élu{candidate.electionResult.role ? ` - ${candidate.electionResult.role}` : ''}</span>
							{:else}
								<span class="result-not-elected">Non élu</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- ═══ BACK ═══ -->
		<div class="card-face card-back">
			<div class="back-content">
				<h3 class="back-name">{candidate.fullName}</h3>

				{#if candidate.positioning}
					<div class="positioning-badge">{candidate.positioning}</div>
				{/if}

				{#if candidate.experience.currentMandate}
					<div class="back-mandate">
						<span class="mandate-label">Mandat</span>
						<span class="mandate-value">
							{candidate.experience.currentMandate.role}
							{#if candidate.experience.currentMandate.since}
								<span class="mandate-since">(depuis {candidate.experience.currentMandate.since})</span>
							{/if}
						</span>
					</div>
				{/if}

				{#if candidate.strengths || candidate.weaknesses}
					<div class="sw-grid">
						{#if candidate.strengths?.length}
							<div class="sw-block strengths">
								<h4 class="sw-label"><span class="sw-icon">+</span> Forces</h4>
								<ul class="sw-list">
									{#each candidate.strengths.slice(0, 2) as s}<li>{s}</li>{/each}
								</ul>
							</div>
						{/if}
						{#if candidate.weaknesses?.length}
							<div class="sw-block weaknesses">
								<h4 class="sw-label"><span class="sw-icon">-</span> Faiblesses</h4>
								<ul class="sw-list">
									{#each candidate.weaknesses.slice(0, 2) as w}<li>{w}</li>{/each}
								</ul>
							</div>
						{/if}
					</div>
				{/if}

				{#if candidate.programHighlights?.length}
					<ul class="back-highlights">
						{#each candidate.programHighlights.slice(0, 3) as h}<li>{h}</li>{/each}
					</ul>
				{/if}

				<!-- Links row -->
				<div class="back-links">
					{#if candidate.socialLinks?.twitter}
						<a href={candidate.socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" class="link-btn" onclick={(e) => e.stopPropagation()}>
							<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
						</a>
					{/if}
					{#if candidate.socialLinks?.website}
						<a href={candidate.socialLinks.website} target="_blank" rel="noopener noreferrer" aria-label="Site web" class="link-btn" onclick={(e) => e.stopPropagation()}>
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
						</a>
					{/if}
					<a href={getNewsSearchUrl(candidate.fullName)} target="_blank" rel="noopener noreferrer" title="Actualités sur {candidate.fullName}" class="link-btn" onclick={(e) => e.stopPropagation()}>
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012-2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
						<span class="link-text">Actus</span>
					</a>
					{#if programUrl}
						<a href={programUrl} target="_blank" rel="noopener noreferrer" title="Programme de {candidate.fullName}" class="link-btn program" onclick={(e) => e.stopPropagation()}>
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
							<span class="link-text">Programme</span>
						</a>
					{/if}
				</div>

				<p class="back-hint">Tap pour retourner</p>
			</div>
		</div>
	</div>
</div>

<style>
	/* Container — square on mobile, 3:4 on 2-column+ */
	.card-container {
		width: 100%;
		max-width: 440px;
		aspect-ratio: 1 / 1;
		cursor: pointer;
	}

	@media (min-width: 640px) {
		.card-container {
			max-width: 380px;
			aspect-ratio: 3 / 4;
		}
	}

	.card-flipper {
		position: relative;
		width: 100%;
		height: 100%;
		transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
		transform-style: preserve-3d;
	}

	.card-flipper.flipped {
		transform: rotateY(180deg);
	}

	.card-face {
		position: absolute;
		width: 100%;
		height: 100%;
		backface-visibility: hidden;
		border-radius: var(--radius-lg);
		background: var(--color-card-bg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
		transition: box-shadow 0.3s ease, transform 0.3s ease;
	}

	.card-front {
		display: flex;
		flex-direction: column;
	}

	.card-front:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-card-hover);
	}

	.card-back {
		transform: rotateY(180deg);
		padding: 0.6rem;
		overflow-y: auto;
	}

	@media (min-width: 640px) {
		.card-back { padding: 0.8rem; }
	}

	/* ─── Photo ─── */
	.card-photo {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		overflow: hidden;
		flex-shrink: 0;
	}

	.card-photo :global(img) {
		object-position: center;
	}

	@media (min-width: 640px) {
		.card-photo {
			aspect-ratio: 16 / 9;
		}
	}

	.photo-credit {
		position: absolute;
		bottom: 0;
		right: 0;
		padding: 0.1rem 0.35rem;
		background: rgba(0, 0, 0, 0.6);
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.5rem;
		line-height: 1.2;
		border-top-left-radius: 4px;
		max-width: 55%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.photo-actions {
		position: absolute;
		bottom: 0.3rem;
		right: 0.3rem;
		display: flex;
		gap: 0.2rem;
		z-index: 15;
	}

	.photo-action-link {
		display: flex;
		align-items: center;
		gap: 0.15rem;
		padding: 0.25rem 0.4rem;
		min-height: 28px;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(4px);
		border-radius: var(--radius-sm);
		font-size: 0.6rem;
		font-weight: 600;
		color: white;
		text-decoration: none;
		transition: background 0.2s ease;
		white-space: nowrap;
	}

	@media (min-width: 640px) {
		.photo-action-link { padding: 0.35rem 0.5rem; min-height: 32px; font-size: 0.65rem; gap: 0.2rem; }
	}

	.photo-action-link:hover {
		background: var(--color-gold);
		color: var(--color-navy);
	}

	.photo-action-link.program-link {
		background: rgba(201, 169, 98, 0.85);
		color: var(--color-navy);
	}

	.photo-action-link.program-link:hover {
		background: var(--color-gold);
	}

	.photo-action-link svg { flex-shrink: 0; }

	/* ─── Front info ─── */
	.card-info {
		padding: 0.5rem 0.6rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		flex: 1;
		min-height: 0;
		min-width: 0;
		gap: 0.2rem;
		overflow: hidden;
	}

	@media (min-width: 640px) {
		.card-info {
			padding: 0.6rem 0.75rem;
			gap: 0.35rem;
		}
	}

	/* Top: name + profession, always at top */
	.card-top {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.card-name {
		font-family: var(--font-display);
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--color-foreground);
		line-height: 1.15;
		letter-spacing: -0.01em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (min-width: 640px) {
		.card-name { font-size: 1rem; }
	}

	.card-profession {
		font-size: 0.75rem;
		color: var(--color-text-light);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-list-name {
		display: block;
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--color-gold);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		letter-spacing: 0.01em;
		cursor: default;
	}

	.card-middle {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		flex: 1;
		justify-content: center;
		min-height: 0;
		overflow: hidden;
	}

	@media (min-width: 640px) {
		.card-middle {
			gap: 0.3rem;
		}
	}

	.card-positioning {
		font-size: 0.75rem;
		color: var(--color-text);
		line-height: 1.35;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-program-teaser {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.teaser-item {
		padding: 0.15rem 0.4rem;
		background: rgba(201, 169, 98, 0.08);
		border: 1px solid rgba(201, 169, 98, 0.18);
		border-radius: var(--radius-full);
		font-size: 0.65rem;
		font-weight: 500;
		color: var(--color-text);
		line-height: 1.3;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Bottom: experience + action */
	.card-bottom {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.25rem;
	}

	@media (min-width: 640px) {
		.card-bottom { gap: 0.35rem; }
	}

	.card-experience {
		display: flex;
		align-items: baseline;
		gap: 0.2rem;
		font-size: 0.7rem;
	}

	.exp-label { font-weight: 600; color: var(--color-foreground); white-space: nowrap; }
	.exp-dot { color: var(--color-text-muted); }
	.exp-role { color: var(--color-text-muted); }

	.card-action-btn {
		padding: 0.4rem 0.7rem;
		background: var(--color-navy);
		color: #faf8f5;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 0.75rem;
		text-align: center;
		transition: all 0.2s ease;
		cursor: pointer;
		letter-spacing: 0.01em;
		white-space: nowrap;
	}
	.card-action-btn:hover { background: var(--color-navy-light); transform: translateY(-1px); }
	.card-action-btn.selected { background: var(--color-gold); color: var(--color-navy); }

	:global(.card-selected) {
		box-shadow: 0 0 0 3px var(--color-gold), 0 0 30px rgba(201, 169, 98, 0.4) !important;
		animation: select-pop 0.3s ease-out;
	}

	@keyframes select-pop {
		0% { transform: scale(1); }
		50% { transform: scale(1.02); }
		100% { transform: scale(1); }
	}

	.check-badge { animation: badge-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

	@keyframes badge-pop {
		0% { transform: scale(0); opacity: 0; }
		100% { transform: scale(1); opacity: 1; }
	}

	.election-result-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.3rem 0.5rem;
		border-radius: var(--radius-full);
		font-size: 0.7rem;
		font-weight: 700;
		background: rgba(107, 114, 128, 0.9);
		color: white;
	}
	.election-result-badge.elected { background: var(--color-success); }

	.past-result-summary {
		margin-top: auto;
		text-align: center;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 0.85rem;
	}
	.result-elected { display: block; padding: 0.5rem; background: var(--color-success); color: white; border-radius: var(--radius-md); }
	.result-not-elected { display: block; padding: 0.5rem; background: var(--color-cream); color: var(--color-text-muted); border-radius: var(--radius-md); }

	/* ─── Back ─── */
	.back-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 0.4rem;
	}

	@media (min-width: 640px) {
		.back-content { gap: 0.5rem; }
	}

	.back-name {
		font-family: var(--font-display);
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	@media (min-width: 640px) {
		.back-name { font-size: 1rem; }
	}

	.positioning-badge {
		padding: 0.3rem 0.4rem;
		background: var(--color-cream);
		border-left: 2px solid var(--color-gold);
		border-radius: var(--radius-sm);
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--color-foreground);
		line-height: 1.35;
	}

	@media (min-width: 640px) {
		.positioning-badge { font-size: 0.75rem; padding: 0.4rem 0.5rem; }
	}

	.back-mandate {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.mandate-label { font-size: 0.6rem; font-weight: 600; text-transform: uppercase; color: var(--color-text); letter-spacing: 0.03em; }
	.mandate-value { font-size: 0.75rem; color: var(--color-text); }
	.mandate-since { color: var(--color-text-light); font-size: 0.7rem; }

	/* Strengths / Weaknesses */
	.sw-grid { display: flex; flex-direction: column; gap: 0.3rem; }
	.sw-block { padding: 0.35rem; border-radius: var(--radius-sm); }
	.sw-block.strengths { background: rgba(74, 157, 110, 0.1); }
	.sw-block.weaknesses { background: rgba(224, 122, 95, 0.1); }
	.sw-label { display: flex; align-items: center; gap: 0.2rem; font-size: 0.6rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 0.2rem; }
	.strengths .sw-label { color: var(--color-success); }
	.weaknesses .sw-label { color: var(--color-coral); }
	.sw-icon { width: 13px; height: 13px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 700; }
	.strengths .sw-icon { background: var(--color-success); color: white; }
	.weaknesses .sw-icon { background: var(--color-coral); color: white; }
	.sw-list { list-style: none; padding: 0; margin: 0; }
	.sw-list li { font-size: 0.7rem; color: var(--color-text); line-height: 1.3; margin-bottom: 0.1rem; }

	@media (min-width: 640px) {
		.sw-grid { gap: 0.4rem; }
		.sw-block { padding: 0.4rem; }
		.sw-list li { font-size: 0.75rem; }
	}

	.back-highlights {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.back-highlights li {
		font-size: 0.7rem;
		color: var(--color-text);
		line-height: 1.3;
		padding-left: 0.8rem;
		position: relative;
		margin-bottom: 0.1rem;
	}
	.back-highlights li::before {
		content: '→';
		position: absolute;
		left: 0;
		color: var(--color-gold);
		font-weight: 600;
	}

	/* Links row at bottom of back */
	.back-links {
		display: flex;
		gap: 0.3rem;
		margin-top: auto;
		padding-top: 0.4rem;
		flex-wrap: wrap;
	}



	.link-btn {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		padding: 0.35rem 0.45rem;
		min-height: 32px;
		background: var(--color-cream-dark);
		border-radius: var(--radius-md);
		color: var(--color-text);
		font-size: 0.7rem;
		transition: all 0.2s ease;
		text-decoration: none;
	}

	.link-btn:hover { background: var(--color-gold); color: var(--color-navy); }
	.link-btn.program { background: rgba(201, 169, 98, 0.2); color: var(--color-foreground); }
	.link-btn.program:hover { background: var(--color-gold); color: var(--color-navy); }
	.link-text { font-size: 0.65rem; font-weight: 500; }

	.back-hint {
		font-size: 0.6rem;
		color: var(--color-text-light);
		text-align: center;
		margin-top: 0.2rem;
	}

	/* ─── Stub content (replaces card-middle for unresearched candidates) ─── */
	.stub-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		justify-content: center;
		flex: 1;
	}

	.stub-badge-inline {
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-gold);
		background: rgba(201, 169, 98, 0.12);
		padding: 0.2rem 0.5rem;
		border-radius: var(--radius-sm);
	}

	.stub-interest-btn {
		padding: 0.4rem 0.7rem;
		background: var(--color-gold);
		color: var(--color-navy);
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 0.72rem;
		text-align: center;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
		font-family: var(--font-body);
	}

	.stub-interest-btn:hover {
		filter: brightness(1.05);
	}

	.stub-interest-btn .interest-thanks {
		display: none;
	}

	.stub-interest-btn.interest-sent .interest-default {
		display: none;
	}

	.stub-interest-btn.interest-sent .interest-thanks {
		display: inline;
	}

	.stub-interest-btn.interest-sent {
		background: var(--color-success);
		color: white;
	}

	/* ─── Mobile overlay: full-bleed photo with text at bottom ─── */
	@media (max-width: 639.99px) {
		.card-photo {
			position: absolute;
			inset: 0;
		}

		.card-info {
			position: relative;
			z-index: 5;
			flex: none;
			margin-top: auto;
			padding-top: 2rem;
			background: linear-gradient(transparent, rgba(10, 22, 40, 0.85) 40%);
			overflow: visible;
		}

		.card-name { color: #faf8f5; }
		.card-profession { color: rgba(255, 255, 255, 0.75); }
		.card-list-name { color: var(--color-gold-light); }
		.card-positioning { color: rgba(255, 255, 255, 0.85); font-size: 0.68rem; -webkit-line-clamp: 1; }
		.teaser-item { background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.2); color: rgba(255, 255, 255, 0.9); font-size: 0.6rem; }
		.exp-label { color: #faf8f5; }
		.exp-dot { color: rgba(255, 255, 255, 0.6); }
		.exp-role { color: rgba(255, 255, 255, 0.6); }
		.card-action-btn { background: var(--color-gold); color: var(--color-navy); }
		.card-action-btn:hover { background: var(--color-gold-light); color: var(--color-navy); }
		.card-action-btn.selected { background: rgba(255, 255, 255, 0.9); color: var(--color-navy); }

		.stub-badge-inline { color: var(--color-gold-light); background: rgba(255, 255, 255, 0.12); }
		.stub-interest-btn { background: rgba(255, 255, 255, 0.9); color: var(--color-navy); }

		.photo-actions { bottom: auto; top: 0.5rem; right: 0.3rem; }
	}
</style>
