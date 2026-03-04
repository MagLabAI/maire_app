<script lang="ts">
	import SeoMeta from '$lib/components/SeoMeta.svelte';
	import FaqChatbot from '$lib/components/FaqChatbot.svelte';

	interface FaqEntry {
		id: string;
		category: string;
		question: string;
		answer: string;
		keywords: string[];
	}

	let { data } = $props();
	const faqData: FaqEntry[] = data.faqData;
	const categories = [...new Set(faqData.map((e) => e.category))];

	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqData.map((e) => ({
			'@type': 'Question',
			name: e.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: e.answer
			}
		}))
	});
</script>

<svelte:head>
	<title>Questions fréquentes | maire.app</title>
	<meta name="description" content="Réponses aux questions les plus fréquentes sur maire.app : fonctionnement de l'IA, sources de données, neutralité politique, vie privée." />
	<SeoMeta
		title="Questions fréquentes | maire.app"
		description="Réponses aux questions les plus fréquentes sur maire.app : fonctionnement de l'IA, sources de données, neutralité politique, vie privée."
		path="/faq"
	/>
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<section class="page-header">
	<div class="container-app">
		<h1 class="page-title">Questions fréquentes</h1>
		<p class="page-subtitle">Marianne répond à vos questions sur maire.app</p>
	</div>
</section>

<section class="faq-chat-section">
	<div class="container-app">
		<FaqChatbot {faqData} />
	</div>
</section>

<section class="faq-accordion-section">
	<div class="container-app">
		<h2 class="accordion-title">Toutes les questions</h2>

		{#each categories as category (category)}
			<div class="faq-category">
				<h3 class="category-name">{category}</h3>
				{#each faqData.filter((e) => e.category === category) as entry (entry.id)}
					<details class="faq-item">
						<summary>{entry.question}</summary>
						<p>{entry.answer}</p>
					</details>
				{/each}
			</div>
		{/each}

		<div class="faq-footer">
			<p>
				Vous ne trouvez pas votre réponse ?
				<a href="mailto:contact@maglab.app">Écrivez-nous</a> ou consultez
				<a href="/a-propos">la page À propos</a>,
				<a href="/corrections">Transparence IA</a> et
				<a href="/mentions-legales">Mentions légales</a>.
			</p>
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

	/* Chatbot section */
	.faq-chat-section {
		padding: 2.5rem 0;
	}

	/* Accordion section */
	.faq-accordion-section {
		padding: 2rem 0 4rem;
		max-width: 900px;
	}

	.accordion-title {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 1.5rem;
	}

	.faq-category {
		margin-bottom: 2rem;
	}

	.category-name {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-gold-dark);
		margin-bottom: 0.75rem;
		padding-left: 0.25rem;
	}

	.faq-item {
		background: var(--color-card-bg);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
		margin-bottom: 0.5rem;
		overflow: hidden;
	}

	.faq-item summary {
		padding: 0.875rem 1.25rem;
		font-weight: 500;
		color: var(--color-foreground);
		cursor: pointer;
		list-style: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		transition: background var(--transition-fast);
	}

	.faq-item summary:hover {
		background: var(--color-cream-dark);
	}

	.faq-item summary::after {
		content: '+';
		font-size: 1.25rem;
		color: var(--color-gold);
		font-weight: 300;
		flex-shrink: 0;
		transition: transform var(--transition-fast);
	}

	.faq-item[open] summary::after {
		content: '−';
	}

	.faq-item summary::-webkit-details-marker {
		display: none;
	}

	.faq-item p {
		padding: 0 1.25rem 1rem;
		color: var(--color-text);
		line-height: 1.65;
		font-size: 0.9rem;
	}

	/* Footer links */
	.faq-footer {
		margin-top: 2rem;
		padding: 1.25rem;
		background: var(--color-cream-dark);
		border-radius: var(--radius-md);
		text-align: center;
	}

	.faq-footer p {
		color: var(--color-text);
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.faq-footer a {
		color: var(--color-gold);
		text-decoration: underline;
	}

	.faq-footer a:hover {
		color: var(--color-coral);
	}
</style>
