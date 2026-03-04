<script lang="ts">
	import { page } from '$app/state';
	import SeoMeta from '$lib/components/SeoMeta.svelte';

	export const prerender = true;

	const GITHUB_REPO = 'https://github.com/MagLabAI/maire.app';

	let fromPage = $derived(page.url.searchParams.get('from') || '');

	let githubIssueUrl = $derived.by(() => {
		const params = new URLSearchParams({
			labels: 'erreur-contenu',
			title: fromPage ? `Erreur sur ${fromPage}` : 'Erreur de contenu',
			body: [
				'## Page concernée',
				fromPage ? `[${fromPage}](https://maire.app${fromPage})` : '_À préciser_',
				'',
				'## Description de l\'erreur',
				'_Décrivez l\'erreur que vous avez repérée._',
				'',
				'## Correction proposée',
				'_Quelle information est correcte ?_',
				'',
				'## Source (recommandé)',
				'_Collez ici le lien vers un article de presse, un site officiel ou toute source fiable qui confirme la correction. Cela accélère la vérification._',
				'',
				'URL : '
			].join('\n')
		});
		return `${GITHUB_REPO}/issues/new?${params.toString()}`;
	});

	// Contact form state
	let formName = $state('');
	let formEmail = $state('');
	let formCategory = $state('factual_error');
	let formMessage = $state('');
	let formSource = $state('');
	let formStatus = $state<'idle' | 'sending' | 'success' | 'error'>('idle');
	let formError = $state('');

	async function submitForm() {
		formStatus = 'sending';
		formError = '';

		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formName,
					email: formEmail,
					pageUrl: fromPage || null,
					category: formCategory,
					message: formMessage,
					sourceUrl: formSource || null
				})
			});

			const data = await res.json();

			if (!res.ok) {
				formError = data.message || 'Une erreur est survenue.';
				formStatus = 'error';
				return;
			}

			formStatus = 'success';
		} catch {
			formError = 'Erreur de connexion. Réessayez plus tard.';
			formStatus = 'error';
		}
	}
</script>

<svelte:head>
	<title>Signaler une erreur | maire.app</title>
	<meta name="description" content="Signaler une erreur, demander une correction ou exercer votre droit de réponse sur maire.app." />
	<SeoMeta
		title="Signaler une erreur | maire.app"
		description="Signaler une erreur, demander une correction ou exercer votre droit de réponse sur maire.app."
		path="/corrections"
	/>
</svelte:head>

<section class="page-header">
	<div class="container-app">
		<h1 class="page-title">Signaler une erreur</h1>
		<p class="page-subtitle">Signalez une information inexacte, demandez une correction, ou exercez votre droit de réponse</p>
	</div>
</section>

<section class="corrections-section">
	<div class="container-app">
		<div class="corrections-content">

			<!-- Process overview -->
			<div class="method-card">
				<h2>Comment ça marche</h2>
				<div class="process-steps">
					<div class="process-step">
						<span class="step-icon">1</span>
						<div>
							<h3>Signalez</h3>
							<p>Via GitHub (public) ou le formulaire ci-dessous (privé). Incluez un lien source si possible.</p>
						</div>
					</div>
					<div class="process-step">
						<span class="step-icon">2</span>
						<div>
							<h3>Vérification</h3>
							<p>Un agent IA trie le signalement, puis un humain valide</p>
						</div>
					</div>
					<div class="process-step">
						<span class="step-icon">3</span>
						<div>
							<h3>Correction</h3>
							<p>La page est mise à jour et la correction est documentée</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Two reporting methods -->
			<div class="methods-grid">
				<!-- GitHub Issue -->
				<div class="method-card method-github">
					<div class="method-header">
						<span class="method-badge public">Public</span>
						<h2>Issue GitHub</h2>
					</div>
					<p>Signalement public et traçable. Idéal pour les erreurs factuelles que d'autres pourraient aussi repérer.</p>
					<ul class="method-perks">
						<li>Transparent et traçable</li>
						<li>Suivi des corrections en temps réel</li>
						<li>Contribution à l'historique public</li>
					</ul>
					<a
						href={githubIssueUrl}
						target="_blank"
						rel="noopener"
						class="action-btn github-btn"
					>
						Ouvrir une issue GitHub
					</a>
				</div>

				<!-- Contact Form -->
				<div class="method-card method-form">
					<div class="method-header">
						<span class="method-badge private">Privé</span>
						<h2>Formulaire de contact</h2>
					</div>
					<p>Signalement confidentiel. Pour les candidats souhaitant exercer leur droit de réponse ou les informations sensibles.</p>

					{#if formStatus === 'success'}
						<div class="form-success">
							<p>Signalement enregistré. Nous accuserons réception sous 48h.</p>
						</div>
					{:else}
						<form onsubmit={(e) => { e.preventDefault(); submitForm(); }}>
							<div class="form-group">
								<label for="name">Nom</label>
								<input type="text" id="name" bind:value={formName} required minlength="2" placeholder="Votre nom" />
							</div>
							<div class="form-group">
								<label for="email">Email</label>
								<input type="email" id="email" bind:value={formEmail} required placeholder="votre@email.fr" />
							</div>
							{#if fromPage}
								<div class="form-group">
									<label>Page concernée</label>
									<div class="form-static">{fromPage}</div>
								</div>
							{/if}
							<div class="form-group">
								<label for="category">Type de signalement</label>
								<select id="category" bind:value={formCategory}>
									<option value="factual_error">Erreur factuelle</option>
									<option value="missing_info">Information manquante</option>
									<option value="candidate_request">Droit de réponse (candidat)</option>
									<option value="other">Autre</option>
								</select>
							</div>
							<div class="form-group">
								<label for="message">Description</label>
								<textarea id="message" bind:value={formMessage} required minlength="10" rows="4" placeholder="Décrivez l'erreur et la correction souhaitée."></textarea>
							</div>
							<div class="form-group">
								<label for="source">URL source (recommandé)</label>
								<input type="url" id="source" bind:value={formSource} placeholder="https://exemple.fr/article-confirmant-la-correction" />
								<p class="field-hint">Un lien vers un article de presse ou un site officiel accélère la vérification.</p>
							</div>
							{#if formError}
								<p class="form-error">{formError}</p>
							{/if}
							<button type="submit" class="action-btn form-btn" disabled={formStatus === 'sending'}>
								{formStatus === 'sending' ? 'Envoi...' : 'Envoyer le signalement'}
							</button>
						</form>
					{/if}
				</div>
			</div>

			<!-- Droit de réponse -->
			<div class="method-card droit-card">
				<h2>Candidats : droit de réponse</h2>
				<p>
					Conformément à la législation française, tout candidat dont le profil contient des
					informations inexactes peut demander une correction.
				</p>
				<div class="commitments">
					<div class="commitment">
						<strong>48h</strong>
						<span>Accusé de réception</span>
					</div>
					<div class="commitment">
						<strong>7 jours</strong>
						<span>Correction publiée</span>
					</div>
					<div class="commitment">
						<strong>100%</strong>
						<span>Corrections documentées</span>
					</div>
				</div>
				<p class="note-text">
					Les corrections factuelles (date, mandat, profession) sont prioritaires.
					Les demandes de suppression de contenu factuel et sourcé ne sont pas recevables.
				</p>
			</div>

			<!-- Triage process -->
			<div class="method-card">
				<h2>Processus de vérification</h2>
				<div class="triage-flow">
					<div class="triage-step">
						<span class="triage-label">Signalement</span>
						<span class="triage-desc">GitHub ou formulaire</span>
					</div>
					<span class="triage-arrow">&rarr;</span>
					<div class="triage-step">
						<span class="triage-label">Triage IA</span>
						<span class="triage-desc">Classification automatique</span>
					</div>
					<span class="triage-arrow">&rarr;</span>
					<div class="triage-step">
						<span class="triage-label">Revue humaine</span>
						<span class="triage-desc">Validation manuelle</span>
					</div>
					<span class="triage-arrow">&rarr;</span>
					<div class="triage-step">
						<span class="triage-label">Correction</span>
						<span class="triage-desc">Publication et historique</span>
					</div>
				</div>
				<p>
					Les signalements sont d'abord classifiés par un agent IA qui évalue la gravité et le type d'erreur.
					Chaque correction est ensuite validée par un humain avant publication.
					L'ensemble du processus est documenté dans
					<a href="{GITHUB_REPO}/issues?q=label%3Aerreur-contenu" target="_blank" rel="noopener">l'historique GitHub</a>.
				</p>
			</div>

			<!-- Methodology link -->
			<div class="method-card">
				<h2>Méthodologie et transparence IA</h2>
				<p>
					Le contenu de maire.app est généré par Mistral 3 Large à partir de recherches web.
					Chaque page affiche la date de génération, le modèle utilisé, et un indicateur de vérification des sources.
				</p>
				<div class="action-links">
					<a href="/corrections/stats" class="action-btn stats-btn">Voir les statistiques</a>
					<a href="{GITHUB_REPO}" target="_blank" rel="noopener" class="action-btn github-btn">Code source</a>
				</div>
			</div>

		</div>
	</div>
</section>

<!-- Cross-links -->
<section class="crosslinks-section">
	<div class="container-app">
		<div class="crosslinks-grid">
			<a href="/a-propos" class="crosslink-card">
				<h3>Notre méthodologie IA</h3>
				<p>Comment nous utilisons l'intelligence artificielle pour analyser les élections</p>
			</a>
			<a href="/corrections/stats" class="crosslink-card">
				<h3>Statistiques de vérification</h3>
				<p>Taux de couverture, sources vérifiées et corrections appliquées</p>
			</a>
			<a href="/elections/municipales-2026" class="crosslink-card">
				<h3>Municipales 2026</h3>
				<p>Découvrez les candidats et enjeux dans votre ville</p>
			</a>
		</div>
	</div>
</section>

<style>
	.page-header {
		background: var(--color-navy);
		color: #faf8f5;
		padding: 3rem 0;
	}

	.page-title {
		font-family: var(--font-display);
		font-size: 2.5rem;
		font-weight: 700;
		color: #faf8f5;
		margin-bottom: 0.5rem;
	}

	.page-subtitle {
		color: var(--color-text-light);
		max-width: 600px;
		line-height: 1.5;
	}

	.corrections-section {
		padding: 2rem 0 4rem;
	}

	.corrections-content {
		display: grid;
		gap: 1.5rem;
		max-width: 900px;
	}

	.method-card {
		padding: 1.5rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.method-card h2 {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.75rem;
	}

	.method-card h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.25rem;
	}

	.method-card p {
		color: var(--color-text);
		line-height: 1.6;
		font-size: 0.95rem;
		margin-bottom: 0.75rem;
	}

	.method-card p:last-child {
		margin-bottom: 0;
	}

	.method-card a {
		color: var(--color-gold);
		text-decoration: underline;
	}

	.method-card a:hover {
		color: var(--color-coral);
	}

	/* Process steps */
	.process-steps {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin: 1rem 0 0;
	}

	@media (max-width: 640px) {
		.process-steps {
			grid-template-columns: 1fr;
		}
	}

	.process-step {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.step-icon {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		background: var(--color-gold);
		color: var(--color-foreground);
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.9rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.process-step p {
		font-size: 0.85rem;
		margin: 0;
		color: var(--color-text-light);
	}

	/* Methods grid */
	.methods-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	@media (max-width: 768px) {
		.methods-grid {
			grid-template-columns: 1fr;
		}
	}

	.method-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.method-header h2 {
		margin-bottom: 0;
	}

	.method-badge {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
	}

	.method-badge.public {
		background: rgba(74, 157, 110, 0.12);
		color: var(--color-success);
	}

	.method-badge.private {
		background: rgba(201, 169, 98, 0.12);
		color: var(--color-gold);
	}

	.method-perks {
		list-style: none;
		padding: 0;
		margin: 0.75rem 0;
	}

	.method-perks li {
		font-size: 0.85rem;
		color: var(--color-text-light);
		padding: 0.25rem 0 0.25rem 1.25rem;
		position: relative;
	}

	.method-perks li::before {
		content: '\2713';
		position: absolute;
		left: 0;
		color: var(--color-success);
		font-weight: bold;
	}

	/* Action buttons */
	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 0.9rem;
		text-decoration: none !important;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.github-btn {
		background: var(--color-navy);
		color: var(--color-cream) !important;
	}

	.github-btn:hover {
		background: var(--color-navy-light);
		transform: translateY(-1px);
	}

	.form-btn {
		background: var(--color-gold);
		color: var(--color-navy) !important;
		width: 100%;
		justify-content: center;
		margin-top: 0.5rem;
	}

	.form-btn:hover:not(:disabled) {
		filter: brightness(1.05);
		transform: translateY(-1px);
	}

	.form-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.stats-btn {
		background: var(--color-cream-dark);
		color: var(--color-navy) !important;
	}

	.stats-btn:hover {
		background: var(--color-gold-light);
	}

	.action-links {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-top: 1rem;
	}

	/* Form */
	.form-group {
		margin-bottom: 0.75rem;
	}

	.form-group label {
		display: block;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.25rem;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-card-border, #e5e7eb);
		border-radius: var(--radius-sm, 4px);
		font-size: 0.9rem;
		font-family: inherit;
		color: var(--color-text);
		background: var(--color-card-bg);
		transition: border-color 0.15s;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-gold);
	}

	.field-hint {
		font-size: 0.75rem !important;
		color: var(--color-text-muted, #9ca3af) !important;
		margin: 0.25rem 0 0 !important;
		line-height: 1.4;
	}

	.form-static {
		padding: 0.5rem 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius-sm, 4px);
		font-size: 0.85rem;
		color: var(--color-text-light);
		font-family: monospace;
	}

	.form-error {
		color: var(--color-coral) !important;
		font-size: 0.85rem !important;
		margin-bottom: 0.5rem !important;
	}

	.form-success {
		padding: 1rem;
		background: rgba(74, 157, 110, 0.08);
		border-radius: var(--radius-md);
		text-align: center;
	}

	.form-success p {
		color: var(--color-success);
		font-weight: 500;
		margin: 0;
	}

	/* Droit de réponse */
	.droit-card {
		border-left: 4px solid var(--color-gold);
	}

	.commitments {
		display: flex;
		gap: 1.5rem;
		margin: 1rem 0;
		flex-wrap: wrap;
	}

	.commitment {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 0.75rem 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		min-width: 100px;
	}

	.commitment strong {
		font-family: var(--font-display);
		font-size: 1.5rem;
		color: var(--color-gold);
	}

	.commitment span {
		font-size: 0.75rem;
		color: var(--color-text-light);
		margin-top: 0.25rem;
	}

	.note-text {
		font-size: 0.85rem;
		color: var(--color-text-light);
		font-style: italic;
	}

	/* Triage flow */
	.triage-flow {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 1rem 0;
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.triage-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		min-width: 110px;
	}

	.triage-label {
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--color-foreground);
	}

	.triage-desc {
		font-size: 0.7rem;
		color: var(--color-text-light);
		margin-top: 0.15rem;
	}

	.triage-arrow {
		color: var(--color-gold);
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.triage-flow {
			flex-direction: column;
		}
		.triage-arrow {
			transform: rotate(90deg);
		}
	}

	.crosslinks-section {
		padding: 2rem 0 3rem;
		background: var(--color-cream-dark);
	}

	.crosslinks-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	@media (max-width: 767px) {
		.crosslinks-grid { grid-template-columns: 1fr; }
	}

	.crosslink-card {
		padding: 1.5rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		text-decoration: none !important;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.crosslink-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(10, 22, 40, 0.12);
	}

	.crosslink-card h3 {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.25rem;
	}

	.crosslink-card p {
		font-size: 0.8rem;
		color: var(--color-text-light);
		line-height: 1.4;
		margin: 0;
	}
</style>
