import type { PageLoad } from './$types';
import type { RegionsData } from '$lib/types/elections';

// Prerender known elections, but allow dynamic rendering for others
export const prerender = 'auto';

export const load: PageLoad = async ({ params, fetch }) => {
	const { election } = params;

	try {
		// Load election info
		const electionsRes = await fetch('/data/elections.json');
		const electionsData = await electionsRes.json();
		const electionInfo = electionsData.elections.find((e: any) => e.slug === election);

		// Load cities from the election's data path (fallback to municipales-2026)
		const dataPath = electionInfo?.dataPath || '/data/municipales-2026';
		const citiesRes = await fetch(`${dataPath}/cities.json`);
		const citiesData = await citiesRes.json();

		// Load regions
		const regionsRes = await fetch('/data/regions.json');
		const regionsData: RegionsData = await regionsRes.json();

		return {
			election: electionInfo,
			cities: citiesData.cities,
			regions: regionsData.regions,
			departments: regionsData.departments
		};
	} catch (e) {
		return {
			election: null,
			cities: [],
			regions: [],
			departments: {},
			error: `Élection non trouvée: ${election}`
		};
	}
};
