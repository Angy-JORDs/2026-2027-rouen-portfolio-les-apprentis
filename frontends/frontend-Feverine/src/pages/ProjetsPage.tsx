import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { CANDIDAT_SLUG } from "../config";
import { useMesCompetences } from "../hooks";
import { Empty, QueryState } from "../components/State";
import ProjetCard from "../components/ProjetCard";
import Pagination from "../components/Pagination";

const SIZE = 9;

/** Galerie des projets du candidat concerné — R2 GET /api/candidats/{slug}/projets (filtre ?competence=) */
export default function ProjetsPage() {
  const [competence, setCompetence] = useState("");
  const [page, setPage] = useState(1);
  const stats = useMesCompetences();
  const { data, isLoading, error } = useQuery({
    queryKey: ["candidat-projets", CANDIDAT_SLUG, competence, page, SIZE],
    queryFn: () => api.candidatProjets(CANDIDAT_SLUG, competence || undefined, page, SIZE),
  });

  return (
    <>
      <h1 className="mb-4 text-3xl font-bold">Projets</h1>
      <div className="mb-4 flex items-center gap-2 text-sm">
        <label htmlFor="filtre">Technologie / compétence :</label>
        <select
          id="filtre"
          className="rounded-full border border-neon/40 bg-panel px-3 py-1 text-slate-200 [color-scheme:dark]"
          value={competence}
          onChange={(e) => {
            setCompetence(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Toutes</option>
          {stats.data?.competences.map((c) => (
            <option key={c.skill_slug} value={c.skill_slug}>
              {c.nom}
            </option>
          ))}
        </select>
        {data && <span className="text-slate-500">{data.total} projet(s)</span>}
      </div>
      <QueryState isLoading={isLoading} error={error}>
        {data && data.items.length === 0 ? (
          <Empty>Aucun projet.</Empty>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data?.items.map((p) => <ProjetCard key={p.projet_slug} projet={p} />)}
            </div>
            {data && <Pagination page={data.page} size={data.size} total={data.total} onChange={setPage} />}
          </>
        )}
      </QueryState>
    </>
  );
}