import { Link } from "react-router-dom";
import type { Projet } from "../types";
import { SkillChips, periode } from "./Chips";

/** Pochette « album » : dégradé violet → rose propre à chaque projet (calculé depuis son slug). */
function cover(slug: string): string {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % 360;
  const a = 255 + (h % 70);
  return `linear-gradient(135deg, hsl(${a} 75% 28%), hsl(${a + 55} 85% 55%))`;
}

export default function ProjetCard({ projet }: { projet: Projet }) {
  const dates = periode(projet.date_debut, projet.date_fin);
  return (
    <article className="glass group flex flex-col overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:border-neon/60 hover:shadow-[0_0_35px_rgba(167,139,250,0.35)]">
      {projet.images[0] ? (
        <img src={projet.images[0]} alt={projet.titre} className="h-32 w-full object-cover" loading="lazy" />
      ) : (
        <div className="relative h-32 overflow-hidden" style={{ background: cover(projet.projet_slug) }}>
          <div className="absolute -bottom-8 -right-8 flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/20 bg-black/30 transition group-hover:rotate-90">
            <span className="h-3 w-3 rounded-full bg-white/70" />
          </div>
          <span className="absolute left-4 top-3 text-white/80">✦</span>
          <p className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-widest text-white/80">
            {projet.contexte ?? "Projet"}
          </p>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold leading-snug">
          <Link to={`/projets/${projet.projet_slug}`} className="text-white no-underline hover:text-glow">
            {projet.titre}
          </Link>
        </h3>
        {dates && <p className="mt-1 font-mono text-xs text-slate-500">{dates}</p>}
        {projet.description && <p className="mt-3 line-clamp-3 text-sm text-slate-300">{projet.description}</p>}
        <div className="mt-auto pt-4">
          <SkillChips slugs={projet.competences} />
        </div>
      </div>
    </article>
  );
}