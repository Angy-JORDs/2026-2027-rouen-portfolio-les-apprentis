import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { CANDIDAT_SLUG } from "../config";
import { useMesProjetSlugs } from "../hooks";
import { Empty, QueryState, Section } from "../components/State";
import { SkillChips, periode } from "../components/Chips";

/** Fiche détaillée d'un projet du candidat (R8) + projets similaires parmi ses projets (R4) + suppression. */
export default function ProjetPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const projet = useQuery({ queryKey: ["projet", slug], queryFn: () => api.projet(slug) });
  const similaires = useQuery({
    queryKey: ["similaires", slug],
    queryFn: () => api.similaires(slug, 20),
  });
  const mesProjets = useMesProjetSlugs();

  const suppression = useMutation({
    mutationFn: () => api.supprimerProjet(slug),
    onSuccess: () => {
      queryClient.invalidateQueries();
      navigate("/projets");
    },
  });

  const p = projet.data;
  // Ce frontend ne montre que les projets du candidat concerné.
  const estMien = !p || p.candidat_slugs.includes(CANDIDAT_SLUG);
  const mesSimilaires = (similaires.data?.similaires ?? [])
    .filter((s) => mesProjets.data?.has(s.projet_slug))
    .slice(0, 5);

  return (
    <QueryState isLoading={projet.isLoading} error={projet.error}>
      {p && !estMien && (
        <>
          <Link to="/projets" className="text-sm">
            ← Mes projets
          </Link>
          <Empty>Projet non trouvé.</Empty>
        </>
      )}
      {p && estMien && (
        <>
          <Link to="/projets" className="text-sm">
            ← Tous mes projets
          </Link>
          <header className="mt-2 glass rounded-2xl p-6">
            <h1 className="text-3xl font-bold">{p.titre}</h1>
            {p.contexte && <p className="text-slate-300">{p.contexte}</p>}
            {periode(p.date_debut, p.date_fin) && (
              <p className="text-sm text-slate-400">{periode(p.date_debut, p.date_fin)}</p>
            )}
            {p.candidat_slugs.length > 1 && (
              <p className="mt-1 text-sm text-slate-500">Projet d'équipe ({p.candidat_slugs.length} contributeurs)</p>
            )}
            {p.description && <p className="mt-4 whitespace-pre-line text-slate-300">{p.description}</p>}
            <div className="mt-4">
              <SkillChips slugs={p.competences} />
            </div>
            {Object.keys(p.liens).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(p.liens).map(([nom, url]) => (
                  <a
                    key={nom}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-1 text-sm text-white no-underline hover:text-white"
                  >
                    {nom}
                  </a>
                ))}
              </div>
            )}
          </header>

          {p.images.length > 0 && (
            <Section title="Images">
              <div className="grid gap-4 sm:grid-cols-2">
                {p.images.map((src) => (
                  <img key={src} src={src} alt={p.titre} className="rounded-2xl border border-neon/30" loading="lazy" />
                ))}
              </div>
            </Section>
          )}

          {Object.keys(p.metriques).length > 0 && (
            <Section title="Métriques">
              <dl className="grid gap-3 sm:grid-cols-3">
                {Object.entries(p.metriques).map(([k, v]) => (
                  <div key={k} className="glass rounded-xl p-3">
                    <dt className="text-xs uppercase text-slate-500">{k.replaceAll("_", " ")}</dt>
                    <dd className="text-lg font-semibold">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          <Section title="Projets similaires">
            <QueryState isLoading={similaires.isLoading || mesProjets.isLoading} error={similaires.error}>
              {mesSimilaires.length > 0 ? (
                <ul className="space-y-2">
                  {mesSimilaires.map((s) => (
                    <li key={s.projet_slug} className="glass rounded-xl p-3">
                      <Link to={`/projets/${s.projet_slug}`} className="font-medium">
                        {s.titre}
                      </Link>
                      <span className="ml-2 text-sm text-slate-500">
                        {s.competences_communes} compétence(s) en commun
                      </span>
                      <div className="mt-1">
                        <SkillChips slugs={s.competences} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>Aucun projet similaire.</Empty>
              )}
            </QueryState>
          </Section>
          {import.meta.env.DEV && (
            <div className="mt-10 border-t border-neon/20 pt-4">
              <button
                className="rounded-full border border-red-400/60 px-4 py-1 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                disabled={suppression.isPending}
                onClick={() => {
                  if (window.confirm(`Supprimer définitivement « ${p.titre} » (MongoDB et Neo4j) ?`)) {
                    suppression.mutate();
                  }
                }}
              >
                Supprimer ce projet
              </button>
              {suppression.error && (
                <p className="mt-2 text-sm text-red-300">{(suppression.error as Error).message}</p>
              )}
            </div>
          )}
        </>
      )}
    </QueryState>
  );
}