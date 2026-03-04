import type { RequestHandler } from './$types';
import { SITE_URL } from '$lib/config';

export const prerender = true;

interface Election {
	slug: string;
	status: string;
	dataPath: string | null;
}

interface City {
	slug: string;
}

interface SitemapEntry {
	path: string;
	priority: string;
	changefreq: string;
	lastmod?: string;
}

export const GET: RequestHandler = async ({ fetch }) => {
	const electionsRes = await fetch('/data/elections.json');
	const { elections }: { elections: Election[] } = await electionsRes.json();

	// Build date = freshness signal for search engines and AI crawlers
	const buildDate = new Date().toISOString().split('T')[0];

	const staticPages: SitemapEntry[] = [
		{ path: '/', priority: '1.0', changefreq: 'daily', lastmod: buildDate },
		{ path: '/elections', priority: '0.9', changefreq: 'weekly', lastmod: buildDate },
		{ path: '/a-propos', priority: '0.5', changefreq: 'monthly', lastmod: buildDate },
		{ path: '/corrections', priority: '0.4', changefreq: 'monthly', lastmod: buildDate },
		{ path: '/corrections/stats', priority: '0.3', changefreq: 'weekly', lastmod: buildDate },
		{ path: '/gouvernance', priority: '0.6', changefreq: 'monthly' },
		{ path: '/devenir-maire', priority: '0.6', changefreq: 'monthly' },
		{ path: '/couverture', priority: '0.5', changefreq: 'weekly', lastmod: buildDate },
		{ path: '/faq', priority: '0.6', changefreq: 'monthly', lastmod: buildDate },
		{ path: '/carte', priority: '0.7', changefreq: 'weekly', lastmod: buildDate },
		{ path: '/fonctionnalites', priority: '0.4', changefreq: 'monthly' },
		{ path: '/mentions-legales', priority: '0.2', changefreq: 'yearly' }
	];

	const dynamicPages: SitemapEntry[] = [];

	for (const election of elections) {
		if (!election.dataPath) continue;

		const isUpcoming = election.status === 'upcoming';
		dynamicPages.push({
			path: `/elections/${election.slug}`,
			priority: isUpcoming ? '0.9' : '0.6',
			changefreq: isUpcoming ? 'daily' : 'monthly',
			lastmod: buildDate
		});

		try {
			const citiesRes = await fetch(`${election.dataPath}/cities.json`);
			const { cities }: { cities: City[] } = await citiesRes.json();
			for (const city of cities) {
				dynamicPages.push({
					path: `/elections/${election.slug}/${city.slug}`,
					priority: isUpcoming ? '0.8' : '0.5',
					changefreq: isUpcoming ? 'weekly' : 'yearly',
					lastmod: buildDate
				});
			}
		} catch {
			// Election has no cities data yet
		}
	}

	const allPages = [...staticPages, ...dynamicPages];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map((p) => `  <url>
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
