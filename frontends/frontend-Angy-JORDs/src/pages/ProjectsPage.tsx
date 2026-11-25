import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Filter, Github, Sparkles, BarChart2, X, ArrowUpRight } from 'lucide-react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Competence, Projet } from '../types/portfolio';
import { resolveSkill, skillMatches } from '../services/skillLinks';

interface ProjectsPageProps {
  projets: Projet[];
  /** Nécessaire pour relier chaque tag à sa fiche compétence */
  competences?: Competence[];
}

const CATEGORIES = ['Tous', 'Big Data & Engineering', 'Data Science & ML', 'Business Intelligence'];

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ projets, competences = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [searchParams, setSearchParams] = useSearchParams();

  // Filtre par compétence : /projets?skill=pyspark (lien depuis la page Compétences)
  const skillParam = searchParams.get('skill');
  const activeSkill = useMemo(
    () => (skillParam ? competences.find((c) => c.skill_slug === skillParam) : undefined),
    [skillParam, competences]
  );

  const filtered = projets.filter((p) => {
    const okCat = selectedCategory === 'Tous' || p.categorie === selectedCategory;
    const okSkill = !activeSkill || p.competences.some((tag) => skillMatches(tag, activeSkill));
    return okCat && okSkill;
  });

  return (
    <div className="space-y-12">
      <SectionHeader
        badge="Galerie de Réalisations"
        title="Projets Data Science, Big Data & BI"
        subtitle="Chaque projet présente la problématique métier, la méthodologie scientifique, l'architecture technique et les résultats quantifiés."
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 mr-2">
          <Filter className="w-3.5 h-3.5 text-cyber-cyan" /> Filtrer :
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-electric-600 to-cyber-violet text-white shadow-md'
                : 'glass-card text-slate-700 dark:text-slate-300 hover:border-cyber-cyan'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bandeau du filtre compétence actif */}
      {activeSkill && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl glass-card border border-cyber-cyan/30 text-sm">
          <span className="text-slate-600 dark:text-slate-300">
            Projets utilisant <strong className="text-cyber-cyan">{activeSkill.nom}</strong>
            <span className="text-slate-500"> · {filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
          </span>
          <Link
            to={`/competences?skill=${activeSkill.skill_slug}`}
            className="inline-flex items-center gap-1 text-xs font-mono text-cyber-cyan hover:underline"
          >
            Voir la compétence <ArrowUpRight className="w-3 h-3" />
          </Link>
          <button
            onClick={() => setSearchParams({}, { replace: true })}
            className="ml-auto inline-flex items-center gap-1 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-3.5 h-3.5" /> Retirer le filtre
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-slate-500 dark:text-slate-400 py-12">
          Aucun projet ne correspond à ces filtres.
        </p>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filtered.map((projet, idx) => (
          <motion.article
            key={projet.projet_slug}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-electric-500/50 transition-all group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20">
                  {projet.categorie}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {projet.date_debut} → {projet.date_fin}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-electric-500 dark:group-hover:text-cyber-cyan transition-colors">
                {projet.titre}
              </h2>

              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{projet.contexte}</p>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{projet.description}</p>

              {/* Metrics Highlight Box */}
              <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-midnight-950/75 border border-slate-200/70 dark:border-slate-800">
                <p className="text-xs font-mono uppercase text-cyber-violet mb-2 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5" /> Métriques &amp; Résultats Clés
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(projet.metriques).map(([key, val]) => (
                    <div key={key} className="text-xs">
                      <span className="text-slate-500 dark:text-slate-400 block capitalize">
                        {key.replace('_', ' ')}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stack tags : cliquables quand une fiche compétence existe */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {projet.competences.map((tag) => {
                  const skill = resolveSkill(tag, competences);
                  const isActive = activeSkill && skill?.skill_slug === activeSkill.skill_slug;
                  if (skill) {
                    return (
                      <Link
                        key={tag}
                        to={`/competences?skill=${skill.skill_slug}`}
                        title={`Voir la compétence ${skill.nom}`}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors ${
                          isActive
                            ? 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/60'
                            : 'bg-electric-500/10 text-electric-600 dark:text-electric-400 border-transparent hover:border-electric-500/50 hover:bg-electric-500/20'
                        }`}
                      >
                        #{tag}
                      </Link>
                    );
                  }
                  return (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-500/10 text-slate-500 dark:text-slate-400"
                    >
                      #{tag}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
              {projet.liens.github && (
                <a
                  href={projet.liens.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-300 hover:text-electric-500"
                >
                  <Github className="w-4 h-4" /> Code Source GitHub
                </a>
              )}

              <Link
                to={`/projets/${projet.projet_slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-electric-600 hover:bg-electric-500 transition-colors"
              >
                <Sparkles className="w-4 h-4" /> Étude de cas complète
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
};
