import { Link } from "react-router-dom";

/** Liste de compétences cliquables (→ page compétence : candidats, projets, graphe). */
export function SkillChips({ slugs }: { slugs: string[] }) {
  if (slugs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {slugs.map((s) => (
        <Link
          key={s}
          to={`/competences/${s}`}
          className="rounded-full border border-neon/40 bg-neon/10 px-2.5 py-0.5 text-xs font-medium text-neon no-underline transition hover:bg-neon hover:text-night hover:shadow-[0_0_14px_rgba(167,139,250,0.7)]"
        >
          {s}
        </Link>
      ))}
    </div>
  );
}

/** Formate une date AAAA-MM (ou null). */
export function periode(debut: string | null, fin: string | null): string {
  if (!debut && !fin) return "";
  return `${debut ?? "?"} → ${fin ?? "aujourd'hui"}`;
}