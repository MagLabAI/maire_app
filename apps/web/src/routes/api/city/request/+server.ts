/**
 * City Request API
 * =================
 * Allows authenticated users to request research for a new city.
 *
 * POST /api/city/request
 * Body: { cityName: string }
 *
 * Response:
 * - 200: City queued successfully
 * - 400: Invalid city name or city doesn't exist in France
 * - 401: Not authenticated
 * - 409: City already exists or already in queue
 * - 429: Rate limited
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const GEO_API_URL = 'https://geo.api.gouv.fr/communes';
const RATE_LIMIT_PER_DAY = 5;

interface GeoApiCity {
	nom: string;
	code: string;
	population: number;
	departement: { code: string; nom: string };
	region: { code: string; nom: string };
}

function slugify(text: string): string {
	return text
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

async function validateCityWithGeoApi(cityName: string): Promise<GeoApiCity | null> {
	const params = new URLSearchParams({
		nom: cityName,
		fields: 'nom,code,population,departement,region',
		boost: 'population',
		limit: '5'
	});

	const res = await fetch(`${GEO_API_URL}?${params}`);
	if (!res.ok) return null;

	const cities: GeoApiCity[] = await res.json();
	if (!cities.length) return null;

	// Find exact match (case-insensitive) or best match
	const exactMatch = cities.find(
		(c) => c.nom.toLowerCase() === cityName.toLowerCase()
	);
	return exactMatch || cities[0];
}

async function checkRateLimit(kv: KVNamespace, userId: string): Promise<boolean> {
	const key = `rate:request:${userId}`;
	const current = await kv.get(key);
	const count = current ? parseInt(current) : 0;

	if (count >= RATE_LIMIT_PER_DAY) {
		return false;
	}

	// Expires at midnight UTC
	const now = new Date();
	const midnight = new Date(now);
	midnight.setUTCHours(24, 0, 0, 0);
	const ttl = Math.floor((midnight.getTime() - now.getTime()) / 1000);

	await kv.put(key, String(count + 1), { expirationTtl: Math.max(ttl, 60) });
	return true;
}

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	// 1. Check authentication
	const user = locals.user;
	if (!user) {
		throw error(401, 'Connexion requise pour demander une recherche de ville');
	}

	// 2. Parse and validate request body
	let body: { cityName?: string };
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Corps de requête invalide');
	}

	const cityName = body.cityName?.trim();
	if (!cityName || cityName.length < 2) {
		throw error(400, 'Nom de ville invalide');
	}

	const db = platform?.env?.DB;
	const kv = platform?.env?.CITY_DATA;

	if (!db || !kv) {
		throw error(503, 'Service temporairement indisponible');
	}

	// 3. Rate limit check
	const userKey = user.email.replace(/[^a-z0-9]/gi, '-');
	if (!(await checkRateLimit(kv, userKey))) {
		throw error(429, 'Limite de 5 demandes par jour atteinte. Réessayez demain.');
	}

	// 4. Validate city exists in France via geo.api.gouv.fr
	const geoCity = await validateCityWithGeoApi(cityName);
	if (!geoCity) {
		throw error(400, `Ville "${cityName}" non trouvée dans le référentiel français`);
	}

	const citySlug = slugify(geoCity.nom);
	const officialName = geoCity.nom;

	// 5. Check if city already has data (static or KV)
	const kvKey = `city:municipales-2026:${citySlug}`;
	const existingData = await kv.get(kvKey);
	if (existingData) {
		throw error(409, `La ville "${officialName}" est déjà disponible`);
	}

	// 6. Check if already in queue
	const existingQueue = await db
		.prepare(
			`SELECT id, status FROM research_queue
			 WHERE city_slug = ? AND status IN ('pending', 'processing')
			 LIMIT 1`
		)
		.bind(citySlug)
		.first<{ id: number; status: string }>();

	if (existingQueue) {
		throw error(409, `La ville "${officialName}" est déjà en file d'attente`);
	}

	// 7. Add to research queue with user info
	try {
		await db
			.prepare(
				`INSERT INTO research_queue (city_slug, city_name, priority, request_source, requester_ip)
				 VALUES (?, ?, 15, 'authenticated-user', ?)`
			)
			.bind(citySlug, officialName, user.email)
			.run();

		// Also add to cities_metadata
		await db
			.prepare(
				`INSERT OR IGNORE INTO cities_metadata (city_slug, city_name, data_source)
				 VALUES (?, ?, 'pending')`
			)
			.bind(citySlug, officialName)
			.run();

		// Get queue position
		const position = await db
			.prepare(
				`SELECT COUNT(*) as pos FROM research_queue
				 WHERE status = 'pending'
				 AND (priority > 15 OR (priority = 15 AND requested_at <= (
					 SELECT requested_at FROM research_queue WHERE city_slug = ? AND status = 'pending'
				 )))`
			)
			.bind(citySlug)
			.first<{ pos: number }>();

		return json({
			success: true,
			message: `Ville "${officialName}" ajoutée à la file de recherche`,
			city: {
				name: officialName,
				slug: citySlug,
				department: geoCity.departement.nom,
				region: geoCity.region.nom,
				population: geoCity.population
			},
			queuePosition: position?.pos || 1,
			requestedBy: user.email
		});
	} catch (e) {
		// Check if it's a duplicate error
		const recheckQueue = await db
			.prepare(
				`SELECT status FROM research_queue WHERE city_slug = ? AND status IN ('pending', 'processing')`
			)
			.bind(citySlug)
			.first<{ status: string }>();

		if (recheckQueue) {
			throw error(409, `La ville "${officialName}" est déjà en file d'attente`);
		}

		throw error(500, 'Erreur lors de l\'ajout à la file');
	}
};
