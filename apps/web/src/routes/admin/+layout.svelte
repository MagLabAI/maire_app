<script lang="ts">
	import type { LayoutData } from './$types';

	let { data, children } = $props<{ data: LayoutData; children: any }>();

	const user = $derived(data.user);
</script>

{#if user}
	<div class="admin-layout">
		<nav class="admin-nav">
			<div class="admin-nav-left">
				<a href="/admin" class="admin-logo">
					<span class="logo-text">maire.app</span>
					<span class="logo-badge">Admin</span>
				</a>
				<div class="admin-links">
					<a href="/admin" class="nav-link">Tableau de bord</a>
					<a href="/admin/villes" class="nav-link">Villes</a>
				</div>
			</div>
			<div class="admin-nav-right">
				<div class="user-info">
					{#if user.picture}
						<img src={user.picture} alt="" class="user-avatar" />
					{/if}
					<span class="user-name">{user.name}</span>
				</div>
				<a href="/api/auth/logout" class="logout-button">Déconnexion</a>
			</div>
		</nav>
		<main class="admin-main">
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.admin-layout {
		min-height: 100vh;
		background: var(--color-cream);
	}

	.admin-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.5rem;
		background: var(--color-navy);
		color: white;
	}

	.admin-nav-left {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.admin-logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: white;
	}

	.logo-text {
		font-family: var(--font-heading);
		font-size: 1.25rem;
	}

	.logo-badge {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		background: var(--color-gold);
		color: var(--color-foreground);
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
	}

	.admin-links {
		display: flex;
		gap: 1rem;
	}

	.nav-link {
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		font-size: 0.9rem;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.nav-link:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.admin-nav-right {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.user-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
	}

	.user-name {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.logout-button {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		padding: 0.4rem 0.75rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		transition: all 0.2s;
	}

	.logout-button:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.3);
		color: white;
	}

	.admin-main {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	@media (max-width: 768px) {
		.admin-nav {
			flex-direction: column;
			gap: 1rem;
			padding: 1rem;
		}

		.admin-nav-left {
			flex-direction: column;
			gap: 1rem;
		}

		.user-name {
			display: none;
		}

		.admin-main {
			padding: 1rem;
		}
	}
</style>
