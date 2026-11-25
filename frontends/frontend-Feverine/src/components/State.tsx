import type { ReactNode } from "react";

/** Affiche chargement / erreur, puis le contenu quand les données sont prêtes. */
export function QueryState({
  isLoading,
  error,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  children: ReactNode;
}) {
  if (isLoading) return <p className="font-mono text-sm text-slate-400">Chargement…</p>;
  if (error) {
    return (
      <div className="rounded-xl border border-red-400/50 bg-red-500/10 p-4 text-red-200">
        {error instanceof Error ? error.message : String(error)}
      </div>
    );
  }
  return <>{children}</>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-neon/30 p-6 text-center text-slate-400">{children}</p>;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="mb-6 flex items-center gap-4 text-xl font-semibold sm:text-2xl">
        <span className="text-glow">✦</span>
        {title}
        <span className="h-px flex-1 bg-gradient-to-r from-neon/60 to-transparent" />
      </h2>
      {children}
    </section>
  );
}