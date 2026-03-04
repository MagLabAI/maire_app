/**
 * Comparison Store - Svelte 5 Runes
 * Manages selected candidates for side-by-side comparison.
 * Persists to localStorage so the selection survives page reloads.
 */

import type { Candidate } from '$lib/types/elections';
import { browser } from '$app/environment';

const STORAGE_KEY = 'maire-comparison';

// Extended candidate with city info for comparison
export interface ComparisonCandidate extends Candidate {
	citySlug: string;
	cityName: string;
}

function loadFromStorage(): ComparisonCandidate[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveToStorage(candidates: ComparisonCandidate[]) {
	if (!browser) return;
	try {
		if (candidates.length === 0) {
			localStorage.removeItem(STORAGE_KEY);
		} else {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
		}
	} catch { /* quota exceeded — ignore */ }
}

// Using module-level $state for global store
let selected = $state<ComparisonCandidate[]>(loadFromStorage());

export const comparison = {
	get candidates() {
		return selected;
	},

	get count() {
		return selected.length;
	},

	get isEmpty() {
		return selected.length === 0;
	},

	// Get unique cities from selected candidates
	get cities() {
		const cityMap = new Map<string, string>();
		for (const c of selected) {
			if (!cityMap.has(c.citySlug)) {
				cityMap.set(c.citySlug, c.cityName);
			}
		}
		return Array.from(cityMap.entries()).map(([slug, name]) => ({ slug, name }));
	},

	// Check if all candidates are from the same city
	get allSameCity() {
		if (selected.length <= 1) return true;
		const firstCity = selected[0]?.citySlug;
		return selected.every((c) => c.citySlug === firstCity);
	},

	toggle(candidate: Candidate, citySlug: string, cityName: string) {
		const index = selected.findIndex((c) => c.id === candidate.id);
		if (index >= 0) {
			selected = selected.filter((c) => c.id !== candidate.id);
		} else {
			selected = [...selected, { ...candidate, citySlug, cityName }];
		}
		saveToStorage(selected);
	},

	add(candidate: Candidate, citySlug: string, cityName: string) {
		if (!this.isSelected(candidate.id)) {
			selected = [...selected, { ...candidate, citySlug, cityName }];
			saveToStorage(selected);
		}
	},

	addAll(candidates: Candidate[], citySlug: string, cityName: string) {
		let changed = false;
		for (const c of candidates) {
			if (!this.isSelected(c.id)) {
				selected = [...selected, { ...c, citySlug, cityName }];
				changed = true;
			}
		}
		if (changed) saveToStorage(selected);
	},

	remove(candidateId: string) {
		selected = selected.filter((c) => c.id !== candidateId);
		saveToStorage(selected);
	},

	clear() {
		selected = [];
		saveToStorage(selected);
	},

	isSelected(candidateId: string) {
		return selected.some((c) => c.id === candidateId);
	}
};
