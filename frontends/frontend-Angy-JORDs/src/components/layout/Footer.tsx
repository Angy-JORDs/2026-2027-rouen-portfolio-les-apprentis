import React from 'react';
import { Github, Linkedin, Mail, MapPin } from 'lucide-react';
import { CANDIDAT_DATA } from '../../data/candidatData';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-midnight-950/90 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="flex items-center gap-4">
            <a href={CANDIDAT_DATA.liens.github} target="_blank" rel="noreferrer" className="p-3 rounded-full glass-card hover:text-electric-500 text-slate-700 dark:text-slate-200 transition-all"><Github className="w-5 h-5" /></a>
            <a href={CANDIDAT_DATA.liens.linkedin} target="_blank" rel="noreferrer" className="p-3 rounded-full glass-card hover:text-electric-500 text-slate-700 dark:text-slate-200 transition-all"><Linkedin className="w-5 h-5" /></a>
            <a href={`mailto:${CANDIDAT_DATA.email}`} className="p-3 rounded-full glass-card hover:text-electric-500 text-slate-700 dark:text-slate-200 transition-all"><Mail className="w-5 h-5" /></a>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-900 dark:text-white">Ange Jordan TONLIO</p>
            <p className="mt-1 flex items-center justify-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-cyber-cyan" /> {CANDIDAT_DATA.localisation}</p>
          </div>
        </div>
        <div className="border-t border-slate-200/70 dark:border-slate-800/70 mt-8 pt-6 flex justify-center text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Ange Jordan Tonlio — Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};
