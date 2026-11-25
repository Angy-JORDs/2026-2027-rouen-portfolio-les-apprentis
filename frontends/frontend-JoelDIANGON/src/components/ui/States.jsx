import { useCallback } from 'react'
import { API_URL } from '../../config'
import { useT } from '../../i18n/LangContext'

const TEXTES = {
  fr: {
    chargement: 'Chargement…',
    titre: 'Impossible de charger ces données',
    reessayer: 'Réessayer',
    indisponible: 'Données momentanément indisponibles. Réessayez dans quelques instants.',
    introuvable: 'Élément introuvable.',
    // Indications pour le développeur (en local uniquement)
    injoignable: 'API injoignable ({url}). Lancez « just dev » à la racine du dépôt.',
    verifier: 'Vérifiez que l’API d’équipe tourne :',
    racine: 'à la racine du dépôt ({url}).',
  },
  en: {
    chargement: 'Loading…',
    titre: 'Unable to load this data',
    reessayer: 'Try again',
    indisponible: 'Data temporarily unavailable. Please try again in a moment.',
    introuvable: 'Item not found.',
    injoignable: 'API unreachable ({url}). Run "just dev" at the root of the repository.',
    verifier: 'Check that the team API is running:',
    racine: 'at the root of the repository ({url}).',
  },
}

/**
 * Message d'erreur dans la langue du site, choisi d'après le code stable d'ApiError (api/client.js).
 * En ligne : message neutre pour le visiteur ; en local (DEV) : l'indication utile au développeur.
 */
function errorMessage(error, t) {
  const code = error?.code
  if (code === 'notFound') return t('introuvable')
  if (import.meta.env.DEV) {
    if (code === 'unreachable') return t('injoignable', { url: API_URL })
    return error?.message || t('indisponible')
  }
  return t('indisponible')
}

/** `const message = useErrorMessage()` puis `message(error)` : utilisé par ErrorState et le bandeau de l'API. */
export function useErrorMessage() {
  const t = useT(TEXTES)
  return useCallback((error) => errorMessage(error, t), [t])
}

export function Loader({ label }) {
  const t = useT(TEXTES)
  return (
    <div className="state state--loading" role="status">
      <span className="loader" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>{label ?? t('chargement')}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry, children }) {
  const t = useT(TEXTES)
  const message = useErrorMessage()
  const unreachable = error?.code === 'unreachable' || error?.status === 0
  return (
    <div className="state state--error" role="alert">
      <p className="state-title">{t('titre')}</p>
      <p className="state-text">{message(error)}</p>
      {unreachable && import.meta.env.DEV && (
        <p className="state-text state-text--hint">
          {t('verifier')} <code>just dev</code> {t('racine', { url: API_URL })}
        </p>
      )}
      <div className="state-actions">
        {onRetry && (
          <button type="button" className="btn" onClick={onRetry}>
            {t('reessayer')}
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
