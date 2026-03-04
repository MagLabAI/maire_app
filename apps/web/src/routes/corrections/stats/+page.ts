import type { PageLoad } from './$types';

export const prerender = true;

interface CityStats {
	name: string;
	slug: string;
	candidates: number;
	sources: number;
	totalClaims: number;
	confirmedClaims: number;
	verificationRate: number;
}

export interface StatsData {
	citiesIndexed: number;
	citiesResearched: number;
	totalCandidates: number;
	totalSources: number;
	totalClaims: number;
	confirmedClaims: number;
	overallVerificationRate: number;
	perCity: CityStats[];
	lastUpdated: string;
}

export const load: PageLoad = async ({ fetch }) => {
	// Use enriched manifest — only ~974 entries, avoids fetching 34K individual files
	const [enrichedRes, citiesRes] = await Promise.all([
		fetch('/data/enriched-slugs.json'),
		fetch('/data/municipales-2026/cities.json')
	]);
	const enrichedMap: Record<string, string> = await enrichedRes.json();
	const citiesIndex: { cities?: Array<{ slug: string; name: string }>; lastUpdated?: string } = await citiesRes.json();

	// Build slug→name lookup from cities index
	const nameMap = new Map<string, string>();
	for (const c of citiesIndex.cities || []) {
		nameMap.set(c.slug, c.name);
	}

	// Only fetch cities with individual files (research/wikipedia tier)
	const researchSlugs = Object.entries(enrichedMap)
		.filter(([, tier]) => tier === 'research')
		.map(([slug]) => slug);

	const perCity: CityStats[] = [];
	let totalCandidates = 0;
	let totalSources = 0;
	let totalClaims = 0;
	let confirmedClaims = 0;

	const fetches = researchSlugs.map(async (slug) => {
		try {
			const res = await fetch(`/data/cities/${slug}.json`);
			if (!res.ok) return null;
			const data = await res.json() as Record<string, unknown>;
			return { slug, name: nameMap.get(slug) || slug, data };
		} catch {
			return null;
		}
	});

	const results = await Promise.all(fetches);

	for (const result of results) {
		if (!result) continue;

		const { slug, name, data } = result;
		const candidates = Array.isArray(data.candidates) ? data.candidates.length : 0;
		const sources = Array.isArray(data._sources) ? data._sources.length : 0;
		const verification = (data._verification ?? {}) as { totalClaims?: number; confirmedClaims?: number };
		const claims = verification.totalClaims || 0;
		const confirmed = verification.confirmedClaims || 0;

		totalCandidates += candidates;
		totalSources += sources;
		totalClaims += claims;
		confirmedClaims += confirmed;

		perCity.push({
			name,
			slug,
			candidates,
			sources,
			totalClaims: claims,
			confirmedClaims: confirmed,
			verificationRate: claims > 0 ? Math.round((confirmed / claims) * 100) : 0
		});
	}

	perCity.sort((a, b) => b.sources - a.sources || b.candidates - a.candidates);

	const stats: StatsData = {
		citiesIndexed: citiesIndex.cities?.length || Object.keys(enrichedMap).length,
		citiesResearched: perCity.length,
		totalCandidates,
		totalSources,
		totalClaims,
		confirmedClaims,
		overallVerificationRate: totalClaims > 0 ? Math.round((confirmedClaims / totalClaims) * 100) : 0,
		perCity,
		lastUpdated: citiesIndex.lastUpdated || new Date().toISOString()
	};

	return { stats };
};
