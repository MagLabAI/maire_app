import type { RequestHandler } from './$types';
import { SITE_URL } from '$lib/config';

export const prerender = true;

// Sitemap index pointing to sub-sitemaps (Google limit: 50K URLs per file)
export const GET: RequestHandler = async () => {
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE_URL}/sitemap-pages.xml</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-2026.xml</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-2020.xml</loc></sitemap>
</sitemapindex>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
