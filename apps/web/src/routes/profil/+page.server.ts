import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	// Require authentication
	if (!locals.user) {
		redirect(302, '/api/auth/google?returnUrl=/profil');
	}

	const db = platform?.env.DB;
	let dbUser = null;
	let cityRequests: { city_slug: string; city_name: string; requested_at: string }[] = [];

	if (db) {
		try {
			// Get full user data from D1
			const result = await db
				.prepare(
					`SELECT id, subscription_tier, tracked_candidates, created_at
					 FROM users WHERE email = ?`
				)
				.bind(locals.user.email)
				.first();

			if (result) {
				dbUser = {
					id: result.id as number,
					subscriptionTier: (result.subscription_tier as string) || 'free',
					trackedCandidates: result.tracked_candidates
						? JSON.parse(result.tracked_candidates as string)
						: [],
					createdAt: result.created_at as string
				};
			}

			// Get user's city requests
			if (dbUser?.id) {
				const requests = await db
					.prepare(
						`SELECT city_slug, city_name, requested_at
						 FROM user_city_requests
						 WHERE user_id = ?
						 ORDER BY requested_at DESC
						 LIMIT 10`
					)
					.bind(dbUser.id)
					.all();

				cityRequests = (requests.results || []).map((r) => ({
					city_slug: r.city_slug as string,
					city_name: r.city_name as string,
					requested_at: r.requested_at as string
				}));
			}
		} catch (err) {
			console.error('Error fetching user profile:', err);
		}
	}

	return {
		user: locals.user,
		profile: dbUser,
		cityRequests
	};
};
