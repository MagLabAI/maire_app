/**
 * Scheduled Worker: Process Research Queue
 * =========================================
 * Runs every hour between 2am-6am UTC (3am-7am Paris).
 *
 * GET /api/_scheduled/process-queue
 *
 * Processing steps:
 * 1. Claim next pending job from research_queue
 * 2. Call Grok-4 with web + X search
 * 3. Store result in KV
 * 4. Update cities_metadata with next_refresh_at (+2 weeks)
 * 5. Check for stale cities needing auto-refresh
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const XAI_RESPONSES_URL = 'https://api.x.ai/v1/responses';
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

const PRICING = {
	input: 3.0,
	output: 15.0
};

function slugify(text: string): string {
	return text
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function buildPrompt(cityName: string): string {
	const slug = slugify(cityName);
	const now = new Date().toISOString();

	return `Tu es un expert en politique locale française. Effectue une recherche approfondie sur ${cityName}
dans le contexte des élections municipales de mars 2026.

GÉNÈRE UN JSON AU FORMAT EXACT SUIVANT (texte en français):

{
  "city": {
    "id": "${slug}",
    "slug": "${slug}",
    "name": "${cityName}",
    "department": "NUMÉRO (ex: 74)",
    "region": "NOM_RÉGION",
    "population": 0,
    "country": "FR",
    "seatsTotal": 0,
    "incumbent": {
      "name": "NOM COMPLET",
      "party": "CODE_PARTI (DVG, DVD, RN, etc.)",
      "since": ANNÉE,
      "age": ÂGE,
      "profession": "PROFESSION",
      "politicalBackground": "Parcours politique en français"
    },
    "listsCount": 0,
    "candidatesCount": 0,
    "previousResults": {
      "2020": {
        "turnout": 0.40,
        "winner": {
          "list": "NOM_LISTE",
          "candidate": "NOM",
          "party": "CODE",
          "voteShare": 0.50
        }
      }
    }
  },
  "cityInfo": {
    "name": "${cityName}",
    "department": "NOM_DÉPARTEMENT",
    "region": "NOM_RÉGION",
    "population": 0,
    "characteristics": [
      "Caractéristique 1 en français",
      "Caractéristique 2 en français"
    ],
    "economicProfile": "Description de l'économie locale en français",
    "notableFeatures": [
      "Site remarquable 1",
      "Site remarquable 2"
    ]
  },
  "incumbentAnalysis": {
    "name": "NOM_MAIRE",
    "party": "CODE_PARTI",
    "termStart": ANNÉE,
    "age": ÂGE,
    "mandateAssessment": {
      "majorAchievements": ["Réalisation 1", "Réalisation 2"],
      "controversies": ["Controverse 1"],
      "unfinishedProjects": ["Projet 1"],
      "publicPerception": "Description perception publique"
    },
    "reelectionLikelihood": {
      "runningAgain": true,
      "chancesEstimate": "Estimation en français",
      "mainChallenges": ["Défi 1", "Défi 2"]
    }
  },
  "politicalLandscape": {
    "historicalTendency": "Description tendance politique historique",
    "localPoliticalDynamics": "Description dynamique locale actuelle",
    "majorLocalParties": ["Parti 1", "Parti 2"]
  },
  "electoralContext": {
    "keyThemes": ["Thème 1", "Thème 2", "Thème 3", "Thème 4"],
    "campaignDynamics": "Description dynamique de campagne",
    "potentialAlliances": ["Alliance possible 1", "Alliance possible 2"],
    "voterExpectations": ["Attente 1", "Attente 2", "Attente 3"]
  },
  "candidates": [
    {
      "id": "prenom-nom",
      "firstName": "Prénom",
      "lastName": "Nom",
      "fullName": "Prénom Nom",
      "listName": "Nom de la liste",
      "listId": "nom-liste",
      "party": "CODE_PARTI",
      "partyFull": "Nom complet du parti",
      "isHead": true,
      "photo": null,
      "photoLegend": null,
      "demographics": {
        "age": 50,
        "gender": "M ou F",
        "profession": "Profession",
        "placeOfBirth": "Lieu de naissance"
      },
      "experience": {
        "currentMandate": {"role": "Rôle actuel", "since": 2020},
        "previousMandates": [
          {"role": "Ancien rôle", "from": 2014, "to": 2020}
        ],
        "totalYearsElected": 12
      },
      "stats": {
        "experienceScore": 70,
        "socialPresence": 60,
        "programClarity": 75
      },
      "rarity": "rare",
      "programHighlights": ["Point programme 1", "Point 2", "Point 3"],
      "positioning": "Positionnement politique en français",
      "strengths": ["Force 1", "Force 2"],
      "weaknesses": ["Faiblesse 1", "Faiblesse 2"],
      "chanceEstimate": "Estimation chances en français"
    }
  ],
  "localIssues": [
    {
      "rank": 1,
      "issue": "Nom de l'enjeu",
      "description": "Description en français",
      "affectedPopulation": "Population concernée",
      "currentStatus": "Statut actuel",
      "proposedSolutions": ["Solution 1", "Solution 2"]
    }
  ],
  "researchMethodology": "Analyse Grok grok-4 + Recherche en direct (web + X)",
  "lastUpdated": "${now}"
}

RÈGLES IMPORTANTES:
1. TOUT LE TEXTE DOIT ÊTRE EN FRANÇAIS
2. Génère 10 enjeux locaux (localIssues) avec rank 1 à 10
3. Inclus TOUS les candidats têtes de liste connus ou probables (minimum 3-5)
4. Pour chaque candidat, donne positioning, strengths, weaknesses et chanceEstimate
5. Calcule rarity: legendary (>20 ans expérience ou maire sortant), rare (>10 ans), common (autres)
6. Les stats (experienceScore, socialPresence, programClarity) sont sur 100
7. Reste factuel et équilibré politiquement
8. Focus sécurité: prévention, médiation, tranquillité publique (pas stigmatisant)

Réponds UNIQUEMENT avec le JSON, sans texte autour.`;
}

async function callGrok(
	apiKey: string,
	cityName: string
): Promise<{ data: unknown; usage: Record<string, number>; cost: number }> {
	const systemPrompt = `Tu es un expert en politique locale française. Tu génères des données structurées
pour une application web d'information électorale (maire.app).

Tu dois:
- Rechercher les informations les plus récentes via web et X (Twitter)
- Fournir des informations factuelles et équilibrées
- Rédiger tout le contenu en français soigné
- Respecter exactement le format JSON demandé

Sur la sécurité et l'immigration: focus sur prévention, médiation, tranquillité publique.
Évite tout discours stigmatisant.`;

	const prompt = buildPrompt(cityName);
	const fullPrompt = `${systemPrompt}\n\n${prompt}`;

	const response = await fetch(XAI_RESPONSES_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'grok-4',
			input: [{ role: 'user', content: fullPrompt }],
			tools: [{ type: 'web_search' }, { type: 'x_search' }]
		})
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Grok API error ${response.status}: ${errorText}`);
	}

	const result = await response.json();

	let content = '';
	let webSearches = 0;
	let xSearches = 0;

	for (const output of result.output || []) {
		const outputType = output.type || '';
		if (outputType === 'message') {
			for (const part of output.content || []) {
				const partType = part.type || '';
				if (partType === 'text' || partType === 'output_text') {
					content = part.text || '';
				}
			}
		} else if (outputType === 'web_search_call') {
			webSearches++;
		} else if (outputType === 'custom_tool_call') {
			xSearches++;
		}
	}

	// Parse JSON from response
	let jsonContent = content.trim();
	if (jsonContent.startsWith('```json')) {
		jsonContent = jsonContent.slice(7);
	} else if (jsonContent.startsWith('```')) {
		jsonContent = jsonContent.slice(3);
	}
	if (jsonContent.endsWith('```')) {
		jsonContent = jsonContent.slice(0, -3);
	}
	jsonContent = jsonContent.trim();

	const data = JSON.parse(jsonContent);

	// Calculate cost
	const inputTokens = result.usage?.input_tokens || 0;
	const outputTokens = result.usage?.output_tokens || 0;
	const inputCost = (inputTokens / 1_000_000) * PRICING.input;
	const outputCost = (outputTokens / 1_000_000) * PRICING.output;
	const cost = Math.round((inputCost + outputCost) * 1000) / 1000;

	return {
		data,
		usage: {
			input_tokens: inputTokens,
			output_tokens: outputTokens,
			web_searches: webSearches,
			x_searches: xSearches
		},
		cost
	};
}

export const GET: RequestHandler = async ({ platform }) => {
	const db = platform?.env?.DB;
	const kv = platform?.env?.CITY_DATA;
	const apiKey = platform?.env?.XAI_API_KEY || platform?.env?.GROK_API_KEY;

	if (!db || !kv) {
		throw error(503, 'Database or KV not configured');
	}

	if (!apiKey) {
		throw error(500, 'XAI_API_KEY not configured');
	}

	// 1. First, queue any stale cities needing refresh
	const staleCity = await db
		.prepare(
			`
		SELECT city_slug, city_name FROM cities_metadata
		WHERE next_refresh_at < datetime('now')
		AND data_source = 'kv'
		ORDER BY next_refresh_at ASC
		LIMIT 1
	`
		)
		.first<{ city_slug: string; city_name: string }>();

	if (staleCity) {
		// Check if not already in queue
		const inQueue = await db
			.prepare(
				`SELECT id FROM research_queue WHERE city_slug = ? AND status IN ('pending', 'processing')`
			)
			.bind(staleCity.city_slug)
			.first();

		if (!inQueue) {
			await db
				.prepare(
					`INSERT INTO research_queue (city_slug, city_name, priority, request_source)
				 VALUES (?, ?, 5, 'auto-refresh')`
				)
				.bind(staleCity.city_slug, staleCity.city_name)
				.run();
		}
	}

	// 2. Claim next pending job (atomic update using transaction-like behavior)
	const job = await db
		.prepare(
			`
		UPDATE research_queue
		SET status = 'processing', started_at = datetime('now')
		WHERE id = (
			SELECT id FROM research_queue
			WHERE status = 'pending'
			ORDER BY priority DESC, requested_at ASC
			LIMIT 1
		)
		RETURNING id, city_slug, city_name, request_source
	`
		)
		.first<{ id: number; city_slug: string; city_name: string; request_source: string }>();

	if (!job) {
		return json({
			processed: 0,
			message: 'No pending jobs in queue',
			staleQueued: staleCity ? staleCity.city_slug : null
		});
	}

	// 3. Run Grok-4 research
	const startTime = Date.now();
	try {
		const { data, usage, cost } = await callGrok(apiKey, job.city_name);
		const duration = Date.now() - startTime;

		// 4. Store in KV
		const kvKey = `city:municipales-2026:${job.city_slug}`;
		await kv.put(kvKey, JSON.stringify(data));

		// 5. Update cities_metadata
		const twoWeeksLater = new Date(Date.now() + TWO_WEEKS_MS).toISOString();
		await db
			.prepare(
				`
			INSERT INTO cities_metadata (city_slug, city_name, data_source, kv_key, last_researched_at, next_refresh_at, research_cost_usd)
			VALUES (?, ?, 'kv', ?, datetime('now'), ?, ?)
			ON CONFLICT(city_slug) DO UPDATE SET
				data_source = 'kv',
				kv_key = excluded.kv_key,
				last_researched_at = datetime('now'),
				next_refresh_at = excluded.next_refresh_at,
				research_cost_usd = cities_metadata.research_cost_usd + excluded.research_cost_usd,
				updated_at = datetime('now')
		`
			)
			.bind(job.city_slug, job.city_name, kvKey, twoWeeksLater, cost)
			.run();

		// 6. Mark job complete
		await db
			.prepare(
				`UPDATE research_queue
			 SET status = 'completed', completed_at = datetime('now')
			 WHERE id = ?`
			)
			.bind(job.id)
			.run();

		return json({
			processed: 1,
			city: job.city_name,
			citySlug: job.city_slug,
			source: job.request_source,
			duration_ms: duration,
			cost_usd: cost,
			usage,
			nextRefresh: twoWeeksLater
		});
	} catch (e) {
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';
		const duration = Date.now() - startTime;

		// Update retry count and check if should mark as failed
		const retryResult = await db
			.prepare(
				`UPDATE research_queue
			 SET retry_count = retry_count + 1
			 WHERE id = ?
			 RETURNING retry_count`
			)
			.bind(job.id)
			.first<{ retry_count: number }>();

		const maxRetries = 3;
		if (retryResult && retryResult.retry_count >= maxRetries) {
			// Mark as failed after max retries
			await db
				.prepare(
					`UPDATE research_queue
				 SET status = 'failed', completed_at = datetime('now'), error_message = ?
				 WHERE id = ?`
				)
				.bind(errorMessage, job.id)
				.run();
		} else {
			// Reset to pending for retry
			await db
				.prepare(
					`UPDATE research_queue
				 SET status = 'pending', started_at = NULL
				 WHERE id = ?`
				)
				.bind(job.id)
				.run();
		}

		return json(
			{
				processed: 0,
				city: job.city_name,
				error: errorMessage,
				duration_ms: duration,
				retryCount: retryResult?.retry_count || 1,
				willRetry: (retryResult?.retry_count || 1) < maxRetries
			},
			{ status: 500 }
		);
	}
};
