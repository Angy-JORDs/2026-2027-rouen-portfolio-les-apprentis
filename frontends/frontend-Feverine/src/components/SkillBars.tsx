import { Link } from "react-router-dom";
import type { StatCompetence } from "../types";

/** Statistiques par compétence (R3) : barres = nombre de projets qui utilisent la compétence. */
export default function SkillBars({ competences }: { competences: StatCompetence[] }) {
  const max = Math.max(1, ...competences.map((c) => c.nombre_projets));
  return (
    <ul className="glass space-y-3 rounded-2xl p-5">
      {competences.map((c) => (
        <li key={c.skill_slug} className="flex items-center gap-3 text-sm">
          <Link to={`/competences/${c.skill_slug}`} className="w-36 shrink-0 truncate font-medium no-underline">
            {c.nom}
          </Link>
          <div className="h-2 flex-1 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-neon via-glow to-ice shadow-[0_0_12px_rgba(167,139,250,0.8)]"
              style={{ width: `${(c.nombre_projets / max) * 100}%` }}
            />
          </div>
          <span className="w-20 shrink-0 text-right font-mono text-xs text-slate-400">
            {c.nombre_projets} projet{c.nombre_projets > 1 ? "s" : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}