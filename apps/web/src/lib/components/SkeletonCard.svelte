<script lang="ts">
	// Skeleton loading card for candidates
</script>

<div class="skeleton-card">
	<div class="skeleton-card-photo"></div>
	<div class="skeleton-card-content">
		<div class="skeleton skeleton-line medium"></div>
		<div class="skeleton skeleton-line short"></div>
		<div class="skeleton skeleton-stats">
			<div class="skeleton skeleton-stat"></div>
			<div class="skeleton skeleton-stat"></div>
			<div class="skeleton skeleton-stat"></div>
		</div>
		<div class="skeleton skeleton-line full skeleton-btn"></div>
	</div>
</div>

<style>
	.skeleton-card {
		width: 100%;
		max-width: 320px;
		aspect-ratio: 3 / 4.2;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
	}

	.skeleton-card-photo {
		width: 100%;
		aspect-ratio: 4 / 3;
		background: linear-gradient(
			90deg,
			var(--color-navy-light) 25%,
			var(--color-navy-lighter) 50%,
			var(--color-navy-light) 75%
		);
		background-size: 200% 100%;
		animation: skeleton-shimmer 1.5s infinite;
	}

	.skeleton-card-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.skeleton-line {
		height: 1rem;
		border-radius: 4px;
	}

	.skeleton-line.short {
		width: 60%;
	}

	.skeleton-line.medium {
		width: 80%;
		height: 1.25rem;
	}

	.skeleton-line.full {
		width: 100%;
	}

	.skeleton-stats {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--color-cream);
		border-radius: var(--radius-sm);
	}

	.skeleton-stat {
		flex: 1;
		height: 2.5rem;
		border-radius: 4px;
	}

	.skeleton-btn {
		height: 44px;
		margin-top: auto;
	}

	@keyframes skeleton-shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton-card-photo,
		.skeleton {
			animation: none;
			background: var(--color-cream-dark);
		}

		.skeleton-card-photo {
			background: var(--color-navy-light);
		}
	}
</style>
