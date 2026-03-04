<script lang="ts">
	import SeoMeta from '$lib/components/SeoMeta.svelte';
	export const prerender = true;

	const indemnites = [
		{ label: 'Moins de 500', montant: 991, pct: 11.5 },
		{ label: '500 à 999', montant: 1567, pct: 18.1 },
		{ label: '1 000 à 3 499', montant: 2006, pct: 23.2 },
		{ label: '3 500 à 9 999', montant: 2139, pct: 24.7 },
		{ label: '10 000 à 19 999', montant: 2528, pct: 29.2 },
		{ label: '20 000 à 49 999', montant: 3500, pct: 40.5 },
		{ label: '50 000 à 99 999', montant: 4278, pct: 49.5 },
		{ label: '100 000 et plus', montant: 5639, pct: 65.2 },
		{ label: 'Paris, Lyon, Marseille', montant: 8650, pct: 100 },
	];

	const horaires = [
		{ taille: 'Village (< 500 hab.)', heures: '15–20 h/semaine', note: 'Souvent en plus d\'un emploi. Astreintes ponctuelles.', pct: 25 },
		{ taille: 'Bourg (500–3 500)', heures: '25–35 h/semaine', note: 'Cumul emploi/mandat fréquent mais difficile.', pct: 43 },
		{ taille: 'Petite ville (3 500–20 000)', heures: '40–50 h/semaine', note: 'De facto temps plein. Réunions le soir, weekends.', pct: 64 },
		{ taille: 'Ville moyenne (20 000–100 000)', heures: '50–60 h/semaine', note: 'Temps plein + astreintes. Représentation extérieure.', pct: 79 },
		{ taille: 'Grande ville (> 100 000)', heures: '60–70 h/semaine', note: 'Agenda saturé. Cabinet, intercommunalité, État.', pct: 93 },
	];
</script>

<svelte:head>
	<title>Devenir maire — le guide complet | maire.app</title>
	<meta name="description" content="Pourquoi devenir maire ? Pouvoirs, indemnités, quotidien, obligations légales. Le guide complet pour les futurs candidats aux municipales." />
	<SeoMeta
		title="Devenir maire — le guide complet | maire.app"
		description="Pourquoi devenir maire ? Pouvoirs, indemnités, quotidien, obligations légales. Le guide complet pour les futurs candidats aux municipales."
		path="/devenir-maire"
	/>
</svelte:head>

<section class="page-header">
	<div class="container-app">
		<h1 class="page-title">Devenir maire</h1>
		<p class="page-subtitle">Le mandat le plus concret de la République — pouvoirs, quotidien, indemnités et opportunités</p>
	</div>
</section>

<section class="maire-section">
	<div class="container-app">
		<div class="maire-content">

			<!-- Motivation -->
			<div class="maire-card highlight-card">
				<h2>Pourquoi devenir maire ?</h2>
				<p>
					Avec plus de 500 000 élus municipaux, le conseil municipal est le mandat électif
					le plus accessible en France. C'est aussi le plus concret : les décisions prises
					touchent directement le quotidien des habitants — école, voirie, urbanisme, sécurité, culture.
				</p>
				<div class="stat-highlights">
					<div class="stat-hl">
						<span class="stat-big">34 935</span>
						<span class="stat-desc">communes en France</span>
					</div>
					<div class="stat-hl">
						<span class="stat-big">500 000+</span>
						<span class="stat-desc">élus municipaux</span>
					</div>
					<div class="stat-hl">
						<span class="stat-big">6 ans</span>
						<span class="stat-desc">durée du mandat</span>
					</div>
				</div>
				<p>
					La baisse de la participation (44,7 % au 2nd tour en 2020, contre 65 % en 2008)
					montre un besoin de renouvellement. De nouveaux profils — jeunes, femmes, société
					civile — peuvent transformer la politique locale.
				</p>
			</div>

			<!-- Pouvoirs -->
			<div class="maire-card">
				<h2>Les pouvoirs du maire</h2>
				<p>Le maire cumule deux casquettes : chef de l'exécutif communal et agent de l'État.</p>

				<div class="powers-grid">
					<div class="power">
						<h3>Chef de l'exécutif</h3>
						<ul>
							<li>Prépare et exécute le budget communal</li>
							<li>Délivre les permis de construire et autorisations d'urbanisme</li>
							<li>Gère le personnel communal (embauche, organisation)</li>
							<li>Représente la commune en justice et dans les contrats</li>
							<li>Préside le conseil municipal et propose les délibérations</li>
						</ul>
					</div>
					<div class="power">
						<h3>Agent de l'État</h3>
						<ul>
							<li>Officier d'état civil : mariages, naissances, décès</li>
							<li>Officier de police judiciaire (constatations, enquêtes)</li>
							<li>Organisation des élections et révision des listes</li>
							<li>Publication et exécution des lois et règlements</li>
							<li>Recensement de la population</li>
						</ul>
					</div>
				</div>

				<div class="power">
					<h3>Police municipale</h3>
					<p>
						Le maire est responsable de l'ordre public, de la sécurité, de la salubrité
						et de la tranquillité publique sur le territoire communal. Il peut prendre des
						arrêtés municipaux (circulation, stationnement, bruit, etc.).
					</p>
				</div>
			</div>

			<!-- Indemnités -->
			<div class="maire-card">
				<h2>Indemnités de fonction</h2>
				<p>
					Les maires perçoivent une indemnité de fonction (pas un salaire) dont le plafond
					est fixé par la loi. Le conseil municipal vote le montant effectif, qui peut être
					inférieur au plafond.
				</p>

				<div class="chart-container">
					{#each indemnites as item}
						<div class="chart-row">
							<span class="chart-label">{item.label}</span>
							<div class="chart-bar-wrapper">
								<div class="chart-bar" style="width: {item.pct}%"></div>
							</div>
							<span class="chart-value">{item.montant.toLocaleString('fr-FR')} €</span>
						</div>
					{/each}
				</div>

				<p class="source-note">
					Montants bruts mensuels maximaux. Source : CGCT art. L2123-23 (barème 2025).
					Les adjoints perçoivent un pourcentage de l'indemnité du maire.
				</p>
			</div>

			<!-- Quotidien -->
			<div class="maire-card">
				<h2>Le quotidien d'un maire</h2>
				<p>
					Le temps consacré au mandat varie énormément selon la taille de la commune.
					Dans les petites communes, le maire exerce souvent en parallèle d'une activité
					professionnelle. Dans les villes moyennes et grandes, c'est un engagement à temps plein.
				</p>

				<div class="hours-list">
					{#each horaires as h}
						<div class="hours-item">
							<div class="hours-header">
								<span class="hours-title">{h.taille}</span>
								<span class="hours-value">{h.heures}</span>
							</div>
							<div class="hours-bar-bg">
								<div class="hours-bar" style="width: {h.pct}%"></div>
							</div>
							<p class="hours-note">{h.note}</p>
						</div>
					{/each}
				</div>

				<div class="info-box">
					<strong>Réalité terrain :</strong> réunions du conseil (soirée), inaugurations (weekend),
					cérémonies (samedi), astreintes téléphoniques, accueil des administrés en mairie,
					réunions intercommunales, relations avec la préfecture. Le maire est joignable
					quasi en permanence.
				</div>
			</div>

			<!-- Communes nouvelles -->
			<div class="maire-card">
				<h2>Communes nouvelles : fusionner pour mieux servir</h2>
				<p>
					Depuis 2015, plus de 2 500 communes ont fusionné en « communes nouvelles »,
					regroupant leurs moyens pour offrir de meilleurs services aux habitants.
					L'État encourage ces fusions avec des incitations financières.
				</p>

				<div class="fusion-benefits">
					<div class="benefit">
						<span class="benefit-icon">+5%</span>
						<div>
							<strong>Bonus DGF garanti</strong>
							<p>La dotation globale de fonctionnement est majorée de 5 % pendant 3 ans pour les communes nouvelles de moins de 150 000 habitants.</p>
						</div>
					</div>
					<div class="benefit">
						<span class="benefit-icon benefit-savings">&#x21C4;</span>
						<div>
							<strong>Mutualisation des services</strong>
							<p>Secrétariat de mairie, services techniques, informatique, achats groupés — les économies d'échelle sont immédiates.</p>
						</div>
					</div>
					<div class="benefit">
						<span class="benefit-icon benefit-voice">&#x1F50A;</span>
						<div>
							<strong>Poids politique renforcé</strong>
							<p>Une commune plus peuplée a plus de représentants à l'intercommunalité et un pouvoir de négociation accru face à l'État et la région.</p>
						</div>
					</div>
					<div class="benefit">
						<span class="benefit-icon benefit-proj">&#x1F3D7;</span>
						<div>
							<strong>Capacité d'investissement</strong>
							<p>Budget consolidé, meilleure capacité d'emprunt, accès facilité aux subventions (DETR, DSIL) pour les projets structurants.</p>
						</div>
					</div>
				</div>

				<div class="info-box">
					Les anciennes communes deviennent des « communes déléguées » avec un maire délégué
					et une mairie annexe. L'identité locale est préservée tout en mutualisant les moyens.
				</div>
			</div>

			<!-- Plateforme -->
			<div class="maire-card highlight-card">
				<h2>maire.app : la plateforme des élus</h2>
				<p>
					Notre vision : construire une plateforme collaborative où les maires partagent
					leurs bonnes pratiques, mutualisent leurs outils et bénéficient d'une assistance
					IA au quotidien — discours, délibérations, réponses aux administrés.
				</p>
				<a href="/fonctionnalites" class="cta-btn">
					Découvrir les fonctionnalités
				</a>
			</div>

			<!-- Cross-links -->
			<div class="cta-grid">
				<a href="/gouvernance" class="cta-card">
					<span class="cta-icon">&#x1F3DB;</span>
					<h3>Gouvernance municipale</h3>
					<p>Conseil municipal, scrutin, listes, intercommunalité</p>
				</a>
				<a href="/elections/municipales-2026" class="cta-card">
					<span class="cta-icon">&#x1F5F3;</span>
					<h3>Municipales 2026</h3>
					<p>Candidats et enjeux dans votre ville</p>
				</a>
				<a href="/couverture" class="cta-card">
					<span class="cta-icon">&#x1F4CA;</span>
					<h3>Couverture</h3>
					<p>Villes et populations couvertes par maire.app</p>
				</a>
			</div>

		</div>
	</div>
</section>

<style>
	.maire-section {
		padding: 3rem 0 4rem;
		background: var(--color-cream);
	}

	.maire-content {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.maire-card {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		padding: 2rem;
	}

	.maire-card.highlight-card {
		border: 2px solid var(--color-gold-light);
	}

	.maire-card h2 {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.75rem;
	}

	.maire-card h3 {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 1rem 0 0.5rem;
	}

	.maire-card > p {
		font-size: 0.95rem;
		color: var(--color-text);
		line-height: 1.7;
		margin: 0 0 1rem;
	}

	/* Stat highlights */
	.stat-highlights {
		display: flex;
		gap: 1.5rem;
		margin: 1.5rem 0;
		flex-wrap: wrap;
	}

	.stat-hl {
		flex: 1;
		min-width: 120px;
		text-align: center;
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
	}

	.stat-big {
		display: block;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-gold-dark);
	}

	.stat-desc {
		font-size: 0.75rem;
		color: var(--color-text-light);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Powers grid */
	.powers-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin: 1rem 0;
	}

	@media (max-width: 640px) {
		.powers-grid { grid-template-columns: 1fr; }
	}

	.power {
		margin-bottom: 0.5rem;
	}

	.power ul {
		margin: 0;
		padding: 0 0 0 1.2rem;
	}

	.power li {
		font-size: 0.85rem;
		color: var(--color-text);
		line-height: 1.6;
		margin-bottom: 0.3rem;
	}

	.power > p {
		font-size: 0.9rem;
		color: var(--color-text);
		line-height: 1.6;
		margin: 0;
	}

	/* Indemnité chart */
	.chart-container {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin: 1.5rem 0;
	}

	.chart-row {
		display: grid;
		grid-template-columns: 160px 1fr 80px;
		align-items: center;
		gap: 0.75rem;
	}

	@media (max-width: 500px) {
		.chart-row {
			grid-template-columns: 1fr;
			gap: 0.2rem;
		}
		.chart-label { font-size: 0.75rem; }
	}

	.chart-label {
		font-size: 0.8rem;
		color: var(--color-text);
		white-space: nowrap;
	}

	.chart-bar-wrapper {
		height: 24px;
		background: var(--color-cream);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.chart-bar {
		height: 100%;
		background: linear-gradient(90deg, var(--color-gold), var(--color-gold-dark));
		border-radius: var(--radius-sm);
		transition: width 0.5s ease;
	}

	.chart-value {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-foreground);
		text-align: right;
		white-space: nowrap;
	}

	.source-note {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0.5rem 0 0;
	}

	/* Working hours */
	.hours-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin: 1rem 0;
	}

	.hours-item {
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
	}

	.hours-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.hours-title {
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--color-foreground);
	}

	.hours-value {
		font-weight: 700;
		font-size: 0.85rem;
		color: var(--color-gold-dark);
	}

	.hours-bar-bg {
		height: 8px;
		background: var(--color-cream-dark);
		border-radius: 4px;
		overflow: hidden;
	}

	.hours-bar {
		height: 100%;
		background: linear-gradient(90deg, var(--color-success), var(--color-coral));
		border-radius: 4px;
	}

	.hours-note {
		font-size: 0.8rem;
		color: var(--color-text-light);
		margin: 0.4rem 0 0;
	}

	.info-box {
		padding: 1rem 1.25rem;
		background: rgba(201, 169, 98, 0.08);
		border-left: 3px solid var(--color-gold);
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
		font-size: 0.9rem;
		color: var(--color-text);
		line-height: 1.6;
		margin-top: 1rem;
	}

	/* Fusion benefits */
	.fusion-benefits {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin: 1rem 0;
	}

	.benefit {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.benefit-icon {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		background: var(--color-success);
		color: white;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 0.85rem;
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.benefit-savings { background: var(--color-gold); color: var(--color-foreground); }
	.benefit-voice { background: var(--color-navy); }
	.benefit-proj { background: var(--color-coral); }

	.benefit strong {
		display: block;
		color: var(--color-foreground);
		font-size: 0.95rem;
		margin-bottom: 0.2rem;
	}

	.benefit p {
		font-size: 0.85rem;
		color: var(--color-text);
		line-height: 1.5;
		margin: 0;
	}

	/* CTA button */
	.cta-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--color-gold);
		color: var(--color-navy) !important;
		font-weight: 700;
		font-size: 0.9rem;
		border-radius: var(--radius-md);
		text-decoration: none !important;
		transition: all 0.15s ease;
	}

	.cta-btn:hover {
		filter: brightness(1.05);
		transform: translateY(-1px);
	}

	/* CTA grid (shared with gouvernance) */
	.cta-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	@media (max-width: 640px) {
		.cta-grid { grid-template-columns: 1fr; }
	}

	.cta-card {
		padding: 1.5rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		text-decoration: none !important;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
		text-align: center;
	}

	.cta-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(10, 22, 40, 0.12);
	}

	.cta-icon {
		font-size: 2rem;
		display: block;
		margin-bottom: 0.5rem;
	}

	.cta-card h3 {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.25rem;
	}

	.cta-card p {
		font-size: 0.8rem;
		color: var(--color-text-light);
		line-height: 1.4;
		margin: 0;
	}
</style>
