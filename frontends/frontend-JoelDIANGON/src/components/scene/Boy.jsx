import { motion } from 'framer-motion'

/**
 * Le garçon, vu de dos : peau noire, cheveux crépus coupés court (low cut), tenue sobre.
 * Illustration vectorielle stylisée (pas de cartoon) : aplats doux, lumière de contour
 * venant des éléments du parcours devant lui.
 *
 * `lookAt` (-1 à 1) : la tête se tourne légèrement vers l'élément survolé.
 */
export default function Boy({ lookAt = 0 }) {
  const turn = Math.max(-1, Math.min(1, lookAt)) * 6

  return (
    <svg className="boy" viewBox="0 0 200 400" role="img" aria-label="Un jeune garçon, vu de dos, face à son parcours">
      <defs>
        <linearGradient id="boy-skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6b4432" />
          <stop offset="1" stopColor="#3e271c" />
        </linearGradient>
        <linearGradient id="boy-skin-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f1d15" />
          <stop offset="1" stopColor="#4a2f22" />
        </linearGradient>
        <linearGradient id="boy-shirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d5f79" />
          <stop offset="1" stopColor="#233a4d" />
        </linearGradient>
        <linearGradient id="boy-sleeve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38586f" />
          <stop offset="1" stopColor="#2a4459" />
        </linearGradient>
        <linearGradient id="boy-pants" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e2b38" />
          <stop offset="1" stopColor="#131c26" />
        </linearGradient>
        <radialGradient id="boy-rim" cx="0.55" cy="0" r="0.95">
          <stop offset="0" stopColor="#cfeee6" stopOpacity="0.42" />
          <stop offset="1" stopColor="#cfeee6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="boy-rim-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8dcd0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#a8dcd0" stopOpacity="0" />
        </linearGradient>
        <pattern id="boy-curls" width="3.1" height="3.1" patternUnits="userSpaceOnUse">
          <circle cx="1.55" cy="1.55" r="0.78" fill="#2b2019" />
        </pattern>
        <clipPath id="boy-head-clip">
          <ellipse cx="100" cy="70" rx="40" ry="47" />
        </clipPath>
      </defs>

      {/* ombre portée */}
      <ellipse cx="100" cy="391" rx="64" ry="6.5" fill="#000" opacity="0.38" />

      {/* jambes et chaussures */}
      <path
        d="M44 244 Q100 256 156 244 L151 368 L112 370 L104 292 Q100 286 96 292 L88 370 L49 368 Z"
        fill="url(#boy-pants)"
      />
      <path d="M100 262 L100 290" stroke="#0d141c" strokeWidth="1.2" opacity="0.6" />
      <path d="M48 363 L89 363 Q92 378 88 386 Q70 390 52 387 Q44 383 48 363 Z" fill="#26323f" />
      <path d="M111 363 L152 363 Q156 383 148 387 Q130 390 112 386 Q108 378 111 363 Z" fill="#26323f" />
      <path d="M51 383 Q70 386.5 87 383" stroke="#c9d6de" strokeWidth="1.6" opacity="0.55" fill="none" />
      <path d="M113 383 Q130 386.5 149 383" stroke="#c9d6de" strokeWidth="1.6" opacity="0.55" fill="none" />

      {/* buste et bras : respiration lente */}
      <motion.g
        animate={{ scaleY: [1, 1.012, 1] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '50%', originY: '100%' }}
      >
        {/* avant-bras et mains */}
        <path d="M37 186 Q31 214 32 240 Q34 250 41 250 Q47 248 46 238 L48 190 Z" fill="url(#boy-skin)" />
        <ellipse cx="39" cy="251" rx="6.5" ry="9" fill="#4a2f22" />
        <path d="M163 186 Q169 214 168 240 Q166 250 159 250 Q153 248 154 238 L152 190 Z" fill="url(#boy-skin)" />
        <ellipse cx="161" cy="251" rx="6.5" ry="9" fill="#4a2f22" />

        {/* t-shirt */}
        <path
          d="M86 127 Q68 129 55 139 Q44 147 43 166 L41 250 Q100 262 159 250 L157 166 Q156 147 145 139 Q132 129 114 127 Q100 133 86 127 Z"
          fill="url(#boy-shirt)"
        />
        <path d="M100 142 L100 252" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1.2" />
        <path d="M68 158 Q80 170 79 186" stroke="#162636" strokeOpacity="0.2" strokeWidth="1.2" fill="none" />
        <path d="M132 158 Q120 170 121 186" stroke="#162636" strokeOpacity="0.2" strokeWidth="1.2" fill="none" />

        {/* manches */}
        <path d="M54 140 Q39 146 35 168 L33 194 Q41 199 50 195 L52 168 Z" fill="url(#boy-sleeve)" />
        <path d="M146 140 Q161 146 165 168 L167 194 Q159 199 150 195 L148 168 Z" fill="url(#boy-sleeve)" />

        {/* lumière de contour venant du parcours */}
        <path d="M145 139 Q156 147 157 166 L159 250" stroke="url(#boy-rim-side)" strokeWidth="1.6" fill="none" />
        <path d="M55 139 Q44 147 43 166 L41 250" stroke="url(#boy-rim-side)" strokeWidth="1.2" fill="none" opacity="0.6" />
        <path d="M86 127 Q68 129 55 139" stroke="#cfeee6" strokeOpacity="0.28" strokeWidth="1.2" fill="none" />
        <path d="M114 127 Q132 129 145 139" stroke="#cfeee6" strokeOpacity="0.32" strokeWidth="1.2" fill="none" />
      </motion.g>

      {/* tête : se tourne doucement vers l'élément survolé */}
      <motion.g
        animate={{ rotate: turn }}
        transition={{ type: 'spring', stiffness: 38, damping: 11 }}
        style={{ originX: '50%', originY: '100%' }}
      >
        {/* cou */}
        <path d="M88 106 L112 106 L114 131 Q100 136 86 131 Z" fill="url(#boy-skin-shade)" />

        {/* crâne */}
        <ellipse cx="100" cy="70" rx="40" ry="47" fill="url(#boy-skin)" />

        {/* cheveux crépus courts (low cut) : texture fine, ligne de nuque nette */}
        <g clipPath="url(#boy-head-clip)">
          <path d="M50 0 L150 0 L150 84 Q128 95 100 107 Q72 95 50 84 Z" fill="#161009" />
          <path d="M50 0 L150 0 L150 84 Q128 95 100 107 Q72 95 50 84 Z" fill="url(#boy-curls)" opacity="0.55" />
          <ellipse cx="114" cy="36" rx="28" ry="17" fill="url(#boy-rim)" />
          <path d="M53 84 Q72 94 100 106 Q128 94 147 84" stroke="#3a2a20" strokeWidth="1" fill="none" opacity="0.6" />
        </g>

        {/* oreilles */}
        <ellipse cx="60.5" cy="78" rx="6" ry="10.5" fill="#55372a" />
        <path d="M59 72.5 Q56.2 78 59.4 84.5" stroke="#2c1b13" strokeWidth="1.1" fill="none" />
        <ellipse cx="139.5" cy="78" rx="6" ry="10.5" fill="#55372a" />
        <path d="M141 72.5 Q143.8 78 140.6 84.5" stroke="#2c1b13" strokeWidth="1.1" fill="none" />
        <path d="M144.5 70 Q147 78 144 87" stroke="#cfeee6" strokeOpacity="0.35" strokeWidth="1" fill="none" />
      </motion.g>
    </svg>
  )
}
