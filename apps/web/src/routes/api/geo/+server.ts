import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Lightweight endpoint returning Cloudflare's IP-based city detection
// Called client-side on homepage to avoid blocking prerendering
export const GET: RequestHandler = ({ request }) => {
	const cf = (request as any).cf as { city?: string; country?: string } | undefined;
	return json({ city: cf?.city || '', country: cf?.country || '' });
};
