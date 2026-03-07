/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

declare global {
	namespace App {
		interface Locals {
			user: {
				email: string;
				name: string;
				picture: string;
				// Extended from D1 (optional - populated after DB lookup)
				id?: number;
				googleId?: string;
				subscriptionTier?: 'free' | 'candidat' | 'campagne' | 'metropole';
				trackedCandidates?: string[];
				createdAt?: string;
			} | null;
		}

		interface Platform {
			env: {
				// OAuth secrets
				GOOGLE_CLIENT_ID: string;
				GOOGLE_CLIENT_SECRET: string;
				SESSION_SECRET: string;
				ALLOWED_EMAILS: string;
				// Grok-4 API
				XAI_API_KEY?: string;
				GROK_API_KEY?: string;
				// D1 Database (research queue)
				DB: D1Database;
				// KV Namespace (city data storage)
				CITY_DATA: KVNamespace;
			};
			context: ExecutionContext;
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
