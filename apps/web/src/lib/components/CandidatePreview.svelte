<script lang="ts">
	import type { Candidate } from '$lib/types/elections';
	import { comparison } from '$lib/stores/comparison.svelte';
	import { wikiThumb } from '$lib/config';

	interface Props {
		candidate: Candidate;
		compact?: boolean;
		citySlug?: string;
		cityName?: string;
	}

	let { candidate, compact = false, citySlug = '', cityName = '' }: Props = $props();

	let isExpanded = $state(false);
	let isSelected = $derived(comparison.isSelected(candidate.id));

	function toggleExpand() {
		isExpanded = !isExpanded;
	}

	function handleSelect(e: Event) {
		e.stopPropagation();
		comparison.toggle(candidate, citySlug, cityName);
	}

	// Truncate text helper
	function truncate(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength).trim() + '…';
	}

	// Rarity styling
	const rarityStyles = {
		legendary: { bg: 'bg-gradient-to-r from-amber-100 to-orange-50', border: 'border-amber-400', badge: 'bg-gradient-to-r from-amber-400 to-orange-400 text-amber-900' },
		rare: { bg: 'bg-gradient-to-r from-slate-100 to-slate-50', border: 'border-slate-300', badge: 'bg-slate-300 text-slate-700' },
		common: { bg: 'bg-white', border: 'border-gray-200', badge: 'bg-gray-200 text-gray-600' }
	};

	let style = $derived(rarityStyles[candidate.rarity] || rarityStyles.common);
</script>

<div
	class="candidate-preview {style.bg}"
	class:expanded={isExpanded}
	class:selected={isSelected}
>
	<!-- Main Row - Always Visible -->
	<div class="preview-main" role="button" tabindex="0" onclick={toggleExpand} onkeydown={(e) => e.key === 'Enter' && toggleExpand()}>
		<!-- Avatar -->
		<div class="preview-avatar">
			{#if candidate.photo}
				<img src={wikiThumb(candidate.photo, 80)} alt="" class="avatar-img" loading="lazy" />
			{:else}
				<span class="avatar-initials">
					{candidate.firstName[0]}{candidate.lastName[0]}
				</span>
			{/if}
			{#if candidate.isHead}
				<span class="head-badge" title="Tête de liste">★</span>
			{/if}
		</div>

		<!-- Info -->
		<div class="preview-info">
			<div class="info-top">
				<h4 class="preview-name">{candidate.fullName}</h4>
				{#if candidate.rarity !== 'common'}
					<span class="rarity-badge {style.badge}">
						{candidate.rarity === 'legendary' ? 'Légendaire' : 'Rare'}
					</span>
				{/if}
			</div>

			<!-- Positioning or Profession -->
			<p class="preview-role">
				{#if candidate.positioning}
					{truncate(candidate.positioning, compact ? 40 : 60)}
				{:else}
					{candidate.demographics.profession}
				{/if}
			</p>

			<!-- Main Proposition (if available) -->
			{#if !compact && candidate.programHighlights && candidate.programHighlights.length > 0}
				<p class="preview-highlight">
					<span class="highlight-dot">•</span>
					{truncate(candidate.programHighlights[0], 70)}
				</p>
			{/if}
		</div>

		<!-- Actions -->
		<div class="preview-actions">
			<button
				class="select-btn"
				class:selected={isSelected}
				onclick={handleSelect}
				title={isSelected ? 'Retirer de la comparaison' : 'Ajouter à la comparaison'}
			>
				{#if isSelected}
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
					</svg>
				{:else}
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
				{/if}
			</button>

			<span class="expand-icon" class:rotated={isExpanded}>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</span>
		</div>
	</div>

	<!-- Expanded Details -->
	{#if isExpanded}
		<div class="preview-expanded">
			<!-- Stats Row -->
			<div class="expanded-stats">
				<div class="stat">
					<span class="stat-value">{candidate.experience.totalYearsElected}</span>
					<span class="stat-label">ans d'exp.</span>
				</div>
				{#if candidate.experience.currentMandate}
					<div class="stat current-mandate">
						<span class="stat-value-small">{candidate.experience.currentMandate.role}</span>
						<span class="stat-label">depuis {candidate.experience.currentMandate.since}</span>
					</div>
				{/if}
			</div>

			<!-- Strengths & Weaknesses -->
			{#if candidate.strengths || candidate.weaknesses}
				<div class="sw-row">
					{#if candidate.strengths && candidate.strengths.length > 0}
						<div class="sw-col strengths">
							<span class="sw-title">
								<span class="sw-icon plus">+</span> Forces
							</span>
							{#each candidate.strengths.slice(0, 2) as strength}
								<span class="sw-item">{truncate(strength, 50)}</span>
							{/each}
						</div>
					{/if}
					{#if candidate.weaknesses && candidate.weaknesses.length > 0}
						<div class="sw-col weaknesses">
							<span class="sw-title">
								<span class="sw-icon minus">−</span> Faiblesses
							</span>
							{#each candidate.weaknesses.slice(0, 2) as weakness}
								<span class="sw-item">{truncate(weakness, 50)}</span>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Chance Estimate -->
			{#if candidate.chanceEstimate}
				<div class="chance-row">
					<span class="chance-label">Chances :</span>
					<span class="chance-value">{candidate.chanceEstimate}</span>
				</div>
			{/if}

			<!-- Program Highlights -->
			{#if candidate.programHighlights && candidate.programHighlights.length > 1}
				<div class="program-highlights">
					<span class="highlights-title">Programme :</span>
					<ul class="highlights-list">
						{#each candidate.programHighlights.slice(0, 3) as highlight}
							<li>{truncate(highlight, 80)}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.candidate-preview {
		border-radius: var(--radius-md);
		border: 1px solid var(--color-card-border);
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.candidate-preview:hover {
		border-color: var(--color-gold-light);
		box-shadow: 0 2px 8px rgba(201, 169, 98, 0.15);
	}

	.candidate-preview.selected {
		border-color: var(--color-gold);
		box-shadow: 0 0 0 2px var(--color-gold), 0 4px 12px rgba(201, 169, 98, 0.25);
	}

	.preview-main {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		cursor: pointer;
	}

	/* Avatar */
	.preview-avatar {
		position: relative;
		width: 44px;
		height: 44px;
		flex-shrink: 0;
		border-radius: 50%;
		overflow: hidden;
		background: var(--color-navy);
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-initials {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		color: #faf8f5;
		opacity: 0.7;
	}

	.head-badge {
		position: absolute;
		bottom: -2px;
		right: -2px;
		width: 16px;
		height: 16px;
		background: var(--color-gold);
		color: var(--color-foreground);
		font-size: 0.6rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Info */
	.preview-info {
		flex: 1;
		min-width: 0;
	}

	.info-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.preview-name {
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.rarity-badge {
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.preview-role {
		font-size: 0.8rem;
		color: var(--color-text-light);
		margin: 0.125rem 0 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.preview-highlight {
		display: flex;
		align-items: flex-start;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: var(--color-text);
		margin: 0.375rem 0 0;
		line-height: 1.3;
	}

	.highlight-dot {
		color: var(--color-gold);
		flex-shrink: 0;
	}

	/* Actions */
	.preview-actions {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.select-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--color-cream);
		color: var(--color-text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}

	.select-btn:hover {
		background: var(--color-navy);
		color: #faf8f5;
	}

	.select-btn.selected {
		background: var(--color-gold);
		color: var(--color-foreground);
	}

	.expand-icon {
		color: var(--color-text-muted);
		transition: transform 0.2s ease;
	}

	.expand-icon.rotated {
		transform: rotate(180deg);
		color: var(--color-gold);
	}

	/* Expanded Content */
	.preview-expanded {
		padding: 0 0.75rem 0.75rem;
		animation: slideDown 0.2s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.expanded-stats {
		display: flex;
		gap: 1rem;
		padding: 0.625rem;
		background: rgba(250, 248, 245, 0.8);
		border-radius: var(--radius-sm);
		margin-bottom: 0.625rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
	}

	.stat-value {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.stat-value-small {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.stat-label {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.current-mandate {
		flex: 1;
		align-items: flex-start;
		border-left: 1px solid var(--color-card-border);
		padding-left: 0.75rem;
	}

	/* Strengths/Weaknesses */
	.sw-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		margin-bottom: 0.625rem;
	}

	.sw-col {
		padding: 0.5rem;
		border-radius: var(--radius-sm);
	}

	.sw-col.strengths {
		background: rgba(74, 157, 110, 0.08);
	}

	.sw-col.weaknesses {
		background: rgba(224, 122, 95, 0.08);
	}

	.sw-title {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		margin-bottom: 0.375rem;
	}

	.strengths .sw-title {
		color: var(--color-success);
	}

	.weaknesses .sw-title {
		color: var(--color-coral);
	}

	.sw-icon {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		font-weight: 700;
		color: white;
	}

	.sw-icon.plus {
		background: var(--color-success);
	}

	.sw-icon.minus {
		background: var(--color-coral);
	}

	.sw-item {
		display: block;
		font-size: 0.75rem;
		color: var(--color-text);
		line-height: 1.3;
		margin-bottom: 0.25rem;
	}

	.sw-item:last-child {
		margin-bottom: 0;
	}

	/* Chance */
	.chance-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem;
		background: var(--color-cream);
		border-radius: var(--radius-sm);
		margin-bottom: 0.625rem;
	}

	.chance-label {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.chance-value {
		font-size: 0.8rem;
		color: var(--color-foreground);
		font-weight: 500;
	}

	/* Program */
	.program-highlights {
		padding: 0.5rem;
		background: rgba(201, 169, 98, 0.08);
		border-radius: var(--radius-sm);
		border-left: 2px solid var(--color-gold);
	}

	.highlights-title {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 0.375rem;
	}

	.highlights-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.highlights-list li {
		font-size: 0.75rem;
		color: var(--color-text);
		line-height: 1.4;
		padding-left: 0.875rem;
		position: relative;
		margin-bottom: 0.25rem;
	}

	.highlights-list li::before {
		content: '→';
		position: absolute;
		left: 0;
		color: var(--color-gold);
		font-weight: 600;
	}

	.highlights-list li:last-child {
		margin-bottom: 0;
	}
</style>
