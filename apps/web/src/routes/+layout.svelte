<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { navigating, page } from '$app/stores';
	import { SITE_URL } from '$lib/config';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();
	let currentUrl = $derived(`${SITE_URL}${$page.url.pathname}`);
</script>

<svelte:head>
	<title>maire.app — Découvrez vos candidats aux élections municipales</title>
	<meta name="description" content="Comparez les candidats aux élections municipales françaises 2026. Programmes, profils, cartes interactives et comparaison des listes. Plateforme citoyenne indépendante avec données ouvertes." />
	<link rel="alternate" hreflang="fr-FR" href={currentUrl} />
	<link rel="alternate" hreflang="x-default" href={currentUrl} />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "Organization",
		"name": "MagLab Studio",
		"url": "https://maglab.app",
		"logo": "https://maire.app/favicon.svg",
		"description": "Projet communautaire open source utilisant l'IA pour la transparence des élections municipales françaises.",
		"sameAs": ["https://github.com/MagLabAI/maire.app"]
	})}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "WebSite",
		"name": "maire.app",
		"url": "https://maire.app",
		"inLanguage": "fr",
		"description": "Comparateur citoyen pour les élections municipales françaises — données ouvertes, transparence IA.",
		"publisher": {
			"@type": "Organization",
			"name": "MagLab Studio"
		},
		"potentialAction": {
			"@type": "SearchAction",
			"target": "https://maire.app/elections/municipales-2026?q={search_term_string}",
			"query-input": "required name=search_term_string"
		}
	})}</script>`}
</svelte:head>

<div class="min-h-screen flex flex-col bg-[var(--color-cream)]">
	<Header user={data.user} />

	{#if $navigating}
		<div class="nav-loading" aria-label="Chargement en cours">
			<div class="nav-loading-bar"></div>
		</div>
	{/if}

	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>

<style>
	.nav-loading {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		z-index: 100;
		overflow: hidden;
	}
	.nav-loading-bar {
		height: 100%;
		background: linear-gradient(90deg, var(--color-gold), var(--color-coral), var(--color-gold));
		background-size: 200% 100%;
		animation: loading-slide 1.2s ease-in-out infinite;
	}
	@keyframes loading-slide {
		0% { transform: translateX(-100%); }
		50% { transform: translateX(0%); }
		100% { transform: translateX(100%); }
	}
</style>
