import type { RequestHandler } from './$types';
import { SITE_URL } from '$lib/config';

export const prerender = true;

export const GET: RequestHandler = async () => {
	const buildDate = new Date().toISOString().split('T')[0];

	const pages = [
		{ path: '/', priority: '1.0', changefreq: 'daily', lastmod: buildDate },
		{ path: '/elections', priority: '0.9', changefreq: 'weekly', lastmod: buildDate },
		{ path: '/elections/municipales-2026', priority: '0.9', changefreq: 'daily', lastmod: buildDate },
		{ path: '/elections/municipales-2020', priority: '0.6', changefreq: 'monthly', lastmod: buildDate },
		{ path: '/carte', priority: '0.7', changefreq: 'weekly', lastmod: buildDate },
		{ path: '/gouvernance', priority: '0.6', changefreq: 'monthly' },
		{ path: '/devenir-maire', priority: '0.6', changefreq: 'monthly' },
		{ path: '/faq', priority: '0.6', changefreq: 'monthly', lastmod: buildDate },
		{ path: '/a-propos', priority: '0.5', changefreq: 'monthly', lastmod: buildDate },
		{ path: '/couverture', priority: '0.5', changefreq: 'weekly', lastmod: buildDate },
		{ path: '/corrections', priority: '0.4', changefreq: 'monthly', lastmod: buildDate },
		{ path: '/fonctionnalites', priority: '0.4', changefreq: 'monthly' },
		{ path: '/corrections/stats', priority: '0.3', changefreq: 'weekly', lastmod: buildDate },
		{ path: '/mentions-legales', priority: '0.2', changefreq: 'yearly' }
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url>
    <loc>${SITE_URL}${p.path}</loc>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
