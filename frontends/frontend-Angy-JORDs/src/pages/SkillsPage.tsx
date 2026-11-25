import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ForceGraph2D from 'react-force-graph-2d';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Link, useNavigate } from 'react-router-dom';
import { Competence, StatCompetence, Experience, Projet } from '../types/portfolio';
import { skillMatches, expSlug } from '../services/skillLinks';
import { useTheme } from '../hooks/useTheme';

interface SkillsPageProps {
  competences: Competence[];
  stats: StatCompetence[];
  projets?: Projet[];
  /** ex: (slug) => navigate(`/projets/${slug}`) */
  onOpenProject?: (slug: string) => void;
  /** Expériences en entreprise, pour relier chaque compétence à ses missions */
  experiences?: Experience[];
  /** ex: (slug) => navigate(`/experiences?exp=${slug}`) */
  onOpenExperience?: (slug: string) => void;
}

// Champs supposés sur Competence (adapte si besoin) :
//  niveau : 0-5 · depuis : année de première utilisation
type Skill = Competence & { niveau?: number; depuis?: number };

const COLORS = { root: '#FF003C', domain: '#3B82F6', skill: '#06B6D4' };

const LEVELS = [
  { key: 'expert', label: 'Expert', hint: 'Cœur de stack, utilisé en production', test: (n: number) => n >= 5 },
  { key: 'avance', label: 'Avancé', hint: 'Maîtrisé, utilisé régulièrement', test: (n: number) => n === 4 },
  { key: 'dev', label: 'En développement', hint: 'Bases solides, en progression', test: (n: number) => n < 4 },
];

/* ------------------------------------------------------------------ */
/*  À utiliser sur la page d'un projet : chips cliquables → compétence */
/* ------------------------------------------------------------------ */
export const ProjectSkillChips: React.FC<{ skills: Pick<Competence, 'skill_slug' | 'nom'>[] }> = ({ skills }) => (
  <div className="flex flex-wrap gap-2">
    {skills.map((s) => (
      <a
        key={s.skill_slug}
        href={`/competences?skill=${s.skill_slug}`}
        className="px-3 py-1 text-xs rounded-full border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10 transition-colors"
      >
        {s.nom}
      </a>
    ))}
  </div>
);

export const SkillsPage: React.FC<SkillsPageProps> = ({
  competences,
  projets = [],
  onOpenProject,
  experiences = [],
  onOpenExperience,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [width, setWidth] = useState(800);

  // État initial lu depuis l'URL (?domaine=...&skill=...)
  const initial = useMemo(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    return { domaine: p.get('domaine') ?? 'all', skill: p.get('skill') };
  }, []);
  const [activeDomain, setActiveDomain] = useState<string>(initial.domaine);
  const [expanded, setExpanded] = useState<string | null>(initial.skill);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const skills = competences as Skill[];

  // ---------- Responsive ----------
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ---------- Données dérivées ----------
  const domains = useMemo(
    () => Array.from(new Set(skills.map((c) => c.domaine).filter(Boolean))) as string[],
    [skills]
  );

  // Projets par compétence : les tags des projets sont comparés par nom (voir utils/skillLinks)
  const projectsBySkill = useMemo(() => {
    const map: Record<string, Projet[]> = {};
    skills.forEach((s) => {
      const hits = projets.filter((p) => p.competences.some((tag) => skillMatches(tag, s)));
      if (hits.length) map[s.skill_slug] = hits;
    });
    return map;
  }, [skills, projets]);

  // Expériences par compétence (correspondance par nom, voir utils/skillLinks)
  const experiencesBySkill = useMemo(() => {
    const map: Record<string, Experience[]> = {};
    skills.forEach((s) => {
      const hits = experiences.filter((e) => e.competences.some((label) => skillMatches(label, s)));
      if (hits.length) map[s.skill_slug] = hits;
    });
    return map;
  }, [skills, experiences]);

  // Stack principal : niveau puis nombre de projets
  const featured = useMemo(
    () =>
      [...skills]
        .sort(
          (a, b) =>
            (b.niveau ?? 0) - (a.niveau ?? 0) ||
            (projectsBySkill[b.skill_slug]?.length ?? 0) - (projectsBySkill[a.skill_slug]?.length ?? 0)
        )
        .slice(0, 6),
    [skills, projectsBySkill]
  );

  const graphData = useMemo(() => {
    const nodes: any[] = [{ id: 'AT', name: 'AT', group: 0, val: 30 }];
    const links: any[] = [];
    domains.forEach((dom) => {
      nodes.push({ id: dom, name: dom, group: 1, val: 15 });
      links.push({ source: 'AT', target: dom });
    });
    skills.forEach((c) => {
      if (c.domaine) {
        nodes.push({ id: c.skill_slug, name: c.nom, group: 2, val: 6, domain: c.domaine });
        links.push({ source: c.domaine, target: c.skill_slug });
      }
    });
    return { nodes, links };
  }, [skills, domains]);

  const highlighted = useMemo(() => {
    const focus = hoverId ?? (activeDomain !== 'all' ? activeDomain : null);
    if (!focus) return null;
    const node = graphData.nodes.find((n) => n.id === focus);
    if (!node) return null;
    const set = new Set<string>(['AT']);
    if (node.group === 1) {
      set.add(node.id);
      graphData.nodes.filter((n) => n.domain === node.id).forEach((n) => set.add(n.id));
    } else if (node.group === 2) {
      set.add(node.id);
      set.add(node.domain);
    } else graphData.nodes.forEach((n) => set.add(n.id));
    return set;
  }, [hoverId, activeDomain, graphData]);

  const filteredSkills = useMemo(
    () => (activeDomain === 'all' ? skills : skills.filter((c) => c.domaine === activeDomain)),
    [skills, activeDomain]
  );

  // ---------- URL ↔ état (lien partageable) ----------
  useEffect(() => {
    const p = new URLSearchParams();
    if (activeDomain !== 'all') p.set('domaine', activeDomain);
    if (expanded) p.set('skill', expanded);
    const qs = p.toString();
    // on conserve history.state pour ne pas perturber React Router
    window.history.replaceState(window.history.state, '', qs ? `?${qs}` : window.location.pathname);
  }, [activeDomain, expanded]);

  // Deep link : scroll vers la compétence demandée dans l'URL
  useEffect(() => {
    if (initial.skill) {
      setTimeout(() => document.getElementById(`skill-${initial.skill}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  }, [initial.skill]);

  // ---------- Physique ----------
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force('charge')?.strength(-220);
    fg.d3Force('link')?.distance((l: any) => (l.source.group === 0 ? 90 : 50));
  }, [graphData]);

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, scale: number) => {
      const dim = highlighted && !highlighted.has(node.id);
      const radius = node.group === 0 ? 11 : node.group === 1 ? 7 : 4;
      const color = node.group === 0 ? COLORS.root : node.group === 1 ? COLORS.domain : COLORS.skill;
      ctx.globalAlpha = dim ? 0.15 : 1;
      if (!dim && (node.group < 2 || node.id === hoverId)) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = color + '33';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      const showLabel = node.group < 2 || scale > 1.1 || (highlighted && highlighted.has(node.id));
      if (showLabel && !dim) {
        const fs = (node.group === 2 ? 10 : 11) / Math.max(scale, 0.8);
        ctx.font = `${node.group < 2 ? '600 ' : ''}${fs}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = node.group === 0 ? 'middle' : 'top';
        ctx.fillStyle = node.group === 0 ? '#fff' : isDark ? '#E2E8F0' : '#1E293B';
        ctx.fillText(node.name, node.x, node.group === 0 ? node.y : node.y + radius + 2);
      }
      ctx.globalAlpha = 1;
    },
    [highlighted, hoverId, isDark]
  );

  const paintPointer = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.group === 0 ? 14 : node.group === 1 ? 10 : 8, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  const goToSkill = (slug: string, domaine?: string | null) => {
    if (domaine) setActiveDomain(domaine);
    setExpanded(slug);
    setTimeout(() => document.getElementById(`skill-${slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  };

  const handleNodeClick = (node: any) => {
    if (node.group === 1) setActiveDomain((d) => (d === node.id ? 'all' : node.id));
    else if (node.group === 2) goToSkill(node.id, node.domain);
    else setActiveDomain('all');
  };

  const openProject = (slug: string) => {
    if (onOpenProject) onOpenProject(slug);
    else navigate(`/projets/${slug}`);
  };

  const openExperience = (e: Experience) => {
    if (onOpenExperience) onOpenExperience(expSlug(e));
    else navigate(`/experiences?exp=${expSlug(e)}`);
  };

  const proof = (c: Skill, n: number, nExp = 0) => {
    const parts: string[] = [];
    if (nExp) parts.push(`${nExp} expérience${nExp > 1 ? 's' : ''}`);
    if (n) parts.push(`${n} projet${n > 1 ? 's' : ''}`);
    if (c.depuis) parts.push(`depuis ${c.depuis}`);
    return parts.join(' · ') || 'Acquis en formation';
  };

  return (
    <div className="space-y-10">
      <SectionHeader
        badge="Neo4j Knowledge Graph"
        title="Cartographie des Compétences"
        subtitle="Graphe interactif des technologies maîtrisées, structuré par domaine d'expertise."
      />

      {/* ---------- Stack principal ---------- */}
      <section aria-label="Stack principal" className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500">Stack principal</h2>
        <div className="flex flex-wrap gap-3">
          {featured.map((c) => (
            <button
              key={c.skill_slug}
              onClick={() => goToSkill(c.skill_slug, c.domaine)}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl glass-card border border-white/10 hover:border-cyan-400/60 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              <span className="font-semibold">{c.nom}</span>
              <span className="text-xs text-slate-500">{c.niveau}/5</span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------- Graphe ---------- */}
      <div
        className="glass-card rounded-3xl p-4 overflow-hidden border-cyber-violet/20"
        ref={containerRef}
        role="img"
        aria-label="Graphe des compétences par domaine. Les mêmes informations sont disponibles dans les cartes ci-dessous."
      >
        <ForceGraph2D
          ref={fgRef}
          width={Math.max(width - 32, 280)}
          height={width < 640 ? 360 : 460}
          graphData={graphData}
          backgroundColor="transparent"
          nodeLabel={(n: any) => n.name}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={paintPointer}
          linkWidth={(l: any) => (highlighted && highlighted.has(l.source.id) && highlighted.has(l.target.id) ? 2 : 1)}
          linkColor={(l: any) => {
            const on = !highlighted || (highlighted.has(l.source.id) && highlighted.has(l.target.id));
            if (!on) return isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
            return isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
          }}
          onNodeHover={(n: any) => setHoverId(n ? n.id : null)}
          onNodeClick={handleNodeClick}
          cooldownTicks={reducedMotion ? 0 : 80}
          onEngineStop={() => fgRef.current?.zoomToFit(400, 40)}
        />
        <p className="text-center mt-2 text-xs font-mono text-slate-500">
          Molette pour zoomer · glisser-déposer pour déplacer · clic sur un domaine pour filtrer
        </p>
      </div>

      {/* ---------- Filtres ---------- */}
      <div className="flex flex-wrap gap-2">
        {['all', ...domains].map((d) => (
          <button
            key={d}
            onClick={() => setActiveDomain(d)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              activeDomain === d
                ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30'
                : 'border-slate-600/40 text-slate-400 hover:text-white hover:border-slate-400'
            }`}
          >
            {d === 'all' ? 'Toutes les compétences' : d}
          </button>
        ))}
      </div>

      {/* ---------- Cartes groupées par niveau ---------- */}
      {LEVELS.map((lvl) => {
        const list = filteredSkills.filter((c) => lvl.test(c.niveau ?? 0));
        if (!list.length) return null;
        return (
          <section key={lvl.key} className="space-y-4">
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-bold">{lvl.label}</h2>
              <span className="text-sm text-slate-500">{lvl.hint}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => {
                const linked = projectsBySkill[c.skill_slug] ?? [];
                const exps = experiencesBySkill[c.skill_slug] ?? [];
                const level = Math.min(Math.max(c.niveau ?? 0, 0), 5);
                const isOpen = expanded === c.skill_slug;
                return (
                  <motion.div
                    key={c.skill_slug}
                    id={`skill-${c.skill_slug}`}
                    layout={!reducedMotion}
                    onMouseEnter={() => setHoverId(c.skill_slug)}
                    onMouseLeave={() => setHoverId(null)}
                    className={`glass-card rounded-2xl p-5 border transition-colors ${
                      isOpen ? 'border-cyan-400/60' : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg">{c.nom}</h3>
                      <span className="text-[11px] px-2 py-1 rounded-md bg-white/5 text-slate-400 whitespace-nowrap">
                        {c.domaine}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-1" aria-label={`Niveau ${level} sur 5`}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${
                            i <= level ? 'bg-gradient-to-r from-blue-500 to-cyber-violet' : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{proof(c, linked.length, exps.length)}</p>

                    {(linked.length > 0 || exps.length > 0) && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : c.skill_slug)}
                        aria-expanded={isOpen}
                        className="mt-4 text-sm text-cyan-400 hover:underline"
                      >
                        Voir où je l'ai utilisé {isOpen ? '▴' : '▾'}
                      </button>
                    )}

                    <AnimatePresence initial={false}>
                      {isOpen && (linked.length > 0 || exps.length > 0) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-3 space-y-3"
                        >
                          {exps.length > 0 && (
                            <div>
                              <p className="text-[11px] font-mono uppercase text-slate-500 mb-1">En entreprise</p>
                              <ul className="space-y-1">
                                {exps.map((e) => (
                                  <li key={expSlug(e)}>
                                    <button
                                      onClick={() => openExperience(e)}
                                      className="w-full text-left text-sm px-3 py-2 rounded-lg bg-white/5 hover:bg-cyan-400/10 hover:text-cyan-300 transition-colors"
                                    >
                                      {e.poste} · <span className="text-slate-400">{e.entreprise}</span> →
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {linked.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[11px] font-mono uppercase text-slate-500">En projet</p>
                                <Link
                                  to={`/projets?skill=${c.skill_slug}`}
                                  className="text-[11px] font-mono text-cyan-400 hover:underline"
                                >
                                  Tout voir →
                                </Link>
                              </div>
                              <ul className="space-y-1">
                                {linked.map((p) => (
                                  <li key={p.projet_slug}>
                                    <button
                                      onClick={() => openProject(p.projet_slug)}
                                      className="w-full text-left text-sm px-3 py-2 rounded-lg bg-white/5 hover:bg-cyan-400/10 hover:text-cyan-300 transition-colors"
                                    >
                                      {p.titre} →
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
