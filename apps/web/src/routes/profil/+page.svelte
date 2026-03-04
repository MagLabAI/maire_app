<script lang="ts">
	import type { PageData } from './$types';
	import SeoMeta from '$lib/components/SeoMeta.svelte';

	let { data }: { data: PageData } = $props();

	const tierLabels: Record<string, { name: string; color: string }> = {
		free: { name: 'Gratuit', color: 'var(--color-text-muted)' },
		candidat: { name: 'Candidat', color: 'var(--color-coral)' },
		campagne: { name: 'Campagne', color: 'var(--color-gold)' },
		metropole: { name: 'Métropole', color: 'var(--color-success)' }
	};

	let tier = $derived(tierLabels[data.profile?.subscriptionTier || 'free'] || tierLabels.free);
	let memberSince = $derived(() => {
		if (!data.profile?.createdAt) return 'Aujourd\'hui';
		const date = new Date(data.profile.createdAt);
		return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
	});
</script>

<svelte:head>
	<title>Mon Profil — maire.app</title>
	<meta name="description" content="Gérez votre compte maire.app et suivez vos candidats favoris." />
	<SeoMeta
		title="Mon Profil — maire.app"
		description="Gérez votre compte maire.app et suivez vos candidats favoris."
		path="/profil"
	/>
</svelte:head>

<div class="profile-page">
	<!-- Hero Section -->
	<section class="profile-hero">
		<div class="profile-hero-content">
			<div class="profile-avatar-large">
				<img src={data.user.picture} alt="" referrerpolicy="no-referrer" />
			</div>
			<div class="profile-info">
				<h1>{data.user.name}</h1>
				<p class="profile-email">{data.user.email}</p>
				<div class="profile-badges">
					<span class="tier-badge" style="background: {tier.color}">
						{tier.name}
					</span>
					<span class="member-badge">
						Membre depuis {memberSince()}
					</span>
				</div>
			</div>
		</div>
	</section>

	<div class="profile-content">
		<!-- Quick Actions -->
		<section class="profile-section">
			<h2>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
				Actions rapides
			</h2>
			<div class="quick-actions">
				<a href="/fonctionnalites" class="action-card action-features">
					<div class="action-icon">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
						</svg>
					</div>
					<div class="action-content">
						<h3>Découvrir les fonctionnalités</h3>
						<p>Outils IA, analyse stratégique, suivi en temps réel</p>
					</div>
					<svg class="action-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</a>

				<a href="/elections/municipales-2026" class="action-card">
					<div class="action-icon">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
					<div class="action-content">
						<h3>Explorer les villes</h3>
						<p>Découvrez les candidats de votre commune</p>
					</div>
					<svg class="action-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</a>
			</div>
		</section>

		<!-- City Requests -->
		{#if data.cityRequests.length > 0}
			<section class="profile-section">
				<h2>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
					Mes demandes de recherche
				</h2>
				<div class="requests-list">
					{#each data.cityRequests as request}
						<a href="/elections/municipales-2026/{request.city_slug}" class="request-item">
							<span class="request-city">{request.city_name}</span>
							<span class="request-date">
								{new Date(request.requested_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
							</span>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Subscription Section -->
		<section class="profile-section subscription-section">
			<h2>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				Abonnement
			</h2>

			{#if data.profile?.subscriptionTier === 'free'}
				<div class="subscription-cta">
					<div class="subscription-current">
						<span class="current-label">Plan actuel</span>
						<span class="current-tier" style="color: {tier.color}">{tier.name}</span>
					</div>
					<p class="subscription-text">
						Débloquez l'accès aux outils IA, au suivi de candidats et à l'analyse stratégique.
					</p>
					<a href="/fonctionnalites#tarifs" class="upgrade-btn">
						Voir les offres
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
				</div>
			{:else}
				<div class="subscription-active">
					<div class="subscription-tier-display" style="border-color: {tier.color}">
						<span class="tier-label">Plan</span>
						<span class="tier-name" style="color: {tier.color}">{tier.name}</span>
					</div>
					<p class="subscription-features">
						{#if data.profile?.subscriptionTier === 'candidat'}
							1 candidat suivi, outils IA de base
						{:else if data.profile?.subscriptionTier === 'campagne'}
							4 candidats suivis, analytics complets, analyse IA
						{:else if data.profile?.subscriptionTier === 'metropole'}
							Illimité, accès API, marque blanche
						{/if}
					</p>
				</div>
			{/if}
		</section>

		<!-- Danger Zone -->
		<section class="profile-section danger-section">
			<h2>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				Compte
			</h2>
			<div class="danger-actions">
				<a href="/api/auth/logout" class="logout-btn">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
					Déconnexion
				</a>
			</div>
		</section>
	</div>
</div>

<style>
	.profile-page {
		min-height: 100vh;
		background: var(--color-cream);
	}

	/* Hero */
	.profile-hero {
		background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
		padding: 3rem 1rem 4rem;
	}

	.profile-hero-content {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		text-align: center;
	}

	@media (min-width: 640px) {
		.profile-hero-content {
			flex-direction: row;
			text-align: left;
			gap: 2rem;
		}
	}

	.profile-avatar-large img {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		border: 4px solid var(--color-gold);
		object-fit: cover;
	}

	@media (min-width: 640px) {
		.profile-avatar-large img {
			width: 120px;
			height: 120px;
		}
	}

	.profile-info h1 {
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 700;
		color: #faf8f5;
		margin: 0;
	}

	@media (min-width: 640px) {
		.profile-info h1 {
			font-size: 2rem;
		}
	}

	.profile-email {
		font-size: 0.95rem;
		color: var(--color-gold-light);
		margin: 0.5rem 0 1rem;
	}

	.profile-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
	}

	@media (min-width: 640px) {
		.profile-badges {
			justify-content: flex-start;
		}
	}

	.tier-badge {
		padding: 0.375rem 0.875rem;
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		font-weight: 600;
		color: white;
	}

	.member-badge {
		padding: 0.375rem 0.875rem;
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		background: rgba(255, 255, 255, 0.1);
		color: #faf8f5;
	}

	/* Content */
	.profile-content {
		max-width: 800px;
		margin: -2rem auto 0;
		padding: 0 1rem 3rem;
	}

	.profile-section {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.profile-section h2 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 1.25rem;
	}

	.profile-section h2 svg {
		color: var(--color-gold);
	}

	/* Quick Actions */
	.quick-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.action-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		transition: all 0.15s ease;
		border: 1px solid transparent;
	}

	.action-card:hover {
		background: var(--color-cream-dark);
		border-color: var(--color-gold-light);
	}

	.action-features {
		background: linear-gradient(135deg, var(--color-gold-light) 0%, rgba(232, 217, 168, 0.3) 100%);
	}

	.action-features:hover {
		background: linear-gradient(135deg, var(--color-gold-light) 0%, rgba(232, 217, 168, 0.5) 100%);
	}

	.action-icon {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-card-bg);
		border-radius: var(--radius-md);
		color: var(--color-gold);
	}

	.action-content {
		flex: 1;
		min-width: 0;
	}

	.action-content h3 {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0 0 0.25rem;
	}

	.action-content p {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin: 0;
	}

	.action-arrow {
		flex-shrink: 0;
		color: var(--color-text-muted);
	}

	/* Requests List */
	.requests-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.request-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		transition: background 0.15s ease;
	}

	.request-item:hover {
		background: var(--color-cream-dark);
	}

	.request-city {
		font-weight: 500;
		color: var(--color-foreground);
	}

	.request-date {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	/* Subscription */
	.subscription-cta {
		text-align: center;
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
	}

	.subscription-current {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.current-label {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.current-tier {
		font-weight: 700;
	}

	.subscription-text {
		font-size: 0.9rem;
		color: var(--color-text);
		margin: 0 0 1rem;
	}

	.upgrade-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--color-gold);
		color: var(--color-foreground);
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 0.9rem;
		transition: all 0.15s ease;
	}

	.upgrade-btn:hover {
		background: var(--color-gold-light);
		transform: translateY(-1px);
	}

	.subscription-active {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
	}

	.subscription-tier-display {
		padding: 0.75rem 1rem;
		border: 2px solid;
		border-radius: var(--radius-md);
		text-align: center;
	}

	.tier-label {
		display: block;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.tier-name {
		display: block;
		font-weight: 700;
		font-size: 1rem;
	}

	.subscription-features {
		font-size: 0.875rem;
		color: var(--color-text);
		margin: 0;
	}

	/* Danger Zone */
	.danger-section h2 svg {
		color: var(--color-coral);
	}

	.danger-actions {
		display: flex;
		gap: 1rem;
	}

	.logout-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: rgba(224, 122, 95, 0.1);
		color: var(--color-coral);
		border-radius: var(--radius-md);
		font-weight: 500;
		font-size: 0.9rem;
		transition: background 0.15s ease;
	}

	.logout-btn:hover {
		background: rgba(224, 122, 95, 0.2);
	}
</style>
