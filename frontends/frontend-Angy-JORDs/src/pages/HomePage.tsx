import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, Database, BarChart3, Sparkles, MapPin, Github, Linkedin, Code2 } from 'lucide-react';
import { CandidatProfile, Projet } from '../types/portfolio';
import { DataNetworkBackground } from '../components/ui/DataNetworkBackground';

interface HomePageProps {
  candidat: CandidatProfile;
  projets: Projet[];
}

export const HomePage: React.FC<HomePageProps> = ({ candidat, projets }) => {
  const highlights = [
    { icon: BrainCircuit, title: 'Data Science & IA', desc: 'Modélisation prédictive, Scikit-learn, Pandas, optimisation R² & F1-Score.', accent: 'from-electric-500 to-cyber-violet' },
    { icon: Database, title: 'Big Data', desc: 'Traitement distribué sous PySpark, Hadoop, pipelines massifs.', accent: 'from-cyber-cyan to-electric-500' },
    { icon: BarChart3, title: 'BI & Analytics', desc: 'Tableaux de bord Power BI (DAX), indicateurs de performance, reporting.', accent: 'from-cyber-violet to-pink-500' },
    { icon: Code2, title: 'No Code / Low Code', desc: 'Applications métier via Power Apps, déploiement d’Agents IA.', accent: 'from-pink-500 to-amber-500' }
  ];

  const stats = [
    { value: String(projets.length), label: 'Projets Data & IA' },
    { value: String(highlights.length), label: "Domaines d'expertise" },
    { value: '4e année', label: 'Cycle ingénieur' },
  ];

  const recent = projets.slice(0, 3);

  return (
    <div className="space-y-20">
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-midnight-950/80">
        <DataNetworkBackground className="absolute inset-0 w-full h-full" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 px-6 sm:px-12 pt-14 sm:pt-20 pb-12 max-w-2xl space-y-7"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-slate-100/70 dark:bg-midnight-800/70 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>ESIGELEC Rouen · Spécialisation Big Data & IA (BDTN)</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.05]">
              Ange TONLIO
            </h1>
            <p className="inline-flex items-center gap-1.5 text-sm font-mono text-slate-500 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-cyber-cyan" /> Rouen, Normandie
            </p>
          </div>

          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Élève-ingénieur en 4e année. Je conçois des pipelines Big Data, des modèles de Machine Learning et des
            solutions BI & IA à fort impact métier.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/projets"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-electric-600 hover:bg-electric-500 shadow-lg shadow-electric-600/20 transition-colors"
            >
              Explorer mes projets <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/competences"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold glass-card text-slate-800 dark:text-slate-100 hover:border-cyber-cyan transition-colors"
            >
              Mes compétences
            </Link>
            <div className="flex items-center gap-2 sm:ml-1">
              <a
                href={candidat.liens.github}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="p-3 rounded-xl glass-card text-slate-700 dark:text-slate-200 hover:text-electric-500 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href={candidat.liens.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="p-3 rounded-xl glass-card text-slate-700 dark:text-slate-200 hover:text-electric-500 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Bandeau de chiffres clés */}
        <div className="relative z-10 grid grid-cols-3 border-t border-slate-200/70 dark:border-slate-800 bg-white/50 dark:bg-midnight-950/60 backdrop-blur-sm">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`px-4 sm:px-12 py-5 ${i > 0 ? 'border-l border-slate-200/70 dark:border-slate-800' : ''}`}
            >
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Domaines d'expertise ---------------- */}
      <section>
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyber-cyan">Domaines d'expertise</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Quatre piliers au service de la donnée
            </h2>
          </div>
          <Link
            to="/competences"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-electric-600 dark:text-cyber-cyan hover:underline"
          >
            Cartographie des compétences <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="glass-card rounded-2xl p-6 hover:border-electric-500/40 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center text-electric-600 dark:text-cyber-cyan mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ---------------- Réalisations récentes ---------------- */}
      {recent.length > 0 && (
        <section>
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyber-cyan">Réalisations</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">Projets récents</h2>
            </div>
            <Link
              to="/projets"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-electric-600 dark:text-cyber-cyan hover:underline"
            >
              Tous les projets <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recent.map((p, idx) => (
              <motion.div
                key={p.projet_slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
              >
                <Link
                  to={`/projets/${p.projet_slug}`}
                  className="glass-card rounded-2xl p-6 h-full flex flex-col justify-between gap-5 group hover:border-electric-500/40 transition-colors"
                >
                  <div className="space-y-3">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20">
                      {p.categorie}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-electric-500 dark:group-hover:text-cyber-cyan transition-colors">
                      {p.titre}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{p.contexte}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-electric-600 dark:text-cyber-cyan">
                    Étude de cas <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- Contact ---------------- */}
      <section className="glass-card rounded-3xl px-6 sm:px-12 py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Un projet data, une opportunité ?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Discutons de la façon dont la donnée et l'IA peuvent répondre à vos besoins.
          </p>
        </div>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-electric-600 hover:bg-electric-500 transition-colors shrink-0"
        >
          Me contacter <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
};
