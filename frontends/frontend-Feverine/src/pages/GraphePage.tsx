import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { CANDIDAT_SLUG } from "../config";
import { Empty, QueryState } from "../components/State";
import GraphView from "../components/GraphView";

/** Graphe de compétences du candidat (R5) : candidat → projets → compétences. */
export default function GraphePage() {
  const graphe = useQuery({
    queryKey: ["graphe", CANDIDAT_SLUG],
    queryFn: () => api.grapheCompetence(CANDIDAT_SLUG),
  });

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold">Graphe de compétences</h1>
      <p className="mb-4 text-slate-300">
        Mes projets et les compétences qu'ils utilisent. Clique sur un projet ou une compétence pour ouvrir sa page.
      </p>
      <QueryState isLoading={graphe.isLoading} error={graphe.error}>
        {graphe.data && graphe.data.nodes.length > 1 ? (
          <GraphView graph={graphe.data} height={600} />
        ) : (
          <Empty>Aucun projet à afficher : ajoute des projets dans ton fichier data/projets.</Empty>
        )}
      </QueryState>
    </>
  );
}