import type { PageLoad } from './$types';
import type { CityData, CandidateList, RegionsData } from '$lib/types/elections';

export const prerender = true;

export const load: PageLoad = async ({ params, fetch }) => {
	const { election, city } = params;

	try {
		// Same resolution order as the city page: API → unified file → election-scoped file
		let cityData: CityData | null = null;

		try {
			const apiRes = await fetch(`/api/city/${city}?election=${election}`);
			if (apiRes.ok) {
				const response: { data?: CityData } = await apiRes.json();
				cityData = response.data ?? (response as unknown as CityData);
			}
		} catch { /* API not available during prerender */ }

		if (!cityData) {
			const unifiedRes = await fetch(`/data/cities/${city}.json`);
			if (unifiedRes.ok) {
				cityData = await unifiedRes.json();
			}
		}

		if (!cityData) {
			const legacyRes = await fetch(`/data/${election}/cities/${city}.json`);
			if (legacyRes.ok) {
				cityData = await legacyRes.json();
			}
		}

		if (!cityData) throw new Error(`City not found: ${city}`);

		const regionsRes = await fetch('/data/regions.json');
		const regionsData: RegionsData = await regionsRes.json();

		const regionInfo = regionsData.regions.find(r => r.name === cityData.city.region);
		const departmentInfo = regionsData.departments[cityData.city.department];

		return {
			electionSlug: election,
			citySlug: city,
			cityName: cityData.city.name,
			lists: cityData.lists as (CandidateList & { program?: Record<string, unknown> })[],
			candidates: cityData.candidates ?? [],
			officialLists: cityData.officialLists ?? [],
			climateData: (cityData as any).climateData ?? null,
			baselineStats: (cityData as any).baselineStats ?? null,
			debtData: (cityData as any).debtData ?? null,
			incumbentAnalysis: cityData.incumbentAnalysis ?? null,
			previousElection: cityData.city.previousMunicipalElection ?? null,
			electionResults: cityData.results ?? null,
			previousResults: cityData.city.previousResults ?? null,
			sources: cityData._sources ?? [],
			verification: cityData._verification ?? null,
			breadcrumbInfo: {
				regionSlug: regionInfo?.slug || '',
				regionName: cityData.city.region,
				departmentCode: cityData.city.department,
				departmentName: departmentInfo?.name || cityData.city.department
			}
		};
	} catch {
		return {
			electionSlug: election,
			citySlug: city,
			cityName: city.charAt(0).toUpperCase() + city.slice(1),
			lists: [] as (CandidateList & { program?: Record<string, unknown> })[],
			candidates: [],
			officialLists: [],
			climateData: null,
			baselineStats: null,
			debtData: null,
			incumbentAnalysis: null,
			previousElection: null,
			electionResults: null,
			previousResults: null,
			sources: [],
			verification: null,
			breadcrumbInfo: null
		};
	}
};
