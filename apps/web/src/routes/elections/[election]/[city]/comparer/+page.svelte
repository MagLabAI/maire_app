<script lang="ts">
	import type { PageData } from './$types';
	import type { ComparisonCandidate } from '$lib/stores/comparison.svelte';
	import { comparison } from '$lib/stores/comparison.svelte';
	import SeoMeta from '$lib/components/SeoMeta.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { wikiThumb } from '$lib/config';

	let { data }: { data: PageData } = $props();

	let backUrl = $derived($page.url.pathname.replace('/comparer', ''));
	let isMultiCity = $derived(!comparison.allSameCity);
	let currentCitySlug = $derived(data.citySlug);

	$effect(() => {
		if (comparison.isEmpty) {
			goto(backUrl);
		}
	});

	function getList(listId: string) {
		return data.lists?.find((l) => l.id === listId);
	}

	// Map listId → list name for display
	function getListName(listId: string): string | undefined {
		return data.lists?.find((l) => l.id === listId)?.name;
	}

	function getProgram(candidate: ComparisonCandidate): Record<string, unknown> | undefined {
		const list = getList(candidate.listId);
		return list?.program as Record<string, unknown> | undefined;
	}

	function getNewsSearchUrl(name: string): string {
		return `https://www.qwant.com/?l=fr&q=${encodeURIComponent(name)}&t=news`;
	}

	const rarityLabel: Record<string, string> = {
		legendary: 'Sortant',
		rare: 'Expérimenté',
		common: 'Renouveau'
	};

	// Program theme topics — only shown if at least one candidate has data
	const PROGRAM_TOPICS = [
		{ key: 'transport', label: 'Transport et mobilité' },
		{ key: 'housing', label: 'Logement' },
		{ key: 'environment', label: 'Environnement' },
		{ key: 'economy', label: 'Économie' }
	] as const;

	function topicHasData(key: string): boolean {
		return comparison.candidates.some((c) => {
			const p = getProgram(c);
			return p && p[key];
		});
	}

	// Climate context labels (French)
	const CLIMATE_LABELS: Record<string, string> = {
		TX30D: 'Jours > 30°C',
		TR: 'Nuits tropicales',
		SWI04D: 'Jours de sécheresse',
		TMm: 'Δ température',
		IFM40D: 'Risque incendie'
	};

	// Format climate value with unit
	function fmtClimate(key: string, val: number | null): string {
		if (val == null) return '–';
		if (key === 'TMm') return `+${val.toFixed(1)}°C`;
		return `${Math.round(val)} j/an`;
	}

	function formatIncome(v: number): string {
		return (v / 1000).toFixed(1).replace('.', ',') + 'k €';
	}

	// Color-code climate values by severity
	function climateColor(key: string, val: number | null): string {
		if (val == null) return '';
		if (key === 'TMm') return val >= 2.5 ? 'stat-negative' : val >= 1.5 ? 'stat-warn' : '';
		if (key === 'TX30D') return val >= 40 ? 'stat-negative' : val >= 20 ? 'stat-warn' : '';
		if (key === 'TR') return val >= 30 ? 'stat-negative' : val >= 15 ? 'stat-warn' : '';
		if (key === 'SWI04D') return val >= 30 ? 'stat-negative' : val >= 15 ? 'stat-warn' : '';
		if (key === 'IFM40D') return val >= 20 ? 'stat-negative' : val >= 10 ? 'stat-warn' : '';
		return '';
	}

	// Citation system: map JSON paths → source indices + titles
	let citationMap = $derived(() => {
		const map = new Map<string, { refs: { idx: number; title: string }[]; status: string }>();
		const sources = data.sources || [];
		const claims = data.verification?.sourcedClaims || [];
		if (!claims.length || !sources.length) return map;

		const idToRef = new Map<number, { idx: number; title: string }>();
		sources.forEach((s: any, i: number) => idToRef.set(s.id, { idx: i + 1, title: s.title || new URL(s.url).hostname }));

		for (const claim of claims) {
			const refs = (claim.sources || [])
				.map((sid: string) => idToRef.get(parseInt(sid)))
				.filter((r: any): r is { idx: number; title: string } => r != null);
			if (refs.length > 0) {
				map.set(claim.path, { refs, status: claim.status });
			}
		}
		return map;
	});

	function getCite(path: string): { refs: { idx: number; title: string }[]; status: string } | undefined {
		return citationMap().get(path);
	}

	let sourcesOpen = $state(false);

	function openSourceRef(idx: number) {
		sourcesOpen = true;
		setTimeout(() => {
			document.getElementById(`cmp-source-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 100);
	}

	let hasCitations = $derived((data.sources?.length ?? 0) > 0);

	// Map candidate id → index in top-level candidates array (matches citation paths)
	function getCandidateIndex(candidateId: string): number {
		if (!data.candidates) return -1;
		return data.candidates.findIndex((c: any) => c.id === candidateId);
	}

	// Build citation path for a candidate field
	function candidatePath(candidateId: string, field: string): string {
		const idx = getCandidateIndex(candidateId);
		return idx >= 0 ? `candidates[${idx}].${field}` : '';
	}

	// Build citation path for a list field
	function listPath(listId: string, field: string): string {
		const idx = data.lists?.findIndex(l => l.id === listId) ?? -1;
		return idx >= 0 ? `lists[${idx}].${field}` : '';
	}
</script>

{#snippet candidateName(candidate: ComparisonCandidate)}
	{@const listName = getListName(candidate.listId)}
	<span class="entry-name">
		{candidate.fullName}
		{#if isMultiCity}<span class="entry-city-label">{candidate.cityName}</span>{/if}
		{#if listName}<a href="#official-lists-cmp" class="entry-list-label"> · {listName}</a>{/if}
	</span>
{/snippet}

{#snippet cite(path: string)}
	{@const entry = getCite(path)}
	{#if entry}
		<sup class="cite-refs">{#if entry.status === 'reported'}<span class="cite-reported">~</span>{/if}{#each entry.refs.slice(0, 3) as ref, i}<a href="#cmp-source-{ref.idx}" class="cite-mark" data-tooltip={ref.title} onclick={(e) => { e.preventDefault(); openSourceRef(ref.idx); }}>{#if i > 0},{/if}{ref.idx}</a>{/each}</sup>
	{/if}
{/snippet}

<svelte:head>
	<title>Comparer les candidats {data.cityName ? `à ${data.cityName}` : ''} | maire.app</title>
	<meta name="description" content="Comparaison des candidats municipales 2026{data.cityName ? ` à ${data.cityName}` : ''}. Programmes, profils et propositions côte à côte." />
	<SeoMeta
		title="Comparer les candidats {data.cityName ? `à ${data.cityName}` : ''} | maire.app"
		description="Comparaison des candidats municipales 2026{data.cityName ? ` à ${data.cityName}` : ''}. Programmes, profils et propositions côte à côte."
		path="/elections/{data.electionSlug}/{data.citySlug}/comparer"
	/>
</svelte:head>

{#if !comparison.isEmpty}
	<section class="compare-header">
		<div class="container-app">
			<a href={backUrl} class="back-link">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Retour aux candidats
			</a>

			<h1 class="compare-title">Comparaison de candidats</h1>
			<p class="compare-subtitle">{comparison.count} candidat{comparison.count > 1 ? 's' : ''} sélectionné{comparison.count > 1 ? 's' : ''}{#if isMultiCity} · {comparison.cities.length} villes{/if}</p>

			{#if isMultiCity}
				<div class="multi-city-warning">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Comparaison inter-villes : les candidats de villes différentes sont comparés côte à côte. Les sources et programmes officiels ne sont disponibles que pour {data.cityName || currentCitySlug}.
				</div>
			{/if}
		</div>
	</section>

	<!-- Candidate chips bar -->
	<section class="chips-bar">
		<div class="container-app">
			<div class="chips-scroll">
				{#each comparison.candidates as candidate (candidate.id)}
					{@const list = getList(candidate.listId)}
					{@const isCrossCity = isMultiCity && candidate.citySlug !== currentCitySlug}
					<div class="candidate-chip" class:cross-city={isCrossCity}>
						<div class="chip-avatar">
							{#if candidate.photo}
								<img src={wikiThumb(candidate.photo)} alt={candidate.fullName} />
							{:else}
								<span>{candidate.firstName[0]}{candidate.lastName[0]}</span>
							{/if}
						</div>
						<div class="chip-info">
							<span class="chip-name">{candidate.fullName}</span>
							{#if isCrossCity}
								<span class="chip-city">{candidate.cityName}</span>
							{:else if list}
								<span class="chip-nuance">{list.nuance}</span>
							{/if}
						</div>
						<button
							class="chip-remove"
							onclick={() => comparison.remove(candidate.id)}
							aria-label="Retirer {candidate.fullName}"
						>&times;</button>
					</div>
				{/each}
				{#if comparison.count < 4}
					<a href={backUrl} class="add-candidate-chip">
						<span class="add-icon">+</span>
						<span class="add-label">Ajouter</span>
					</a>
				{/if}
			</div>
		</div>
	</section>

	<section class="compare-section">
		<div class="container-app">
			<div class="topics-list">

				<!-- Topic: Positionnement -->
				{#if comparison.candidates.some((c) => c.positioning)}
					<details class="topic-section" open>
						<summary class="topic-title">Positionnement politique</summary>
						<div class="topic-content">
							{#each comparison.candidates as candidate (candidate.id)}
								{@const isCross = isMultiCity && candidate.citySlug !== currentCitySlug}
								<div class="topic-entry" class:cross-city={isCross}>
									{@render candidateName(candidate)}
									<span class="archetype-badge archetype-{candidate.rarity}">{rarityLabel[candidate.rarity] || 'Renouveau'}</span>
									{#if candidate.positioning}
										<p class="entry-text">{candidate.positioning}{@render cite(candidatePath(candidate.id, 'positioning'))}</p>
									{:else}
										<p class="entry-empty">Non renseigné</p>
									{/if}
								</div>
							{/each}
						</div>
					</details>
				{/if}

				<!-- Topic: Priorités du programme -->
				{#if comparison.candidates.some((c) => c.programHighlights?.length)}
					<details class="topic-section" open>
						<summary class="topic-title">Priorités du programme</summary>
						<div class="topic-content">
							{#each comparison.candidates as candidate (candidate.id)}
								{@const isCross = isMultiCity && candidate.citySlug !== currentCitySlug}
								{@const list = getList(candidate.listId)}
								<div class="topic-entry" class:cross-city={isCross}>
									<div class="entry-header">
										{@render candidateName(candidate)}
										{#if list?.programUrl}
											<a href={list.programUrl} target="_blank" rel="noopener noreferrer" class="entry-link">Programme complet</a>
										{/if}
									</div>
									{#if candidate.programHighlights?.length}
										<ul class="entry-list">
											{#each candidate.programHighlights as h, hi}
												<li>{h}{@render cite(candidatePath(candidate.id, `programHighlights[${hi}]`))}</li>
											{/each}
										</ul>
									{:else}
										<p class="entry-empty">Non renseigné</p>
									{/if}
								</div>
							{/each}
						</div>
					</details>
				{/if}

				<!-- Program theme topics (transport, housing, environment, economy) -->
				{#each PROGRAM_TOPICS as topic}
					{#if topicHasData(topic.key) || (topic.key === 'environment' && data.climateData) || (topic.key === 'economy' && data.baselineStats)}
						<details class="topic-section" open={topic.key === 'environment' || topic.key === 'economy'}>
							<summary class="topic-title">{topic.label}</summary>
							<div class="topic-content">
								<!-- Climate stats right below section header -->
								{#if topic.key === 'environment' && data.climateData}
									{@const climate = data.climateData as Record<string, Record<string, [number | null, number | null, number | null]>>}
									<div class="context-stats-card context-stats-top" style="grid-column: 1 / -1;">
										<div class="context-stats-horizons">
											{#each ['2030', '2050'] as horizon}
												{#if climate[horizon]}
													<div class="context-horizon">
														<span class="horizon-year">{horizon}</span>
														<div class="horizon-indicators">
															{#each Object.entries(climate[horizon]) as [key, vals]}
																{#if CLIMATE_LABELS[key] && vals[0] != null}
																	<span class="horizon-stat">
																		<span class="horizon-stat-val {climateColor(key, vals[0])}">{fmtClimate(key, vals[0])}</span>
																		<span class="horizon-stat-key">{CLIMATE_LABELS[key]}</span>
																	</span>
																{/if}
															{/each}
														</div>
													</div>
												{/if}
											{/each}
										</div>
									</div>
								{/if}

								<!-- Economy stats right below section header -->
								{#if topic.key === 'economy' && data.baselineStats}
									{@const stats = data.baselineStats as Record<string, number>}
									<div class="context-stats-card context-stats-top" style="grid-column: 1 / -1;">
										<div class="context-stats-row">
											{#if stats.medianIncome}
												<span class="context-stat">
													<span class="context-stat-val {stats.medianIncome >= 25000 ? 'stat-positive' : stats.medianIncome < 18000 ? 'stat-warn' : ''}">{formatIncome(stats.medianIncome)}</span>
													<span class="context-stat-key">Revenu médian</span>
												</span>
											{/if}
											{#if stats.jobs}
												<span class="context-stat">
													<span class="context-stat-val">{stats.jobs.toLocaleString('fr-FR')}</span>
													<span class="context-stat-key">Emplois</span>
												</span>
											{/if}
											{#if stats.popGrowth != null}
												<span class="context-stat">
													<span class="context-stat-val {stats.popGrowth > 0.5 ? 'stat-positive' : stats.popGrowth < -0.5 ? 'stat-negative' : ''}">{stats.popGrowth > 0 ? '+' : ''}{stats.popGrowth.toFixed(1)}%</span>
													<span class="context-stat-key">Croissance pop.</span>
												</span>
											{/if}
											{#if stats.bac5Rate}
												<span class="context-stat">
													<span class="context-stat-val {stats.bac5Rate >= 30 ? 'stat-positive' : stats.bac5Rate < 10 ? 'stat-warn' : ''}">{stats.bac5Rate}%</span>
													<span class="context-stat-key">Bac+5</span>
												</span>
											{/if}
											{#if data.debtData?.evolution2019_2024 != null}
												<span class="context-stat">
													<span class="context-stat-val {data.debtData.evolution2019_2024 > 20 ? 'stat-negative' : data.debtData.evolution2019_2024 < -10 ? 'stat-positive' : ''}">{data.debtData.evolution2019_2024 > 0 ? '+' : ''}{data.debtData.evolution2019_2024.toFixed(0)}%</span>
													<span class="context-stat-key">Dette 2019→24</span>
												</span>
											{/if}
										</div>
									</div>
								{/if}

								{#each comparison.candidates as candidate (candidate.id)}
									{@const isCross = isMultiCity && candidate.citySlug !== currentCitySlug}
									{@const program = getProgram(candidate)}
									<div class="topic-entry" class:cross-city={isCross}>
										{@render candidateName(candidate)}
										{#if program?.[topic.key]}
											<p class="entry-text">{program[topic.key]}{@render cite(listPath(candidate.listId, `program.${topic.key}`))}</p>
										{:else}
											<p class="entry-empty">Non renseigné</p>
										{/if}
									</div>
								{/each}
							</div>
						</details>
					{/if}
				{/each}

				<!-- Topic: Forces et faiblesses -->
				{#if comparison.candidates.some((c) => c.strengths?.length || c.weaknesses?.length)}
					<details class="topic-section">
						<summary class="topic-title">Forces et faiblesses</summary>
						<div class="topic-content">
							{#each comparison.candidates as candidate (candidate.id)}
								{@const isCross = isMultiCity && candidate.citySlug !== currentCitySlug}
								<div class="topic-entry" class:cross-city={isCross}>
									{@render candidateName(candidate)}
									<div class="sw-columns">
										{#if candidate.strengths?.length}
											<div class="sw-col sw-strengths">
												<h4>Forces</h4>
												<ul>
													{#each candidate.strengths as s, si}
														<li>{s}{@render cite(candidatePath(candidate.id, `strengths[${si}]`))}</li>
													{/each}
												</ul>
											</div>
										{/if}
										{#if candidate.weaknesses?.length}
											<div class="sw-col sw-weaknesses">
												<h4>Faiblesses</h4>
												<ul>
													{#each candidate.weaknesses as w, wi}
														<li>{w}{@render cite(candidatePath(candidate.id, `weaknesses[${wi}]`))}</li>
													{/each}
												</ul>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</details>
				{/if}

				<!-- Topic: Expérience politique -->
				{#if comparison.candidates.some((c) => c.experience)}
					<details class="topic-section">
						<summary class="topic-title">Expérience politique</summary>
						<div class="topic-content">
							{#each comparison.candidates as candidate (candidate.id)}
								{@const isCross = isMultiCity && candidate.citySlug !== currentCitySlug}
								<div class="topic-entry" class:cross-city={isCross}>
									<div class="entry-header">
										{@render candidateName(candidate)}
										{#if candidate.experience}
											<span class="entry-badge">{candidate.experience.totalYearsElected} ans</span>
										{/if}
									</div>
									{#if candidate.experience}
										{#if candidate.experience.currentMandate}
											<p class="entry-text">
												{candidate.experience.currentMandate.role}
												{#if candidate.experience.currentMandate.since}
													<span class="text-muted"> — depuis {candidate.experience.currentMandate.since}</span>
												{/if}
											</p>
										{/if}
										{#if candidate.experience.previousMandates?.length}
											<ul class="entry-list entry-list-dash">
												{#each candidate.experience.previousMandates as mandate}
													<li>
														{#if typeof mandate === 'string'}
															{mandate}
														{:else}
															{mandate.role}
															{#if mandate.from && mandate.to}
																({mandate.from}–{mandate.to})
															{/if}
														{/if}
													</li>
												{/each}
											</ul>
										{/if}
									{:else}
										<p class="entry-empty">Non renseigné</p>
									{/if}
								</div>
							{/each}
						</div>
					</details>
				{/if}

	
				<!-- Topic: Liens -->
				{#if comparison.candidates.some((c) => c.socialLinks && Object.values(c.socialLinks).some(Boolean))}
					<details class="topic-section">
						<summary class="topic-title">Liens et réseaux</summary>
						<div class="topic-content">
							{#each comparison.candidates as candidate (candidate.id)}
								{@const isCross = isMultiCity && candidate.citySlug !== currentCitySlug}
								{@const list = getList(candidate.listId)}
								<div class="topic-entry entry-inline" class:cross-city={isCross}>
									{@render candidateName(candidate)}
									<div class="links-row">
										<a href={getNewsSearchUrl(candidate.fullName)} target="_blank" rel="noopener noreferrer" class="entry-link">Actualités</a>
										{#if candidate.socialLinks}
											{#each Object.entries(candidate.socialLinks) as [platform, url]}
												{#if url}
													<a href={url} target="_blank" rel="noopener noreferrer" class="entry-link">{platform}</a>
												{/if}
											{/each}
										{/if}
										{#if list?.programUrl}
											<a href={list.programUrl} target="_blank" rel="noopener noreferrer" class="entry-link entry-link-gold">Programme</a>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</details>
				{/if}
				<!-- Topic: Contexte 2020 et maire sortant -->
				{#if data.previousElection || data.incumbentAnalysis}
					<details class="topic-section">
						<summary class="topic-title">Contexte : Résultats 2020 et maire sortant</summary>
						<div class="topic-content">
							{#if data.incumbentAnalysis?.currentMayor}
								{@const mayor = data.incumbentAnalysis.currentMayor}
								<div class="topic-entry context-entry">
									<span class="entry-name">Maire sortant : {mayor.name} ({mayor.party})</span>
									{#if mayor.since}
										<p class="entry-text">En fonction depuis {mayor.since}{#if mayor.profession} — {mayor.profession}{/if}</p>
									{/if}
									{#if data.incumbentAnalysis.reelection}
										<p class="entry-text" style="margin-top: 0.25rem;">
											{#if data.incumbentAnalysis.reelection.runningAgain}
												Se représente en 2026
											{:else}
												Ne se représente pas{#if data.incumbentAnalysis.reelection.successor} — successeur pressenti : {data.incumbentAnalysis.reelection.successor}{/if}
											{/if}
										</p>
									{/if}
								</div>
							{/if}

							{#if data.incumbentAnalysis?.mandateAssessment}
								{@const assessment = data.incumbentAnalysis.mandateAssessment}
								{#if assessment.majorAchievements?.length}
									<div class="topic-entry context-entry">
										<span class="entry-name context-label-success">Réalisations du mandat</span>
										<ul class="entry-list">
											{#each assessment.majorAchievements as item}
												<li>{item}</li>
											{/each}
										</ul>
									</div>
								{/if}
								{#if assessment.pointsDeDebat?.length || assessment.controversies?.length}
									{@const debates = assessment.pointsDeDebat || assessment.controversies}
									<div class="topic-entry context-entry">
										<span class="entry-name context-label-warning">Points de débat rapportés</span>
										<ul class="entry-list">
											{#each debates as item}
												<li>{item}</li>
											{/each}
										</ul>
									</div>
								{/if}
							{/if}

							{#if data.previousElection?.results}
								{@const results = data.previousElection.results}
								<div class="topic-entry context-entry">
									<span class="entry-name">Résultats {data.previousElection.year}</span>
									{#if results.winner}
										<p class="entry-text">
											Élu·e : <strong>{results.winner.candidate}</strong> ({results.winner.party})
											{#if results.winner.voteShare} — {(results.winner.voteShare * 100).toFixed(1)}% des voix{/if}
										</p>
									{/if}
									{#if results.round1?.turnout || results.round2?.turnout}
										<p class="entry-text" style="margin-top: 0.25rem;">
											Participation :
											{#if results.round1?.turnout}{(results.round1.turnout * 100).toFixed(1)}% (T1){/if}
											{#if results.round2?.turnout} — {(results.round2.turnout * 100).toFixed(1)}% (T2){/if}
										</p>
									{/if}
									{#if results.lists?.length}
										<div class="results-bars">
											{#each results.lists as list}
												<div class="result-row">
													<span class="result-name">{list.headCandidate || list.name}</span>
													<span class="result-party">{list.party || ''}</span>
													<div class="result-bar-bg">
														<div
															class="result-bar-fill"
															style="width: {((list.round2VoteShare || list.round1VoteShare || 0) * 100)}%"
														></div>
													</div>
													<span class="result-pct">
														{((list.round2VoteShare || list.round1VoteShare || 0) * 100).toFixed(1)}%
													</span>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</details>
				{/if}
			</div>

			<!-- Official lists overview -->
			{#if data.officialLists?.length}
				<section id="official-lists-cmp" class="bottom-section">
					<div class="bottom-section-header">
						<h2 class="bottom-section-title">
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							Listes officiellement déclarées
						</h2>
						<span class="bottom-section-count">{data.officialLists.length}</span>
					</div>
					<div class="official-lists-grid">
						{#each data.officialLists as list (list.panelNumber)}
							<div class="official-list-card">
								<div class="official-list-info">
									<span class="official-list-name">{list.name}</span>
									<span class="official-list-meta">
										{list.headCandidate}
										{#if list.nuanceLabel} · {list.nuanceLabel}{/if}
									</span>
									<span class="official-list-count">{list.candidates?.length || '?'} candidat{(list.candidates?.length || 0) > 1 ? 's' : ''}</span>
								</div>
								<a href="{backUrl}#official-lists" class="official-list-link">Voir la liste</a>
							</div>
						{/each}
					</div>
					<p class="official-source-note">Source : Ministère de l'Intérieur, data.gouv.fr</p>
				</section>
			{/if}

			<!-- Sources & Transparence -->
			{#if hasCitations}
				{@const sources = data.sources}
				{@const v = data.verification}
				{@const total = (v?.confirmedClaims || 0) + (v?.reportedClaims || 0) + (v?.unverifiedClaims || 0)}
				{@const pctConfirmed = total ? Math.round(((v?.confirmedClaims || 0) / total) * 100) : 0}
				{@const pctReported = total ? Math.round(((v?.reportedClaims || 0) / total) * 100) : 0}
				{@const pctUnverified = total ? Math.round(((v?.unverifiedClaims || 0) / total) * 100) : 0}
				<section class="bottom-section">
					<div class="bottom-section-header">
						<h2 class="bottom-section-title">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
							Sources & Transparence
						</h2>
						{#if v?.confirmationRate}
							<span class="verification-rate" class:rate-good={pctConfirmed >= 60} class:rate-mid={pctConfirmed >= 40 && pctConfirmed < 60} class:rate-low={pctConfirmed < 40}>
								{v.confirmationRate} vérifiées
							</span>
						{/if}
					</div>

					{#if total > 0}
						<div class="verification-bar-container">
							<div class="verification-bar">
								{#if pctConfirmed > 0}
									<div class="bar-segment bar-confirmed" style="width: {pctConfirmed}%">
										{#if pctConfirmed > 15}<span>{v?.confirmedClaims}</span>{/if}
									</div>
								{/if}
								{#if pctReported > 0}
									<div class="bar-segment bar-reported" style="width: {pctReported}%">
										{#if pctReported > 8}<span>{v?.reportedClaims}</span>{/if}
									</div>
								{/if}
								{#if pctUnverified > 0}
									<div class="bar-segment bar-unverified" style="width: {pctUnverified}%">
										{#if pctUnverified > 10}<span>{v?.unverifiedClaims}</span>{/if}
									</div>
								{/if}
							</div>
							<div class="bar-legend">
								<span class="legend-item"><span class="legend-dot dot-confirmed"></span> Confirmées ({v?.confirmedClaims || 0})</span>
								<span class="legend-item"><span class="legend-dot dot-reported"></span> Presse ({v?.reportedClaims || 0})</span>
								<span class="legend-item"><span class="legend-dot dot-unverified"></span> Non vérifiées ({v?.unverifiedClaims || 0})</span>
							</div>
						</div>
					{/if}

					<details class="sources-toggle" bind:open={sourcesOpen}>
						<summary class="sources-toggle-title">Sources ({sources.length})</summary>
						<div class="sources-list">
							{#each sources as src, i}
								<div id="cmp-source-{i + 1}" class="source-item">
									<span class="source-num">[{i + 1}]</span>
									<div class="source-info">
										<a href={src.url} target="_blank" rel="noopener noreferrer" class="source-title">{src.title || src.url}</a>
										<span class="source-domain">{new URL(src.url).hostname}</span>
									</div>
								</div>
							{/each}
						</div>
					</details>

					<p class="verification-methodology">Recherche automatisée par Mistral + Tavily. Chaque affirmation est vérifiée contre {sources.length} sources web. Les marques [N] renvoient aux sources correspondantes.</p>
				</section>
			{/if}

			<div class="compare-actions">
				<button class="btn btn-outline" onclick={() => comparison.clear()}>
					Effacer la sélection
				</button>
				<a href={backUrl} class="btn btn-primary">
					Ajouter d'autres candidats
				</a>
			</div>
		</div>
	</section>
{/if}

<style>
	/* Header */
	.compare-header {
		background: var(--color-navy);
		color: #faf8f5;
		padding: 2rem 0 1.5rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-light);
		font-size: 0.9rem;
		margin-bottom: 1rem;
		transition: color 0.2s ease;
	}

	.back-link:hover {
		color: var(--color-gold);
	}

	.compare-title {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 700;
		color: #faf8f5;
		margin-bottom: 0.25rem;
	}

	.compare-subtitle {
		color: var(--color-text-light);
		font-size: 0.9rem;
	}

	/* Multi-city warning */
	.multi-city-warning {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding: 0.6rem 0.75rem;
		background: rgba(224, 122, 95, 0.15);
		border: 1px solid rgba(224, 122, 95, 0.3);
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		color: var(--color-cream);
		line-height: 1.5;
	}

	.multi-city-warning svg {
		flex-shrink: 0;
		margin-top: 2px;
		color: var(--color-coral);
	}

	/* Cross-city candidate styling */
	.candidate-chip.cross-city {
		border: 1px dashed var(--color-coral);
		opacity: 0.75;
	}

	.chip-city {
		font-size: 0.65rem;
		padding: 0.1rem 0.35rem;
		background: rgba(224, 122, 95, 0.25);
		color: var(--color-coral);
		border-radius: var(--radius-sm);
		font-weight: 600;
	}

	.topic-entry.cross-city {
		border-left-color: var(--color-coral);
		opacity: 0.8;
		background: color-mix(in srgb, var(--color-cream) 90%, var(--color-coral) 10%);
	}

	.entry-city-label {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--color-coral);
		background: rgba(224, 122, 95, 0.12);
		padding: 0.05rem 0.35rem;
		border-radius: var(--radius-sm);
		margin-left: 0.35rem;
		vertical-align: middle;
	}

	/* Candidate chips bar — sticks below fixed header */
	.chips-bar {
		background: var(--color-navy-light);
		padding: 0.75rem 0;
		position: sticky;
		top: 44px;
		z-index: 20;
	}

	@media (min-width: 768px) {
		.chips-bar {
			top: 52px;
		}
	}

	.chips-scroll {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		padding-bottom: 2px;
	}

	.candidate-chip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		background: var(--color-navy);
		border-radius: var(--radius-md);
		flex-shrink: 0;
	}

	.chip-avatar {
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		overflow: hidden;
		flex-shrink: 0;
		background: linear-gradient(135deg, var(--color-navy-light), var(--color-navy));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.chip-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.chip-avatar span {
		font-size: 0.65rem;
		font-weight: 700;
		color: #faf8f5;
		opacity: 0.5;
	}

	.chip-info {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.chip-name {
		font-size: 0.8rem;
		font-weight: 600;
		color: #faf8f5;
		white-space: nowrap;
	}

	.chip-nuance {
		font-size: 0.65rem;
		padding: 0.1rem 0.35rem;
		background: rgba(201, 169, 98, 0.2);
		color: var(--color-gold-light);
		border-radius: var(--radius-sm);
		font-weight: 600;
	}

	.chip-remove {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		font-size: 14px;
		color: var(--color-text-light);
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.chip-remove:hover {
		background: var(--color-coral);
		color: white;
	}

	.add-candidate-chip {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.375rem 0.6rem;
		border: 1.5px dashed rgba(201, 169, 98, 0.5);
		border-radius: var(--radius-md);
		color: var(--color-gold-light);
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
		flex-shrink: 0;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.add-candidate-chip:hover {
		border-color: var(--color-gold);
		background: rgba(201, 169, 98, 0.15);
		color: var(--color-gold);
	}

	.add-icon {
		font-size: 1rem;
		line-height: 1;
	}

	/* Section */
	.compare-section {
		padding: 1.5rem 0 4rem;
	}

	.topics-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 900px;
	}

	@media (min-width: 1200px) {
		.topics-list {
			max-width: 1200px;
		}
	}

	/* Topic sections */
	.topic-section {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
	}

	.topic-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.25rem;
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-foreground);
		cursor: pointer;
		user-select: none;
		transition: background 0.15s ease;
		list-style: none;
	}

	.topic-title::-webkit-details-marker { display: none; }

	.topic-title::before {
		content: '';
		width: 0;
		height: 0;
		border-left: 5px solid var(--color-gold);
		border-top: 4px solid transparent;
		border-bottom: 4px solid transparent;
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	details[open] > .topic-title::before {
		transform: rotate(90deg);
	}

	.topic-title:hover {
		background: var(--color-cream);
	}

	.topic-content {
		padding: 0 1.25rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	@media (min-width: 1200px) {
		.topic-content {
			display: grid;
			grid-template-columns: 1fr 1fr;
		}
	}

	/* Entry: one candidate's data within a topic */
	.topic-entry {
		padding: 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--color-gold);
	}

	.entry-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.entry-name {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--color-foreground);
		display: block;
		margin-bottom: 0.25rem;
	}

	.entry-header .entry-name {
		margin-bottom: 0;
	}

	.entry-badge {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.15rem 0.5rem;
		background: var(--color-gold);
		color: #0a1628;
		border-radius: var(--radius-full);
	}

	.entry-text {
		font-size: 0.85rem;
		color: var(--color-text);
		line-height: 1.6;
		margin: 0;
	}

	.text-muted {
		color: var(--color-text-light);
	}

	.entry-empty {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0;
	}

	.entry-list {
		list-style: none;
		padding: 0;
		margin: 0.25rem 0 0;
	}

	.entry-list li {
		padding: 0.25rem 0 0.25rem 1rem;
		font-size: 0.85rem;
		color: var(--color-text);
		line-height: 1.5;
		position: relative;
	}

	.entry-list li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.65em;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--color-gold);
	}

	.entry-list-dash li::before {
		content: '–';
		width: auto;
		height: auto;
		border-radius: 0;
		background: none;
		color: var(--color-text-light);
		top: 0.25rem;
	}

	.entry-link {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-gold);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.entry-link:hover {
		color: var(--color-coral);
	}

	.entry-link-gold {
		padding: 0.2rem 0.5rem;
		background: var(--color-gold);
		color: #0a1628;
		border-radius: var(--radius-sm);
		text-decoration: none;
	}

	.entry-link-gold:hover {
		background: var(--color-coral);
		color: white;
	}

	/* Archetype badge */
	.archetype-badge {
		display: inline-block;
		padding: 0.1rem 0.4rem;
		font-size: 0.6rem;
		font-weight: 700;
		border-radius: var(--radius-full);
		text-transform: uppercase;
		vertical-align: middle;
		margin-bottom: 0.25rem;
	}

	.archetype-legendary {
		background: linear-gradient(135deg, var(--color-gold), var(--color-coral));
		color: #0a1628;
	}

	.archetype-rare {
		background: linear-gradient(135deg, #8b9dc3, #c0c8d9);
		color: #1a2d4a;
	}

	.archetype-common {
		background: #e4e4e7;
		color: #52525b;
	}

	/* Strengths & Weaknesses columns */
	.sw-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-top: 0.25rem;
	}

	@media (max-width: 480px) {
		.sw-columns {
			grid-template-columns: 1fr;
		}
	}

	.sw-col h4 {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin: 0 0 0.375rem;
	}

	.sw-strengths { border-left: 2px solid var(--color-success); padding-left: 0.5rem; }
	.sw-weaknesses { border-left: 2px solid var(--color-coral); padding-left: 0.5rem; }
	.sw-strengths h4 { color: var(--color-success); }
	.sw-weaknesses h4 { color: var(--color-coral); }

	.sw-col ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.sw-col li {
		padding: 0.2rem 0;
		font-size: 0.8rem;
		color: var(--color-text);
		line-height: 1.4;
	}

	/* Scores grid — already its own grid, span both columns in 2-col mode */
	@media (min-width: 1200px) {
		.context-entry {
			grid-column: 1 / -1;
		}
	}

	/* Links row */
	.entry-inline {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.entry-inline .entry-name {
		margin-bottom: 0;
		min-width: 120px;
	}

	.links-row {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	/* Context entry — no left gold border, uses neutral border */
	.context-entry {
		border-left-color: var(--color-navy-light);
	}

	.context-label-success {
		color: var(--color-success);
	}

	.context-label-warning {
		color: var(--color-coral);
	}

	/* 2020 results bars */
	.results-bars {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		margin-top: 0.5rem;
	}

	.result-row {
		display: grid;
		grid-template-columns: 1fr auto 120px auto;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
	}

	@media (max-width: 480px) {
		.result-row {
			grid-template-columns: 1fr 80px auto;
		}

		.result-party {
			display: none;
		}
	}

	.result-name {
		font-weight: 600;
		color: var(--color-foreground);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-party {
		font-size: 0.7rem;
		color: var(--color-text-light);
		text-align: right;
	}

	.result-bar-bg {
		height: 6px;
		background: var(--color-card-border);
		border-radius: 3px;
		overflow: hidden;
	}

	.result-bar-fill {
		height: 100%;
		background: var(--color-navy-light);
		border-radius: 3px;
	}

	.result-pct {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-foreground);
		min-width: 40px;
		text-align: right;
	}

	/* Citation marks */
	.cite-refs {
		font-size: 0.6rem;
		font-weight: 700;
		vertical-align: super;
		line-height: 1;
		margin-left: 1px;
	}

	.cite-mark {
		color: var(--color-gold);
		text-decoration: none;
		cursor: pointer;
	}

	.cite-mark:hover {
		color: var(--color-coral);
		text-decoration: underline;
	}

	.cite-reported {
		color: var(--color-coral);
		font-size: 0.55rem;
		margin-right: 1px;
	}

	/* Context stats cards (climate + economy) */
	.context-stats-card {
		padding: 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--color-navy-light);
		border-top: 1px dashed var(--color-card-border);
	}

	.context-stats-label {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		display: block;
		margin-bottom: 0.5rem;
	}

	.context-stats-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.25rem;
	}

	.context-stat {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.context-stat-val {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.context-stat-val.stat-positive {
		color: var(--color-success);
	}

	.context-stat-val.stat-warn {
		color: var(--color-gold);
	}

	.context-stat-val.stat-negative {
		color: var(--color-coral);
	}

	.context-stats-top {
		margin-bottom: 0.5rem;
	}

	.horizon-stat-val.stat-warn {
		color: var(--color-gold);
	}

	.horizon-stat-val.stat-negative {
		color: var(--color-coral);
	}

	.context-stat-key {
		font-size: 0.65rem;
		color: var(--color-text-light);
	}

	.context-stats-horizons {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.context-horizon {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.horizon-year {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-gold);
	}

	.horizon-indicators {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
	}

	.horizon-stat {
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
	}

	.horizon-stat-val {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.horizon-stat-key {
		font-size: 0.6rem;
		color: var(--color-text-light);
	}

	/* List name label — clickable link to official lists */
	.entry-list-label {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--color-gold);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.entry-list-label:hover {
		color: var(--color-coral);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* Bottom sections (official lists + sources) */
	.bottom-section {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		padding: 1.25rem 1.5rem;
		margin-top: 1rem;
		max-width: 900px;
	}

	@media (min-width: 1200px) {
		.bottom-section { max-width: 1200px; }
	}

	.bottom-section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.bottom-section-title {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-foreground);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
	}

	.bottom-section-title svg {
		color: var(--color-gold);
		flex-shrink: 0;
	}

	.bottom-section-count {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.15rem 0.5rem;
		background: var(--color-gold);
		color: #0a1628;
		border-radius: var(--radius-full);
	}

	/* Official lists grid */
	.official-lists-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.5rem;
	}

	@media (min-width: 640px) {
		.official-lists-grid { grid-template-columns: 1fr 1fr; }
	}

	@media (min-width: 1200px) {
		.official-lists-grid { grid-template-columns: 1fr 1fr 1fr; }
	}

	.official-list-card {
		padding: 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--color-navy-light);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.official-list-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.official-list-name {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	.official-list-meta {
		font-size: 0.75rem;
		color: var(--color-text-light);
		line-height: 1.4;
	}

	.official-list-count {
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	.official-list-link {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-gold);
		text-decoration: underline;
		text-underline-offset: 2px;
		align-self: flex-start;
	}

	.official-list-link:hover {
		color: var(--color-coral);
	}

	.official-source-note {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0.75rem 0 0;
	}

	/* Verification bar */
	.verification-rate {
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.2rem 0.6rem;
		border-radius: var(--radius-full);
	}

	.rate-good { background: rgba(74, 157, 110, 0.15); color: var(--color-success); }
	.rate-mid { background: rgba(201, 169, 98, 0.15); color: var(--color-gold); }
	.rate-low { background: rgba(224, 122, 95, 0.15); color: var(--color-coral); }

	.verification-bar-container {
		margin-bottom: 1rem;
	}

	.verification-bar {
		display: flex;
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
		background: var(--color-card-border);
		margin-bottom: 0.5rem;
	}

	.bar-segment {
		display: flex;
		align-items: center;
		justify-content: center;
		transition: width 0.5s ease;
	}

	.bar-segment span {
		font-size: 0.55rem;
		font-weight: 700;
		color: white;
		line-height: 1;
	}

	.bar-confirmed { background: var(--color-success); }
	.bar-reported { background: var(--color-gold); }
	.bar-unverified { background: var(--color-coral); }

	.bar-legend {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.legend-item {
		font-size: 0.7rem;
		color: var(--color-text-light);
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.dot-confirmed { background: var(--color-success); }
	.dot-reported { background: var(--color-gold); }
	.dot-unverified { background: var(--color-coral); }

	/* Sources toggle */
	.sources-toggle {
		border-top: 1px solid var(--color-card-border);
		padding-top: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.sources-toggle-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-foreground);
		cursor: pointer;
		list-style: none;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0;
	}

	.sources-toggle-title::-webkit-details-marker { display: none; }

	.sources-toggle-title::before {
		content: '';
		width: 0;
		height: 0;
		border-left: 5px solid var(--color-gold);
		border-top: 4px solid transparent;
		border-bottom: 4px solid transparent;
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.sources-toggle[open] > .sources-toggle-title::before {
		transform: rotate(90deg);
	}

	.sources-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding-top: 0.5rem;
	}

	.source-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.25rem 0;
	}

	.source-num {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-gold);
		min-width: 28px;
		flex-shrink: 0;
	}

	.source-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}

	.source-title {
		font-size: 0.8rem;
		color: var(--color-foreground);
		text-decoration: underline;
		text-underline-offset: 2px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.source-title:hover {
		color: var(--color-gold);
	}

	.source-domain {
		font-size: 0.7rem;
		color: var(--color-text-light);
	}

	.verification-methodology {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		line-height: 1.5;
		margin: 0;
	}

	/* Actions */
	.compare-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: center;
		margin-top: 2.5rem;
	}
</style>
