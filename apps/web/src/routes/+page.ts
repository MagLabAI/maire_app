import type { PageLoad } from './$types';
import type { Election } from '$lib/types/elections';

export const prerender = true;

export const load: PageLoad = async ({ fetch }) => {
	const electionsRes = await fetch('/data/elections.json');
	const electionsData: { elections: Election[]; featured: string } = await electionsRes.json();

	return {
		elections: electionsData.elections,
		featuredElection: electionsData.featured
	};
};
