import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { CANDIDAT_SLUG } from "../config";
import { useMesCompetences, useMonProfil } from "../hooks";
import { Empty, QueryState, Section } from "../components/State";
import Timeline from "../components/Timeline";
import SkillBars from "../components/SkillBars";
import ProjetCard from "../components/ProjetCard";
import Pagination from "../components/Pagination";

const SIZE = 6;
const NOMS_LIENS: Record<string, string> = { github: "GitHub", linkedin: "LinkedIn", email: "Email" };

/** Boutons de contact : GitHub, LinkedIn, email... (clés du champ `liens` du candidat). */
function ContactLinks({ liens }: { liens: Record<string, string> }) {
  return (
    <>
      {Object.entries(liens).map(([nom, url]) => {
        const mail = url.startsWith("mailto:");
        return (
          <a
            key={nom}
            href={url}
            target={mail ? undefined : "_blank"}
            rel="noreferrer"
            className="rounded-full border border-neon/50 bg-neon/10 px-5 py-2 text-sm text-white no-underline transition hover:bg-neon hover:text-night hover:shadow-[0_0_24px_rgba(167,139,250,0.7)]"
          >
            {NOMS_LIENS[nom.toLowerCase()] ?? nom} {mail ? "✉" : "↗"}
          </a>
        );
      })}
    </>
  );
}

/** Portrait facultatif : s'affiche seulement si public/photo.jpg existe. */
function Photo({ alt }: { alt: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <img
      src="/photo.jpg"
      alt={alt}
      onError={() => setOk(false)}
      className="mb-6 h-28 w-28 rounded-full object-cover ring-4 ring-neon/40 shadow-[0_0_40px_rgba(167,139,250,0.5)] lg:absolute lg:right-10 lg:top-4 lg:mb-0 lg:h-48 lg:w-48"
    />
  );
}

/** Petit égaliseur animé (touche « lecteur de musique »). */
function Equalizer() {
  return (
    <span className="flex h-4 items-end gap-0.5">
      {[0, 0.25, 0.5, 0.15].map((d) => (
        <span
          key={d}
          className="w-0.5 rounded-full bg-glow"
          style={{ height: "40%", animation: `eq 0.9s ease-in-out ${d}s infinite` }}
        />
      ))}
    </span>
  );
}

/** Page d'accueil = profil & parcours du candidat concerné (R1), statistiques (R3), projets filtrables (R2). */
export default function CandidatPage() {
  const [competence, setCompetence] = useState("");
  const [page, setPage] = useState(1);

  const candidat = useMonProfil();
  const stats = useMesCompetences();
  const projets = useQuery({
    queryKey: ["candidat-projets", CANDIDAT_SLUG, competence, page],
    queryFn: () => api.candidatProjets(CANDIDAT_SLUG, competence || undefined, page, SIZE),
  });

  const actuel = candidat.data?.timeline.find((t) => t.type === "experience" && !t.fin);
  const parcoursPro = candidat.data?.timeline.filter((t) => t.type === "experience") ?? [];
  const parcoursAcad = candidat.data?.timeline.filter((t) => t.type === "formation") ?? [];
  
  // Le bouton CV n'apparaît que si public/cv.pdf existe vraiment.
  const [hasCv, setHasCv] = useState(false);
  useEffect(() => {
    fetch("/cv.pdf", { method: "HEAD" })
      .then((r) => setHasCv(r.ok && (r.headers.get("content-type") ?? "").includes("pdf")))
      .catch(() => setHasCv(false));
  }, []);

  return (
    <QueryState isLoading={candidat.isLoading} error={candidat.error}>
      {candidat.data && (
        <>
          <header className="relative">
            <div className="pointer-events-none absolute -right-10 -top-16 h-72 w-72 rounded-full bg-neon/20 blur-3xl" />
            <span className="absolute right-6 top-2 animate-pulse text-3xl text-glow/70">✦</span>
            <span className="absolute right-24 top-24 animate-pulse text-lg text-ice/60">✦</span>
            <div className="relative">
              <Photo alt={`Portrait de ${candidat.data.prenom} ${candidat.data.nom}`} />
              {actuel && (
                <p className="glass mb-6 inline-flex items-center gap-3 rounded-full py-2 pl-4 pr-5">
                  <Equalizer />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neon">En ce moment</span>
                  <span className="text-sm text-white">
                    {actuel.titre} · {actuel.organisation}
                  </span>
                </p>
              )}
              <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
                <span className="[text-shadow:0_0_40px_rgba(167,139,250,0.6)]">{candidat.data.prenom}</span>
                <br />
                <span className="holo-text">{candidat.data.nom}</span>
              </h1>
              {candidat.data.titre && (
                <p className="mt-5 font-mono text-xs uppercase tracking-[0.25em] text-neon">{candidat.data.titre}</p>
              )}
              {candidat.data.bio && <p className="mt-4 max-w-2xl text-lg text-slate-300">{candidat.data.bio}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                {hasCv && (
                  <a
                    href="/cv.pdf"
                    download="CV-Fernande-Kedi-Eloundou.pdf"
                    className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-medium text-white no-underline transition hover:text-white hover:shadow-[0_0_28px_rgba(217,70,239,0.6)]"
                  >
                    ↓ Télécharger mon CV
                  </a>
                )}
                <ContactLinks liens={candidat.data.liens} />
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
                {[
                  [stats.data?.total_projets ?? 0, "projets"],
                  [stats.data?.competences.length ?? 0, "compétences"],
                  [candidat.data.experiences.length, "expériences"],
                ].map(([n, label]) => (
                  <div key={label} className="glass rounded-2xl p-4">
                    <p className="holo-text font-display text-3xl font-bold">{n}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </header>

          <Section title="Parcours">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h3 className="mb-4 flex items-center gap-2 font-mono text-xs font-normal uppercase tracking-[0.25em] text-glow">
                  <span className="h-2 w-2 rounded-full bg-glow shadow-[0_0_10px_#f0abfc]" />
                  Parcours professionnel
                </h3>
                {parcoursPro.length > 0 ? (
                  <Timeline items={parcoursPro} accent="pro" />
                ) : (
                  <Empty>Aucune expérience professionnelle renseignée.</Empty>
                )}
              </div>
              <div>
                <h3 className="mb-4 flex items-center gap-2 font-mono text-xs font-normal uppercase tracking-[0.25em] text-ice">
                  <span className="h-2 w-2 rounded-full bg-ice shadow-[0_0_10px_#7dd3fc]" />
                  Parcours académique
                </h3>
                {parcoursAcad.length > 0 ? (
                  <Timeline items={parcoursAcad} accent="academique" />
                ) : (
                  <Empty>Aucune formation renseignée.</Empty>
                )}
              </div>
            </div>
          </Section>

          <Section title="Compétences">
            <QueryState isLoading={stats.isLoading} error={stats.error}>
              {stats.data && stats.data.competences.length > 0 ? (
                <>
                  <p className="mb-3 text-sm text-slate-300">
                    {stats.data.total_projets} projet{stats.data.total_projets > 1 ? "s" : ""} au total.
                  </p>
                  <SkillBars competences={stats.data.competences} />
                </>
              ) : (
                <Empty>Aucune compétence utilisée dans les projets.</Empty>
              )}
            </QueryState>
          </Section>

          <Section title="Projets">
            <div className="mb-4 flex items-center gap-2 text-sm">
              <label htmlFor="filtre">Filtrer par compétence :</label>
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
            </div>
            <QueryState isLoading={projets.isLoading} error={projets.error}>
              {projets.data && projets.data.items.length === 0 ? (
                <Empty>Aucun projet.</Empty>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projets.data?.items.map((p) => <ProjetCard key={p.projet_slug} projet={p} />)}
                  </div>
                  {projets.data && (
                    <Pagination
                      page={projets.data.page}
                      size={projets.data.size}
                      total={projets.data.total}
                      onChange={setPage}
                    />
                  )}
                </>
              )}
            </QueryState>
          </Section>

          <Section title="Me contacter">
            <div className="glass rounded-2xl p-6">
              <p className="mb-4 text-lg text-slate-300">
                Une question, une opportunité, envie d'échanger sur la data ? Écris-moi.
              </p>
              <div className="flex flex-wrap gap-3">
                {hasCv && (
                  <a
                    href="/cv.pdf"
                    download="CV-Fernande-Kedi-Eloundou.pdf"
                    className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-medium text-white no-underline transition hover:text-white hover:shadow-[0_0_28px_rgba(217,70,239,0.6)]"
                  >
                    ↓ Télécharger mon CV
                  </a>
                )}
                <ContactLinks liens={candidat.data.liens} />
              </div>
            </div>
          </Section>
        </>
      )}
    </QueryState>
  );
}
