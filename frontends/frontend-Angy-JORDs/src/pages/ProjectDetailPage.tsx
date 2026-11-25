import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Github,
  Target,
  GitBranch,
  CheckCircle2,
  BarChart3,
  Network,
} from 'lucide-react';
import { portfolioApi } from '../services/api';
import { Projet, SimilarProjet } from '../types/portfolio';

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [projet, setProjet] = useState<Projet | undefined>(undefined);
  const [similaires, setSimilaires] = useState<SimilarProjet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  let active = true;

  async function fetchDetail() {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [projResult, simResult] = await Promise.allSettled([
        portfolioApi.getProjetBySlug(slug),
        portfolioApi.getSimilarProjets(slug),
      ]);

      if (!active) return;

      // Récupération du projet
      if (projResult.status === 'fulfilled') {
        setProjet(projResult.value);
      } else {
        console.error(
          'Erreur récupération projet :',
          projResult.reason
        );
        setProjet(undefined);
      }

      // Récupération des projets similaires
      if (simResult.status === 'fulfilled') {
        setSimilaires(simResult.value ?? []);
      } else {
        console.error(
          'Erreur récupération projets similaires :',
          simResult.reason
        );
        setSimilaires([]);
      }

    } catch (error) {
      console.error('Erreur chargement page projet :', error);
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  fetchDetail();

  return () => {
    active = false;
  };
}, [slug]);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-slate-500">
        Chargement de l’étude de cas depuis MongoDB &amp; Neo4j...
      </div>
    );
  }

  if (!projet) {
    return (
      <div className="py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">Projet introuvable</h1>
        <Link to="/projets" className="text-electric-500 hover:underline">
          ← Retour à la galerie des projets
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <Link
        to="/projets"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-electric-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la galerie des projets
      </Link>

      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="px-3.5 py-1 rounded-full text-xs font-mono font-semibold bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20">
            {projet.categorie}
          </span>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Période : {projet.date_debut} → {projet.date_fin}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          {projet.titre}
        </h1>
        <p className="text-sm font-mono text-electric-600 dark:text-electric-400">{projet.contexte}</p>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          {projet.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          {projet.liens.github && (
            <a
              href={projet.liens.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-slate-900 dark:bg-electric-600 hover:opacity-90 transition-opacity"
            >
              <Github className="w-4 h-4" /> Voir le dépôt GitHub
            </a>
          )}
        </div>
      </div>

      {/* Metrics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(projet.metriques).map(([k, v]) => (
          <div key={k} className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-500 dark:text-slate-400">
              <BarChart3 className="w-4 h-4 text-cyber-cyan" />
              <span>{k.replace('_', ' ')}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{v}</p>
          </div>
        ))}
      </div>

      {/* Problematique & Methodologie */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-cyber-violet" /> Problématique
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{projet.problematique}</p>
          </div>

          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-electric-500" /> Méthodologie &amp; Pipeline
            </h2>
            <ol className="space-y-3">
              {projet.methodologie.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  <span className="w-6 h-6 rounded-full bg-electric-500/15 text-electric-600 dark:text-cyber-cyan font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Results & Stack */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyber-emerald" /> Résultats &amp; Impact
            </h2>
            <ul className="space-y-3">
              {projet.resultats.map((res, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-emerald mt-2 shrink-0" />
                  <span>{res}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Technologies mobilisées</h3>
            <div className="flex flex-wrap gap-2">
              {projet.competences.map((c) => (
                <span
                  key={c}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono bg-electric-500/10 text-electric-600 dark:text-cyber-cyan border border-electric-500/20"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Neo4j Similar Projects */}
          {similaires.length > 0 && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4 border-cyber-violet/30">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-cyber-violet" /> Projets Similaires
                </h3>
                <span className="text-[11px] font-mono text-cyber-violet">Graphe Neo4j</span>
              </div>
              <div className="space-y-3">
                {similaires.map((sim) => (
                  <Link
                    key={sim.projet_slug}
                    to={`/projets/${sim.projet_slug}`}
                    className="block p-3.5 rounded-2xl bg-slate-100/80 dark:bg-midnight-950/70 hover:border-cyber-violet border border-transparent transition-all"
                  >
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{sim.titre}</p>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                      {sim.competences_communes} compétence(s) commune(s) : {sim.competences.join(', ')}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
