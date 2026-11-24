import { API_URL } from '../../config'

export function Loader({ label = 'Chargement…' }) {
  return (
    <div className="state state--loading" role="status">
      <span className="loader" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry, children }) {
  const unreachable = error?.status === 0
  return (
    <div className="state state--error" role="alert">
      <p className="state-title">Impossible de charger ces données</p>
      <p className="state-text">{error?.message}</p>
      {unreachable && import.meta.env.DEV && (
        <p className="state-text state-text--hint">
          Vérifiez que l’API d’équipe tourne : <code>just dev</code> à la racine du dépôt ({API_URL}).
        </p>
      )}
      <div className="state-actions">
        {onRetry && (
          <button type="button" className="btn" onClick={onRetry}>
            Réessayer
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
