#!/usr/bin/env node
/**
 * Download candidate photos from Wikimedia Commons, detect face, smart-crop, resize to 400px wide.
 * Saves to static/data/photos/{city-slug}/{candidate-id}.jpg
 * Updates city JSON files to point to local paths.
 *
 * Usage: node scripts/download-photos.js
 */

import sharp from 'sharp';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { detectFaces, computeFaceCrop } from './face-detect.js';

const CITIES_DIR = join(import.meta.dirname, '../static/data/cities');
const PHOTOS_DIR = join(import.meta.dirname, '../static/data/photos');
const WIDTH = 400;
const JPEG_QUALITY = 80;
const DELAY_MS = 2000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function processPhoto(buffer, label) {
	const meta = await sharp(buffer).metadata();
	const faces = await detectFaces(buffer);

	if (faces.length === 0) {
		console.warn(`  WARN no face detected: ${label}`);
		return sharp(buffer).resize({ width: WIDTH, withoutEnlargement: true }).jpeg({ quality: JPEG_QUALITY }).toBuffer();
	}

	const crop = computeFaceCrop(faces[0], meta.width, meta.height);

	// Skip crop if it covers almost the entire image (no meaningful crop)
	const area = crop.width * crop.height;
	const totalArea = meta.width * meta.height;
	if (area > totalArea * 0.95) {
		return sharp(buffer).resize({ width: WIDTH, withoutEnlargement: true }).jpeg({ quality: JPEG_QUALITY }).toBuffer();
	}

	return sharp(buffer)
		.extract(crop)
		.resize({ width: WIDTH, withoutEnlargement: true })
		.jpeg({ quality: JPEG_QUALITY })
		.toBuffer();
}

async function main() {
	const files = (await readdir(CITIES_DIR)).filter((f) => f.endsWith('.json'));
	let total = 0, downloaded = 0, skipped = 0, failed = 0;

	for (const file of files) {
		const citySlug = file.replace('.json', '');
		const filePath = join(CITIES_DIR, file);
		const data = JSON.parse(await readFile(filePath, 'utf-8'));
		let modified = false;

		for (const candidate of data.candidates || []) {
			const url = candidate.photo;
			if (!url || !url.includes('wikimedia.org')) continue;
			total++;

			const localPath = `/data/photos/${citySlug}/${candidate.id}.jpg`;
			const outFile = join(PHOTOS_DIR, citySlug, `${candidate.id}.jpg`);

			if (candidate.photo === localPath) {
				skipped++;
				continue;
			}

			await mkdir(join(PHOTOS_DIR, citySlug), { recursive: true });

			try {
				const res = await fetch(url, {
					headers: { 'User-Agent': 'maire.app/1.0 (civic project; contact@maire.app)' }
				});
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const rawBuffer = Buffer.from(await res.arrayBuffer());

				const result = await processPhoto(rawBuffer, `${citySlug}/${candidate.id}`);
				await writeFile(outFile, result);

				candidate.photo = localPath;
				modified = true;
				downloaded++;
				console.log(`  OK  ${citySlug}/${candidate.id}.jpg`);
			} catch (err) {
				failed++;
				console.error(`  FAIL ${citySlug}/${candidate.id}: ${err.message}`);
			}

			await sleep(DELAY_MS);
		}

		if (modified) {
			await writeFile(filePath, JSON.stringify(data, null, '\t') + '\n');
		}
	}

	console.log(`\nDone: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed (${total} total)`);
}

main();
