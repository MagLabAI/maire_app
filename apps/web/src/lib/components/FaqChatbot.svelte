<script lang="ts">
	import type Fuse from 'fuse.js';

	interface FaqEntry {
		id: string;
		category: string;
		question: string;
		answer: string;
		keywords: string[];
	}

	interface ChatMessage {
		role: 'bot' | 'user';
		text: string;
		chips?: string[];
	}

	interface Props {
		faqData: FaqEntry[];
	}

	let { faqData }: Props = $props();

	let messages = $state<ChatMessage[]>([
		{
			role: 'bot',
			text: 'Salut ! Moi c\'est Marianne, je connais maire.app sur le bout des doigts. Pose-moi une question ou choisis un sujet.',
			chips: pickInitialChips()
		}
	]);
	let inputValue = $state('');
	let isTyping = $state(false);
	let messagesContainer: HTMLDivElement | undefined = $state();
	let inputEl: HTMLInputElement | undefined = $state();

	let fuse: Fuse<FaqEntry> | null = $state(null);

	function pickInitialChips(): string[] {
		return [
			'C\'est quoi maire.app ?',
			'L\'IA peut-elle se tromper ?',
			'Ma ville n\'a pas de fiche',
			'Données personnelles ?'
		];
	}

	function getRelatedChips(matchedEntry: FaqEntry): string[] {
		const sameCategory = faqData.filter(
			(e) => e.category === matchedEntry.category && e.id !== matchedEntry.id
		);
		const shuffled = sameCategory.sort(() => Math.random() - 0.5);
		return shuffled.slice(0, 2).map((e) => e.question);
	}

	async function getFuse(): Promise<Fuse<FaqEntry>> {
		if (fuse) return fuse;
		const FuseModule = await import('fuse.js');
		fuse = new FuseModule.default(faqData, {
			keys: [
				{ name: 'question', weight: 0.4 },
				{ name: 'keywords', weight: 0.4 },
				{ name: 'answer', weight: 0.2 }
			],
			threshold: 0.4,
			ignoreLocation: true,
			includeScore: true
		});
		return fuse;
	}

	function scrollToBottom() {
		requestAnimationFrame(() => {
			messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
		});
	}

	async function handleSend(text?: string) {
		const query = (text || inputValue).trim();
		if (!query) return;

		inputValue = '';
		messages = [...messages, { role: 'user', text: query }];
		scrollToBottom();

		isTyping = true;
		const fuseInstance = await getFuse();

		// Simulated typing delay
		const delay = 400 + Math.random() * 400;
		await new Promise((r) => setTimeout(r, delay));

		const results = fuseInstance.search(query);
		isTyping = false;

		if (results.length > 0 && results[0].score !== undefined) {
			const bestMatch = results[0];
			const score = bestMatch.score!;

			let prefix = '';
			if (score > 0.2) {
				prefix = 'Je pense que ça répond à ta question : ';
			}

			messages = [
				...messages,
				{
					role: 'bot',
					text: prefix + bestMatch.item.answer,
					chips: getRelatedChips(bestMatch.item)
				}
			];
		} else {
			messages = [
				...messages,
				{
					role: 'bot',
					text: 'Hmm, je n\'ai pas de réponse toute prête pour ça. Tu peux chercher sur le web pour en savoir plus.',
					chips: ['Rechercher sur Qwant']
				}
			];
		}
		scrollToBottom();
		inputEl?.focus();
	}

	function handleChipClick(chip: string) {
		if (chip === 'Rechercher sur Qwant') {
			openQwantSearch();
			return;
		}
		handleSend(chip);
	}

	function openQwantSearch() {
		const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
		const query = lastUserMsg?.text || 'maire.app';
		const url = `https://www.qwant.com/?l=fr&q=${encodeURIComponent('maire.app ' + query)}`;
		window.open(url, '_blank', 'noopener');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}
</script>

<div class="chatbot">
	<div class="chatbot-header">
		<span class="chatbot-avatar">🏛️</span>
		<div>
			<strong>Marianne</strong>
			<span class="chatbot-subtitle">aide municipale</span>
		</div>
	</div>

	<div class="chatbot-messages" bind:this={messagesContainer}>
		{#each messages as msg, i (i)}
			<div class="msg msg-{msg.role}">
				<div class="bubble bubble-{msg.role}">
					{msg.text}
				</div>
				{#if msg.chips && msg.chips.length > 0}
					<div class="chips">
						{#each msg.chips as chip (chip)}
							<button class="chip" onclick={() => handleChipClick(chip)}>
								{chip}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/each}

		{#if isTyping}
			<div class="msg msg-bot">
				<div class="bubble bubble-bot typing">
					<span class="dot"></span>
					<span class="dot"></span>
					<span class="dot"></span>
				</div>
			</div>
		{/if}
	</div>

	<form class="chatbot-input" onsubmit={(e) => { e.preventDefault(); handleSend(); }}>
		<input
			bind:this={inputEl}
			bind:value={inputValue}
			type="text"
			placeholder="Pose ta question..."
			onkeydown={handleKeydown}
			autocomplete="off"
		/>
		<button type="submit" aria-label="Envoyer" disabled={!inputValue.trim()}>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="22" y1="2" x2="11" y2="13" />
				<polygon points="22 2 15 22 11 13 2 9 22 2" />
			</svg>
		</button>
	</form>

</div>

<style>
	.chatbot {
		position: relative;
		max-width: 640px;
		border-radius: var(--radius-lg);
		background: var(--color-card-bg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.chatbot-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.875rem 1.25rem;
		background: var(--color-navy);
		color: #faf8f5;
	}

	.chatbot-avatar {
		font-size: 1.5rem;
		line-height: 1;
	}

	.chatbot-header strong {
		display: block;
		font-family: var(--font-display);
		font-size: 1rem;
	}

	.chatbot-subtitle {
		font-size: 0.75rem;
		color: var(--color-text-light);
	}

	.chatbot-messages {
		flex: 1;
		min-height: 400px;
		max-height: 500px;
		overflow-y: auto;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		scroll-behavior: smooth;
	}

	.msg {
		display: flex;
		flex-direction: column;
		max-width: 85%;
	}

	.msg-user {
		align-self: flex-end;
		align-items: flex-end;
	}

	.msg-bot {
		align-self: flex-start;
		align-items: flex-start;
	}

	.bubble {
		padding: 0.625rem 0.875rem;
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		line-height: 1.55;
		word-break: break-word;
	}

	.bubble-user {
		background: var(--color-gold);
		color: var(--color-navy);
	}

	.bubble-bot {
		background: var(--color-cream-dark);
		color: var(--color-text);
	}

	/* Typing dots */
	.bubble.typing {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.75rem 1rem;
	}

	.dot {
		width: 7px;
		height: 7px;
		background: var(--color-text-light);
		border-radius: 50%;
		animation: bounce 1.2s infinite ease-in-out;
	}

	.dot:nth-child(2) { animation-delay: 0.15s; }
	.dot:nth-child(3) { animation-delay: 0.3s; }

	@keyframes bounce {
		0%, 60%, 100% { transform: translateY(0); }
		30% { transform: translateY(-5px); }
	}

	/* Suggestion chips */
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: 0.5rem;
	}

	.chip {
		padding: 0.375rem 0.75rem;
		background: var(--color-cream);
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		color: var(--color-text);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
	}

	.chip:hover {
		background: var(--color-gold-light);
		border-color: var(--color-gold);
	}

	/* Input area */
	.chatbot-input {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-top: 1px solid var(--color-card-border);
		background: var(--color-cream);
	}

	.chatbot-input input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		font-family: var(--font-body);
		background: var(--color-card-bg);
		color: var(--color-text);
		outline: none;
		transition: border-color var(--transition-fast);
	}

	.chatbot-input input:focus {
		border-color: var(--color-gold);
	}

	.chatbot-input input::placeholder {
		color: var(--color-text-muted);
	}

	.chatbot-input button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border: none;
		border-radius: var(--radius-md);
		background: var(--color-gold);
		color: var(--color-navy);
		cursor: pointer;
		transition: background var(--transition-fast);
		flex-shrink: 0;
	}

	.chatbot-input button:hover:not(:disabled) {
		background: var(--color-gold-dark);
	}

	.chatbot-input button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Mobile tweaks */
	@media (max-width: 640px) {
		.chatbot-messages {
			min-height: 350px;
			max-height: 60vh;
		}

		.msg {
			max-width: 92%;
		}
	}
</style>
