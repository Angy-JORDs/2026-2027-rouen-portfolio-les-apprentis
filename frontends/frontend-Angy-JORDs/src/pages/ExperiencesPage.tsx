import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, MapPin, ChevronDown, ChevronUp, Cpu, ArrowUpRight } from 'lucide-react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Competence, Experience } from '../types/portfolio';
import { expSlug, resolveSkill } from '../services/skillLinks';

interface ExperiencesPageProps {
  experiences: Experience[];
  /** Nécessaire pour relier chaque techno à sa fiche compétence */
  competences?: Competence[];
  /** ex: (slug) => navigate(`/competences?skill=${slug}`) */
  onOpenSkill?: (slug: string) => void;
}

export const ExperiencesPage: React.FC<ExperiencesPageProps> = ({
  experiences,
  competences = [],
  onOpenSkill,
}) => {
  // Deep link : /experiences?exp=<slug> ouvre directement l'expérience
  const [expandedIdx, setExpandedIdx] = useState<number>(() => {
    const wanted = new URLSearchParams(window.location.search).get('exp');
    const found = wanted ? experiences.findIndex((e) => expSlug(e) === wanted) : -1;
    return found >= 0 ? found : 0;
  });

  useEffect(() => {
    const exp = experiences[expandedIdx];
    window.history.replaceState(null, '', exp ? `?exp=${expSlug(exp)}` : window.location.pathname);
  }, [expandedIdx, experiences]);

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('exp');
    if (wanted) {
      setTimeout(
        () => document.getElementById(`exp-${wanted}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        300
      );
    }
  }, []);

  const openSkill = (e: React.MouseEvent, slug: string) => {
    if (onOpenSkill) {
      e.preventDefault();
      onOpenSkill(slug);
    }
  };

  return (
    <div className="space-y-12">
      <SectionHeader
        badge="Parcours Professionnel"
        title="Expériences en Entreprise"
        subtitle="Timeline interactive de mes stages en Business Intelligence, Data Analysis et déploiement d'Agents IA."
      />

      <div className="relative pl-6 sm:pl-10 border-l-2 border-electric-500/30 space-y-8">
        {experiences.map((exp, idx) => {
          const isExpanded = expandedIdx === idx;
          return (
            <motion.div
              id={`exp-${expSlug(exp)}`}
              key={`${exp.entreprise}-${exp.debut}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.12 }}
              className="relative"
            >
              {/* Timeline Node */}
              <span className="absolute -left-[33px] sm:-left-[49px] top-6 w-4 h-4 rounded-full bg-gradient-to-r from-electric-500 to-cyber-cyan ring-4 ring-offwhite dark:ring-midnight-950" />

              <div
                className={`glass-card rounded-3xl p-6 sm:p-8 transition-all ${
                  isExpanded ? 'border-electric-500/40' : 'hover:border-electric-500/40'
                }`}
              >
                <div
                  onClick={() => setExpandedIdx(isExpanded ? -1 : idx)}
                  className="cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-electric-500/10 text-electric-600 dark:text-cyber-cyan">
                        {exp.entreprise}
                      </span>
                      {exp.type && (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-cyber-violet/10 text-cyber-violet">
                          {exp.type}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-electric-500 shrink-0" />
                      {exp.poste}
                    </h2>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                    <div className="space-y-1 text-left md:text-right">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cyber-cyan" />
                        <span>
                          {exp.debut} → {exp.fin || 'Présent'}
                        </span>
                      </div>
                      {exp.lieu && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyber-violet" />
                          <span>{exp.lieu}</span>
                        </div>
                      )}
                    </div>
                    <button
                      aria-label="Afficher ou masquer les détails"
                      aria-expanded={isExpanded}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-midnight-800 text-slate-700 dark:text-slate-200"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-6 border-t border-slate-200/70 dark:border-slate-800 space-y-5"
                  >
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{exp.description}</p>

                    <div>
                      <p className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-cyber-cyan" />
                        Technologies &amp; Outils mobilisés
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {exp.competences.map((comp) => {
                          const skill = resolveSkill(comp, competences);
                          // Techno reconnue → lien vers sa fiche compétence
                          if (skill) {
                            return (
                              <a
                                key={comp}
                                href={`/competences?skill=${skill.skill_slug}`}
                                onClick={(e) => openSkill(e, skill.skill_slug)}
                                title={`Voir la compétence ${skill.nom}`}
                                className="group inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono bg-cyber-cyan/10 text-cyan-600 dark:text-cyan-300 border border-cyber-cyan/30 hover:bg-cyber-cyan/20 hover:border-cyber-cyan/60 transition-colors"
                              >
                                {comp}
                                <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                              </a>
                            );
                          }
                          // Techno sans fiche → simple badge
                          return (
                            <span
                              key={comp}
                              className="px-3 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-midnight-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700"
                            >
                              {comp}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
