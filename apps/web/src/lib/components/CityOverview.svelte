<script lang="ts">
	import type { CityInfo } from '$lib/types/elections';

	interface Props {
		cityInfo: CityInfo;
	}

	let { cityInfo }: Props = $props();

	let isExpanded = $state(false);
</script>

{#if cityInfo}
	<div class="city-overview">
		<header class="overview-header">
			<h2 class="overview-title">
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
				Découvrir {cityInfo.name}
			</h2>
			<span class="overview-region">{cityInfo.department}</span>
		</header>

		<div class="overview-content">
			<!-- Characteristics -->
			{#if cityInfo.characteristics && cityInfo.characteristics.length > 0}
				<div class="overview-section">
					<h3 class="section-label">Caractéristiques</h3>
					<ul class="characteristics-list">
						{#each cityInfo.characteristics as char}
							<li class="characteristic-item">
								<span class="char-bullet"></span>
								{char}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Economic Profile -->
			{#if cityInfo.economicProfile}
				<div class="overview-section">
					<h3 class="section-label">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
						</svg>
						Économie
					</h3>
					<p class="economic-profile">{cityInfo.economicProfile}</p>
				</div>
			{/if}

			<!-- Notable Features (expandable) -->
			{#if cityInfo.notableFeatures && cityInfo.notableFeatures.length > 0}
				<div class="overview-section">
					<h3 class="section-label">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
						</svg>
						Sites remarquables
					</h3>
					<div class="features-grid">
						{#each cityInfo.notableFeatures as feature}
							<div class="feature-tag">
								{feature}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.city-overview {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
	}

	.overview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
		color: #faf8f5;
	}

	.overview-title {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		color: #faf8f5;
	}

	.overview-region {
		font-size: 0.8rem;
		background: rgba(255, 255, 255, 0.15);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
	}

	.overview-content {
		padding: 1.25rem 1.5rem;
	}

	.overview-section {
		margin-bottom: 1.25rem;
	}

	.overview-section:last-child {
		margin-bottom: 0;
	}

	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.characteristics-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.characteristic-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		font-size: 0.9rem;
		color: var(--color-text);
		line-height: 1.5;
	}

	.char-bullet {
		flex-shrink: 0;
		width: 8px;
		height: 8px;
		background: var(--color-gold);
		border-radius: 50%;
		margin-top: 0.4rem;
	}

	.economic-profile {
		font-size: 0.9rem;
		color: var(--color-text);
		line-height: 1.6;
		margin: 0;
		padding: 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--color-gold);
	}

	.features-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.feature-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 0.875rem;
		background: var(--color-cream);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-full);
		font-size: 0.85rem;
		color: var(--color-foreground);
		transition: all 0.2s ease;
	}

	.feature-tag:hover {
		background: var(--color-gold-light);
		border-color: var(--color-gold);
	}

	@media (max-width: 640px) {
		.overview-header {
			padding: 0.875rem 1rem;
		}

		.overview-content {
			padding: 1rem;
		}

		.overview-title {
			font-size: 0.9rem;
		}
	}
</style>
