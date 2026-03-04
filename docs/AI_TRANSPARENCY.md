# AI Transparency — maire.app

## Overview

maire.app uses AI to generate informational content about French municipal election candidates. This document describes our methodology, known limitations, and correction process.

## AI Model

| Parameter | Value |
|-----------|-------|
| **Model** | Mistral 3 Large |
| **Provider** | Mistral AI (Paris, France) |
| **Method** | Web search + structured synthesis |
| **Languages** | French (primary) |

## Methodology

### 1. Research Phase

For each city, the AI performs web searches to find:
- Declared or likely candidates
- Current mayor's track record
- Local issues and challenges
- Political landscape and dynamics
- 2020 election results for historical context

### 2. Synthesis Phase

The AI produces a structured JSON output with:
- Candidate profiles (name, age, profession, political background)
- Incumbent analysis (achievements, debates, running again?)
- Local issues ranked by importance
- Electoral context (themes, dynamics, voter expectations)
- City information (demographics, economy, notable features)

### 3. Publication Phase

Content is published with:
- Clear "AI-generated content" disclaimer on every page
- Generation date
- Link to report errors via GitHub
- Random candidate ordering to avoid position bias

## Known Limitations

### Hallucinations
AI can fabricate plausible but false information: a mandate that never existed, a statement never made, a project that doesn't exist. This is an inherent limitation of large language models.

### Temporal Bias
Web sources evolve. A candidate may declare or withdraw after the last update. Profiles only reflect the state of sources at generation time.

### Coverage Bias
Candidates with strong media presence are better documented. Newcomers from civil society may have less detailed or less accurate profiles.

### Formulation Bias
The AI's word choices, information ordering, and tone can inadvertently favor or disfavor a candidate — even when neutrality is the goal.

## Fairness Measures

| Measure | Implementation |
|---------|---------------|
| **Random ordering** | Candidate cards are shuffled on each page load |
| **Uniform format** | Same structure and level of detail for every candidate |
| **No political colors** | Gold/navy/cream palette avoids party associations |
| **Non-hierarchical labels** | "Sortant/Expérimenté/Renouveau" instead of value-laden rarities |
| **No predictions** | Removed all "chances estimate" fields |
| **No fake polls** | No "public perception" presented as fact |

## Correction Process

### For anyone
1. Open a GitHub issue at [github.com/anthropics/maire/issues](https://github.com/anthropics/maire/issues)
2. Describe the error with the city and candidate concerned
3. Provide the correct information with a source if possible

### For candidates (right of reply)
1. Open a GitHub issue or email contact@maire.app with "Droit de réponse"
2. Proposed corrections are moderated by AI (Mistral 3 Large) to ensure they remain factual and neutral — no promotional or partisan content
3. Validated corrections are integrated within 3 days
4. All corrections are public and traceable in the Git history

### Email alternative
No GitHub account? Send corrections to contact@maire.app

## Future: AI Self-Assessment

We are developing an automated introspection system:
- A second AI pass evaluates content reliability
- Identifies unsourced claims
- Assigns confidence scores per section
- Goal: visual confidence indicators on each piece of information

## Legal Framework

- **AI Act (EU)**: Content is clearly labeled as AI-generated
- **LCEN (France)**: Right of reply mechanism in place
- **Code Electoral**: No propaganda, no predictions, electoral silence respected
- **RGPD**: EU hosting, no tracking, minimal data collection

## Cost Transparency

| Item | Cost |
|------|------|
| AI research per city | ~€0.08-0.20 |
| 950 cities (one-time) | ~€80-200 |
| Weekly refresh (10 cities) | ~€1-2/week |
| Hosting (Cloudflare free tier) | €0 |
| Total annual operating cost | <€500 |

The project is funded entirely by association members. No political or institutional funding.
