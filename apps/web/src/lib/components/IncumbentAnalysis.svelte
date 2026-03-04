<script lang="ts">
	import type { IncumbentAnalysis } from '$lib/types/elections';

	interface Props {
		analysis: IncumbentAnalysis;
	}

	let { analysis }: Props = $props();

	let isExpanded = $state(false);

	// Helper to format years
	function yearsSince(year: number): string {
		const years = 2026 - year;
		return `${years} an${years > 1 ? 's' : ''}`;
	}
</script>

{#if analysis}
	<div class="incumbent-analysis">
		<header class="analysis-header">
			<div class="header-content">
				<h2 class="analysis-title">
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
					Maire sortant
				</h2>
				<div class="mayor-name">
					{analysis.currentMayor.name}
					<span class="mayor-party">({analysis.currentMayor.party})</span>
				</div>
			</div>
			<div class="tenure-badge">
				depuis {analysis.currentMayor.since}
			</div>
		</header>

		<div class="analysis-content">
			<!-- Mayor Profile -->
			<div class="mayor-profile">
				{#if analysis.currentMayor.profession}
					<span class="profile-item">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						{analysis.currentMayor.profession}
					</span>
				{/if}
				{#if analysis.currentMayor.age}
					<span class="profile-item">
						{analysis.currentMayor.age} ans
					</span>
				{/if}
			</div>

			{#if analysis.currentMayor.politicalBackground}
				<p class="political-background">{analysis.currentMayor.politicalBackground}</p>
			{/if}

			<!-- Mandate Assessment -->
			{#if analysis.mandateAssessment}
				<div class="mandate-section">
					<h3 class="section-title">Bilan du mandat</h3>

					<!-- Achievements -->
					{#if analysis.mandateAssessment.majorAchievements && analysis.mandateAssessment.majorAchievements.length > 0}
						<div class="assessment-block achievements">
							<h4 class="block-label">
								<span class="label-icon success">+</span>
								Réalisations
							</h4>
							<ul class="assessment-list">
								{#each analysis.mandateAssessment.majorAchievements as achievement}
									<li>{achievement}</li>
								{/each}
							</ul>
						</div>
					{/if}

					<!-- Controversies -->
					{#if analysis.mandateAssessment.controversies && analysis.mandateAssessment.controversies.length > 0}
						<div class="assessment-block controversies">
							<h4 class="block-label">
								<span class="label-icon warning">!</span>
								Points de friction
							</h4>
							<ul class="assessment-list">
								{#each analysis.mandateAssessment.controversies as controversy}
									<li>{controversy}</li>
								{/each}
							</ul>
						</div>
					{/if}

					<!-- Unfinished Projects -->
					{#if analysis.mandateAssessment.unfinishedProjects && analysis.mandateAssessment.unfinishedProjects.length > 0}
						<div class="assessment-block projects">
							<h4 class="block-label">
								<span class="label-icon neutral">...</span>
								Projets en cours
							</h4>
							<ul class="assessment-list">
								{#each analysis.mandateAssessment.unfinishedProjects as project}
									<li>{project}</li>
								{/each}
							</ul>
						</div>
					{/if}

					<!-- Public Perception -->
					{#if analysis.mandateAssessment.publicPerception}
						<div class="perception-box">
							<h4 class="perception-label">Perception publique</h4>
							<p class="perception-text">{analysis.mandateAssessment.publicPerception}</p>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Reelection Likelihood -->
			{#if analysis.reelectionLikelihood}
				<div class="reelection-section">
					<h3 class="section-title">
						Chances de réélection
						{#if analysis.reelectionLikelihood.runningAgain}
							<span class="running-badge">Maire se représente</span>
						{:else}
							<span class="running-badge not-running">Maire ne se représente pas</span>
						{/if}
					</h3>

					{#if analysis.reelectionLikelihood.chancesEstimate}
						<p class="chances-estimate">{analysis.reelectionLikelihood.chancesEstimate}</p>
					{/if}

					<div class="strengths-weaknesses">
						{#if analysis.reelectionLikelihood.strengths && analysis.reelectionLikelihood.strengths.length > 0}
							<div class="sw-block strengths">
								<h4 class="sw-label">
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
									</svg>
									Forces
								</h4>
								<ul class="sw-list">
									{#each analysis.reelectionLikelihood.strengths as strength}
										<li>{strength}</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if analysis.reelectionLikelihood.weaknesses && analysis.reelectionLikelihood.weaknesses.length > 0}
							<div class="sw-block weaknesses">
								<h4 class="sw-label">
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
									</svg>
									Faiblesses
								</h4>
								<ul class="sw-list">
									{#each analysis.reelectionLikelihood.weaknesses as weakness}
										<li>{weakness}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.incumbent-analysis {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
	}

	.analysis-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
		color: #faf8f5;
		gap: 1rem;
	}

	.header-content {
		flex: 1;
	}

	.analysis-title {
		font-family: var(--font-display);
		font-size: 0.85rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0 0.25rem;
		color: var(--color-text-light);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.mayor-name {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		color: #faf8f5;
	}

	.mayor-party {
		font-size: 0.9rem;
		font-weight: 400;
		color: var(--color-gold);
	}

	.tenure-badge {
		flex-shrink: 0;
		font-size: 0.8rem;
		background: rgba(201, 169, 98, 0.2);
		color: var(--color-gold);
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-full);
		border: 1px solid rgba(201, 169, 98, 0.3);
	}

	.analysis-content {
		padding: 1.25rem 1.5rem;
	}

	.mayor-profile {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.profile-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.85rem;
		color: var(--color-text-light);
	}

	.political-background {
		font-size: 0.9rem;
		color: var(--color-text);
		line-height: 1.5;
		margin: 0 0 1.25rem;
		padding: 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
	}

	.mandate-section,
	.reelection-section {
		padding-top: 1.25rem;
		border-top: 1px solid var(--color-card-border);
	}

	.section-title {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0 0 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.running-badge {
		font-size: 0.75rem;
		font-weight: 600;
		font-family: var(--font-body);
		background: var(--color-success);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
	}

	.running-badge.not-running {
		background: var(--color-text-muted);
	}

	.assessment-block {
		margin-bottom: 1rem;
	}

	.block-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.label-icon {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.75rem;
	}

	.label-icon.success {
		background: var(--color-success);
		color: white;
	}

	.label-icon.warning {
		background: var(--color-coral);
		color: white;
	}

	.label-icon.neutral {
		background: var(--color-text-muted);
		color: white;
		font-size: 0.6rem;
		letter-spacing: -0.05em;
	}

	.assessment-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.assessment-list li {
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.4;
		padding-left: 1rem;
		position: relative;
	}

	.assessment-list li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.5rem;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-card-border);
	}

	.achievements .assessment-list li::before {
		background: var(--color-success);
	}

	.controversies .assessment-list li::before {
		background: var(--color-coral);
	}

	.projects .assessment-list li::before {
		background: var(--color-gold);
	}

	.perception-box {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--color-gold);
	}

	.perception-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		margin: 0 0 0.5rem;
	}

	.perception-text {
		font-size: 0.9rem;
		color: var(--color-text);
		line-height: 1.5;
		margin: 0;
		font-style: italic;
	}

	.chances-estimate {
		font-size: 0.95rem;
		color: var(--color-text);
		line-height: 1.5;
		margin: 0 0 1rem;
		font-weight: 500;
	}

	.strengths-weaknesses {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	@media (max-width: 640px) {
		.strengths-weaknesses {
			grid-template-columns: 1fr;
		}
	}

	.sw-block {
		padding: 0.875rem;
		border-radius: var(--radius-md);
	}

	.sw-block.strengths {
		background: rgba(74, 157, 110, 0.08);
		border: 1px solid rgba(74, 157, 110, 0.2);
	}

	.sw-block.weaknesses {
		background: rgba(224, 122, 95, 0.08);
		border: 1px solid rgba(224, 122, 95, 0.2);
	}

	.sw-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		margin: 0 0 0.5rem;
	}

	.strengths .sw-label {
		color: var(--color-success);
	}

	.weaknesses .sw-label {
		color: var(--color-coral);
	}

	.sw-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.sw-list li {
		font-size: 0.85rem;
		color: var(--color-text);
		line-height: 1.4;
	}

	@media (max-width: 640px) {
		.analysis-header {
			flex-direction: column;
			padding: 0.875rem 1rem;
		}

		.tenure-badge {
			align-self: flex-start;
		}

		.analysis-content {
			padding: 1rem;
		}
	}
</style>
