import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { city } = params;

	try {
		const res = await fetch(`/data/municipales-2026/cities/${city}.json`);
		if (!res.ok) {
			return { cityData: null };
		}

		const cityData = await res.json();
		return { cityData };
	} catch {
		return { cityData: null };
	}
};
