<script lang="ts">
	import SeoMeta from '$lib/components/SeoMeta.svelte';
</script>

<svelte:head>
	<title>Mentions légales | maire.app</title>
	<meta name="description" content="Mentions légales de maire.app — éditeur, hébergement, données personnelles, droit de réponse." />
	<SeoMeta
		title="Mentions légales | maire.app"
		description="Mentions légales de maire.app — éditeur, hébergement, données personnelles, droit de réponse."
		path="/mentions-legales"
	/>
</svelte:head>

<section class="page-header">
	<div class="container-app">
		<h1 class="page-title">Mentions légales</h1>
		<p class="page-subtitle">Conformément à la loi n°2004-575 du 21 juin 2004 (LCEN)</p>
	</div>
</section>

<section class="legal-section">
	<div class="container-app">
		<div class="legal-content">

			<div class="legal-card">
				<h2>1. Éditeur du site</h2>
				<dl class="legal-dl">
					<dt>Éditeur</dt>
					<dd>MagLab Studio — projet communautaire open source</dd>

					<dt>Objet</dt>
					<dd>Promouvoir la participation citoyenne et la transparence démocratique par l'usage responsable de l'intelligence artificielle</dd>

					<dt>Nature</dt>
					<dd>Comparateur fourni « tel quel » à titre informatif. Il n'engage ni partis, ni campagnes, ni prestataires.</dd>

					<dt>Indépendance</dt>
					<dd>MagLab Studio n'est affilié à aucun parti politique, aucun candidat et aucune institution.</dd>

					<dt>Licence</dt>
					<dd>Code source : <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener">MIT</a>. Contenu : <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.</dd>

					<dt>Contact</dt>
					<dd><a href="mailto:contact@maglab.app">contact@maglab.app</a></dd>
				</dl>
			</div>

			<div class="legal-card">
				<h2>2. Hébergement</h2>
				<dl class="legal-dl">
					<dt>Hébergeur</dt>
					<dd>Cloudflare, Inc.</dd>

					<dt>Adresse</dt>
					<dd>101 Townsend St, San Francisco, CA 94107, États-Unis</dd>

					<dt>Localisation des données</dt>
					<dd>Union Européenne (Cloudflare Pages - réseau edge européen)</dd>

					<dt>Site web</dt>
					<dd><a href="https://www.cloudflare.com" target="_blank" rel="noopener">cloudflare.com</a></dd>
				</dl>
			</div>

			<div class="legal-card">
				<h2>3. Intelligence artificielle — Conformité au règlement européen (AI Act)</h2>
				<p>
					Le contenu informatif de maire.app (profils de candidats, analyses locales, enjeux municipaux)
					est <strong>généré par intelligence artificielle</strong>.
				</p>
				<dl class="legal-dl">
					<dt>Modèle principal</dt>
					<dd>Mistral 3 Large (Mistral AI, Paris, France)</dd>

					<dt>Sources utilisées par l'IA</dt>
					<dd>Documents officiels (data.gouv.fr, listes de candidatures du Ministère de l'Intérieur), articles de presse en ligne, sites institutionnels, articles Wikipédia</dd>

					<dt>Nature du traitement</dt>
					<dd>Synthèse automatisée d'informations publiques. L'IA n'effectue aucune analyse prédictive, aucun profilage, aucun scoring de candidats. Il ne s'agit ni de contenu éditorial, ni de sondage, ni de recommandation de vote.</dd>

					<dt>Limites</dt>
					<dd>Le contenu peut contenir des erreurs factuelles, des imprécisions ou des biais inhérents aux modèles de langage. Les informations doivent être vérifiées auprès des sources officielles.</dd>
				</dl>

				<h3>Conformité au règlement (UE) 2024/1689 (AI Act)</h3>
				<p>
					maire.app utilise un système d'IA à usage général (GPAI) pour synthétiser des informations publiques.
					Ce système ne relève pas des catégories à haut risque (annexe III du règlement) car il :
				</p>
				<ul>
					<li>Ne prend aucune décision affectant les droits des personnes</li>
					<li>N'effectue aucun profilage, scoring ou évaluation des candidats</li>
					<li>Ne génère aucune recommandation de vote personnalisée</li>
					<li>N'influence pas le processus électoral au sens de l'article 6(2)</li>
				</ul>
				<p>
					Conformément aux obligations de transparence (article 50), nous signalons clairement
					le contenu généré par IA sur chaque page concernée : nom du modèle, date de génération
					et lien vers le signalement d'erreurs.
				</p>
			</div>

			<div class="legal-card">
				<h2>4. Données personnelles et RGPD</h2>
				<p>
					maire.app respecte le Règlement Général sur la Protection des Données (RGPD)
					et la loi Informatique et Libertés du 6 janvier 1978 modifiée.
				</p>

				<h3>Aucun suivi, aucun cookie, aucun compte utilisateur</h3>
				<p>
					maire.app <strong>ne collecte aucune donnée personnelle</strong>. Aucun cookie de suivi,
					aucun tracker publicitaire, aucune inscription, aucune connexion à un service tiers.
				</p>
				<ul>
					<li><strong>Aucun cookie</strong> n'est déposé sur votre navigateur</li>
					<li><strong>Aucun outil d'analyse</strong> (Google Analytics, Matomo, etc.) n'est utilisé</li>
					<li><strong>Aucun réseau publicitaire</strong> n'est intégré</li>
					<li><strong>Aucun compte utilisateur</strong> n'est requis pour consulter le site</li>
				</ul>

				<h3>Formulaire de contact</h3>
				<p>
					Le formulaire de signalement d'erreur (<a href="/corrections">/corrections</a>) collecte
					uniquement le message envoyé. L'adresse email est optionnelle et n'est utilisée
					que pour répondre à la demande. Ces données sont conservées le temps du traitement
					puis supprimées.
				</p>

				<h3>Compteur d'intérêt</h3>
				<p>
					Un compteur anonyme par ville enregistre le nombre de clics sur « Ce candidat m'intéresse ».
					Aucune donnée personnelle n'est associée à ce compteur.
				</p>

				<h3>Droits des utilisateurs</h3>
				<p>
					Conformément au RGPD, vous disposez des droits d'accès, de rectification, d'effacement,
					de limitation, de portabilité et d'opposition. Pour exercer ces droits :
					<a href="mailto:contact@maglab.app">contact@maglab.app</a>
				</p>
			</div>

			<div class="legal-card">
				<h2>5. Droit de réponse et corrections</h2>
				<p>
					Conformément à l'article 6 IV de la loi du 21 juin 2004, toute personne nommée ou désignée
					sur ce site dispose d'un <strong>droit de réponse</strong>.
				</p>
				<p>
					Les candidats, élus et personnalités politiques mentionnés peuvent exercer ce droit ou signaler une erreur via :
				</p>
				<ul>
					<li><a href="/corrections">Notre page de signalement</a> — formulaire de contact et processus de correction détaillé</li>
					<li>Email : <a href="mailto:contact@maglab.app">contact@maglab.app</a> (mention « Droit de réponse »)</li>
				</ul>
				<p>
					Toutes les corrections sont publiques et consultables sur notre <a href="/corrections/stats">tableau de bord</a>.
					La réponse sera publiée dans les mêmes conditions que le contenu contesté,
					dans un délai de 3 jours suivant la réception de la demande.
				</p>
			</div>

			<div class="legal-card">
				<h2>6. Propriété intellectuelle</h2>
				<p>
					Le code source de maire.app est publié en open source sur
					<a href="https://github.com/MagLabAI/maire.app" target="_blank" rel="noopener">GitHub</a>.
				</p>
				<p>
					Les photos de candidats, lorsqu'elles sont présentes, proviennent de Wikimedia Commons
					ou de sources publiques et sont créditées individuellement.
				</p>
				<p>
					Le contenu généré par IA n'est pas protégé par le droit d'auteur en droit français.
					Les données factuelles sur les élections sont des informations d'intérêt public.
				</p>
			</div>

			<div class="legal-card">
				<h2>7. Responsabilité</h2>
				<p>
					maire.app s'efforce de fournir des informations aussi exactes que possible.
					Toutefois, MagLab Studio ne saurait être tenu responsable des omissions, inexactitudes
					ou carences dans la mise à jour du contenu généré par intelligence artificielle.
				</p>
				<p>
					Le contenu de ce site est fourni à titre informatif uniquement. Il ne constitue en aucun cas
					un conseil de vote, un sondage d'opinion ou une publication de propagande électorale au sens
					du Code électoral.
				</p>
			</div>

			<div class="legal-card">
				<h2>8. Période électorale</h2>
				<p>
					Conformément aux dispositions du Code électoral, maire.app s'engage à :
				</p>
				<ul>
					<li>Ne publier aucun contenu assimilable à de la propagande électorale</li>
					<li>Présenter les candidats de manière neutre, factuelle et équitable</li>
					<li>Respecter le silence électoral la veille et le jour du scrutin</li>
					<li>Ne publier aucune estimation ou prédiction de résultats</li>
				</ul>
			</div>
		</div>
	</div>
</section>

<!-- Cross-links -->
<section class="crosslinks-section">
	<div class="container-app">
		<div class="crosslinks-grid">
			<a href="/a-propos" class="crosslink-card">
				<h3>À propos de maire.app</h3>
				<p>Notre mission, notre méthodologie IA et notre engagement citoyen</p>
			</a>
			<a href="/corrections" class="crosslink-card">
				<h3>Signaler une erreur</h3>
				<p>Droit de réponse, correction d'informations et transparence</p>
			</a>
			<a href="/gouvernance" class="crosslink-card">
				<h3>Gouvernance municipale</h3>
				<p>Comment fonctionne une mairie, le scrutin et le conseil municipal</p>
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
	}

	.legal-section {
		padding: 3rem 0;
	}

	.legal-content {
		display: grid;
		gap: 1.5rem;
		max-width: 800px;
	}

	.legal-card {
		padding: 1.5rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.legal-card h2 {
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.75rem;
	}

	.legal-card h3 {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 1rem 0 0.5rem;
	}

	.legal-card p {
		color: var(--color-text);
		line-height: 1.7;
		font-size: 0.95rem;
		margin-bottom: 0.75rem;
	}

	.legal-card p:last-child {
		margin-bottom: 0;
	}

	.legal-card a {
		color: var(--color-gold);
		text-decoration: underline;
	}

	.legal-card a:hover {
		color: var(--color-coral);
	}

	.legal-card ul {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0;
	}

	.legal-card li {
		font-size: 0.95rem;
		color: var(--color-text);
		line-height: 1.6;
		padding: 0.375rem 0 0.375rem 1.25rem;
		position: relative;
	}

	.legal-card li::before {
		content: '•';
		position: absolute;
		left: 0;
		color: var(--color-gold);
	}

	.legal-dl {
		display: grid;
		grid-template-columns: 160px 1fr;
		gap: 0.5rem 1rem;
		margin: 0.75rem 0;
	}

	@media (max-width: 640px) {
		.legal-dl {
			grid-template-columns: 1fr;
			gap: 0.25rem;
		}
	}

	.legal-dl dt {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.legal-dl dd {
		font-size: 0.9rem;
		color: var(--color-text);
		margin: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--color-card-border);
	}

	.legal-dl dd:last-child {
		border-bottom: none;
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
