import type { Graph } from "./types";

/**
 * Ne garde dans le graphe (R5) que le candidat concerné, ses projets et les compétences de ces projets.
 * L'API renvoie le graphe de toute l'équipe pour une compétence : le filtrage se fait ici.
 */
export function filterGraphForCandidat(graph: Graph, candidatSlug: string): Graph {
  const me = `candidat:${candidatSlug}`;
  const myProjets = new Set(
    graph.links.filter((l) => l.type === "REALISE" && l.source === me).map((l) => l.target),
  );
  const mySkills = new Set(
    graph.links.filter((l) => l.type === "UTILISE" && myProjets.has(l.source)).map((l) => l.target),
  );
  const keep = new Set<string>([me, ...myProjets, ...mySkills]);
  return {
    nodes: graph.nodes.filter((n) => keep.has(n.id)),
    links: graph.links.filter(
      (l) =>
        (l.type === "REALISE" && l.source === me && myProjets.has(l.target)) ||
        (l.type === "UTILISE" && myProjets.has(l.source) && mySkills.has(l.target)),
    ),
  };
}
