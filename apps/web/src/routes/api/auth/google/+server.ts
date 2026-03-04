import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogleAuthUrl } from '$lib/auth';
import { getAuthUrl } from '$lib/config';

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
	const clientId = platform?.env.GOOGLE_CLIENT_ID;
	if (!clientId) {
		throw new Error('GOOGLE_CLIENT_ID not configured');
	}

	const authUrl = getAuthUrl(url);
	const redirectUri = `${authUrl}/api/auth/callback`;

	// Get return URL from query params (for redirecting back after login)
	const returnUrl = url.searchParams.get('returnUrl') || '/';

	// Generate random state for CSRF protection (includes return URL)
	const stateData = {
		nonce: crypto.randomUUID(),
		returnUrl: returnUrl.startsWith('/') ? returnUrl : '/'
	};
	const state = btoa(JSON.stringify(stateData));

	cookies.set('oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		maxAge: 60 * 10 // 10 minutes
	});

	const googleUrl = getGoogleAuthUrl(clientId, redirectUri, state);
	redirect(302, googleUrl);
};
