import { motion } from 'framer-motion'
import Tags from './ui/Tags'

/**
 * Frise verticale : formations, expériences, ou chronologie complète.
 * items : [{ key, period, title, org, description, tags: [{slug,label}], badge }]
 */
export default function Timeline({ items }) {
  return (
    <ol className="timeline">
      {items.map((item, i) => (
        <motion.li
          key={item.key || i}
          className="tl-item"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="tl-dot" aria-hidden="true" />
          <div className="tl-content">
            <p className="tl-meta">
              <span className="tl-period">{item.period}</span>
              {item.badge && <span className="tl-badge">{item.badge}</span>}
            </p>
            <h3 className="tl-title">{item.title}</h3>
            {item.org && <p className="tl-org">{item.org}</p>}
            {item.description && <p className="tl-desc">{item.description}</p>}
            <Tags items={item.tags} />
          </div>
        </motion.li>
      ))}
    </ol>
  )
}
