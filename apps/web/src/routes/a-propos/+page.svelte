<script lang="ts">
	import SeoMeta from '$lib/components/SeoMeta.svelte';
	export const prerender = true;
</script>

<svelte:head>
	<title>À propos | maire.app</title>
	<meta name="description" content="maire.app est un projet communautaire open source par MagLab Studio qui utilise l'IA pour rendre les élections municipales plus accessibles." />
	<SeoMeta
		title="À propos | maire.app"
		description="maire.app est un projet communautaire open source par MagLab Studio qui utilise l'IA pour rendre les élections municipales plus accessibles."
		path="/a-propos"
	/>
</svelte:head>

<section class="page-header">
	<div class="container-app">
		<h1 class="page-title">À propos</h1>
		<p class="page-subtitle">Un projet communautaire open source par MagLab Studio</p>
	</div>
</section>

<section class="about-section">
	<div class="container-app">
		<div class="about-content">

			<div class="about-card highlight-card">
				<h2>Notre mission</h2>
				<p>
					maire.app est un projet communautaire open source initié par
					<a href="https://maglab.app" target="_blank" rel="noopener">MagLab Studio</a>.
					Les données et textes analysés proviennent exclusivement de programmes publics
					et de sources officielles (sites mairie, plateformes électorales, communiqués des listes).
				</p>
				<p>
					La participation aux municipales de 2020 était historiquement basse.
					Nous voulons contribuer, à notre échelle, à inverser cette tendance en 2026
					en rendant l'information sur les candidats et les enjeux locaux plus facile à trouver.
				</p>
				<div class="card-links">
					<a href="/elections/municipales-2026" class="card-link">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
						Voir les candidats 2026
					</a>
					<a href="/couverture" class="card-link">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
						Villes couvertes
					</a>
				</div>
			</div>

			<div class="two-col">
				<div class="about-card">
					<h2>Contenu généré par IA</h2>
					<p>
						Les fiches candidats sont produites par intelligence artificielle
						(modèle <a href="https://mistral.ai" target="_blank" rel="noopener">Mistral</a> Large)
						à partir de sources web publiques : articles de presse, sites institutionnels, réseaux sociaux.
					</p>
					<p>
						Chaque fiche affiche la date de génération et le modèle utilisé.
						L'IA peut se tromper — c'est pourquoi nous comptons sur vos signalements
						pour améliorer la qualité des données.
					</p>
					<a href="/corrections" class="card-link-inline">Signaler une erreur</a>
				</div>

				<div class="about-card">
					<h2>Ce que l'IA ne fait pas</h2>
					<ul class="limit-list">
						<li>Elle ne remplace pas le journalisme d'investigation</li>
						<li>Elle ne prédit pas les résultats d'une élection</li>
						<li>Elle ne recommande aucun candidat</li>
						<li>Elle ne produit pas de sondages d'opinion</li>
					</ul>
					<p>
						Les synthèses sont des approximations basées sur les informations publiques disponibles
						au moment de la recherche.
					</p>
				</div>
			</div>

			<div class="about-card">
				<h2>Indépendance politique</h2>
				<div class="independence-grid">
					<div class="independence-item">
						<strong>Aucune affiliation</strong>
						<span>Pas de parti, pas de candidat, pas d'institution derrière maire.app</span>
					</div>
					<div class="independence-item">
						<strong>Couleurs neutres</strong>
						<span>Or, marine et crème — choisies pour éviter toute association partisane</span>
					</div>
					<div class="independence-item">
						<strong>Ordre aléatoire</strong>
						<span>Les candidats sont affichés dans un ordre différent à chaque visite</span>
					</div>
					<div class="independence-item">
						<strong>Format identique</strong>
						<span>Chaque profil utilise le même modèle et le même niveau de détail</span>
					</div>
				</div>
			</div>

			<div class="about-card">
				<h2>Vie privée</h2>
				<ul class="privacy-list">
					<li>Aucun compte nécessaire pour consulter le site</li>
					<li>Aucun tracker publicitaire, aucun cookie de suivi</li>
					<li>Hébergement en Union Européenne (Cloudflare Pages)</li>
					<li>Aucune donnée de navigation revendue</li>
					<li><a href="https://github.com/MagLabAI/maire.app" target="_blank" rel="noopener">Code source ouvert</a> — licence <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener">MIT</a> / <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a></li>
				</ul>
				<p>
					Pour plus de détails, consultez nos <a href="/mentions-legales">mentions légales</a>.
				</p>
			</div>

			<div class="about-card highlight-card">
				<h2>Pourquoi ce projet ?</h2>
				<p>
					Nous ne savons pas encore si maire.app a un avenir au-delà des municipales 2026.
					La suite dépendra des retours et de la traction. Nous avons conscience
					des risques de l'IA appliquée à la politique — le « backlash IA » est réel.
				</p>
				<p>
					Mais nous sommes plus inquiets de l'IA <em>mal utilisée</em> qui pourrait fragiliser
					la démocratie que de l'IA <em>bien utilisée</em> qui la renforce. C'est pourquoi
					nous avons créé cette application expérimentale : montrer ce que l'IA peut faire
					de positif pour l'information citoyenne, en toute transparence sur ses limites.
				</p>
				<p>
					Si l'expérience est concluante, nous envisageons d'accompagner les maires dans
					leur mandat : écoute citoyenne, veille réglementaire, collaboration entre élus.
					Mais rien n'est décidé — nous avançons pas à pas.
				</p>
				<div class="card-links">
					<a href="/fonctionnalites" class="card-link">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
						Fonctionnalités envisagées
					</a>
					<a href="/gouvernance" class="card-link">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
						Gouvernance municipale
					</a>
				</div>
			</div>

			<div class="about-card">
				<h2>Contact</h2>
				<p>
					Pour toute question, suggestion ou signalement (y compris suspicion de diffamation) :
					<a href="mailto:contact@maglab.app">contact@maglab.app</a>
				</p>
				<p>
					Pour signaler une erreur factuelle ou exercer un droit de réponse :
					<a href="/corrections">page de signalement</a>.
					Toute erreur signalée sera revue dans les 48 h.
				</p>
			</div>
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

	.about-section {
		padding: 3rem 0;
	}

	.about-content {
		display: grid;
		gap: 1.5rem;
		max-width: 900px;
	}

	.two-col {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 768px) {
		.two-col {
			grid-template-columns: 1fr 1fr;
		}
	}

	.about-card {
		padding: 1.5rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.about-card.highlight-card {
		border-left: 4px solid var(--color-gold);
	}

	.about-card h2 {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.75rem;
	}

	.about-card p {
		color: var(--color-text);
		line-height: 1.7;
		margin-bottom: 0.75rem;
	}

	.about-card p:last-child {
		margin-bottom: 0;
	}

	.about-card a {
		color: var(--color-gold);
		text-decoration: underline;
	}

	.about-card a:hover {
		color: var(--color-coral);
	}

	/* Card action links */
	.card-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.card-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-foreground);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.card-link:hover {
		background: var(--color-gold-light);
		color: var(--color-foreground);
		text-decoration: none;
	}

	.card-link svg {
		flex-shrink: 0;
		color: var(--color-gold);
	}

	.card-link-inline {
		font-size: 0.9rem;
		font-weight: 500;
	}

	/* Independence grid */
	.independence-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	@media (min-width: 640px) {
		.independence-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.independence-item {
		padding: 0.875rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
	}

	.independence-item strong {
		display: block;
		font-size: 0.9rem;
		color: var(--color-foreground);
		margin-bottom: 0.25rem;
	}

	.independence-item span {
		font-size: 0.85rem;
		color: var(--color-text-light);
		line-height: 1.4;
	}

	/* Limit list */
	.limit-list {
		list-style: none;
		padding: 0;
		margin: 0 0 0.75rem;
	}

	.limit-list li {
		font-size: 0.95rem;
		color: var(--color-text);
		line-height: 1.6;
		padding: 0.25rem 0 0.25rem 1.25rem;
		position: relative;
	}

	.limit-list li::before {
		content: '\2715';
		position: absolute;
		left: 0;
		color: var(--color-coral);
		font-size: 0.75rem;
		font-weight: bold;
	}

	/* Privacy list */
	.privacy-list {
		list-style: none;
		padding: 0;
		margin: 0 0 0.75rem;
	}

	.privacy-list li {
		font-size: 0.95rem;
		color: var(--color-text);
		line-height: 1.6;
		padding: 0.375rem 0 0.375rem 1.25rem;
		position: relative;
	}

	.privacy-list li::before {
		content: '\2713';
		position: absolute;
		left: 0;
		color: var(--color-success);
		font-weight: bold;
	}
</style>
