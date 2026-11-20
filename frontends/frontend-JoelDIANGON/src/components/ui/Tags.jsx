/** Liste d'étiquettes de compétences ; cliquables si `onSelect` est fourni. */
export default function Tags({ items, onSelect, active, max }) {
  if (!items?.length) return null
  const shown = max ? items.slice(0, max) : items
  const rest = max ? items.length - shown.length : 0

  return (
    <ul className="tags">
      {shown.map(({ slug, label }) => (
        <li key={slug}>
          {onSelect ? (
            <button
              type="button"
              className={`tag tag--button${active === slug ? ' is-active' : ''}`}
              aria-pressed={active === slug}
              onClick={(event) => {
                event.stopPropagation()
                onSelect(slug)
              }}
            >
              {label}
            </button>
          ) : (
            <span className="tag">{label}</span>
          )}
        </li>
      ))}
      {rest > 0 && (
        <li>
          <span className="tag tag--more">+{rest}</span>
        </li>
      )}
    </ul>
  )
}
