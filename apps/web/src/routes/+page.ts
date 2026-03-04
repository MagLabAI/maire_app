import type { PageLoad } from './$types';
import type { Election, City } from '$lib/types/elections';

export const prerender = true;

export const load: PageLoad = async ({ fetch }) => {
	const electionsRes = await fetch('/data/elections.json');
	const electionsData: { elections: Election[]; featured: string } = await electionsRes.json();

	const citiesRes = await fetch('/data/municipales-2026/cities.json');
	const citiesData: { cities: City[] } = await citiesRes.json();

	return {
		elections: electionsData.elections,
		featuredElection: electionsData.featured,
		cities: citiesData.cities
	};
};
