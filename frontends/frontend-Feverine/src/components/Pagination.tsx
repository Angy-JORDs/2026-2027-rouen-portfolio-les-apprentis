export default function Pagination({
  page,
  size,
  total,
  onChange,
}: {
  page: number;
  size: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  const btn = "rounded-full border border-neon/40 bg-panel px-4 py-1 text-sm text-slate-200 hover:bg-neon/20 disabled:opacity-40";
  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Précédent
      </button>
      <span className="text-sm text-slate-300">
        Page {page} / {pages}
      </span>
      <button className={btn} disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Suivant
      </button>
    </div>
  );
}