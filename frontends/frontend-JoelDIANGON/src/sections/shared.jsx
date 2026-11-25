import { useCandidat } from '../context/CandidatContext'
import { ErrorState, Loader } from '../components/ui/States'
import { useT } from '../i18n/LangContext'

const TEXTES = {
  fr: { chargement: 'Chargement du profil…' },
  en: { chargement: 'Loading profile…' },
}

/** Affiche le chargement / l'erreur du profil (R1), sinon le contenu de la section. */
export function WithCandidat({ children }) {
  const ctx = useCandidat()
  const t = useT(TEXTES)
  if (ctx.loading && !ctx.candidat) return <Loader label={t('chargement')} />
  if (ctx.error) return <ErrorState error={ctx.error} onRetry={ctx.reload} />
  if (!ctx.candidat) return null
  return children(ctx)
}

/** Compétences d'une expérience/d'un projet -> étiquettes lisibles. */
export function skillTags(slugs, skillName) {
  return (slugs || []).map((slug) => ({ slug, label: skillName(slug) }))
}
