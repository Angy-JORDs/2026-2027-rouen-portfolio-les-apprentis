import { useLang, useT } from '../../i18n/LangContext'

const TEXTES = {
  fr: { groupe: 'Langue' },
  en: { groupe: 'Language' },
}

/** Les deux langues du site : code affiché sur le bouton, nom complet en infobulle (écrit dans sa langue). */
const LANGUES = [
  { code: 'fr', court: 'FR', nom: 'Français' },
  { code: 'en', court: 'EN', nom: 'English' },
]

/**
 * Sélecteur de langue « FR | EN » : deux boutons dans une même pastille, la langue active surlignée en vert.
 * Rendu par TopActions : barre de navigation (ordinateur), barre du haut (mobile) et page classique.
 * Le choix est mémorisé par LangProvider (src/i18n/LangContext.jsx).
 */
export default function LangToggle({ className = '' }) {
  const { lang, setLang } = useLang()
  const t = useT(TEXTES)

  return (
    <div className={`lang-toggle ${className}`} role="group" aria-label={t('groupe')}>
      {LANGUES.map(({ code, court, nom }) => {
        const actif = lang === code
        return (
          <button
            key={code}
            type="button"
            lang={code}
            className={`lang-toggle-btn${actif ? ' is-active' : ''}`}
            aria-pressed={actif}
            title={nom}
            onClick={() => setLang(code)}
          >
            {court}
          </button>
        )
      })}
    </div>
  )
}
