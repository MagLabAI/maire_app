/**
 * Cloudflare Function: Grok-4 City Research API
 * ==============================================
 * On-demand research for any French city using Grok-4 with web + X search.
 *
 * GET /api/research/lyon
 * POST /api/research/lyon (with optional body for custom options)
 *
 * Cost: ~$0.20 per city (~5 web searches, ~1 X search)
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const XAI_RESPONSES_URL = 'https://api.x.ai/v1/responses';

// Pricing per 1M tokens (January 2026)
const PRICING = {
	input: 3.00,
	output: 15.00
};

function slugify(text: string): string {
	return text
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '') // Remove diacritics
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

async function callGrok(apiKey: string, cityName: string): Promise<{ data: any; usage: any }> {
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
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'grok-4',
			input: [{ role: 'user', content: fullPrompt }],
			tools: [
				{ type: 'web_search' },
				{ type: 'x_search' }
			]
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

	const usage = {
		...result.usage,
		web_searches: webSearches,
		x_searches: xSearches
	};

	// Parse JSON from response
	let jsonContent = content.trim();

	// Remove markdown code blocks if present
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

	return { data, usage };
}

function calculateCost(usage: any): { usd: number; eur: number; breakdown: any } {
	const inputTokens = usage.input_tokens || 0;
	const outputTokens = usage.output_tokens || 0;

	const inputCost = (inputTokens / 1_000_000) * PRICING.input;
	const outputCost = (outputTokens / 1_000_000) * PRICING.output;
	const totalCost = inputCost + outputCost;

	return {
		usd: Math.round(totalCost * 1000) / 1000,
		eur: Math.round(totalCost * 0.93 * 1000) / 1000,
		breakdown: {
			input_tokens: inputTokens,
			output_tokens: outputTokens,
			web_searches: usage.web_searches || 0,
			x_searches: usage.x_searches || 0
		}
	};
}

export const GET: RequestHandler = async ({ params, platform }) => {
	const cityName = decodeURIComponent(params.city);

	if (!cityName || cityName.length < 2) {
		throw error(400, 'City name required (minimum 2 characters)');
	}

	// Get API key from Cloudflare environment
	const apiKey = platform?.env?.XAI_API_KEY || platform?.env?.GROK_API_KEY;

	if (!apiKey) {
		throw error(500, 'XAI_API_KEY not configured');
	}

	try {
		const startTime = Date.now();
		const { data, usage } = await callGrok(apiKey, cityName);
		const duration = Date.now() - startTime;
		const cost = calculateCost(usage);

		return json({
			success: true,
			city: cityName,
			data,
			meta: {
				duration_ms: duration,
				cost,
				timestamp: new Date().toISOString()
			}
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Unknown error';
		throw error(500, `Research failed: ${message}`);
	}
};

export const POST: RequestHandler = async ({ params, platform, request }) => {
	// POST allows passing additional options in body (future use)
	return GET({ params, platform, request } as any);
};
