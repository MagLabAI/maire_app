/**
 * Face detection module using UltraFace ONNX model via onnxruntime-node.
 * Auto-downloads the model (~1.2MB) on first run.
 *
 * Usage:
 *   import { detectFaces, computeFaceCrop } from './face-detect.js';
 *   const faces = await detectFaces(imageBuffer);
 *   if (faces.length > 0) {
 *     const crop = computeFaceCrop(faces[0], imgW, imgH);
 *     // sharp(buffer).extract(crop).resize(400).jpeg().toFile(...)
 *   }
 */

import ort from 'onnxruntime-node';
import sharp from 'sharp';
import { existsSync } from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

const MODEL_URL =
	'https://github.com/Linzaer/Ultra-Light-Fast-Generic-Face-Detector-1MB/raw/master/models/onnx/version-RFB-320.onnx';
const MODEL_PATH = join(import.meta.dirname, 'models/version-RFB-320.onnx');
const INPUT_W = 320;
const INPUT_H = 240;
const CONFIDENCE_THRESHOLD = 0.65;

let session = null;

async function ensureModel() {
	if (existsSync(MODEL_PATH)) return;
	console.log('Downloading UltraFace ONNX model...');
	await mkdir(dirname(MODEL_PATH), { recursive: true });
	const res = await fetch(MODEL_URL, { redirect: 'follow' });
	if (!res.ok) throw new Error(`Model download failed: HTTP ${res.status}`);
	await writeFile(MODEL_PATH, Buffer.from(await res.arrayBuffer()));
	console.log('Model ready.');
}

async function getSession() {
	if (session) return session;
	await ensureModel();
	session = await ort.InferenceSession.create(MODEL_PATH);
	return session;
}

/**
 * Detect faces in an image buffer (any format sharp supports).
 * Returns array of { x1, y1, x2, y2, confidence } in original pixel coords,
 * sorted by area descending (largest face first).
 */
export async function detectFaces(imageBuffer) {
	const sess = await getSession();
	const meta = await sharp(imageBuffer).metadata();
	const origW = meta.width;
	const origH = meta.height;

	// Resize to model input and get raw RGB
	const rgbBuf = await sharp(imageBuffer)
		.resize(INPUT_W, INPUT_H, { fit: 'fill' })
		.removeAlpha()
		.raw()
		.toBuffer();

	// HWC → CHW float32, normalized (pixel - 127) / 128
	const float32 = new Float32Array(3 * INPUT_H * INPUT_W);
	for (let c = 0; c < 3; c++) {
		for (let y = 0; y < INPUT_H; y++) {
			for (let x = 0; x < INPUT_W; x++) {
				float32[c * INPUT_H * INPUT_W + y * INPUT_W + x] =
					(rgbBuf[(y * INPUT_W + x) * 3 + c] - 127.0) / 128.0;
			}
		}
	}

	const input = new ort.Tensor('float32', float32, [1, 3, INPUT_H, INPUT_W]);
	const results = await sess.run({ input });

	// Output tensor names vary by model export — find scores & boxes by shape
	const outputs = Object.values(results);
	let scores, boxes;
	for (const t of outputs) {
		if (t.dims.length === 3 && t.dims[2] === 2) scores = t;
		if (t.dims.length === 3 && t.dims[2] === 4) boxes = t;
	}
	if (!scores || !boxes) return [];

	const numAnchors = scores.dims[1];
	const faces = [];

	for (let i = 0; i < numAnchors; i++) {
		const confidence = scores.data[i * 2 + 1];
		if (confidence < CONFIDENCE_THRESHOLD) continue;

		// Boxes are normalized [0,1] relative to input dimensions
		const x1 = Math.max(0, boxes.data[i * 4 + 0]) * origW;
		const y1 = Math.max(0, boxes.data[i * 4 + 1]) * origH;
		const x2 = Math.min(1, boxes.data[i * 4 + 2]) * origW;
		const y2 = Math.min(1, boxes.data[i * 4 + 3]) * origH;

		if (x2 > x1 && y2 > y1) {
			faces.push({ x1, y1, x2, y2, confidence });
		}
	}

	// Largest face first (by area)
	faces.sort((a, b) => (b.x2 - b.x1) * (b.y2 - b.y1) - (a.x2 - a.x1) * (a.y2 - a.y1));
	return faces;
}

/**
 * Compute a crop rectangle centered on the detected face with generous padding.
 * Face ends up near vertical center so CSS object-fit: cover shows it in any ratio.
 * Crop is clamped to image bounds (no empty bands).
 *
 * Returns { left, top, width, height } in pixels.
 */
export function computeFaceCrop(face, imgW, imgH) {
	const fw = face.x2 - face.x1;
	const fh = face.y2 - face.y1;
	const cx = (face.x1 + face.x2) / 2;
	const cy = (face.y1 + face.y2) / 2;

	// Padding around face: generous but asymmetric (more below for shoulders)
	const padX = fw * 1.2;
	const padUp = fh * 1.0;
	const padDown = fh * 1.6;

	let cropW = fw + padX * 2;
	let cropH = fh + padUp + padDown;

	// Cap to image dimensions
	cropW = Math.min(cropW, imgW);
	cropH = Math.min(cropH, imgH);

	// Center horizontally on face, vertically place face at ~40% from top
	let left = cx - cropW / 2;
	let top = cy - cropH * 0.38;

	// Shift to stay within bounds
	if (left < 0) left = 0;
	if (top < 0) top = 0;
	if (left + cropW > imgW) left = imgW - cropW;
	if (top + cropH > imgH) top = imgH - cropH;

	return {
		left: Math.round(Math.max(0, left)),
		top: Math.round(Math.max(0, top)),
		width: Math.round(cropW),
		height: Math.round(cropH)
	};
}
