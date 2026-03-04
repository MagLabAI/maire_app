<script lang="ts">
	import { SITE_URL } from '$lib/config';

	interface Props {
		title: string;
		description: string;
		path: string;
		type?: 'website' | 'article';
		image?: string;
		imageAlt?: string;
	}

	let {
		title,
		description,
		path,
		type = 'website',
		image,
		imageAlt
	}: Props = $props();

	const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
	let canonicalUrl = $derived(`${SITE_URL}${path}`);
	let ogImage = $derived(image || DEFAULT_OG_IMAGE);
	let ogImageAlt = $derived(
		imageAlt || 'maire.app — plateforme citoyenne pour les élections municipales'
	);
</script>

<link rel="canonical" href={canonicalUrl} />

<meta property="og:type" content={type} />
<meta property="og:url" content={canonicalUrl} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogImage} />
<meta property="og:image:alt" content={ogImageAlt} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="fr_FR" />
<meta property="og:site_name" content="maire.app" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImage} />
<meta name="twitter:image:alt" content={ogImageAlt} />
