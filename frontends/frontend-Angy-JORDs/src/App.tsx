import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { SkillsPage } from './pages/SkillsPage';
import { ExperiencesPage } from './pages/ExperiencesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { EducationPage } from './pages/EducationPage';
import { ContactPage } from './pages/ContactPage';
import { usePortfolioData } from './hooks/usePortfolioData';

export function App() {
  const { candidat, projets, stats, graph, dataSource, dbHealth, apiError } = usePortfolioData();

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-offwhite dark:bg-midnight-950 bg-data-grid text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <><Navbar dataSource={dataSource} />
        {dataSource === 'api' && dbHealth && <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8"><div className="text-xs flex flex-wrap gap-3 py-2 text-slate-500"><span>API : connectée</span><span>MongoDB : {dbHealth.mongo}</span><span>Neo4j : {dbHealth.neo4j}</span></div></div>}
        {dataSource === 'local' && apiError && <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8"><p className="text-xs text-amber-600 dark:text-amber-400 py-2">Mode local : API indisponible ({apiError}). Les données affichées sont les données de secours.</p></div>}</>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Routes>
            <Route path="/" element={<HomePage candidat={candidat} projets={projets} />} />
            <Route path="/a-propos" element={<AboutPage candidat={candidat} />} />
            <Route
              path="/competences"
              element={<SkillsPage competences={candidat.competences} stats={stats} graph={graph} projets={projets} experiences={candidat.experiences} />}
            />
            <Route
              path="/experiences"
              element={<ExperiencesPage experiences={candidat.experiences} />}
            />
            <Route path="/projets" element={<ProjectsPage projets={projets} />} />
            <Route path="/projets/:slug" element={<ProjectDetailPage />} />
            <Route path="/formation" element={<EducationPage candidat={candidat} />} />
            <Route path="/contact" element={<ContactPage candidat={candidat} />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
