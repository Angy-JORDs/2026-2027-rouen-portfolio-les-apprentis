import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import {
  ArrowRight, BrainCircuit, Database, BarChart3, Sparkles, Github, Linkedin,
  Code2, Activity, Gauge, Trophy, Flag,
} from 'lucide-react';
import { CandidatProfile, Projet } from '../types/portfolio';
import { DataObservatoryBackground } from '../components/ui/DataObservatoryBackground';

interface HomePageProps {
  candidat: CandidatProfile;
  projets: Projet[];
}

const STACK = ['Python', 'PySpark', 'SQL', 'Power BI', 'Scikit-learn', 'Neo4j'];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

export const HomePage: React.FC<HomePageProps> = ({ candidat, projets }) => {
  const reduce = useReducedMotion();

  const highlights = [
    { icon: BrainCircuit, title: 'Data Science & IA', desc: 'Modélisation prédictive, Scikit-learn, Pandas, optimisation R² & F1-Score.', to: '/competences?domaine=ia-ml' },
    { icon: Database, title: 'Big Data', desc: 'Traitement distribué sous PySpark, Hadoop et conception de pipelines.', to: '/competences?domaine=big-data' },
    { icon: BarChart3, title: 'BI & Analytics', desc: 'Tableaux de bord Power BI, indicateurs de performance et reporting.', to: '/competences?domaine=bi-visualisation' },
    { icon: Code2, title: 'No Code / Low Code', desc: 'Applications métier via Power Apps et automatisation intelligente.', to: '/competences' },
  ];

  const strong = 'font-semibold text-white';

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* HERO */}
      <section className="relative isolate min-h-[650px] lg:min-h-[690px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#070914] shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <DataObservatoryBackground className="absolute inset-0 h-full w-full" />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070914] via-[#070914]/95 to-[#070914]/25" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />

        <div className="relative z-10 flex min-h-[650px] flex-col justify-center px-6 py-14 sm:px-10 lg:min-h-[690px] lg:px-16">
          <motion.div
            variants={container}
            initial={reduce ? false : 'hidden'}
            animate="show"
            className="max-w-[670px]"
          >
            <motion.div
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/90 backdrop-blur-md sm:text-[11px]"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              ESIGELEC Rouen <span className="text-white/30">/</span> Big Data & IA
            </motion.div>

            <motion.div variants={item} className="mt-8">
              <p className="mb-1 text-4xl font-light tracking-tight text-slate-300 sm:text-5xl lg:text-6xl">Ange</p>
              <h1 className="text-6xl font-black leading-[0.88] tracking-[-0.065em] text-white sm:text-7xl lg:text-[6.8rem]">
                TONLIO<span className="text-cyan-300">.</span>
              </h1>
            </motion.div>

            <motion.p variants={item} className="mt-7 font-mono text-xs tracking-[0.13em] text-cyan-300 sm:text-sm">
              DATA ANALYSIS <span className="text-white/25">·</span> MACHINE LEARNING <span className="text-white/25">·</span> BIG DATA
            </motion.p>

            <motion.p variants={item} className="mt-5 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Élève-ingénieur en 4e année, je transforme les données en{' '}
              <span className={strong}>décisions concrètes</span> : pipelines Big Data,
              modèles de <span className={strong}>Machine Learning</span> et solutions
              de <span className={strong}>Business Intelligence</span>.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/projets"
                className="group inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-[#07101b] shadow-[0_8px_30px_rgba(34,211,238,0.2)] transition-all hover:-translate-y-0.5 hover:bg-cyan-200"
              >
                Découvrir mes projets
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/competences"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-cyan-300/50 hover:bg-white/[0.08]"
              >
                Explorer mes compétences
              </Link>
            </motion.div>

            <motion.div variants={item} className="mt-5 flex items-center gap-3">
              <a href={candidat.liens.github} target="_blank" rel="noreferrer" aria-label="GitHub"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:border-cyan-300/40 hover:text-cyan-200">
                <Github className="h-[18px] w-[18px]" />
              </a>
              <a href={candidat.liens.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:border-cyan-300/40 hover:text-cyan-200">
                <Linkedin className="h-[18px] w-[18px]" />
              </a>
              <span className="ml-1 h-5 w-px bg-white/15" />
              <span className="text-xs text-slate-400">{projets.length} projets présentés</span>
            </motion.div>

            <motion.div variants={item} className="mt-9 flex max-w-xl flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-5 font-mono text-[10px] text-slate-400 sm:text-[11px]">
              <span className="mr-1 uppercase tracking-[0.2em] text-slate-500">Stack</span>
              {STACK.map((tech, index) => (
                <React.Fragment key={tech}>
                  <span className="text-cyan-300/70">{tech}</span>
                  {index < STACK.length - 1 && <span className="text-white/20">/</span>}
                </React.Fragment>
              ))}
            </motion.div>
          </motion.div>

          {/* Signatures sport & data : éléments flottants, sans panneau statistique */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="pointer-events-none absolute bottom-7 right-7 hidden items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-slate-400 xl:flex"
          >
            <span className="flex items-center gap-2"><Trophy className="h-3.5 w-3.5 text-cyan-300" /> Football analytics</span>
            <span className="h-3 w-px bg-white/20" />
            <span className="flex items-center gap-2"><Gauge className="h-3.5 w-3.5 text-orange-300" /> Motorsport data</span>
            <span className="h-3 w-px bg-white/20" />
            <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-emerald-300" /> Performance</span>
          </motion.div>
        </div>
      </section>

      {/* EXPERTISE */}
      <section>
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-500 dark:text-cyan-300">Ce que je construis</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              La donnée au service de l'impact.
            </h2>
          </div>
          <Link to="/competences" className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 transition-colors hover:text-cyan-400 dark:text-cyan-300">
            Toutes mes compétences <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <motion.div
                key={highlight.title}
                initial={reduce ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.07, duration: 0.45 }}
              >
                <Link
                  to={highlight.to}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-950/5 dark:border-white/10 dark:bg-white/[0.025] dark:hover:bg-white/[0.045]"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">0{index + 1}</span>
                  </div>
                  <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white">{highlight.title}</h3>
                  <p className="flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{highlight.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-cyan-600 transition-all group-hover:gap-3 dark:text-cyan-300">
                    En savoir plus <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CONTACT */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-slate-50 px-6 py-8 dark:border-white/10 dark:bg-white/[0.025] sm:px-10">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">On échange ?</p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Un projet data, une idée ou une opportunité ?</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Je serais ravi de discuter de vos enjeux et de vos projets.</p>
          </div>
          <Link to="/contact" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300">
            Me contacter <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
