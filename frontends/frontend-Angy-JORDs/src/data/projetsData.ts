import { Projet } from '../types/portfolio';

export const PROJETS_DATA: Projet[] = [
  {
    projet_slug: 'data-spark-velos-libre-service',
    candidat_slugs: ['ange-tonlio'],
    titre: "Data Spark — Analyse d'un réseau de vélos en libre-service",
    categorie: 'Big Data & Engineering',
    contexte: 'Projet Big Data & Machine Learning Distribué — ESIGELEC Rouen',
    problematique:
      "Comment exploiter des logs massifs de trajets urbains pour prédire le profil (sexe) des cyclistes à partir de leurs habitudes comportementales (âge, vitesse moyenne, indice de sportivité) ?",
    description:
      "Conception d'une architecture de traitement distribué sous PySpark et d'un pipeline complet de classification supervisée sur plus de 40 000 enregistrements issus d'un réseau de vélos en libre-service.",
    methodologie: [
      'Conception du Modèle Conceptuel de Données (MCD) structurant les entités cyclistes, stations et trajets.',
      'Ingestion, nettoyage et feature engineering distribué de +40 000 lignes via PySpark (DataFrames, SparkSQL et User-Defined Functions - UDF).',
      'Implémentation et comparaison rigoureuse de 3 algorithmes de classification : Logistic Regression, Decision Tree et Random Forest.',
      'Optimisation des hyperparamètres et validation croisée sur les métriques de précision et F1-Score.',
    ],
    resultats: [
      'Accuracy globale atteinte de 90 % (0.90) sur le jeu de test.',
      'F1-Score équilibré de 0.90 confirmant la robustesse du modèle face au déséquilibre des classes.',
      'Pipeline reproductible capable de passer à l’échelle sur un cluster Spark.',
    ],
    date_debut: '2025-10',
    date_fin: '2026-01',
    competences: ['pyspark', 'spark', 'python', 'pandas', 'machine-learning', 'matplotlib', 'data-modeling'],
    metriques: {
      volume_donnees: '+40 000 lignes',
      accuracy: '0.90 (90%)',
      f1_score: '0.90',
      modeles_compares: 3,
    },
    liens: {
      github: 'https://github.com/Angy-JORDS',
    },
    images: [],
  },
  {
    projet_slug: 'modele-pricing-billets-avion',
    candidat_slugs: ['ange-tonlio'],
    titre: "Modèle Prédictif de Pricing de Billets d'Avion",
    categorie: 'Data Science & ML',
    contexte: 'Projet Data Science & Modélisation Statistique',
    problematique:
      "Quels facteurs déterminent la tarification dynamique des compagnies aériennes et comment prédire avec précision le prix d'un billet d'avion ?",
    description:
      "Démarche complète de Data Science incluant l'exploration statistique, la préparation des variables et l'entraînement comparatif de modèles de régression linéaires, non linéaires et de segmentation non supervisée.",
    methodologie: [
      'Extraction, nettoyage des valeurs aberrantes et encodage des variables catégorielles (compagnies, escales, horaires).',
      'Analyse Exploratoire des Données (EDA) : analyses univariées et bivariées, tests d’hypothèses statistiques et visualisations graphiques.',
      'Entraînement et évaluation comparative de modèles linéaires, non linéaires et approches non supervisées (clustering).',
      'Sélection du modèle optimal et réglage fin pour minimiser l’erreur absolue moyenne.',
    ],
    resultats: [
      'Coefficient de détermination R² = 0.70 expliquant 70 % de la variance des tarifs.',
      'Erreur Absolue Moyenne (MAE) réduite à 2 263 unités monétaires.',
      'Identification claire des leviers tarifaires clés (délai de réservation, classe et nombre d’escales).',
    ],
    date_debut: '2025-03',
    date_fin: '2025-06',
    competences: ['python', 'pandas', 'scikit-learn', 'machine-learning', 'matplotlib', 'git'],
    metriques: {
      r2_score: '0.70',
      mae: '2263',
      approches: 'Linéaire, Non-linéaire & Clustering',
    },
    liens: {
      github: 'https://github.com/Angy-JORDS',
    },
    images: [],
  },
  {
    projet_slug: 'rapport-croissance-economique-mondiale',
    candidat_slugs: ['ange-tonlio'],
    titre: 'Rapport Analytique sur la Croissance Économique Mondiale (1970–2020)',
    categorie: 'Business Intelligence',
    contexte: 'Projet Business Intelligence & Data Storytelling',
    problematique:
      "Comment synthétiser 50 ans d'évolution démographique et macroéconomique à travers plus de 200 pays pour mettre en lumière les dynamiques de croissance et les disparités régionales ?",
    description:
      "Développement d'un rapport décisionnel interactif sous Power BI alimenté par API REST, combinant modélisation en étoile, mesures DAX avancées et narration visuelle.",
    methodologie: [
      'Extraction automatisée des séries temporelles via API REST sur la période 1970–2020.',
      'Nettoyage, normalisation et transformation ETL des données démographiques et économiques de 200+ pays.',
      'Définition des indicateurs clés de performance (KPI) et développement de mesures DAX dynamiques (taux de croissance annuel composé, comparaisons temporelles).',
      'Conception de tableaux de bord interactifs orientés Data Storytelling.',
    ],
    resultats: [
      'Couverture analytique complète de plus de 200 pays sur un horizon de 50 ans (1970–2020).',
      'Navigation multi-échelle fluide (globale, continentale, nationale) facilitant l’aide à la décision.',
      'Mise en évidence visuelle des corrélations entre transition démographique et croissance du PIB.',
    ],
    date_debut: '2025-01',
    date_fin: '2025-03',
    competences: ['power-bi', 'dax', 'etl', 'data-visualisation', 'data-modeling'],
    metriques: {
      pays_analyses: '200+ pays',
      periode: '1970 – 2020 (50 ans)',
      source: 'API REST',
    },
    liens: {
      github: 'https://github.com/Angy-JORDS',
    },
    images: [],
  },
];
