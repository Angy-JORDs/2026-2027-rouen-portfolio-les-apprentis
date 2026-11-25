import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Award, Calendar, BookOpen } from 'lucide-react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CandidatProfile } from '../types/portfolio';

interface EducationPageProps {
  candidat: CandidatProfile;
}

export const EducationPage: React.FC<EducationPageProps> = ({ candidat }) => {
  return (
    <div className="space-y-12">
      <SectionHeader
        badge="Cursus & Certifications"
        title="Formation Académique & MOOC"
        subtitle="Un parcours d'excellence combinant fondements mathématiques rigoureux (MPSI) et spécialisation d'ingénieur Big Data & IA."
      />

      {/* Formations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {candidat.formations.map((f, idx) => (
          <motion.div
            key={f.ecole}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card rounded-3xl p-6 sm:p-8 space-y-4 hover:border-electric-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-electric-500/15 text-electric-600 dark:text-cyber-cyan flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-midnight-800 text-slate-600 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-cyber-cyan" />
                {f.debut} → {f.fin}
              </span>
            </div>

            <div>
              <p className="text-sm font-mono font-semibold text-electric-600 dark:text-cyber-cyan">
                {f.ecole}
              </p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{f.diplome}</h2>
            </div>

            {f.details && (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-200/70 dark:border-slate-800">
                {f.details}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Certifications */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyber-violet/15 text-cyber-violet flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Certifications &amp; MOOC</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Validation continue des compétences analytiques</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidat.certifications.map((cert) => (
            <div
              key={cert.titre}
              className="flex items-center justify-between p-5 rounded-2xl bg-slate-100/80 dark:bg-midnight-950/70 border border-slate-200/70 dark:border-slate-800"
            >
              <div className="flex items-center gap-3.5">
                <BookOpen className="w-5 h-5 text-cyber-cyan shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{cert.titre}</h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    Plateforme : {cert.organisme}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-mono bg-emerald-500/10 text-emerald-500 font-semibold">
                Certifié
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
