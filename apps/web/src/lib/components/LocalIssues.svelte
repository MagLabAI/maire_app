<script lang="ts">
	import type { LocalIssue } from '$lib/types/elections';

	interface Props {
		issues: LocalIssue[];
		cityName: string;
		maxVisible?: number;
	}

	let { issues, cityName, maxVisible = 5 }: Props = $props();

	let isExpanded = $state(false);
	let expandedIssue = $state<number | null>(null);

	let visibleIssues = $derived(isExpanded ? issues : issues.slice(0, maxVisible));
	let hasMore = $derived(issues.length > maxVisible);

	function toggleIssueDetail(rank: number) {
		expandedIssue = expandedIssue === rank ? null : rank;
	}

	// Check if issue has expandable details
	function hasDetails(issue: LocalIssue): boolean {
		return !!(issue.affectedPopulation || issue.currentStatus || (issue.proposedSolutions && issue.proposedSolutions.length > 0));
	}
</script>

{#if issues.length > 0}
	<div class="issues-container">
		<header class="issues-header">
			<h2 class="issues-title">
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
				Enjeux locaux à {cityName}
			</h2>
			<span class="issues-count">{issues.length} enjeux</span>
		</header>

		<ul class="issues-list">
			{#each visibleIssues as item (item.rank)}
				<li class="issue-item" class:expanded={expandedIssue === item.rank}>
					<button
						class="issue-main"
						onclick={() => hasDetails(item) && toggleIssueDetail(item.rank)}
						disabled={!hasDetails(item)}
					>
						<span class="issue-rank">{item.rank}</span>
						<div class="issue-content">
							<div class="issue-name">{item.issue}</div>
							{#if item.description}
								<p class="issue-description">{item.description}</p>
							{/if}
						</div>
						{#if hasDetails(item)}
							<svg
								class="expand-icon"
								class:rotated={expandedIssue === item.rank}
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						{/if}
					</button>

					<!-- Expanded Details -->
					{#if expandedIssue === item.rank && hasDetails(item)}
						<div class="issue-details">
							{#if item.affectedPopulation}
								<div class="detail-block">
									<h4 class="detail-label">
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
										Population concernée
									</h4>
									<p class="detail-text">{item.affectedPopulation}</p>
								</div>
							{/if}

							{#if item.currentStatus}
								<div class="detail-block">
									<h4 class="detail-label">
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										Situation actuelle
									</h4>
									<p class="detail-text">{item.currentStatus}</p>
								</div>
							{/if}

							{#if item.proposedSolutions && item.proposedSolutions.length > 0}
								<div class="detail-block solutions">
									<h4 class="detail-label">
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
										</svg>
										Solutions proposées
									</h4>
									<ul class="solutions-list">
										{#each item.proposedSolutions as solution}
											<li>{solution}</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>

		{#if hasMore}
			<button class="issues-toggle" onclick={() => (isExpanded = !isExpanded)}>
				{#if isExpanded}
					Voir moins
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
					</svg>
				{:else}
					Voir les {issues.length} enjeux
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				{/if}
			</button>
		{/if}
	</div>
{/if}

<style>
	.issues-container {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
	}

	.issues-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: var(--color-navy);
		color: #faf8f5;
	}

	.issues-title {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		color: #faf8f5;
	}

	.issues-count {
		font-size: 0.8rem;
		background: rgba(255, 255, 255, 0.15);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
	}

	.issues-list {
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.issue-item {
		border-bottom: 1px solid var(--color-card-border);
		transition: background 0.2s ease;
	}

	.issue-item:last-child {
		border-bottom: none;
	}

	.issue-item:hover {
		background: rgba(250, 248, 245, 0.5);
	}

	.issue-item.expanded {
		background: var(--color-cream);
	}

	.issue-main {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem 1.5rem;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.issue-main:disabled {
		cursor: default;
	}

	.issue-rank {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		background: var(--color-gold);
		color: var(--color-foreground);
		font-weight: 700;
		font-size: 0.85rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.issue-content {
		flex: 1;
		min-width: 0;
	}

	.issue-name {
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.25rem;
	}

	.issue-description {
		font-size: 0.9rem;
		color: var(--color-text-light);
		margin: 0;
		line-height: 1.5;
	}

	.expand-icon {
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		color: var(--color-text-muted);
		transition: transform 0.2s ease;
		margin-top: 0.25rem;
	}

	.expand-icon.rotated {
		transform: rotate(180deg);
		color: var(--color-gold);
	}

	.issue-details {
		padding: 0 1.5rem 1rem 4rem;
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

	.detail-block {
		margin-bottom: 1rem;
	}

	.detail-block:last-child {
		margin-bottom: 0;
	}

	.detail-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.5rem;
	}

	.detail-text {
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.5;
		margin: 0;
		padding: 0.75rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--color-card-border);
	}

	.solutions-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.solutions-list li {
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.4;
		padding: 0.5rem 0.75rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-sm);
		border-left: 3px solid var(--color-success);
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.solutions-list li::before {
		content: '→';
		color: var(--color-success);
		font-weight: 700;
	}

	.issues-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem;
		background: var(--color-cream);
		border: none;
		border-top: 1px solid var(--color-card-border);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-gold);
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.issues-toggle:hover {
		background: var(--color-cream-dark);
	}

	@media (max-width: 640px) {
		.issues-header {
			padding: 0.875rem 1rem;
		}

		.issue-main {
			padding: 0.875rem 1rem;
		}

		.issue-details {
			padding: 0 1rem 1rem 3.25rem;
		}

		.issues-title {
			font-size: 0.9rem;
		}
	}
</style>
