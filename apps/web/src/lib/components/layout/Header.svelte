<script lang="ts">
	import { comparison } from '$lib/stores/comparison.svelte';
	import { headerSearch } from '$lib/stores/headerSearch.svelte';
	import CitySearch from '$lib/components/CitySearch.svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	interface Props {
		user?: {
			email: string;
			name: string;
			picture: string;
		} | null;
	}

	let { user = null }: Props = $props();

	// Derive compare URL from the first candidate's city
	let compareUrl = $derived(() => {
		const first = comparison.candidates[0];
		if (first?.citySlug) {
			return `/elections/municipales-2026/${first.citySlug}/comparer`;
		}
		return '/elections/municipales-2026/comparer';
	});

	let mobileMenuOpen = $state(false);
	let userMenuOpen = $state(false);
	let dark = $state(browser ? document.documentElement.classList.contains('dark') : false);

	// Auto-follow OS dark mode when user hasn't set a preference
	if (browser) {
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		mq.addEventListener('change', (e) => {
			if (!localStorage.getItem('theme')) {
				dark = e.matches;
				document.documentElement.classList.toggle('dark', dark);
			}
		});
	}

	function toggleTheme() {
		dark = !dark;
		document.documentElement.classList.toggle('dark', dark);
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	}

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
	}

	function closeUserMenu() {
		userMenuOpen = false;
	}

	// Load cities for search on all pages
	onMount(() => {
		headerSearch.ensureCities();
	});

	// On homepage, search only appears when hero search scrolls out of view.
	// On all other pages, search is always visible.
	let isHomepage = $derived($page.url.pathname === '/');
	let showSearch = $derived(
		headerSearch.cities.length > 0 && (!isHomepage || headerSearch.visible)
	);

	// Build breadcrumbs from URL and page data
	let breadcrumbs = $derived(() => {
		const path = $page.url.pathname;
		const parts = path.split('/').filter(Boolean);
		const crumbs: { label: string; href: string }[] = [];
		const pageData = $page.data;

		if (parts[0] === 'elections') {
			if (parts[1]) {
				const electionLabel = parts[1] === 'municipales-2026' ? 'Municipales 2026' : parts[1];
				crumbs.push({ label: electionLabel, href: `/elections/${parts[1]}` });

				if (parts[2]) {
					const breadcrumbInfo = pageData?.breadcrumbInfo;

					if (breadcrumbInfo?.regionSlug && breadcrumbInfo?.regionName) {
						crumbs.push({
							label: breadcrumbInfo.regionName,
							href: `/elections/${parts[1]}?region=${breadcrumbInfo.regionSlug}`
						});
					}

					if (breadcrumbInfo?.departmentCode && breadcrumbInfo?.departmentName) {
						crumbs.push({
							label: breadcrumbInfo.departmentName,
							href: `/elections/${parts[1]}?region=${breadcrumbInfo.regionSlug}&dept=${breadcrumbInfo.departmentCode}`
						});
					}

					const cityName = pageData?.cityData?.city?.name ||
						parts[2].charAt(0).toUpperCase() + parts[2].slice(1).replace(/-/g, ' ');
					crumbs.push({ label: cityName, href: `/elections/${parts[1]}/${parts[2]}` });

					if (parts[3] === 'comparer') {
						crumbs.push({ label: 'Comparer', href: `/elections/${parts[1]}/${parts[2]}/comparer` });
					}
				} else if (browser) {
					const searchParams = $page.url.searchParams;
					const regionSlug = searchParams.get('region');
					const deptCode = searchParams.get('dept');

					if (regionSlug && pageData?.regions) {
						const region = pageData.regions.find((r: { slug: string }) => r.slug === regionSlug);
						if (region) {
							crumbs.push({
								label: region.name,
								href: `/elections/${parts[1]}?region=${regionSlug}`
							});
						}
					}

					if (deptCode && pageData?.departments) {
						const dept = pageData.departments[deptCode];
						if (dept) {
							crumbs.push({
								label: dept.name,
								href: `/elections/${parts[1]}?region=${regionSlug}&dept=${deptCode}`
							});
						}
					}
				}
			}
		}

		return crumbs;
	});

	let showBreadcrumbs = $derived(() => {
		const path = $page.url.pathname;
		const parts = path.split('/').filter(Boolean);
		if (parts[0] === 'elections' && parts.length >= 3) return true;
		if (browser && parts[0] === 'elections' && parts.length === 2) {
			const searchParams = $page.url.searchParams;
			return searchParams.has('region') || searchParams.has('dept');
		}
		return false;
	});

	const navLinks = [
		{ href: '/', label: 'Accueil' },
		{ href: '/elections', label: 'Élections' },
		{ href: '/carte', label: 'Carte' },
		{ href: '/a-propos', label: 'À propos' }
	];

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<header class="header-fixed">
	<div class="header-inner">
		<!-- Logo -->
		<a href="/" class="logo">
			<span class="logo-text">
				maire<span class="logo-accent">.app</span>
			</span>
		</a>

		<!-- Breadcrumbs (city pages) OR Nav links (all other pages) -->
		{#if showBreadcrumbs() && breadcrumbs().length > 0}
			<nav class="breadcrumbs" aria-label="Navigation">
				<a href="/elections" class="breadcrumb-home" aria-label="Accueil élections">
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
					</svg>
				</a>
				{#each breadcrumbs() as crumb, i}
					<span class="breadcrumb-sep">/</span>
					{#if i === breadcrumbs().length - 1}
						<span class="breadcrumb-current">{crumb.label}</span>
					{:else}
						<a href={crumb.href} class="breadcrumb-link">{crumb.label}</a>
					{/if}
				{/each}
			</nav>
		{:else}
			<nav class="nav-desktop">
				{#each navLinks as link}
					<a
						href={link.href}
						class="nav-link"
						class:nav-active={$page.url.pathname === link.href}
					>
						{link.label}
					</a>
				{/each}
			</nav>
		{/if}

		<!-- City Search — always present on desktop (except homepage before scroll) -->
		{#if showSearch}
			<div class="header-search-slot">
				<CitySearch cities={headerSearch.cities} compact onSelect={headerSearch.onSelect} />
			</div>
		{/if}

		<!-- Right Actions -->
		<div class="header-actions">
			<!-- Theme Toggle -->
			<button onclick={toggleTheme} class="theme-btn" aria-label={dark ? 'Mode clair' : 'Mode sombre'}>
				{#if dark}
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				{:else}
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
					</svg>
				{/if}
			</button>

			<!-- Compare Badge -->
			{#if comparison.count > 0}
				<a href={compareUrl()} class="compare-badge">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
					<span class="compare-count">{comparison.count}</span>
				</a>
			{/if}

			<!-- User Menu (admin only) -->
			{#if user}
				<div class="user-menu-container">
					<button
						onclick={toggleUserMenu}
						class="user-menu-btn"
						aria-label="Menu utilisateur"
						aria-expanded={userMenuOpen}
					>
						<img src={user.picture} alt="" class="user-avatar" referrerpolicy="no-referrer" />
						<span class="user-name-desktop">{user.name.split(' ')[0]}</span>
						<svg class="chevron-icon" class:rotated={userMenuOpen} fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if userMenuOpen}
						<button class="user-menu-backdrop" onclick={closeUserMenu} aria-label="Fermer le menu"></button>

						<div class="user-menu-dropdown">
							<div class="user-menu-header">
								<span class="user-menu-name">{user.name}</span>
								<span class="user-menu-email">{user.email}</span>
							</div>
							<div class="user-menu-divider"></div>
							<a href="/profil" class="user-menu-item" onclick={closeUserMenu}>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
								Mon Profil
							</a>
							<a href="/fonctionnalites" class="user-menu-item" onclick={closeUserMenu}>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
								</svg>
								Fonctionnalités
							</a>
							<div class="user-menu-divider"></div>
							<a href="/api/auth/logout" class="user-menu-item user-menu-logout">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
								Déconnexion
							</a>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Mobile Menu Button -->
			<button
				onclick={toggleMobileMenu}
				class="menu-btn"
				aria-label="Menu"
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					{#if mobileMenuOpen}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					{/if}
				</svg>
			</button>
		</div>
	</div>

	<!-- Mobile Menu -->
	{#if mobileMenuOpen}
		<div class="mobile-menu">
			<!-- Mobile Search -->
			{#if headerSearch.cities.length > 0}
				<div class="mobile-search">
					<CitySearch cities={headerSearch.cities} compact onSelect={headerSearch.onSelect} />
				</div>
			{/if}

			{#each navLinks as link}
				<a
					href={link.href}
					onclick={() => (mobileMenuOpen = false)}
					class="mobile-link"
				>
					{link.label}
				</a>
			{/each}

			<!-- Mobile User Section -->
			{#if user}
				<div class="mobile-user-section">
					<div class="mobile-user-info">
						<img src={user.picture} alt="" class="mobile-user-avatar" referrerpolicy="no-referrer" />
						<div>
							<span class="mobile-user-name">{user.name}</span>
							<span class="mobile-user-email">{user.email}</span>
						</div>
					</div>
					<a href="/profil" onclick={() => (mobileMenuOpen = false)} class="mobile-link">
						Mon Profil
					</a>
					<a href="/fonctionnalites" onclick={() => (mobileMenuOpen = false)} class="mobile-link">
						Fonctionnalités
					</a>
					<a href="/api/auth/logout" class="mobile-link mobile-logout">
						Déconnexion
					</a>
				</div>
			{/if}

			<!-- Mobile Breadcrumbs -->
			{#if breadcrumbs().length > 0}
				<div class="mobile-breadcrumbs">
					<span class="mobile-crumb-label">Vous êtes ici :</span>
					{#each breadcrumbs() as crumb, i}
						{#if i > 0}<span class="mobile-sep">›</span>{/if}
						<a href={crumb.href} onclick={() => (mobileMenuOpen = false)} class="mobile-crumb">{crumb.label}</a>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</header>

<!-- Spacer for fixed header -->
<div class="header-spacer"></div>

<style>
	/* Header Base */
	.header-fixed {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 50;
		background: var(--color-surface-glass);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--color-card-border);
	}

	.header-inner {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 0.75rem;
		display: flex;
		align-items: center;
		height: 44px;
		gap: 0.75rem;
	}

	@media (min-width: 768px) {
		.header-inner {
			padding: 0 1.5rem;
			height: 52px;
			gap: 1rem;
		}
	}

	.header-spacer {
		height: 44px;
	}

	@media (min-width: 768px) {
		.header-spacer {
			height: 52px;
		}
	}

	/* Logo */
	.logo {
		flex-shrink: 0;
	}

	.logo-text {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-foreground);
	}

	@media (min-width: 768px) {
		.logo-text {
			font-size: 1.25rem;
		}
	}

	.logo-accent {
		background: linear-gradient(135deg, var(--color-gold) 0%, var(--color-coral) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Breadcrumbs */
	.breadcrumbs {
		display: none;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		min-width: 0;
		overflow: hidden;
	}

	@media (min-width: 640px) {
		.breadcrumbs {
			display: flex;
			gap: 0.5rem;
			font-size: 0.8rem;
		}
	}

	.breadcrumb-home {
		color: var(--color-text-muted);
		display: flex;
		align-items: center;
		flex-shrink: 0;
		transition: color 0.15s ease;
	}

	.breadcrumb-home:hover {
		color: var(--color-gold);
	}

	.breadcrumb-sep {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.breadcrumb-link {
		color: var(--color-text-light);
		transition: color 0.15s ease;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 80px;
	}

	@media (min-width: 768px) {
		.breadcrumb-link { max-width: 120px; }
	}

	@media (min-width: 1024px) {
		.breadcrumb-link { max-width: 160px; }
	}

	.breadcrumb-link:hover {
		color: var(--color-gold);
	}

	.breadcrumb-current {
		color: var(--color-foreground);
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 80px;
	}

	@media (min-width: 768px) {
		.breadcrumb-current { max-width: 120px; }
	}

	@media (min-width: 1024px) {
		.breadcrumb-current { max-width: 200px; }
	}

	/* Desktop Nav */
	.nav-desktop {
		display: none;
		align-items: center;
		gap: 1.25rem;
		flex-shrink: 0;
	}

	@media (min-width: 768px) {
		.nav-desktop {
			display: flex;
		}
	}

	.nav-link {
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--color-text);
		transition: color 0.15s ease;
		white-space: nowrap;
	}

	.nav-link:hover,
	.nav-link.nav-active {
		color: var(--color-gold);
	}

	/* Header Search — fills remaining space between nav and actions */
	.header-search-slot {
		display: none;
		flex: 1;
		min-width: 0;
		max-width: 320px;
	}

	@media (min-width: 768px) {
		.header-search-slot {
			display: block;
		}
	}

	/* Header Actions */
	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
		margin-left: auto;
	}

	@media (min-width: 768px) {
		.header-actions {
			gap: 0.75rem;
		}
	}

	/* Compare Badge */
	.compare-badge {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: var(--color-gold);
		color: var(--color-foreground);
		border-radius: var(--radius-full);
		font-size: 0.7rem;
		font-weight: 600;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	@media (min-width: 768px) {
		.compare-badge {
			gap: 0.375rem;
			padding: 0.375rem 0.625rem;
			font-size: 0.75rem;
		}
	}

	.compare-badge:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(201, 169, 98, 0.4);
	}

	.compare-count {
		background: var(--color-navy);
		color: var(--color-gold);
		width: 16px;
		height: 16px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.65rem;
		font-weight: 700;
	}

	@media (min-width: 768px) {
		.compare-count {
			width: 18px;
			height: 18px;
			font-size: 0.7rem;
		}
	}

	/* Menu Button (mobile) */
	.menu-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		color: var(--color-foreground);
		border-radius: var(--radius-md);
		transition: background 0.15s ease;
	}

	@media (min-width: 768px) {
		.menu-btn {
			display: none;
		}
	}

	.menu-btn:hover {
		background: var(--color-cream-dark);
	}

	/* Mobile Menu */
	.mobile-menu {
		display: block;
		padding: 0.5rem 0.75rem 0.75rem;
		background: var(--color-card-bg);
		border-top: 1px solid var(--color-card-border);
	}

	@media (min-width: 768px) {
		.mobile-menu {
			display: none;
		}
	}

	.mobile-search {
		padding: 0.375rem 0 0.625rem;
		border-bottom: 1px solid var(--color-card-border);
		margin-bottom: 0.375rem;
	}

	.mobile-link {
		display: block;
		padding: 0.625rem 0.5rem;
		color: var(--color-text);
		font-size: 0.9rem;
		font-weight: 500;
		border-radius: var(--radius-md);
		transition: background 0.15s ease;
	}

	.mobile-link:hover {
		background: var(--color-cream-dark);
	}

	.mobile-breadcrumbs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		margin-top: 0.375rem;
		background: var(--color-cream);
		border-radius: var(--radius-md);
		font-size: 0.75rem;
	}

	.mobile-crumb-label {
		color: var(--color-text-muted);
		font-size: 0.7rem;
		margin-right: 0.25rem;
	}

	.mobile-sep {
		color: var(--color-text-muted);
	}

	.mobile-crumb {
		color: var(--color-foreground);
		font-weight: 500;
	}

	.mobile-crumb:hover {
		color: var(--color-gold);
	}

	/* User Menu */
	.user-menu-container {
		position: relative;
	}

	.user-menu-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-full);
		background: var(--color-cream);
		border: 1px solid var(--color-card-border);
		transition: all 0.15s ease;
		cursor: pointer;
	}

	.user-menu-btn:hover {
		background: var(--color-cream-dark);
		border-color: var(--color-gold-light);
	}

	.user-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: cover;
	}

	@media (min-width: 768px) {
		.user-avatar {
			width: 32px;
			height: 32px;
		}
	}

	.user-name-desktop {
		display: none;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--color-foreground);
		max-width: 80px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (min-width: 768px) {
		.user-name-desktop {
			display: block;
		}
	}

	.chevron-icon {
		width: 14px;
		height: 14px;
		color: var(--color-text-muted);
		transition: transform 0.2s ease;
	}

	.chevron-icon.rotated {
		transform: rotate(180deg);
	}

	.user-menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: transparent;
		cursor: default;
	}

	.user-menu-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		z-index: 50;
		min-width: 220px;
		background: var(--color-card-bg);
		border-radius: var(--radius-lg);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
		border: 1px solid var(--color-card-border);
		overflow: hidden;
		animation: dropdownFadeIn 0.15s ease;
	}

	@keyframes dropdownFadeIn {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.user-menu-header {
		padding: 0.875rem 1rem;
		background: var(--color-cream);
	}

	.user-menu-name {
		display: block;
		font-weight: 600;
		color: var(--color-foreground);
		font-size: 0.9rem;
	}

	.user-menu-email {
		display: block;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.125rem;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-menu-divider {
		height: 1px;
		background: var(--color-card-border);
	}

	.user-menu-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		color: var(--color-text);
		transition: background 0.15s ease;
	}

	.user-menu-item:hover {
		background: var(--color-cream);
	}

	.user-menu-item svg {
		color: var(--color-text-muted);
	}

	.user-menu-logout {
		color: var(--color-coral);
	}

	.user-menu-logout:hover {
		background: rgba(224, 122, 95, 0.1);
	}

	.user-menu-logout svg {
		color: var(--color-coral);
	}

	/* Mobile User Section */
	.mobile-user-section {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-card-border);
	}

	.mobile-user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0.5rem;
	}

	.mobile-user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
	}

	.mobile-user-name {
		display: block;
		font-weight: 600;
		color: var(--color-foreground);
		font-size: 0.9rem;
	}

	.mobile-user-email {
		display: block;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.mobile-logout {
		color: var(--color-coral);
	}

	/* Theme Toggle */
	.theme-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		color: var(--color-foreground);
		border-radius: var(--radius-md);
		transition: background 0.15s ease, color 0.15s ease;
		cursor: pointer;
		border: none;
		background: none;
	}

	.theme-btn:hover {
		background: var(--color-cream-dark);
		color: var(--color-gold);
	}
</style>
