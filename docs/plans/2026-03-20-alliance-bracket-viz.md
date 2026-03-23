# Design: Alliance Bracket Visualization

**Date**: 2026-03-20
**Status**: Approved
**Scope**: Bottom-up merge bracket showing R1 lists merging into R2 alliances

---

## Overview

Bottom-up merge bracket showing R1 lists merging into R2 alliances, with winner at the top. Embedded in the city election page after R1 results bar graph.

## Visual Encoding

- Merged lists: connected by SVG lines going up to R2 alliance card, green tint
- Withdrawn lists: faded, dashed border, strikethrough on name
- Qualified solo: connected straight up to R2 card
- Winner: gold border, trophy icon
- Cards: reuse existing card styling (rounded, shadow, nuance color stripe)

## Data Requirements

Already in the model:
- `round1.lists[].merged` / `.mergedWith` / `.withdrawn`
- `round2.alliances[]` with `{ name, listIds, description }`
- `round2.lists[]` with R2 results
- `winner` with final result

## Component

New `AllianceBracket.svelte` in maire_app, placed on city page when `results.status` is `between-rounds` or later.

## Prerequisites

- Run `update_alliances.py` (needs R2 official list data)
- R2 results ingestion via `ingest_results.py`
