/**
 * City Interest Counter API
 * =========================
 * Tracks user interest in cities without candidate data.
 * Increments a D1 counter per city slug. No auth, no cookies.
 * Rate limiting via D1 (no KV writes — avoids free tier limits).
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

	// Rate limiting via D1 — deduplicate by city+IP, ignore repeats within 1h
	const ip = request.headers.get('cf-connecting-ip') || 'unknown';
	const ipHash = ip.slice(-8);
	const recent = await db.prepare(
		`SELECT 1 FROM city_interest_log
		 WHERE city_slug = ?1 AND ip_hash = ?2 AND created_at > datetime('now', '-1 hour')
		 LIMIT 1`
	).bind(city, ipHash).first();

	if (recent) {
		return new Response(null, { status: 429 });
	}

	// Log this interest event + upsert the counter
	await db.batch([
		db.prepare(
			`INSERT INTO city_interest_log (city_slug, ip_hash, created_at)
			 VALUES (?1, ?2, datetime('now'))`
		).bind(city, ipHash),
		db.prepare(
			`INSERT INTO city_interest (city_slug, count, last_at)
			 VALUES (?1, 1, datetime('now'))
			 ON CONFLICT(city_slug) DO UPDATE SET
			   count = count + 1,
			   last_at = datetime('now')`
		).bind(city)
	]);

	return new Response(null, { status: 204 });
};
