import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface NavbarProps { dataSource: 'api' | 'local'; }

const navItems = [
  { to: '/', label: 'Accueil' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/competences', label: 'Compétences' },
  { to: '/experiences', label: 'Expériences' },
  { to: '/projets', label: 'Projets' },
  { to: '/formation', label: 'Formation' },
  { to: '/contact', label: 'Contact' },
];

export const Navbar: React.FC<NavbarProps> = ({ dataSource }) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-midnight-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-violet to-electric-600 flex items-center justify-center text-white shadow-lg font-bold font-mono tracking-tighter text-lg">
              AT
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-none">Ange TONLIO</span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-electric-500/10 text-electric-600 dark:text-cyber-cyan font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>{item.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-midnight-900 text-slate-700 dark:text-slate-200">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-electric-600" />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
