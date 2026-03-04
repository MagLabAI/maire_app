import type { PageLoad } from './$types';

export const prerender = true;

interface FaqEntry {
	id: string;
	category: string;
	question: string;
	answer: string;
	keywords: string[];
}

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/data/faq.json');
	const faqData: FaqEntry[] = await res.json();
	return { faqData };
};
