<script lang="ts">
	const currentYear = new Date().getFullYear();
	const emailUser = 'contact';
	const emailDomain = 'maire.app';
</script>

<footer class="bg-[var(--color-navy)] text-[#faf8f5] mt-auto">
	<div class="container-app py-12 md:py-16">
		<div class="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-10">
			<!-- Brand -->
			<div class="md:col-span-2">
				<a href="/" class="inline-block mb-4">
					<span class="text-3xl font-display font-bold">
						maire<span class="text-[var(--color-gold)]">.app</span>
					</span>
				</a>
				<p class="text-[var(--color-text-light)] max-w-md leading-relaxed">
					Projet communautaire non commercial par <a href="https://github.com/MagLabAI" target="_blank" rel="noopener" class="text-[var(--color-gold)] underline decoration-[var(--color-gold)]/40 hover:decoration-[var(--color-gold)]">MagLab Studio</a>.
					L'IA au service de la transparence démocratique.
				</p>
				<p class="text-xs text-[var(--color-text-light)] mt-3 max-w-md leading-relaxed">
					Contenu généré par intelligence artificielle (Mistral 3 Large) à partir de sources publiques.
					Peut contenir des erreurs. Fourni « tel quel » à titre informatif.
					<a href="/corrections" class="text-[var(--color-gold)] underline decoration-[var(--color-gold)]/40 hover:decoration-[var(--color-gold)]">En savoir plus</a>
				</p>
				<p class="text-xs text-[var(--color-text-light)] mt-2 max-w-md">
					Licence : <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener" class="text-[var(--color-gold)] underline decoration-[var(--color-gold)]/40 hover:decoration-[var(--color-gold)]">MIT</a> / <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener" class="text-[var(--color-gold)] underline decoration-[var(--color-gold)]/40 hover:decoration-[var(--color-gold)]">CC BY-SA 4.0</a>
				</p>
			</div>

			<!-- Navigation -->
			<div>
				<h4 class="font-display font-semibold text-lg mb-4">Navigation</h4>
				<ul class="space-y-3">
					<li>
						<a href="/elections" class="text-[var(--color-text-light)] hover:text-[var(--color-gold)] transition-colors">
							Élections
						</a>
					</li>
					<li>
						<a href="/elections/municipales-2026" class="text-[var(--color-text-light)] hover:text-[var(--color-gold)] transition-colors">
							Municipales 2026
						</a>
					</li>
					<li>
						<a href="/a-propos" class="text-[var(--color-text-light)] hover:text-[var(--color-gold)] transition-colors">
							À propos
						</a>
					</li>
					<li>
						<a href="/corrections" class="text-[var(--color-text-light)] hover:text-[var(--color-gold)] transition-colors">
							Transparence IA
						</a>
					</li>
					<li>
						<a href="/faq" class="text-[var(--color-text-light)] hover:text-[var(--color-gold)] transition-colors">
							Questions fréquentes
						</a>
					</li>
				</ul>
			</div>

			<!-- Comprendre -->
			<div>
				<h4 class="font-display font-semibold text-lg mb-4">Comprendre</h4>
				<ul class="space-y-3">
					<li>
						<a href="/gouvernance" class="text-[var(--color-text-light)] hover:text-[var(--color-gold)] transition-colors">
							Gouvernance municipale
						</a>
					</li>
					<li>
						<a href="/devenir-maire" class="text-[var(--color-text-light)] hover:text-[var(--color-gold)] transition-colors">
							Devenir maire
						</a>
					</li>
					<li>
						<a href="/couverture" class="text-[var(--color-text-light)] hover:text-[var(--color-gold)] transition-colors">
							Couverture
						</a>
					</li>
				</ul>
			</div>

			<!-- Informations + Open Data -->
			<div>
				<h4 class="font-display font-semibold text-lg mb-4">Informations</h4>
				<ul class="space-y-3">
					<li>
						<a href="/mentions-legales" class="text-[var(--color-text-light)] hover:text-[var(--color-gold)] transition-colors">
							Mentions légales
						</a>
					</li>
					<li>
						<a href="https://github.com/MagLabAI/maire_app" target="_blank" rel="noopener" class="text-[var(--color-text-light)] hover:text-[var(--color-gold)] transition-colors">
							Code source (GitHub)
						</a>
					</li>
					<li>
						<a href="https://www.data.gouv.fr/reuses/maire-app" target="_blank" rel="noopener" class="text-[var(--color-text-light)] hover:text-[var(--color-gold)] transition-colors">
							Réutilisation data.gouv.fr
						</a>
					</li>
					<li>
						<a href="/corrections" class="text-[var(--color-text-light)] hover:text-[var(--color-gold)] transition-colors">
							Signaler une erreur
						</a>
					</li>
				</ul>
			</div>
		</div>

		<!-- Bottom Bar -->
		<div class="mt-12 pt-8 border-t border-[var(--color-navy-light)] flex flex-col sm:flex-row justify-between items-center gap-4">
			<p class="text-sm text-[var(--color-text-light)]">
				© {currentYear} <a href="https://github.com/MagLabAI" target="_blank" rel="noopener" class="text-[var(--color-gold)] underline decoration-[var(--color-gold)]/40 hover:decoration-[var(--color-gold)]">MagLab Studio</a> — Projet communautaire open source
			</p>
			<div class="flex items-center gap-4 text-xs text-[var(--color-text-light)]">
				<span>Hébergé en UE</span>
				<span>·</span>
				<a href="mailto:{emailUser}@{emailDomain}" class="text-[var(--color-gold)] underline decoration-[var(--color-gold)]/40 hover:decoration-[var(--color-gold)]">{emailUser}@{emailDomain}</a>
			</div>
		</div>
	</div>
</footer>
