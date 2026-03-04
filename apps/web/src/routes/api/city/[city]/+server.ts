/**
 * City Data API
 * ==============
 * Returns city data from static JSON, KV, or queues for research.
 *
 * Resolution order (individual files take priority — they have richer data):
 * 1. Individual file: /data/cities/{slug}.json (974 research/wikipedia cities)
 * 2. Department bundle: slug-map → /data/departments/{dept}.json (33,772 baseline cities)
 * 3. Legacy election-specific path
 * 4. KV namespace (dynamically researched)
 * 5. Research queue (D1)
 *
 * Response status:
 * - 200: City data found (static or KV)
 * - 202: City queued for research
 * - 400: Invalid city slug
 * - 429: Rate limited
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

const RATE_LIMIT_PER_HOUR = 10;

function slugify(text: string): string {
	return text
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

async function checkRateLimit(kv: KVNamespace, ip: string): Promise<boolean> {
	const key = `rate:queue:${ip}`;
	const current = await kv.get(key);
	const count = current ? parseInt(current) : 0;

	if (count >= RATE_LIMIT_PER_HOUR) {
		return false;
	}

	await kv.put(key, String(count + 1), { expirationTtl: 3600 });
	return true;
}

async function getQueuePosition(db: D1Database, citySlug: string): Promise<number | null> {
	const result = await db
		.prepare(
			`
		SELECT COUNT(*) as position FROM research_queue
		WHERE status = 'pending'
		AND (priority > (SELECT priority FROM research_queue WHERE city_slug = ? AND status = 'pending')
		     OR (priority = (SELECT priority FROM research_queue WHERE city_slug = ? AND status = 'pending')
		         AND requested_at < (SELECT requested_at FROM research_queue WHERE city_slug = ? AND status = 'pending')))
	`
		)
		.bind(citySlug, citySlug, citySlug)
		.first<{ position: number }>();

	return result ? result.position + 1 : null;
}

export const GET: RequestHandler = async ({ params, platform, fetch, request, url }) => {
	const citySlug = slugify(decodeURIComponent(params.city));
	const election = url.searchParams.get('election') || 'municipales-2026';

	if (!citySlug || citySlug.length < 2) {
		throw error(400, 'Nom de ville invalide');
	}

	const db = platform?.env?.DB;
	const kv = platform?.env?.CITY_DATA;

	// 1. Smart resolution: individual file (enriched) takes priority over department bundle (baseline).
	// Individual files have research/wikipedia data; bundles only baseline.
	try {
		const cityRes = await fetch(`/data/cities/${citySlug}.json`);
		if (cityRes.ok) {
			const data = await cityRes.json();
			return json({ status: 'ready', source: 'static', data });
		}
	} catch {
		// No individual file, try department bundle
	}

	try {
		const mapRes = await fetch('/data/slug-map.json');
		if (mapRes.ok) {
			const slugMap: Record<string, string> = await mapRes.json();
			const dept = slugMap[citySlug];
			if (dept) {
				const deptRes = await fetch(`/data/departments/${dept}.json`);
				if (deptRes.ok) {
					const deptData: Record<string, unknown> = await deptRes.json();
					if (deptData[citySlug]) {
						return json({ status: 'ready', source: 'static', data: deptData[citySlug] });
					}
				}
			}
		}
	} catch {
		// Fall through to legacy paths
	}

	// 2. Legacy fallback: election-specific path
	try {
		const legacyRes = await fetch(`/data/${election}/cities/${citySlug}.json`);
		if (legacyRes.ok) {
			const data = await legacyRes.json();
			return json({ status: 'ready', source: 'static', data });
		}
	} catch {
		// Fall through
	}

	// 3. Check KV for dynamically researched cities
	if (kv) {
		const kvKey = `city:${election}:${citySlug}`;
		const kvData = await kv.get(kvKey, 'json');
		if (kvData) {
			return json({
				status: 'ready',
				source: 'kv',
				data: kvData
			});
		}
	}

	// 4. City not found - check if already in queue
	if (db) {
		const existing = await db
			.prepare(
				`SELECT id, status, requested_at FROM research_queue
			 WHERE city_slug = ? AND status IN ('pending', 'processing')
			 LIMIT 1`
			)
			.bind(citySlug)
			.first<{ id: number; status: string; requested_at: string }>();

		if (existing) {
			const position = existing.status === 'pending' ? await getQueuePosition(db, citySlug) : 0;
			return json(
				{
					status: 'queued',
					queueStatus: existing.status,
					queuePosition: position,
					requestedAt: existing.requested_at,
					message:
						existing.status === 'processing'
							? 'Recherche en cours...'
							: `En file d'attente (position ${position})`
				},
				{ status: 202 }
			);
		}

		// 5. Rate limit check before adding to queue
		const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';
		if (kv && !(await checkRateLimit(kv, clientIP))) {
			throw error(429, 'Trop de demandes. Réessayez dans une heure.');
		}

		// 6. Add to research queue
		const cityName = decodeURIComponent(params.city);
		try {
			await db
				.prepare(
					`INSERT INTO research_queue (city_slug, city_name, priority, request_source, requester_ip)
				 VALUES (?, ?, 10, 'user', ?)`
				)
				.bind(citySlug, cityName, clientIP)
				.run();

			await db
				.prepare(
					`INSERT OR IGNORE INTO cities_metadata (city_slug, city_name, data_source)
				 VALUES (?, ?, 'pending')`
				)
				.bind(citySlug, cityName)
				.run();

			const position = await getQueuePosition(db, citySlug);

			return json(
				{
					status: 'queued',
					queueStatus: 'pending',
					queuePosition: position,
					message: `Ville ajoutée à la file de recherche (position ${position})`
				},
				{ status: 202 }
			);
		} catch {
			const recheckQueue = await db
				.prepare(
					`SELECT status FROM research_queue WHERE city_slug = ? AND status IN ('pending', 'processing')`
				)
				.bind(citySlug)
				.first<{ status: string }>();

			if (recheckQueue) {
				return json(
					{
						status: 'queued',
						queueStatus: recheckQueue.status,
						message: 'Recherche déjà en cours'
					},
					{ status: 202 }
				);
			}

			throw error(500, 'Erreur lors de la mise en file');
		}
	}

	throw error(503, 'Service temporairement indisponible');
};
