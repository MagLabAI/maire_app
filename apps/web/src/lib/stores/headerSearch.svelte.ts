/**
 * Header Search Store - Svelte 5 Runes
 * Controls visibility and data for the compact CitySearch in the header.
 * Self-loads cities data on first access so every page has search.
 * Homepage can set cities directly to avoid a double-fetch.
 */

import type { City } from '$lib/types/elections';

let visible = $state(false);
let cities = $state<City[]>([]);
let onSelect = $state<((city: City) => void) | null>(null);
let loading = false;

async function ensureCities() {
	if (cities.length > 0 || loading) return;
	loading = true;
	try {
		const res = await fetch('/data/municipales-2026/cities.json');
		const data: { cities: City[] } = await res.json();
		cities = data.cities;
	} catch {
		// Silently fail — search just won't be available
	} finally {
		loading = false;
	}
}

export const headerSearch = {
	get visible() {
		return visible;
	},
	set visible(v: boolean) {
		visible = v;
	},

	get cities() {
		return cities;
	},
	set cities(c: City[]) {
		cities = c;
	},

	get onSelect() {
		return onSelect;
	},
	set onSelect(fn: ((city: City) => void) | null) {
		onSelect = fn;
	},

	ensureCities
};
