import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isEmailAllowed } from '$lib/auth';

export const load: LayoutServerLoad = async ({ locals, url, platform }) => {
	// Allow login page without auth
	if (url.pathname === '/admin/login') {
		return { user: null };
	}

	// Protect all other admin routes
	if (!locals.user) {
		redirect(302, '/admin/login');
	}

	// Check if user email is in ALLOWED_EMAILS
	const allowedEmails = platform?.env?.ALLOWED_EMAILS || '';
	if (!isEmailAllowed(locals.user.email, allowedEmails)) {
		error(403, 'Accès non autorisé. Votre email n\'est pas dans la liste des administrateurs.');
	}

	return {
		user: locals.user
	};
};
