<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		targetDate: string; // ISO date string
		label?: string;
	}

	let { targetDate, label = "Jour J" }: Props = $props();

	let days = $state(0);
	let hours = $state(0);
	let minutes = $state(0);
	let seconds = $state(0);
	let isPast = $state(false);

	// Urgency levels
	type UrgencyLevel = 'normal' | 'warning' | 'urgent' | 'critical';
	let urgencyLevel = $state<UrgencyLevel>('normal');

	function calculateTimeLeft() {
		const target = new Date(targetDate).getTime();
		const now = Date.now();
		const diff = target - now;

		if (diff <= 0) {
			isPast = true;
			days = hours = minutes = seconds = 0;
			urgencyLevel = 'critical';
			return;
		}

		isPast = false;

		// Calculate urgency level
		const daysLeft = diff / (1000 * 60 * 60 * 24);
		if (daysLeft < 1) {
			urgencyLevel = 'critical';
		} else if (daysLeft < 7) {
			urgencyLevel = 'urgent';
		} else if (daysLeft < 30) {
			urgencyLevel = 'warning';
		} else {
			urgencyLevel = 'normal';
		}

		days = Math.floor(diff / (1000 * 60 * 60 * 24));
		hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		seconds = Math.floor((diff % (1000 * 60)) / 1000);
	}

	onMount(() => {
		calculateTimeLeft();
		const interval = setInterval(calculateTimeLeft, 1000);
		return () => clearInterval(interval);
	});

	// Format number with leading zero
	function pad(n: number): string {
		return n.toString().padStart(2, '0');
	}
</script>

<div class="countdown-container urgency-{urgencyLevel}">
	{#if isPast}
		<div class="countdown-past">
			<span class="countdown-label">{label}</span>
			<span class="countdown-message">C'est maintenant !</span>
		</div>
	{:else}
		<div class="countdown-grid">
			<!-- Days -->
			<div class="countdown-block">
				<div class="countdown-value">
					<span class="countdown-digit">{days}</span>
				</div>
				<span class="countdown-unit">jour{days !== 1 ? 's' : ''}</span>
			</div>

			<span class="countdown-separator">:</span>

			<!-- Hours -->
			<div class="countdown-block">
				<div class="countdown-value">
					<span class="countdown-digit">{pad(hours)}</span>
				</div>
				<span class="countdown-unit">heure{hours !== 1 ? 's' : ''}</span>
			</div>

			<span class="countdown-separator">:</span>

			<!-- Minutes -->
			<div class="countdown-block">
				<div class="countdown-value">
					<span class="countdown-digit">{pad(minutes)}</span>
				</div>
				<span class="countdown-unit">min</span>
			</div>

			<span class="countdown-separator">:</span>

			<!-- Seconds -->
			<div class="countdown-block">
				<div class="countdown-value">
					<span class="countdown-digit tick">{pad(seconds)}</span>
				</div>
				<span class="countdown-unit">sec</span>
			</div>
		</div>

		{#if label}
			<div class="countdown-label-row">
				<span class="countdown-label">
					{#if urgencyLevel === 'critical'}
						DEMAIN !
					{:else}
						{label}
					{/if}
				</span>
			</div>
		{/if}
	{/if}
</div>

<style>
	.countdown-container {
		text-align: center;
	}

	.countdown-grid {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	@media (min-width: 640px) {
		.countdown-grid {
			gap: 1rem;
		}
	}

	.countdown-block {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.countdown-value {
		background: var(--color-navy);
		color: #faf8f5;
		padding: 0.75rem 0;
		border-radius: var(--radius-md);
		width: 3.5rem;
		box-shadow: 0 4px 20px rgba(10, 22, 40, 0.2);
		text-align: center;
	}

	@media (min-width: 640px) {
		.countdown-value {
			padding: 1rem 0;
			width: 5rem;
		}
	}

	.countdown-digit {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	@media (min-width: 640px) {
		.countdown-digit {
			font-size: 3rem;
		}
	}

	.countdown-unit {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--color-text-light);
		margin-top: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	@media (min-width: 640px) {
		.countdown-unit {
			font-size: 0.75rem;
		}
	}

	.countdown-separator {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-gold);
		margin-top: -1.5rem;
	}

	@media (min-width: 640px) {
		.countdown-separator {
			font-size: 3rem;
		}
	}

	.countdown-label-row {
		margin-top: 1rem;
	}

	.countdown-label {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: rgba(201, 169, 98, 0.15);
		border: 1px solid rgba(201, 169, 98, 0.3);
		border-radius: var(--radius-full);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	/* Normal state - > 30 days */
	.urgency-normal .countdown-value {
		background: var(--color-navy);
	}

	/* Warning state - 7-30 days */
	.urgency-warning .countdown-value {
		background: linear-gradient(135deg, var(--color-navy), #1a3a5c);
		animation: pulse-warning 3s infinite;
	}

	.urgency-warning .countdown-label {
		background: rgba(201, 169, 98, 0.25);
		border-color: rgba(201, 169, 98, 0.5);
	}

	@keyframes pulse-warning {
		0%, 100% {
			box-shadow: 0 4px 20px rgba(201, 169, 98, 0.2);
		}
		50% {
			box-shadow: 0 4px 30px rgba(201, 169, 98, 0.4);
		}
	}

	/* Urgent state - < 7 days */
	.urgency-urgent .countdown-value {
		background: linear-gradient(135deg, var(--color-coral), var(--color-gold));
		animation: pulse-urgent 2s infinite;
	}

	.urgency-urgent .countdown-label {
		background: rgba(224, 122, 95, 0.2);
		border-color: rgba(224, 122, 95, 0.4);
		color: var(--color-coral);
	}

	@keyframes pulse-urgent {
		0%, 100% {
			box-shadow: 0 4px 20px rgba(224, 122, 95, 0.3);
		}
		50% {
			box-shadow: 0 4px 30px rgba(224, 122, 95, 0.5);
		}
	}

	/* Critical state - < 1 day */
	.urgency-critical .countdown-value {
		background: linear-gradient(135deg, #dc2626, var(--color-coral));
		animation: pulse-critical 1s infinite;
	}

	.urgency-critical .countdown-label {
		background: rgba(220, 38, 38, 0.2);
		border-color: rgba(220, 38, 38, 0.4);
		color: #dc2626;
		animation: blink 0.5s infinite;
	}

	@keyframes pulse-critical {
		0%, 100% {
			box-shadow: 0 4px 20px rgba(220, 38, 38, 0.4);
			transform: scale(1);
		}
		50% {
			box-shadow: 0 4px 40px rgba(220, 38, 38, 0.6);
			transform: scale(1.02);
		}
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.countdown-past {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
	}

	.countdown-message {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-gold);
	}

	/* Tick animation for seconds */
	:global(.tick) {
		animation: tick-up 0.3s ease-out;
	}

	@keyframes tick-up {
		0% { transform: translateY(0); }
		50% { transform: translateY(-10%); opacity: 0.7; }
		100% { transform: translateY(0); }
	}
</style>
