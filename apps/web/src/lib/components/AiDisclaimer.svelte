<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		lastUpdated?: string;
		model?: string;
	}

	let {
		lastUpdated,
		model = 'Mistral 3 Large'
	}: Props = $props();

	let showMethod = $state(false);

	let correctionsUrl = $derived(
		'/corrections?from=' + encodeURIComponent(page.url.pathname)
	);

	function formatDate(isoDate: string): string {
		return new Date(isoDate).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

<aside class="ai-disclaimer" role="note" aria-label="Avertissement IA">
	<div class="disclaimer-inner">
		<span class="disclaimer-badge">IA</span>
		<div class="disclaimer-content">
			<p class="disclaimer-text">
				Synthèse générée par {model} à partir de recherches web.
				<span class="disclaimer-warn">Peut contenir des erreurs.</span>
			</p>
			<div class="disclaimer-meta">
				{#if lastUpdated}
					<span class="meta-item">{formatDate(lastUpdated)}</span>
				{/if}
				<a
					href={correctionsUrl}
					class="report-link"
				>Signaler une erreur</a>
				<button class="method-link" onclick={() => showMethod = !showMethod}>
					{showMethod ? 'Fermer' : 'Méthodologie'}
				</button>
			</div>
			{#if showMethod}
				<div class="method-panel">
					<ol class="method-steps">
						<li><strong>Recherche web</strong> — L'IA interroge des sources publiques (presse locale, sites institutionnels, réseaux sociaux) via <a href="https://tavily.com" target="_blank" rel="noopener">Tavily</a>.</li>
						<li><strong>Synthèse</strong> — <a href="https://mistral.ai" target="_blank" rel="noopener">Mistral AI</a> analyse et structure les informations en fiche candidat.</li>
						<li><strong>Vérification</strong> — Chaque affirmation est comparée aux sources collectées. Les informations non-vérifiables sont signalées.</li>
					</ol>
					<p class="method-note">
						Ce processus est automatisé et imparfait. <a href={correctionsUrl}>Signalez toute erreur</a> pour améliorer la qualité des données.
					</p>
				</div>
			{/if}
		</div>
	</div>
</aside>

<style>
	.ai-disclaimer {
		background: var(--color-cream-dark, #f0ebe3);
		border-left: 3px solid var(--color-gold, #c9a962);
		border-radius: 0 var(--radius-sm, 4px) var(--radius-sm, 4px) 0;
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		line-height: 1.4;
	}

	.disclaimer-inner {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
	}

	.disclaimer-badge {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		background: var(--color-gold, #c9a962);
		color: white;
		font-size: 0.6rem;
		font-weight: 700;
		border-radius: 4px;
		letter-spacing: 0.02em;
		margin-top: 1px;
	}

	.disclaimer-content {
		flex: 1;
		min-width: 0;
	}

	.disclaimer-text {
		color: var(--color-text-light, #6b7c93);
		margin: 0 0 0.25rem;
	}

	.disclaimer-warn {
		color: var(--color-text, #2c3e50);
		font-weight: 500;
	}

	.disclaimer-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.meta-item {
		color: var(--color-text-muted, #9ca3af);
		font-size: 0.65rem;
	}

	.report-link,
	.method-link {
		font-size: 0.65rem;
		font-weight: 600;
		text-decoration: none;
		padding: 0.1rem 0.35rem;
		border-radius: 3px;
		transition: background 0.15s ease;
	}

	.report-link {
		color: var(--color-coral, #e07a5f);
		background: rgba(224, 122, 95, 0.08);
	}

	.report-link:hover {
		background: rgba(224, 122, 95, 0.18);
	}

	.method-link {
		color: var(--color-text-light, #6b7c93);
		background: rgba(107, 124, 147, 0.08);
		border: none;
		cursor: pointer;
		font-family: inherit;
	}

	.method-link:hover {
		background: rgba(107, 124, 147, 0.18);
	}

	.method-panel {
		margin-top: 0.5rem;
		padding: 0.5rem 0.625rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-sm, 4px);
		font-size: 0.7rem;
		line-height: 1.5;
		color: var(--color-text, #2c3e50);
	}

	.method-steps {
		margin: 0;
		padding-left: 1.25rem;
	}

	.method-steps li {
		margin-bottom: 0.25rem;
	}

	.method-steps a {
		color: var(--color-gold, #c9a962);
		text-decoration: underline;
	}

	.method-note {
		margin: 0.375rem 0 0;
		color: var(--color-text-light, #6b7c93);
		font-size: 0.65rem;
	}

	.method-note a {
		color: var(--color-coral, #e07a5f);
	}
</style>
