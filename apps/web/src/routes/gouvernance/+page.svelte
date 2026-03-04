<script lang="ts">
	import SeoMeta from '$lib/components/SeoMeta.svelte';
	export const prerender = true;
</script>

<svelte:head>
	<title>Gouvernance municipale | maire.app</title>
	<meta name="description" content="Comment fonctionne une mairie en France ? Conseil municipal, scrutin, listes, intercommunalité — le guide citoyen complet." />
	<SeoMeta
		title="Gouvernance municipale | maire.app"
		description="Comment fonctionne une mairie en France ? Conseil municipal, scrutin, listes, intercommunalité — le guide citoyen complet."
		path="/gouvernance"
	/>
</svelte:head>

<section class="page-header">
	<div class="container-app">
		<h1 class="page-title">Comment fonctionne une mairie ?</h1>
		<p class="page-subtitle">Conseil municipal, mode de scrutin, listes électorales et intercommunalité — tout comprendre en 5 minutes</p>
	</div>
</section>

<section class="gov-section">
	<div class="container-app">
		<div class="gov-content">

			<!-- Le conseil municipal -->
			<div class="gov-card">
				<h2>Le conseil municipal</h2>
				<p>
					Le conseil municipal est l'assemblée délibérante de la commune. Il règle par ses délibérations
					les affaires de la commune : budget, urbanisme, équipements, action sociale, culture, sport.
					Le nombre de conseillers dépend de la population.
				</p>

				<div class="table-wrapper">
					<table class="gov-table">
						<thead>
							<tr>
								<th>Population</th>
								<th>Conseillers</th>
							</tr>
						</thead>
						<tbody>
							<tr><td>Moins de 100</td><td>7</td></tr>
							<tr><td>100 à 499</td><td>11</td></tr>
							<tr><td>500 à 1 499</td><td>15</td></tr>
							<tr><td>1 500 à 2 499</td><td>19</td></tr>
							<tr><td>2 500 à 3 499</td><td>23</td></tr>
							<tr><td>3 500 à 4 999</td><td>27</td></tr>
							<tr><td>5 000 à 9 999</td><td>29</td></tr>
							<tr><td>10 000 à 19 999</td><td>33</td></tr>
							<tr><td>20 000 à 29 999</td><td>35</td></tr>
							<tr><td>30 000 à 39 999</td><td>39</td></tr>
							<tr><td>40 000 à 49 999</td><td>43</td></tr>
							<tr><td>50 000 à 59 999</td><td>45</td></tr>
							<tr><td>60 000 à 79 999</td><td>49</td></tr>
							<tr><td>80 000 à 99 999</td><td>53</td></tr>
							<tr><td>100 000 à 149 999</td><td>55</td></tr>
							<tr><td>150 000 à 199 999</td><td>59</td></tr>
							<tr><td>200 000 à 249 999</td><td>61</td></tr>
							<tr><td>250 000 à 299 999</td><td>65</td></tr>
							<tr><td>300 000 et plus</td><td>69</td></tr>
						</tbody>
					</table>
				</div>
				<p class="source-note">Source : Code général des collectivités territoriales, art. L2121-2</p>

				<h3>Les adjoints</h3>
				<p>
					Le maire peut déléguer une partie de ses fonctions à des adjoints (urbanisme, finances, culture, etc.).
					Leur nombre ne peut pas dépasser 30 % de l'effectif du conseil. Ils forment avec le maire
					l'exécutif municipal — la « municipalité » au sens strict.
				</p>
			</div>

			<!-- Le scrutin municipal -->
			<div class="gov-card">
				<h2>Le scrutin municipal</h2>
				<p>
					Le mode d'élection dépend de la taille de la commune. Ce système à deux vitesses est
					une spécificité française.
				</p>

				<div class="scrutin-grid">
					<div class="scrutin-mode">
						<span class="scrutin-badge small">Moins de 1 000 hab.</span>
						<h3>Scrutin majoritaire plurinominal</h3>
						<ul>
							<li>Les candidats se présentent individuellement (pas de liste obligatoire)</li>
							<li>Les électeurs peuvent panacher : rayer des noms, en ajouter d'autres</li>
							<li>Élection à 2 tours — majorité absolue au 1er, relative au 2nd</li>
							<li>Pas d'obligation de parité</li>
						</ul>
					</div>

					<div class="scrutin-mode">
						<span class="scrutin-badge large">1 000 hab. et plus</span>
						<h3>Scrutin de liste à 2 tours</h3>
						<ul>
							<li>Listes complètes et bloquées (pas de panachage)</li>
							<li>Parité stricte : alternance homme-femme obligatoire</li>
							<li>La liste arrivée en tête obtient la <strong>prime majoritaire</strong> (50 % des sièges)</li>
							<li>Les sièges restants sont répartis à la proportionnelle</li>
							<li>Seuil au 1er tour : majorité absolue + 25 % des inscrits</li>
							<li>Seuil au 2nd tour : 10 % des inscrits pour se maintenir</li>
						</ul>
					</div>
				</div>

				<div class="info-box">
					<strong>La prime majoritaire</strong> garantit une majorité claire au conseil :
					la liste gagnante obtient au minimum 50 % des sièges + sa part proportionnelle.
					Avec 40 % des voix, une liste peut ainsi obtenir ~65 % des sièges.
				</div>
			</div>

			<!-- Les listes -->
			<div class="gov-card">
				<h2>Les listes électorales</h2>
				<p>
					Dans les communes de 1 000 habitants et plus, les candidats se présentent
					sur des listes. Voici comment elles fonctionnent.
				</p>

				<div class="list-rules">
					<div class="rule">
						<span class="rule-icon">1</span>
						<div>
							<strong>Tête de liste</strong>
							<p>Le premier nom de la liste est le candidat au poste de maire. Si la liste l'emporte, la tête de liste est généralement élu maire par le nouveau conseil.</p>
						</div>
					</div>
					<div class="rule">
						<span class="rule-icon">2</span>
						<div>
							<strong>Parité stricte</strong>
							<p>Chaque liste doit respecter l'alternance homme-femme. Si le 1er est un homme, la 2e est une femme, et ainsi de suite. Aucune dérogation possible.</p>
						</div>
					</div>
					<div class="rule">
						<span class="rule-icon">3</span>
						<div>
							<strong>Liste complète</strong>
							<p>La liste doit comporter autant de noms que de sièges à pourvoir. Une liste incomplète est irrecevable.</p>
						</div>
					</div>
					<div class="rule">
						<span class="rule-icon">4</span>
						<div>
							<strong>Coalitions et étiquettes</strong>
							<p>Les listes peuvent rassembler plusieurs partis ou être citoyennes (sans étiquette). Entre les deux tours, les listes ayant obtenu au moins 10 % peuvent fusionner.</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Intercommunalité -->
			<div class="gov-card">
				<h2>L'intercommunalité</h2>
				<p>
					Depuis la loi NOTRe (2015), toutes les communes appartiennent à un
					établissement public de coopération intercommunale (EPCI). C'est le regroupement
					de communes qui gère les compétences mutualisées.
				</p>

				<div class="epci-grid">
					<div class="epci-type">
						<span class="epci-badge cc">CC</span>
						<h3>Communauté de communes</h3>
						<p>Pas de seuil minimum. Regroupe des communes rurales. Compétences : développement économique, aménagement de l'espace, collecte des déchets.</p>
					</div>
					<div class="epci-type">
						<span class="epci-badge ca">CA</span>
						<h3>Communauté d'agglomération</h3>
						<p>Seuil : 50 000 hab. autour d'une ville-centre de 15 000 hab. Compétences étendues : transports urbains, habitat, politique de la ville.</p>
					</div>
					<div class="epci-type">
						<span class="epci-badge cu">CU</span>
						<h3>Communauté urbaine</h3>
						<p>Seuil : 250 000 hab. Compétences renforcées : eau, assainissement, voirie, stationnement, énergie.</p>
					</div>
					<div class="epci-type">
						<span class="epci-badge met">M</span>
						<h3>Métropole</h3>
						<p>Seuil : 400 000 hab. Compétences les plus larges, incluant l'enseignement supérieur, la recherche, et certaines compétences départementales.</p>
					</div>
				</div>

				<div class="info-box">
					Les représentants intercommunaux sont élus lors des élections municipales
					(fléchage sur les listes). Plus la commune est peuplée, plus elle a de
					représentants au conseil communautaire.
				</div>
			</div>

			<!-- Cross-links -->
			<div class="cta-grid">
				<a href="/devenir-maire" class="cta-card">
					<span class="cta-icon">&#x1F3DB;</span>
					<h3>Devenir maire</h3>
					<p>Indemnités, obligations, quotidien — le guide complet pour se lancer</p>
				</a>
				<a href="/elections/municipales-2026" class="cta-card">
					<span class="cta-icon">&#x1F5F3;</span>
					<h3>Municipales 2026</h3>
					<p>Découvrez les candidats et enjeux dans votre ville</p>
				</a>
				<a href="/couverture" class="cta-card">
					<span class="cta-icon">&#x1F4CA;</span>
					<h3>Couverture</h3>
					<p>Les villes et populations couvertes par maire.app</p>
				</a>
			</div>

		</div>
	</div>
</section>

<style>
	.gov-section {
		padding: 3rem 0 4rem;
		background: var(--color-cream);
	}

	.gov-content {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.gov-card {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		padding: 2rem;
	}

	.gov-card h2 {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.75rem;
	}

	.gov-card h3 {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 1.5rem 0 0.5rem;
	}

	.gov-card > p {
		font-size: 0.95rem;
		color: var(--color-text);
		line-height: 1.7;
		margin: 0 0 1rem;
	}

	/* Table */
	.table-wrapper {
		overflow-x: auto;
		margin: 1rem 0;
	}

	.gov-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.gov-table th {
		text-align: left;
		padding: 0.75rem 1rem;
		background: var(--color-navy);
		color: #faf8f5;
		font-weight: 600;
	}

	.gov-table th:first-child {
		border-radius: var(--radius-sm) 0 0 0;
	}

	.gov-table th:last-child {
		border-radius: 0 var(--radius-sm) 0 0;
		text-align: center;
	}

	.gov-table td {
		padding: 0.6rem 1rem;
		border-bottom: 1px solid var(--color-cream-dark);
	}

	.gov-table td:last-child {
		text-align: center;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.gov-table tbody tr:nth-child(even) {
		background: var(--color-cream);
	}

	.source-note {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0.5rem 0 0;
	}

	/* Scrutin grid */
	.scrutin-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin: 1rem 0;
	}

	@media (max-width: 640px) {
		.scrutin-grid { grid-template-columns: 1fr; }
	}

	.scrutin-mode {
		padding: 1.25rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-cream-dark);
	}

	.scrutin-mode h3 {
		margin: 0.75rem 0 0.5rem;
		font-size: 1rem;
	}

	.scrutin-mode ul {
		margin: 0;
		padding: 0 0 0 1.2rem;
	}

	.scrutin-mode li {
		font-size: 0.85rem;
		color: var(--color-text);
		line-height: 1.6;
		margin-bottom: 0.25rem;
	}

	.scrutin-badge {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.2rem 0.6rem;
		border-radius: 4px;
	}

	.scrutin-badge.small {
		background: rgba(201, 169, 98, 0.15);
		color: var(--color-gold-dark);
	}

	.scrutin-badge.large {
		background: rgba(74, 157, 110, 0.15);
		color: var(--color-success);
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

	/* List rules */
	.list-rules {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
	}

	.rule {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.rule-icon {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		background: var(--color-gold);
		color: var(--color-foreground);
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.85rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.rule strong {
		display: block;
		color: var(--color-foreground);
		font-size: 0.95rem;
		margin-bottom: 0.2rem;
	}

	.rule p {
		font-size: 0.85rem;
		color: var(--color-text);
		line-height: 1.6;
		margin: 0;
	}

	/* EPCI grid */
	.epci-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin: 1rem 0;
	}

	@media (max-width: 640px) {
		.epci-grid { grid-template-columns: 1fr; }
	}

	.epci-type {
		padding: 1.25rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
	}

	.epci-type h3 {
		margin: 0.5rem 0 0.4rem;
		font-size: 0.95rem;
	}

	.epci-type p {
		font-size: 0.8rem;
		color: var(--color-text);
		line-height: 1.5;
		margin: 0;
	}

	.epci-badge {
		font-size: 0.65rem;
		font-weight: 800;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		letter-spacing: 0.05em;
	}

	.epci-badge.cc { background: #e8d9a8; color: var(--color-foreground); }
	.epci-badge.ca { background: #b8d4c8; color: var(--color-foreground); }
	.epci-badge.cu { background: #a8c4e0; color: var(--color-foreground); }
	.epci-badge.met { background: #c4a8e0; color: var(--color-foreground); }

	/* CTA grid */
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
