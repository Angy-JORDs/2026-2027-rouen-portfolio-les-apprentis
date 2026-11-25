import React from 'react';
import { motion } from 'framer-motion';
import { Target, UserCheck, Globe2, Heart, Compass, Car, Sparkles } from 'lucide-react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CandidatProfile } from '../types/portfolio';

interface AboutPageProps {
  candidat: CandidatProfile;
}

export const AboutPage: React.FC<AboutPageProps> = ({ candidat }) => {
  return (
    <div className="space-y-12">
      <SectionHeader
        badge="Profil & Identité"
        title="À propos de mon parcours et de ma vision"
        subtitle="De la rigueur des classes préparatoires scientifiques MPSI à l'ingénierie Big Data & IA à l'ESIGELEC Rouen."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Narrative */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-card rounded-3xl p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric-500/15 text-electric-500 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Parcours Académique &amp; Projet Professionnel
            </h2>
          </div>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Actuellement élève-ingénieur en 4e année à l’<strong>ESIGELEC Rouen</strong> au sein de la dominante{' '}
            <span className="text-electric-600 dark:text-cyber-cyan font-semibold">
              Big Data pour la Transformation Numérique (BDTN)
            </span>
            , j’ai construit mon socle scientifique en classes préparatoires <strong>MPSI</strong> à l’Institut PrépaVogt (Yaoundé), où j’ai développé une solide maîtrise de l’algorithmique, des statistiques et de l’algèbre linéaire.
          </p>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Mes expériences en entreprise — notamment chez <strong>Thales</strong> (développement décisionnel Power BI/Power Apps et conception d’un agent IA métier) et au sein du <strong>Groupe SOMAF SA</strong> (modélisation de données et analyse de tendances de consommation) — m’ont permis de relier directement l’ingénierie des données aux enjeux opérationnels des décideurs.
          </p>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-electric-500/10 via-cyber-violet/10 to-cyber-cyan/10 border border-electric-500/20">
            <div className="flex items-center gap-2 text-electric-600 dark:text-cyber-cyan font-semibold mb-2">
              <Target className="w-5 h-5" />
              <span>Objectif Alternance — Octobre 2026</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Je recherche un contrat d’apprentissage de <strong>12 mois à partir d’octobre 2026</strong> (rythme <strong>1 mois en entreprise / 1 mois à l’école</strong>) sur des missions de <strong>Data Scientist</strong> ou <strong>Data Analyst</strong>, afin de contribuer à des projets de modélisation prédictive, d’industrialisation de pipelines data et d’intégration de solutions IA.
            </p>
          </div>
        </motion.div>

        {/* Quick Info & Languages */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold">
              <Globe2 className="w-5 h-5 text-cyber-cyan" />
              <h3>Langues &amp; Mobilité</h3>
            </div>
            <div className="space-y-3">
              {candidat.langues.map((l) => (
                <div
                  key={l.langue}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-100/80 dark:bg-midnight-950/70"
                >
                  <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{l.langue}</span>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-electric-500/10 text-electric-600 dark:text-cyber-cyan">
                    {l.niveau}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
              <Car className="w-4 h-4 text-cyber-violet" />
              <span>Titulaire du {candidat.permis} · Mobile France entière</span>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold">
              <Heart className="w-5 h-5 text-rose-500" />
              <h3>Centres d’intérêt</h3>
            </div>
            <div className="space-y-3">
              {candidat.centresInteret.map((ci) => (
                <div key={ci.nom} className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-midnight-950/70">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{ci.nom}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{ci.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Soft Skills */}
      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyber-violet/15 text-cyber-violet flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Savoir-être &amp; Méthodologie</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Compétences transversales mobilisées en équipe projet</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidat.softSkills.map((skill) => (
            <div
              key={skill}
              className="flex items-center gap-3 p-4 rounded-2xl bg-slate-100/80 dark:bg-midnight-950/70 border border-slate-200/60 dark:border-slate-800"
            >
              <Sparkles className="w-4 h-4 text-cyber-cyan shrink-0" />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{skill}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
