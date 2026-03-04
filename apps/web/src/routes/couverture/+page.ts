import type { PageLoad } from './$types';

export const prerender = true;

interface CityEntry {
	slug: string;
	name: string;
	department: string;
	region: string;
	population: number;
	listsCount: number;
	candidatesCount: number;
	incumbent?: { name: string; party: string };
}

interface RegionStat {
	name: string;
	cities: number;
	population: number;
}

interface PartyStat {
	party: string;
	count: number;
}

export interface EnrichedCity extends CityEntry {
	dataTier: 'research' | 'wikipedia';
}

export interface CoverageData {
	// Research coverage
	enrichedTotal: number;
	researchCount: number;
	analysisCount: number;
	baselineCount: number;
	citiesOver1000: number;
	researchPct: number;
	analysisPct: number;
	researchPopulation: number;
	researchPopulationPct: number;

	// Enriched cities for prominent display
	enrichedCities: EnrichedCity[];

	// Global stats (all 34K)
	totalCities: number;
	totalPopulation: number;
	populationPct: number;
	regionsCount: number;
	departmentsCount: number;
	regions: RegionStat[];
	parties: PartyStat[];
	historicalCities: number;
	uniqueParties: number;

	// Top cities for SEO (first 200 by population)
	topCities: CityEntry[];

	lastUpdated: string;
}

const FRANCE_POPULATION = 67_000_000;
const MIN_POPULATION = 1_000;

export const load: PageLoad = async ({ fetch }) => {
	const [citiesRes, cities2020Res, manifestRes] = await Promise.all([
		fetch('/data/municipales-2026/cities.json'),
		fetch('/data/municipales-2020/cities.json'),
		fetch('/data/enriched-slugs.json')
	]);

	const citiesIndex: { cities?: CityEntry[]; lastUpdated?: string } = await citiesRes.json();
	const cities2020: { cities?: CityEntry[] } = await cities2020Res.json();
	const enrichedManifest: Record<string, string> = await manifestRes.json();

	const cities: CityEntry[] = citiesIndex.cities || [];
	const historical: CityEntry[] = cities2020.cities || [];

	// Classify cities by tier
	const enrichedCities: EnrichedCity[] = [];
	let researchCount = 0;
	let wikipediaCount = 0;

	for (const city of cities) {
		const tier = enrichedManifest[city.slug];
		if (tier === 'research' || tier === 'wikipedia') {
			enrichedCities.push({ ...city, dataTier: tier as 'research' | 'wikipedia' });
			if (tier === 'research') researchCount++;
			else wikipediaCount++;
		}
	}

	// Sort enriched: research first, then by population
	enrichedCities.sort((a, b) => {
		if (a.dataTier !== b.dataTier) return a.dataTier === 'research' ? -1 : 1;
		return (b.population || 0) - (a.population || 0);
	});

	const analysisCount = wikipediaCount;
	const enrichedTotal = researchCount + analysisCount;
	const baselineCount = cities.length - enrichedTotal;
	const citiesOver1000 = cities.filter((c) => (c.population || 0) >= MIN_POPULATION).length;

	const totalPopulation = cities.reduce((sum, c) => sum + (c.population || 0), 0);
	const researchPopulation = enrichedCities.reduce((sum, c) => sum + (c.population || 0), 0);

	// Regions
	const regionMap = new Map<string, RegionStat>();
	for (const c of cities) {
		const r = c.region || 'Inconnue';
		const existing = regionMap.get(r);
		if (existing) {
			existing.cities++;
			existing.population += c.population || 0;
		} else {
			regionMap.set(r, { name: r, cities: 1, population: c.population || 0 });
		}
	}
	const regions = [...regionMap.values()].sort((a, b) => b.cities - a.cities);

	// Departments
	const departments = new Set(cities.map((c) => c.department).filter(Boolean));

	// Parties (from incumbents)
	const partyMap = new Map<string, number>();
	for (const c of cities) {
		const party = c.incumbent?.party;
		if (party) partyMap.set(party, (partyMap.get(party) || 0) + 1);
	}
	const parties = [...partyMap.entries()]
		.map(([party, count]) => ({ party, count }))
		.sort((a, b) => b.count - a.count);

	const data: CoverageData = {
		enrichedTotal,
		researchCount,
		analysisCount,
		baselineCount,
		citiesOver1000,
		researchPct: Math.round((researchCount / citiesOver1000) * 1000) / 10,
		analysisPct: Math.round((enrichedTotal / citiesOver1000) * 1000) / 10,
		researchPopulation,
		researchPopulationPct: Math.round((researchPopulation / FRANCE_POPULATION) * 1000) / 10,

		enrichedCities,

		totalCities: cities.length,
		totalPopulation,
		populationPct: Math.round((totalPopulation / FRANCE_POPULATION) * 1000) / 10,
		regionsCount: regionMap.size,
		departmentsCount: departments.size,
		regions,
		parties,
		historicalCities: historical.length,
		uniqueParties: partyMap.size,

		topCities: [...cities].sort((a, b) => (b.population || 0) - (a.population || 0)).slice(0, 200),

		lastUpdated: citiesIndex?.lastUpdated || new Date().toISOString()
	};

	return { coverage: data };
};
