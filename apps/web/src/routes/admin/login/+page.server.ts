import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Already logged in? Redirect to admin
	if (locals.user) {
		redirect(302, '/admin');
	}
	return {};
};
