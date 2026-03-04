/**
 * Newsletter Registration API
 * ============================
 * Registers email for pre-launch updates.
 * Validates email format + Cloudflare Turnstile token.
 *
 * POST /api/newsletter
 * Body: { email, token }
 *
 * - 200: Subscribed
 * - 400: Validation error
 * - 409: Already subscribed
 * - 503: D1 unavailable
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
	const res = await fetch(TURNSTILE_VERIFY_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ secret, response: token, remoteip: ip })
	});
	const data: { success: boolean } = await res.json();
	return data.success;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	let body: { email?: string; token?: string };
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Corps de requête invalide');
	}

	const email = body.email?.trim().toLowerCase();
	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		throw error(400, 'Adresse email invalide');
	}

	// Turnstile verification (skip in dev if no secret configured)
	const secret = platform?.env?.TURNSTILE_SECRET;
	if (secret) {
		const token = body.token;
		if (!token) throw error(400, 'Vérification anti-bot requise');

		const ip = request.headers.get('cf-connecting-ip') || '';
		const valid = await verifyTurnstile(token, secret, ip);
		if (!valid) throw error(400, 'Vérification anti-bot échouée. Veuillez réessayer.');
	}

	const db = platform?.env?.DB;
	if (!db) throw error(503, 'Service temporairement indisponible');

	// Check for existing subscription
	const existing = await db
		.prepare('SELECT id FROM newsletter_subscribers WHERE email = ?')
		.bind(email)
		.first();

	if (existing) {
		return json({ success: true, message: 'Vous êtes déjà inscrit(e) !' });
	}

	await db
		.prepare('INSERT INTO newsletter_subscribers (email) VALUES (?)')
		.bind(email)
		.run();

	return json({ success: true, message: 'Inscription confirmée ! Vous recevrez nos actualités.' });
};
