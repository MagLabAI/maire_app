import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { verifySession } from '$lib/auth';

// Block production pages.dev URL - only allow custom domain
// Preview URLs (commit hashes) and localhost are allowed
const pagesDevBlock: Handle = async ({ event, resolve }) => {
	const url = new URL(event.request.url);

	// Block main production pages.dev URL
	// Production: maire-4b6.pages.dev (no commit hash prefix)
	// Preview: 27d207aa.maire-4b6.pages.dev (has commit hash prefix)
	// Allow /api/auth/* for OAuth callbacks
	const isProductionPagesDev =
		url.hostname === 'maire-4b6.pages.dev' || url.hostname === 'maire.pages.dev';

	// Allow all API routes through (for testing and scheduled workers)
	if (isProductionPagesDev && !url.pathname.startsWith('/api')) {
		return new Response(
			`<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>maire.app - Site en construction</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: 'DM Sans', system-ui, sans-serif;
			background: linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%);
			color: #faf8f5;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			text-align: center;
			padding: 2rem;
		}
		.container { max-width: 500px; }
		h1 {
			font-family: 'Playfair Display', serif;
			font-size: 3rem;
			margin-bottom: 0.5rem;
		}
		h1 span { color: #c9a962; }
		p {
			color: #6b7c93;
			font-size: 1.1rem;
			line-height: 1.6;
			margin: 1.5rem 0;
		}
		.countdown {
			display: flex;
			justify-content: center;
			gap: 1.5rem;
			margin: 2rem 0;
		}
		.countdown-item {
			background: rgba(201, 169, 98, 0.1);
			border: 1px solid rgba(201, 169, 98, 0.3);
			border-radius: 12px;
			padding: 1rem 1.5rem;
			min-width: 80px;
		}
		.countdown-value {
			font-size: 2rem;
			font-weight: 700;
			color: #c9a962;
		}
		.countdown-label {
			font-size: 0.75rem;
			text-transform: uppercase;
			color: #6b7c93;
			margin-top: 0.25rem;
		}
		.badge {
			display: inline-block;
			background: #c9a962;
			color: #0a1628;
			padding: 0.5rem 1rem;
			border-radius: 6px;
			font-weight: 600;
			font-size: 0.875rem;
		}
	</style>
</head>
<body>
	<div class="container">
		<h1>maire<span>.app</span></h1>
		<p>La plateforme citoyenne pour les elections municipales 2026 arrive bientot.</p>
		<div class="countdown">
			<div class="countdown-item">
				<div class="countdown-value" id="days">--</div>
				<div class="countdown-label">jours</div>
			</div>
			<div class="countdown-item">
				<div class="countdown-value" id="hours">--</div>
				<div class="countdown-label">heures</div>
			</div>
		</div>
		<span class="badge">15 mars 2026</span>
	</div>
	<script>
		const target = new Date('2026-03-15T08:00:00+01:00');
		function update() {
			const now = new Date();
			const diff = target - now;
			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			document.getElementById('days').textContent = days;
			document.getElementById('hours').textContent = hours;
		}
		update();
		setInterval(update, 60000);
	</script>
</body>
</html>`,
			{
				status: 200,
				headers: { 'Content-Type': 'text/html; charset=utf-8' }
			}
		);
	}

	return resolve(event);
};

// Security headers (HSTS, X-Content-Type-Options, etc.)
const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	return response;
};

// Session verification hook
const sessionHandler: Handle = async ({ event, resolve }) => {
	// Default to no user
	event.locals.user = null;

	const sessionCookie = event.cookies.get('session');
	const sessionSecret = event.platform?.env.SESSION_SECRET;

	if (sessionCookie && sessionSecret) {
		const user = await verifySession(sessionCookie, sessionSecret);
		if (user) {
			event.locals.user = user;
		}
	}

	return resolve(event);
};

export const handle = sequence(pagesDevBlock, sessionHandler, securityHeaders);
