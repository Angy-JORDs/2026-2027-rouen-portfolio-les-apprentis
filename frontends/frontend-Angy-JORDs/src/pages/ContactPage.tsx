import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Github, Linkedin, Send, CheckCircle2, Calendar } from 'lucide-react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CandidatProfile } from '../types/portfolio';

interface ContactPageProps {
  candidat: CandidatProfile;
}

export const ContactPage: React.FC<ContactPageProps> = ({ candidat }) => {
  const [formState, setFormState] = useState({
    nom: '',
    email: '',
    entreprise: '',
    sujet: "Opportunité d'alternance Data Scientist / Data Analyst (Octobre 2026)",
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const mailtoLink = `mailto:${candidat.email}?subject=${encodeURIComponent(
      `[Portfolio] ${formState.sujet} — ${formState.entreprise || formState.nom}`
    )}&body=${encodeURIComponent(
      `Bonjour Ange,

Nom : ${formState.nom}
Email : ${formState.email}
Entreprise : ${formState.entreprise}

${formState.message}`
    )}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="space-y-12">
      <SectionHeader
        badge="Échangeons"
        title="Me Contacter"
        subtitle="Disponible pour un entretien concernant une alternance de 12 mois en Data Science ou Data Analysis à partir d'octobre 2026."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Direct Coordinates */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Coordonnées Directes</h2>

            <div className="space-y-4">
              <a
                href={`mailto:${candidat.email}`}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-midnight-950/70 hover:border-electric-500 border border-transparent transition-all"
              >
                <Mail className="w-5 h-5 text-electric-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{candidat.email}</p>
                </div>
              </a>

              <a
                href={`tel:${candidat.telephone.replace(/\s+/g, '')}`}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-midnight-950/70 hover:border-electric-500 border border-transparent transition-all"
              >
                <Phone className="w-5 h-5 text-cyber-cyan shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Téléphone</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{candidat.telephone}</p>
                </div>
              </a>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-midnight-950/70">
                <MapPin className="w-5 h-5 text-cyber-violet shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Localisation</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{candidat.localisation}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-midnight-950/70">
                <Calendar className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Disponibilité </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {candidat.disponibilite}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800 flex gap-3">
              <a
                href={candidat.liens.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-[#0A66C2] text-white hover:opacity-90 transition-opacity"
              >
                <Linkedin className="w-4 h-4" /> LinkedIn
              </a>
              <a
                href={candidat.liens.github}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-slate-900 dark:bg-midnight-800 text-white hover:opacity-90 transition-opacity"
              >
                <Github className="w-4 h-4" /> GitHub
              </a>
            </div>
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Envoyer un message direct
          </h2>

          {submitted && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>
                Votre client messagerie a été préparé avec votre message pour <strong>{candidat.email}</strong>.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={formState.nom}
                  onChange={(e) => setFormState({ ...formState, nom: e.target.value })}
                  placeholder="Ex: Camille Dupont"
                  className="w-full px-4 py-3 rounded-xl bg-slate-100/80 dark:bg-midnight-950 border border-slate-200 dark:border-slate-800 focus:border-electric-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Email professionnel *
                </label>
                <input
                  type="email"
                  required
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  placeholder="camille.dupont@entreprise.fr"
                  className="w-full px-4 py-3 rounded-xl bg-slate-100/80 dark:bg-midnight-950 border border-slate-200 dark:border-slate-800 focus:border-electric-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Entreprise / Organisation
                </label>
                <input
                  type="text"
                  value={formState.entreprise}
                  onChange={(e) => setFormState({ ...formState, entreprise: e.target.value })}
                  placeholder="Nom de l'entreprise ou de l'organisation"
                  className="w-full px-4 py-3 rounded-xl bg-slate-100/80 dark:bg-midnight-950 border border-slate-200 dark:border-slate-800 focus:border-electric-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Objet
                </label>
                <input
                  type="text"
                  required
                  value={formState.sujet}
                  onChange={(e) => setFormState({ ...formState, sujet: e.target.value })}
                  placeholder="Objet de votre message"
                  className="w-full px-4 py-3 rounded-xl bg-slate-100/80 dark:bg-midnight-950 border border-slate-200 dark:border-slate-800 focus:border-electric-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                Message *
              </label>
              <textarea
                rows={7}
                required
                value={formState.message}
                onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                placeholder="Bonjour Ange, nous souhaitons échanger avec vous au sujet d'une alternance..."
                className="w-full px-4 py-3 rounded-xl bg-slate-100/80 dark:bg-midnight-950 border border-slate-200 dark:border-slate-800 focus:border-electric-500 focus:outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-electric-600 to-cyber-violet hover:from-electric-500 hover:to-cyber-violet shadow-lg shadow-electric-500/20 transition-all"
            >
              <Send className="w-4 h-4" /> Envoyer le message
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
