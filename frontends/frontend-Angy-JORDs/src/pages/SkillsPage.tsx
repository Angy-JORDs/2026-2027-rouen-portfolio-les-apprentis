import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ForceGraph2D from 'react-force-graph-2d';
import { ArrowUpRight, Briefcase, FolderGit2, LayoutGrid, Search, Share2, Target, X } from 'lucide-react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Competence, StatCompetence, Experience, Projet, GraphData } from '../types/portfolio';
import { skillMatches, expSlug } from '../services/skillLinks';
import { useTheme } from '../hooks/useTheme';

/* ================================================================== */
/*  Types & constantes                                                 */
/* ================================================================== */

interface SkillsPageProps {
  competences: Competence[];
  stats: StatCompetence[];
  graph: GraphData;
  projets: Projet[];
  experiences: Experience[];
}

// Champs supposés sur Competence : niveau (0-5) · depuis (année de 1re utilisation)
type Skill = Competence & { niveau?: number; depuis?: number };
type View = 'radar' | 'reseau' | 'matrice';
interface Usage { projets: Projet[]; exps: Experience[] }
interface Rel { slug: string; w: number }

interface Shared {
  skills: Skill[];
  domains: string[];
  colorOf: (d: string) => string;
  usage: Record<string, Usage>;
  related: Record<string, Rel[]>;
  visible: (s: Skill) => boolean;
  focus: string | null;
  setHover: (slug: string | null) => void;
  select: (slug: string) => void;
  toggleDomain: (d: string) => void;
  activeDomain: string | null;
  isDark: boolean;
  reduce: boolean;
}

const DOMAIN_LABELS: Record<string, string> = {
  langages: 'Langages',
  'big-data': 'Big Data',
  'ia-ml': 'IA & ML',
  'bi-visualisation': 'BI & Data Viz',
  'data-engineering': 'Data Engineering',
  'bases-de-donnees': 'Bases de données',
  outils: 'Outils',
};
const PALETTE = ['#38bdf8', '#a78bfa', '#34d399', '#fb7185', '#fbbf24', '#22d3ee', '#f472b6', '#94a3b8'];
const LEVEL_NAMES = ['', 'Notions', 'Débutant', 'Intermédiaire', 'Avancé', 'Expert'];
const RINGS = [
  { label: 'Expert', test: (n: number) => n >= 5 },
  { label: 'Avancé', test: (n: number) => n === 4 },
  { label: 'En développement', test: (n: number) => n < 4 },
];

const domOf = (s: Skill) => s.domaine ?? 'autres';
const domLabel = (d: string) => DOMAIN_LABELS[d] ?? d.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const colorFor = (domains: string[], d: string) => PALETTE[Math.max(domains.indexOf(d), 0) % PALETTE.length];
const ringOf = (s: Skill) => ((s.niveau ?? 0) >= 5 ? 0 : (s.niveau ?? 0) === 4 ? 1 : 2);
const nz = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const short = (n: string) => {
  let s = n.split(' (')[0];
  if (s.length > 16) s = s.split(' & ')[0].split(' / ')[0];
  return s.length > 18 ? s.slice(0, 17) + '…' : s;
};

/* ------------------------------------------------------------------ */
/*  À placer sur la page détail d'un projet : tags → fiche compétence  */
/* ------------------------------------------------------------------ */
export const ProjectSkillChips: React.FC<{ skills: Pick<Competence, 'skill_slug' | 'nom'>[] }> = ({ skills }) => (
  <div className="flex flex-wrap gap-2">
    {skills.map((s) => (
      <Link
        key={s.skill_slug}
        to={`/competences?skill=${s.skill_slug}`}
        className="px-3 py-1 text-xs rounded-full border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10 transition-colors"
      >
        {s.nom}
      </Link>
    ))}
  </div>
);

/* ================================================================== */
/*  KPI animé                                                          */
/* ================================================================== */

const Kpi: React.FC<{ value: number; label: string; reduce: boolean }> = ({ value, label, reduce }) => {
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) {
      setN(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / 900, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return (
    <div className="px-5 py-4">
      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{n}</p>
      <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
};

/* ================================================================== */
/*  Vue 1 : RADAR                                                      */
/* ================================================================== */

const CX = 460;
const CY = 370;
const R = 300;
const RING_EDGES = [108, 204, 300];
const BANDS: [number, number][] = [[46, 98], [122, 190], [220, 288]];

const polar = (r: number, deg: number) => ({
  x: CX + r * Math.cos((deg * Math.PI) / 180),
  y: CY + r * Math.sin((deg * Math.PI) / 180),
});
const wedge = (a0: number, a1: number, r0: number, r1: number) => {
  const p0 = polar(r1, a0), p1 = polar(r1, a1), p2 = polar(r0, a1), p3 = polar(r0, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${p0.x} ${p0.y} A${r1} ${r1} 0 ${large} 1 ${p1.x} ${p1.y} L${p2.x} ${p2.y} A${r0} ${r0} 0 ${large} 0 ${p3.x} ${p3.y} Z`;
};

const RadarView: React.FC<{ sh: Shared }> = ({ sh }) => {
  const { skills, domains, colorOf, related, visible, focus, setHover, select, toggleDomain, activeDomain, isDark, reduce } = sh;
  const step = 360 / Math.max(domains.length, 1);
  const txt = isDark ? '#cbd5e1' : '#334155';
  const grid = isDark ? 'rgba(148,163,184,0.2)' : 'rgba(51,65,85,0.25)';
  const halo = isDark ? 'rgba(5,5,16,0.9)' : 'rgba(248,250,252,0.9)';

  const placed = useMemo(() => {
    const out: Record<string, { x: number; y: number; a: number; r: number; ring: number }> = {};
    domains.forEach((d, i) => {
      const a0 = -90 + i * step - step / 2;
      const list = skills.filter((s) => domOf(s) === d).sort((x, y) => (y.niveau ?? 0) - (x.niveau ?? 0));
      const pad = Math.min(8, step * 0.15);
      list.forEach((s, j) => {
        const a = a0 + pad + ((j + 0.5) / list.length) * (step - 2 * pad);
        const ring = ringOf(s);
        const [r0, r1] = BANDS[ring];
        const r = r0 + ((j * 0.618 + i * 0.31) % 1) * (r1 - r0);
        out[s.skill_slug] = { ...polar(r, a), a, r, ring };
      });
    });
    return out;
  }, [skills, domains, step]);

  const relMap = useMemo(
    () => (focus ? new Map((related[focus] ?? []).map((r) => [r.slug, r.w] as [string, number])) : null),
    [focus, related]
  );
  const focusPos = focus ? placed[focus] : undefined;
  const focusSkill = focus ? skills.find((s) => s.skill_slug === focus) : undefined;

  return (
    <svg viewBox="0 0 920 740" className="w-full h-auto" role="img" aria-label="Radar des compétences : un secteur par domaine, un anneau par niveau">
      <defs>
        <radialGradient id="core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF003C" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FF003C" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Secteurs */}
      {domains.map((d, i) => {
        const a0 = -90 + i * step - step / 2;
        const on = activeDomain === d;
        return (
          <path
            key={d}
            d={wedge(a0, a0 + step, 0, R)}
            fill={colorOf(d)}
            opacity={on ? 0.14 : i % 2 ? 0.04 : 0.015}
            style={{ transition: 'opacity .25s' }}
          />
        );
      })}

      {/* Anneaux + séparateurs */}
      {RING_EDGES.map((r, i) => (
        <g key={r}>
          <circle cx={CX} cy={CY} r={r} fill="none" stroke={grid} strokeDasharray={i === 2 ? undefined : '2 6'} />
          <text x={CX} y={CY - r + 13} textAnchor="middle" fontSize="9" letterSpacing="1.5" fill={txt} opacity="0.4" fontFamily="ui-monospace, monospace">
            {RINGS[i].label.toUpperCase()}
          </text>
        </g>
      ))}
      {domains.map((d, i) => {
        const a0 = -90 + i * step - step / 2;
        const p = polar(R, a0);
        return <line key={d} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={grid} strokeWidth="1" opacity="0.6" />;
      })}

      {/* Balayage radar */}
      {!reduce && (
        <g style={{ transformOrigin: `${CX}px ${CY}px`, animation: 'radar-sweep 14s linear infinite' }} pointerEvents="none">
          {Array.from({ length: 10 }).map((_, k) => (
            <path key={k} d={wedge(-(k + 1) * 4, -k * 4, 0, R)} fill="#22d3ee" opacity={0.12 * (1 - k / 10)} />
          ))}
          <line x1={CX} y1={CY} x2={CX + R} y2={CY} stroke="#22d3ee" strokeWidth="1.2" opacity="0.5" />
        </g>
      )}

      {/* Labels de domaines */}
      {domains.map((d, i) => {
        const mid = -90 + i * step;
        const p = polar(R + 24, mid);
        const c = Math.cos((mid * Math.PI) / 180);
        const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
        return (
          <text
            key={d}
            x={p.x}
            y={p.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="13"
            fontWeight="600"
            fill={colorOf(d)}
            opacity={activeDomain && activeDomain !== d ? 0.35 : 1}
            style={{ cursor: 'pointer' }}
            onClick={() => toggleDomain(d)}
          >
            {domLabel(d)}
          </text>
        );
      })}

      {/* Arcs de co-utilisation */}
      {focus && focusPos && focusSkill &&
        (related[focus] ?? []).map((r) => {
          const t = placed[r.slug];
          if (!t) return null;
          const mx = (focusPos.x + t.x) / 2;
          const my = (focusPos.y + t.y) / 2;
          const cx = CX + (mx - CX) * 0.25;
          const cy = CY + (my - CY) * 0.25;
          return (
            <path
              key={r.slug}
              d={`M${focusPos.x} ${focusPos.y} Q${cx} ${cy} ${t.x} ${t.y}`}
              fill="none"
              stroke={colorOf(domOf(focusSkill))}
              strokeWidth={1 + Math.min(r.w, 3) * 0.7}
              strokeOpacity={0.55}
              strokeDasharray="3 5"
              style={reduce ? undefined : { animation: 'radar-flow 1.2s linear infinite' }}
              pointerEvents="none"
            />
          );
        })}

      {/* Compétences */}
      {skills.map((s) => {
        const p = placed[s.skill_slug];
        if (!p) return null;
        const color = colorOf(domOf(s));
        const isFocus = focus === s.skill_slug;
        const isRel = !!relMap?.has(s.skill_slug);
        let op = 1;
        if (!visible(s)) op = 0.12;
        else if (focus && !isFocus && !isRel) op = 0.25;

        const flip = Math.cos((p.a * Math.PI) / 180) < 0;
        const outward = p.ring < 2;
        const d = outward ? p.r + 11 : p.r - 11;
        const anchor = outward !== flip ? 'start' : 'end';

        return (
          <g
            key={s.skill_slug}
            opacity={op}
            tabIndex={0}
            role="button"
            aria-label={`${s.nom}, niveau ${s.niveau ?? 0} sur 5`}
            style={{ cursor: 'pointer', transition: 'opacity .25s', outline: 'none' }}
            onMouseEnter={() => setHover(s.skill_slug)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(s.skill_slug)}
            onBlur={() => setHover(null)}
            onClick={() => select(s.skill_slug)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                select(s.skill_slug);
              }
            }}
          >
            {isFocus && (
              <circle cx={p.x} cy={p.y} r="8" fill="none" stroke={color} strokeWidth="1.5">
                {!reduce && <animate attributeName="r" values="8;22" dur="2s" repeatCount="indefinite" />}
                {!reduce && <animate attributeName="opacity" values="0.7;0" dur="2s" repeatCount="indefinite" />}
              </circle>
            )}
            <circle cx={p.x} cy={p.y} r="16" fill="transparent" />
            <circle cx={p.x} cy={p.y} r={isFocus ? 9 : p.ring === 0 ? 7.5 : 6} fill={color} stroke={halo} strokeWidth="2" />
            <g transform={`translate(${CX} ${CY}) rotate(${flip ? p.a + 180 : p.a})`}>
              <text
                x={flip ? -d : d}
                dy="0.35em"
                textAnchor={anchor}
                fontSize="11"
                fontWeight={isFocus ? 700 : 500}
                fill={txt}
                stroke={halo}
                strokeWidth="3"
                paintOrder="stroke"
              >
                {short(s.nom)}
              </text>
            </g>
          </g>
        );
      })}

      {/* Noyau */}
      <circle cx={CX} cy={CY} r="34" fill="url(#core)" pointerEvents="none" />
      <circle cx={CX} cy={CY} r="15" fill="#FF003C" pointerEvents="none" />
      <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill="#fff" pointerEvents="none">
        AT
      </text>
    </svg>
  );
};

/* ================================================================== */
/*  Vue 2 : RÉSEAU (co-utilisation)                                    */
/* ================================================================== */

const NetworkView: React.FC<{ sh: Shared }> = ({ sh }) => {
  const { skills, domains, related, visible, focus, select, setHover, toggleDomain, activeDomain, isDark, reduce } = sh;
  const boxRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    if (!boxRef.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    domains.forEach((d) => nodes.push({ id: `dom:${d}`, name: domLabel(d), kind: 'hub', dom: d, color: colorFor(domains, d) }));
    skills.forEach((s) => {
      const d = domOf(s);
      nodes.push({ id: s.skill_slug, name: s.nom, kind: 'skill', dom: d, level: s.niveau ?? 0, color: colorFor(domains, d) });
      links.push({ source: `dom:${d}`, target: s.skill_slug, type: 'struct', w: 0 });
    });
    skills.forEach((s) =>
      (related[s.skill_slug] ?? []).forEach((r) => {
        if (s.skill_slug < r.slug) links.push({ source: s.skill_slug, target: r.slug, type: 'usage', w: r.w });
      })
    );
    return { nodes, links };
  }, [skills, domains, related]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force('charge')?.strength(-140);
    fg.d3Force('link')?.distance((l: any) => (l.type === 'struct' ? 36 : 80)).strength((l: any) => (l.type === 'struct' ? 0.9 : 0.05));
  }, [data]);

  const lit = useMemo(() => {
    if (!focus) return null;
    const set = new Set<string>([focus]);
    (related[focus] ?? []).forEach((r) => set.add(r.slug));
    const sk = skills.find((s) => s.skill_slug === focus);
    if (sk) set.add(`dom:${domOf(sk)}`);
    return set;
  }, [focus, related, skills]);

  const skillBySlug = useMemo(() => new Map(skills.map((s) => [s.skill_slug, s] as [string, Skill])), [skills]);
  const id = (x: any) => (typeof x === 'object' ? x.id : x);

  const paint = (node: any, ctx: CanvasRenderingContext2D, scale: number) => {
    const isHub = node.kind === 'hub';
    const sk = isHub ? null : skillBySlug.get(node.id);
    let alpha = 1;
    if (lit && !lit.has(node.id)) alpha = 0.15;
    if (sk && !visible(sk)) alpha = 0.1;
    if (isHub && activeDomain && activeDomain !== node.dom) alpha = Math.min(alpha, 0.3);
    const r = isHub ? 7 : 3 + node.level * 0.9;

    ctx.globalAlpha = alpha;
    if (isHub || node.id === focus) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 5, 0, 2 * Math.PI);
      ctx.fillStyle = node.color + '33';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();

    const showLabel = isHub || scale > 1.3 || (lit && lit.has(node.id)) || (!lit && node.level >= 5);
    if (showLabel) {
      const fs = (isHub ? 12 : 10.5) / Math.max(scale, 0.9);
      ctx.font = `${isHub ? '700 ' : '500 '}${fs}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isDark ? '#E2E8F0' : '#1E293B';
      ctx.fillText(isHub ? node.name : short(node.name), node.x, node.y + r + 2);
    }
    ctx.globalAlpha = 1;
  };

  return (
    <div ref={boxRef} className="w-full">
      <ForceGraph2D
        ref={fgRef}
        width={Math.max(width, 280)}
        height={560}
        graphData={data}
        backgroundColor="transparent"
        nodeLabel={(n: any) => n.name}
        nodeCanvasObject={paint}
        nodePointerAreaPaint={(n: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 10, 0, 2 * Math.PI);
          ctx.fill();
        }}
        linkWidth={(l: any) => (l.type === 'usage' ? 1 + Math.min(l.w, 3) * 0.8 : 0.6)}
        linkColor={(l: any) => {
          const a = id(l.source);
          const b = id(l.target);
          if (lit && !(lit.has(a) && lit.has(b))) return isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
          if (l.type === 'struct') return isDark ? 'rgba(148,163,184,0.18)' : 'rgba(71,85,105,0.25)';
          return isDark ? 'rgba(34,211,238,0.55)' : 'rgba(8,145,178,0.6)';
        }}
        linkDirectionalParticles={(l: any) => (l.type === 'usage' && focus && (id(l.source) === focus || id(l.target) === focus) && !reduce ? 2 : 0)}
        linkDirectionalParticleWidth={2.2}
        linkDirectionalParticleColor={() => '#22d3ee'}
        onNodeHover={(n: any) => setHover(n && n.kind === 'skill' ? n.id : null)}
        onNodeClick={(n: any) => (n.kind === 'skill' ? select(n.id) : toggleDomain(n.dom))}
        warmupTicks={reduce ? 200 : 0}
        cooldownTicks={reduce ? 0 : 150}
        onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
      />
    </div>
  );
};

/* ================================================================== */
/*  Vue 3 : MATRICE (preuves d'usage)                                  */
/* ================================================================== */

const MatrixView: React.FC<{ sh: Shared; projets: Projet[]; experiences: Experience[] }> = ({ sh, projets, experiences }) => {
  const { skills, domains, colorOf, usage, visible, select, focus, setHover } = sh;
  const [hoverCol, setHoverCol] = useState<string | null>(null);

  const cols = useMemo(
    () => [
      ...experiences.map((e) => ({ key: `e${expSlug(e)}`, label: e.entreprise, kind: 'exp' as const, href: `/experiences?exp=${expSlug(e)}` })),
      ...projets.map((p) => ({ key: `p${p.projet_slug}`, label: p.titre, kind: 'proj' as const, href: `/projets/${p.projet_slug}` })),
    ],
    [projets, experiences]
  );

  const keysOf = (slug: string) => {
    const u = usage[slug];
    return new Set<string>([...(u?.projets ?? []).map((p) => `p${p.projet_slug}`), ...(u?.exps ?? []).map((e) => `e${expSlug(e)}`)]);
  };

  const rows = domains
    .map((d) => ({ d, list: skills.filter((s) => domOf(s) === d && visible(s)).sort((a, b) => (b.niveau ?? 0) - (a.niveau ?? 0)) }))
    .filter((r) => r.list.length);

  if (cols.length === 0) {
    return <p className="p-8 text-center text-sm text-slate-500">Aucun projet ni expérience fournis : la matrice n'a rien à croiser.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 px-3 pb-3 text-[11px] font-mono text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-cyan-400" /> Expérience</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-violet-400" /> Projet</span>
      </div>
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-offwhite dark:bg-midnight-950 text-left text-[11px] font-mono uppercase text-slate-500 px-3 pb-2 align-bottom">Compétence</th>
            {cols.map((c) => (
              <th key={c.key} className="px-1 pb-2 align-bottom" onMouseEnter={() => setHoverCol(c.key)} onMouseLeave={() => setHoverCol(null)}>
                <Link
                  to={c.href}
                  title={c.label}
                  className={`block mx-auto max-h-36 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium border-l-2 pl-1.5 hover:text-white ${
                    c.kind === 'exp' ? 'border-cyan-400 text-cyan-300' : 'border-violet-400 text-violet-300'
                  }`}
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  {c.label}
                </Link>
              </th>
            ))}
            <th className="px-3 pb-2 text-[11px] font-mono text-slate-500 align-bottom">Σ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <React.Fragment key={r.d}>
              <tr>
                <td colSpan={cols.length + 2} className="pt-4 pb-1 px-3 text-[11px] font-mono uppercase tracking-wider" style={{ color: colorOf(r.d) }}>
                  {domLabel(r.d)}
                </td>
              </tr>
              {r.list.map((s) => {
                const keys = keysOf(s.skill_slug);
                const isFocus = focus === s.skill_slug;
                return (
                  <tr
                    key={s.skill_slug}
                    onClick={() => select(s.skill_slug)}
                    onMouseEnter={() => setHover(s.skill_slug)}
                    onMouseLeave={() => setHover(null)}
                    className={`cursor-pointer transition-colors ${isFocus ? 'bg-cyan-400/10' : 'hover:bg-white/5'}`}
                  >
                    <td className="sticky left-0 z-10 bg-offwhite dark:bg-midnight-950 px-3 py-2 whitespace-nowrap">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{short(s.nom)}</span>
                      <span className="ml-2 inline-flex gap-0.5 align-middle">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <i key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i <= (s.niveau ?? 0) ? colorOf(r.d) : 'rgba(148,163,184,.25)' }} />
                        ))}
                      </span>
                    </td>
                    {cols.map((c) => (
                      <td key={c.key} className={`text-center py-2 ${hoverCol === c.key ? 'bg-white/5' : ''}`}>
                        {keys.has(c.key) ? (
                          <span className="inline-block w-3 h-3 rounded-full" style={{ background: colorOf(r.d), boxShadow: `0 0 10px ${colorOf(r.d)}88` }} />
                        ) : (
                          <span className="inline-block w-1 h-1 rounded-full bg-slate-500/30" />
                        )}
                      </td>
                    ))}
                    <td className="px-3 text-center text-xs font-mono text-slate-500">{keys.size || '—'}</td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ================================================================== */
/*  Inspecteur (panneau de détail)                                     */
/* ================================================================== */

const Inspector: React.FC<{
  sh: Shared;
  skill?: Skill;
  onClear: () => void;
  onPick: (slug: string) => void;
}> = ({ sh, skill, onClear, onPick }) => {
  const { skills, colorOf, usage, related } = sh;

  if (!skill) {
    const top = [...skills].sort((a, b) => (b.niveau ?? 0) - (a.niveau ?? 0)).slice(0, 6);
    return (
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-cyan-500">Inspecteur</p>
          <h3 className="text-lg font-bold mt-1 text-slate-900 dark:text-white">Sélectionnez une compétence</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cliquez sur un point du radar : vous verrez où elle a été utilisée et avec quelles autres technologies.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono uppercase text-slate-500 mb-2">Cœur de stack</p>
          <div className="flex flex-wrap gap-2">
            {top.map((s) => (
              <button
                key={s.skill_slug}
                onClick={() => onPick(s.skill_slug)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 hover:border-cyan-400/50 transition-colors text-slate-800 dark:text-slate-100"
              >
                <span className="w-2 h-2 rounded-full" style={{ background: colorOf(domOf(s)) }} />
                {short(s.nom)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const color = colorOf(domOf(skill));
  const u = usage[skill.skill_slug] ?? { projets: [], exps: [] };
  const rel = (related[skill.skill_slug] ?? []).slice(0, 8);
  const level = Math.min(Math.max(skill.niveau ?? 0, 0), 5);
  const nameOf = (slug: string) => skills.find((s) => s.skill_slug === slug)?.nom ?? slug;

  return (
    <motion.div key={skill.skill_slug} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border" style={{ color, borderColor: color + '55', background: color + '14' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {domLabel(domOf(skill))}
          </span>
          <h3 className="text-2xl font-bold mt-3 leading-tight text-slate-900 dark:text-white">{skill.nom}</h3>
        </div>
        <button onClick={onClear} aria-label="Fermer" className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i <= level ? color : 'rgba(148,163,184,.22)', boxShadow: i <= level ? `0 0 8px ${color}66` : 'none' }} />
          ))}
        </div>
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1.5">
          {LEVEL_NAMES[level] || 'Non évalué'} · {level}/5{skill.depuis ? ` · depuis ${skill.depuis}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { v: u.exps.length, l: 'Expériences' },
          { v: u.projets.length, l: 'Projets' },
          { v: rel.length, l: 'Liens' },
        ].map((k) => (
          <div key={k.l} className="rounded-xl bg-white/5 border border-white/10 py-2.5">
            <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">{k.v}</p>
            <p className="text-[10px] font-mono uppercase text-slate-500">{k.l}</p>
          </div>
        ))}
      </div>

      {u.exps.length === 0 && u.projets.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Compétence acquise en formation : pas encore mobilisée dans un projet ou une mission référencée.</p>
      )}

      {u.exps.length > 0 && (
        <div>
          <p className="text-[11px] font-mono uppercase text-slate-500 mb-2 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> En entreprise</p>
          <ul className="space-y-1.5">
            {u.exps.map((e) => (
              <li key={expSlug(e)}>
                <Link to={`/experiences?exp=${expSlug(e)}`} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-cyan-400/10 text-sm transition-colors group">
                  <span className="text-slate-800 dark:text-slate-100">{e.poste} <span className="text-slate-500">· {e.entreprise}</span></span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {u.projets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-mono uppercase text-slate-500 flex items-center gap-1.5"><FolderGit2 className="w-3.5 h-3.5" /> En projet</p>
            <Link to={`/projets?skill=${skill.skill_slug}`} className="text-[11px] font-mono text-cyan-400 hover:underline">Tout voir →</Link>
          </div>
          <ul className="space-y-1.5">
            {u.projets.map((p) => (
              <li key={p.projet_slug}>
                <Link to={`/projets/${p.projet_slug}`} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-cyan-400/10 text-sm transition-colors group">
                  <span className="text-slate-800 dark:text-slate-100">{p.titre}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {rel.length > 0 && (
        <div>
          <p className="text-[11px] font-mono uppercase text-slate-500 mb-2">Souvent associée à</p>
          <div className="flex flex-wrap gap-1.5">
            {rel.map((r) => (
              <button key={r.slug} onClick={() => onPick(r.slug)} className="px-2.5 py-1 rounded-lg text-xs bg-white/5 border border-white/10 hover:border-cyan-400/50 transition-colors text-slate-800 dark:text-slate-100">
                {short(nameOf(r.slug))} <span className="text-slate-500">×{r.w}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export const SkillsPage: React.FC<SkillsPageProps> = ({ competences, projets = [], experiences = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const reduce = !!useReducedMotion();
  const [params, setParams] = useSearchParams();
  const [hover, setHover] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [ringFilter, setRingFilter] = useState<number | null>(null);
  const [defaultView] = useState<View>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'matrice' : 'radar'));
  const searchRef = useRef<HTMLInputElement>(null);
  const inspectorRef = useRef<HTMLDivElement>(null);

  const skills = useMemo(() => competences as Skill[], [competences]);
  const domains = useMemo(() => Array.from(new Set(skills.map(domOf))), [skills]);
  const colorOf = useMemo(() => (d: string) => colorFor(domains, d), [domains]);

  // ---- État dans l'URL : ?skill=…&domaine=…&vue=… (lien partageable) ----
  const rawView = params.get('vue');
  const vue: View = rawView === 'radar' || rawView === 'reseau' || rawView === 'matrice' ? rawView : defaultView;
  const selectedSlug = params.get('skill');
  const activeDomain = params.get('domaine');

  const update = (patch: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) => (v === null ? n.delete(k) : n.set(k, v)));
        return n;
      },
      { replace: true }
    );

  const select = (slug: string) => {
    update({ skill: selectedSlug === slug ? null : slug });
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    }
  };
  const toggleDomain = (d: string) => update({ domaine: activeDomain === d ? null : d });

  // ---- Données dérivées ----
  const usage = useMemo(() => {
    const map: Record<string, Usage> = {};
    skills.forEach((s) => {
      map[s.skill_slug] = {
        projets: projets.filter((p) => p.competences.some((t) => skillMatches(t, s))),
        exps: experiences.filter((e) => e.competences.some((t) => skillMatches(t, s))),
      };
    });
    return map;
  }, [skills, projets, experiences]);

  // Co-utilisation : deux compétences sont liées quand elles servent dans le même projet / la même mission
  const related = useMemo(() => {
    const keys: Record<string, Set<string>> = {};
    skills.forEach((s) => {
      const u = usage[s.skill_slug];
      keys[s.skill_slug] = new Set([...u.projets.map((p) => `p${p.projet_slug}`), ...u.exps.map((e) => `e${expSlug(e)}`)]);
    });
    const rel: Record<string, Rel[]> = {};
    skills.forEach((a) => {
      rel[a.skill_slug] = [];
      skills.forEach((b) => {
        if (a.skill_slug === b.skill_slug) return;
        let w = 0;
        keys[b.skill_slug].forEach((k) => keys[a.skill_slug].has(k) && w++);
        if (w) rel[a.skill_slug].push({ slug: b.skill_slug, w });
      });
      rel[a.skill_slug].sort((x, y) => y.w - x.w);
    });
    return rel;
  }, [skills, usage]);

  const visible = (s: Skill) =>
    (!q || nz(s.nom).includes(nz(q))) &&
    (!activeDomain || domOf(s) === activeDomain) &&
    (ringFilter === null || ringOf(s) === ringFilter);

  const focus = hover ?? selectedSlug;
  const selected = selectedSlug ? skills.find((s) => s.skill_slug === selectedSlug) : undefined;
  const filtersOn = !!q || !!activeDomain || ringFilter !== null;

  // Raccourcis : "/" pour chercher, Échap pour désélectionner
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName === 'INPUT';
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setQ('');
        update({ skill: null });
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sh: Shared = {
    skills, domains, colorOf, usage, related, visible, focus, setHover, select, toggleDomain, activeDomain, isDark, reduce,
  };

  const VIEWS: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: 'radar', label: 'Radar', icon: <Target className="w-4 h-4" /> },
    { key: 'reseau', label: 'Réseau', icon: <Share2 className="w-4 h-4" /> },
    { key: 'matrice', label: 'Matrice', icon: <LayoutGrid className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <style>{`@keyframes radar-sweep{to{transform:rotate(360deg)}}@keyframes radar-flow{to{stroke-dashoffset:-16}}`}</style>

      <SectionHeader
        badge="Neo4j Knowledge Graph"
        title="Cartographie des Compétences"
        subtitle="Un radar interactif : chaque domaine est un secteur, chaque niveau un anneau, et chaque lien montre ce que j'utilise ensemble."
      />

      {/* KPIs */}
      <div className="glass-card rounded-2xl grid grid-cols-2 sm:grid-cols-5 divide-x divide-slate-200/60 dark:divide-white/10">
        <Kpi value={skills.length} label="Compétences" reduce={reduce} />
        <Kpi value={skills.filter((s) => ringOf(s) === 0).length} label="Niveau expert" reduce={reduce} />
        <Kpi value={domains.length} label="Domaines" reduce={reduce} />
        <Kpi value={projets.length} label="Projets" reduce={reduce} />
        <Kpi value={experiences.length} label="Expériences" reduce={reduce} />
      </div>

      {/* Barre d'outils */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 rounded-xl glass-card" role="tablist" aria-label="Mode d'affichage">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                role="tab"
                aria-selected={vue === v.key}
                onClick={() => update({ vue: v.key })}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  vue === v.key ? 'bg-electric-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const first = skills.find(visible);
                  if (first) select(first.skill_slug);
                }
              }}
              placeholder="Rechercher une compétence…"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl glass-card text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/60"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-500/40 text-slate-500">/</kbd>
          </div>

          {filtersOn && (
            <button
              onClick={() => {
                setQ('');
                setRingFilter(null);
                update({ domaine: null });
              }}
              className="text-xs font-mono text-slate-500 hover:text-cyan-400 inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {RINGS.map((r, i) => {
            const count = skills.filter((s) => ringOf(s) === i).length;
            return (
              <button
                key={r.label}
                onClick={() => setRingFilter(ringFilter === i ? null : i)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  ringFilter === i ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-300' : 'border-slate-500/30 text-slate-500 dark:text-slate-400 hover:border-slate-400'
                }`}
              >
                {r.label} <span className="opacity-60">· {count}</span>
              </button>
            );
          })}
          <span className="w-px h-5 bg-slate-500/30 mx-1" />
          {domains.map((d) => (
            <button
              key={d}
              onClick={() => toggleDomain(d)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeDomain === d ? 'bg-white/10 border-white/40 text-slate-900 dark:text-white' : 'border-slate-500/30 text-slate-500 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: colorOf(d) }} />
              {domLabel(d)}
            </button>
          ))}
        </div>
      </div>

      {/* Visualisation + Inspecteur */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div
          className="glass-card rounded-3xl p-3 sm:p-5 overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(rgba(148,163,184,0.14) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        >
          {vue === 'radar' && <RadarView sh={sh} />}
          {vue === 'reseau' && <NetworkView sh={sh} />}
          {vue === 'matrice' && <MatrixView sh={sh} projets={projets} experiences={experiences} />}
          <p className="text-center mt-2 text-[11px] font-mono text-slate-500">
            {vue === 'radar' && 'Survolez un point pour voir ses liens · cliquez pour ouvrir la fiche · clic sur un domaine pour filtrer'}
            {vue === 'reseau' && "Deux compétences sont reliées quand elles servent dans le même projet ou la même mission · molette pour zoomer"}
            {vue === 'matrice' && 'Chaque point prouve un usage réel · cliquez une ligne pour ouvrir la fiche'}
          </p>
        </div>

        <div ref={inspectorRef} className="glass-card rounded-3xl p-5 sm:p-6 lg:sticky lg:top-24 self-start">
          <AnimatePresence mode="wait">
            <Inspector
              key={selected?.skill_slug ?? 'empty'}
              sh={sh}
              skill={selected}
              onClear={() => update({ skill: null })}
              onPick={(slug) => update({ skill: slug })}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
