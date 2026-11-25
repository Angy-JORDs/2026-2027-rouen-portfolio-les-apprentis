import { CandidatProfile } from '../types/portfolio';

export const CANDIDAT_DATA: CandidatProfile = {
  candidat_slug: 'ange-tonlio',
  prenom: 'Ange',
  nom: 'Tonlio',
  titre: 'Élève-Ingénieur Big Data, Data Science & IA',
  bio: "Élève ingénieur en 4e année spécialisé en Big Data pour la Transformation Numérique (BDTN) à l'ESIGELEC Rouen. Je recherche une alternance de 12 mois à partir d'octobre 2026 (rythme 1 mois / 1 mois) en Data Science ou Data Analysis afin de développer des modèles prédictifs, pipelines de données massives et solutions décisionnelles à fort impact.",
  localisation: 'Rouen, Normandie, France',
  disponibilite: 'Octobre 2026 — Durée : 12 mois',
  rythme: '1 mois en entreprise / 1 mois à l’école',
  telephone: '+33 6 27 64 27 25',
  email: 'ange.jordan.tonlio@gmail.com',
  permis: 'Permis B',
  liens: {
    github: 'https://github.com/Angy-JORDS',
    linkedin: 'https://www.linkedin.com/in/ange-jordan-tonlio-035b29313',
    email: 'mailto:ange.jordan.tonlio@gmail.com',
  },
  experiences: [
    {
      entreprise: 'Thales',
      poste: 'Stagiaire Développeur Power BI & Power Apps (Data & Agent IA)',
      type: 'Stage Ingénieur',
      lieu: 'La Ciotat, France',
      debut: '2026-04',
      fin: '2026-09',
      description:
        "Perfectionnement de rapports d'indicateurs de performance (KPI) et développement de rapports de monitoring d'activités sous Power BI. Conception et déploiement d'un outil de type Chatbot / Agent IA destiné à répondre aux problématiques métier. Développement d'applications métier sous Power Apps et gestion de flux de données.",
      competences: ['power-bi', 'power-apps', 'dax', 'power-platform', 'agent-ia', 'etl'],
    },
    {
      entreprise: 'Groupe SOMAF SA',
      poste: 'Stagiaire Assistant Data Analyst',
      type: 'Stage Découverte / Data',
      lieu: 'Cameroun',
      debut: '2024-06',
      fin: '2024-08',
      description:
        "Collecte, centralisation et modélisation des données opérationnelles. Création de rapports BI et Excel permettant l'analyse des tendances de consommation de matériaux. Rédaction de comptes rendus décisionnels pour le suivi d'activité.",
      competences: ['sql', 'excel', 'vba', 'uml', 'data-modeling', 'data-visualisation'],
    },
  ],
  formations: [
    {
      ecole: 'ESIGELEC Rouen',
      diplome: 'Cycle Ingénieur — Big Data pour la Transformation Numérique (BDTN)',
      debut: '2024-09',
      fin: '2027-08',
      details:
        'Big Data (traitement de données massives et distribuées, gestion de bases de données NoSQL & SQL), Machine Learning, Data Engineering, Deep Learning, IA, Business Intelligence (dashboards, pipelines ETL, reporting).',
    },
    {
      ecole: 'Institut PrépaVogt (Yaoundé, Cameroun)',
      diplome: 'Classes Préparatoires aux Grandes Écoles — Filière MPSI',
      debut: '2022-09',
      fin: '2024-08',
      details: 'Formation scientifique intensive : Algorithmique, Statistiques, Probabilités et Algèbre linéaire.',
    },
  ],
  competences: [
    { skill_slug: 'python', nom: 'Python', domaine: 'langages', niveau: 5 },
    { skill_slug: 'sql', nom: 'SQL / PL/SQL', domaine: 'langages', niveau: 5 },
    { skill_slug: 'java', nom: 'Java', domaine: 'langages', niveau: 3 },
    { skill_slug: 'pyspark', nom: 'PySpark', domaine: 'big-data', niveau: 4 },
    { skill_slug: 'spark', nom: 'Apache Spark & SparkSQL', domaine: 'big-data', niveau: 4 },
    { skill_slug: 'hadoop', nom: 'Hadoop & Hive', domaine: 'big-data', niveau: 3 },
    { skill_slug: 'machine-learning', nom: 'Machine Learning (Supervisé & Non supervisé)', domaine: 'ia-ml', niveau: 4 },
    { skill_slug: 'scikit-learn', nom: 'Scikit-learn', domaine: 'ia-ml', niveau: 4 },
    { skill_slug: 'pandas', nom: 'Pandas & NumPy', domaine: 'ia-ml', niveau: 5 },
    { skill_slug: 'agent-ia', nom: 'Agent IA & Chatbot métier', domaine: 'ia-ml', niveau: 4 },
    { skill_slug: 'power-bi', nom: 'Power BI & DAX', domaine: 'bi-visualisation', niveau: 5 },
    { skill_slug: 'power-apps', nom: 'Power Apps & Power Platform', domaine: 'bi-visualisation', niveau: 4 },
    { skill_slug: 'data-visualisation', nom: 'Data Visualisation & Storytelling', domaine: 'bi-visualisation', niveau: 5 },
    { skill_slug: 'matplotlib', nom: 'Matplotlib', domaine: 'bi-visualisation', niveau: 4 },
    { skill_slug: 'excel', nom: 'Excel & VBA', domaine: 'bi-visualisation', niveau: 4 },
    { skill_slug: 'etl', nom: 'ETL & Talend', domaine: 'data-engineering', niveau: 4 },
    { skill_slug: 'data-modeling', nom: 'Data Modeling & UML', domaine: 'data-engineering', niveau: 4 },
    { skill_slug: 'oracle', nom: 'Oracle Database', domaine: 'bases-de-donnees', niveau: 4 },
    { skill_slug: 'mongodb', nom: 'MongoDB', domaine: 'bases-de-donnees', niveau: 4 },
    { skill_slug: 'neo4j', nom: 'Neo4j', domaine: 'bases-de-donnees', niveau: 3 },
    { skill_slug: 'git', nom: 'Git / GitHub & Jupyter Notebook', domaine: 'outils', niveau: 4 },
  ],
  certifications: [
    {
      titre: 'Analyzing and Visualizing Data with Power BI',
      organisme: 'edX',
    },
  ],
  langues: [
    { langue: 'Français', niveau: 'Natif' },
    { langue: 'Anglais', niveau: 'Niveau B1 (Technique & Professionnel)' },
    { langue: 'Allemand', niveau: 'Niveau A2' },
  ],
  softSkills: [
    'Capacité d’adaptation et esprit d’équipe',
    'Autonomie et sens de l’organisation',
    'Apprentissage continu',
    'Bonnes capacités d’analyse et de synthèse',
    'Gestion de projet (Cycle en V, documentation technique)',
  ],
  centresInteret: [
    {
      nom: 'Football',
      description: 'Esprit collectif, stratégie tactique et dépassement de soi.',
    },
    {
      nom: 'Musique',
      description: 'Créativité, rythme et équilibre au quotidien.',
    },
  ],
};
