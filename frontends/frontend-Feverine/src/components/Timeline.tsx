import type { TimelineItem } from "../types";
import { periode } from "./Chips";

/** Liste numérotée façon « tracklist » (R1). accent : rose = parcours pro, bleu glace = parcours académique. */
export default function Timeline({ items, accent }: { items: TimelineItem[]; accent: "pro" | "academique" }) {
  const bord = accent === "pro" ? "border-l-glow" : "border-l-ice";
  return (
    <ol className="space-y-4">
      {items.map((it, i) => (
        <li key={i} className={`glass flex items-start gap-5 rounded-2xl border-l-4 p-5 ${bord}`}>
          <span className="holo-text w-14 shrink-0 font-display text-3xl font-bold">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-xs text-slate-400">{periode(it.debut, it.fin)}</p>
            <h4 className="mt-1 text-lg font-semibold">{it.titre}</h4>
            <p className="font-medium text-slate-300">{it.organisation}</p>
            {it.description && <p className="mt-2 text-sm text-slate-400">{it.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}