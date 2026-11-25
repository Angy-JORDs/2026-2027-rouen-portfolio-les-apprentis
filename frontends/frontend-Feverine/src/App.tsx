import { Link, NavLink, Route, Routes } from "react-router-dom";
import { CANDIDAT_SLUG } from "./config";
import { useMonProfil } from "./hooks";
import CandidatPage from "./pages/CandidatPage";
import ProjetsPage from "./pages/ProjetsPage";
import ProjetPage from "./pages/ProjetPage";
import CompetencePage from "./pages/CompetencePage";
import GraphePage from "./pages/GraphePage";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-1.5 text-sm font-medium no-underline transition ${
    isActive
      ? "bg-neon/20 text-white ring-1 ring-neon/60 shadow-[0_0_18px_rgba(167,139,250,0.45)] hover:text-white"
      : "text-slate-400 hover:text-white"
  }`;

function MissingConfig() {
  return (
    <div className="mx-auto mt-16 max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-6 text-amber-900">
      <h1 className="mb-2 text-xl font-bold">Candidat non configuré</h1>
      <p className="mb-2">
        Crée un fichier <code>.env</code> dans le dossier du frontend (copie <code>.env.example</code>) avec :
      </p>
      <pre className="rounded bg-white p-2 text-sm">VITE_CANDIDAT_SLUG=ton-candidat-slug</pre>
      <p className="mt-2 text-sm">
        C'est le <code>candidat_slug</code> de ton fichier <code>data/candidats/&lt;pseudo&gt;.json</code>. Relance ensuite{" "}
        <code>npm run dev</code>.
      </p>
    </div>
  );
}

export default function App() {
  const profil = useMonProfil();
  if (!CANDIDAT_SLUG) return <MissingConfig />;

  const nom = profil.data ? `${profil.data.prenom} ${profil.data.nom}` : "Portfolio";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-neon/20 bg-night/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="font-display text-sm font-semibold text-white no-underline hover:text-glow sm:text-base">
            <span className="mr-2 text-glow">✦</span>
            {nom}
          </Link>
          <nav className="flex gap-2">
            <NavLink to="/" end className={navClass}>
              Profil &amp; parcours
            </NavLink>
            <NavLink to="/projets" className={navClass}>
              Projets
            </NavLink>
            <NavLink to="/graphe" className={navClass}>
              Graphe
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <Routes>
          <Route path="/" element={<CandidatPage />} />
          <Route path="/projets" element={<ProjetsPage />} />
          <Route path="/projets/:slug" element={<ProjetPage />} />
          <Route path="/competences/:slug" element={<CompetencePage />} />
          <Route path="/graphe" element={<GraphePage />} />
          <Route path="/graphe/:slug" element={<GraphePage />} />
          <Route path="*" element={<p>Page introuvable.</p>} />
        </Routes>
      </main>
    </div>
  );
}
