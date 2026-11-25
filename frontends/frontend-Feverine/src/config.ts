/**
 * Candidat dont ce frontend affiche le portfolio.
 * Défini dans le fichier .env du frontend (voir .env.example) : VITE_CANDIDAT_SLUG=<candidat_slug>
 * Ce doit être le "candidat_slug" de ton fichier data/candidats/<pseudo>.json.
 */
export const CANDIDAT_SLUG: string = ((import.meta.env.VITE_CANDIDAT_SLUG as string | undefined) ?? "")
  .trim()
  .toLowerCase();
