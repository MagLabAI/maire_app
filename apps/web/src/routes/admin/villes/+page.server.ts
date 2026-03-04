import type { PageServerLoad } from './$types';

interface City {
	id: string;
	slug: string;
	name: string;
	department: string;
	region: string;
	population: number;
	listsCount?: number;
	candidatesCount?: number;
	incumbent?: {
		name: string;
		party: string;
		since: number;
	};
}

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch('/data/municipales-2026/cities.json');
	const data = await res.json();

	const cities: City[] = data.cities || [];

	// Sort by population descending
	cities.sort((a, b) => (b.population || 0) - (a.population || 0));

	return {
		cities
	};
};
