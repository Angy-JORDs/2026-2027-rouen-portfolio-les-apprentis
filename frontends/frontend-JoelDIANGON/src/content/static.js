/**
 * Contenu que l'API d'équipe n'expose pas (encore).
 *
 * Les langues et certifications sont présentes dans data/candidats/JoelDIANGON.json, mais le modèle
 * Pydantic CandidatOut (backend/src/portfolio_api/models/schemas.py) ne les renvoie pas.
 * Les sections lisent d'abord l'API (candidat.langues / candidat.certifications) : si l'équipe ajoute
 * ces champs au contrat, ce fichier ne sert plus et rien n'est à recoder.
 */

export const LANGUES = [
  { langue: 'Français', niveau: 'Langue maternelle', score: 5 },
  { langue: 'Anglais', niveau: 'B1 — intermédiaire', score: 3 },
]

export const CERTIFICATIONS = [
  { nom: 'Data Science et Machine Learning — MasterClass Python', statut: 'obtenue' },
  { nom: 'Microsoft Certified: Power BI Data Analyst Associate', statut: 'en cours' },
]

/** Organisations dont l'expérience est classée « associative » (le reste est professionnel). */
const ORGANISATIONS_ASSOCIATIVES = ['afev', 'club informatique']

export function isAssociatif(experience) {
  const nom = String(experience?.entreprise || '').toLowerCase()
  return ORGANISATIONS_ASSOCIATIVES.some((motif) => nom.includes(motif))
}

/** Niveau de langue : l'API (s'il existe) peut renvoyer un texte libre ; on en déduit un score 1–5. */
export function scoreLangue(langue) {
  if (typeof langue.score === 'number') return langue.score
  const niveau = String(langue.niveau || '').toLowerCase()
  if (niveau.includes('matern') || niveau.includes('c2')) return 5
  if (niveau.includes('c1')) return 4
  if (niveau.includes('b2')) return 3.5
  if (niveau.includes('b1')) return 3
  if (niveau.includes('a2')) return 2
  return 1
}
