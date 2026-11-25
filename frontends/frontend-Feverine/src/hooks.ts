import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { CANDIDAT_SLUG } from "./config";

/** Profil du candidat concerné (R1). */
export function useMonProfil() {
  return useQuery({
    queryKey: ["candidat", CANDIDAT_SLUG],
    queryFn: () => api.candidat(CANDIDAT_SLUG),
  });
}

/** Compétences utilisées dans MES projets (R3) : alimente les filtres et le sélecteur de graphe. */
export function useMesCompetences() {
  return useQuery({
    queryKey: ["stats", CANDIDAT_SLUG],
    queryFn: () => api.candidatStats(CANDIDAT_SLUG),
  });
}

/** Slugs de tous MES projets (R2, une seule page de 100). */
export function useMesProjetSlugs() {
  return useQuery({
    queryKey: ["mes-projet-slugs", CANDIDAT_SLUG],
    queryFn: async () => {
      const page = await api.candidatProjets(CANDIDAT_SLUG, undefined, 1, 100);
      return new Set(page.items.map((p) => p.projet_slug));
    },
  });
}
