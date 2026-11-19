# Pastry English Pro — v5.0.0

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Page de l'app (à ouvrir / à héberger) |
| `style.css` | Design |
| `data.js` | Vocabulaire et exercices d'origine |
| `data-extra.js` | Nouveautés : thèmes Hygiene, Allergens, Textures, variantes acceptées, dialogues multi-répliques |
| `app.js` | Logique de l'app |
| `manifest.webmanifest` / `manifest-toque.webmanifest` | Installation (icône cupcake / icône toque) |
| `sw.js` | Mode hors ligne |
| `icons/` | Icônes PNG + sources SVG (cupcake et toque) |

## Mise en ligne (obligatoire pour l'installation et le hors-ligne)

Les navigateurs n'autorisent l'installation sur l'écran d'accueil et le mode hors ligne qu'en **HTTPS**.
Hébergez le dossier entier tel quel (GitHub Pages, Netlify, Cloudflare Pages… tous gratuits), puis donnez le lien aux élèves.
En ouvrant `index.html` directement depuis un fichier, l'app fonctionne mais sans installation ni hors-ligne.

## Icônes d'installation

- iPhone / iPad : **cupcake**
- Android : **toque**
- Autres (ordinateur…) : cupcake

Pour tout mettre en cupcake (ou en toque) : dans `index.html`, remplacer la ligne
`var toque = p ? p === 'toque' : /Android/i.test(navigator.userAgent);` par `var toque = false;` (ou `true`).
Test rapide : ouvrir `index.html?icon=toque` ou `?icon=cupcake`.

## Après une modification

Changer le numéro dans `sw.js` (`const CACHE = 'pep-v5.0.0'`) pour que les élèves reçoivent la nouvelle version.

## Progression des élèves

Stockée dans le téléphone (localStorage). Les boutons « Sauvegarder / Restaurer » de l'accueil permettent de la transférer sur un autre appareil.
