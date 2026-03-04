import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/data/elections.json');
	const data = await res.json();

	return {
		elections: data.elections
	};
};
