// Simple session-based auth with Google OAuth
// Session stored in encrypted cookie

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export interface GoogleUser {
	id: string; // Google ID
	email: string;
	name: string;
	picture: string;
}

export function getGoogleAuthUrl(clientId: string, redirectUri: string, state: string): string {
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: 'openid email profile',
		state,
		access_type: 'offline',
		prompt: 'consent'
	});
	return `${GOOGLE_AUTH_URL}?${params}`;
}

export async function exchangeCodeForTokens(
	code: string,
	clientId: string,
	clientSecret: string,
	redirectUri: string
): Promise<{ access_token: string; id_token: string }> {
	const res = await fetch(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			grant_type: 'authorization_code'
		})
	});

	if (!res.ok) {
		throw new Error(`Token exchange failed: ${await res.text()}`);
	}

	return res.json();
}

export async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
	const res = await fetch(GOOGLE_USERINFO_URL, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (!res.ok) {
		throw new Error(`Failed to get user info: ${await res.text()}`);
	}

	return res.json();
}

// Simple session encoding/decoding using base64 + HMAC
export async function createSession(user: GoogleUser, secret: string): Promise<string> {
	const payload = JSON.stringify({
		...user,
		exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
	});
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
	const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
	return btoa(payload) + '.' + sig;
}

export async function verifySession(session: string, secret: string): Promise<GoogleUser | null> {
	try {
		const [payloadB64, sigB64] = session.split('.');
		if (!payloadB64 || !sigB64) return null;

		const payload = atob(payloadB64);
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(secret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify']
		);

		const sig = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
		const valid = await crypto.subtle.verify('HMAC', key, sig, encoder.encode(payload));
		if (!valid) return null;

		const data = JSON.parse(payload);
		if (data.exp < Date.now()) return null;

		return { id: data.id, email: data.email, name: data.name, picture: data.picture };
	} catch {
		return null;
	}
}

export function isEmailAllowed(email: string, allowedEmails: string): boolean {
	const list = allowedEmails.split(',').map((e) => e.trim().toLowerCase());
	return list.includes(email.toLowerCase()) || list.includes('*');
}
