<script lang="ts">
	interface Props {
		user: { email: string; name: string; picture: string } | null;
		initialCityName?: string;
	}

	let { user, initialCityName = '' }: Props = $props();

	let cityName = $state(initialCityName);
	let validatedCity = $state<{
		nom: string;
		code: string;
		population: number;
		departement: { code: string; nom: string };
		region: { code: string; nom: string };
	} | null>(null);
	let isValidating = $state(false);
	let isSubmitting = $state(false);
	let validationError = $state<string | null>(null);
	let submitError = $state<string | null>(null);
	let submitSuccess = $state<{
		message: string;
		queuePosition: number;
	} | null>(null);

	// Debounce validation
	let validationTimeout: ReturnType<typeof setTimeout>;

	function handleCityInput() {
		validatedCity = null;
		validationError = null;
		submitSuccess = null;
		submitError = null;

		clearTimeout(validationTimeout);

		if (cityName.trim().length < 2) {
			return;
		}

		validationTimeout = setTimeout(validateCity, 500);
	}

	async function validateCity() {
		if (cityName.trim().length < 2) return;

		isValidating = true;
		validationError = null;

		try {
			const params = new URLSearchParams({
				nom: cityName.trim(),
				fields: 'nom,code,population,departement,region',
				boost: 'population',
				limit: '5'
			});

			const res = await fetch(`https://geo.api.gouv.fr/communes?${params}`);
			if (!res.ok) throw new Error('Erreur de connexion');

			const cities = await res.json();

			if (!cities.length) {
				validationError = `Aucune commune française trouvée pour "${cityName}"`;
				validatedCity = null;
				return;
			}

			// Find exact match or best match
			const exactMatch = cities.find(
				(c: any) => c.nom.toLowerCase() === cityName.trim().toLowerCase()
			);
			validatedCity = exactMatch || cities[0];

			// Update input with official name
			if (validatedCity) {
				cityName = validatedCity.nom;
			}
		} catch (e) {
			validationError = 'Erreur lors de la validation de la ville';
		} finally {
			isValidating = false;
		}
	}

	async function handleSubmit() {
		if (!validatedCity || !user) return;

		isSubmitting = true;
		submitError = null;

		try {
			const res = await fetch('/api/city/request', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cityName: validatedCity.nom })
			});

			const data = await res.json();

			if (!res.ok) {
				submitError = data.message || 'Erreur lors de la demande';
				return;
			}

			submitSuccess = {
				message: data.message,
				queuePosition: data.queuePosition
			};
		} catch (e) {
			submitError = 'Erreur de connexion au serveur';
		} finally {
			isSubmitting = false;
		}
	}

	function handleLogin() {
		const returnUrl = encodeURIComponent(window.location.pathname);
		window.location.href = `/api/auth/google?returnUrl=${returnUrl}`;
	}
</script>

<div class="request-form">
	{#if submitSuccess}
		<!-- Success State -->
		<div class="success-state">
			<div class="success-icon">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<h3>Demande enregistrée</h3>
			<p class="success-message">{submitSuccess.message}</p>
			<div class="queue-badge">
				<span class="queue-number">{submitSuccess.queuePosition}</span>
				<span class="queue-label">Position dans la file</span>
			</div>
			<p class="success-info">
				La recherche sera effectuée automatiquement cette nuit.
				Revenez demain pour découvrir les candidats !
			</p>
			<button class="btn btn-secondary" onclick={() => location.reload()}>
				Actualiser la page
			</button>
		</div>
	{:else}
		<!-- Request Form -->
		<div class="form-header">
			<h3>Demander cette ville</h3>
			<p>Entrez le nom exact de la commune française pour lancer une recherche</p>
		</div>

		<div class="form-body">
			<div class="input-group">
				<label for="city-input">Nom de la commune</label>
				<div class="input-wrapper">
					<input
						id="city-input"
						type="text"
						bind:value={cityName}
						oninput={handleCityInput}
						placeholder="Ex: Rognaix, Chamonix-Mont-Blanc..."
						disabled={isSubmitting}
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
						<span class="city-name">{validatedCity.nom}</span>
						<span class="city-details">
							{validatedCity.departement.nom} ({validatedCity.departement.code}) •
							{validatedCity.population.toLocaleString('fr-FR')} hab.
						</span>
					</div>
					<span class="check-badge">Commune valide</span>
				</div>
			{/if}

			{#if submitError}
				<p class="error-message submit-error">{submitError}</p>
			{/if}

			{#if user}
				<!-- Authenticated: show submit button -->
				<div class="auth-info">
					<img src={user.picture} alt="" class="user-avatar" />
					<span class="user-email">{user.email}</span>
				</div>

				<button
					class="btn btn-primary"
					onclick={handleSubmit}
					disabled={!validatedCity || isSubmitting || isValidating}
				>
					{#if isSubmitting}
						<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						Envoi en cours...
					{:else}
						Demander la recherche
					{/if}
				</button>
			{:else}
				<!-- Not authenticated: show login prompt -->
				<div class="login-prompt">
					<p>Connectez-vous avec Google pour demander une recherche</p>
					<button class="btn btn-google" onclick={handleLogin}>
						<svg width="18" height="18" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						Connexion avec Google
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.request-form {
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		overflow: hidden;
		max-width: 480px;
		margin: 0 auto;
	}

	.form-header {
		padding: 1.5rem;
		background: var(--color-navy);
		color: #faf8f5;
	}

	.form-header h3 {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
	}

	.form-header p {
		font-size: 0.875rem;
		opacity: 0.8;
		margin: 0;
	}

	.form-body {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-group label {
		font-size: 0.875rem;
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

	.input-wrapper input:disabled {
		background: var(--color-cream);
		cursor: not-allowed;
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
		margin: 0;
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
	}

	.city-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.city-info .city-name {
		font-weight: 600;
		color: var(--color-foreground);
	}

	.city-info .city-details {
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
	}

	.auth-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
	}

	.user-email {
		font-size: 0.875rem;
		color: var(--color-text);
	}

	.login-prompt {
		text-align: center;
		padding: 1rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
	}

	.login-prompt p {
		font-size: 0.875rem;
		color: var(--color-text);
		margin: 0 0 1rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		border-radius: var(--radius-md);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
		border: none;
		width: 100%;
	}

	.btn-primary {
		background: var(--color-gold);
		color: var(--color-foreground);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-gold-light);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: var(--color-cream);
		color: var(--color-foreground);
		border: 1px solid var(--color-card-border);
	}

	.btn-secondary:hover {
		background: var(--color-card-border);
	}

	.btn-google {
		background: var(--color-card-bg);
		color: var(--color-text);
		border: 1px solid var(--color-card-border);
	}

	.btn-google:hover {
		background: var(--color-cream);
	}

	/* Success State */
	.success-state {
		padding: 2rem 1.5rem;
		text-align: center;
	}

	.success-icon {
		color: var(--color-success);
		margin-bottom: 1rem;
	}

	.success-state h3 {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-foreground);
		margin: 0 0 0.75rem;
	}

	.success-message {
		font-size: 0.95rem;
		color: var(--color-text);
		margin: 0 0 1.5rem;
	}

	.queue-badge {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem 1.5rem;
		background: var(--color-gold-light);
		border-radius: var(--radius-md);
		margin-bottom: 1.5rem;
	}

	.queue-number {
		font-family: var(--font-display);
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--color-foreground);
		line-height: 1;
	}

	.queue-label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.success-info {
		font-size: 0.875rem;
		color: var(--color-text-light);
		margin: 0 0 1.5rem;
		line-height: 1.5;
	}
</style>
