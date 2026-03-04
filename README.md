# maire.app

**Comparateur citoyen pour les élections municipales françaises.**

> *L'IA au service de la transparence démocratique — ses forces et ses limites, en toute honnêteté.*

---

## Le projet

**maire.app** est un projet communautaire non commercial par [MagLab Studio](https://maglab.app). Il utilise l'intelligence artificielle pour synthétiser les informations publiques sur les candidats aux élections municipales et les rendre accessibles à tous les électeurs.

Les données et textes analysés proviennent exclusivement de programmes publics et de sources officielles (sites mairie, plateformes électorales, communiqués des listes). Ce comparateur est fourni « tel quel » à titre informatif ; il n'engage ni partis, ni campagnes, ni prestataires.

### Pourquoi ?

Nous sommes inquiets de l'IA mal utilisée qui pourrait fragiliser la démocratie. Mais nous sommes plus inquiets de ne rien faire. C'est pourquoi nous avons créé cette application expérimentale : montrer ce que l'IA peut faire de positif pour l'information citoyenne, en toute transparence sur ses limites.

- La participation aux municipales de 2020 a été historiquement basse
- L'information sur les candidats locaux est dispersée et difficile à trouver
- Il n'existe aucune plateforme unifiée pour les ~984 villes de +10 000 habitants
- L'IA peut aider à combler ce vide — en toute transparence sur ses limites

### Ce que c'est

- Un outil d'information citoyenne, pas un outil de propagande
- Du contenu généré par IA (Mistral 3 Large), clairement identifié comme tel
- Un processus de correction public et ouvert (via GitHub)
- Une présentation neutre : pas de couleurs politiques, ordre aléatoire des candidats

### Ce que ce n'est pas

- Un sondage ou une prédiction de résultats
- Du contenu éditorial ou journalistique
- Un outil de campagne pour les candidats
- Une source d'information définitive (toujours vérifier auprès des sources officielles)

---

## Fonctionnalités

- **Fiches candidats** : profils synthétiques avec positionnement, programme, expérience
- **Comparateur** : comparez jusqu'à 4 candidats côte à côte
- **Carte interactive** : 34 910 communes avec 6 couches de données (participation, croissance, température, dette, revenus)
- **Corrélations** : mode bivarié avec 15 palettes pour visualiser les liens entre indicateurs
- **Enjeux locaux** : synthèse des problématiques de chaque ville
- **Résultats 2020** : historique et contexte des élections précédentes
- **Participation** : visualisation des taux de participation 2020
- **Transparence IA** : avertissements, sources, processus de correction
- **Données financières** : évolution de la dette par habitant (source ANCT)
- **Données climatiques** : projections DRIAS 2050/2100 par commune

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | SvelteKit 5 (Svelte 5 runes) |
| Styling | Tailwind CSS 4 |
| Hébergement | Cloudflare Pages (EU) |
| Base de données | Cloudflare D1 (SQLite) |
| KV Store | Cloudflare KV |
| Carte | MapLibre GL JS (WebGL) |
| IA | Mistral 3 Large + Tavily |
| Validation villes | geo.api.gouv.fr |

---

## Développement

### Prérequis

- Node.js >= 20.x
- npm

### Installation

```bash
cd apps/web
npm install
npm run dev         # Serveur de développement (:5173)
```

### Build & déploiement

```bash
npm run build       # Build production
npm run preview     # Preview local

# Déployer sur Cloudflare
wrangler pages deploy .svelte-kit/cloudflare --project-name=maire
```

### Structure

```
maire/
├── apps/web/              # SvelteKit 5 application
│   ├── src/
│   │   ├── routes/        # Pages et API
│   │   ├── lib/           # Composants, stores, types
│   │   └── app.css        # Design system
│   └── static/data/       # Données JSON (villes, candidats)
├── scripts/               # Pipeline de recherche IA (Python)
├── workers/               # Cloudflare Workers (scheduler)
└── docs/                  # Documentation technique
```

---

## Transparence IA

Le contenu de maire.app est généré par Mistral 3 Large via des recherches web automatisées. Nous sommes transparents sur :

1. **Le modèle** : chaque page indique qu'elle est générée par IA
2. **Les limites** : hallucinations, biais temporels, biais de couverture
3. **Les corrections** : processus public via GitHub Issues
4. **Le code** : entièrement open source

Voir [docs/AI_TRANSPARENCY.md](docs/AI_TRANSPARENCY.md) pour la documentation complète.

---

## Contribuer

### Signaler une erreur

Ouvrez une [issue GitHub](https://github.com/MagLabAI/maire_app/issues) avec :
- La ville et le candidat concernés
- L'information incorrecte
- La correction avec source si possible

Toute erreur signalée sera revue dans les 48 h.

### Contribuer au code

1. Fork le projet
2. Créer une branche (`git checkout -b fix/ma-correction`)
3. Commit (`git commit -m 'fix: Corrige le profil de X à Y'`)
4. Push et ouvrir une Pull Request

### Conventions de commit

```
feat: Nouvelle fonctionnalité
fix: Correction d'erreur
docs: Documentation
data: Mise à jour de données
```

---

## Cadre légal

- **Éditeur** : MagLab Studio — projet communautaire open source
- **Indépendance** : aucune affiliation politique
- **RGPD** : hébergement EU, pas de trackers, pas de cookies de suivi
- **Droit de réponse** : contact@maire.app
- **Code électoral** : respect du silence électoral, pas de propagande

---

## Licence

Code source : [MIT](https://opensource.org/licenses/MIT)
Contenu : [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

---

## Contact

- **Email** : [contact@maire.app](mailto:contact@maire.app)
- **GitHub** : [github.com/MagLabAI/maire_app](https://github.com/MagLabAI/maire_app)
- **Site** : [maire.app](https://maire.app)
