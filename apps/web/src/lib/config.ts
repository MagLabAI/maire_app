// App configuration constants

// Public-facing site URL for SEO (canonical, OG, sitemap)
export const SITE_URL = 'https://maire.app';

// Canonical URL for OAuth callbacks in production
export const PRODUCTION_AUTH_URL = 'https://maire.pages.dev';

// Helper to determine if running locally
export function isLocalDev(hostname: string): boolean {
	return hostname === 'localhost' || hostname === '127.0.0.1';
}

// Get the appropriate AUTH_URL based on current hostname
export function getAuthUrl(url: URL): string {
	if (isLocalDev(url.hostname)) {
		return url.origin;
	}
	return PRODUCTION_AUTH_URL;
}

// Wikimedia Commons: full-res → thumbnail (saves ~90% bandwidth on candidate photos)
export function wikiThumb(url: string, width = 400): string {
	const match = url.match(/upload\.wikimedia\.org\/wikipedia\/(\w+)\/(\w\/\w+)\/(.+)/);
	if (!match) return url;
	const [, project, hash, file] = match;
	return `https://upload.wikimedia.org/wikipedia/${project}/thumb/${hash}/${file}/${width}px-${file}`;
}
