import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch('/data/municipales-2026/cities.json');
	const data = await res.json();

	const cities = data.cities || [];

	// Calculate stats
	const candidatesCount = cities.reduce(
		(sum: number, city: { candidatesCount?: number }) => sum + (city.candidatesCount || 0),
		0
	);
	const listsCount = cities.reduce(
		(sum: number, city: { listsCount?: number }) => sum + (city.listsCount || 0),
		0
	);

	// Days until election (March 15, 2026)
	const electionDate = new Date('2026-03-15');
	const now = new Date();
	const daysUntilElection = Math.ceil(
		(electionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
	);

	return {
		stats: {
			citiesCount: cities.length,
			candidatesCount,
			listsCount,
			daysUntilElection
		},
		recentCities: cities.slice(0, 5).map((city: {
			slug: string;
			name: string;
			department: string;
			candidatesCount?: number;
			listsCount?: number;
		}) => ({
			slug: city.slug,
			name: city.name,
			department: city.department,
			candidatesCount: city.candidatesCount || 0,
			listsCount: city.listsCount || 0
		}))
	};
};
