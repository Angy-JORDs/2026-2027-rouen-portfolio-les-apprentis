/**
 * Contenu que l'API d'équipe n'expose pas (encore).
 *
 * Les langues et certifications sont présentes dans data/candidats/JoelDIANGON.json, mais le modèle
 * Pydantic CandidatOut (backend/src/portfolio_api/models/schemas.py) ne les renvoie pas.
 * Les sections lisent d'abord l'API (candidat.langues / candidat.certifications) : si l'équipe ajoute
 * ces champs au contrat, ce fichier ne sert plus et rien n'est à recoder.
 */

/** CV téléchargeable : déposer le PDF (version sans adresse) sous ce nom dans le dossier public/. */
export const CV_URL = '/cv-joel-diangon.pdf'

export const LANGUES = [
  { langue: 'Français', niveau: 'Langue maternelle', score: 5 },
  { langue: 'Anglais', niveau: 'B1 (intermédiaire)', score: 3 },
]

export const CERTIFICATIONS = [
  { nom: 'Data Science et Machine Learning (MasterClass Python)', statut: 'obtenue' },
  { nom: 'Microsoft Certified: Power BI Data Analyst Associate', statut: 'en cours' },
]

/** Organisations dont l'expérience est classée « associative » (le reste est professionnel). */
// Noms français ET anglais (src/i18n/content.js traduit « Club informatique ESIGELEC » en « ESIGELEC Computer Club »)
const ORGANISATIONS_ASSOCIATIVES = ['afev', 'club informatique', 'computer club', 'vikings']

export function isAssociatif(experience) {
  const nom = String(experience?.entreprise || '').toLowerCase()
  return ORGANISATIONS_ASSOCIATIVES.some((motif) => nom.includes(motif))
}
