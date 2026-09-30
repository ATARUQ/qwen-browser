# Qwen dans le navigateur

Démo qui fait tourner le modèle de langage **Qwen3 0.6B** entièrement dans le navigateur, grâce à WebGPU. Aucun serveur d'inférence : le modèle est téléchargé puis exécuté localement, et les messages ne quittent pas la machine.

👉 **Démo en ligne : https://ataruq.github.io/qwen-browser/**

## Fonctionnement

1. Cliquez sur **Charger Qwen**. Le modèle [`onnx-community/Qwen3-0.6B-ONNX`](https://huggingface.co/onnx-community/Qwen3-0.6B-ONNX) (quantifié en `q4f16`) est téléchargé depuis Hugging Face, puis mis en cache par le navigateur.
2. Remplissez les trois champs :
   - **System** : les instructions générales données au modèle ;
   - **Context** : un contexte à prendre en compte, ajouté au message système ;
   - **User** : le message de l'utilisateur.
3. Cliquez sur **Envoyer**. La réponse s'affiche au fil de la génération :
   - le **raisonnement interne** du modèle (le contenu entre les balises `<think>`) dans un premier panneau ;
   - la **réponse** finale dans un second.

Si le champ System et le champ Context sont vides, le modèle reçoit un message système par défaut : « Vous êtes un assistant francophone utile et concis. »

## Prérequis

Un navigateur compatible **WebGPU**, par exemple Chrome ou Edge récent sur ordinateur. Sans WebGPU, l'application l'indique et ne charge pas le modèle.

Le premier chargement télécharge plusieurs centaines de Mo ; les suivants sont servis depuis le cache.

## Développement local

```bash
npm install
npm run dev      # serveur de développement Vite
npm run build    # build de production dans dist/
npm run preview  # prévisualisation du build
```

## Stack

- [Transformers.js](https://huggingface.co/docs/transformers.js) (`@huggingface/transformers`) pour l'inférence dans le navigateur
- [Vite](https://vite.dev/) pour le développement et le build
- JavaScript sans framework

## Déploiement

Chaque push sur `main` déclenche le workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), qui construit l'application et la publie sur GitHub Pages. Le chemin de base `/qwen-browser/` est défini dans [`vite.config.js`](vite.config.js).
