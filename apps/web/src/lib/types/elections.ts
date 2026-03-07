/**
 * Type definitions for maire.app election data
 * Supports French elections: municipal, legislative, presidential, european
 */

export interface Region {
	id: string;
	slug: string;
	name: string;
	code: string;
	departments: string[];
}

export interface Department {
	name: string;
	region: string;
}

export interface RegionsData {
	regions: Region[];
	departments: Record<string, Department>;
}

export type ElectionType = 'municipal' | 'european' | 'legislative' | 'presidential';
export type ElectionScope = 'city' | 'constituency' | 'national';

export interface Election {
	id: string;
	slug: string;
	name: string;
	nameShort: string;
	type: ElectionType;
	country: 'FR' | 'EU';
	dates: {
		round1: string;
		round2?: string;
		candidateDeadline?: string;
	};
	status: 'past' | 'upcoming' | 'active' | 'future';
	citiesCount?: number;
	candidatesCount?: number;
	dataPath?: string;
	scope?: ElectionScope;
	hasLists?: boolean;
	rounds?: 1 | 2;
}

export interface City {
	slug: string;
	name: string;
	inseeCode?: string;
	department: string;
	region: string;
	population: number;
	lat?: number;
	lon?: number;
	incumbent?: IncumbentInfo;
	mayorChange?: MayorChange;
	listsCount: number;
	candidatesCount: number;
}

/**
 * Mayor changed since 2020 election (from elus-maires-mai.csv)
 */
export interface MayorChange {
	electedMayor2020: string;
	currentMayor: string;
	changeDate: string;
}

/**
 * Extended city information from deep research
 */
export interface CityInfo {
	name: string;
	department: string;
	region: string;
	population: number;
	characteristics?: string[];
	economicProfile?: string;
	notableFeatures?: string[];
}

/**
 * Incumbent mayor information
 */
export interface IncumbentInfo {
	name: string;
	party: string;
	since?: number;
	age?: number;
	profession?: string;
	politicalBackground?: string;
}

/**
 * Mandate assessment from research
 */
export interface MandateAssessment {
	majorAchievements?: string[];
	controversies?: string[];
	unfinishedProjects?: string[];
	publicPerception?: string;
}

/**
 * Reelection likelihood analysis
 */
export interface ReelectionLikelihood {
	runningAgain: boolean;
	chancesEstimate?: string;
	strengths?: string[];
	weaknesses?: string[];
}

/**
 * Full incumbent analysis
 */
export interface IncumbentAnalysis {
	currentMayor: IncumbentInfo;
	mandateAssessment?: MandateAssessment;
	reelectionLikelihood?: ReelectionLikelihood;
}

/**
 * Recent election result
 */
export interface RecentElectionResult {
	winner: string;
	score?: string;
	turnout?: string;
}

/**
 * Political landscape analysis
 */
export interface PoliticalLandscape {
	historicalTendency?: string;
	recentElections?: {
		municipales2020?: RecentElectionResult;
		otherRelevant?: string[];
	};
	keyPoliticalFigures?: string[];
	localPoliticalDynamics?: string;
}

/**
 * Electoral context for upcoming election
 */
export interface ElectoralContext {
	keyThemes?: string[];
	potentialAlliances?: string[];
	campaignDynamics?: string;
	voterExpectations?: string[];
	turnoutPrediction?: string;
	decisiveFactors?: string[];
}

/**
 * Urban development status
 */
export interface UrbanDevelopment {
	majorProjects?: string[];
	housingSituation?: string;
	transportChallenges?: string[];
}

/**
 * Security and tranquility assessment
 */
export interface SecurityAssessment {
	perception?: string;
	mainConcerns?: string[];
	preventionInitiatives?: string[];
}

export interface CandidateList {
	id: string;
	name: string;
	nuance: string; // Official political nuance code (DVG, DVD, etc.)
	headCandidate: string;
	candidatesCount: number;
	programUrl?: string;
	socialLinks?: SocialLinks;
}

export interface Candidate {
	id: string;
	firstName: string;
	lastName: string;
	fullName: string;
	listId: string;
	position: number;
	isHead: boolean;
	photo?: string;
	photoLegend?: string; // Photo credit/source (e.g., Wikipedia commons)
	demographics: {
		birthYear: number;
		age: number;
		gender: 'M' | 'F';
		profession: string;
		professionCategory: string;
	};
	experience: {
		currentMandate?: Mandate;
		previousMandates: Mandate[];
		totalYearsElected: number;
	};
	stats: {
		experienceScore: number; // 0-100
		socialPresence: number; // 0-100
		programClarity: number; // 0-100
	};
	rarity: 'common' | 'rare' | 'legendary';
	programHighlights?: string[];
	socialLinks?: SocialLinks;
	// Research analysis
	positioning?: string;
	strengths?: string[];
	weaknesses?: string[];
	chanceEstimate?: string;
}

export interface Mandate {
	role: string;
	since?: number;
	from?: number;
	to?: number;
	yearsInRole?: number;
}

export interface SocialLinks {
	twitter?: string;
	facebook?: string;
	instagram?: string;
	linkedin?: string;
	website?: string;
}

export interface LocalIssue {
	rank: number;
	issue: string;
	description?: string;
	affectedPopulation?: string;
	currentStatus?: string;
	proposedSolutions?: string[];
}

/**
 * Detailed challenges/concerns arrays from research
 */
export interface ChallengesAnalysis {
	economicChallenges?: string[];
	environmentalConcerns?: string[];
	socialIssues?: string[];
}

export interface SourceRef {
	id: number;
	url: string;
	title: string;
	source: string;
}

export interface SourcedClaim {
	path: string;
	claim: string;
	status: 'confirmed' | 'reported';
	sources: string[];
}

export interface UnsourcedClaim {
	path: string;
	claim: string;
	severity: 'high' | 'medium' | 'low';
}

export interface VerificationData {
	status: string;
	totalClaims: number;
	confirmedClaims: number;
	reportedClaims: number;
	unverifiedClaims: number;
	confirmationRate: string;
	sourcedClaims?: SourcedClaim[];
	unsourcedClaims: UnsourcedClaim[];
}

/**
 * Correction applied to a city's data (traceable field-level edit)
 */
export interface Correction {
	id: string;
	date: string;
	field: string;
	before: string;
	after: string;
	reason: string;
	source: string;
	issueUrl?: string;
	verifiedBy: 'ai' | 'human' | 'both';
}

/**
 * Official results for a single election round
 */
export interface RoundResult {
	date: string;
	turnout: number;
	registeredVoters: number;
	abstention: number;
	blankVotes?: number;
	nullVotes?: number;
}

/**
 * A list's result in one round (votes, share, seats, qualification status)
 */
export interface ListResult {
	listId: string;
	listName: string;
	headCandidate: string;
	party: string;
	votes: number;
	voteShare: number;
	seats?: number;
	qualified?: boolean;
	merged?: boolean;
	mergedWith?: string[];
	withdrawn?: boolean;
}

/**
 * Full election results across rounds (populated as official results come in)
 */
export interface ElectionResults {
	round1?: {
		info: RoundResult;
		lists: ListResult[];
	};
	round2?: {
		info: RoundResult;
		lists: ListResult[];
		alliances?: Array<{
			name: string;
			listIds: string[];
			description: string;
		}>;
	};
	winner?: {
		listId: string;
		candidate: string;
		party: string;
		voteShare: number;
		seats: number;
	};
	status:
		| 'pre-campaign'
		| 'campaign'
		| 'round1-results'
		| 'between-rounds'
		| 'round2-results'
		| 'final';
}

/**
 * Official candidate list from data.gouv.fr (raw declaration, no AI processing)
 */
export interface OfficialCandidate {
	order: number;
	firstName: string;
	lastName: string;
	gender: 'M' | 'F';
}

export interface OfficialList {
	panelNumber: number;
	name: string;
	shortName: string;
	nuance?: string;
	nuanceLabel?: string;
	headCandidate: string;
	candidates: OfficialCandidate[];
}

export interface CityData {
	city: City & {
		seatsTotal: number;
		previousResults?: Record<string, PreviousResult>;
	};
	lists: CandidateList[];
	candidates: Candidate[];
	localIssues?: LocalIssue[];
	lastUpdated: string;
	// Extended research data
	cityInfo?: CityInfo;
	incumbentAnalysis?: IncumbentAnalysis;
	politicalLandscape?: PoliticalLandscape;
	electoralContext?: ElectoralContext;
	urbanDevelopment?: UrbanDevelopment;
	challenges?: ChallengesAnalysis;
	securityAssessment?: SecurityAssessment;
	researchMethodology?: string;
	// Official election results (populated when results come in)
	results?: ElectionResults;
	// Official candidate lists from data.gouv.fr
	officialLists?: OfficialList[];
	// Baseline data embedded by populate_cities.py
	baselineStats?: Record<string, number>;
	debtData?: {
		debt2019?: number;
		debt2024?: number;
		perHab2019?: number;
		perHab2024?: number;
		perHabDelta?: number;
		nationalMedianDelta?: number;
	};
	climateData?: Record<string, Record<string, [number | null, number | null, number | null]>>;
	_dataTier?: 'baseline' | 'wikipedia' | 'research';
	// Citation verification data
	_sources?: SourceRef[];
	_verification?: VerificationData;
	_corrections?: Correction[];
	_metadata?: {
		provider?: string;
		citationPass?: boolean;
		costs?: Record<string, number>;
	};
}

export interface PreviousResult {
	turnout: number;
	winner: {
		list: string;
		candidate: string;
		party: string;
		voteShare: number;
	};
	council?: { firstName: string; lastName: string; gender: string }[];
}

/**
 * Per-region baseline data for a single commune.
 * Built by build_baseline_data.py → scripts/data_gouv/baseline/{region}.json.
 * Embedded into city JSONs by populate_cities.py (baselineStats, climateData, debtData).
 * Climate arrays are [median, low, high] for compactness.
 */
export interface BaselineCommune {
	name: string;
	slug: string;
	inseeCode: string;
	department: string;
	population: number;
	stats?: {
		medianIncome?: number;
		jobs?: number;
		popGrowth?: number;
		birthRate?: number;
		bac5Rate?: number;
		bacRate?: number;
		mainResidenceRate?: number;
		overcrowdingRate?: number;
		industryRate?: number;
		constructionRate?: number;
		servicesRate?: number;
		publicSectorRate?: number;
		agricultureRate?: number;
		distanceIntermediate?: number;
		distanceProximity?: number;
		distanceSuperior?: number;
		nurses?: number;
		pharmacies?: number;
		doctors?: number;
		schools?: number;
	};
	debt?: {
		debt2019?: number;
		debt2024?: number;
		perHab2019?: number;
		perHab2024?: number;
		perHabDelta?: number;
		nationalMedianDelta?: number;
	};
	election2020?: {
		round: number;
		turnoutPct: number | null;
		registered: number | null;
		lists: Array<{
			head: string;
			party: string;
			name?: string;
			votePct?: number;
			seats?: number;
		}>;
	};
	climate?: Record<string, Record<string, [number | null, number | null, number | null]>>;
}

export interface RegionBaseline {
	region: string;
	regionName: string;
	communes: Record<string, BaselineCommune>;
}

// Rarity calculation helpers
export type Rarity = 'common' | 'rare' | 'legendary';

export function calculateRarity(candidate: Candidate): Rarity {
	let score = 0;

	// Experience (max 40 points)
	const yearsElected = candidate.experience.totalYearsElected;
	score += Math.min(yearsElected * 2, 40);

	// Current position (max 25 points)
	if (candidate.experience.currentMandate) {
		const role = candidate.experience.currentMandate.role.toLowerCase();
		if (role.includes('maire')) score += 25;
		else if (role.includes('adjoint')) score += 15;
		else if (role.includes('conseiller')) score += 8;
	}

	// List position (max 15 points)
	if (candidate.isHead) score += 15;
	else if (candidate.position <= 3) score += 10;
	else if (candidate.position <= 10) score += 5;

	// Legacy stats (may be empty on newer research data)
	score += Math.floor((candidate.stats?.socialPresence || 0) / 10);
	score += Math.floor((candidate.stats?.programClarity || 0) / 10);

	const finalScore = Math.min(score, 100);

	if (finalScore >= 80) return 'legendary';
	if (finalScore >= 50) return 'rare';
	return 'common';
}
