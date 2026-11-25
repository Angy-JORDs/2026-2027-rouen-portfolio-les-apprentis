import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { CANDIDAT_SLUG } from "../config";
import { filterGraphForCandidat } from "../graphFilter";
import { Empty, QueryState, Section } from "../components/State";
import ProjetCard from "../components/ProjetCard";
import GraphView from "../components/GraphView";

/** Page d'une compétence, limitée au candidat concerné : sa pratique (R6), ses projets (R7), son graphe (R5). */
export default function CompetencePage() {
  const { slug = "" } = useParams();
  const candidats = useQuery({ queryKey: ["comp-candidats", slug], queryFn: () => api.competenceCandidats(slug) });
  const projets = useQuery({ queryKey: ["comp-projets", slug], queryFn: () => api.competenceProjets(slug) });
  const graphe = useQuery({ queryKey: ["graphe", slug], queryFn: () => api.grapheCompetence(slug) });

  const moi = candidats.data?.candidats.find((c) => c.candidat_slug === CANDIDAT_SLUG);
  const mesProjets = projets.data?.projets.filter((p) => p.candidat_slugs.includes(CANDIDAT_SLUG)) ?? [];
  const monGraphe = graphe.data ? filterGraphForCandidat(graphe.data, CANDIDAT_SLUG) : undefined;

  return (
    <QueryState isLoading={candidats.isLoading} error={candidats.error}>
      {candidats.data && (
        <>
          <h1 className="text-3xl font-bold">{candidats.data.nom}</h1>
          <p className="text-slate-500">Compétence « {candidats.data.skill_slug} »</p>

          <Section title="Ma pratique">
            {moi ? (
              <p>
                Utilisée dans <strong>{moi.nb_projets}</strong> de mes projets.
              </p>
            ) : (
              <Empty>Cette compétence n'apparaît dans aucun de mes projets.</Empty>
            )}
          </Section>

          <Section title="Mes projets utilisant cette technologie">
            <QueryState isLoading={projets.isLoading} error={projets.error}>
              {mesProjets.length === 0 ? (
                <Empty>Aucun projet.</Empty>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {mesProjets.map((p) => <ProjetCard key={p.projet_slug} projet={p} />)}
                </div>
              )}
            </QueryState>
          </Section>

          <Section title="Graphe">
            <QueryState isLoading={graphe.isLoading} error={graphe.error}>
              {monGraphe && monGraphe.nodes.length > 0 ? (
                <GraphView graph={monGraphe} />
              ) : (
                <Empty>Rien à afficher pour cette compétence.</Empty>
              )}
            </QueryState>
          </Section>
        </>
      )}
    </QueryState>
  );
}
