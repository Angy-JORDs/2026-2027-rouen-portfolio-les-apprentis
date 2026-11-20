/** Configuration (surchargeable via .env, voir .env.example). */
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

/** Portfolio personnel : seul ce candidat est affiché. */
export const CANDIDAT_SLUG = import.meta.env.VITE_CANDIDAT_SLUG || 'joel-diangon'
