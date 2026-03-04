import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('session', { path: '/' });
	redirect(302, '/');
};

// Also support GET for simple logout links
export const GET: RequestHandler = async ({ cookies }) => {
	cookies.delete('session', { path: '/' });
	redirect(302, '/');
};
