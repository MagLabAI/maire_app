<script lang="ts">
	import type { PageData } from './$types';
	import CandidateCard from '$lib/components/CandidateCard.svelte';
	import CompareBar from '$lib/components/CompareBar.svelte';
	import CityRequestGitHub from '$lib/components/CityRequestGitHub.svelte';
	import AiDisclaimer from '$lib/components/AiDisclaimer.svelte';
	import ClimateProjections from '$lib/components/ClimateProjections.svelte';
	import SeoMeta from '$lib/components/SeoMeta.svelte';
	import { comparison } from '$lib/stores/comparison.svelte';
	import { goto } from '$app/navigation';
	import { wikiThumb } from '$lib/config';

	let { data }: { data: PageData } = $props();

	// Redirect if this is a reserved path (like /comparer accessed directly)
	$effect(() => {
		if (data.isReservedPath) {
			goto(`/elections/${data.electionSlug}`, { replaceState: true });
		}
	});

	// Past election detection (2020 results view)
	let isPastElection = $derived(data.electionSlug?.startsWith('municipales-2020'));
	let prevElection = $derived(data.cityData?.city?.previousMunicipalElection);
	let prevSummary = $derived(data.cityData?.city?.previousResults?.['2020']);

	// Election results (round 1/2 status-driven rendering)
	let electionResults = $derived(data.cityData?.results);
	let resultsStatus = $derived(electionResults?.status);
	let hasResults = $derived(
		resultsStatus === 'round1-results' ||
		resultsStatus === 'between-rounds' ||
		resultsStatus === 'round2-results' ||
		resultsStatus === 'final'
	);

	// Section expansion states — Dynamique open by default on desktop (≥768px)
	let showCityDetails = $state(false);
	const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
	const defaultSections = isDesktop
		? ['issues', 'dynamics']
		: ['issues'];
	let expandedSections = $state<Set<string>>(new Set(defaultSections));

	function toggleSection(section: string) {
		if (expandedSections.has(section)) {
			expandedSections.delete(section);
		} else {
			expandedSections.add(section);
		}
		expandedSections = new Set(expandedSections);
	}

	function navToSection(elementId: string, expandKey?: string) {
		if (expandKey && !expandedSections.has(expandKey)) {
			expandedSections.add(expandKey);
			expandedSections = new Set(expandedSections);
		}
		setTimeout(() => document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
	}

	function navToOfficialList(panelNumber: number) {
		if (!expandedSections.has('official-lists')) {
			expandedSections.add('official-lists');
			expandedSections = new Set(expandedSections);
		}
		setTimeout(() => document.getElementById(`official-list-${panelNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
	}

	// Format number
	function formatNumber(n: number): string {
		return n.toLocaleString('fr-FR');
	}

	// Format date for display
	function formatDate(isoDate: string): string {
		const date = new Date(isoDate);
		return date.toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Hemicycle: angular slices per party, seats fill rows within each slice
	const HEMI_COLORS = ['#c9a962', '#4a9d6e', '#6b8cae', '#e07a5f', '#8b6bb3', '#3d8b8b', '#c97a62', '#7a8c6b'];

	type HemiDot = { x: number; y: number; listIdx: number; seatIdx: number };

	function buildHemicycle(lists: { seats: number }[], totalSeats: number): HemiDot[] {
		if (!totalSeats || totalSeats <= 0) return [];

		const cx = 150, cy = 148, rMin = 30, rMax = 135;
		const numRows = totalSeats <= 20 ? 3 : totalSeats <= 40 ? 4 : totalSeats <= 80 ? 5 : totalSeats <= 140 ? 6 : 7;
		const radii = Array.from({ length: numRows }, (_, i) => rMin + (rMax - rMin) * (i / Math.max(1, numRows - 1)));

		// Each list gets an angular slice proportional to its seats
		const allocated = lists.reduce((s, l) => s + (l.seats || 0), 0);
		const slices: { listIdx: number; seats: number; fraction: number }[] = [];
		for (let i = 0; i < lists.length; i++) {
			if (lists[i].seats) slices.push({ listIdx: i, seats: lists[i].seats, fraction: lists[i].seats / Math.max(1, allocated) });
		}
		if (allocated < totalSeats) slices.push({ listIdx: -1, seats: totalSeats - allocated, fraction: (totalSeats - allocated) / totalSeats });

		// Row capacities proportional to arc length
		const arcLengths = radii.map(r => Math.PI * r);
		const totalArc = arcLengths.reduce((a, b) => a + b, 0);

		const pad = 0.08;
		const dots: HemiDot[] = [];
		let angleStart = Math.PI - pad;
		// Track per-list seat index for council member assignment
		const listSeatCounters: number[] = lists.map(() => 0);

		for (const slice of slices) {
			const sliceArc = (Math.PI - 2 * pad) * slice.fraction;
			const angleEnd = angleStart - sliceArc;

			// Distribute this slice's seats across rows proportionally
			const sliceRowSeats = radii.map((_, i) => Math.round(slice.seats * arcLengths[i] / totalArc));
			let sliceDiff = slice.seats - sliceRowSeats.reduce((a, b) => a + b, 0);
			for (let i = numRows - 1; sliceDiff !== 0 && i >= 0; i--) {
				sliceRowSeats[i] += sliceDiff > 0 ? 1 : -1;
				sliceDiff += sliceDiff > 0 ? -1 : 1;
				if (i === 0 && sliceDiff !== 0) i = numRows;
			}

			for (let row = 0; row < numRows; row++) {
				const n = sliceRowSeats[row];
				if (n <= 0) continue;
				const r = radii[row];
				for (let i = 0; i < n; i++) {
					const t = n > 1 ? (i + 0.5) / n : 0.5;
					const angle = angleStart - sliceArc * t;
					const seatIdx = slice.listIdx >= 0 ? listSeatCounters[slice.listIdx]++ : -1;
					dots.push({ x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle), listIdx: slice.listIdx, seatIdx });
				}
			}
			angleStart = angleEnd;
		}
		return dots;
	}

	// Get head candidates only
	let headCandidates = $derived(() => {
		return data.cityData?.candidates.filter(c => c.isHead) || [];
	});

	// City brief excerpt (first characteristic or economic profile)
	let cityExcerpt = $derived(() => {
		const info = data.cityData?.cityInfo;
		if (info?.economicProfile) {
			// Take first sentence
			const firstSentence = info.economicProfile.split('.')[0];
			return firstSentence + '.';
		}
		if (info?.characteristics && info.characteristics.length > 0) {
			return info.characteristics[0];
		}
		return null;
	});

	// Top 3 issues for sidebar summary
	let topIssues = $derived(() => {
		return data.cityData?.localIssues?.slice(0, 3) || [];
	});

	// Fisher-Yates shuffle for randomizing candidate order
	function shuffle<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	// Randomized candidate lists (research + stubs, shuffled together on page load)
	let randomizedHeadCandidates = $state<any[]>([]);
	$effect(() => {
		const heads = data.cityData?.candidates.filter((c: any) => c.isHead) || [];
		const stubs = missingOfficialHeads();
		randomizedHeadCandidates = shuffle([...heads, ...stubs]);
	});

	// Data tier detection
	let dataTier = $derived(data.cityData?._dataTier || 'unknown');
	let hasNoCandidates = $derived(headCandidates().length === 0);
	let hasFewCandidates = $derived(headCandidates().length > 0 && headCandidates().length <= 2);

	// Official lists from data.gouv.fr
	let officialLists = $derived(data.cityData?.officialLists || []);

	// Official heads NOT covered by research — converted to Candidate objects for CandidateCard
	let missingOfficialHeads = $derived(() => {
		const heads = headCandidates();
		if (!heads.length || !officialLists.length) return [];
		// Strip accents for comparison (research has "Guéguen", official CSV has "GUEGUEN")
		const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
		const researchNames = new Set(
			heads.map(c => norm(c.lastName))
		);
		// Match: exact hit OR official's last word is a suffix of a research compound name
		const isMatched = (officialLastName: string) => {
			const n = norm(officialLastName);
			if (researchNames.has(n)) return true;
			for (const rn of researchNames) {
				if (rn.endsWith(n) || n.endsWith(rn)) return true;
			}
			return false;
		};
		return officialLists
			.filter(list => {
				const parts = list.headCandidate.split(' ');
				const lastName = parts[parts.length - 1];
				return !isMatched(lastName);
			})
			.map(list => {
				const parts = list.headCandidate.split(' ');
				const lastName = parts[parts.length - 1];
				const firstName = parts.slice(0, -1).join(' ') || lastName;
				return {
					id: `stub-${list.panelNumber}`,
					firstName,
					lastName,
					fullName: list.headCandidate,
					listId: `official-${list.panelNumber}`,
					position: 1,
					isHead: true,
					demographics: { birthYear: 0, age: 0, gender: (list.candidates?.[0]?.gender || 'M') as 'M' | 'F', profession: list.nuanceLabel || 'Non renseigné', professionCategory: '' },
					experience: { previousMandates: [], totalYearsElected: 0 },
					stats: { experienceScore: 0, socialPresence: 0, programClarity: 0 },
					rarity: 'common' as const,
					_isStub: true,
					_listName: list.shortName || list.name,
				};
			});
	});

	// IDs of stub candidates for quick lookup
	let stubIds = $derived(new Set(missingOfficialHeads().map(c => c.id)));

	// "Comparer tous" button state
	let allCompared = $state(false);

	// Cross-reference: collect head candidate names from previous elections for matching
	let candidates2020Names = $derived(() => {
		const names = new Set<string>();
		const prev = data.cityData?.city?.previousMunicipalElection;
		if (prev?.results?.lists) {
			for (const l of prev.results.lists) {
				if (l.headCandidate) names.add(l.headCandidate.toUpperCase().trim());
			}
		}
		const embedded = data.cityData?.city?.previousResults?.['2020'];
		if (embedded?.winner?.candidate) {
			names.add(embedded.winner.candidate.toUpperCase().trim());
		}
		return names;
	});

	// Collect all past candidate names across 2020, 2014, 2008 for matching on official lists
	let pastCandidatesByYear = $derived(() => {
		const byYear: Record<string, Set<string>> = {};
		const results = data.cityData?.city?.previousResults || {};
		for (const [year, result] of Object.entries(results)) {
			const names = new Set<string>();
			if (result?.winner?.candidate) names.add(result.winner.candidate.toUpperCase().trim());
			byYear[year] = names;
		}
		// Also add 2020 names from legacy field
		const prev = data.cityData?.city?.previousMunicipalElection;
		if (prev?.results?.lists) {
			if (!byYear['2020']) byYear['2020'] = new Set();
			for (const l of prev.results.lists) {
				if (l.headCandidate) byYear['2020'].add(l.headCandidate.toUpperCase().trim());
			}
		}
		return byYear;
	});

	// Cross-reference: 2026 official list head candidate names (for 2020 view)
	let returningCandidates2026 = $derived(() => {
		return new Set(officialLists.map(l => l.headCandidate.toUpperCase().trim()));
	});

	// Check if a name from 2026 official lists was in 2020
	function wasCandidate2020(name: string): boolean {
		return candidates2020Names().has(name.toUpperCase().trim());
	}

	// Check which past election years a candidate name matches (returns earliest year or null)
	function matchPastElectionYears(firstName: string, lastName: string): string[] {
		const full = `${firstName} ${lastName}`.toUpperCase().trim();
		const reversed = `${lastName} ${firstName}`.toUpperCase().trim();
		const lastUp = lastName.toUpperCase().trim();
		const matched: string[] = [];
		for (const [year, names] of Object.entries(pastCandidatesByYear())) {
			for (const n of names) {
				if (n === full || n === reversed || n.includes(lastUp)) {
					matched.push(year);
					break;
				}
			}
		}
		return matched.sort();
	}

	// Check if a candidate name (first+last) matches any 2020 head candidate
	function matchesCandidate2020(firstName: string, lastName: string): boolean {
		const full = `${firstName} ${lastName}`.toUpperCase().trim();
		const reversed = `${lastName} ${firstName}`.toUpperCase().trim();
		const lastUp = lastName.toUpperCase().trim();
		const names = candidates2020Names();
		for (const n of names) {
			if (n === full || n === reversed || n.includes(lastUp)) return true;
		}
		return false;
	}

	// Map listId → programUrl for passing to CandidateCard
	let listProgramUrls = $derived(() => {
		const map = new Map<string, string>();
		for (const list of data.cityData?.lists || []) {
			if (list.programUrl) map.set(list.id, list.programUrl);
		}
		return map;
	});

	// Map listId → list name for passing to CandidateCard
	let listNames = $derived(() => {
		const map = new Map<string, string>();
		for (const list of data.cityData?.lists || []) {
			if (list.name) map.set(list.id, list.name);
		}
		return map;
	});

	// Citation system: map JSON paths → display source indices + titles
	let citationMap = $derived(() => {
		const map = new Map<string, { refs: { idx: number; title: string }[]; status: string }>();
		const sources = data.cityData?._sources || [];
		const claims = data.cityData?._verification?.sourcedClaims || [];
		if (!claims.length || !sources.length) return map;

		// Build sourceId → {display index, title}
		const idToRef = new Map<number, { idx: number; title: string }>();
		sources.forEach((s, i) => idToRef.set(s.id, { idx: i + 1, title: s.title || new URL(s.url).hostname }));

		for (const claim of claims) {
			const refs = (claim.sources || [])
				.map((sid: string) => idToRef.get(parseInt(sid)))
				.filter((r): r is { idx: number; title: string } => r != null);
			if (refs.length > 0) {
				map.set(claim.path, { refs, status: claim.status });
			}
		}
		return map;
	});

	function getCite(path: string): { refs: { idx: number; title: string }[]; status: string } | undefined {
		return citationMap().get(path);
	}

	// Ensure sources section is expanded when clicking a citation link
	function openSourceRef(idx: number) {
		if (!expandedSections.has('sources')) {
			expandedSections.add('sources');
			expandedSections = new Set(expandedSections);
		}
		// Small delay so the DOM renders before scrolling
		setTimeout(() => {
			document.getElementById(`source-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 100);
	}
</script>

{#snippet cite(path: string)}
	{@const entry = getCite(path)}
	{#if entry}
		{#if entry.status === 'reported'}<span class="cite-reported" data-tooltip="Information rapportée par la presse"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg></span>{/if}<sup class="cite-refs">{#each entry.refs.slice(0, 3) as ref, i}<a href="#source-{ref.idx}" class="cite-mark" data-tooltip={ref.title} onclick={(e) => { e.preventDefault(); openSourceRef(ref.idx); }}>{#if i > 0},{/if}{ref.idx}</a>{/each}</sup>
	{/if}
{/snippet}

<svelte:head>
	{#if data.cityData && isPastElection}
		<title>{data.cityData.city.name} - Résultats Municipales 2020 | maire.app</title>
		<meta
			name="description"
			content="Résultats des élections municipales 2020 à {data.cityData.city.name}. Participation, listes et scores."
		/>
		<SeoMeta
			title="{data.cityData.city.name} - Résultats Municipales 2020 | maire.app"
			description="Résultats municipales 2020 à {data.cityData.city.name} ({formatNumber(data.cityData.city.population)} hab.).{prevSummary?.winner ? ` ${prevSummary.winner} élu(e).` : ''}{prevSummary?.turnout ? ` Participation : ${(prevSummary.turnout * 100).toFixed(0)}%.` : ''}"
			path="/elections/{data.electionSlug}/{data.citySlug}"
			type="article"
		/>
	{:else if data.cityData}
		<title>{data.cityData.city.name} - Municipales 2026 | maire.app</title>
		<meta
			name="description"
			content="Découvrez les candidats aux élections municipales 2026 à {data.cityData.city.name}. Comparez les programmes et les profils."
		/>
		<SeoMeta
			title="{data.cityData.city.name} - Municipales 2026 | maire.app"
			description="Découvrez les {data.cityData.city.listsCount || ''} listes candidates aux municipales 2026 à {data.cityData.city.name} ({formatNumber(data.cityData.city.population)} hab.). Comparez les programmes, profils et propositions sur maire.app"
			path="/elections/{data.electionSlug}/{data.citySlug}"
			type="article"
		/>
	{:else if data.queueStatus}
		<title>Recherche en cours - {data.citySlug} | maire.app</title>
	{:else}
		<title>Ville non trouvée | maire.app</title>
	{/if}
	{#if data.cityData}
		{@html `<script type="application/ld+json">${JSON.stringify({
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			"itemListElement": [
				{ "@type": "ListItem", "position": 1, "name": "Élections", "item": "https://maire.app/elections" },
				{ "@type": "ListItem", "position": 2, "name": data.electionSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), "item": `https://maire.app/elections/${data.electionSlug}` },
				{ "@type": "ListItem", "position": 3, "name": data.cityData.city.name, "item": `https://maire.app/elections/${data.electionSlug}/${data.citySlug}` }
			]
		})}</script>`}
		{@html `<script type="application/ld+json">${JSON.stringify({
			"@context": "https://schema.org",
			"@type": "WebPage",
			"name": `${data.cityData.city.name} - ${isPastElection ? 'Résultats Municipales 2020' : 'Municipales 2026'}`,
			"url": `https://maire.app/elections/${data.electionSlug}/${data.citySlug}`,
			"inLanguage": "fr",
			"about": {
				"@type": "City",
				"name": data.cityData.city.name,
				"containedInPlace": { "@type": "AdministrativeArea", "name": data.cityData.city.region }
			},
			"mainEntity": {
				"@type": "Event",
				"name": `Élections municipales ${isPastElection ? '2020' : '2026'} - ${data.cityData.city.name}`,
				"startDate": isPastElection ? "2020-03-15" : "2026-03-15",
				"location": { "@type": "City", "name": data.cityData.city.name }
			}
		})}</script>`}
		{#if !isPastElection && data.cityData._metadata?.generatedAt}
			{@html `<script type="application/ld+json">${JSON.stringify({
				"@context": "https://schema.org",
				"@type": "Article",
				"headline": `Candidats municipales 2026 à ${data.cityData.city.name}`,
				"datePublished": data.cityData._metadata.generatedAt.split('T')[0],
				"dateModified": data.cityData._metadata.generatedAt.split('T')[0],
				"author": { "@type": "Organization", "name": "MagLab Studio", "url": "https://github.com/MagLabAI" },
				"publisher": { "@type": "Organization", "name": "maire.app", "url": "https://maire.app" },
				"inLanguage": "fr",
				"about": { "@type": "City", "name": data.cityData.city.name }
			})}</script>`}
		{/if}
	{/if}
</svelte:head>

{#if data.cityData}
	{#if isPastElection}
		<!-- ===== 2020 RESULTS VIEW ===== -->
		<div class="past-results-page">
			<header class="past-hero">
				<div class="hero-content">
					<div class="hero-main">
						<div class="past-hero-top">
							<a href="/elections/municipales-2026/{data.citySlug}" class="back-link-past">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
								</svg>
								Candidats 2026
							</a>
							<span class="past-badge">Résultats 2020</span>
						</div>
						<h1 class="past-city-name">{data.cityData.city.name}</h1>
						<div class="city-stats">
							<span class="stat-pill">{data.cityData.city.department}</span>
							<span class="stat-pill">
								<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								{formatNumber(data.cityData.city.population)} hab.
							</span>
							<a href="/carte?city={data.citySlug}" class="stat-pill stat-pill-link" title="Voir sur la carte">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
									<path d="M8 2v16" /><path d="M16 6v16" />
								</svg>
								Carte
							</a>
						</div>
					</div>
				</div>
			</header>

			{#if prevElection?.results}
				{@const results = prevElection.results}
				{@const winner = results.winner}
				{@const lists = results.lists || []}

				<!-- Winner (compact horizontal) -->
				{#if winner}
					<section class="past-section">
						<div class="container-app">
							<div class="past-winner-card">
								<div class="past-winner-main">
									<span class="past-winner-label">Élu(e) en 2020</span>
									<h2 class="past-winner-name">{winner.candidate}</h2>
									<span class="past-winner-party">{winner.party}</span>
								</div>
								<div class="past-winner-stats">
									<span class="past-winner-score">{(winner.voteShare * 100).toFixed(1)}%</span>
									{#if winner.seats}
										<span class="past-winner-seats">{winner.seats} sièges</span>
									{/if}
								</div>
							</div>
						</div>
					</section>
				{/if}

				<!-- Mayor Change (if applicable) -->
				{#if data.cityData.city.mayorChange}
					<section class="past-section">
						<div class="container-app">
							<div class="mayor-change-card">
								<div class="mayor-change-icon">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
										<circle cx="8.5" cy="7" r="4" />
										<path d="M20 8v6M23 11h-6" />
									</svg>
								</div>
								<div class="mayor-change-body">
									<h3 class="mayor-change-title">Changement de maire</h3>
									<p class="mayor-change-text">
										{data.cityData.city.mayorChange.currentMayor} a pris ses fonctions le {new Date(data.cityData.city.mayorChange.changeDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}, succédant à {data.cityData.city.mayorChange.electedMayor2020}.
									</p>
								</div>
							</div>
						</div>
					</section>
				{/if}

				<!-- Turnout -->
				<section class="past-section">
					<div class="container-app">
						<h2 class="past-section-title">Participation</h2>
						<div class="past-turnout-grid">
							{#if results.round1}
								<div class="past-turnout-card">
									<span class="past-round-label">1er tour{results.round1.date ? ` — ${new Date(results.round1.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}</span>
									<div class="past-turnout-row">
										<div class="past-turnout-item">
											<span class="past-turnout-value">{(results.round1.turnout * 100).toFixed(1)}%</span>
											<span class="past-turnout-label">Participation</span>
										</div>
										<div class="past-turnout-item">
											<span class="past-turnout-value">{(results.round1.abstention * 100).toFixed(1)}%</span>
											<span class="past-turnout-label">Abstention</span>
										</div>
										{#if results.round1.registeredVoters}
											<div class="past-turnout-item">
												<span class="past-turnout-value-sm">{formatNumber(results.round1.registeredVoters)}</span>
												<span class="past-turnout-label">Inscrits</span>
											</div>
										{/if}
									</div>
								</div>
							{/if}
							{#if results.round2}
								<div class="past-turnout-card highlighted">
									<span class="past-round-label">2nd tour{results.round2.date ? ` — ${new Date(results.round2.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}</span>
									<div class="past-turnout-row">
										<div class="past-turnout-item">
											<span class="past-turnout-value">{(results.round2.turnout * 100).toFixed(1)}%</span>
											<span class="past-turnout-label">Participation</span>
										</div>
										<div class="past-turnout-item">
											<span class="past-turnout-value">{(results.round2.abstention * 100).toFixed(1)}%</span>
											<span class="past-turnout-label">Abstention</span>
										</div>
										{#if results.round2.registeredVoters}
											<div class="past-turnout-item">
												<span class="past-turnout-value-sm">{formatNumber(results.round2.registeredVoters)}</span>
												<span class="past-turnout-label">Inscrits</span>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</div>
				</section>

				<!-- Lists Results -->
				{#if lists.length > 0}
					<section class="past-section">
						<div class="container-app">
							<h2 class="past-section-title">Têtes de liste ({lists.length})</h2>
							<div class="past-heads-grid">
								{#each lists.sort((a, b) => (b.round2VoteShare || b.round1VoteShare || 0) - (a.round2VoteShare || a.round1VoteShare || 0)) as list, i}
									{@const nameParts = (list.headCandidate || '').split(' ')}
									{@const initials = nameParts.length >= 2 ? nameParts[0][0] + nameParts[nameParts.length - 1][0] : nameParts[0]?.substring(0, 2) ?? '?'}
									{@const isRunningAgain = returningCandidates2026().has((list.headCandidate || '').toUpperCase().trim())}
									<div class="past-head-card" class:winner={winner && list.headCandidate === winner.candidate}>
										<div class="past-head-top">
											<div class="past-head-avatar" class:is-winner={winner && list.headCandidate === winner.candidate}>
												{initials}
											</div>
											<div class="past-head-info">
												<h3 class="past-head-name">
													{list.headCandidate}
													{#if isRunningAgain}
														<span class="running-again-badge">2026</span>
													{/if}
												</h3>
												<span class="past-head-party">{list.party}</span>
												{#if list.name}
													<span class="past-head-list-name">{list.name}</span>
												{/if}
											</div>
											<div class="past-head-rank">#{i + 1}</div>
										</div>
										<div class="past-head-scores">
											{#if list.round1VoteShare}
												<div class="past-head-score">
													<span class="past-head-score-value">{(list.round1VoteShare * 100).toFixed(1)}%</span>
													<span class="past-head-score-label">1er tour</span>
												</div>
											{/if}
											{#if list.round2VoteShare}
												<div class="past-head-score highlighted">
													<span class="past-head-score-value">{(list.round2VoteShare * 100).toFixed(1)}%</span>
													<span class="past-head-score-label">2nd tour</span>
												</div>
											{/if}
											{#if list.seats}
												<div class="past-head-score seats">
													<span class="past-head-score-value">{list.seats}</span>
													<span class="past-head-score-label">sièges</span>
												</div>
											{/if}
										</div>
										{#if isRunningAgain}
											<div class="running-again-note">
												<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
												Se représente en 2026
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					</section>
				{/if}

				<!-- Hemicycle: seat composition (shows for any city with list seat data) -->
				{@const seatSum = lists.reduce((s, l) => s + (l.seats || 0), 0)}
				{@const hemiTotal = data.cityData.city.seatsTotal || seatSum}
				{#if hemiTotal > 0 && lists.some(l => l.seats)}
					{@const sortedLists = [...lists].sort((a, b) => (b.seats || 0) - (a.seats || 0))}
					{@const dots = buildHemicycle(sortedLists, hemiTotal)}
					{@const council = data.cityData.city.previousResults?.['2020']?.council || []}
					{@const councilByList = (() => {
						// Distribute council members to lists: seats allocated per list,
						// fill from council array in order (first = top of winning list)
						const byList: Record<number, string[]> = {};
						let councilIdx = 0;
						for (let li = 0; li < sortedLists.length; li++) {
							const seats = sortedLists[li].seats || 0;
							byList[li] = [];
							for (let s = 0; s < seats && councilIdx < council.length; s++) {
								const m = council[councilIdx++];
								byList[li].push(`${m.firstName} ${m.lastName}`);
							}
						}
						return byList;
					})()}
					<section class="past-section">
						<div class="container-app">
							<h2 class="past-section-title">Composition du conseil · {hemiTotal} sièges</h2>
							<div class="hemicycle-container">
								<svg viewBox="0 0 300 158" class="hemicycle-svg" aria-label="Hémicycle : répartition des {hemiTotal} sièges">
									{#each dots as dot}
										{@const memberName = dot.listIdx >= 0 ? (councilByList[dot.listIdx]?.[dot.seatIdx] ?? '') : ''}
										<circle
											cx={dot.x}
											cy={dot.y}
											r={hemiTotal > 100 ? 3 : hemiTotal > 50 ? 3.5 : 4.5}
											fill={dot.listIdx >= 0 ? HEMI_COLORS[dot.listIdx % HEMI_COLORS.length] : '#d1d5db'}
											class={memberName ? 'has-tooltip' : ''}
										>
											<title>{memberName}</title>
										</circle>
									{/each}
								</svg>
								<div class="hemicycle-legend">
									{#each sortedLists as list, i}
										{#if list.seats}
											<span class="hemicycle-legend-item">
												<span class="hemicycle-legend-dot" style="background: {HEMI_COLORS[i % HEMI_COLORS.length]}"></span>
												{list.headCandidate || list.party} ({list.seats})
											</span>
										{/if}
									{/each}
								</div>
							</div>
						</div>
					</section>
				{/if}

				<!-- Elected council members list (from baseline data) -->
				{@const councilMembers = data.cityData.city.previousResults?.['2020']?.council || []}
				{#if councilMembers.length > 0}
					{@const prev2008Results = data.cityData.city.previousResults?.['2008']}
					<section class="past-section">
						<div class="container-app">
							<h2 class="past-section-title">Conseillers municipaux élus · {councilMembers.length} élus</h2>
							<div class="council-list">
								{#each councilMembers as member, idx}
									{@const fullName = `${member.firstName} ${member.lastName}`}
									{@const is2026 = returningCandidates2026().has(fullName.toUpperCase().trim()) || returningCandidates2026().has(`${member.lastName} ${member.firstName}`.toUpperCase().trim()) || [...returningCandidates2026()].some(n => n.includes(member.lastName.toUpperCase().trim()))}
									{@const was2008 = prev2008Results?.winner?.candidate ? member.lastName.toUpperCase().trim() === prev2008Results.winner.candidate.split(' ').pop()?.toUpperCase().trim() : false}
									<div class="council-member" class:is-2026={is2026}>
										<span class="council-idx">{idx + 1}</span>
										<span class="council-name">{member.firstName} {member.lastName}</span>
										<span class="council-gender">{member.gender === 'M' ? 'H' : 'F'}</span>
										{#if is2026}
											<span class="badge-past" title="Se présente aux municipales 2026">2026</span>
										{/if}
										{#if was2008}
											<span class="badge-past" title="Présent(e) aux municipales 2008">2008</span>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					</section>
				{/if}

			{:else if prevSummary}
				<!-- Fallback: only summary data available -->
				<section class="past-section">
					<div class="container-app">
						{#if prevSummary.winner}
							<div class="past-winner-card">
								<div class="past-winner-main">
									<span class="past-winner-label">Élu(e) en 2020</span>
									<h2 class="past-winner-name">{prevSummary.winner.candidate}</h2>
									<span class="past-winner-party">{prevSummary.winner.party}</span>
								</div>
								<div class="past-winner-stats">
									<span class="past-winner-score">{(prevSummary.winner.voteShare * 100).toFixed(1)}%</span>
								</div>
							</div>
						{/if}
						{#if prevSummary.turnout}
							<div class="past-turnout-grid" style="margin-top: 1rem;">
								<div class="past-turnout-card">
									<span class="past-round-label">Participation</span>
									<div class="past-turnout-row">
										<div class="past-turnout-item">
											<span class="past-turnout-value">{(prevSummary.turnout * 100).toFixed(1)}%</span>
											<span class="past-turnout-label">Participation</span>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</section>
			{:else}
				<section class="past-section">
					<div class="container-app">
						<div class="past-no-data">
							<p>Les résultats des municipales 2020 ne sont pas encore disponibles pour cette ville.</p>
						</div>
					</div>
				</section>
			{/if}

			<!-- CTA: Link to 2026 -->
			<section class="past-cta">
				<div class="container-app">
					<div class="past-cta-content">
						<h2>Municipales 2026</h2>
						<p>Découvrez les candidats et leurs programmes pour les prochaines élections.</p>
						<a href="/elections/municipales-2026/{data.citySlug}" class="past-cta-btn">
							Voir les candidats 2026
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</a>
					</div>
				</div>
			</section>
		</div>
	{:else}
	<div class="city-page">
		<!-- City Hero -->
		<header class="city-hero" class:has-compare-bar={!comparison.isEmpty}>
			<div class="hero-content">
				<div class="hero-main">
					<h1 class="city-name">{data.cityData.city.name}</h1>
					<div class="city-stats">
						<span class="stat-pill">
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							{formatNumber(data.cityData.city.population)} hab.
						</span>
						{#if officialLists.length > 0}
							<a href="#official-lists" class="stat-pill stat-pill-link" onclick={(e) => { e.preventDefault(); navToSection('official-lists', 'official-lists'); }}>
								{data.cityData.city.listsCount} listes
							</a>
						{:else}
							<span class="stat-pill">
								{data.cityData.city.listsCount} listes
							</span>
						{/if}
						{#if data.cityData.city.seatsTotal}
							<span class="stat-pill">
								{data.cityData.city.seatsTotal} sièges
							</span>
						{/if}
						<a href="/carte?city={data.citySlug}" class="stat-pill stat-pill-link" title="Voir sur la carte">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
								<path d="M8 2v16" /><path d="M16 6v16" />
							</svg>
							Carte
						</a>
					</div>
				</div>

				{#if data.cityData.city.incumbent}
					{#if data.cityData.incumbentAnalysis?.mandateAssessment}
						<a href="#bilan-section" class="incumbent-pill incumbent-pill-link" onclick={(e) => { e.preventDefault(); navToSection('bilan-section'); }}>
							<span class="incumbent-label">Maire sortant</span>
							<span class="incumbent-name">{data.cityData.city.incumbent.name}{@render cite('city.incumbent.name')}</span>
							<span class="incumbent-party">({data.cityData.city.incumbent.party}{@render cite('city.incumbent.party')})</span>
						</a>
					{:else}
						<div class="incumbent-pill">
							<span class="incumbent-label">Maire sortant</span>
							<span class="incumbent-name">{data.cityData.city.incumbent.name}{@render cite('city.incumbent.name')}</span>
							<span class="incumbent-party">({data.cityData.city.incumbent.party}{@render cite('city.incumbent.party')})</span>
						</div>
					{/if}
				{/if}
			</div>
		</header>

		<!-- AI Disclaimer (mobile: after candidates, desktop: in sidebar) -->
		<!-- Placeholder — actual mobile disclaimer moved after candidates grid -->

		<!-- Participation Alert (compact, 2020 turnout) -->
		{#if data.cityData.city.previousResults?.['2020']?.turnout}
			{@const turnout2020 = data.cityData.city.previousResults['2020'].turnout}
			{@const abstention = 100 - (turnout2020 * 100)}
			<div class="participation-strip">
				<div class="participation-strip-inner">
					<div class="participation-strip-bar">
						<div class="participation-strip-fill" style="width: {turnout2020 * 100}%"></div>
					</div>
					<span class="participation-strip-stat">{(turnout2020 * 100).toFixed(0)}% de participation en 2020</span>
					<span class="participation-strip-cta">Votez les 15 et 22 mars 2026</span>
				</div>
			</div>
		{/if}

		<!-- City Brief (shown on all screens) -->
		{#if cityExcerpt() || data.cityData.electoralContext?.keyThemes}
			<section class="city-brief">
				<div class="brief-content">
					{#if cityExcerpt()}
						<p class="brief-text">{cityExcerpt()}</p>
					{/if}

					<!-- Key themes as compact tags -->
					{#if data.cityData.electoralContext?.keyThemes}
						<div class="brief-themes">
							{#each data.cityData.electoralContext.keyThemes.slice(0, 4) as theme}
								<span class="mini-tag">{theme}</span>
							{/each}
						</div>
					{/if}

					<!-- Mobile: Foldable "En savoir plus" -->
					<button class="details-toggle" onclick={() => showCityDetails = !showCityDetails}>
						{showCityDetails ? 'Moins de détails' : 'En savoir plus sur la ville'}
						<svg class="toggle-icon" class:rotated={showCityDetails} fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if showCityDetails}
						<div class="city-details">
							{#if data.cityData.cityInfo?.characteristics}
								<div class="detail-block">
									<h4>Caractéristiques</h4>
									<ul>
										{#each data.cityData.cityInfo.characteristics as char}
											<li>{char}</li>
										{/each}
									</ul>
								</div>
							{/if}
							{#if data.cityData.cityInfo?.economicProfile}
								<div class="detail-block">
									<h4>Économie</h4>
									<p>{data.cityData.cityInfo.economicProfile}</p>
								</div>
							{/if}
							{#if data.cityData.politicalLandscape?.historicalTendency}
								<div class="detail-block">
									<h4>Tendance politique</h4>
									<p>{data.cityData.politicalLandscape.historicalTendency}{@render cite('politicalLandscape.historicalTendency')}</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</section>
		{/if}

		<!-- Election Results Banner (round 1 / between rounds / round 2 / final) -->
		{#if hasResults && electionResults}
			<section class="results-banner">
				<div class="results-inner">
					{#if resultsStatus === 'between-rounds'}
						<div class="results-status-badge between">Entre les deux tours</div>
					{:else if resultsStatus === 'round2-results' || resultsStatus === 'final'}
						<div class="results-status-badge final">Résultats définitifs</div>
					{:else}
						<div class="results-status-badge round1">Résultats du 1er tour</div>
					{/if}

					{#if electionResults.winner}
						<div class="results-winner">
							<span class="results-winner-label">Élu(e)</span>
							<span class="results-winner-name">{electionResults.winner.candidate}</span>
							<span class="results-winner-party">{electionResults.winner.party} · {(electionResults.winner.voteShare * 100).toFixed(1)}%</span>
							{#if electionResults.winner.seats}
								<span class="results-winner-seats">{electionResults.winner.seats} sièges</span>
							{/if}
						</div>
					{/if}

					<!-- Round 1 results -->
					{#if electionResults.round1}
						{@const r1 = electionResults.round1}
						<div class="results-round">
							<h3 class="results-round-title">1er tour — {r1.info.date}</h3>
							<div class="results-turnout">
								<span>Participation: <strong>{(r1.info.turnout * 100).toFixed(1)}%</strong></span>
								<span class="results-registered">{formatNumber(r1.info.registeredVoters)} inscrits</span>
							</div>
							<div class="results-lists">
								{#each r1.lists.sort((a, b) => b.voteShare - a.voteShare) as list}
									<div class="results-list-row">
										<div class="results-list-bar" style="width: {list.voteShare * 100}%"></div>
										<span class="results-list-name">
											{list.headCandidate}
											<span class="results-list-party">{list.party}</span>
										</span>
										<span class="results-list-score">{(list.voteShare * 100).toFixed(1)}%</span>
										<span class="results-list-votes">{formatNumber(list.votes)} voix</span>
										{#if list.qualified}
											<span class="results-qualified">Qualifié(e)</span>
										{/if}
										{#if list.withdrawn}
											<span class="results-withdrawn">Retiré(e)</span>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Between-rounds alliances -->
					{#if resultsStatus === 'between-rounds' && electionResults.round2?.alliances}
						<div class="results-alliances">
							<h3 class="results-round-title">Alliances pour le 2nd tour</h3>
							{#each electionResults.round2.alliances as alliance}
								<div class="results-alliance-row">
									<strong>{alliance.name}</strong>
									<span>{alliance.description}</span>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Round 2 results -->
					{#if electionResults.round2 && (resultsStatus === 'round2-results' || resultsStatus === 'final')}
						{@const r2 = electionResults.round2}
						<div class="results-round">
							<h3 class="results-round-title">2nd tour — {r2.info.date}</h3>
							<div class="results-turnout">
								<span>Participation: <strong>{(r2.info.turnout * 100).toFixed(1)}%</strong></span>
								<span class="results-registered">{formatNumber(r2.info.registeredVoters)} inscrits</span>
							</div>
							<div class="results-lists">
								{#each r2.lists.sort((a, b) => b.voteShare - a.voteShare) as list}
									<div class="results-list-row">
										<div class="results-list-bar" style="width: {list.voteShare * 100}%"></div>
										<span class="results-list-name">
											{list.headCandidate}
											<span class="results-list-party">{list.party}</span>
										</span>
										<span class="results-list-score">{(list.voteShare * 100).toFixed(1)}%</span>
										<span class="results-list-votes">{formatNumber(list.votes)} voix</span>
										{#if list.seats}
											<span class="results-seats">{list.seats} sièges</span>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</section>
		{/if}

		<!-- Section quick-nav -->
		<nav class="section-nav" class:has-compare-bar={!comparison.isEmpty}>
			<a href="#candidates-section" class="section-nav-btn" onclick={(e) => { e.preventDefault(); navToSection('candidates-section'); }}>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
				Candidats
			</a>
			{#if (!hasNoCandidates && randomizedHeadCandidates.length >= 1 && randomizedHeadCandidates.some(c => c.programHighlights?.length)) || (hasNoCandidates && officialLists.length > 0)}
				<a href="#programs-section" class="section-nav-btn" onclick={(e) => { e.preventDefault(); navToSection('programs-section'); }}>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
					Programmes
				</a>
			{/if}
			{#if data.cityData.incumbentAnalysis?.mandateAssessment}
				<a href="#bilan-section" class="section-nav-btn" onclick={(e) => { e.preventDefault(); navToSection('bilan-section'); }}>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
					Bilan
				</a>
			{/if}
			{#if data.cityData.cityInfo?.notableFeatures?.length || data.cityData.urbanDevelopment}
				<a href="#city-profile-section" class="section-nav-btn" onclick={(e) => { e.preventDefault(); navToSection('city-profile-section', 'city-profile'); }}>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
					Profil
				</a>
			{/if}
			{#if data.cityData.baselineStats || (data.cityData as any).citySituation}
				<a href="#demographics-section" class="section-nav-btn" onclick={(e) => { e.preventDefault(); navToSection('demographics-section', 'demographics'); }}>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
					Chiffres clés
				</a>
			{/if}
			{#if data.climateData}
				<a href="#climate-section" class="section-nav-btn" onclick={(e) => { e.preventDefault(); navToSection('climate-section'); }}>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
					Climat
				</a>
			{/if}
			{#if officialLists.length > 0}
				<a href="#official-lists" class="section-nav-btn" onclick={(e) => { e.preventDefault(); navToSection('official-lists', 'official-lists'); }}>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
					Listes
				</a>
			{/if}
		</nav>

		<!-- Main Content: 2-column on desktop -->
		<main class="city-main">
			<div class="main-grid">
				<!-- LEFT: Candidates (main content) -->
				<div class="main-column">
					<section id="candidates-section" class="candidates-section">
						{#if hasNoCandidates}
							{#if officialLists.length > 0}
								<!-- Têtes de liste from official data -->
								<div class="section-header-static">
									<h2 class="section-title">
										<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
										Têtes de liste
									</h2>
									<span class="count-badge">{officialLists.length}</span>
								</div>

								<div class="official-heads-grid">
									{#each officialLists as list (list.panelNumber)}
										{@const nameParts = list.headCandidate.split(' ')}
										{@const initials = nameParts.length >= 2 ? nameParts[0][0] + nameParts[nameParts.length - 1][0] : nameParts[0]?.substring(0, 2) ?? '?'}
										{@const was2020 = wasCandidate2020(list.headCandidate)}
										<div class="official-head-card" class:was-2020={was2020}>
											<div class="official-head-avatar" class:was-2020={was2020}>
												{initials}
											</div>
											<div class="official-head-info">
												<h3 class="official-head-name">{list.headCandidate}</h3>
												<span class="official-head-list">{list.shortName || list.name}</span>
												{#if list.nuanceLabel}
													<span class="official-head-nuance">{list.nuanceLabel}</span>
												{/if}
												{#if was2020}
													<span class="badge-2020">Candidat en 2020</span>
												{/if}
											</div>
										</div>
									{/each}
								</div>

								<div class="official-interest-cta">
									<button
										class="interest-btn"
										onclick={(e) => {
											const btn = e.currentTarget;
											btn.classList.add('interest-sent');
											btn.disabled = true;
											fetch(`/api/interest/${data.citySlug}`, { method: 'POST' }).catch(() => {});
										}}
									>
										<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
										</svg>
										<span class="interest-default">J'habite ici, je veux voir l'analyse des programmes</span>
										<span class="interest-thanks">Merci, votre intérêt est noté !</span>
									</button>
									<p class="official-interest-hint">Plus cette ville reçoit d'intérêt, plus vite elle sera enrichie.</p>
								</div>
							{:else}
							<!-- No candidates and no official lists -->
							<div class="no-candidates-state">
								<div class="no-candidates-icon">
									<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								</div>
								<h2 class="no-candidates-title">Candidats en cours d'identification</h2>
								<p class="no-candidates-text">
									Les listes candidates aux municipales 2026 de {data.cityData.city.name} ne sont pas encore répertoriées.
									Nous enrichissons les données en continu.
								</p>
								<button
									class="interest-btn"
									onclick={(e) => {
										const btn = e.currentTarget;
										btn.classList.add('interest-sent');
										btn.disabled = true;
										fetch(`/api/interest/${data.citySlug}`, { method: 'POST' }).catch(() => {});
									}}
								>
									<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
									</svg>
									<span class="interest-default">J'habite ici, je veux voir les candidats !</span>
									<span class="interest-thanks">Merci, votre intérêt est noté !</span>
								</button>
								<p class="no-candidates-hint">Plus cette ville reçoit d'intérêt, plus vite elle sera enrichie.</p>
							</div>
							{/if}

						{:else}
						<div class="section-header-static">
							<h2 class="section-title">
								<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
								Têtes de liste
							</h2>
							<span class="count-badge">{headCandidates().length + missingOfficialHeads().length}</span>
						</div>

						<div class="candidates-grid" class:few-candidates={hasFewCandidates}>
							{#each randomizedHeadCandidates as candidate (candidate.id)}
								{#if stubIds.has(candidate.id)}
									<CandidateCard
										{candidate}
										showSelect={false}
										isStub={true}
										onInterest={() => fetch(`/api/interest/${data.citySlug}`, { method: 'POST' }).catch(() => {})}
										programUrl={`https://www.qwant.com/?l=fr&q=${encodeURIComponent('programme ' + candidate.fullName + ' ' + data.cityData.city.name + ' municipales 2026')}`}
										listName={candidate._listName}
										citySlug={data.cityData.city.slug}
										cityName={data.cityData.city.name}
									/>
								{:else}
									<CandidateCard
										{candidate}
										programUrl={listProgramUrls().get(candidate.listId)}
										listName={listNames().get(candidate.listId)}
										citySlug={data.cityData.city.slug}
										cityName={data.cityData.city.name}
									/>
								{/if}
							{/each}
						</div>

						{#if headCandidates().length >= 2 && !isPastElection}
							<div class="candidates-actions">
								<button
									class="compare-all-btn"
									class:done={allCompared}
									disabled={allCompared}
									onclick={() => {
										comparison.addAll(headCandidates(), data.cityData.city.slug, data.cityData.city.name);
										allCompared = true;
									}}
								>
									{#if allCompared}
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
										{headCandidates().length} candidats ajoutés
									{:else}
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
										</svg>
										Comparer tous les candidats ({headCandidates().length})
									{/if}
								</button>
							</div>
						{/if}

						<p class="candidates-hint">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
							</svg>
							Cliquez sur une carte pour voir les détails
						</p>
						{/if}
					</section>

					{#if dataTier === 'research'}
					<div class="mobile-only mobile-disclaimer">
						<AiDisclaimer lastUpdated={data.cityData.lastUpdated} />
					</div>
				{/if}

					<!-- Bilan du maire sortant -->
					{#if data.cityData.incumbentAnalysis?.mandateAssessment}
						{@const assessment = data.cityData.incumbentAnalysis.mandateAssessment}
						{#if assessment.majorAchievements?.length || assessment.controversies?.length || assessment.publicPerception}
						<section id="bilan-section" class="bilan-section">
							<div class="bilan-content">
								<h2 class="bilan-title">
									<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									Bilan du maire sortant
									{#if data.cityData.city.incumbent}
										<span class="bilan-mayor-name">— {data.cityData.city.incumbent.name}</span>
									{/if}
								</h2>
								<div class="bilan-grid">
									{#if assessment.majorAchievements}
										<div class="assessment-row">
											<span class="assessment-label success">
												<span class="dot"></span> Réalisations
											</span>
											<ul class="assessment-list">
												{#each assessment.majorAchievements as item, i}
													<li>{item}{@render cite(`incumbentAnalysis.mandateAssessment.majorAchievements[${i}]`)}</li>
												{/each}
											</ul>
										</div>
									{/if}
									{#if assessment.controversies?.length}
										<div class="assessment-row">
											<span class="assessment-label warning">
												<span class="dot"></span> Points de débat rapportés
											</span>
											<ul class="assessment-list">
												{#each assessment.controversies as item, i}
													<li>{item}{@render cite(`incumbentAnalysis.mandateAssessment.controversies[${i}]`)}</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
								{#if assessment.publicPerception}
									<p class="perception-text">
										<strong>Perception :</strong> {assessment.publicPerception}{@render cite('incumbentAnalysis.mandateAssessment.publicPerception')}
									</p>
								{/if}
							</div>
						</section>
						{/if}
					{/if}

				</div>

				<!-- RIGHT: Sidebar (desktop) / Below (mobile) -->
				<aside class="sidebar-column">
					{#if dataTier === 'research'}
					<div class="desktop-only">
						<AiDisclaimer lastUpdated={data.cityData.lastUpdated} />
					</div>
				{/if}

					<!-- City Profile (Wikipedia data) -->
					{#if data.cityData.cityInfo?.notableFeatures?.length || data.cityData.urbanDevelopment}
						<section id="city-profile-section" class="sidebar-card">
							<button class="sidebar-header" onclick={() => toggleSection('city-profile')}>
								<h3 class="sidebar-title">
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
									</svg>
									Profil de la ville
								</h3>
								<span class="expand-icon" class:expanded={expandedSections.has('city-profile')}>
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
									</svg>
								</span>
							</button>
							{#if expandedSections.has('city-profile')}
								<div class="sidebar-body">
									{#if data.cityData.cityInfo?.notableFeatures?.length}
										<div class="profile-block">
											<h3>Patrimoine et points d'intérêt</h3>
											<ul class="profile-list">
												{#each data.cityData.cityInfo.notableFeatures as feature}
													<li>{feature}</li>
												{/each}
											</ul>
										</div>
									{/if}
									{#if data.cityData.urbanDevelopment?.majorProjects?.length}
										<div class="profile-block">
											<h3>Projets urbains</h3>
											<ul class="profile-list">
												{#each data.cityData.urbanDevelopment.majorProjects as project}
													<li>{project}</li>
												{/each}
											</ul>
										</div>
									{/if}
									{#if data.cityData.urbanDevelopment?.housingSituation}
										<div class="profile-block">
											<h3>Logement</h3>
											<p class="profile-text">{data.cityData.urbanDevelopment.housingSituation}</p>
										</div>
									{/if}
									{#if data.cityData.urbanDevelopment?.transportChallenges?.length}
										<div class="profile-block">
											<h3>Transports</h3>
											<ul class="profile-list">
												{#each data.cityData.urbanDevelopment.transportChallenges as challenge}
													<li>{challenge}</li>
												{/each}
											</ul>
										</div>
									{/if}
									{#if data.cityData.politicalLandscape?.keyPoliticalFigures?.length}
										<div class="profile-block">
											<h3>Figures politiques locales</h3>
											<ul class="profile-list">
												{#each data.cityData.politicalLandscape.keyPoliticalFigures as figure}
													<li>{figure}</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							{/if}
						</section>
					{/if}

					<!-- INSEE Demographics (from research citySituation or baseline stats) -->
					{#if (data.cityData as any).citySituation?.demographics || (data.cityData as any).citySituation?.economic || data.cityData.baselineStats}
					{@const bs = data.cityData.baselineStats}
					{@const debt = data.cityData.debtData?.evolution2019_2024}
					{@const debtSev = debt == null ? 'neutral' : debt <= -5 ? 'low' : debt <= 10 ? 'moderate' : 'critical'}
						<section id="demographics-section" class="sidebar-card">
							<button class="sidebar-header" onclick={() => toggleSection('demographics')}>
								<h3 class="sidebar-title">
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
									</svg>
									Chiffres clés (INSEE)
								</h3>
								<span class="expand-icon" class:expanded={expandedSections.has('demographics')}>
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
									</svg>
								</span>
							</button>
							{#if expandedSections.has('demographics')}
								<div class="sidebar-body">
									{#if (data.cityData as any).citySituation}
										{@const situation = (data.cityData as any).citySituation}
										<div class="stats-grid">
											{#if situation.demographics?.population}
												<div class="stat-cell">
													<span class="stat-value">{situation.demographics.population.toLocaleString('fr-FR')}</span>
													<span class="stat-label">Habitants</span>
												</div>
											{/if}
											{#if situation.economic?.medianIncome}
												<div class="stat-cell">
													<span class="stat-value">{situation.economic.medianIncome.toLocaleString('fr-FR')} €</span>
													<span class="stat-label">Revenu médian</span>
												</div>
											{/if}
										</div>
									{:else if bs}
										<!-- Debt severity card -->
										{#if debt != null}
											<div class="demo-card debt-card severity-{debtSev}">
												<div class="demo-card-top">
													<span class="demo-card-icon">
														<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
															<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
														</svg>
													</span>
													<span class="demo-card-title">Dette communale</span>
												</div>
												<div class="demo-card-value">
													<span class="demo-big-number">{debt > 0 ? '+' : ''}{debt.toFixed(1)}%</span>
												</div>
												<div class="demo-severity-bar">
													<div class="demo-severity-track">
														<div class="demo-severity-fill" style="width: {Math.min(Math.abs(debt) / 30 * 100, 100)}%"></div>
													</div>
													<span class="demo-severity-label">
														{#if debt <= -5}En baisse{:else if debt <= 10}Stable{:else}En hausse{/if}
													</span>
												</div>
												<p class="demo-card-desc">
													{#if debt > 15}Forte hausse de l'endettement sur le mandat 2019-2024{:else if debt > 0}Hausse modérée de la dette sur le mandat 2019-2024{:else if debt > -5}Dette quasi stable sur le mandat 2019-2024{:else}Désendettement sur le mandat 2019-2024{/if}
												</p>
											</div>
										{/if}

										<!-- Key indicators grid -->
										<div class="demo-cards-grid">
											{#if bs.medianIncome}
												<div class="demo-card">
													<div class="demo-card-top">
														<span class="demo-card-icon">
															<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
																<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/>
															</svg>
														</span>
														<span class="demo-card-title">Revenu</span>
													</div>
													<div class="demo-card-value">
														<span class="demo-big-number">{Math.round(bs.medianIncome).toLocaleString('fr-FR')}</span>
														<span class="demo-value-unit">€/an</span>
													</div>
													<p class="demo-card-desc">Revenu médian par ménage — la moitié des foyers gagne plus, l'autre moins</p>
												</div>
											{/if}
											{#if bs.popGrowth != null}
												<div class="demo-card">
													<div class="demo-card-top">
														<span class="demo-card-icon">
															<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
																<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
															</svg>
														</span>
														<span class="demo-card-title">Population</span>
													</div>
													<div class="demo-card-value">
														<span class="demo-big-number">{bs.popGrowth > 0 ? '+' : ''}{bs.popGrowth.toFixed(1)}%</span>
														<span class="demo-value-unit">/an</span>
													</div>
													<p class="demo-card-desc">
														{#if bs.popGrowth > 0.5}Ville attractive, population en croissance{:else if bs.popGrowth > -0.2}Population stable{:else}Population en déclin{/if}
													</p>
												</div>
											{/if}
											{#if bs.jobs}
												<div class="demo-card">
													<div class="demo-card-top">
														<span class="demo-card-icon">
															<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
																<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
															</svg>
														</span>
														<span class="demo-card-title">Emploi</span>
													</div>
													<div class="demo-card-value">
														<span class="demo-big-number">{Math.round(bs.jobs).toLocaleString('fr-FR')}</span>
													</div>
													<p class="demo-card-desc">
														Emplois sur la commune
														{#if bs.servicesRate && bs.industryRate && bs.publicSectorRate}
															— {Math.round(bs.servicesRate)}% services, {Math.round(bs.publicSectorRate)}% public, {Math.round(bs.industryRate)}% industrie
														{/if}
													</p>
												</div>
											{/if}
										</div>

										<!-- Secondary stats (folded) -->
										{#if bs.bac5Rate || bs.doctors || bs.nurses || bs.mainResidenceRate}
											<button class="demo-details-toggle" onclick={() => toggleSection('demo-details')}>
												<span>Détails supplémentaires</span>
												<span class="expand-icon" class:expanded={expandedSections.has('demo-details')}>
													<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
													</svg>
												</span>
											</button>
											{#if expandedSections.has('demo-details')}
												<div class="demo-details-body">
													{#if bs.bac5Rate}
														<div class="demo-detail-row">
															<span class="demo-detail-label">Diplômés Bac+5</span>
															<span class="demo-detail-value">{bs.bac5Rate.toFixed(1)}%</span>
														</div>
													{/if}
													{#if bs.doctors}
														<div class="demo-detail-row">
															<span class="demo-detail-label">Médecins généralistes</span>
															<span class="demo-detail-value">{bs.doctors}</span>
														</div>
													{/if}
													{#if bs.pharmacies}
														<div class="demo-detail-row">
															<span class="demo-detail-label">Pharmacies</span>
															<span class="demo-detail-value">{bs.pharmacies}</span>
														</div>
													{/if}
													{#if bs.nurses}
														<div class="demo-detail-row">
															<span class="demo-detail-label">Infirmiers</span>
															<span class="demo-detail-value">{bs.nurses}</span>
														</div>
													{/if}
													{#if bs.schools}
														<div class="demo-detail-row">
															<span class="demo-detail-label">Établissements scolaires</span>
															<span class="demo-detail-value">{bs.schools}</span>
														</div>
													{/if}
													{#if bs.mainResidenceRate}
														<div class="demo-detail-row">
															<span class="demo-detail-label">Résidences principales</span>
															<span class="demo-detail-value">{bs.mainResidenceRate.toFixed(0)}%</span>
														</div>
													{/if}
												</div>
											{/if}
										{/if}
									{/if}
									<p class="stat-source">Source : INSEE, ANCT (dette) — statistiques-locales.insee.fr</p>
								</div>
							{/if}
						</section>
					{/if}

					<!-- Climate Projections (DRIAS TRACC-2023) -->
					{#if data.climateData}
						<div id="climate-section">
						<ClimateProjections climateData={data.climateData} />
						</div>
					{/if}

					</aside>

			<!-- Enjeux, dynamique, attentes — full-width below main columns -->
			<div class="grid-context">
				<!-- Issues Summary -->
				{#if data.cityData.localIssues && data.cityData.localIssues.length > 0}
					<section class="context-card">
						<button class="sidebar-header" onclick={() => toggleSection('issues')}>
							<h3 class="sidebar-title">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
								</svg>
								Enjeux locaux
							</h3>
							<div class="sidebar-meta">
								<span class="count-badge small">{data.cityData.localIssues.length}</span>
								<span class="expand-icon" class:expanded={expandedSections.has('issues')}>
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
									</svg>
								</span>
							</div>
						</button>

						{#if expandedSections.has('issues')}
							<div class="sidebar-body">
								{#each data.cityData.localIssues as issue, i (issue.rank)}
									<div class="issue-compact">
										<span class="issue-rank">{issue.rank}</span>
										<div class="issue-info">
											<strong>{issue.issue}{@render cite(`localIssues[${i}].issue`)}</strong>
											{#if issue.description}
												<p>{issue.description}{@render cite(`localIssues[${i}].description`)}</p>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</section>
				{/if}

				<!-- Campaign Dynamics -->
				{#if data.cityData.electoralContext?.campaignDynamics || data.cityData.politicalLandscape?.localPoliticalDynamics}
					<section class="context-card">
						<button class="sidebar-header" onclick={() => toggleSection('dynamics')}>
							<h3 class="sidebar-title">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
								Dynamique
							</h3>
							<span class="expand-icon" class:expanded={expandedSections.has('dynamics')}>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</span>
						</button>

						{#if expandedSections.has('dynamics')}
							<div class="sidebar-body dynamics-content">
								{#if data.cityData.electoralContext?.campaignDynamics}
									<p>{data.cityData.electoralContext.campaignDynamics}{@render cite('electoralContext.campaignDynamics')}</p>
								{/if}
								{#if data.cityData.politicalLandscape?.localPoliticalDynamics}
									<p>{data.cityData.politicalLandscape.localPoliticalDynamics}{@render cite('politicalLandscape.localPoliticalDynamics')}</p>
								{/if}

								{#if data.cityData.electoralContext?.potentialAlliances}
									<div class="alliances-mini">
										<strong>Alliances possibles :</strong>
										<ul>
											{#each data.cityData.electoralContext.potentialAlliances as alliance, i}
												<li>{alliance}{@render cite(`electoralContext.potentialAlliances[${i}]`)}</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if data.cityData.incumbentAnalysis?.reelectionLikelihood}
									<div class="reelection-mini">
										<span class="status-badge">
											{data.cityData.incumbentAnalysis.reelectionLikelihood.runningAgain ? '🏃 Maire se représente' : '🚪 Maire ne se représente pas'}
										</span>
									</div>
								{/if}
							</div>
						{/if}
					</section>
				{/if}

				<!-- Voter Expectations (compact) -->
				{#if data.cityData.electoralContext?.voterExpectations}
					<section class="context-card compact">
						<h3 class="sidebar-title-static">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
							Attentes des électeurs
						</h3>
						<ul class="expectations-list">
							{#each data.cityData.electoralContext.voterExpectations as expectation, i}
								<li>{expectation}{@render cite(`electoralContext.voterExpectations[${i}]`)}</li>
							{/each}
						</ul>
					</section>
				{/if}

			</div>

			</div>
		</main>


		<!-- Programmes en un coup d'oeil (direct grid child for reordering) -->
		{#if hasNoCandidates && officialLists.length > 0}
			<section id="programs-section" class="program-compare-section">
				<div class="section-header-static">
					<h2 class="section-title">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
						Programmes en un coup d'oeil
					</h2>
				</div>

				<!-- Interest CTA -->
				<div class="enrichment-cta">
					<button
						class="interest-btn compact"
						onclick={(e) => {
							const btn = e.currentTarget;
							btn.classList.add('interest-sent');
							btn.disabled = true;
							fetch(`/api/interest/${data.citySlug}`, { method: 'POST' }).catch(() => {});
						}}
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
						</svg>
						<span class="interest-default">J'habite ici, je veux voir l'analyse des programmes</span>
						<span class="interest-thanks">Merci, votre intérêt est noté !</span>
					</button>
					<p class="enrichment-hint">Plus cette ville reçoit d'intérêt, plus vite elle sera enrichie avec les programmes et analyses.</p>
				</div>

				<div class="program-compare-grid">
					{#each officialLists as list (list.panelNumber)}
						{@const nameParts = list.headCandidate.split(' ')}
						{@const initials = nameParts.length >= 2 ? nameParts[0][0] + nameParts[nameParts.length - 1][0] : nameParts[0]?.substring(0, 2) ?? '?'}
						<div class="program-compare-card">
							<div class="program-card-header">
								<div class="program-card-avatar-placeholder">
									{initials}
								</div>
								<div>
									<h3 class="program-card-name">{list.headCandidate}</h3>
									<span class="program-card-party">{list.shortName || list.name}</span>
								</div>
							</div>
							<p class="program-card-empty">Analyse en cours de préparation</p>
							<button class="program-card-list-link" onclick={() => navToOfficialList(list.panelNumber)}>
								Voir la liste complète →
							</button>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Quick Program Comparison (research view) -->
		{#if !hasNoCandidates && randomizedHeadCandidates.length >= 1 && randomizedHeadCandidates.some(c => c.programHighlights?.length)}
			<section id="programs-section" class="program-compare-section">
				<div class="section-header-static">
					<h2 class="section-title">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
						Programmes en un coup d'oeil
					</h2>
				</div>
				<div class="program-compare-grid">
					{#each randomizedHeadCandidates as candidate (candidate.id)}
						{@const matchingList = officialLists.find(l => l.name === listNames().get(candidate.listId))}
						<div class="program-compare-card" class:selected={comparison.isSelected(candidate.id)}>
							<div class="program-card-header">
								{#if candidate.photo}
									<img src={wikiThumb(candidate.photo, 80)} alt="" class="program-card-avatar" loading="lazy" />
								{:else}
									<div class="program-card-avatar-placeholder">
										{candidate.firstName[0]}{candidate.lastName[0]}
									</div>
								{/if}
								<div>
									<h3 class="program-card-name">{candidate.fullName}</h3>
									<span class="program-card-party">{listNames().get(candidate.listId) || candidate.positioning || candidate.demographics.profession}</span>
								</div>
							</div>
							{#if candidate.programHighlights?.length}
								<ul class="program-card-list">
									{#each candidate.programHighlights.slice(0, 4) as highlight}
										<li>{highlight}</li>
									{/each}
								</ul>
							{:else}
								<p class="program-card-empty">Pas de données de programme</p>
							{/if}
							{#if candidate.socialLinks?.website || candidate.programUrl}
								<a
									href={candidate.programUrl || candidate.socialLinks?.website}
									target="_blank"
									rel="noopener noreferrer"
									class="program-card-link"
								>
									Voir le programme complet
								</a>
							{:else if !candidate.programHighlights?.length}
								<a
									href={`https://www.qwant.com/?l=fr&q=${encodeURIComponent(candidate.fullName + ' ' + data.cityData.city.name + ' municipales 2026')}`}
									target="_blank"
									rel="noopener noreferrer"
									class="program-card-link search-link"
								>
									Rechercher sur le web
								</a>
							{/if}
							{#if matchingList}
								<button class="program-card-list-link" onclick={() => navToOfficialList(matchingList.panelNumber)}>
									Voir la liste complète →
								</button>
							{/if}
							{#if !isPastElection}
								<button
									class="program-card-select"
									class:active={comparison.isSelected(candidate.id)}
									onclick={() => comparison.toggle(candidate, data.cityData.city.slug, data.cityData.city.name)}
								>
									{comparison.isSelected(candidate.id) ? '✓ Sélectionné' : '+ Comparer'}
								</button>
							{/if}
						</div>
					{/each}
				</div>
				{#if randomizedHeadCandidates.length >= 2 && !isPastElection}
					<div class="candidates-actions">
						<button
							class="compare-all-btn"
							class:done={allCompared}
							disabled={allCompared}
							onclick={() => {
								comparison.addAll(headCandidates(), data.cityData.city.slug, data.cityData.city.name);
								allCompared = true;
							}}
						>
							{#if allCompared}
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								{headCandidates().length} candidats ajoutés
							{:else}
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
								</svg>
								Comparer tous les candidats ({headCandidates().length})
							{/if}
						</button>
					</div>
				{/if}
			</section>
		{/if}

		<!-- Historical Elections Comparison — 2020, 2014, 2008 -->
		{#if data.previousMunicipalElection || data.cityData.city.previousResults?.['2020'] || data.cityData.city.previousResults?.['2014'] || data.cityData.city.previousResults?.['2008']}
			{@const prevResults = data.cityData.city.previousResults || {}}
			{@const prev2020 = data.previousMunicipalElection}
			{@const embedded2020 = prevResults['2020']}
			{@const prev2014 = prevResults['2014']}
			{@const prev2008 = prevResults['2008']}
			<section class="comparison-section">
				<div class="comparison-content">
					<div class="comparison-header">
						<a href="/elections/municipales-2020/{data.citySlug}" class="comparison-title">
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
							</svg>
							Élections précédentes
						</a>
					</div>

					<div class="comparison-grid">
						<!-- 2020 Result -->
						<a href="/elections/municipales-2020/{data.citySlug}" class="comparison-card past comparison-card-link">
							<span class="year-badge">2020</span>
							<h3 class="result-title">Résultat</h3>
							{#if prev2020?.city?.winner}
								<div class="winner-info">
									<span class="winner-name">{prev2020.city.winner.name}</span>
									<span class="winner-party">{prev2020.city.winner.party}</span>
									{#if prev2020.city.winner.voteShare}
										<span class="winner-score">{prev2020.city.winner.voteShare.toFixed(1)}%</span>
									{/if}
								</div>
							{:else if embedded2020?.winner}
								<div class="winner-info">
									<span class="winner-name">{embedded2020.winner.candidate}{@render cite('city.previousResults.2020.winner.candidate')}</span>
									<span class="winner-party">{embedded2020.winner.party}{@render cite('city.previousResults.2020.winner.party')}</span>
									{#if embedded2020.winner.voteShare}
										<span class="winner-score">{(embedded2020.winner.voteShare * 100).toFixed(1)}%</span>
									{/if}
								</div>
							{/if}
							{#if data.cityData.city.mayorChange}
								<div class="mayor-change-badge">
									Depuis {new Date(data.cityData.city.mayorChange.changeDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} : {data.cityData.city.mayorChange.currentMayor}
								</div>
							{/if}
							{#if prev2020?.city?.electionResults?.round2?.turnout}
								<div class="turnout-info">
									<span class="turnout-label">Participation</span>
									<span class="turnout-value">{prev2020.city.electionResults.round2.turnout.toFixed(1)}%</span>
								</div>
							{:else if embedded2020?.turnout}
								<div class="turnout-info">
									<span class="turnout-label">Participation</span>
									<span class="turnout-value">{(embedded2020.turnout * 100).toFixed(1)}%</span>
								</div>
							{/if}
							<span class="card-link-hint">Voir les résultats détaillés →</span>
						</a>

						<!-- 2014 Result -->
						{#if prev2014}
							<div class="comparison-card past">
								<span class="year-badge">2014</span>
								<h3 class="result-title">{data.cityData.city.population < 1000 ? 'Plus voté(e)' : 'Élu(e)'}</h3>
								{#if prev2014.winner}
									<div class="winner-info">
										{#if prev2014.winner.candidate}
											<span class="winner-name">{prev2014.winner.candidate}</span>
										{/if}
										<span class="winner-party">{prev2014.winner.party || prev2014.winner.list}</span>
										{#if prev2014.winner.voteShare}
											<span class="winner-score">{(prev2014.winner.voteShare * 100).toFixed(1)}%</span>
										{/if}
									</div>
								{/if}
								{#if prev2014.turnout}
									<div class="turnout-info">
										<span class="turnout-label">Participation</span>
										<span class="turnout-value">{(prev2014.turnout * 100).toFixed(1)}%</span>
									</div>
								{/if}
							</div>
						{/if}

						<!-- 2008 Result -->
						{#if prev2008}
							<div class="comparison-card past">
								<span class="year-badge">2008</span>
								<h3 class="result-title">{data.cityData.city.population < 1000 ? 'Plus voté(e)' : 'Élu(e)'}</h3>
								{#if prev2008.winner}
									<div class="winner-info">
										{#if prev2008.winner.candidate}
											<span class="winner-name">{prev2008.winner.candidate}</span>
										{/if}
										<span class="winner-party">{prev2008.winner.party || prev2008.winner.list}</span>
										{#if prev2008.winner.voteShare}
											<span class="winner-score">{(prev2008.winner.voteShare * 100).toFixed(1)}%</span>
										{/if}
									</div>
								{/if}
								{#if prev2008.turnout}
									<div class="turnout-info">
										<span class="turnout-label">Participation</span>
										<span class="turnout-value">{(prev2008.turnout * 100).toFixed(1)}%</span>
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Context from 2020 -->
					{#if prev2020?.electionAnalysis?.context}
						<div class="context-2020">
							<h4>Contexte de 2020</h4>
							<p>{prev2020.electionAnalysis.context}</p>
						</div>
					{/if}
				</div>
			</section>
		{/if}

		{#if officialLists.length > 0}
			<section id="official-lists" class="official-lists-section">
				<button class="official-lists-toggle" onclick={() => toggleSection('official-lists')}>
					<h2 class="section-title compact">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						Listes officielles déclarées
						{#if data.cityData.city.seatsTotal}
							<span class="seats-info">· {data.cityData.city.seatsTotal} sièges</span>
						{/if}
					</h2>
					<div class="official-toggle-meta">
						<span class="count-badge small">{officialLists.length}</span>
						<span class="official-source-tag">data.gouv.fr</span>
						<span class="expand-icon" class:expanded={expandedSections.has('official-lists')}>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</span>
					</div>
				</button>
				{#if expandedSections.has('official-lists')}
					<div class="official-lists-body">
						{#each officialLists as list (list.panelNumber)}
							{@const headWas2020 = wasCandidate2020(list.headCandidate)}
							<div id="official-list-{list.panelNumber}" class="official-list-card compact" class:was-2020={headWas2020}>
								<div class="official-list-header">
									<span class="official-list-panel">N°{list.panelNumber}</span>
									<div class="official-list-meta">
										<h3 class="official-list-name">{list.name}</h3>
										{#if list.nuanceLabel}
											<span class="official-list-nuance">{list.nuanceLabel}</span>
										{/if}
									</div>
								</div>
								<div class="official-list-head" class:was-2020={headWas2020}>
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									<span>{list.headCandidate}</span>
									{#if headWas2020}
										<span class="badge-2020">2020</span>
									{/if}
								</div>
								<details class="official-list-details">
									<summary>
										{list.candidates.length} candidat{list.candidates.length > 1 ? 's' : ''} sur la liste
										{#if data.cityData.city.seatsTotal}
											<span class="seats-hint">({data.cityData.city.seatsTotal} sièges)</span>
										{/if}
									</summary>
									<ol class="official-candidates-list">
										{#each list.candidates as candidate (candidate.order)}
											{@const pastYears = matchPastElectionYears(candidate.firstName, candidate.lastName)}
											<li class:is-head={candidate.order === 1} class:is-elected={data.cityData.city.seatsTotal && candidate.order <= data.cityData.city.seatsTotal}>
												<span class="candidate-order">{candidate.order}</span>
												<span class="candidate-name">
													{candidate.firstName} {candidate.lastName}
													{#if pastYears.length > 0}
														<span class="badge-past" title="Candidat(e) présent(e) aux municipales {pastYears.join(' et ')}">{pastYears.join(', ')}</span>
													{/if}
												</span>
												<span class="candidate-gender">{candidate.gender === 'F' ? 'F' : 'H'}</span>
											</li>
										{/each}
									</ol>
									{#if data.cityData.city.seatsTotal}
										<p class="elected-threshold-note">Les {data.cityData.city.seatsTotal} premiers de la liste gagnante siégeront au conseil municipal</p>
									{/if}
								</details>
							</div>
						{/each}
						<p class="official-source-note">Listes officiellement déposées — Source : Ministère de l'Intérieur, data.gouv.fr, 28 février 2026</p>
					</div>
				{/if}
			</section>
		{/if}

		<!-- Sources & Transparence -->
		{#if data.cityData._verification?.status === 'verified'}
			{@const v = data.cityData._verification}
			{@const sources = data.cityData._sources || []}
			{@const total = v.confirmedClaims + v.reportedClaims + v.unverifiedClaims}
			{@const pctConfirmed = total ? Math.round((v.confirmedClaims / total) * 100) : 0}
			{@const pctReported = total ? Math.round((v.reportedClaims / total) * 100) : 0}
			{@const pctUnverified = total ? Math.round((v.unverifiedClaims / total) * 100) : 0}
			{@const highClaims = v.unsourcedClaims?.filter(c => c.severity === 'high' && !c.path.startsWith('debtEvolutionPerCapita')) || []}
			{@const mediumClaims = v.unsourcedClaims?.filter(c => c.severity === 'medium' && !c.path.startsWith('debtEvolutionPerCapita')) || []}
			<section class="verification-section">
				<div class="verification-content">
					<div class="verification-header">
						<h3 class="verification-title">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
							Sources & Transparence
						</h3>
						<span class="verification-rate" class:rate-good={pctConfirmed >= 60} class:rate-mid={pctConfirmed >= 40 && pctConfirmed < 60} class:rate-low={pctConfirmed < 40}>
							{v.confirmationRate} vérifiées
						</span>
					</div>

					<!-- Stacked verification bar -->
					<div class="verification-bar-container">
						<div class="verification-bar">
							{#if pctConfirmed > 0}
								<div class="bar-segment bar-confirmed" style="width: {pctConfirmed}%">
									{#if pctConfirmed > 15}<span>{v.confirmedClaims}</span>{/if}
								</div>
							{/if}
							{#if pctReported > 0}
								<div class="bar-segment bar-reported" style="width: {pctReported}%">
									{#if pctReported > 8}<span>{v.reportedClaims}</span>{/if}
								</div>
							{/if}
							{#if pctUnverified > 0}
								<div class="bar-segment bar-unverified" style="width: {pctUnverified}%">
									{#if pctUnverified > 10}<span>{v.unverifiedClaims}</span>{/if}
								</div>
							{/if}
						</div>
						<div class="bar-legend">
							<span class="legend-item"><span class="legend-dot dot-confirmed"></span> Confirmées ({v.confirmedClaims})</span>
							<span class="legend-item"><span class="legend-dot dot-reported"></span> Presse ({v.reportedClaims})</span>
							<span class="legend-item"><span class="legend-dot dot-unverified"></span> Non vérifiées ({v.unverifiedClaims})</span>
						</div>
					</div>

					<!-- Unsourced claims (high + medium only) -->
					{#if highClaims.length > 0 || mediumClaims.length > 0}
						<button class="verif-toggle" onclick={() => toggleSection('unsourced')}>
							<span class="verif-toggle-title">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
								Données non vérifiées ({highClaims.length + mediumClaims.length})
							</span>
							<svg class="toggle-arrow" class:expanded={expandedSections.has('unsourced')} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
						</button>
						{#if expandedSections.has('unsourced')}
							<div class="verif-panel">
								{#each highClaims as claim}
									<div class="unsourced-claim claim-high">
										<span class="claim-severity">&#x26A0;&#xFE0F;</span>
										<div>
											<span class="claim-text">{claim.claim}</span>
											<span class="claim-path">{claim.path}</span>
										</div>
									</div>
								{/each}
								{#each mediumClaims as claim}
									<div class="unsourced-claim claim-medium">
										<span class="claim-severity">&#x26A0;&#xFE0F;</span>
										<div>
											<span class="claim-text">{claim.claim}</span>
											<span class="claim-path">{claim.path}</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/if}

					<!-- Sources list -->
					{#if sources.length > 0}
						<button class="verif-toggle" onclick={() => toggleSection('sources')}>
							<span class="verif-toggle-title">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
								Sources ({sources.length})
							</span>
							<svg class="toggle-arrow" class:expanded={expandedSections.has('sources')} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
						</button>
						{#if expandedSections.has('sources')}
							<div id="sources-list" class="verif-panel sources-list">
								{#each sources as src, i}
									<div id="source-{i + 1}" class="source-item">
										<span class="source-num">[{i + 1}]</span>
										<div class="source-info">
											<a href={src.url} target="_blank" rel="noopener noreferrer" class="source-title">{src.title || src.url}</a>
											<span class="source-url">{new URL(src.url).hostname}</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/if}

					<!-- Methodology -->
					<div class="verification-methodology">
						<p>Recherche automatisée par Mistral + Tavily. Chaque affirmation est vérifiée contre {sources.length || '30+'} sources web. Les marques [N] renvoient aux sources correspondantes.</p>
					</div>
				</div>
			</section>
		{:else if data.cityData._verification?.status === 'baseline' && data.cityData._sources?.length}
			{@const sources = data.cityData._sources}
			<section class="verification-section">
				<div class="verification-content">
					<div class="verification-header">
						<h3 class="verification-title">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
							Sources de référence
						</h3>
					</div>

					<div id="sources-list" class="sources-list" style="margin-top: 0.5rem;">
						{#each sources as src, i}
							<div id="source-{i + 1}" class="source-item">
								<span class="source-num">[{i + 1}]</span>
								<div class="source-info">
									<a href={src.url} target="_blank" rel="noopener noreferrer" class="source-title">{src.title || src.url}</a>
									<span class="source-url">{new URL(src.url).hostname}</span>
								</div>
							</div>
						{/each}
					</div>

					<div class="verification-methodology">
						<p>Recherche automatisée par Mistral + Tavily. Sources de référence : Wikipedia, INSEE, archives électorales. Vérification complète non effectuée pour cette ville.</p>
					</div>
				</div>
			</section>
		{/if}

		<!-- Cross-links for civic education -->
		<nav class="civic-nav" aria-label="En savoir plus sur la politique municipale">
			<div class="civic-nav-grid">
				<a href="/gouvernance" class="civic-nav-link">
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
					</svg>
					<span class="civic-nav-text">
						<strong>Gouvernance municipale</strong>
						<small>Comment fonctionne une mairie ?</small>
					</span>
				</a>
				<a href="/devenir-maire" class="civic-nav-link">
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
					<span class="civic-nav-text">
						<strong>Devenir maire</strong>
						<small>Pouvoirs, indemnités, quotidien</small>
					</span>
				</a>
				<a href="/couverture" class="civic-nav-link">
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
					<span class="civic-nav-text">
						<strong>Couverture</strong>
						<small>Villes et statistiques</small>
					</span>
				</a>
			</div>
		</nav>

		<!-- Nearby Cities -->
		{#if data.nearbyCities && data.nearbyCities.length > 0}
			<nav class="nearby-cities" aria-label="Autres villes de la région">
				<h3 class="nearby-title">Autres villes à découvrir</h3>
				<div class="nearby-grid">
					{#each data.nearbyCities as nearbyCity}
						<a href="/elections/{data.electionSlug}/{nearbyCity.slug}" class="nearby-link">
							<strong>{nearbyCity.name}</strong>
							<small>{nearbyCity.population?.toLocaleString('fr-FR')} hab. — {nearbyCity.listsCount} liste{nearbyCity.listsCount > 1 ? 's' : ''}</small>
						</a>
					{/each}
				</div>
			</nav>
		{/if}

		<!-- Carte link -->
		<div class="carte-link-banner">
			<a href="/carte">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
				</svg>
				Voir toutes les communes sur la carte interactive →
			</a>
		</div>

		<!-- Data Source Footer -->
		{#if data.cityData.lastUpdated}
			<footer class="data-footer">
				<div class="footer-content">
					<p class="last-updated">
						Dernière mise à jour : {formatDate(data.cityData.lastUpdated)}
					</p>
				</div>
			</footer>
		{/if}
	</div>

	<!-- Compare Bar -->
	<CompareBar />
	{/if}
{:else if data.queueStatus}
	<!-- Queued State -->
	<section class="queued-section">
		<div class="queued-content">
			<div class="queued-icon">
				{#if data.queueStatus.queueStatus === 'processing'}
					<svg class="animate-spin" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
				{:else}
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				{/if}
			</div>

			<h1 class="queued-title">
				{#if data.queueStatus.queueStatus === 'processing'}
					Recherche en cours...
				{:else}
					Recherche planifiée
				{/if}
			</h1>

			<p class="queued-city">
				<span class="city-label">Ville :</span>
				<span class="city-name">{decodeURIComponent(data.citySlug || '')}</span>
			</p>

			<p class="queued-message">
				{data.queueStatus.message}
			</p>

			{#if data.queueStatus.queueStatus === 'pending' && data.queueStatus.queuePosition}
				<div class="queue-position">
					<span class="position-number">{data.queueStatus.queuePosition}</span>
					<span class="position-label">
						{data.queueStatus.queuePosition === 1 ? 'Prochaine recherche' : 'Position dans la file'}
					</span>
				</div>
			{/if}

			<div class="queued-info">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>
					Les recherches sont effectuées automatiquement chaque nuit.
					Revenez demain pour découvrir les candidats de cette ville.
				</span>
			</div>

			<div class="queued-actions">
				<a href="/elections/{data.electionSlug}" class="btn btn-secondary">
					← Voir d'autres villes
				</a>
				<button class="btn btn-primary" onclick={() => location.reload()}>
					Actualiser
				</button>
			</div>
		</div>
	</section>

{:else}
	<!-- Error State - City Not Found -->
	<section class="error-section">
		<div class="error-content">
			<div class="error-icon">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<h1>Ville non disponible</h1>
			<p class="error-message">
				Les données pour <strong>{decodeURIComponent(data.citySlug || '')}</strong> ne sont pas encore disponibles.
			</p>

			<div class="request-section">
				<CityRequestGitHub
					initialCityName={decodeURIComponent(data.citySlug || '').replace(/-/g, ' ')}
				/>
			</div>

			<div class="back-link">
				<a href="/elections/{data.electionSlug}">
					← Voir toutes les villes disponibles
				</a>
			</div>
		</div>
	</section>
{/if}

<style>
	/* ===== 2020 Results Page ===== */
	.past-results-page {
		min-height: 100vh;
		background: var(--color-cream);
	}

	.past-hero {
		background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
		padding: 0.75rem 0;
	}

	@media (min-width: 640px) {
		.past-hero { padding: 1.25rem 0; }
	}

	.past-hero .hero-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	@media (min-width: 768px) {
		.past-hero .hero-content { padding: 0 1.5rem; }
	}

	.past-hero-top {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.25rem;
	}

	.back-link-past {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.back-link-past:hover {
		color: var(--color-gold);
	}

	.past-badge {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		background: rgba(255, 255, 255, 0.15);
		border-radius: var(--radius-full);
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #faf8f5;
	}

	.past-city-name {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 700;
		color: #faf8f5;
		margin: 0;
	}

	@media (min-width: 640px) {
		.past-city-name { font-size: 2.25rem; }
	}

	.past-section {
		padding: 1.5rem 0;
		border-bottom: 1px solid var(--color-card-border);
	}

	.past-section-title {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 1rem;
	}

	/* Winner card */
	.past-winner-card {
		background: var(--color-success);
		color: white;
		border-radius: var(--radius-md);
		padding: 0.75rem 1.25rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.past-winner-main {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		min-width: 0;
	}

	.past-winner-label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.8;
		padding: 0.1rem 0.4rem;
		background: rgba(255, 255, 255, 0.2);
		border-radius: var(--radius-sm);
	}

	.past-winner-name {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0;
		white-space: nowrap;
	}

	.past-winner-party {
		font-size: 0.8rem;
		opacity: 0.85;
	}

	.past-winner-stats {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.past-winner-score {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 700;
	}

	.past-winner-seats {
		font-size: 0.85rem;
		opacity: 0.85;
	}

	.mayor-change-card {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		padding: 0.75rem 1rem;
		background: linear-gradient(135deg, rgba(201, 169, 98, 0.1), rgba(201, 169, 98, 0.05));
		border-left: 3px solid var(--color-gold);
		border-radius: var(--radius-md);
	}

	.mayor-change-icon {
		color: var(--color-gold);
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	.mayor-change-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 0.25rem;
	}

	.mayor-change-text {
		font-size: 0.8rem;
		color: var(--color-text-light);
		margin: 0;
		line-height: 1.4;
	}

	.mayor-change-badge {
		font-size: 0.65rem;
		color: var(--color-gold);
		background: rgba(201, 169, 98, 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: var(--radius-sm);
		margin-top: 0.25rem;
		line-height: 1.3;
	}

	/* Hemicycle */
	.hemicycle-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-card-border);
	}

	.hemicycle-svg {
		width: 100%;
		max-width: 380px;
		height: auto;
	}

	.hemicycle-svg circle.has-tooltip {
		cursor: pointer;
		pointer-events: all;
	}

	.hemicycle-svg circle.has-tooltip:hover {
		stroke: white;
		stroke-width: 1.5;
		filter: brightness(1.2);
	}

	.hemicycle-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		justify-content: center;
	}

	.hemicycle-legend-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: var(--color-text);
		font-weight: 500;
	}

	.hemicycle-legend-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	/* Council members list */
	.council-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.15rem 1rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.council-member {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.5rem;
		font-size: 0.8rem;
		border-radius: 4px;
		transition: background 0.1s;
	}

	.council-member:hover {
		background: rgba(201, 169, 98, 0.06);
	}

	.council-member.is-2026 {
		background: rgba(201, 169, 98, 0.08);
	}

	.council-idx {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		min-width: 1.4rem;
		text-align: right;
	}

	.council-name {
		flex: 1;
		color: var(--color-text);
	}

	.council-gender {
		font-size: 0.65rem;
		color: var(--color-text-muted);
	}

	/* Turnout */
	.past-turnout-grid {
		display: grid;
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.past-turnout-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.past-turnout-card {
		padding: 1.25rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-card-border);
	}

	.past-turnout-card.highlighted {
		background: var(--color-navy);
		border-color: var(--color-foreground);
	}

	.past-turnout-card.highlighted .past-round-label,
	.past-turnout-card.highlighted .past-turnout-label {
		color: rgba(255, 255, 255, 0.7);
	}

	.past-turnout-card.highlighted .past-turnout-value,
	.past-turnout-card.highlighted .past-turnout-value-sm {
		color: var(--color-gold);
	}

	.past-round-label {
		display: block;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
	}

	.past-turnout-row {
		display: flex;
		gap: 2rem;
	}

	.past-turnout-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.past-turnout-value {
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.past-turnout-value-sm {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.past-turnout-label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	/* 2020 Head Candidate Cards */
	.past-heads-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.75rem;
	}

	.past-head-card {
		background: var(--color-card-bg);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-lg);
		padding: 1rem;
		transition: border-color 0.15s;
	}

	.past-head-card:hover {
		border-color: var(--color-gold-light);
	}

	.past-head-card.winner {
		border-color: var(--color-success);
		background: rgba(74, 157, 110, 0.04);
	}

	.past-head-top {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.past-head-avatar {
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
		color: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.85rem;
		font-weight: 700;
	}

	.past-head-avatar.is-winner {
		background: linear-gradient(135deg, var(--color-success) 0%, #3a7d58 100%);
		color: white;
	}

	.past-head-info {
		flex: 1;
		min-width: 0;
	}

	.past-head-name {
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0;
		line-height: 1.3;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.past-head-party {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-light);
		margin-top: 0.125rem;
	}

	.past-head-list-name {
		display: block;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		margin-top: 0.125rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.past-head-rank {
		font-family: var(--font-display);
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.past-head-card.winner .past-head-rank {
		color: var(--color-success);
	}

	.past-head-scores {
		display: flex;
		gap: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-card-border);
	}

	.past-head-score {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		flex: 1;
		text-align: center;
	}

	.past-head-score-value {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.past-head-score.highlighted .past-head-score-value {
		color: var(--color-gold);
	}

	.past-head-score.seats .past-head-score-value {
		color: var(--color-gold);
	}

	.past-head-score-label {
		font-size: 0.6rem;
		text-transform: uppercase;
		color: var(--color-text-muted);
		font-weight: 600;
	}

	/* Running again badge */
	.running-again-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.1rem 0.4rem;
		font-size: 0.6rem;
		font-weight: 700;
		background: var(--color-gold);
		color: var(--color-foreground);
		border-radius: var(--radius-full);
		letter-spacing: 0.03em;
	}

	.running-again-note {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-top: 0.625rem;
		padding: 0.375rem 0.625rem;
		background: rgba(201, 169, 98, 0.1);
		border-radius: var(--radius-sm);
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--color-gold);
	}

	.running-again-note svg {
		flex-shrink: 0;
	}

	/* No data */
	.past-no-data {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--color-text-light);
	}

	/* CTA */
	.past-cta {
		background: linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-light) 100%);
		padding: 2.5rem 0;
	}

	.past-cta-content {
		max-width: 600px;
		margin: 0 auto;
		text-align: center;
		padding: 0 1rem;
	}

	.past-cta-content h2 {
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.5rem;
	}

	.past-cta-content p {
		font-size: 1rem;
		color: var(--color-foreground);
		opacity: 0.8;
		margin: 0 0 1.5rem;
	}

	.past-cta-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.75rem;
		background: var(--color-navy);
		color: #faf8f5;
		border-radius: var(--radius-md);
		font-weight: 600;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.past-cta-btn:hover {
		background: var(--color-navy-light);
		transform: translateY(-2px);
	}

	@media (max-width: 639px) {
		.past-heads-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Page Layout */
	.city-page {
		min-height: 100vh;
		background: var(--color-cream);
	}

	/* Results Banner */
	.results-banner {
		background: var(--color-card-bg);
		border-bottom: 3px solid var(--color-gold);
		padding: 1.5rem 0;
	}

	.results-inner {
		max-width: 900px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.results-status-badge {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.results-status-badge.round1 {
		background: rgba(201, 169, 98, 0.15);
		color: var(--color-gold);
	}

	.results-status-badge.between {
		background: rgba(224, 122, 95, 0.15);
		color: var(--color-coral);
	}

	.results-status-badge.final {
		background: rgba(74, 157, 110, 0.12);
		color: var(--color-success);
	}

	.results-winner {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		padding: 1rem;
		background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
		border-radius: var(--radius-lg);
		margin-bottom: 1.5rem;
	}

	.results-winner-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-gold);
		font-weight: 600;
		width: 100%;
	}

	.results-winner-name {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		color: #faf8f5;
	}

	.results-winner-party, .results-winner-seats {
		font-size: 0.9rem;
		color: var(--color-text-light);
	}

	.results-round {
		margin-bottom: 1.5rem;
	}

	.results-round-title {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.5rem;
	}

	.results-turnout {
		display: flex;
		gap: 1rem;
		font-size: 0.85rem;
		color: var(--color-text);
		margin-bottom: 0.75rem;
	}

	.results-registered {
		color: var(--color-text-light);
	}

	.results-lists {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.results-list-row {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 0.5rem;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: var(--color-cream);
		border-radius: 6px;
		position: relative;
		overflow: hidden;
		font-size: 0.85rem;
	}

	.results-list-bar {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background: rgba(201, 169, 98, 0.1);
		border-radius: 6px;
		z-index: 0;
	}

	.results-list-name {
		position: relative;
		z-index: 1;
		font-weight: 500;
		color: var(--color-foreground);
	}

	.results-list-party {
		font-weight: 400;
		color: var(--color-text-light);
		font-size: 0.8rem;
	}

	.results-list-score {
		position: relative;
		z-index: 1;
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--color-foreground);
	}

	.results-list-votes {
		position: relative;
		z-index: 1;
		color: var(--color-text-light);
		font-size: 0.8rem;
	}

	.results-qualified {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-success);
		text-transform: uppercase;
	}

	.results-withdrawn {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-coral);
		text-transform: uppercase;
	}

	.results-seats {
		font-size: 0.75rem;
		color: var(--color-text-light);
	}

	.results-alliances {
		margin-bottom: 1.5rem;
	}

	.results-alliance-row {
		padding: 0.5rem 0.75rem;
		background: var(--color-cream);
		border-radius: 6px;
		margin-bottom: 0.5rem;
		font-size: 0.85rem;
	}

	.results-alliance-row strong {
		color: var(--color-foreground);
	}

	.results-alliance-row span {
		color: var(--color-text);
		display: block;
		margin-top: 0.25rem;
	}

	@media (max-width: 768px) {
		.results-list-row {
			grid-template-columns: 1fr auto;
		}
		.results-list-votes {
			display: none;
		}
	}

	/* Hero - Compact */
	.city-hero {
		background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
		padding: 0.75rem 0;
		transition: padding-top 0.35s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@media (min-width: 640px) {
		.city-hero { padding: 1.25rem 0; }
	}

	.city-hero.has-compare-bar {
		padding-top: calc(0.75rem + 52px);
	}

	@media (min-width: 640px) {
		.city-hero.has-compare-bar { padding-top: calc(1.25rem + 52px); }
	}

	.hero-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	@media (min-width: 640px) {
		.hero-content { gap: 1rem; }
	}

	@media (min-width: 768px) {
		.hero-content {
			padding: 0 1.5rem;
		}
	}

	.hero-main {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	@media (min-width: 640px) {
		.hero-main { gap: 0.5rem; }
	}

	.city-name {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 700;
		color: #faf8f5;
		margin: 0;
	}

	@media (min-width: 640px) {
		.city-name {
			font-size: 2.25rem;
		}
	}

	.city-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	@media (min-width: 640px) {
		.city-stats { gap: 0.5rem; }
	}

	.stat-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: rgba(255, 255, 255, 0.12);
		border-radius: var(--radius-full);
		font-size: 0.72rem;
		color: #faf8f5;
	}

	@media (min-width: 640px) {
		.stat-pill {
			gap: 0.375rem;
			padding: 0.375rem 0.75rem;
			font-size: 0.8rem;
		}
	}

	.incumbent-pill {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.75rem;
		background: var(--color-gold);
		border-radius: var(--radius-md);
		font-size: 0.75rem;
	}

	@media (min-width: 640px) {
		.incumbent-pill {
			gap: 0.5rem;
			padding: 0.625rem 1rem;
			font-size: 0.85rem;
		}
	}

	.incumbent-label {
		color: var(--color-foreground);
		opacity: 0.7;
	}

	.incumbent-name {
		font-weight: 600;
		color: var(--color-foreground);
	}

	.incumbent-party {
		color: var(--color-foreground);
		opacity: 0.7;
	}

	.stat-pill-link {
		text-decoration: none;
		cursor: pointer;
		transition: border-color 0.15s;
	}

	.stat-pill-link:hover {
		border-color: var(--color-gold);
		color: var(--color-gold);
	}

	.incumbent-pill-link {
		text-decoration: none;
		cursor: pointer;
		transition: border-color 0.15s;
	}

	.incumbent-pill-link:hover {
		border-color: var(--color-gold);
	}

	/* Participation Strip */
	.participation-strip {
		background: var(--color-navy);
		padding: 0.5rem 1rem;
	}

	.participation-strip-inner {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.participation-strip-bar {
		width: 80px;
		height: 6px;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 3px;
		overflow: hidden;
		flex-shrink: 0;
	}

	.participation-strip-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-gold) 0%, var(--color-coral) 100%);
		border-radius: 3px;
	}

	.participation-strip-stat {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-gold);
	}

	.participation-strip-cta {
		font-size: 0.75rem;
		color: rgba(250, 248, 245, 0.6);
		margin-left: auto;
	}

	@media (max-width: 480px) {
		.participation-strip-cta {
			display: none;
		}
	}

	/* City Brief Section */
	.city-brief {
		background: var(--color-card-bg);
		border-bottom: 1px solid var(--color-card-border);
	}

	.brief-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0.6rem 1rem;
	}

	@media (min-width: 640px) {
		.brief-content { padding: 1rem 1rem; }
	}

	@media (min-width: 768px) {
		.brief-content {
			padding: 1rem 1.5rem;
		}
	}

	.brief-text {
		font-size: 0.82rem;
		color: var(--color-text);
		line-height: 1.45;
		margin: 0 0 0.5rem;
	}

	@media (min-width: 640px) {
		.brief-text {
			font-size: 0.95rem;
			line-height: 1.5;
			margin: 0 0 0.75rem;
		}
	}

	.brief-themes {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-bottom: 0.5rem;
	}

	@media (min-width: 640px) {
		.brief-themes {
			gap: 0.375rem;
			margin-bottom: 0.75rem;
		}
	}

	.mini-tag {
		display: inline-flex;
		padding: 0.2rem 0.5rem;
		background: var(--color-gold-light);
		border-radius: var(--radius-full);
		font-size: 0.68rem;
		font-weight: 500;
		color: var(--color-foreground);
	}

	@media (min-width: 640px) {
		.mini-tag {
			padding: 0.25rem 0.625rem;
			font-size: 0.75rem;
		}
	}

	.details-toggle {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0;
		background: none;
		border: none;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-gold);
		cursor: pointer;
		transition: color 0.15s;
	}

	.details-toggle:hover {
		color: var(--color-coral);
	}

	.toggle-icon {
		width: 16px;
		height: 16px;
		transition: transform 0.2s ease;
	}

	.toggle-icon.rotated {
		transform: rotate(180deg);
	}

	.city-details {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-card-border);
		animation: slideDown 0.25s ease;
	}

	.detail-block {
		margin-bottom: 1rem;
	}

	.detail-block:last-child {
		margin-bottom: 0;
	}

	.detail-block h4 {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin: 0 0 0.375rem;
	}

	.detail-block p {
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.5;
		margin: 0;
	}

	.detail-block ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.detail-block li {
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.5;
		padding-left: 1rem;
		position: relative;
		margin-bottom: 0.25rem;
	}

	.detail-block li::before {
		content: '•';
		position: absolute;
		left: 0;
		color: var(--color-gold);
	}

	/* Main Grid */
	.city-main {
		padding: 1.5rem 0 2rem;
	}

	.main-grid {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
		display: grid;
		gap: 1.5rem;
	}

	@media (min-width: 768px) {
		.main-grid {
			padding: 0 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.main-grid {
			grid-template-columns: 1fr 340px;
			gap: 2rem;
		}
	}

	/* Main Column */
	.main-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		min-width: 0;
	}

	@media (max-width: 1023px) {
		.main-column {
			max-width: 900px;
			margin: 0 auto;
			width: 100%;
		}
	}

	/* Sidebar Column */
	.sidebar-column {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	@media (max-width: 1023px) {
		.sidebar-column {
			max-width: 900px;
			margin: 0 auto;
			width: 100%;
		}
	}

	.grid-context {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		grid-column: 1 / -1;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
		padding: 0 1rem;
	}

	@media (min-width: 768px) {
		.grid-context {
			padding: 0 1.5rem;
		}
	}

	.context-card {
		background: var(--color-card-bg);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-md, 0.75rem);
		overflow: hidden;
	}

	.context-card.compact {
		padding: 1rem 1.25rem;
	}

	/* Desktop/Mobile visibility */
	.desktop-only {
		display: none;
	}

	.mobile-disclaimer {
		padding: 0 1rem;
	}

	@media (max-width: 1023px) {
		.mobile-disclaimer {
			max-width: 900px;
			margin: 0 auto;
			width: 100%;
		}
	}

	@media (min-width: 1024px) {
		.desktop-only {
			display: block;
		}
		.mobile-only {
			display: none;
		}
	}

	/* Section quick-nav */
	.section-nav {
		display: flex;
		gap: 0.5rem;
		padding: 0.6rem 1rem;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		background: var(--color-surface-glass);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--color-card-border);
		position: sticky;
		top: 44px;
		z-index: 40;
	}

	.section-nav.has-compare-bar {
		top: 88px;
	}

	.section-nav::-webkit-scrollbar { display: none; }

	@media (min-width: 768px) {
		.section-nav {
			justify-content: center;
			gap: 0.6rem;
			padding: 0.6rem 1.5rem;
			top: 52px;
		}
		.section-nav.has-compare-bar {
			top: 104px;
		}
	}

	.section-nav-btn {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text);
		background: var(--color-card-bg);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-full);
		white-space: nowrap;
		text-decoration: none;
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	.section-nav-btn:hover, .section-nav-btn:active {
		border-color: var(--color-gold);
		color: var(--color-gold);
		background: var(--color-cream);
	}

	.section-nav-btn svg {
		color: var(--color-gold);
	}

	/* Candidates Section */
	.candidates-section {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
	}

	.section-header-static {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-card-border);
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0;
	}

	.section-title svg {
		color: var(--color-gold);
	}

	.count-badge {
		font-size: 0.75rem;
		font-weight: 700;
		background: var(--color-gold);
		color: var(--color-foreground);
		padding: 0.25rem 0.625rem;
		border-radius: var(--radius-full);
	}

	.count-badge.small {
		font-size: 0.7rem;
		padding: 0.125rem 0.5rem;
	}

	.candidates-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
		padding: 0.75rem;
		justify-items: center;
		max-width: 500px;
		margin: 0 auto;
	}

	/* 2 columns on tablets */
	@media (min-width: 640px) {
		.candidates-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem;
			padding: 1rem;
			max-width: 800px;
		}
	}

	/* Still 2 columns, wider max */
	@media (min-width: 1024px) {
		.candidates-grid {
			gap: 1.25rem;
			padding: 1.25rem;
			max-width: 860px;
		}
	}

	/* 3 columns only on very wide screens */
	@media (min-width: 1400px) {
		.candidates-grid {
			grid-template-columns: repeat(3, 1fr);
			max-width: 1200px;
		}
	}

	.candidates-grid.few-candidates {
		justify-content: center;
	}

	@media (min-width: 640px) {
		.candidates-grid.few-candidates {
			grid-template-columns: repeat(auto-fill, minmax(300px, 380px));
		}
	}

	.candidates-hint {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--color-cream);
		border-top: 1px solid var(--color-card-border);
		font-size: 0.8rem;
		color: var(--color-text-light);
		margin: 0;
	}

	/* No candidates empty state */
	.no-candidates-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 2.5rem 1.5rem;
	}

	.no-candidates-icon {
		color: var(--color-text-light);
		opacity: 0.5;
		margin-bottom: 1rem;
	}

	.no-candidates-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0 0 0.5rem;
	}

	.no-candidates-text {
		font-size: 0.9rem;
		color: var(--color-text-light);
		max-width: 450px;
		line-height: 1.5;
		margin-bottom: 1.5rem;
	}

	.interest-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--color-gold);
		color: var(--color-foreground);
		font-size: 0.95rem;
		font-weight: 600;
		border: none;
		border-radius: var(--radius-full);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.interest-btn:hover {
		background: var(--color-navy);
		color: #faf8f5;
		transform: translateY(-1px);
	}

	.interest-btn .interest-thanks {
		display: none;
	}

	:global(.interest-btn.interest-sent) .interest-default {
		display: none;
	}

	:global(.interest-btn.interest-sent) .interest-thanks {
		display: inline;
	}

	:global(.interest-btn.interest-sent) {
		background: var(--color-success);
		color: #faf8f5;
		cursor: default;
	}

	.no-candidates-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.75rem;
		font-style: italic;
	}

	.official-interest-cta {
		text-align: center;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-card-border);
	}

	.official-interest-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.75rem;
		font-style: italic;
	}

	/* City profile (Wikipedia data for no-candidate cities) */
	.city-profile-section {
		border-top: 1px solid var(--color-card-border);
		padding: 1.25rem 1.5rem;
	}

	.profile-section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0 0 1rem;
	}

	.profile-section-title svg {
		color: var(--color-gold);
	}

	.profile-block {
		margin-bottom: 1rem;
	}

	.profile-block:last-child {
		margin-bottom: 0;
	}

	.profile-block h3 {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 0.375rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.profile-block p {
		font-size: 0.85rem;
		color: var(--color-text-light);
		line-height: 1.5;
		margin: 0;
	}

	.profile-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.profile-list li {
		position: relative;
		padding-left: 1rem;
		font-size: 0.85rem;
		color: var(--color-text-light);
		line-height: 1.5;
		margin-bottom: 0.25rem;
	}

	.profile-list li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.5em;
		width: 6px;
		height: 6px;
		background: var(--color-gold);
		border-radius: 50%;
	}

	.candidates-hint svg {
		color: var(--color-gold);
	}

	.candidates-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	/* Compare all button */
	.compare-all-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.5rem 1rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-gold);
		background: transparent;
		border: 1px solid var(--color-gold);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: 0.5rem;
	}

	.compare-all-btn:hover:not(:disabled) {
		background: var(--color-gold);
		color: var(--color-navy);
	}

	.compare-all-btn.done {
		color: var(--color-success);
		border-color: var(--color-success);
		cursor: default;
		opacity: 0.8;
	}

	/* Program Comparison Section */
	.program-compare-section {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	@media (min-width: 768px) {
		.program-compare-section {
			padding: 0 1.5rem;
		}
	}

	.program-compare-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.program-compare-card {
		background: var(--color-card-bg);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.program-compare-card:hover {
		box-shadow: var(--shadow-card);
	}

	.program-compare-card.selected {
		border-color: var(--color-gold);
		box-shadow: 0 0 0 1px var(--color-gold), var(--shadow-card);
	}

	.program-card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-card-border);
	}

	.program-card-avatar {
		width: 40px;
		height: 40px;
		border-radius: var(--radius-sm);
		object-fit: cover;
		flex-shrink: 0;
	}

	.program-card-avatar-placeholder {
		width: 40px;
		height: 40px;
		border-radius: var(--radius-sm);
		background: var(--color-navy);
		color: #faf8f5;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.program-card-name {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-foreground);
		line-height: 1.2;
	}

	.program-card-party {
		font-size: 0.75rem;
		color: var(--color-text-light);
		display: block;
		margin-top: 0.125rem;
	}

	.program-card-list {
		list-style: none;
		padding: 0;
		margin: 0 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.program-card-list li {
		font-size: 0.8rem;
		color: var(--color-text);
		line-height: 1.4;
		padding-left: 1rem;
		position: relative;
	}

	.program-card-list li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.5em;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-gold);
	}

	.program-card-empty {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-style: italic;
		margin-bottom: auto;
	}

	.program-card-link {
		display: block;
		margin-top: 0.75rem;
		padding: 0.5rem;
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-gold);
		border: 1px solid var(--color-gold);
		border-radius: var(--radius-md);
		transition: all 0.2s ease;
	}

	.program-card-link:hover {
		background: var(--color-gold);
		color: var(--color-foreground);
	}

	.program-card-select {
		margin-top: 0.5rem;
		padding: 0.625rem;
		text-align: center;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-light);
		background: var(--color-cream);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 40px;
	}

	.program-card-select:hover {
		background: var(--color-navy);
		color: #faf8f5;
	}

	.program-card-select.active {
		background: var(--color-gold);
		color: var(--color-foreground);
	}

	/* Section Card (main column) */
	.section-card {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
	}

	.section-body {
		padding: 1.25rem;
	}

	/* Incumbent Section (desktop) */
	.incumbent-section .section-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.incumbent-assessment {
		margin-top: 1.5rem;
		padding: 1.25rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.assessment-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0;
	}

	.assessment-title svg {
		flex-shrink: 0;
		color: var(--color-gold);
	}

	.assessment-row {
		padding: 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
	}

	.assessment-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		margin-bottom: 0.5rem;
	}

	.assessment-label.success {
		color: var(--color-success);
	}

	.assessment-label.success .dot {
		background: var(--color-success);
	}

	.assessment-label.warning {
		color: var(--color-coral);
	}

	.assessment-label.warning .dot {
		background: var(--color-coral);
	}

	.assessment-label .dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.assessment-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.assessment-list li {
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.5;
		padding-left: 1rem;
		position: relative;
		margin-bottom: 0.375rem;
	}

	.assessment-list li::before {
		content: '→';
		position: absolute;
		left: 0;
		color: var(--color-gold);
	}

	.assessment-list li:last-child {
		margin-bottom: 0;
	}

	.perception-text {
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.5;
		margin: 0;
		padding: 0.75rem;
		background: var(--color-navy);
		color: #faf8f5;
		border-radius: var(--radius-md);
	}

	.perception-text strong {
		color: var(--color-gold);
	}

	/* Sidebar Cards */
	.sidebar-card {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
	}

	.sidebar-card.compact {
		padding: 1rem;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.875rem 1rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s ease;
	}

	.sidebar-header:hover {
		background: var(--color-cream);
	}

	.sidebar-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0;
	}

	.sidebar-title svg {
		color: var(--color-gold);
	}

	.sidebar-title-static {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin: 0 0 0.75rem;
	}

	.sidebar-title-static svg {
		color: var(--color-gold);
	}

	.sidebar-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.expand-icon {
		color: var(--color-text-muted);
		transition: transform 0.2s ease;
	}

	.expand-icon.expanded {
		transform: rotate(180deg);
		color: var(--color-gold);
	}

	.sidebar-body {
		padding: 0 1rem 1rem;
		animation: slideDown 0.2s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* INSEE Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.stat-cell {
		padding: 0.5rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-foreground);
		font-family: var(--font-display);
	}

	.stat-label {
		display: block;
		font-size: 0.7rem;
		color: var(--color-text-light);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		margin-top: 0.1rem;
	}

	.stat-detail {
		font-size: 0.8rem;
		color: var(--color-text);
		line-height: 1.5;
		margin: 0 0 0.25rem;
	}

	.stat-source {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		margin: 0.5rem 0 0;
		font-style: italic;
	}

	/* Demographics Cards */
	.demo-card {
		background: var(--color-cream);
		border: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
		border-radius: 10px;
		padding: 10px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.debt-card {
		margin-bottom: 10px;
	}
	.debt-card.severity-low {
		border-left: 3px solid var(--color-success);
	}
	.debt-card.severity-moderate {
		border-left: 3px solid var(--color-gold);
	}
	.debt-card.severity-critical {
		border-left: 3px solid var(--color-coral);
	}
	.debt-card.severity-neutral {
		border-left: 3px solid var(--color-text-light);
	}

	.demo-card-top {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.demo-card-icon {
		color: var(--color-gold);
		display: flex;
		align-items: center;
	}
	.demo-card-title {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-text-light);
	}

	.demo-card-value {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}
	.demo-big-number {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1;
		color: var(--color-foreground);
	}
	.severity-low .demo-big-number { color: var(--color-success); }
	.severity-moderate .demo-big-number { color: color-mix(in srgb, var(--color-gold) 80%, #000); }
	.severity-critical .demo-big-number { color: var(--color-coral); }
	.demo-value-unit {
		font-size: 0.7rem;
		color: var(--color-text-light);
	}

	.demo-severity-bar {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.demo-severity-track {
		flex: 1;
		height: 3px;
		background: color-mix(in srgb, var(--color-text) 10%, transparent);
		border-radius: 2px;
		overflow: hidden;
	}
	.demo-severity-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.4s ease;
	}
	.severity-low .demo-severity-fill { background: var(--color-success); }
	.severity-moderate .demo-severity-fill { background: var(--color-gold); }
	.severity-critical .demo-severity-fill { background: var(--color-coral); }

	.demo-severity-label {
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}
	.severity-low .demo-severity-label { color: var(--color-success); }
	.severity-moderate .demo-severity-label { color: color-mix(in srgb, var(--color-gold) 80%, #000); }
	.severity-critical .demo-severity-label { color: var(--color-coral); }

	.demo-card-desc {
		font-size: 0.65rem;
		color: var(--color-text-light);
		line-height: 1.3;
		margin: 0;
	}

	.demo-cards-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 10px;
	}
	@media (max-width: 360px) {
		.demo-cards-grid {
			grid-template-columns: 1fr;
		}
	}

	.demo-details-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 6px 0;
		background: none;
		border: none;
		border-top: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
		cursor: pointer;
		font-size: 0.75rem;
		color: var(--color-text-light);
		font-weight: 500;
	}
	.demo-details-toggle:hover {
		color: var(--color-text);
	}

	.demo-details-body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-bottom: 4px;
	}
	.demo-detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px 0;
		border-bottom: 1px solid color-mix(in srgb, var(--color-text) 5%, transparent);
	}
	.demo-detail-row:last-child {
		border-bottom: none;
	}
	.demo-detail-label {
		font-size: 0.72rem;
		color: var(--color-text-light);
	}
	.demo-detail-value {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	/* Issues Compact */
	.issue-compact {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-card-border);
	}

	.issue-compact:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.issue-rank {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		background: var(--color-gold);
		color: var(--color-foreground);
		font-size: 0.75rem;
		font-weight: 700;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.issue-info {
		flex: 1;
		min-width: 0;
	}

	.issue-info strong {
		display: block;
		font-size: 0.875rem;
		color: var(--color-foreground);
		margin-bottom: 0.25rem;
	}

	.issue-info p {
		font-size: 0.8rem;
		color: var(--color-text-light);
		line-height: 1.4;
		margin: 0;
	}

	/* Dynamics Content */
	.dynamics-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.dynamics-content p {
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.5;
		margin: 0;
	}

	.alliances-mini {
		padding: 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
	}

	.alliances-mini strong {
		display: block;
		color: var(--color-foreground);
		margin-bottom: 0.375rem;
	}

	.alliances-mini ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.alliances-mini li {
		color: var(--color-text);
		padding-left: 1rem;
		position: relative;
		margin-bottom: 0.25rem;
	}

	.alliances-mini li::before {
		content: '•';
		position: absolute;
		left: 0;
		color: var(--color-gold);
	}

	.reelection-mini {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--color-navy);
		border-radius: var(--radius-sm);
		color: #faf8f5;
	}

	.status-badge {
		font-size: 0.85rem;
		font-weight: 500;
	}

	/* Expectations */
	.expectations-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.expectations-list li {
		font-size: 0.85rem;
		color: var(--color-text);
		line-height: 1.4;
		padding: 0.5rem 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius-sm);
		margin-bottom: 0.375rem;
	}

	.expectations-list li:last-child {
		margin-bottom: 0;
	}

	/* Mobile Assessment */
	.assessment-mini {
		padding: 0.75rem;
		border-radius: var(--radius-sm);
		margin-bottom: 0.75rem;
	}

	.assessment-mini:last-child {
		margin-bottom: 0;
	}

	.assessment-mini.success {
		background: rgba(74, 157, 110, 0.1);
		border-left: 3px solid var(--color-success);
	}

	.assessment-mini.warning {
		background: rgba(224, 122, 95, 0.1);
		border-left: 3px solid var(--color-coral);
	}

	.assessment-mini strong {
		display: block;
		font-size: 0.75rem;
		text-transform: uppercase;
		margin-bottom: 0.375rem;
	}

	.assessment-mini.success strong {
		color: var(--color-success);
	}

	.assessment-mini.warning strong {
		color: var(--color-coral);
	}

	.assessment-mini ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.assessment-mini li {
		font-size: 0.825rem;
		color: var(--color-text);
		line-height: 1.4;
		margin-bottom: 0.25rem;
	}

	/* Queued Section */
	.queued-section {
		min-height: 70vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(180deg, var(--color-cream) 0%, var(--color-cream-dark) 100%);
	}

	.queued-content {
		text-align: center;
		max-width: 480px;
		background: var(--color-card-bg);
		padding: 2.5rem 2rem;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.queued-icon {
		margin-bottom: 1.5rem;
		color: var(--color-gold);
	}

	.queued-icon .animate-spin {
		animation: spin 2s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.queued-title {
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.75rem;
	}

	.queued-city {
		font-size: 1rem;
		margin: 0 0 1rem;
	}

	.queued-city .city-label {
		color: var(--color-text-muted);
	}

	.queued-city .city-name {
		font-weight: 600;
		color: var(--color-foreground);
		text-transform: capitalize;
	}

	.queued-message {
		font-size: 0.95rem;
		color: var(--color-text);
		margin: 0 0 1.5rem;
		padding: 0.75rem 1rem;
		background: var(--color-gold-light);
		border-radius: var(--radius-md);
	}

	.queue-position {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 1.5rem;
	}

	.queue-position .position-number {
		font-family: var(--font-display);
		font-size: 3rem;
		font-weight: 700;
		color: var(--color-gold);
		line-height: 1;
	}

	.queue-position .position-label {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.queued-info {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		margin-bottom: 1.5rem;
		text-align: left;
	}

	.queued-info svg {
		flex-shrink: 0;
		color: var(--color-text-muted);
		margin-top: 0.1rem;
	}

	.queued-info span {
		font-size: 0.85rem;
		color: var(--color-text);
		line-height: 1.5;
	}

	.queued-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	@media (min-width: 480px) {
		.queued-actions {
			flex-direction: row;
			justify-content: center;
		}
	}

	.queued-actions .btn {
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-md);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.queued-actions .btn-primary {
		background: var(--color-gold);
		color: var(--color-foreground);
		border: none;
	}

	.queued-actions .btn-primary:hover {
		background: var(--color-gold-light);
	}

	.queued-actions .btn-secondary {
		background: transparent;
		color: var(--color-foreground);
		border: 1px solid var(--color-card-border);
	}

	.queued-actions .btn-secondary:hover {
		background: var(--color-cream);
	}

	/* Error Section */
	.error-section {
		min-height: 70vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(180deg, var(--color-cream) 0%, var(--color-cream-dark) 100%);
	}

	.error-content {
		text-align: center;
		max-width: 520px;
		width: 100%;
	}

	.error-icon {
		color: var(--color-gold);
		margin-bottom: 1.5rem;
	}

	.error-content h1 {
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.75rem;
	}

	.error-content .error-message {
		font-size: 1rem;
		color: var(--color-text);
		margin: 0 0 2rem;
		line-height: 1.5;
	}

	.error-content .error-message strong {
		color: var(--color-foreground);
		text-transform: capitalize;
	}

	.request-section {
		margin-bottom: 1.5rem;
	}

	.back-link {
		margin-top: 1rem;
	}

	.back-link a {
		font-size: 0.9rem;
		color: var(--color-gold);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.back-link a:hover {
		color: var(--color-coral);
	}

	.carte-link-banner {
		margin: 1.5rem 0;
		text-align: center;
	}

	.carte-link-banner a {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-gold);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.carte-link-banner a:hover {
		color: var(--color-coral);
	}

	/* Civic Navigation */
	.civic-nav {
		margin: 3rem 0 0;
		padding: 2rem 1rem;
		background: var(--color-cream-dark);
	}

	.civic-nav-grid {
		max-width: 900px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	@media (min-width: 768px) {
		.civic-nav-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.civic-nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-card-border);
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.civic-nav-link:hover {
		border-color: var(--color-gold);
		box-shadow: 0 2px 8px rgba(201, 169, 98, 0.15);
	}

	.civic-nav-link svg {
		flex-shrink: 0;
		color: var(--color-gold);
	}

	.civic-nav-text {
		display: flex;
		flex-direction: column;
	}

	.civic-nav-text strong {
		font-size: 0.9rem;
		color: var(--color-foreground);
	}

	.civic-nav-text small {
		font-size: 0.75rem;
		color: var(--color-text-light);
	}

	/* Nearby Cities */
	.nearby-cities {
		margin: 2rem 0 0;
		padding: 1.5rem 1rem;
		background: var(--color-cream-dark);
	}

	.nearby-title {
		text-align: center;
		font-family: var(--font-heading);
		font-size: 1.1rem;
		color: var(--color-foreground);
		margin-bottom: 1rem;
	}

	.nearby-grid {
		max-width: 900px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	@media (min-width: 768px) {
		.nearby-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.nearby-link {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.75rem 1rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-card-border);
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.nearby-link:hover {
		border-color: var(--color-gold);
		box-shadow: 0 2px 8px rgba(201, 169, 98, 0.15);
	}

	.nearby-link strong {
		font-size: 0.85rem;
		color: var(--color-foreground);
	}

	.nearby-link small {
		font-size: 0.7rem;
		color: var(--color-text-light);
	}

	/* Data Footer */
	.data-footer {
		background: var(--color-navy);
		padding: 1rem 0;
		margin-top: 2rem;
	}

	.footer-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
		text-align: center;
	}

	@media (min-width: 768px) {
		.footer-content {
			flex-direction: row;
			justify-content: space-between;
			padding: 0 1.5rem;
			text-align: left;
		}
	}

	.last-updated {
		font-size: 0.75rem;
		color: #faf8f5;
		opacity: 0.5;
		margin: 0;
	}

	/* Bilan du maire sortant (standalone) */
	.bilan-section {
		background: var(--color-card-bg);
		border-top: 3px solid var(--color-gold);
		padding: 1.5rem 0;
		margin-top: 1rem;
	}

	.bilan-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	@media (min-width: 768px) {
		.bilan-content {
			padding: 0 1.5rem;
		}
	}

	.bilan-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 1rem;
	}

	.bilan-title svg {
		color: var(--color-gold);
		flex-shrink: 0;
	}

	.bilan-mayor-name {
		font-weight: 400;
		color: var(--color-text-light);
		font-size: 0.95rem;
	}

	.bilan-grid {
		display: grid;
		gap: 0.75rem;
	}

	@media (min-width: 640px) {
		.bilan-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Lists count link in comparison card */
	.lists-count-link {
		display: inline-flex;
		align-items: center;
		color: var(--color-gold);
		font-weight: 600;
		text-decoration: none;
		transition: color 0.15s;
	}

	.lists-count-link:hover {
		color: var(--color-coral);
	}

	/* Seats info in section titles */
	.seats-info {
		font-weight: 400;
		color: var(--color-text-light);
		font-size: 0.8rem;
	}

	.seats-hint {
		font-weight: 400;
		color: var(--color-text-muted);
		margin-left: 0.25rem;
	}

	/* Candidate order number */
	.candidate-order {
		font-size: 0.6rem;
		color: var(--color-text-muted);
		min-width: 1.2rem;
		text-align: right;
	}

	/* Elected threshold styling */
	.official-candidates-list li.is-elected {
		background: rgba(201, 169, 98, 0.08);
	}

	.elected-threshold-note {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0.5rem 0 0;
	}

	.profile-text {
		font-size: 0.85rem;
		color: var(--color-text-light);
		line-height: 1.5;
		margin: 0;
	}

	/* Comparison Section (2020 vs 2026) */
	.comparison-section {
		background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
		padding: 2rem 0;
		margin-top: 2rem;
	}

	.comparison-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	@media (min-width: 768px) {
		.comparison-content {
			padding: 0 1.5rem;
		}
	}

	.comparison-header {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	@media (min-width: 640px) {
		.comparison-header {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
	}

	.comparison-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		color: #faf8f5;
		margin: 0;
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.comparison-title:hover {
		color: var(--color-gold-light);
	}

	.comparison-title svg {
		color: var(--color-gold);
	}

	.comparison-grid {
		display: grid;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	@media (min-width: 640px) {
		.comparison-grid {
			grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		}
	}

	.comparison-card {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		position: relative;
		overflow: hidden;
	}

	.comparison-card-link {
		text-decoration: none;
		color: inherit;
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.comparison-card-link:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
	}

	.card-link-hint {
		display: block;
		margin-top: 0.75rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-gold);
	}

	.comparison-card.past {
		border-top: 4px solid var(--color-text-muted);
	}

	.comparison-card.current {
		border-top: 4px solid var(--color-gold);
	}

	.year-badge {
		position: absolute;
		top: 1rem;
		right: 1rem;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		opacity: 0.15;
	}

	.comparison-card.past .year-badge {
		color: var(--color-foreground);
	}

	.comparison-card.current .year-badge {
		color: var(--color-gold);
	}

	.result-title {
		font-family: var(--font-display);
		font-size: 0.85rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin: 0 0 1rem;
	}

	.winner-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 1rem;
	}

	.winner-name {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.winner-party {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.winner-score {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-success);
	}

	.turnout-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius-sm);
		margin-bottom: 0.75rem;
	}

	.turnout-label {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.turnout-value {
		font-weight: 600;
		color: var(--color-foreground);
	}

	.lists-count {
		font-size: 0.85rem;
		color: var(--color-text-light);
	}

	.incumbent-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 1rem;
	}

	.incumbent-info .incumbent-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.incumbent-info .incumbent-name {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.incumbent-info .incumbent-party {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.reelection-status {
		margin-bottom: 1rem;
	}

	.reelection-status .status {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: var(--radius-full);
		font-size: 0.85rem;
		font-weight: 500;
	}

	.reelection-status .status.running {
		background: rgba(74, 157, 110, 0.15);
		color: var(--color-success);
	}

	.reelection-status .status.not-running {
		background: rgba(224, 122, 95, 0.15);
		color: var(--color-coral);
	}

	.context-2020 {
		background: rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-md);
		padding: 1.25rem;
	}

	.context-2020 h4 {
		font-family: var(--font-display);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-gold);
		margin: 0 0 0.5rem;
	}

	.context-2020 p {
		font-size: 0.9rem;
		color: #faf8f5;
		line-height: 1.6;
		margin: 0;
		opacity: 0.9;
	}

	/* Inline citation marks */
	.cite-refs {
		font-size: 0.65rem;
		font-weight: 600;
		line-height: 1;
		margin-left: 1px;
		white-space: nowrap;
	}

	.cite-mark {
		position: relative;
		text-decoration: none;
		color: var(--color-gold);
		cursor: pointer;
	}

	.cite-mark:hover {
		color: var(--color-foreground);
		text-decoration: underline;
	}

	/* CSS tooltip via data-tooltip */
	.cite-mark[data-tooltip]:hover::after {
		content: attr(data-tooltip);
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.35rem 0.5rem;
		background: var(--color-navy);
		color: #faf8f5;
		font-size: 0.68rem;
		font-weight: 400;
		line-height: 1.3;
		border-radius: 4px;
		white-space: nowrap;
		max-width: 260px;
		overflow: hidden;
		text-overflow: ellipsis;
		z-index: 100;
		pointer-events: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	/* Tiny arrow under the tooltip */
	.cite-mark[data-tooltip]:hover::before {
		content: '';
		position: absolute;
		bottom: calc(100% - 4px);
		left: 50%;
		transform: translateX(-50%);
		border: 4px solid transparent;
		border-top-color: var(--color-foreground);
		z-index: 100;
		pointer-events: none;
	}

	.cite-reported {
		position: relative;
		display: inline-block;
		width: 14px;
		height: 14px;
		vertical-align: middle;
		margin-left: 2px;
		margin-right: 1px;
		cursor: help;
		color: var(--color-gold);
	}

	.cite-reported svg {
		width: 100%;
		height: 100%;
	}

	/* Tooltip for the reported icon */
	.cite-reported[data-tooltip]:hover::after {
		content: attr(data-tooltip);
		position: absolute;
		bottom: calc(100% + 6px);
		left: 50%;
		transform: translateX(-50%);
		padding: 0.35rem 0.5rem;
		background: var(--color-navy);
		color: #faf8f5;
		font-size: 0.68rem;
		font-weight: 400;
		line-height: 1.3;
		border-radius: 4px;
		white-space: normal;
		max-width: 200px;
		z-index: 100;
		pointer-events: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.cite-reported[data-tooltip]:hover::before {
		content: '';
		position: absolute;
		bottom: calc(100% + 2px);
		left: 50%;
		transform: translateX(-50%);
		border: 4px solid transparent;
		border-top-color: var(--color-foreground);
		z-index: 100;
		pointer-events: none;
	}

	/* Sources & Transparence Section */
	.verification-section {
		background: var(--color-card-bg);
		border-top: 1px solid var(--color-cream-dark);
		padding: 2rem 0;
	}

	.verification-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	@media (min-width: 768px) {
		.verification-content {
			padding: 0 1.5rem;
		}
	}

	.verification-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.verification-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0;
	}

	.verification-title svg {
		color: var(--color-gold);
	}

	.verification-rate {
		font-size: 0.8rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border-radius: 99px;
	}

	.rate-good {
		background: rgba(74, 157, 110, 0.12);
		color: var(--color-success);
	}

	.rate-mid {
		background: rgba(201, 169, 98, 0.15);
		color: #8b7340;
	}

	.rate-low {
		background: rgba(224, 122, 95, 0.12);
		color: var(--color-coral);
	}

	/* Verification bar */
	.verification-bar-container {
		margin-bottom: 1.25rem;
	}

	.verification-bar {
		display: flex;
		height: 28px;
		border-radius: 6px;
		overflow: hidden;
		background: var(--color-cream-dark);
	}

	.bar-segment {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		font-weight: 600;
		color: white;
		transition: width 0.4s ease;
	}

	.bar-confirmed { background: var(--color-success); }
	.bar-reported { background: var(--color-gold); }
	.bar-unverified { background: var(--color-coral); opacity: 0.65; }

	.bar-legend {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
		flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.72rem;
		color: var(--color-text-light);
	}

	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.dot-confirmed { background: var(--color-success); }
	.dot-reported { background: var(--color-gold); }
	.dot-unverified { background: var(--color-coral); opacity: 0.65; }

	/* Collapsible toggles */
	.verif-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.65rem 0;
		background: none;
		border: none;
		border-top: 1px solid var(--color-cream-dark);
		cursor: pointer;
		text-align: left;
	}

	.verif-toggle:hover { opacity: 0.8; }

	.verif-toggle-title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.verif-toggle-title svg {
		color: var(--color-coral);
	}

	.toggle-arrow {
		color: var(--color-text-light);
		transition: transform 0.2s ease;
	}

	.toggle-arrow.expanded {
		transform: rotate(180deg);
	}

	/* Panels */
	.verif-panel {
		padding: 0.5rem 0 0.75rem;
	}

	/* Unsourced claims */
	.unsourced-claim {
		display: flex;
		gap: 0.5rem;
		padding: 0.4rem 0.6rem;
		margin-bottom: 0.25rem;
		border-radius: 4px;
		font-size: 0.78rem;
		align-items: flex-start;
	}

	.claim-high { background: rgba(224, 122, 95, 0.08); }
	.claim-medium { background: rgba(201, 169, 98, 0.08); }

	.claim-severity {
		flex-shrink: 0;
		font-size: 0.85rem;
		line-height: 1.3;
	}

	.claim-text {
		color: var(--color-text);
		line-height: 1.4;
	}

	.claim-path {
		display: block;
		font-family: monospace;
		font-size: 0.65rem;
		color: var(--color-text-light);
		margin-top: 0.1rem;
	}

	/* Sources list */
	.sources-list {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.source-item {
		display: flex;
		gap: 0.5rem;
		padding: 0.35rem 0.4rem;
		align-items: baseline;
		border-radius: 4px;
		transition: background 0.3s ease;
	}

	.source-item:target {
		background: rgba(201, 169, 98, 0.15);
	}

	.source-num {
		font-family: monospace;
		font-size: 0.7rem;
		color: var(--color-text-light);
		flex-shrink: 0;
		min-width: 2rem;
	}

	.source-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.source-title {
		font-size: 0.78rem;
		color: var(--color-foreground);
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.source-title:hover {
		color: var(--color-gold);
		text-decoration: underline;
	}

	.source-url {
		font-size: 0.65rem;
		color: var(--color-text-light);
	}

	/* Methodology note */
	.verification-methodology {
		border-top: 1px solid var(--color-cream-dark);
		padding-top: 0.75rem;
		margin-top: 0.5rem;
	}

	.verification-methodology p {
		font-size: 0.72rem;
		color: var(--color-text-light);
		line-height: 1.5;
		margin: 0;
	}

	/* ─── Official Head Candidates Grid (non-research cities) ─── */

	.official-heads-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 0.75rem;
		padding: 0 1.25rem 1.25rem;
	}

	.official-head-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: var(--color-card-bg);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-md);
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.official-head-card:hover {
		border-color: var(--color-gold-light);
		box-shadow: 0 2px 8px rgba(201, 169, 98, 0.12);
	}

	.official-head-avatar {
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
		color: var(--color-gold-light);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.03em;
	}

	.official-head-info {
		flex: 1;
		min-width: 0;
	}

	.official-head-name {
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
		line-height: 1.3;
	}

	.official-head-list {
		display: block;
		font-size: 0.72rem;
		color: var(--color-text-light);
		margin-top: 0.15rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.official-head-nuance {
		display: inline-block;
		font-size: 0.62rem;
		color: var(--color-text-light);
		background: var(--color-cream-dark);
		padding: 0.1rem 0.35rem;
		border-radius: 3px;
		margin-top: 0.2rem;
	}

	/* ─── 2020 Cross-reference badges ─── */

	.official-head-card.was-2020 {
		border-color: var(--color-gold-light);
		background: linear-gradient(135deg, rgba(201, 169, 98, 0.06) 0%, var(--color-card-bg) 100%);
	}

	.official-head-avatar.was-2020 {
		background: linear-gradient(135deg, var(--color-gold) 0%, #b8952e 100%);
		color: white;
	}

	.badge-2020 {
		display: inline-flex;
		align-items: center;
		font-size: 0.6rem;
		font-weight: 700;
		color: var(--color-gold);
		background: rgba(201, 169, 98, 0.12);
		border: 1px solid rgba(201, 169, 98, 0.3);
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
		letter-spacing: 0.03em;
		white-space: nowrap;
		margin-left: 0.25rem;
	}

	.badge-past {
		display: inline;
		font-size: 0.55rem;
		font-weight: 700;
		color: var(--color-gold);
		background: rgba(201, 169, 98, 0.12);
		padding: 0.05rem 0.3rem;
		border-radius: 2px;
		margin-left: 0.3rem;
		vertical-align: middle;
		cursor: help;
	}

	.official-list-card.was-2020 {
		border-left: 3px solid var(--color-gold);
	}

	.official-list-head.was-2020 {
		color: var(--color-gold);
		font-weight: 600;
	}

	.official-candidates-list li.was-2020 {
		background: rgba(201, 169, 98, 0.06);
	}

	.official-candidates-list li.was-2020 .candidate-name {
		color: var(--color-gold);
		font-weight: 600;
	}

	/* ─── Official Lists (data.gouv.fr) ─── */

	.official-source-badge {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: var(--color-text-light);
		padding: 0 1.25rem 0.75rem;
	}

	.official-source-badge svg {
		color: var(--color-success);
		flex-shrink: 0;
	}

	.official-lists-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0 1.25rem 1.25rem;
	}

	.official-list-card {
		background: var(--color-card-bg);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-md);
		padding: 1rem;
		transition: border-color 0.15s;
	}

	.official-list-card:hover {
		border-color: var(--color-gold-light);
	}

	.official-list-card.compact {
		padding: 0.875rem;
	}

	.official-list-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.official-list-panel {
		flex-shrink: 0;
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--color-gold);
		background: color-mix(in srgb, var(--color-gold) 10%, transparent);
		padding: 0.2rem 0.5rem;
		border-radius: var(--radius-sm);
		letter-spacing: 0.02em;
	}

	.official-list-meta {
		flex: 1;
		min-width: 0;
	}

	.official-list-name {
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
		line-height: 1.3;
	}

	.official-list-nuance {
		display: inline-block;
		font-size: 0.68rem;
		color: var(--color-text-light);
		margin-top: 0.2rem;
	}

	.official-list-head {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.625rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-card-border, var(--color-cream-dark));
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.official-list-head svg {
		color: var(--color-gold);
		flex-shrink: 0;
	}

	.official-list-details {
		margin-top: 0.5rem;
	}

	.official-list-details summary {
		font-size: 0.72rem;
		color: var(--color-text-light);
		cursor: pointer;
		padding: 0.3rem 0;
		user-select: none;
		transition: color 0.15s;
	}

	.official-list-details summary:hover {
		color: var(--color-gold);
	}

	.official-list-details[open] summary {
		margin-bottom: 0.4rem;
	}

	.official-candidates-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.125rem 1rem;
		font-size: 0.72rem;
		color: var(--color-text);
		max-height: 24rem;
		overflow-y: auto;
		padding-right: 0.25rem;
	}

	.official-candidates-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.2rem 0.375rem;
		border-radius: 3px;
		gap: 0.375rem;
	}

	.official-candidates-list li:nth-child(odd) {
		background: var(--color-cream);
	}

	.official-candidates-list li.is-head {
		font-weight: 600;
		color: var(--color-navy);
	}

	.official-candidates-list .candidate-gender {
		font-size: 0.6rem;
		color: var(--color-text-light);
		flex-shrink: 0;
	}

	/* Official lists (standalone section outside main grid) */
	.official-lists-section {
		max-width: 1400px;
		margin: 1rem auto;
		padding: 0 1rem;
		background: var(--color-card-bg);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-md, 0.75rem);
		overflow: hidden;
	}

	@media (min-width: 768px) {
		.official-lists-section {
			padding: 0 1.5rem;
		}
	}

	.official-lists-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.875rem 1.25rem;
		background: none;
		border: none;
		cursor: pointer;
		transition: background 0.15s;
	}

	.official-lists-toggle:hover {
		background: var(--color-cream-dark);
	}

	.section-title.compact {
		font-size: 0.85rem;
		gap: 0.4rem;
	}

	.official-toggle-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.official-source-tag {
		font-size: 0.6rem;
		font-weight: 600;
		color: var(--color-success);
		background: color-mix(in srgb, var(--color-success) 10%, transparent);
		padding: 0.15rem 0.4rem;
		border-radius: var(--radius-sm);
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.official-lists-body {
		padding: 0 1.25rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		animation: slideDown 0.2s ease;
	}

	.official-source-note {
		font-size: 0.68rem;
		color: var(--color-text-light);
		text-align: right;
		margin-top: 0.25rem;
	}

	/* Enrichment CTA (compact, below official lists) */
	.enrichment-cta {
		padding: 1rem 1.25rem;
		border-top: 1px solid var(--color-card-border);
		text-align: center;
	}

	.interest-btn.compact {
		font-size: 0.8rem;
		padding: 0.5rem 1rem;
	}

	.enrichment-hint {
		font-size: 0.7rem;
		color: var(--color-text-light);
		margin-top: 0.4rem;
	}

	@media (max-width: 640px) {
		.official-candidates-list {
			grid-template-columns: 1fr;
		}
	}

	/* Scroll margin for in-page navigation */

	:global([id="programs-section"]),
	:global([id="bilan-section"]) {
		scroll-margin-top: 110px;
	}

	.program-card-list-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.5rem;
		padding: 0.35rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-gold);
		background: none;
		border: 1px solid var(--color-gold-light);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.program-card-list-link:hover {
		background: var(--color-gold);
		color: white;
		border-color: var(--color-gold);
	}

	:global(html.dark) .cite-mark {
		color: var(--color-gold-light);
	}

	/* Dark mode: head candidate name in official list details */
	:global(html.dark) .official-candidates-list li.is-head {
		color: var(--color-foreground);
	}

	/* Cite-mark inside gold-background incumbent pill: white for contrast */
	.incumbent-pill .cite-mark {
		color: white;
	}

</style>
