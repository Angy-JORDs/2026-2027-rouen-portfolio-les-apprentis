import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeaderProps {
  badge: string;
  title: string;
  subtitle?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ badge, title, subtitle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mb-10"
    >
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-electric-500/10 text-electric-600 dark:bg-cyber-cyan/10 dark:text-cyber-cyan border border-electric-500/20 dark:border-cyber-cyan/20 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan" />
        {badge}
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
