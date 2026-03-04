<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		initialCityName?: string;
	}

	let { initialCityName = '' }: Props = $props();

	const GITHUB_REPO = 'https://github.com/MagLabAI/maire.app';

	type CityInfo = {
		nom: string;
		code: string;
		population: number;
		departement: { code: string; nom: string };
		region: { code: string; nom: string };
	};

	let cityName = $state('');
	let validatedCity = $state<CityInfo | null>(null);
	let isValidating = $state(false);
	let validationError = $state<string | null>(null);

	// Contact form state
	let formName = $state('');
	let formEmail = $state('');
	let formMessage = $state('');
	let formStatus = $state<'idle' | 'sending' | 'success' | 'error'>('idle');
	let formError = $state('');

	// Debounce validation
	let validationTimeout: ReturnType<typeof setTimeout>;

	// Pre-fill from prop on mount (one-time, not reactive)
	onMount(() => {
		if (initialCityName && initialCityName.length >= 2) {
			cityName = initialCityName;
			doValidateCity(initialCityName);
		}
	});

	function handleCityInput() {
		validatedCity = null;
		validationError = null;
		triggerValidation();
	}

	function triggerValidation() {
		clearTimeout(validationTimeout);
		if (cityName.trim().length < 2) return;
		validationTimeout = setTimeout(() => {
			doValidateCity(cityName.trim());
		}, 500);
	}

	async function doValidateCity(name: string) {
		if (name.length < 2) return;
		isValidating = true;
		validationError = null;

		try {
			const params = new URLSearchParams({
				nom: name,
				fields: 'nom,code,population,departement,region',
				boost: 'population',
				limit: '5'
			});

			const res = await fetch(`https://geo.api.gouv.fr/communes?${params}`);
			if (!res.ok) throw new Error('Erreur de connexion');

			const cities: CityInfo[] = await res.json();
			if (!cities.length) {
				validationError = `Aucune commune française trouvée pour "${name}"`;
				validatedCity = null;
				return;
			}

			const exactMatch = cities.find(
				(c) => c.nom.toLowerCase() === name.toLowerCase()
			);
			const match = exactMatch || cities[0];
			validatedCity = match;
			cityName = match.nom;
		} catch {
			validationError = 'Erreur lors de la validation de la ville';
		} finally {
			isValidating = false;
		}
	}

	// Pre-filled GitHub issue URL (built dynamically from validated city)
	let githubIssueUrl = $derived.by(() => {
		if (!validatedCity) return '';
		const city = validatedCity;
		const params = new URLSearchParams({
			labels: 'demande-ville',
			title: `[Ville] ${city.nom} (${city.departement.code})`,
			body: [
				'## Ville demandée',
				`**Nom**: ${city.nom}`,
				`**Code INSEE**: ${city.code}`,
				`**Département**: ${city.departement.nom} (${city.departement.code})`,
				`**Région**: ${city.region.nom}`,
				`**Population**: ${city.population.toLocaleString('fr-FR')}`,
				'',
				'## Commentaire (optionnel)',
				'_Ajoutez un commentaire si nécessaire._'
			].join('\n')
		});
		return `${GITHUB_REPO}/issues/new?${params.toString()}`;
	});

	async function submitContactForm() {
		formStatus = 'sending';
		formError = '';

		const cityLabel = validatedCity
			? `${validatedCity.nom} (${validatedCity.departement.code})`
			: cityName;

		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formName,
					email: formEmail,
					pageUrl: null,
					category: 'city_request',
					message: `Demande d'ajout de ville : ${cityLabel}\n\n${formMessage || '(aucun commentaire)'}`
				})
			});

			const data = await res.json();
			if (!res.ok) {
				formError = data.message || 'Une erreur est survenue.';
				formStatus = 'error';
				return;
			}
			formStatus = 'success';
		} catch {
			formError = 'Erreur de connexion. Réessayez plus tard.';
			formStatus = 'error';
		}
	}
</script>

<div class="request-github">
	<!-- City validation (shared between both methods) -->
	<div class="validation-section">
		<h3>Demander l'ajout d'une ville</h3>
		<p>Vérifiez le nom de la commune, puis choisissez votre méthode de demande.</p>

		<div class="input-group">
			<label for="city-request-input">Nom de la commune</label>
			<div class="input-wrapper">
				<input
					id="city-request-input"
					type="text"
					bind:value={cityName}
					oninput={handleCityInput}
					placeholder="Ex: Grenoble, Brest, Perpignan..."
				/>
				{#if isValidating}
					<span class="input-status validating">
						<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
					</span>
				{:else if validatedCity}
					<span class="input-status valid">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</span>
				{/if}
			</div>
		</div>

		{#if validationError}
			<p class="error-message">{validationError}</p>
		{/if}

		{#if validatedCity}
			<div class="validated-city">
				<div class="city-info">
					<span class="city-name-display">{validatedCity.nom}</span>
					<span class="city-details">
						{validatedCity.departement.nom} ({validatedCity.departement.code}) ·
						{validatedCity.population.toLocaleString('fr-FR')} hab.
					</span>
				</div>
				<span class="check-badge">Commune valide</span>
			</div>
		{/if}
	</div>

	{#if validatedCity}
		<!-- Two methods grid (matching corrections page pattern) -->
		<div class="methods-grid">
			<!-- GitHub Issue -->
			<div class="method-card method-github">
				<div class="method-header">
					<span class="method-badge public">Rapide</span>
					<h4>Issue GitHub</h4>
				</div>
				<p>Demande publique et traçable. Un agent vérifie et lance la recherche automatiquement.</p>
				<ul class="method-perks">
					<li>Traitement automatisé (~5 min)</li>
					<li>Suivi en temps réel</li>
					<li>Nécessite un compte GitHub</li>
				</ul>
				<a
					href={githubIssueUrl}
					target="_blank"
					rel="noopener"
					class="action-btn github-btn"
				>
					Ouvrir une issue GitHub
				</a>
			</div>

			<!-- Contact Form -->
			<div class="method-card method-form">
				<div class="method-header">
					<span class="method-badge private">Sans compte</span>
					<h4>Formulaire</h4>
				</div>
				<p>Demande par email. Nous ajoutons la ville manuellement sous 48h.</p>

				{#if formStatus === 'success'}
					<div class="form-success">
						<p>Demande enregistrée. Nous traiterons votre demande sous 48h.</p>
					</div>
				{:else}
					<form onsubmit={(e) => { e.preventDefault(); submitContactForm(); }}>
						<div class="form-group">
							<label for="req-name">Nom</label>
							<input type="text" id="req-name" bind:value={formName} required minlength="2" placeholder="Votre nom" />
						</div>
						<div class="form-group">
							<label for="req-email">Email</label>
							<input type="email" id="req-email" bind:value={formEmail} required placeholder="votre@email.fr" />
						</div>
						<div class="form-group">
							<label for="req-comment">Commentaire (optionnel)</label>
							<textarea id="req-comment" bind:value={formMessage} rows="2" placeholder="Pourquoi cette ville vous intéresse ?"></textarea>
						</div>
						{#if formError}
							<p class="form-error">{formError}</p>
						{/if}
						<button type="submit" class="action-btn form-btn" disabled={formStatus === 'sending'}>
							{formStatus === 'sending' ? 'Envoi...' : 'Envoyer la demande'}
						</button>
					</form>
				{/if}
			</div>
		</div>

		<!-- Process explanation -->
		<div class="process-info">
			<div class="process-steps">
				<div class="step">
					<span class="step-num">1</span>
					<span class="step-text">Demande</span>
				</div>
				<span class="step-arrow">&rarr;</span>
				<div class="step">
					<span class="step-num">2</span>
					<span class="step-text">Validation</span>
				</div>
				<span class="step-arrow">&rarr;</span>
				<div class="step">
					<span class="step-num">3</span>
					<span class="step-text">Recherche IA</span>
				</div>
				<span class="step-arrow">&rarr;</span>
				<div class="step">
					<span class="step-num">4</span>
					<span class="step-text">Page en ligne</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.request-github {
		max-width: 640px;
		margin: 0 auto;
	}

	.validation-section {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		padding: 1.5rem;
		margin-bottom: 1rem;
	}

	.validation-section h3 {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.5rem;
	}

	.validation-section > p {
		font-size: 0.9rem;
		color: var(--color-text-light);
		margin: 0 0 1rem;
	}

	/* Input */
	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-group label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-foreground);
	}

	.input-wrapper {
		position: relative;
	}

	.input-wrapper input {
		width: 100%;
		padding: 0.875rem 2.5rem 0.875rem 1rem;
		border: 2px solid var(--color-card-border);
		border-radius: var(--radius-md);
		font-size: 1rem;
		transition: border-color 0.15s ease;
	}

	.input-wrapper input:focus {
		outline: none;
		border-color: var(--color-gold);
	}

	.input-status {
		position: absolute;
		right: 0.875rem;
		top: 50%;
		transform: translateY(-50%);
	}

	.input-status.valid {
		color: var(--color-success);
	}

	.input-status.validating {
		color: var(--color-gold);
	}

	.spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.error-message {
		font-size: 0.875rem;
		color: var(--color-coral);
		margin: 0.5rem 0 0;
		padding: 0.75rem;
		background: rgba(224, 122, 95, 0.1);
		border-radius: var(--radius-sm);
	}

	.validated-city {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-gold-light);
		margin-top: 0.75rem;
	}

	.city-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.city-name-display {
		font-weight: 600;
		color: var(--color-foreground);
	}

	.city-details {
		font-size: 0.8rem;
		color: var(--color-text-light);
	}

	.check-badge {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-success);
		padding: 0.375rem 0.75rem;
		background: rgba(74, 157, 110, 0.15);
		border-radius: var(--radius-full);
		white-space: nowrap;
	}

	/* Methods grid */
	.methods-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	@media (max-width: 640px) {
		.methods-grid {
			grid-template-columns: 1fr;
		}
	}

	.method-card {
		padding: 1.25rem;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.method-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.6rem;
	}

	.method-header h4 {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0;
	}

	.method-badge {
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
	}

	.method-badge.public {
		background: rgba(74, 157, 110, 0.12);
		color: var(--color-success);
	}

	.method-badge.private {
		background: rgba(201, 169, 98, 0.12);
		color: var(--color-gold);
	}

	.method-card > p {
		font-size: 0.85rem;
		color: var(--color-text);
		line-height: 1.5;
		margin: 0 0 0.6rem;
	}

	.method-perks {
		list-style: none;
		padding: 0;
		margin: 0 0 0.75rem;
	}

	.method-perks li {
		font-size: 0.8rem;
		color: var(--color-text-light);
		padding: 0.2rem 0 0.2rem 1.1rem;
		position: relative;
	}

	.method-perks li::before {
		content: '\2713';
		position: absolute;
		left: 0;
		color: var(--color-success);
		font-weight: bold;
	}

	/* Buttons */
	.action-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.65rem 1.25rem;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 0.85rem;
		text-decoration: none !important;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
		width: 100%;
	}

	.github-btn {
		background: var(--color-navy);
		color: var(--color-cream) !important;
	}

	.github-btn:hover {
		background: var(--color-navy-light);
		transform: translateY(-1px);
	}

	.form-btn {
		background: var(--color-gold);
		color: var(--color-navy) !important;
		margin-top: 0.5rem;
	}

	.form-btn:hover:not(:disabled) {
		filter: brightness(1.05);
		transform: translateY(-1px);
	}

	.form-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Form */
	.form-group {
		margin-bottom: 0.6rem;
	}

	.form-group label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.2rem;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.5rem 0.65rem;
		border: 1px solid var(--color-card-border);
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
		font-family: inherit;
		color: var(--color-text);
		background: var(--color-card-bg);
		transition: border-color 0.15s;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-gold);
	}

	.form-error {
		color: var(--color-coral);
		font-size: 0.8rem;
		margin: 0 0 0.5rem;
	}

	.form-success {
		padding: 1rem;
		background: rgba(74, 157, 110, 0.08);
		border-radius: var(--radius-md);
		text-align: center;
	}

	.form-success p {
		color: var(--color-success);
		font-weight: 500;
		font-size: 0.9rem;
		margin: 0;
	}

	/* Process steps */
	.process-info {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		padding: 1rem 1.25rem;
	}

	.process-steps {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
	}

	.step-num {
		width: 26px;
		height: 26px;
		background: var(--color-gold);
		color: var(--color-foreground);
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.75rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.step-text {
		font-size: 0.7rem;
		color: var(--color-text-light);
	}

	.step-arrow {
		color: var(--color-gold);
		font-size: 1rem;
		margin-top: -1rem;
	}

	@media (max-width: 400px) {
		.process-steps {
			gap: 0.3rem;
		}
		.step-text {
			font-size: 0.6rem;
		}
	}
</style>
