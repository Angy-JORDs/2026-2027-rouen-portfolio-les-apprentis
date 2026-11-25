/**
 * Moteur de questions-réponses du recruteur : sans IA, 100 % local, à partir des données de l'API.
 *
 * Le recruteur ne tape rien : il choisit parmi les questions de FAQ (voir questionsDisponibles).
 * Bilingue : la CLÉ d'une question reste la question française (la détection repose sur des mots
 * français), mais tout ce qui s'affiche (thèmes, libellés, réponses) est dans la langue du site.
 *
 *   questionsDisponibles(ctx) -> [{ id, theme, questions: [{ key, label }] }]
 *   answer(cleFr, ctx)        -> { title, text, items: [{ label, sub, wrap?, to | ask | href | cv }], vide?, sansReponse? }
 *   libelleQuestion(cleFr, lang) -> libellé affiché d'une question
 *
 *   ctx = {
 *     lang, L,       // langue du site et traducteur des données (src/i18n/content.js)
 *     candidat,      // profil d'origine, en français (candidatFr de CandidatContext)
 *     projets,       // projets bruts de l'API, en français
 *     skillName,     // nom français d'une compétence (sert à la détection)
 *     skillLabel,    // nom affiché d'une compétence, dans la langue du site
 *     langues, certifications, cvAvailable, isAssociatif,
 *   }
 *
 * Les calculs (secteurs, sport, familles de compétences, chiffres clés) se font sur les données françaises ;
 * chaque texte affiché passe par L (expériences, projets, périodes…) ou par les gabarits de TEXTES.
 * `to` est une route du site (ex. "projets/prediction-prix-maison"), `ask` la clé d'une autre question,
 * `wrap` demande d'afficher la ligne secondaire en entier (chiffres clés, descriptions).
 * Fichier en JavaScript pur (sans React) : il peut être testé avec Node.
 */

import { localizer } from '../i18n/content.js'
import { sortByDateDesc } from './format.js'

/** minuscules, sans accents ni ponctuation */
export function normalize(text) {
  return ` ${String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .trim()} `
}

const has = (q, re) => re.test(q)

/**
 * Début de phrase -> milieu de phrase : « Apprenti ingénieur… » -> « apprenti ingénieur… ».
 * Inchangé pour un sigle (« MPSI », « B1 ») ou un intitulé en majuscules (« Junior Data Analyst »).
 */
function minuscule(texte) {
  const s = String(texte ?? '')
  const mots = s.split(/\s+/)
  if (!/^\p{Lu}[\p{Ll}’'-]*$/u.test(mots[0] || '')) return s
  const suivant = mots.slice(1).find((m) => /\p{L}/u.test(m))
  if (suivant && !/^[^\p{L}]*\p{Ll}/u.test(suivant)) return s
  return s.charAt(0).toLocaleLowerCase() + s.slice(1)
}

const majuscule = (texte) => {
  const s = String(texte ?? '')
  return s.charAt(0).toLocaleUpperCase() + s.slice(1)
}

/** Article indéfini anglais : « a Data… », « an engineering degree… », « a university… », « an hour… ». */
function article(texte) {
  const s = String(texte ?? '').trim()
  if (/^(uni|use|usu|eu|one\b)/i.test(s)) return 'a'
  if (/^(hour|honest|honour|heir)/i.test(s)) return 'an'
  return /^[aeiou]/i.test(s) ? 'an' : 'a'
}

/**
 * Gabarits des réponses, en français et en anglais (même principe que useT : « {var} » remplacé,
 * ou fonction pour les pluriels). Le français suit la typographie française (espace avant « : »).
 */
const TEXTES = {
  fr: {
    // Mise en forme
    deuxPoints: ' : ',
    et: ' et ',
    ans: ({ n }) => `${n} an${n > 1 ? 's' : ''}`,
    mois: ({ n }) => `${n} mois`,
    moinsDunMois: 'moins d’un mois',
    chez: '{poste} chez {entreprise}',

    // États
    chargementTitre: 'Profil en cours de chargement',
    chargementTexte: 'Réessayez dans un instant.',
    sansReponse: 'Pas de réponse trouvée',

    // Projets sur GitHub
    githubTitre: 'Projets sur GitHub',
    githubTexte: ({ n, total }) => {
      if (n === total) {
        return n > 1
          ? `Ses ${n} projets personnels ont leur code en ligne sur GitHub :`
          : 'Son projet personnel a son code en ligne sur GitHub :'
      }
      return n > 1
        ? `${n} projets personnels sur ${total} ont leur code en ligne sur GitHub :`
        : `1 projet personnel sur ${total} a son code en ligne sur GitHub :`
    },
    githubProfil: 'Son profil GitHub',

    // E-mail et contact
    emailTitre: 'Son adresse e-mail',
    emailEcrire: 'Lui écrire un e-mail',
    emailEcrireSub: 'Ouvre votre messagerie',
    email: 'E-mail',
    contactTitre: 'Comment le contacter',
    contactEmailLinkedin: 'Par e-mail ({email}) ou par message sur LinkedIn.',
    contactEmail: 'Par e-mail : {email}.',
    contactLinkedin: 'Le plus simple : un message sur LinkedIn.',
    contactAucun: 'Ses coordonnées ne sont pas encore en ligne.',

    // CV
    cvTitre: 'Son CV',
    cvTexte: 'Le CV est disponible en PDF.',
    voirCv: 'Voir le CV',
    cvSub: 'PDF, avec option de téléchargement',
    cvCoordonnees: 'Coordonnées complètes dans le CV (PDF)',
    cvAbsent: 'Le CV n’est pas encore en ligne : contactez-le par e-mail ou via LinkedIn.',

    // Sport
    sportTitre: ({ sports }) => (sports ? `Sport : ${sports}` : 'Sport'),
    sportDepuis: '{organisation}, depuis {date}.',
    sportPeriode: '{organisation}, {periode}.',
    sportAucun: 'Aucun sport renseigné.',

    // Langues
    languesTitre: 'Langues',
    autresLangues: ({ n, liste }) => `${n > 1 ? 'Autres langues' : 'Autre langue'} : ${liste}.`,
    languesDetail: 'Voir le détail des langues',

    // Certifications
    certifsTitre: 'Certifications',
    certifsTexte: ({ n, detail }) => `${n} certifications${detail ? ` : ${detail}` : ''}.`,
    certifUnique: ({ libelle }) => (libelle ? `1 certification (${libelle}).` : '1 certification.'),
    certifStatut: ({ n, statut, libelle }) => `${n} ${statut === 'obtenue' && n > 1 ? 'obtenues' : libelle}`,

    // Atouts
    atoutsTitre: 'Ses atouts',
    atoutsExpData: '{duree} d’expérience professionnelle en data.',
    atoutsExpDont: '{duree} d’expérience professionnelle, dont {dureeData} en data.',
    atoutsExp: '{duree} d’expérience professionnelle.',
    atoutsActuel: ({ poste, entreprise }) => `Actuellement ${minuscule(poste)} chez ${entreprise}.`,
    atoutsProjets: ({ n, m }) => {
      const base = `${n} projet${n > 1 ? 's' : ''} personnel${n > 1 ? 's' : ''}`
      if (!m) return `${base}.`
      return n > 1 ? `${base}, dont ${m} aux résultats chiffrés.` : `${base}, aux résultats chiffrés.`
    },
    atoutsPointsForts: 'Points forts : {liste}.',
    voirResultats: 'Voir ses résultats concrets',
    voirProjets: 'Voir ses projets personnels',

    // Résultats chiffrés
    resultatsTitre: 'Résultats concrets',
    resultatsTous: 'Des résultats mesurés, en entreprise comme en projet :',
    resultatsEntreprise: 'Des résultats mesurés en entreprise :',
    resultatsProjets: 'Des résultats mesurés en projet :',

    // Secteurs
    secteursTitre: 'Secteurs d’activité',
    secteursTexte: ({ n, liste }) => `${n} secteur${n > 1 ? 's' : ''} : ${liste}.`,

    // Formation
    formationTitre: 'Formation',
    formationQuandTitre: 'Diplôme prévu en {date}',
    formationEnCours: ({ diplome, ecole, date }) => `En cours : ${minuscule(diplome)} (${ecole}), fin prévue en ${date}.`,
    formationDerniere: ({ n, diplome, ecole }) =>
      n > 1 ? `${n} formations, la plus récente : ${minuscule(diplome)} (${ecole}).` : `${majuscule(diplome)} (${ecole}).`,

    // Associatif
    assoTitre: 'Engagement associatif',
    assoTexte: ({ n, noms }) => `${n} engagement${n > 1 ? 's' : ''} associatif${n > 1 ? 's' : ''} : ${noms}.`,
    assoAucun: 'Aucun engagement associatif renseigné.',

    // Années d'expérience
    expTitre: 'Expérience professionnelle',
    expData: ({ duree, n, types }) =>
      `${duree} d’expérience professionnelle cumulée en data, sur ${n} expérience${n > 1 ? 's' : ''} (${types}).`,
    expDont: ({ duree, n, types, dureeData }) =>
      `${duree} d’expérience professionnelle cumulée sur ${n} expérience${n > 1 ? 's' : ''} (${types}), dont ${dureeData} en data.`,
    expSimple: ({ duree, n, types }) =>
      `${duree} d’expérience professionnelle cumulée sur ${n} expérience${n > 1 ? 's' : ''} (${types}).`,
    alternances: ({ n }) => `${n} alternance${n > 1 ? 's' : ''}`,
    stages: ({ n }) => `${n} stage${n > 1 ? 's' : ''}`,
    autresPostes: ({ n }) => `${n} autre${n > 1 ? 's' : ''} poste${n > 1 ? 's' : ''}`,

    // Situation actuelle / disponibilité
    actuelTitre: 'Situation actuelle',
    dispoTitre: 'Disponibilité',
    actuelRole: ({ poste, entreprise, date }) => `${minuscule(poste)} chez ${entreprise} (depuis ${date})`,
    actuelTexte: 'En ce moment : {roles}.',
    actuelFormation: ({ diplome, ecole, date }) =>
      `En parallèle : ${minuscule(diplome)} (${ecole})${date ? `, fin prévue en ${date}` : ''}.`,
    actuelFormationSeule: ({ diplome, ecole, date }) =>
      `En formation : ${minuscule(diplome)} (${ecole})${date ? `, fin prévue en ${date}` : ''}.`,
    actuelContactEmail: 'Pour une opportunité, contactez-le par e-mail ({email}) ou via LinkedIn.',
    actuelContactLinkedin: 'Pour une opportunité, contactez-le via LinkedIn.',

    // Compétences
    competencesListe: 'Compétences : {liste}.',
    pratique: 'Mise en pratique : {liste}.',
    pratiqueEntreprise: '{duree} en entreprise ({entreprises})',
    pratiqueProjets: ({ n }) => `${n} projet${n > 1 ? 's' : ''} personnel${n > 1 ? 's' : ''}`,
    pratiqueAsso: ({ n, noms }) => `${n} activité${n > 1 ? 's' : ''} associative${n > 1 ? 's' : ''} (${noms})`,
    voirCompetences: 'Voir toutes ses compétences',
    competencesTitre: 'Compétences principales',
    competencesTexte: ({ n }) => `${n} compétence${n > 1 ? 's' : ''} déclarée${n > 1 ? 's' : ''}. Les plus maîtrisées :`,

    // Entreprises
    entreprisesTitre: 'Entreprises',
    entreprisesTexte: ({ n, noms }) => `${n} entreprise${n > 1 ? 's' : ''} : ${noms}.`,

    // Projets
    projetRecentTitre: 'Son projet le plus récent',
    projetsTitre: 'Projets personnels',
    projetsTexte: ({ n }) => (n > 1 ? `${n} projets personnels, du plus récent au plus ancien :` : `${n} projet personnel :`),

    // Profil
    voirParcours: 'Voir son parcours complet',
    voirParcoursSub: 'Expériences, formation, projets et compétences sur une seule page',

    // Recherche plein texte (repli)
    rechercheTitre: 'Résultats',
    rechercheTexte: ({ n }) => `${n} élément${n > 1 ? 's' : ''} correspond${n > 1 ? 'ent' : ''} à votre recherche.`,
  },

  en: {
    deuxPoints: ': ',
    et: ' and ',
    ans: ({ n }) => `${n} year${n === 1 ? '' : 's'}`,
    mois: ({ n }) => `${n} month${n === 1 ? '' : 's'}`,
    moinsDunMois: 'less than a month',
    chez: '{poste} at {entreprise}',

    chargementTitre: 'Loading the profile',
    chargementTexte: 'Please try again in a moment.',
    sansReponse: 'No answer found',

    githubTitre: 'Projects on GitHub',
    githubTexte: ({ n, total }) => {
      if (n === total) {
        return n > 1
          ? `All ${n} of his personal projects have their code on GitHub:`
          : 'His personal project has its code on GitHub:'
      }
      return `${n} of his ${total} personal projects ${n > 1 ? 'have their' : 'has its'} code on GitHub:`
    },
    githubProfil: 'His GitHub profile',

    emailTitre: 'His email address',
    emailEcrire: 'Email him',
    emailEcrireSub: 'Opens your email app',
    email: 'Email',
    contactTitre: 'How to contact him',
    contactEmailLinkedin: 'By email ({email}) or via a LinkedIn message.',
    contactEmail: 'By email: {email}.',
    contactLinkedin: 'The easiest way is a LinkedIn message.',
    contactAucun: 'His contact details are not online yet.',

    cvTitre: 'His CV',
    cvTexte: 'His CV is available as a PDF.',
    voirCv: 'View his CV',
    cvSub: 'PDF, with a download option',
    cvCoordonnees: 'Full contact details in the CV (PDF)',
    cvAbsent: 'His CV is not online yet: contact him by email or via LinkedIn.',

    sportTitre: ({ sports }) => (sports ? `Sport: ${sports}` : 'Sport'),
    sportDepuis: '{organisation}, since {date}.',
    sportPeriode: '{organisation}, {periode}.',
    sportAucun: 'No sport listed.',

    languesTitre: 'Languages',
    autresLangues: ({ n, liste }) => `${n > 1 ? 'Other languages' : 'Other language'}: ${liste}.`,
    languesDetail: 'See language details',

    certifsTitre: 'Certifications',
    certifsTexte: ({ n, detail }) => `${n} certifications${detail ? `: ${detail}` : ''}.`,
    certifUnique: ({ libelle }) => (libelle ? `1 certification (${libelle}).` : '1 certification.'),
    certifStatut: ({ n, libelle }) => `${n} ${libelle}`,

    atoutsTitre: 'His strengths',
    atoutsExpData: '{duree} of professional experience in data.',
    atoutsExpDont: '{duree} of professional experience, including {dureeData} in data.',
    atoutsExp: '{duree} of professional experience.',
    atoutsActuel: ({ poste, entreprise }) => `Currently ${article(poste)} ${poste} at ${entreprise}.`,
    atoutsProjets: ({ n, m }) => {
      const base = `${n} personal project${n === 1 ? '' : 's'}`
      if (!m) return `${base}.`
      return n === 1 ? `${base}, with measurable results.` : `${base}, ${m} of them with measurable results.`
    },
    atoutsPointsForts: 'Strongest skills: {liste}.',
    voirResultats: 'See his concrete results',
    voirProjets: 'See his personal projects',

    resultatsTitre: 'Concrete results',
    resultatsTous: 'Measurable results, at work and in personal projects:',
    resultatsEntreprise: 'Measurable results at work:',
    resultatsProjets: 'Measurable results in personal projects:',

    secteursTitre: 'Sectors',
    secteursTexte: ({ n, liste }) => `${n} sector${n === 1 ? '' : 's'}: ${liste}.`,

    formationTitre: 'Education',
    formationQuandTitre: 'Expected to graduate in {date}',
    formationEnCours: ({ diplome, ecole, date }) =>
      `Currently studying for ${article(diplome)} ${minuscule(diplome)} at ${ecole}, due to finish in ${date}.`,
    formationDerniere: ({ n, diplome, ecole }) =>
      n > 1 ? `Most recent of ${n} programmes: ${diplome} (${ecole}).` : `${diplome} (${ecole}).`,

    assoTitre: 'Community involvement',
    assoTexte: ({ n, noms }) => `Involved in ${n === 1 ? 'one organisation' : `${n} associations and clubs`}: ${noms}.`,
    assoAucun: 'No community involvement listed.',

    expTitre: 'Professional experience',
    expData: ({ duree, n, types }) =>
      `${duree} of combined professional experience in data, across ${n} role${n === 1 ? '' : 's'} (${types}).`,
    expDont: ({ duree, n, types, dureeData }) =>
      `${duree} of combined professional experience across ${n} role${n === 1 ? '' : 's'} (${types}), including ${dureeData} in data.`,
    expSimple: ({ duree, n, types }) =>
      `${duree} of combined professional experience across ${n} role${n === 1 ? '' : 's'} (${types}).`,
    alternances: ({ n }) => `${n} apprenticeship${n === 1 ? '' : 's'}`,
    stages: ({ n }) => `${n} internship${n === 1 ? '' : 's'}`,
    autresPostes: ({ n }) => `${n} other role${n === 1 ? '' : 's'}`,

    actuelTitre: 'Current position',
    dispoTitre: 'Availability',
    actuelRole: ({ poste, entreprise, date }) => `${article(poste)} ${poste} at ${entreprise} (since ${date})`,
    actuelTexte: 'He is currently {roles}.',
    actuelFormation: ({ diplome, ecole, date }) =>
      `Alongside this, he is studying for ${article(diplome)} ${minuscule(diplome)} at ${ecole}${date ? `, due to finish in ${date}` : ''}.`,
    actuelFormationSeule: ({ diplome, ecole, date }) =>
      `He is studying for ${article(diplome)} ${minuscule(diplome)} at ${ecole}${date ? `, due to finish in ${date}` : ''}.`,
    actuelContactEmail: 'To discuss an opportunity, contact him by email ({email}) or via LinkedIn.',
    actuelContactLinkedin: 'To discuss an opportunity, contact him via LinkedIn.',

    competencesListe: 'Skills: {liste}.',
    pratique: 'In practice: {liste}.',
    pratiqueEntreprise: '{duree} of professional experience ({entreprises})',
    pratiqueProjets: ({ n }) => `${n} personal project${n === 1 ? '' : 's'}`,
    pratiqueAsso: ({ n, noms }) => `${n} extracurricular activit${n === 1 ? 'y' : 'ies'} (${noms})`,
    voirCompetences: 'See all his skills',
    competencesTitre: 'Main skills',
    competencesTexte: ({ n }) => `${n} skill${n === 1 ? '' : 's'} on his profile. His strongest:`,

    entreprisesTitre: 'Companies',
    entreprisesTexte: ({ n, noms }) => `${n} compan${n === 1 ? 'y' : 'ies'}: ${noms}.`,

    projetRecentTitre: 'His most recent project',
    projetsTitre: 'Personal projects',
    projetsTexte: ({ n }) => (n === 1 ? '1 personal project:' : `${n} personal projects, most recent first:`),

    voirParcours: 'See his full profile',
    voirParcoursSub: 'Experience, education, projects and skills on a single page',

    rechercheTitre: 'Results',
    rechercheTexte: ({ n }) => `${n} item${n === 1 ? '' : 's'} match${n === 1 ? 'es' : ''} your search.`,
  },
}

/** Équivalent de useT pour ce module sans React : t('cle', { n: 3 }). */
function traducteur(lang) {
  const dico = TEXTES[lang] || TEXTES.fr
  return (cle, vars) => {
    const v = dico[cle] ?? TEXTES.fr[cle] ?? cle
    if (typeof v === 'function') return v(vars ?? {})
    if (!vars) return v
    return String(v).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`))
  }
}

/**
 * Familles de compétences : un mot de la question -> plusieurs compétences.
 * `titre` : intitulé affiché de la réponse.
 */
const FAMILLES = [
  {
    titre: { fr: 'Intelligence artificielle', en: 'Artificial intelligence' },
    re: / (ia|ai|intelligence artificielle|machine learning|ml|apprentissage automatique|deep learning|modeles? predictifs?|prediction|scoring) /,
    skills: ['machine-learning', 'scikit-learn', 'tensorflow', 'pytorch'],
  },
  {
    titre: { fr: 'BI et data visualisation', en: 'BI & data visualisation' },
    re: / (bi|business intelligence|dashboards?|tableaux? de bord|dataviz|data visualisation|visualisation|reporting) /,
    skills: ['power-bi', 'dax', 'power-query', 'tableau', 'matplotlib', 'seaborn'],
  },
  {
    titre: { fr: 'Bases de données', en: 'Databases' },
    re: / (bdd|bases? de donnees|database|nosql) /,
    skills: ['sql', 'mysql', 'mongodb', 'neo4j'],
  },
  {
    titre: { fr: 'Intégration de données (ETL)', en: 'Data integration (ETL)' },
    re: / (etl|pipelines?|integration de donnees|data engineering|flux de donnees|edi) /,
    skills: ['etl', 'ssis', 'microsoft-fabric', 'edi', 'data-catalog'],
  },
  {
    titre: { fr: 'Développement web', en: 'Web development' },
    re: / (web|site|front|frontend|backend) /,
    skills: ['php', 'html', 'css', 'javascript', 'fastapi'],
  },
  {
    titre: { fr: 'Gestion de projet et méthodes agiles', en: 'Project management & agile methods' },
    re: / (gestion de projet|agiles?|scrum|methodes? de travail|methodologies?) /,
    skills: ['agile-scrum', 'uml', 'trello', 'teams'],
  },
]

/** Secteurs d'activité, déduits du nom de l'entreprise et de la description de l'expérience (en français). */
// L'ordre compte : une alternance logistique qui produit aussi des tableaux de bord « finance » reste logistique.
const SECTEURS = [
  { fr: 'Transport et logistique', en: 'Transport & logistics', re: / (logistique|transport\w*|supply chain) / },
  { fr: 'Banque et finance', en: 'Banking & finance', re: / (banque|bank|bancaire|financ\w*) / },
  { fr: 'Immobilier', en: 'Real estate', re: / (immobili\w*|real estate) / },
  { fr: 'Tourisme et hôtellerie', en: 'Tourism & hospitality', re: / (residence|hotel\w*|vacances|tourisme|clientele internationale) / },
  { fr: 'Éducation', en: 'Education', re: / (lyceens?|pedagogi\w*|enseign\w*|soutien scolaire|completude) / },
]
const AUTRE_SECTEUR = { fr: 'Autre', en: 'Other' }

function secteurDe(e) {
  const texte = normalize(`${e.entreprise} ${e.poste} ${e.description}`)
  return SECTEURS.find((s) => s.re.test(texte)) || AUTRE_SECTEUR
}

/** Sports reconnus dans l'intitulé ou la description d'une expérience (données françaises, ou anglaises). */
const SPORTS =
  / (natation|nage|nageur|nageuse|swimming|swimmer|piscine|sports?|sportif|sportive|football|foot|basket\w*|tennis|rugby|handball|volley\w*|course a pied|running|marathon|triathlon|cyclisme|velo|judo|karate|boxe|escalade|athletisme|danse|fitness|musculation) /

/** "Natation (perfectionnement adulte)" -> "natation" */
const nomSport = (poste) => minuscule(String(poste ?? '').replace(/\s*\([^)]*\)\s*/g, ' ').trim())

/** Type de contrat d'une expérience professionnelle, d'après son intitulé. */
function typeContrat(e) {
  const poste = normalize(e.poste)
  if (/ (apprenti\w*|alternan\w*|apprentice\w*) /.test(poste)) return 'alternances'
  if (/ (stage\w*|stagiaire\w*|intern|internship) /.test(poste)) return 'stages'
  return 'autresPostes'
}

/**
 * Entreprise citée dans la question (« chez De Rijke », « chez Afriland First Bank ») :
 * on cherche les mots distinctifs du nom, sans les mots génériques (pays, ville, « club », « bank »…).
 */
const MOTS_GENERIQUES_ORGANISATION = new Set(
  'france club first bank banque societe groupe group association rouen paris cameroun esigelec'.split(' '),
)

function experienceCitee(q, experiences) {
  return experiences.find((e) =>
    normalize(e.entreprise)
      .trim()
      .split(' ')
      .filter((mot) => mot.length >= 4 && !MOTS_GENERIQUES_ORGANISATION.has(mot))
      .some((mot) => q.includes(` ${mot} `)),
  )
}

/** Phrases chiffrées d'une description (« +10 % de fidélisation… »), réduites à leurs chiffres. */
function chiffresCles(description) {
  const chiffre = /\d\s?%|\d\+/
  return String(description || '')
    .split(/(?<=\.)\s+/)
    .filter((phrase) => chiffre.test(phrase))
    .map((phrase) => {
      const parties = phrase.split(/\s?:\s/)
      const fin = parties[parties.length - 1]
      return (chiffre.test(fin) ? fin : phrase).replace(/\.\s*$/, '').trim()
    })
    .join(', ')
}

/** "https://www.linkedin.com/in/jo%C3%ABl-diangon/" -> "linkedin.com/in/joël-diangon" */
function urlLisible(url) {
  let s = String(url || '')
  try {
    s = decodeURI(s)
  } catch {
    /* adresse mal encodée : on l'affiche telle quelle */
  }
  return s.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
}

const moisCourant = () => new Date().toISOString().slice(0, 7)

/** Projets du plus récent au plus ancien (date de fin, sinon de début). */
const trierProjets = (projets) =>
  [...projets].sort((a, b) => String(b.date_fin || b.date_debut || '').localeCompare(String(a.date_fin || a.date_debut || '')))

const projetsAvecMetriques = (projets) => projets.filter((p) => p.metriques && Object.keys(p.metriques).length)

const topCompetences = (candidat, n) =>
  [...(candidat.competences || [])].sort((a, b) => (b.niveau || 0) - (a.niveau || 0)).slice(0, n)

/** Compétences citées dans la question (nom ou slug), plus les familles. */
function detectSkills(q, ctx) {
  const found = new Set()
  const tous = new Set([
    ...(ctx.candidat?.competences || []).map((c) => c.skill_slug),
    ...ctx.projets.flatMap((p) => p.competences || []),
  ])
  let reste = q // la question sans les compétences reconnues (pour chercher ensuite les familles)
  for (const slug of tous) {
    const nom = ctx.skillName(slug)
    const variantes = new Set([normalize(nom).trim(), normalize(slug.replace(/-/g, ' ')).trim(), normalize(slug).trim()])
    for (const v of variantes) {
      if (!v) continue
      // Les langages d'une seule lettre (R, C) ne sont reconnus que dans « en R », « langage C »…
      if (v.length === 1) {
        if (new RegExp(` (en|langage|le) ${v} `).test(q)) found.add(slug)
        continue
      }
      if (q.includes(` ${v} `)) {
        found.add(slug)
        reste = reste.split(` ${v} `).join('  ')
      }
    }
  }
  // Une technologie citée précisément (« Power BI », « machine learning ») n'est pas élargie à sa famille.
  // En revanche, si le reste de la question nomme une famille (« intégration de données (ETL) »),
  // la réponse couvre toute la famille.
  const familles = FAMILLES.filter((f) => f.re.test(reste))
  for (const f of familles) for (const s of f.skills) if (tous.has(s)) found.add(s)
  return { slugs: [...found], familles }
}

/** Nombre de mois couverts par des périodes (chevauchements fusionnés). */
function moisCouverts(periodes) {
  const now = new Date()
  const toIdx = (v, fallbackNow) => {
    if (!v) return fallbackNow ? now.getFullYear() * 12 + now.getMonth() : null
    const [y, m = '1'] = String(v).split('-')
    return Number(y) * 12 + Number(m) - 1
  }
  const mois = new Set()
  for (const p of periodes) {
    const a = toIdx(p.debut, false)
    const b = toIdx(p.fin, true)
    if (a == null || b == null) continue
    for (let i = a; i <= b; i += 1) mois.add(i)
  }
  return mois.size
}

/** Outils d'affichage dans la langue du contexte (textes, listes, durées, éléments de réponse). */
function outils(ctx) {
  const lang = ctx.lang === 'en' ? 'en' : 'fr'
  const L = ctx.L || localizer(lang)
  const t = traducteur(lang)
  const skillName = ctx.skillName || ((slug) => slug)
  const skillLabel = ctx.skillLabel || ((slug) => L.skill(slug, skillName(slug)))

  /** ['A', 'B', 'C'] -> "A, B et C" / "A, B and C" */
  const liste = (valeurs) => {
    const xs = valeurs.filter(Boolean)
    if (xs.length <= 1) return xs.join('')
    return `${xs.slice(0, -1).join(', ')}${t('et')}${xs[xs.length - 1]}`
  }

  /** 20 -> "1 an et 8 mois" / "1 year and 8 months" */
  const duree = (mois) => {
    const ans = Math.floor(mois / 12)
    const reste = mois % 12
    const parts = []
    if (ans) parts.push(t('ans', { n: ans }))
    if (reste) parts.push(t('mois', { n: reste }))
    return parts.join(t('et')) || t('moinsDunMois')
  }

  const libelleExp = (e) => {
    const x = L.experience(e)
    return t('chez', { poste: x.poste, entreprise: x.entreprise })
  }
  const expItem = (e) => ({ label: libelleExp(e), sub: L.period(e.debut, e.fin), to: 'experiences' })

  /** Engagement associatif : le nom de l'organisation, puis le rôle et la période (ou la description). */
  const assoItem = (e, { detail = false } = {}) => {
    const x = L.experience(e)
    return detail
      ? { label: x.entreprise, sub: x.description, wrap: true, to: 'associatif' }
      : { label: x.entreprise, sub: [x.poste, L.period(e.debut, e.fin)].filter(Boolean).join(' · '), to: 'associatif' }
  }

  const projetItem = (p, focus = []) => {
    const x = L.projet(p)
    return {
      label: x.titre,
      sub: [x.contexte, focus.length ? focus.map(skillLabel).join(' · ') : null].filter(Boolean).join(' · '),
      to: `projets/${p.projet_slug}`,
    }
  }

  return { lang, L, t, skillName, skillLabel, liste, duree, libelleExp, expItem, assoItem, projetItem }
}

/**
 * Questions fréquentes proposées au recruteur, par thème : clé française (`fr`) et libellé anglais (`en`).
 * Il ne peut pas en rédiger d'autres : l'interface n'affiche que celles auxquelles les données permettent
 * de répondre (voir questionsDisponibles). Les « projets » sont ses projets personnels : les projets
 * d'entreprise sont décrits dans les expériences.
 */
export const FAQ = [
  {
    theme: { fr: 'Profil', en: 'Profile' },
    questions: [
      { fr: 'Qui est Joël ?', en: 'Who is Joël?' },
      { fr: 'Pourquoi le recruter ?', en: 'Why hire him?' },
      { fr: 'Que fait-il en ce moment ?', en: 'What is he doing at the moment?' },
      { fr: 'Est-il disponible pour un CDI ou un stage ?', en: 'Is he available for a permanent job or an internship?' },
      { fr: 'Quand sera-t-il diplômé ?', en: 'When will he graduate?' },
    ],
  },
  {
    theme: { fr: 'Expérience', en: 'Experience' },
    questions: [
      { fr: 'Combien d’années d’expérience a-t-il ?', en: 'How many years of experience does he have?' },
      { fr: 'Dans quelles entreprises a-t-il travaillé ?', en: 'Which companies has he worked for?' },
      { fr: 'Dans quels secteurs a-t-il travaillé ?', en: 'Which sectors has he worked in?' },
      { fr: 'Quels résultats concrets a-t-il obtenus ?', en: 'What concrete results has he achieved?' },
      { fr: 'Que fait-il chez De Rijke ?', en: 'What does he do at De Rijke?' },
      { fr: 'Qu’a-t-il réalisé chez Afriland First Bank ?', en: 'What did he achieve at Afriland First Bank?' },
    ],
  },
  {
    theme: { fr: 'Compétences', en: 'Skills' },
    questions: [
      { fr: 'Quelles sont ses compétences principales ?', en: 'What are his main skills?' },
      { fr: 'Expérience avec Power BI', en: 'Experience with Power BI' },
      { fr: 'Expérience en Python', en: 'Experience with Python' },
      { fr: 'Expérience en SQL', en: 'Experience with SQL' },
      { fr: 'Expérience en intelligence artificielle', en: 'Experience with artificial intelligence' },
      { fr: 'Expérience en intégration de données (ETL)', en: 'Experience with data integration (ETL)' },
      { fr: 'Quels outils de data visualisation utilise-t-il ?', en: 'Which data visualisation tools does he use?' },
      { fr: 'Compétences en développement web', en: 'Web development skills' },
      { fr: 'Connaît-il les méthodes agiles ?', en: 'Is he familiar with agile methods?' },
    ],
  },
  {
    theme: { fr: 'Projets', en: 'Projects' },
    questions: [
      { fr: 'Combien de projets personnels a-t-il réalisés ?', en: 'How many personal projects has he completed?' },
      { fr: 'Quel est son projet le plus récent ?', en: 'What is his most recent project?' },
      { fr: 'Quels projets sont disponibles sur GitHub ?', en: 'Which projects are on GitHub?' },
    ],
  },
  {
    theme: { fr: 'Formation et langues', en: 'Education & languages' },
    questions: [
      { fr: 'Quels diplômes prépare-t-il ?', en: 'Which degree is he studying for?' },
      { fr: 'Quelles certifications a-t-il ?', en: 'Which certifications does he hold?' },
      { fr: 'Quelles langues parle-t-il ?', en: 'Which languages does he speak?' },
      { fr: 'Quel est son niveau d’anglais ?', en: 'What is his level of English?' },
    ],
  },
  {
    theme: { fr: 'Engagement et loisirs', en: 'Involvement & interests' },
    questions: [
      { fr: 'A-t-il un engagement associatif ?', en: 'Is he involved in any associations or clubs?' },
      { fr: 'Pratique-t-il un sport ?', en: 'Does he play any sport?' },
    ],
  },
  {
    theme: { fr: 'Contact', en: 'Contact' },
    questions: [
      { fr: 'Comment le contacter ?', en: 'How can I contact him?' },
      { fr: 'Quelle est son adresse e-mail ?', en: 'What is his email address?' },
      { fr: 'Voir son CV', en: 'View his CV' },
    ],
  },
]

const LIBELLES = new Map(FAQ.flatMap((g) => g.questions.map((q) => [q.fr, q])))

/** Libellé affiché d'une question (clé française -> langue du site ; clé inconnue -> elle-même). */
export function libelleQuestion(cle, lang = 'fr') {
  const q = LIBELLES.get(cle)
  return (q && (q[lang] || q.fr)) || cle
}

/** La FAQ, limitée aux questions qui ont une vraie réponse avec les données actuelles. */
export function questionsDisponibles(ctx) {
  if (!ctx?.candidat) return []
  const lang = ctx.lang === 'en' ? 'en' : 'fr'
  return FAQ.map((g) => ({
    id: g.theme.fr,
    theme: g.theme[lang] || g.theme.fr,
    questions: g.questions
      .filter((q) => {
        const r = answer(q.fr, ctx)
        return !r.sansReponse && !r.vide
      })
      .map((q) => ({ key: q.fr, label: q[lang] || q.fr })),
  })).filter((g) => g.questions.length)
}

const MOTS_VIDES = new Set(
  'les des une un le la de du et en au aux pour par sur dans avec quel quelle quels quelles est sont ont a il elle ses son sa qui que quoi comment combien projet projets fait faire avoir utilise utilisant joel diangon'.split(
    ' ',
  ),
)

const Q_RESULTATS = 'Quels résultats concrets a-t-il obtenus ?'

export function answer(question, ctx = {}) {
  const { lang, L, t, skillName, skillLabel, liste, duree, libelleExp, expItem, assoItem, projetItem } = outils(ctx)
  const q = normalize(question)
  const { candidat } = ctx
  if (!candidat) return { title: t('chargementTitre'), text: t('chargementTexte'), items: [], sansReponse: true }

  const projetsTous = ctx.projets || []
  const experiences = candidat.experiences || []
  const isAssociatif = ctx.isAssociatif || (() => false)
  const pros = experiences.filter((e) => !isAssociatif(e))
  const assos = experiences.filter((e) => isAssociatif(e))
  const liens = candidat.liens || {}
  const langues = ctx.langues || candidat.langues || []
  const certifications = ctx.certifications || candidat.certifications || []
  const sansReponse = { title: t('sansReponse'), text: '', items: [], sansReponse: true }

  // ── Projets publiés sur GitHub (avant « contact », qui reconnaît aussi « github »)
  if (has(q, / github /) && has(q, / (projets?|code|depots?|realisations?) /)) {
    const avecCode = trierProjets(projetsTous.filter((p) => p.liens?.github))
    const items = avecCode.map((p) => ({ ...projetItem(p), sub: urlLisible(p.liens.github) }))
    if (liens.github) items.push({ label: t('githubProfil'), sub: urlLisible(liens.github), href: liens.github })
    return {
      title: t('githubTitre'),
      text: avecCode.length ? t('githubTexte', { n: avecCode.length, total: projetsTous.length }) : '',
      items,
      vide: !avecCode.length,
    }
  }

  // ── Adresse e-mail (avant « contact », qui reconnaît aussi « e-mail »)
  if (has(q, / (e ?mail|mail|courriel|adresse electronique) /) && !has(q, / (contact|contacter|joindre) /)) {
    return {
      title: t('emailTitre'),
      text: liens.email || '',
      items: liens.email ? [{ label: t('emailEcrire'), sub: t('emailEcrireSub'), href: `mailto:${liens.email}` }] : [],
      vide: !liens.email,
    }
  }

  // ── Contact : e-mail d'abord, puis LinkedIn, GitHub, autres liens, et le CV s'il est en ligne
  if (has(q, / (contact|contacter|joindre|e ?mail|mail|linkedin|github|coordonnees|telephone) /)) {
    const ordre = ['email', 'linkedin', 'github']
    const cles = [...ordre, ...Object.keys(liens).filter((k) => !ordre.includes(k))].filter((k) => liens[k])
    const noms = { linkedin: 'LinkedIn', github: 'GitHub' }
    const items = cles.map((k) =>
      k === 'email'
        ? { label: t('email'), sub: liens.email, href: `mailto:${liens.email}` }
        : { label: noms[k] || majuscule(k), sub: urlLisible(liens[k]), href: liens[k] },
    )
    if (ctx.cvAvailable) items.push({ label: t('voirCv'), sub: t('cvCoordonnees'), cv: true })
    const texte =
      liens.email && liens.linkedin
        ? t('contactEmailLinkedin', { email: liens.email })
        : liens.email
          ? t('contactEmail', { email: liens.email })
          : liens.linkedin
            ? t('contactLinkedin')
            : t('contactAucun')
    return { title: t('contactTitre'), text: texte, items, vide: !items.length }
  }

  // ── CV
  if (has(q, / (cv|curriculum|resume pdf) /)) {
    return ctx.cvAvailable
      ? { title: t('cvTitre'), text: t('cvTexte'), items: [{ label: t('voirCv'), sub: t('cvSub'), cv: true }] }
      : { title: t('cvTitre'), text: t('cvAbsent'), items: [], vide: true }
  }

  // ── Expérience dans une entreprise citée (« Que fait-il chez De Rijke ? »)
  const citee = experienceCitee(q, experiences)
  if (citee) {
    const x = L.experience(citee)
    return {
      title: x.entreprise,
      text: x.description || '',
      items: [isAssociatif(citee) ? assoItem(citee) : expItem(citee)],
    }
  }

  // ── Sport (détecté dans l'intitulé ou la description des expériences, pas écrit en dur)
  if (has(q, / (sports?|sportif|sportive|natation|nage|nager|piscine|loisirs?|hobbies?|passions?|temps libre) /)) {
    const sports = sortByDateDesc(experiences.filter((e) => SPORTS.test(normalize(`${e.poste} ${e.description}`))))
    if (!sports.length) return { title: t('sportTitre', {}), text: t('sportAucun'), items: [], vide: true }
    const noms = sports
      .filter((e) => SPORTS.test(normalize(e.poste)))
      .map((e) => nomSport(L.experience(e).poste))
    const texte = sports
      .map((e) => {
        const x = L.experience(e)
        const quand = e.fin
          ? t('sportPeriode', { organisation: x.entreprise, periode: L.period(e.debut, e.fin) })
          : t('sportDepuis', { organisation: x.entreprise, date: L.month(e.debut) })
        return [quand, x.description].filter(Boolean).join(' ')
      })
      .join(' ')
    return {
      title: t('sportTitre', { sports: liste([...new Set(noms)]) }),
      text: texte,
      items: sports.map((e) => (isAssociatif(e) ? assoItem(e) : expItem(e))),
    }
  }

  // ── Langues
  if (has(q, / (langues?|anglais|francais|english|parle|bilingue) /)) {
    // Une langue précise (« niveau d'anglais ») : elle passe en premier.
    const precise = langues.find((l) => q.includes(` ${normalize(l.langue).trim()} `))
    // Langue citée mais absente du profil : pas de vraie réponse (la question n'est pas proposée)
    const absente = !precise && has(q, / (anglais|francais|espagnol|allemand|italien|portugais|english) /)
    const autres = langues.filter((l) => l !== precise)
    const ligne = (l) => {
      const x = L.langue(l)
      return `${x.langue}${t('deuxPoints')}${x.niveau}`
    }
    // « Français (langue maternelle) », « Anglais (B1, intermédiaire) » : pas de parenthèses imbriquées
    const entreParentheses = (l) => {
      const x = L.langue(l)
      return `${x.langue} (${minuscule(String(x.niveau ?? '').replace(/\s*\(([^)]*)\)/, ', $1'))})`
    }
    return {
      title: precise ? ligne(precise) : t('languesTitre'),
      text: precise
        ? autres.length
          ? t('autresLangues', { n: autres.length, liste: autres.map(entreParentheses).join(', ') })
          : ''
        : langues.map(ligne).join(' · '),
      items: [{ label: t('languesDetail'), to: 'langues' }],
      vide: !langues.length || absente,
    }
  }

  // ── Certifications
  if (has(q, / (certif\w*) /)) {
    const parStatut = new Map()
    for (const c of certifications) if (c.statut) parStatut.set(c.statut, (parStatut.get(c.statut) || 0) + 1)
    const detail = [...parStatut]
      .map(([statut, n]) => t('certifStatut', { n, statut, libelle: L.statut(statut) }))
      .join(', ')
    const unique = certifications.length === 1 && certifications[0]
    return {
      title: t('certifsTitre'),
      text: unique
        ? t('certifUnique', { libelle: unique.statut ? L.statut(unique.statut) : '' })
        : certifications.length
          ? t('certifsTexte', { n: certifications.length, detail })
          : '',
      items: certifications.map((c) => {
        const x = L.certification(c)
        return { label: x.nom, sub: majuscule(x.statut), to: 'formation' }
      }),
      vide: !certifications.length,
    }
  }

  const expsChiffrees = sortByDateDesc(pros).filter((e) => chiffresCles(e.description))
  const avecMetriques = projetsAvecMetriques(projetsTous)

  // ── Atouts (avant « disponibilité », qui reconnaît aussi « recruter »)
  if (has(q, / (pourquoi|atouts?|points forts|forces?|valeur ajoutee|apporter|se distingue) /)) {
    const top = topCompetences(candidat, 4)
    const enCours = sortByDateDesc(pros).find((e) => !e.fin)
    const total = moisCouverts(pros)
    const data = moisCouverts(pros.filter((e) => (e.competences || []).length))
    const experience = !pros.length
      ? null
      : data === total
        ? t('atoutsExpData', { duree: duree(total) })
        : data
          ? t('atoutsExpDont', { duree: duree(total), dureeData: duree(data) })
          : t('atoutsExp', { duree: duree(total) })
    const actuel = enCours && L.experience(enCours)
    const texte = [
      experience,
      actuel ? t('atoutsActuel', { poste: actuel.poste, entreprise: actuel.entreprise }) : null,
      projetsTous.length ? t('atoutsProjets', { n: projetsTous.length, m: avecMetriques.length }) : null,
      top.length ? t('atoutsPointsForts', { liste: top.map((c) => skillLabel(c.skill_slug)).join(', ') }) : null,
    ]
      .filter(Boolean)
      .join(' ')
    const items = []
    if (expsChiffrees.length || avecMetriques.length) items.push({ label: t('voirResultats'), ask: Q_RESULTATS })
    if (projetsTous.length) items.push({ label: t('voirProjets'), to: 'projets' })
    return { title: t('atoutsTitre'), text: texte, items, vide: !texte }
  }

  // ── Résultats chiffrés : expériences (phrases chiffrées de la description) puis projets (métriques)
  if (has(q, / (resultats?|chiffres?|impacts?|gains?|metriques?|concrets?|realisations? chiffrees) /)) {
    const items = [
      ...expsChiffrees.map((e) => ({
        label: libelleExp(e),
        sub: chiffresCles(L.experience(e).description),
        wrap: true,
        to: 'experiences',
      })),
      ...avecMetriques.map((p) => {
        const x = L.projet(p)
        return {
          label: x.titre,
          sub: Object.entries(x.metriques)
            .map(([k, v]) => `${L.metricLabel(k)}${t('deuxPoints')}${v}`)
            .join(' · '),
          wrap: true,
          to: `projets/${p.projet_slug}`,
        }
      }),
    ]
    const texte =
      expsChiffrees.length && avecMetriques.length
        ? t('resultatsTous')
        : expsChiffrees.length
          ? t('resultatsEntreprise')
          : t('resultatsProjets')
    return { title: t('resultatsTitre'), text: items.length ? texte : '', items, vide: !items.length }
  }

  // ── Secteurs d'activité
  if (has(q, / (secteurs?|domaines? d activite|industries?|finance|banque|bancaire|logistique|transport|supply chain) /)) {
    const parSecteur = new Map()
    for (const e of sortByDateDesc(pros)) {
      const s = secteurDe(e)
      if (!parSecteur.has(s)) parSecteur.set(s, [])
      parSecteur.get(s).push(e)
    }
    const nommes = [...parSecteur.keys()].filter((s) => s !== AUTRE_SECTEUR)
    return {
      title: t('secteursTitre'),
      text: nommes.length ? t('secteursTexte', { n: nommes.length, liste: nommes.map((s) => minuscule(s[lang])).join(', ') }) : '',
      items: [...parSecteur.entries()].flatMap(([s, exps]) =>
        exps.map((e) => ({ label: libelleExp(e), sub: `${s[lang]} · ${L.period(e.debut, e.fin)}`, to: 'experiences' })),
      ),
      vide: !pros.length,
    }
  }

  // ── Formation
  if (has(q, / (formations?|diplomes?|ecoles?|etudes?|etudiant|master|ingenieur|prepa|academique|universite|esigelec|bac) /)) {
    const formations = sortByDateDesc(candidat.formations || [])
    const enCours = formations.find((f) => f.fin && f.fin >= moisCourant())
    const quand = has(q, / (quand|date|fin|termine\w*|obtention) /)
    const x = enCours && L.formation(enCours)
    const derniere = formations[0] && L.formation(formations[0])
    return {
      title: enCours && quand ? t('formationQuandTitre', { date: L.month(enCours.fin) }) : t('formationTitre'),
      text: enCours
        ? t('formationEnCours', { diplome: x.diplome, ecole: x.ecole, date: L.month(enCours.fin) })
        : derniere
          ? t('formationDerniere', { n: formations.length, diplome: derniere.diplome, ecole: derniere.ecole })
          : '',
      items: formations.map((f) => {
        const xf = L.formation(f)
        return { label: xf.diplome, sub: `${xf.ecole} · ${L.period(f.debut, f.fin)}`, to: 'formation' }
      }),
      // « Quand sera-t-il diplômé ? » n'a de sens que pendant une formation en cours
      vide: !formations.length || (quand && !enCours),
    }
  }

  // ── Associatif
  if (has(q, / (associ\w*|benevol\w*|engagement|club|mentor\w*|afev) /)) {
    const liste_ = sortByDateDesc(assos)
    return {
      title: t('assoTitre'),
      text: liste_.length
        ? t('assoTexte', { n: liste_.length, noms: liste(liste_.map((e) => L.experience(e).entreprise)) })
        : t('assoAucun'),
      items: liste_.map((e) => assoItem(e)),
      vide: !liste_.length,
    }
  }

  const skills = detectSkills(q, { ...ctx, projets: projetsTous, skillName })

  // ── Années d'expérience
  if (
    has(q, / (combien|nombre|annees?|ans|duree|depuis quand|anciennete) /) &&
    has(q, / (experiences?|expe|travail|travaille|professionnel\w*|carriere) /) &&
    !skills.slugs.length
  ) {
    const total = moisCouverts(pros)
    const totalData = moisCouverts(pros.filter((e) => (e.competences || []).length))
    const compte = { alternances: 0, stages: 0, autresPostes: 0 }
    for (const e of pros) compte[typeContrat(e)] += 1
    const types = liste(Object.entries(compte).map(([cle, n]) => (n ? t(cle, { n }) : null)))
    const vars = { duree: duree(total), n: pros.length, types, dureeData: duree(totalData) }
    return {
      title: t('expTitre'),
      text: !pros.length
        ? ''
        : totalData === total
          ? t('expData', vars)
          : totalData
            ? t('expDont', vars)
            : t('expSimple', vars),
      items: sortByDateDesc(pros).map(expItem),
      vide: !pros.length,
    }
  }

  // ── Poste actuel / disponibilité
  if (has(q, / (actuel\w*|aujourd hui|en ce moment|maintenant|poste|alternance|alternant|disponib\w*|recrut\w*|embauch\w*|cdi|stage) /)) {
    const enCours = sortByDateDesc(pros.filter((e) => !e.fin))
    const formation = sortByDateDesc(candidat.formations || []).find((f) => !f.fin || f.fin >= moisCourant())
    const xf = formation && L.formation(formation)
    const dispo = has(q, / (disponib\w*|recrut\w*|embauch\w*|cdi|stage) /)
    const roles = enCours.map((e) => {
      const x = L.experience(e)
      return t('actuelRole', { poste: x.poste, entreprise: x.entreprise, date: L.month(e.debut) })
    })
    const varsFormation = xf && { diplome: xf.diplome, ecole: xf.ecole, date: formation.fin ? L.month(formation.fin) : '' }
    const texte = [
      roles.length ? t('actuelTexte', { roles: liste(roles) }) : null,
      xf ? t(roles.length ? 'actuelFormation' : 'actuelFormationSeule', varsFormation) : null,
      liens.email ? t('actuelContactEmail', { email: liens.email }) : t('actuelContactLinkedin'),
    ]
      .filter(Boolean)
      .join(' ')
    const items = enCours.map(expItem)
    if (dispo) {
      if (liens.email) items.push({ label: t('email'), sub: liens.email, href: `mailto:${liens.email}` })
      if (liens.linkedin) items.push({ label: 'LinkedIn', sub: urlLisible(liens.linkedin), href: liens.linkedin })
    } else if (xf) {
      items.push({ label: xf.diplome, sub: `${xf.ecole} · ${L.period(formation.debut, formation.fin)}`, to: 'formation' })
    }
    // Sans poste ni formation en cours, « Que fait-il en ce moment ? » n'a pas de vraie réponse
    return { title: dispo ? t('dispoTitre') : t('actuelTitre'), text: texte, items, vide: !dispo && !roles.length && !xf }
  }

  // ── Expérience par compétence : en entreprise, en projet personnel, en associatif
  if (skills.slugs.length) {
    const set = new Set(skills.slugs)
    const utilise = (x) => (x.competences || []).some((s) => set.has(s))
    const exps = sortByDateDesc(pros.filter(utilise))
    const projets = trierProjets(projetsTous.filter(utilise))
    const assosX = sortByDateDesc(assos.filter(utilise))
    // Compétences déclarées dans le profil, dans l'ordre de la question puis de la famille
    const declarees = skills.slugs
      .map((slug) => (candidat.competences || []).find((c) => c.skill_slug === slug))
      .filter(Boolean)
    const sujet = skills.familles.length
      ? skills.familles.map((f) => f.titre[lang]).join(', ')
      : skills.slugs.map(skillLabel).join(', ')
    const pratique = [
      exps.length
        ? t('pratiqueEntreprise', {
            duree: duree(moisCouverts(exps)),
            entreprises: [...new Set(exps.map((e) => L.experience(e).entreprise))].join(', '),
          })
        : null,
      projets.length ? t('pratiqueProjets', { n: projets.length }) : null,
      assosX.length
        ? t('pratiqueAsso', { n: assosX.length, noms: assosX.map((e) => L.experience(e).entreprise).join(', ') })
        : null,
    ].filter(Boolean)
    const texte = [
      declarees.length && (skills.familles.length || !pratique.length)
        ? t('competencesListe', { liste: declarees.map((c) => skillLabel(c.skill_slug)).join(', ') })
        : null,
      pratique.length ? t('pratique', { liste: liste(pratique) }) : null,
    ]
      .filter(Boolean)
      .join(' ')
    const items = [
      ...exps.map(expItem),
      ...projets.map((p) => projetItem(p, (p.competences || []).filter((s) => set.has(s)))),
      ...assosX.map((e) => assoItem(e, { detail: true })),
    ]
    if (!items.length && declarees.length) items.push({ label: t('voirCompetences'), to: 'competences' })
    return {
      title: majuscule(sujet),
      text: texte,
      items,
      vide: !exps.length && !projets.length && !assosX.length && !declarees.length,
    }
  }

  // ── Entreprises
  if (has(q, / (entreprises?|societes?|employeurs?|boites?|travaille) /)) {
    const exps = sortByDateDesc(pros)
    const noms = [...new Set(exps.map((e) => L.experience(e).entreprise))]
    return {
      title: t('entreprisesTitre'),
      text: noms.length ? t('entreprisesTexte', { n: noms.length, noms: liste(noms) }) : '',
      items: exps.map(expItem),
      vide: !exps.length,
    }
  }

  // ── Projet le plus récent
  if (has(q, / (projets?|realisations?) /) && has(q, / (recents?|dernier|derniere|nouveau) /)) {
    const recent = trierProjets(projetsTous.filter((p) => p.date_debut || p.date_fin))[0]
    if (recent) {
      const x = L.projet(recent)
      const date = L.period(recent.date_debut, recent.date_fin)
      return {
        title: t('projetRecentTitre'),
        text: `${x.titre}${date ? `, ${date}` : ''}. ${x.description || ''}`.trim(),
        items: [projetItem(recent, recent.competences || [])],
      }
    }
  }

  // ── Projets personnels (général)
  if (has(q, / (projets?|realisations?|portfolio|travaux) /)) {
    const projets = trierProjets(projetsTous)
    return {
      title: t('projetsTitre'),
      text: projets.length ? t('projetsTexte', { n: projets.length }) : '',
      items: projets.map((p) => projetItem(p)),
      vide: !projets.length,
    }
  }

  // ── Compétences (général)
  if (has(q, / (competences?|sait|savoir|maitrise|technos?|technologies?|outils?|stack|langages?|points forts) /)) {
    const toutes = candidat.competences || []
    // Une compétence mobilisée par un projet ouvre les projets filtrés ; sinon, le graphe de compétences.
    const lien = (slug) =>
      projetsTous.some((p) => (p.competences || []).includes(slug)) ? `projets?competence=${slug}` : 'competences'
    return {
      title: t('competencesTitre'),
      text: toutes.length ? t('competencesTexte', { n: toutes.length }) : '',
      items: topCompetences(candidat, 10).map((c) => ({
        label: skillLabel(c.skill_slug),
        sub: c.domaine ? L.domain(c.domaine) : '',
        to: lien(c.skill_slug),
      })),
      vide: !toutes.length,
    }
  }

  // ── Profil
  if (has(q, / (qui|profil|presente\w*|resume|parcours|bio) /)) {
    return {
      title: [candidat.prenom, candidat.nom].filter(Boolean).join(' '),
      text: L.bio(candidat.bio) || L.titre(candidat.titre) || '',
      items: [{ label: t('voirParcours'), sub: t('voirParcoursSub'), to: 'portfolio' }],
    }
  }

  // ── Recherche plein texte (repli) : la détection se fait en français, l'affichage dans la langue du site
  const mots = q.split(' ').filter((w) => w.length >= 3 && !MOTS_VIDES.has(w))
  if (mots.length) {
    const score = (texte) => mots.filter((m) => normalize(texte).includes(` ${m}`)).length
    const projets = projetsTous
      .map((p) => ({ p, s: score(`${p.titre} ${p.description} ${p.contexte}`) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => projetItem(x.p))
    const exps = experiences
      .map((e) => ({ e, s: score(`${e.poste} ${e.entreprise} ${e.description}`) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => (isAssociatif(x.e) ? assoItem(x.e) : expItem(x.e)))
    if (projets.length || exps.length) {
      const n = projets.length + exps.length
      return { title: t('rechercheTitre'), text: t('rechercheTexte', { n }), items: [...projets, ...exps] }
    }
  }

  return sansReponse
}
