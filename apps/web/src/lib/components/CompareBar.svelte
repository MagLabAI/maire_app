<script lang="ts">
	import { comparison } from '$lib/stores/comparison.svelte';
	import { wikiThumb } from '$lib/config';

	// Derive compare URL from the first candidate's city (always correct, even cross-city)
	let compareUrl = $derived(() => {
		const first = comparison.candidates[0];
		if (first?.citySlug) {
			return `/elections/municipales-2026/${first.citySlug}/comparer`;
		}
		return '/elections/municipales-2026/comparer';
	});

	let visible = $state(false);

	$effect(() => {
		if (!comparison.isEmpty && !visible) {
			requestAnimationFrame(() => { visible = true; });
		} else if (comparison.isEmpty) {
			visible = false;
		}
	});

	function removeCandidate(id: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		comparison.remove(id);
	}
</script>

{#if !comparison.isEmpty}
	<div class="compare-bar" class:visible>
		<div class="container-app">
			<div class="compare-bar-inner">
				<div class="compare-actions">
					<a href={compareUrl()} class="btn-compare">
						Comparer ({comparison.count})
					</a>
					<button class="btn-clear" onclick={() => comparison.clear()}>
						Effacer
					</button>
				</div>

				<div class="compare-slots">
					{#each comparison.candidates as candidate (candidate.id)}
						<div class="compare-slot">
							<div class="slot-avatar">
								{#if candidate.photo}
									<img src={wikiThumb(candidate.photo, 80)} alt={candidate.fullName} class="w-full h-full object-cover" />
								{:else}
									<span class="text-xs font-bold text-[#faf8f5]">
										{candidate.firstName[0]}{candidate.lastName[0]}
									</span>
								{/if}
							</div>
							<span class="slot-name">{candidate.lastName}</span>
							<button
								class="slot-remove"
								onclick={(e) => removeCandidate(candidate.id, e)}
								aria-label="Retirer {candidate.fullName}"
							>
								×
							</button>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.compare-bar {
		position: fixed;
		top: 44px;
		left: 0;
		right: 0;
		background: var(--color-navy);
		border-bottom: 1px solid var(--color-navy-light);
		z-index: 49;
		transform: translateY(-100%);
		opacity: 0;
		transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
	}

	@media (min-width: 768px) {
		.compare-bar { top: 52px; }
	}

	.compare-bar.visible {
		transform: translateY(0);
		opacity: 1;
	}

	.compare-bar-inner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0;
	}

	/* ─── Actions: always visible on the left ─── */
	.compare-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.btn-compare {
		padding: 0.5rem 1rem;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--color-foreground);
		background: var(--color-gold);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		text-decoration: none;
		white-space: nowrap;
	}

	.btn-compare:hover {
		background: var(--color-gold-light);
		transform: translateY(-1px);
		box-shadow: var(--shadow-gold-glow);
	}

	.btn-clear {
		padding: 0.5rem 0.75rem;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-text-light);
		background: transparent;
		border: 1px solid var(--color-navy-light);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.btn-clear:hover {
		border-color: var(--color-coral);
		color: var(--color-coral);
	}

	/* ─── Slots: horizontal scroll when overflowing ─── */
	.compare-slots {
		display: flex;
		gap: 0.4rem;
		overflow-x: auto;
		min-width: 0;
		scrollbar-width: none;
	}

	.compare-slots::-webkit-scrollbar {
		display: none;
	}

	.compare-slot {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem;
		background: var(--color-navy-light);
		border-radius: var(--radius-md);
		position: relative;
		flex-shrink: 0;
		animation: slot-in 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	@keyframes slot-in {
		from { opacity: 0; transform: scale(0.85); }
		to { opacity: 1; transform: scale(1); }
	}

	.slot-avatar {
		width: 30px;
		height: 30px;
		border-radius: var(--radius-sm);
		background: var(--color-navy-lighter);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.slot-name {
		font-size: 0.78rem;
		font-weight: 600;
		color: #faf8f5;
		max-width: 72px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: none;
	}

	@media (min-width: 640px) {
		.slot-name { display: block; }
	}

	.slot-remove {
		position: absolute;
		top: -5px;
		right: -5px;
		width: 18px;
		height: 18px;
		background: var(--color-coral);
		color: white;
		border-radius: 50%;
		font-size: 12px;
		font-weight: bold;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	.slot-remove:hover {
		transform: scale(1.15);
	}
</style>
