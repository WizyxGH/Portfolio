# Portfolio - Florian Gertner Kilian

Bienvenue sur le dépôt du portfolio personnel de **Florian Gertner Kilian** (Wizyx). Ce projet met en avant mes compétences en **Product Design (UI/UX)** et **Copywriting**, ainsi que mes réalisations et collaborations.

🔗 **Voir le site en ligne :** [wizyx.me](https://wizyx.me)

## 🚀 Installation et Démarrage

Pour lancer ce projet localement sur votre machine :

### 1. Prérequis
- [Node.js](https://nodejs.org/) (version 16 ou supérieure recommandée)
- [NPM](https://www.npmjs.com/) (généralement inclus avec Node.js)

### 2. Cloner le dépôt
```bash
git clone https://github.com/WizyxGH/Portfolio.git
cd Portfolio
```

### 3. Installer les dépendances
```bash
npm install
```

### 4. Compiler le CSS (Tailwind)
Pour générer le fichier CSS final avec Tailwind :
```bash
npm run tailwind:build
```
*Note : Cette commande effectue une compilation unique. Pour compiler automatiquement à chaque changement, utilisez :*
```bash
npx tailwindcss -i assets/css/input.css -o assets/css/tailwind.css --watch
```

### 5. Lancer le projet
Ce projet fonctionne avec [Jekyll](https://jekyllrb.com/). Pour démarrer le serveur local :
```bash
jekyll serve
```
Le site sera ensuite accessible sur [http://localhost:4000](http://localhost:4000).