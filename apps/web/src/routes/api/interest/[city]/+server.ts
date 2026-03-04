/**
 * City Interest Counter API
 * =========================
 * Tracks user interest in cities without candidate data.
 * Increments a D1 counter per city slug. No auth, no cookies.
 *
 * POST /api/interest/[city]
 * - 204: Interest recorded
 * - 429: Rate limited (1/city/IP/hour)
 * - 503: D1 unavailable
 */

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, platform, request }) => {
	const city = params.city;
	if (!city || city.length > 100) {
		return new Response(null, { status: 400 });
	}

	const db = platform?.env?.DB;
	if (!db) {
		return new Response(null, { status: 503 });
	}

	// Simple IP-based rate limiting via KV (1 interest per city per IP per hour)
	const kv = platform?.env?.CITY_DATA;
	const ip = request.headers.get('cf-connecting-ip') || 'unknown';
	const rateKey = `interest-rate:${city}:${ip}`;

	if (kv) {
		const existing = await kv.get(rateKey);
		if (existing) {
			return new Response(null, { status: 429 });
		}
		await kv.put(rateKey, '1', { expirationTtl: 3600 });
	}

	// Upsert counter in D1
	await db.prepare(
		`INSERT INTO city_interest (city_slug, count, last_at)
		 VALUES (?1, 1, datetime('now'))
		 ON CONFLICT(city_slug) DO UPDATE SET
		   count = count + 1,
		   last_at = datetime('now')`
	).bind(city).run();

	return new Response(null, { status: 204 });
};
