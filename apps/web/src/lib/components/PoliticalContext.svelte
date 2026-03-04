<script lang="ts">
	import type { PoliticalLandscape, ElectoralContext } from '$lib/types/elections';

	interface Props {
		politicalLandscape?: PoliticalLandscape;
		electoralContext?: ElectoralContext;
	}

	let { politicalLandscape, electoralContext }: Props = $props();

	let activeTab = $state<'landscape' | 'election'>('election');
</script>

{#if politicalLandscape || electoralContext}
	<div class="political-context">
		<header class="context-header">
			<h2 class="context-title">
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
				Contexte politique
			</h2>

			<!-- Tab Switcher -->
			<div class="tab-switcher">
				<button
					class="tab-btn"
					class:active={activeTab === 'election'}
					onclick={() => activeTab = 'election'}
				>
					2026
				</button>
				<button
					class="tab-btn"
					class:active={activeTab === 'landscape'}
					onclick={() => activeTab = 'landscape'}
				>
					Historique
				</button>
			</div>
		</header>

		<div class="context-content">
			<!-- Electoral Context 2026 -->
			{#if activeTab === 'election' && electoralContext}
				<div class="tab-content">
					<!-- Key Themes -->
					{#if electoralContext.keyThemes && electoralContext.keyThemes.length > 0}
						<div class="context-section">
							<h3 class="section-label">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
								</svg>
								Thèmes clés de la campagne
							</h3>
							<div class="themes-grid">
								{#each electoralContext.keyThemes as theme}
									<span class="theme-tag">{theme}</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Campaign Dynamics -->
					{#if electoralContext.campaignDynamics}
						<div class="context-section">
							<h3 class="section-label">Dynamique de campagne</h3>
							<p class="dynamics-text">{electoralContext.campaignDynamics}</p>
						</div>
					{/if}

					<!-- Voter Expectations -->
					{#if electoralContext.voterExpectations && electoralContext.voterExpectations.length > 0}
						<div class="context-section">
							<h3 class="section-label">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								Attentes des électeurs
							</h3>
							<ul class="expectations-list">
								{#each electoralContext.voterExpectations as expectation}
									<li>{expectation}</li>
								{/each}
							</ul>
						</div>
					{/if}

					<!-- Turnout & Decisive Factors -->
					<div class="predictions-grid">
						{#if electoralContext.turnoutPrediction}
							<div class="prediction-card">
								<h4 class="prediction-label">Participation attendue</h4>
								<p class="prediction-value">{electoralContext.turnoutPrediction}</p>
							</div>
						{/if}

						{#if electoralContext.decisiveFactors && electoralContext.decisiveFactors.length > 0}
							<div class="prediction-card full-width">
								<h4 class="prediction-label">Facteurs décisifs</h4>
								<ul class="factors-list">
									{#each electoralContext.decisiveFactors as factor}
										<li>{factor}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>

					<!-- Potential Alliances -->
					{#if electoralContext.potentialAlliances && electoralContext.potentialAlliances.length > 0}
						<div class="context-section alliances">
							<h3 class="section-label">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
								</svg>
								Alliances possibles
							</h3>
							<ul class="alliances-list">
								{#each electoralContext.potentialAlliances as alliance}
									<li>{alliance}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Political Landscape -->
			{#if activeTab === 'landscape' && politicalLandscape}
				<div class="tab-content">
					<!-- Historical Tendency -->
					{#if politicalLandscape.historicalTendency}
						<div class="context-section">
							<h3 class="section-label">Tendance historique</h3>
							<p class="tendency-text">{politicalLandscape.historicalTendency}</p>
						</div>
					{/if}

					<!-- Recent Elections -->
					{#if politicalLandscape.recentElections}
						<div class="context-section">
							<h3 class="section-label">Élections récentes</h3>

							{#if politicalLandscape.recentElections.municipales2020}
								<div class="election-result">
									<span class="election-year">2020</span>
									<div class="election-details">
										<div class="result-winner">{politicalLandscape.recentElections.municipales2020.winner}</div>
										{#if politicalLandscape.recentElections.municipales2020.score}
											<div class="result-score">{politicalLandscape.recentElections.municipales2020.score}</div>
										{/if}
										{#if politicalLandscape.recentElections.municipales2020.turnout}
											<div class="result-turnout">Participation : {politicalLandscape.recentElections.municipales2020.turnout}</div>
										{/if}
									</div>
								</div>
							{/if}

							{#if politicalLandscape.recentElections.otherRelevant && politicalLandscape.recentElections.otherRelevant.length > 0}
								<ul class="other-elections">
									{#each politicalLandscape.recentElections.otherRelevant as other}
										<li>{other}</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/if}

					<!-- Key Political Figures -->
					{#if politicalLandscape.keyPoliticalFigures && politicalLandscape.keyPoliticalFigures.length > 0}
						<div class="context-section">
							<h3 class="section-label">Figures politiques clés</h3>
							<div class="figures-grid">
								{#each politicalLandscape.keyPoliticalFigures as figure}
									<span class="figure-tag">{figure}</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Local Dynamics -->
					{#if politicalLandscape.localPoliticalDynamics}
						<div class="context-section">
							<h3 class="section-label">Dynamique locale</h3>
							<p class="dynamics-text">{politicalLandscape.localPoliticalDynamics}</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.political-context {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
	}

	.context-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
		color: #faf8f5;
		gap: 1rem;
	}

	.context-title {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		color: #faf8f5;
	}

	.tab-switcher {
		display: flex;
		gap: 0.25rem;
		background: rgba(0, 0, 0, 0.2);
		padding: 0.25rem;
		border-radius: var(--radius-full);
	}

	.tab-btn {
		padding: 0.375rem 0.875rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-light);
		background: transparent;
		border-radius: var(--radius-full);
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.tab-btn:hover {
		color: #faf8f5;
	}

	.tab-btn.active {
		background: var(--color-gold);
		color: var(--color-foreground);
	}

	.context-content {
		padding: 1.25rem 1.5rem;
	}

	.tab-content {
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.context-section {
		margin-bottom: 1.25rem;
	}

	.context-section:last-child {
		margin-bottom: 0;
	}

	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.themes-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.theme-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 0.875rem;
		background: linear-gradient(135deg, var(--color-gold-light) 0%, rgba(201, 169, 98, 0.2) 100%);
		border: 1px solid var(--color-gold);
		border-radius: var(--radius-full);
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-foreground);
	}

	.dynamics-text,
	.tendency-text {
		font-size: 0.9rem;
		color: var(--color-text);
		line-height: 1.6;
		margin: 0;
		padding: 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
	}

	.expectations-list,
	.factors-list,
	.alliances-list,
	.other-elections {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.expectations-list li,
	.factors-list li,
	.alliances-list li,
	.other-elections li {
		font-size: 0.9rem;
		color: var(--color-text);
		line-height: 1.4;
		padding-left: 1.25rem;
		position: relative;
	}

	.expectations-list li::before,
	.alliances-list li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.45rem;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-gold);
	}

	.factors-list li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.45rem;
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--color-coral);
	}

	.other-elections li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.5rem;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-text-muted);
	}

	.predictions-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	@media (max-width: 640px) {
		.predictions-grid {
			grid-template-columns: 1fr;
		}
	}

	.prediction-card {
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
	}

	.prediction-card.full-width {
		grid-column: 1 / -1;
	}

	.prediction-label {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.5rem;
	}

	.prediction-value {
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--color-foreground);
		margin: 0;
	}

	.alliances {
		padding-top: 1rem;
		border-top: 1px solid var(--color-card-border);
	}

	.election-result {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.875rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		margin-bottom: 1rem;
	}

	.election-year {
		flex-shrink: 0;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-gold);
	}

	.election-details {
		flex: 1;
	}

	.result-winner {
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.25rem;
	}

	.result-score,
	.result-turnout {
		font-size: 0.85rem;
		color: var(--color-text-light);
	}

	.figures-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.figure-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 0.875rem;
		background: var(--color-cream);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-full);
		font-size: 0.85rem;
		color: var(--color-foreground);
	}

	@media (max-width: 640px) {
		.context-header {
			flex-direction: column;
			align-items: flex-start;
			padding: 0.875rem 1rem;
		}

		.context-content {
			padding: 1rem;
		}

		.context-title {
			font-size: 0.9rem;
		}
	}
</style>
