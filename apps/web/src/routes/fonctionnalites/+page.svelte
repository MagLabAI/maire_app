<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import SeoMeta from '$lib/components/SeoMeta.svelte';

	// Newsletter registration state
	let nlEmail = $state('');
	let nlStatus = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let nlMessage = $state('');
	let turnstileToken = $state('');
	let turnstileReady = $state(false);

	// Turnstile site key — set via env or fallback to Cloudflare test key in dev
	const TURNSTILE_SITEKEY = import.meta.env.PUBLIC_TURNSTILE_SITEKEY || '1x00000000000000000000AA';

	// Load Turnstile script + render widget
	onMount(() => {
		if (!browser) return;

		const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
		if (existing) {
			renderTurnstile();
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
		script.async = true;

		(window as Record<string, unknown>).onTurnstileLoad = () => renderTurnstile();
		document.head.appendChild(script);
	});

	function renderTurnstile() {
		const w = window as Record<string, unknown>;
		if (!w.turnstile) return;

		const turnstile = w.turnstile as {
			render: (el: HTMLElement, opts: Record<string, unknown>) => void;
		};

		// Render into all containers on the page
		document.querySelectorAll('.turnstile-container').forEach((el) => {
			if (el.children.length > 0) return;
			turnstile.render(el as HTMLElement, {
				sitekey: TURNSTILE_SITEKEY,
				theme: 'light',
				size: 'flexible',
				callback: (token: string) => {
					turnstileToken = token;
					turnstileReady = true;
				},
				'expired-callback': () => {
					turnstileToken = '';
					turnstileReady = false;
				}
			});
		});
	}

	async function submitNewsletter(e: Event) {
		e.preventDefault();
		if (nlStatus === 'loading') return;

		const email = nlEmail.trim().toLowerCase();
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			nlStatus = 'error';
			nlMessage = 'Veuillez entrer une adresse email valide.';
			return;
		}

		nlStatus = 'loading';
		try {
			const res = await fetch('/api/newsletter', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, token: turnstileToken })
			});
			const result = await res.json();

			if (res.ok) {
				nlStatus = 'success';
				nlMessage = result.message;
			} else {
				nlStatus = 'error';
				nlMessage = result.message || 'Une erreur est survenue.';
			}
		} catch {
			nlStatus = 'error';
			nlMessage = 'Erreur réseau. Veuillez réessayer.';
		}
	}
</script>

<svelte:head>
	<title>Fonctionnalités — maire.app</title>
	<meta name="description" content="maire.app aide les maires à comprendre leur territoire grâce à l'analyse de sentiment, la veille réglementaire et l'analyse stratégique — propulsé par Mistral AI." />
	<SeoMeta
		title="Fonctionnalités — maire.app"
		description="maire.app aide les maires à comprendre leur territoire grâce à l'analyse de sentiment, la veille réglementaire et l'analyse stratégique — propulsé par Mistral AI."
		path="/fonctionnalites"
	/>
</svelte:head>

<div class="features-page">
	<!-- Hero Section -->
	<section class="features-hero">
		<div class="hero-content">
			<span class="hero-badge">Vision exploratoire</span>
			<h1>Et si l'IA aidait aussi les maires ?</h1>
			<p class="hero-subtitle">
				Au-delà des élections, nous explorons comment l'IA pourrait accompagner les élus locaux.
				Ces fonctionnalités sont des pistes de réflexion — leur développement dépendra
				des retours et de l'intérêt que suscite cette expérience.
			</p>
			{#if nlStatus === 'success'}
				<div class="hero-success">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>{nlMessage}</span>
				</div>
			{:else}
				<form class="hero-form" onsubmit={submitNewsletter}>
					<div class="hero-form-row">
						<input
							type="email"
							placeholder="votre@email.fr"
							bind:value={nlEmail}
							required
							class="hero-input"
							disabled={nlStatus === 'loading'}
						/>
						<button type="submit" class="hero-cta" disabled={nlStatus === 'loading'}>
							{nlStatus === 'loading' ? 'Inscription...' : 'Rester informé(e)'}
						</button>
					</div>
					<div class="turnstile-container"></div>
					{#if nlStatus === 'error'}
						<p class="hero-error">{nlMessage}</p>
					{/if}
					<p class="hero-form-hint">Recevez les actualités et l'accès en avant-première. Pas de spam.</p>
				</form>
			{/if}
		</div>
	</section>

	<!-- Feature 1: Écoute Citoyenne -->
	<section class="feature-section">
		<div class="feature-content">
			<div class="feature-icon-large listening-icon">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
				</svg>
			</div>
			<span class="feature-tag">Comprendre votre territoire</span>
			<h2>Écoute Citoyenne</h2>
			<p class="feature-description">
				Comprenez ce que pensent vos administrés sans attendre les réunions publiques.
				Nos agents analysent les réseaux sociaux, la presse locale et les forums
				pour vous donner une vision claire du sentiment de votre commune — en temps réel.
			</p>
			<ul class="feature-list">
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Analyse de sentiment sur les réseaux sociaux et la presse locale
				</li>
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Identification des sujets de préoccupation émergents
				</li>
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Rapports hebdomadaires avec tendances et points d'attention
				</li>
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Alertes sur les situations sensibles à traiter rapidement
				</li>
			</ul>
		</div>
		<div class="feature-visual">
			<div class="dashboard-mockup">
				<div class="dashboard-header">
					<span class="dashboard-title">Écoute Citoyenne</span>
					<span class="dashboard-live">EN DIRECT</span>
				</div>
				<div class="dashboard-grid">
					<div class="stat-card">
						<span class="stat-label">Satisfaction</span>
						<span class="stat-value positive">72%</span>
						<span class="stat-trend">+3% ce mois</span>
					</div>
					<div class="stat-card">
						<span class="stat-label">Sujets actifs</span>
						<span class="stat-value">8</span>
						<span class="stat-trend">2 nouveaux</span>
					</div>
					<div class="stat-card">
						<span class="stat-label">Mentions presse</span>
						<span class="stat-value">34</span>
						<span class="stat-trend">cette semaine</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Feature 2: Cahier de Doléances Numérique -->
	<section class="feature-section feature-alt">
		<div class="feature-visual">
			<div class="mockup-card">
				<div class="mockup-header">
					<div class="mockup-dots">
						<span></span><span></span><span></span>
					</div>
					<span class="mockup-title">Cahier de Doléances</span>
				</div>
				<div class="mockup-body">
					<div class="doleance-item">
						<span class="doleance-category">Mobilité</span>
						<span class="doleance-count">47 signalements</span>
						<p class="doleance-text">Pistes cyclables insuffisantes sur l'axe centre-ville</p>
					</div>
					<div class="doleance-item">
						<span class="doleance-category">Propreté</span>
						<span class="doleance-count">31 signalements</span>
						<p class="doleance-text">Collecte des encombrants : délais jugés trop longs</p>
					</div>
					<div class="doleance-item">
						<span class="doleance-category">Vie scolaire</span>
						<span class="doleance-count">23 signalements</span>
						<p class="doleance-text">Demande d'extension des horaires périscolaires</p>
					</div>
				</div>
			</div>
		</div>
		<div class="feature-content">
			<div class="feature-icon-large doleance-icon">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</div>
			<span class="feature-tag highlight">Innovation</span>
			<h2>Cahier de Doléances Numérique</h2>
			<p class="feature-description">
				Le Cahier de Doléances est une tradition démocratique française jamais vraiment analysée
				à grande échelle. Nos agents collectent et structurent les remontées citoyennes
				— courriers, emails, formulaires en ligne, réseaux sociaux — pour en extraire
				les tendances et priorités de votre commune.
			</p>
			<ul class="feature-list">
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Agrégation automatique des remontées citoyennes (courriers, emails, formulaires)
				</li>
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Classification par thématique et niveau d'urgence
				</li>
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Détection des sujets récurrents et des quartiers concernés
				</li>
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Tableau de bord pour suivre les réponses apportées
				</li>
			</ul>
		</div>
	</section>

	<!-- Feature 3: Veille Réglementaire -->
	<section class="feature-section">
		<div class="feature-content">
			<div class="feature-icon-large veille-icon">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
			</div>
			<span class="feature-tag">Gagner du temps</span>
			<h2>Veille Réglementaire</h2>
			<p class="feature-description">
				Le cadre législatif évolue en permanence. Nos agents surveillent les textes de loi,
				décrets et circulaires qui impactent votre commune et vous en font un résumé
				clair avec les actions concrètes à mener.
			</p>
			<ul class="feature-list">
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Suivi du Journal Officiel et des circulaires préfectorales
				</li>
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Résumés vulgarisés des textes applicables à votre commune
				</li>
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Alertes sur les nouvelles obligations (délais, conformité)
				</li>
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Checklist d'actions pour chaque évolution réglementaire
				</li>
			</ul>
		</div>
		<div class="feature-visual">
			<div class="mockup-card">
				<div class="mockup-header">
					<div class="mockup-dots">
						<span></span><span></span><span></span>
					</div>
					<span class="mockup-title">Veille Réglementaire</span>
				</div>
				<div class="mockup-body">
					<div class="veille-item new">
						<span class="veille-date">12 fév. 2026</span>
						<span class="veille-badge">Nouveau</span>
						<p class="veille-text">Décret n°2026-123 : nouvelles obligations d'accessibilité PMR pour les ERP communaux</p>
						<span class="veille-action">3 actions à mener avant le 1er juin</span>
					</div>
					<div class="veille-item">
						<span class="veille-date">8 fév. 2026</span>
						<p class="veille-text">Circulaire DGF : modalités de calcul pour les communes nouvelles</p>
						<span class="veille-action">Information — aucune action requise</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Feature 4: Analyse Stratégique -->
	<section class="feature-section feature-alt">
		<div class="feature-visual">
			<div class="strategy-mockup">
				<div class="strategy-header">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
					<span class="strategy-title">Analyse Stratégique</span>
				</div>
				<div class="strategy-content">
					<div class="strategy-insight">
						<span class="insight-category">Opportunité détectée</span>
						<p class="insight-text">
							L'enjeu de la mobilité douce gagne en importance dans votre commune.
							Suggestion : organiser une consultation citoyenne sur les pistes cyclables.
						</p>
					</div>
					<div class="strategy-insight warning">
						<span class="insight-category">Point d'attention</span>
						<p class="insight-text">
							Le taux de satisfaction sur la propreté urbaine est en baisse de 8 points
							depuis 3 mois. Suggestion : réunion avec le service voirie.
						</p>
					</div>
				</div>
			</div>
		</div>
		<div class="feature-content">
			<div class="feature-icon-large strategy-icon">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</div>
			<span class="feature-tag highlight">Aide à la décision</span>
			<h2>Analyse Stratégique</h2>
			<p class="feature-description">
				Nos agents croisent automatiquement les données de votre commune — satisfaction citoyenne,
				évolutions réglementaires, budget, démographie — pour faire émerger des suggestions
				concrètes destinées à votre équipe municipale. Vous gardez le pouvoir de décision,
				l'IA vous aide à voir clair.
			</p>
			<ul class="feature-list">
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Suggestions hebdomadaires contextualisées pour l'équipe municipale
				</li>
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Détection proactive des opportunités et des risques
				</li>
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Comparaison anonyme avec des communes de taille similaire
				</li>
				<li>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					Propulsé par <a href="https://mistral.ai" target="_blank" rel="noopener">Mistral AI</a> — données hébergées en France, conformité RGPD
				</li>
			</ul>
		</div>
	</section>

	<!-- Pricing Section -->
	<section class="pricing-section" id="tarifs">
		<div class="pricing-header">
			<span class="section-tag">Accessible à tous</span>
			<h2>Couvrir les frais, pas plus</h2>
			<p>
				Si ce service voit le jour, il sera déployé par MagLab Studio, un projet communautaire open source.
				Les tarifs indicatifs ci-dessous couvriront uniquement les coûts d'infrastructure IA
				et d'hébergement. L'objectif : rendre ces outils accessibles au plus grand nombre de communes,
				en particulier celles qui fonctionnent avec des dotations modestes et grâce au bénévolat.
			</p>
		</div>

		<div class="pricing-grid">
			<!-- Free -->
			<div class="pricing-card featured">
				<div class="pricing-badge">Pour tous</div>
				<div class="pricing-card-header">
					<h3>Citoyen</h3>
					<div class="pricing-price">
						<span class="price-amount">0&#8364;</span>
						<span class="price-period">pour toujours</span>
					</div>
				</div>
				<p class="pricing-description">L'essentiel pour les citoyens et les petites communes</p>
				<ul class="pricing-features">
					<li>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Fiches candidats, comparateur, guides
					</li>
					<li>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Écoute citoyenne (rapport mensuel)
					</li>
					<li>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Veille réglementaire de base
					</li>
					<li>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Demande de recherche pour votre ville
					</li>
				</ul>
				<a href="#top" class="pricing-cta primary" onclick={(e) => { e.preventDefault(); document.querySelector('.hero-input')?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>S'inscrire gratuitement</a>
			</div>

			<!-- Commune -->
			<div class="pricing-card">
				<div class="pricing-card-header">
					<h3>Commune</h3>
					<div class="pricing-price">
						<span class="price-amount">~20&#8364;</span>
						<span class="price-period">/mois indicatif</span>
					</div>
				</div>
				<p class="pricing-description">Pour les équipes municipales — adapté aux petites communes</p>
				<ul class="pricing-features">
					<li>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Écoute citoyenne en temps réel
					</li>
					<li>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Cahier de Doléances numérique
					</li>
					<li>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Analyse stratégique et suggestions
					</li>
					<li>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Accès équipe (maire + adjoints)
					</li>
				</ul>
				<p class="token-explainer">
					Tarif indicatif pour couvrir les coûts d'infrastructure.
					L'objectif est de rester accessible, même pour les communes
					à faible dotation.
				</p>
				<a href="mailto:contact@maire.app?subject=Interet Commune" class="pricing-cta secondary">Manifester son intérêt</a>
			</div>

			<!-- Intercommunalité -->
			<div class="pricing-card">
				<div class="pricing-card-header">
					<h3>Intercommunalité</h3>
					<div class="pricing-price">
						<span class="price-amount">~50&#8364;</span>
						<span class="price-period">/mois indicatif</span>
					</div>
				</div>
				<p class="pricing-description">Pour les EPCI et usages multi-communes</p>
				<ul class="pricing-features">
					<li>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Toutes les fonctionnalités
					</li>
					<li>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Comparaison inter-communes anonyme
					</li>
					<li>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Utilisateurs illimités + API
					</li>
					<li>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Mutualisation des coûts entre communes membres
					</li>
				</ul>
				<p class="token-explainer">
					Paiement à l'usage par tokens IA. Chaque analyse consomme un nombre de tokens
					proportionnel à sa complexité — vous ne payez que ce que vous utilisez.
				</p>
				<a href="mailto:contact@maire.app?subject=Interet Intercommunalite" class="pricing-cta secondary">Manifester son intérêt</a>
			</div>
		</div>
	</section>

	<!-- Philosophy Section -->
	<section class="philosophy-section">
		<div class="philosophy-content">
			<h2>L'IA qui aide, pas qui remplace</h2>
			<p>
				Nous croyons que la décision politique doit rester humaine. L'IA n'est pas là pour
				rédiger vos discours ou remplacer votre jugement — elle est là pour vous faire gagner
				du temps sur l'analyse, vous aider à voir ce que vous n'avez pas le temps de lire,
				et vous donner les clés pour décider en connaissance de cause.
			</p>
			<div class="philosophy-grid">
				<div class="philosophy-card">
					<strong>Comprendre</strong>
					<span>L'IA synthétise des milliers de signaux pour vous donner une vision claire de votre territoire</span>
				</div>
				<div class="philosophy-card">
					<strong>Anticiper</strong>
					<span>Identifiez les tendances et les risques avant qu'ils ne deviennent des crises</span>
				</div>
				<div class="philosophy-card">
					<strong>Décider</strong>
					<span>Vous gardez le pouvoir de décision — l'IA éclaire, vous choisissez</span>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="cta-section">
		<div class="cta-content">
			<h2>L'IA au service de la démocratie</h2>
			<p>Découvrez ce que l'IA peut apporter à la transparence démocratique.</p>
			{#if nlStatus === 'success'}
				<div class="hero-success" style="justify-content: center;">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span style="color: var(--color-gold-light);">{nlMessage}</span>
				</div>
			{:else}
				<form class="cta-form" onsubmit={submitNewsletter}>
					<div class="hero-form-row" style="justify-content: center;">
						<input
							type="email"
							placeholder="votre@email.fr"
							bind:value={nlEmail}
							required
							class="hero-input"
							disabled={nlStatus === 'loading'}
						/>
						<button type="submit" class="cta-button" disabled={nlStatus === 'loading'}>
							{nlStatus === 'loading' ? 'Inscription...' : 'Rester informé(e)'}
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
							</svg>
						</button>
					</div>
					<div class="turnstile-container" style="display: flex; justify-content: center; margin-top: 0.5rem;"></div>
					{#if nlStatus === 'error'}
						<p class="hero-error">{nlMessage}</p>
					{/if}
				</form>
			{/if}
			<div class="cta-links">
				<a href="/gouvernance">Gouvernance municipale</a>
				<a href="/devenir-maire">Devenir maire</a>
				<a href="/couverture">Couverture</a>
			</div>
		</div>
	</section>

	<!-- Cross-links -->
	<section class="crosslinks-section">
		<div class="container-app">
			<div class="crosslinks-grid">
				<a href="/a-propos" class="crosslink-card">
					<h3>Notre mission</h3>
					<p>Un projet citoyen indépendant pour la transparence démocratique</p>
				</a>
				<a href="/devenir-maire" class="crosslink-card">
					<h3>Devenir maire</h3>
					<p>Pouvoirs, indemnités, quotidien — le guide complet</p>
				</a>
				<a href="/elections/municipales-2026" class="crosslink-card">
					<h3>Municipales 2026</h3>
					<p>Découvrez les candidats et enjeux dans votre ville</p>
				</a>
			</div>
		</div>
	</section>
</div>

<style>
	.features-page {
		background: var(--color-cream);
	}

	/* Hero */
	.features-hero {
		background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
		padding: 4rem 1rem 5rem;
		text-align: center;
	}

	.hero-content {
		max-width: 800px;
		margin: 0 auto;
	}

	.hero-badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: rgba(201, 169, 98, 0.2);
		color: var(--color-gold);
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
	}

	.features-hero h1 {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 700;
		color: #faf8f5;
		margin: 0 0 1rem;
		line-height: 1.2;
	}

	@media (min-width: 640px) {
		.features-hero h1 {
			font-size: 2.5rem;
		}
	}

	@media (min-width: 768px) {
		.features-hero h1 {
			font-size: 3rem;
		}
	}

	.hero-subtitle {
		font-size: 1.1rem;
		color: var(--color-gold-light);
		margin: 0 0 2rem;
		line-height: 1.6;
	}

	.hero-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		background: var(--color-gold);
		color: var(--color-foreground);
		border-radius: var(--radius-md);
		font-weight: 700;
		font-size: 1rem;
		transition: all 0.2s ease;
		border: none;
		cursor: pointer;
	}

	.hero-cta:hover {
		background: var(--color-gold-light);
		transform: translateY(-2px);
	}

	.hero-cta:disabled {
		opacity: 0.7;
		cursor: wait;
		transform: none;
	}

	/* Newsletter form */
	.hero-form, .cta-form {
		max-width: 480px;
		margin: 0 auto;
	}

	.hero-form-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.hero-input {
		flex: 1;
		min-width: 200px;
		padding: 0.875rem 1rem;
		border-radius: var(--radius-md);
		border: 2px solid rgba(201, 169, 98, 0.3);
		background: rgba(255, 255, 255, 0.1);
		color: #faf8f5;
		font-size: 0.95rem;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.hero-input::placeholder {
		color: rgba(250, 248, 245, 0.5);
	}

	.hero-input:focus {
		border-color: var(--color-gold);
	}

	.turnstile-container {
		margin-top: 0.75rem;
	}

	.hero-form-hint {
		font-size: 0.78rem;
		color: rgba(250, 248, 245, 0.5);
		margin: 0.5rem 0 0;
	}

	.hero-error {
		color: var(--color-coral);
		font-size: 0.85rem;
		margin: 0.5rem 0 0;
	}

	.hero-success {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		background: rgba(74, 157, 110, 0.15);
		border: 1px solid rgba(74, 157, 110, 0.3);
		border-radius: var(--radius-md);
		color: var(--color-gold-light);
		font-weight: 600;
	}

	.hero-success svg {
		color: var(--color-success);
		flex-shrink: 0;
	}

	/* Feature Sections */
	.feature-section {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		padding: 4rem 1rem;
	}

	@media (min-width: 768px) {
		.feature-section {
			grid-template-columns: 1fr 1fr;
			gap: 4rem;
			padding: 5rem 2rem;
			align-items: center;
		}
	}

	.feature-alt {
		background: var(--color-card-bg);
	}

	@media (min-width: 768px) {
		.feature-alt .feature-content {
			order: 2;
		}
		.feature-alt .feature-visual {
			order: 1;
		}
	}

	.feature-icon-large {
		width: 80px;
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-lg);
		margin-bottom: 1.5rem;
	}

	.listening-icon {
		background: linear-gradient(135deg, var(--color-gold-light) 0%, rgba(201, 169, 98, 0.2) 100%);
		color: var(--color-gold);
	}

	.doleance-icon {
		background: linear-gradient(135deg, rgba(224, 122, 95, 0.2) 0%, rgba(224, 122, 95, 0.1) 100%);
		color: var(--color-coral);
	}

	.veille-icon {
		background: linear-gradient(135deg, rgba(74, 157, 110, 0.2) 0%, rgba(74, 157, 110, 0.1) 100%);
		color: var(--color-success);
	}

	.strategy-icon {
		background: linear-gradient(135deg, rgba(201, 169, 98, 0.3) 0%, rgba(201, 169, 98, 0.1) 100%);
		color: var(--color-gold);
	}

	.feature-tag {
		display: inline-block;
		padding: 0.375rem 0.75rem;
		background: var(--color-cream);
		color: var(--color-text-muted);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.feature-tag.highlight {
		background: var(--color-gold-light);
		color: var(--color-foreground);
	}


	.feature-content h2 {
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 1rem;
	}

	@media (min-width: 768px) {
		.feature-content h2 {
			font-size: 2rem;
		}
	}

	.feature-lead {
		font-size: 1rem;
		color: var(--color-text);
		margin: 0 0 0.75rem;
	}

	.feature-description {
		font-size: 1rem;
		color: var(--color-text-light);
		line-height: 1.7;
		margin: 0 0 1.5rem;
	}

	.feature-list {
		list-style: none;
		padding: 0;
		margin: 0 0 1.5rem;
	}

	.feature-list li {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.5rem 0;
		font-size: 0.95rem;
		color: var(--color-text);
	}

	.feature-list svg {
		flex-shrink: 0;
		color: var(--color-success);
		margin-top: 0.125rem;
	}

	.feature-list a {
		color: var(--color-gold);
		text-decoration: underline;
	}

	.feature-list a:hover {
		color: var(--color-coral);
	}

	/* Mockups */
	.feature-visual {
		display: flex;
		justify-content: center;
	}

	/* Dashboard Mockup */
	.dashboard-mockup {
		width: 100%;
		max-width: 450px;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		background: var(--color-navy);
	}

	.dashboard-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: #faf8f5;
	}

	.dashboard-live {
		font-size: 0.7rem;
		font-weight: 700;
		color: white;
		background: var(--color-success);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-full);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		padding: 1.25rem;
	}

	.stat-card {
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		text-align: center;
	}

	.stat-label {
		display: block;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		margin-bottom: 0.5rem;
	}

	.stat-value {
		display: block;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.stat-value.positive {
		color: var(--color-success);
	}

	.stat-trend {
		display: block;
		font-size: 0.65rem;
		color: var(--color-success);
		margin-top: 0.25rem;
	}

	/* Card Mockup */
	.mockup-card {
		width: 100%;
		max-width: 400px;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.mockup-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-navy);
	}

	.mockup-dots {
		display: flex;
		gap: 0.375rem;
	}

	.mockup-dots span {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
	}

	.mockup-dots span:first-child {
		background: #ff5f57;
	}

	.mockup-dots span:nth-child(2) {
		background: #febc2e;
	}

	.mockup-dots span:nth-child(3) {
		background: #28c840;
	}

	.mockup-title {
		font-size: 0.8rem;
		color: #faf8f5;
		font-weight: 500;
	}

	.mockup-body {
		padding: 1rem;
	}

	/* Doléance Items */
	.doleance-item {
		padding: 0.875rem;
		border-bottom: 1px solid var(--color-card-border);
	}

	.doleance-item:last-child {
		border-bottom: none;
	}

	.doleance-category {
		display: inline-block;
		padding: 0.2rem 0.5rem;
		background: var(--color-gold-light);
		color: var(--color-foreground);
		font-size: 0.65rem;
		font-weight: 600;
		border-radius: var(--radius-sm);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.doleance-count {
		float: right;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.doleance-text {
		margin: 0.5rem 0 0;
		font-size: 0.8rem;
		color: var(--color-text);
		line-height: 1.4;
	}

	/* Veille Items */
	.veille-item {
		padding: 0.875rem;
		border-bottom: 1px solid var(--color-card-border);
	}

	.veille-item:last-child {
		border-bottom: none;
	}

	.veille-date {
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	.veille-badge {
		display: inline-block;
		margin-left: 0.5rem;
		padding: 0.15rem 0.4rem;
		background: var(--color-coral);
		color: white;
		font-size: 0.6rem;
		font-weight: 700;
		border-radius: var(--radius-sm);
		text-transform: uppercase;
	}

	.veille-text {
		margin: 0.375rem 0;
		font-size: 0.8rem;
		color: var(--color-text);
		line-height: 1.4;
	}

	.veille-action {
		font-size: 0.7rem;
		color: var(--color-success);
		font-weight: 500;
	}

	/* Strategy Mockup */
	.strategy-mockup {
		width: 100%;
		max-width: 420px;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.strategy-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
	}

	.strategy-header svg {
		color: var(--color-gold);
	}

	.strategy-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: white;
	}

	.strategy-content {
		padding: 1.25rem;
	}

	.strategy-insight {
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		margin-bottom: 0.75rem;
		border-left: 3px solid var(--color-success);
	}

	.strategy-insight.warning {
		border-left-color: var(--color-coral);
	}

	.insight-category {
		display: block;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-success);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.strategy-insight.warning .insight-category {
		color: var(--color-coral);
	}

	.insight-text {
		font-size: 0.85rem;
		color: var(--color-text);
		line-height: 1.5;
		margin: 0;
	}

	/* Pricing */
	.pricing-section {
		padding: 5rem 1rem;
		background: var(--color-card-bg);
	}

	.pricing-header {
		text-align: center;
		max-width: 600px;
		margin: 0 auto 3rem;
	}

	.section-tag {
		display: inline-block;
		padding: 0.375rem 0.875rem;
		background: var(--color-gold-light);
		color: var(--color-foreground);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 1rem;
	}

	.pricing-header h2 {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.75rem;
	}

	.pricing-header p {
		font-size: 1rem;
		color: var(--color-text-light);
		margin: 0;
	}

	.pricing-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	@media (min-width: 768px) {
		.pricing-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.pricing-card {
		position: relative;
		background: var(--color-cream);
		border-radius: var(--radius-lg);
		padding: 2rem 1.5rem;
		border: 2px solid transparent;
		transition: all 0.2s ease;
	}

	.pricing-card:hover {
		border-color: var(--color-gold-light);
	}

	.pricing-card.featured {
		background: var(--color-card-bg);
		border-color: var(--color-gold);
		box-shadow: 0 10px 40px rgba(201, 169, 98, 0.2);
	}

	.pricing-badge {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.375rem 1rem;
		background: var(--color-gold);
		color: var(--color-foreground);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.pricing-card-header h3 {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.75rem;
	}

	.pricing-price {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
		margin-bottom: 1rem;
	}

	.price-amount {
		font-family: var(--font-display);
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.price-period {
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.pricing-description {
		font-size: 0.85rem;
		color: var(--color-text-light);
		margin: 0 0 1.5rem;
		min-height: 40px;
	}

	.pricing-features {
		list-style: none;
		padding: 0;
		margin: 0 0 1.5rem;
	}

	.pricing-features li {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 0;
		font-size: 0.85rem;
		color: var(--color-text);
	}

	.pricing-features svg {
		flex-shrink: 0;
		color: var(--color-success);
		margin-top: 0.125rem;
	}

	.pricing-cta {
		display: block;
		width: 100%;
		padding: 0.875rem;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 0.9rem;
		text-align: center;
		transition: all 0.15s ease;
		border: none;
		cursor: pointer;
	}

	.pricing-cta.primary {
		background: var(--color-gold);
		color: var(--color-foreground);
	}

	.pricing-cta.primary:hover {
		background: var(--color-gold-light);
	}

	.pricing-cta.secondary {
		background: var(--color-card-bg);
		color: var(--color-foreground);
		border: 1px solid var(--color-card-border);
	}

	.pricing-cta.secondary:hover {
		border-color: var(--color-gold);
		background: var(--color-cream);
	}

	/* Philosophy Section */
	.philosophy-section {
		padding: 4rem 1rem;
		background: var(--color-cream);
	}

	.philosophy-content {
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
	}

	.philosophy-content h2 {
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 1rem;
	}

	.philosophy-content > p {
		font-size: 1rem;
		color: var(--color-text-light);
		line-height: 1.7;
		margin: 0 0 2rem;
	}

	.philosophy-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.philosophy-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.philosophy-card {
		padding: 1.25rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-md);
		text-align: left;
	}

	.philosophy-card strong {
		display: block;
		font-family: var(--font-display);
		font-size: 1rem;
		color: var(--color-foreground);
		margin-bottom: 0.5rem;
	}

	.philosophy-card span {
		font-size: 0.9rem;
		color: var(--color-text-light);
		line-height: 1.5;
	}

	/* CTA Section */
	.cta-section {
		padding: 5rem 1rem;
		background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
		text-align: center;
	}

	.cta-content {
		max-width: 600px;
		margin: 0 auto;
	}

	.cta-section h2 {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 700;
		color: #faf8f5;
		margin: 0 0 0.75rem;
	}

	.cta-section p {
		font-size: 1.1rem;
		color: var(--color-gold-light);
		margin: 0 0 2rem;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		background: var(--color-gold);
		color: var(--color-foreground);
		border-radius: var(--radius-md);
		font-weight: 700;
		font-size: 1rem;
		transition: all 0.2s ease;
		border: none;
		cursor: pointer;
	}

	.cta-button:hover {
		background: var(--color-gold-light);
		transform: translateY(-2px);
	}

	.cta-links {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		margin-top: 1.5rem;
	}

	.cta-links a {
		color: var(--color-text-light);
		font-size: 0.85rem;
		transition: color 0.15s ease;
	}

	.cta-links a:hover {
		color: var(--color-gold);
	}

	.token-explainer {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		line-height: 1.5;
		margin: 0 0 1.5rem;
		padding: 0.75rem;
		background: var(--color-cream-dark);
		border-radius: var(--radius-sm);
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
