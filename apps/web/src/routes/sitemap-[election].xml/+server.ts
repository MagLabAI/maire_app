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
	population?: number;
}

// Population-based priority: Google crawls high-priority pages first
function cityPriority(pop: number, isUpcoming: boolean): string {
	if (!isUpcoming) return '0.3';
	if (pop >= 100000) return '0.9';
	if (pop >= 30000) return '0.8';
	if (pop >= 10000) return '0.7';
	if (pop >= 5000) return '0.6';
	return '0.5';
}

// Per-election sitemap: one file per election, each under 50K URLs
export const GET: RequestHandler = async ({ params, fetch }) => {
	const electionSlug = `municipales-${params.election}`;

	const electionsRes = await fetch('/data/elections.json');
	const { elections }: { elections: Election[] } = await electionsRes.json();
	const election = elections.find((e) => e.slug === electionSlug);

	if (!election?.dataPath) {
		return new Response('Not found', { status: 404 });
	}

	const isUpcoming = election.status === 'upcoming';
	const changefreq = isUpcoming ? 'weekly' : 'yearly';
	const buildDate = new Date().toISOString().split('T')[0];

	const citiesRes = await fetch(`${election.dataPath}/cities.json`);
	const { cities }: { cities: City[] } = await citiesRes.json();

	// Sort by population desc so Google crawls important cities first
	const sorted = [...cities].sort((a, b) => (b.population || 0) - (a.population || 0));

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sorted.map((city) => `  <url>
    <loc>${SITE_URL}/elections/${electionSlug}/${city.slug}</loc>
    <lastmod>${buildDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${cityPriority(city.population || 0, isUpcoming)}</priority>
  </url>`).join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
