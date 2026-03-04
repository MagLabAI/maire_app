import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			}
		}),
		prerender: {
			crawl: false,
			entries: [
				'/',
				'/elections',
				// 2026 election pages
				'/elections/municipales-2026',
				'/elections/municipales-2026/paris',
				'/elections/municipales-2026/lyon',
				'/elections/municipales-2026/marseille',
				'/elections/municipales-2026/annecy',
				// 2020 election pages (results)
				'/elections/municipales-2020',
				'/elections/municipales-2020/annecy',
				// Other
				'/elections/municipales-2026/toulouse',
				'/elections/municipales-2026/nice',
				'/elections/municipales-2026/nantes',
				'/elections/municipales-2026/montpellier',
				'/elections/municipales-2026/strasbourg',
				'/elections/municipales-2026/bordeaux',
				'/elections/municipales-2026/lille',
				'/elections/municipales-2026/rennes',
				'/elections/municipales-2026/toulon',
				'/elections/municipales-2026/reims',
				'/elections/municipales-2026/saint-etienne',
				'/elections/municipales-2026/le-havre',
				'/elections/municipales-2026/villeurbanne',
				'/elections/municipales-2026/dijon',
				'/elections/municipales-2026/angers',
				'/elections/municipales-2026/grenoble',
				'/a-propos',
				'/elections/municipales-2026/albertville',
				'/elections/municipales-2026/rognaix',
				'/mentions-legales',
				'/corrections',
				'/corrections/stats',
				'/gouvernance',
				'/devenir-maire',
				'/couverture',
				'/sitemap.xml',
			'/sitemap-pages.xml',
			'/sitemap-2026.xml',
			'/sitemap-2020.xml',
				'/carte',
				'/faq'
			],
			handleHttpError: 'warn',
			handleUnseenRoutes: 'ignore'
		}
	}
};

export default config;
