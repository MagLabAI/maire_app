import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeCodeForTokens, getGoogleUser, createSession, isEmailAllowed } from '$lib/auth';
import { getAuthUrl } from '$lib/config';

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');

	// Clear OAuth state cookie
	cookies.delete('oauth_state', { path: '/' });

	// Validate state for CSRF protection
	if (!state || state !== storedState) {
		error(400, 'Invalid OAuth state');
	}

	if (!code) {
		error(400, 'Missing authorization code');
	}

	// Parse return URL from state
	let returnUrl = '/';
	try {
		const stateData = JSON.parse(atob(state));
		if (stateData.returnUrl && stateData.returnUrl.startsWith('/')) {
			returnUrl = stateData.returnUrl;
		}
	} catch {
		// Old format state (just UUID) - default to home
	}

	const clientId = platform?.env.GOOGLE_CLIENT_ID;
	const clientSecret = platform?.env.GOOGLE_CLIENT_SECRET;
	const sessionSecret = platform?.env.SESSION_SECRET;
	const allowedEmails = platform?.env.ALLOWED_EMAILS || '*';

	if (!clientId || !clientSecret || !sessionSecret) {
		error(500, 'OAuth not configured');
	}

	try {
		const authUrl = getAuthUrl(url);
		const redirectUri = `${authUrl}/api/auth/callback`;

		const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);
		const googleUser = await getGoogleUser(tokens.access_token);

		// Check if email is allowed for admin routes
		const isAdminRoute = returnUrl.startsWith('/admin');
		if (isAdminRoute && !isEmailAllowed(googleUser.email, allowedEmails)) {
			error(403, 'Accès non autorisé à l\'administration');
		}

		// Upsert user in D1 database
		const db = platform?.env.DB;
		if (db) {
			try {
				const now = new Date().toISOString();
				// Try to insert new user, or update existing on conflict
				await db
					.prepare(
						`INSERT INTO users (google_id, email, name, picture, last_login_at)
					 VALUES (?, ?, ?, ?, ?)
					 ON CONFLICT(google_id) DO UPDATE SET
					   name = excluded.name,
					   picture = excluded.picture,
					   last_login_at = excluded.last_login_at`
					)
					.bind(googleUser.id, googleUser.email, googleUser.name, googleUser.picture, now)
					.run();
			} catch (dbError) {
				// Log but don't block login if D1 fails
				console.error('D1 user upsert failed:', dbError);
			}
		}

		// Create session (any Google user can log in for city requests)
		const session = await createSession(googleUser, sessionSecret);

		cookies.set('session', session, {
			path: '/',
			httpOnly: true,
			secure: url.protocol === 'https:',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		redirect(302, returnUrl);
	} catch (err) {
		console.error('OAuth callback error:', err);
		error(500, 'Échec de la connexion');
	}
};
