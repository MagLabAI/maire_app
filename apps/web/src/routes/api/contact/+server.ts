/**
 * Contact/Error Report API
 * ========================
 * Receives error reports from the /corrections page contact form.
 *
 * POST /api/contact
 * Body: { name, email, pageUrl, category, message }
 *
 * - 200: Report saved
 * - 400: Validation error
 * - 429: Rate limited (5/email/day)
 * - 503: D1 unavailable
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const RATE_LIMIT_PER_DAY = 5;

interface ContactBody {
	name?: string;
	email?: string;
	pageUrl?: string;
	category?: string;
	message?: string;
}

const VALID_CATEGORIES = ['factual_error', 'missing_info', 'candidate_request', 'city_request', 'other'];

export const POST: RequestHandler = async ({ request, platform }) => {
	let body: ContactBody;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Corps de requête invalide');
	}

	const name = body.name?.trim();
	const email = body.email?.trim().toLowerCase();
	const pageUrl = body.pageUrl?.trim() || null;
	const category = VALID_CATEGORIES.includes(body.category || '') ? body.category : 'other';
	const message = body.message?.trim();

	if (!name || name.length < 2) throw error(400, 'Nom requis (2 caractères minimum)');
	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw error(400, 'Email invalide');
	if (!message || message.length < 10) throw error(400, 'Message requis (10 caractères minimum)');

	const db = platform?.env?.DB;
	if (!db) throw error(503, 'Service temporairement indisponible');

	// Rate limit: 5 reports per email per day
	const today = new Date().toISOString().split('T')[0];
	const countResult = await db
		.prepare(
			`SELECT COUNT(*) as cnt FROM contact_reports
			 WHERE email = ? AND created_at >= ?`
		)
		.bind(email, today)
		.first<{ cnt: number }>();

	if (countResult && countResult.cnt >= RATE_LIMIT_PER_DAY) {
		throw error(429, 'Limite de 5 signalements par jour atteinte. Réessayez demain.');
	}

	await db
		.prepare(
			`INSERT INTO contact_reports (name, email, page_url, category, message)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(name, email, pageUrl, category, message)
		.run();

	return json({ success: true, message: 'Signalement enregistré. Merci pour votre contribution.' });
};
