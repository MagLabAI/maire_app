import type { PageLoad } from './$types';
import type { CityData, RegionsData } from '$lib/types/elections';

export const prerender = false;

interface QueueStatus {
	status: 'queued';
	queueStatus: 'pending' | 'processing';
	queuePosition: number | null;
	requestedAt?: string;
	message: string;
}

interface CityResponse {
	status: 'ready';
	source: 'static' | 'kv';
	data: CityData;
}

export const load: PageLoad = async ({ params, fetch }) => {
	const { election, city } = params;

	// Handle reserved paths that shouldn't be treated as city slugs
	const reservedPaths = ['comparer', 'recherche', 'liste'];
	if (reservedPaths.includes(city.toLowerCase())) {
		return {
			electionSlug: election,
			citySlug: city,
			cityData: null,
			breadcrumbInfo: null,
			queueStatus: null,
			error: null,
			isReservedPath: true
		};
	}

	try {
		const res = await fetch(`/api/city/${city}?election=${election}`);

		if (res.status === 202) {
			const queueInfo: QueueStatus = await res.json();
			return {
				electionSlug: election,
				citySlug: city,
				cityData: null,
				breadcrumbInfo: null,
				queueStatus: queueInfo,
				error: null
			};
		}

		if (!res.ok) {
			return {
				electionSlug: election,
				citySlug: city,
				cityData: null,
				breadcrumbInfo: null,
				queueStatus: null,
				error: `Ville non trouvée: ${city}`
			};
		}

		const response: CityResponse = await res.json();
		return buildResult(election, city, response.data, fetch);
	} catch {
		// Fallback: direct static file fetch (unified path)
		try {
			const staticRes = await fetch(`/data/cities/${city}.json`);
			if (staticRes.ok) {
				const cityData: CityData = await staticRes.json();
				return buildResult(election, city, cityData, fetch);
			}
		} catch {
			// Individual file failed, try legacy path
		}
		try {
			const staticRes = await fetch(`/data/${election}/cities/${city}.json`);
			if (staticRes.ok) {
				const cityData: CityData = await staticRes.json();
				return buildResult(election, city, cityData, fetch);
			}
		} catch {
			// Static file also failed
		}

		return {
			electionSlug: election,
			citySlug: city,
			cityData: null,
			breadcrumbInfo: null,
			queueStatus: null,
			error: `Ville non trouvée: ${city}`
		};
	}
};

/**
 * Convert climate arrays [median, low, high] from city JSON to the object format
 * expected by ClimateProjections.svelte: {median, low, high}.
 */
function convertClimateToComponentFormat(
	cityData: CityData
): { slug: string; name: string; inseeCode: string; horizons: Record<string, Record<string, { median: number | null; low: number | null; high: number | null }>> } | null {
	const climate = cityData.climateData as Record<string, Record<string, [number | null, number | null, number | null]>> | undefined;
	if (!climate) return null;
	const horizons: Record<string, Record<string, { median: number | null; low: number | null; high: number | null }>> = {};
	for (const [horizon, indicators] of Object.entries(climate)) {
		horizons[horizon] = {};
		for (const [key, arr] of Object.entries(indicators)) {
			horizons[horizon][key] = { median: arr[0], low: arr[1], high: arr[2] };
		}
	}
	return { slug: cityData.city.slug, name: cityData.city.name, inseeCode: cityData.city.inseeCode ?? '', horizons };
}

async function buildResult(
	election: string,
	city: string,
	cityData: CityData,
	fetchFn: typeof globalThis.fetch
) {
	const regionsRes = await fetchFn('/data/regions.json');
	const regionsData: RegionsData = await regionsRes.json();

	const regionInfo = regionsData.regions.find((r) => r.name === cityData.city.region);
	const departmentInfo = regionsData.departments[cityData.city.department];

	// Fetch nearby cities for cross-linking (same department)
	interface CityEntry {
		slug: string;
		name: string;
		department: string;
		region: string;
		population: number;
		listsCount: number;
	}
	let nearbyCities: CityEntry[] = [];
	try {
		const dept = cityData.city.department;
		const deptRes = await fetchFn(`/data/departments/${dept}.json`);
		if (deptRes.ok) {
			const deptData: Record<string, { city: CityEntry }> = await deptRes.json();
			nearbyCities = Object.entries(deptData)
				.filter(([slug]) => slug !== city)
				.map(([, data]) => data.city)
				.sort((a, b) => (b.population || 0) - (a.population || 0))
				.slice(0, 6);
		}
	} catch {
		// No nearby cities available
	}

	// Climate data is embedded in city JSON (from populate_cities.py)
	const climateData = convertClimateToComponentFormat(cityData);

	return {
		electionSlug: election,
		citySlug: city,
		cityData,
		nearbyCities,
		climateData,
		breadcrumbInfo: {
			regionSlug: regionInfo?.slug || '',
			regionName: cityData.city.region,
			departmentCode: cityData.city.department,
			departmentName: departmentInfo?.name || cityData.city.department
		},
		queueStatus: null,
		error: null
	};
}
