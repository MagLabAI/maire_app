import type { PageServerLoad } from './$types';

interface QueueJob {
	id: number;
	city_slug: string;
	city_name: string;
	priority: number;
	status: string;
	requested_at: string;
	started_at: string | null;
	completed_at: string | null;
	error_message: string | null;
	request_source: string;
	retry_count: number;
}

interface CityMetadata {
	city_slug: string;
	city_name: string;
	data_source: string;
	last_researched_at: string | null;
	next_refresh_at: string | null;
	research_cost_usd: number;
}

interface QueueStats {
	pending: number;
	processing: number;
	completed: number;
	failed: number;
	totalCost: number;
}

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform?.env?.DB;

	if (!db) {
		return {
			queue: [],
			recentCompleted: [],
			cities: [],
			stats: {
				pending: 0,
				processing: 0,
				completed: 0,
				failed: 0,
				totalCost: 0
			},
			error: 'Database not configured'
		};
	}

	try {
		// Get queue jobs (pending + processing + recent failed)
		const queueResult = await db
			.prepare(
				`
			SELECT * FROM research_queue
			WHERE status IN ('pending', 'processing', 'failed')
			ORDER BY
				CASE status WHEN 'processing' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
				priority DESC,
				requested_at ASC
			LIMIT 50
		`
			)
			.all<QueueJob>();

		// Get recent completed jobs
		const completedResult = await db
			.prepare(
				`
			SELECT * FROM research_queue
			WHERE status = 'completed'
			ORDER BY completed_at DESC
			LIMIT 20
		`
			)
			.all<QueueJob>();

		// Get cities metadata
		const citiesResult = await db
			.prepare(
				`
			SELECT * FROM cities_metadata
			ORDER BY last_researched_at DESC NULLS LAST
			LIMIT 100
		`
			)
			.all<CityMetadata>();

		// Get stats
		const statsResult = await db
			.prepare(
				`
			SELECT
				SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
				SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
				SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
				SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
			FROM research_queue
		`
			)
			.first<{ pending: number; processing: number; completed: number; failed: number }>();

		const costResult = await db
			.prepare(`SELECT SUM(research_cost_usd) as total FROM cities_metadata`)
			.first<{ total: number }>();

		return {
			queue: queueResult.results || [],
			recentCompleted: completedResult.results || [],
			cities: citiesResult.results || [],
			stats: {
				pending: statsResult?.pending || 0,
				processing: statsResult?.processing || 0,
				completed: statsResult?.completed || 0,
				failed: statsResult?.failed || 0,
				totalCost: costResult?.total || 0
			},
			error: null
		};
	} catch (e) {
		return {
			queue: [],
			recentCompleted: [],
			cities: [],
			stats: {
				pending: 0,
				processing: 0,
				completed: 0,
				failed: 0,
				totalCost: 0
			},
			error: e instanceof Error ? e.message : 'Unknown error'
		};
	}
};
