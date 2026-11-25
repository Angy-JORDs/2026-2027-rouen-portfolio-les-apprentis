import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';

/**
 * Fond animé : réseau de neurones où circulent des impulsions de données
 * (pipeline → couches → prédiction), avec quelques technologies en légende.
 * Canvas 2D, aucune dépendance. Respecte prefers-reduced-motion (image fixe).
 */

const LAYERS = [3, 5, 6, 6, 5, 3];
const TECH_LABELS = ['Pandas', 'PySpark', 'Scikit-learn', 'DAX', 'Neo4j', 'MongoDB', 'Hadoop', 'ETL'];

interface NodeT { l: number; ry: number; phase: number; label?: string }
interface EdgeT { a: number; b: number }
interface PulseT { e: number; t: number }

export const DataNetworkBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    const parent = canvas?.parentElement;
    if (!canvas || !ctx || !parent) return;

    const dark = theme === 'dark';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const C = dark
      ? { line: '148,163,184', node: '226,232,240', accent: '34,211,238', grid: '148,163,184' }
      : { line: '51,65,85', node: '30,41,59', accent: '8,145,178', grid: '51,65,85' };

    // ---------- Construction du réseau ----------
    const nodes: NodeT[] = [];
    const byLayer: number[][] = LAYERS.map(() => []);
    LAYERS.forEach((n, l) => {
      for (let i = 0; i < n; i++) {
        byLayer[l].push(nodes.length);
        nodes.push({ l, ry: (i + 0.5) / n + (Math.random() - 0.5) * 0.05, phase: Math.random() * 6.28 });
      }
    });

    const edges: EdgeT[] = [];
    const incoming = new Set<number>();
    for (let l = 0; l < LAYERS.length - 1; l++) {
      byLayer[l].forEach((a) => {
        [...byLayer[l + 1]]
          .sort((p, q) => Math.abs(nodes[p].ry - nodes[a].ry) - Math.abs(nodes[q].ry - nodes[a].ry))
          .slice(0, 3)
          .forEach((b) => {
            edges.push({ a, b });
            incoming.add(b);
          });
      });
      byLayer[l + 1].forEach((b) => {
        if (incoming.has(b)) return;
        const a = [...byLayer[l]].sort((p, q) => Math.abs(nodes[p].ry - nodes[b].ry) - Math.abs(nodes[q].ry - nodes[b].ry))[0];
        edges.push({ a, b });
      });
    }
    const out: number[][] = nodes.map(() => []);
    edges.forEach((e, i) => out[e.a].push(i));
    const firstLayerEdges = edges.map((e, i) => (nodes[e.a].l === 0 ? i : -1)).filter((i) => i >= 0);

    // Légendes techno sur quelques nœuds des couches centrales
    let k = 0;
    byLayer.slice(1, 5).forEach((ids, li) => {
      ids.forEach((id, i) => {
        if ((i + li) % 3 === 0 && k < TECH_LABELS.length) nodes[id].label = TECH_LABELS[k++];
      });
    });

    // ---------- Dimensions ----------
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(0, 0);
    };

    const pos = (n: NodeT, time: number) => {
      const wide = w >= 700;
      const x0 = wide ? w * 0.4 : 24;
      const x1 = w - 28;
      return {
        x: x0 + (n.l / (LAYERS.length - 1)) * (x1 - x0),
        y: h * (0.1 + 0.8 * n.ry) + Math.sin(time * 0.0006 + n.phase) * 5,
      };
    };

    // ---------- Rendu ----------
    const pulses: PulseT[] = [];
    let spawnTimer = 0;

    function draw(time: number, dt: number) {
      ctx!.clearRect(0, 0, w, h);
      const wide = w >= 700;
      const base = wide ? 1 : 0.45;

      // Grille de points (plus visible vers la droite)
      for (let gx = 14; gx < w; gx += 28) {
        const fade = 0.02 + 0.09 * (gx / w);
        ctx!.fillStyle = `rgba(${C.grid},${fade})`;
        for (let gy = 14; gy < h; gy += 28) ctx!.fillRect(gx, gy, 1.2, 1.2);
      }

      const P = nodes.map((n) => pos(n, time));
      const af = (x: number) => base * (wide ? 0.3 + 0.7 * (x / w) : 1);

      // Arêtes
      ctx!.lineWidth = 1;
      edges.forEach((e) => {
        const a = P[e.a];
        const b = P[e.b];
        ctx!.strokeStyle = `rgba(${C.line},${0.16 * af((a.x + b.x) / 2)})`;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      });

      // Impulsions de données
      if (!reduce) {
        spawnTimer += dt;
        if (spawnTimer > 380 && pulses.length < 16) {
          spawnTimer = 0;
          pulses.push({ e: firstLayerEdges[Math.floor(Math.random() * firstLayerEdges.length)], t: 0 });
        }
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i];
          p.t += dt * 0.0008;
          if (p.t >= 1) {
            const next = out[edges[p.e].b];
            if (next.length) {
              p.e = next[Math.floor(Math.random() * next.length)];
              p.t = 0;
            } else pulses.splice(i, 1);
          }
        }
      } else if (!pulses.length) {
        // image fixe : quelques impulsions figées
        firstLayerEdges.slice(0, 4).forEach((e) => pulses.push({ e, t: 0.5 }));
      }
      pulses.forEach((p) => {
        const a = P[edges[p.e].a];
        const b = P[edges[p.e].b];
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        const t0 = Math.max(0, p.t - 0.25);
        const tx = a.x + (b.x - a.x) * t0;
        const ty = a.y + (b.y - a.y) * t0;
        const f = af(x);
        ctx!.strokeStyle = `rgba(${C.accent},${0.55 * f})`;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(tx, ty);
        ctx!.lineTo(x, y);
        ctx!.stroke();
        ctx!.fillStyle = `rgba(${C.accent},${0.18 * f})`;
        ctx!.beginPath();
        ctx!.arc(x, y, 7, 0, 6.3);
        ctx!.fill();
        ctx!.fillStyle = `rgba(${C.accent},${0.95 * f})`;
        ctx!.beginPath();
        ctx!.arc(x, y, 2.4, 0, 6.3);
        ctx!.fill();
      });

      // Nœuds + légendes
      ctx!.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
      nodes.forEach((n, i) => {
        const { x, y } = P[i];
        const f = af(x);
        ctx!.fillStyle = `rgba(${C.node},${0.75 * f})`;
        ctx!.beginPath();
        ctx!.arc(x, y, n.l === 0 || n.l === LAYERS.length - 1 ? 3.6 : 2.6, 0, 6.3);
        ctx!.fill();
        if (n.label && wide) {
          ctx!.fillStyle = `rgba(${C.accent},${0.7 * f})`;
          ctx!.fillText(n.label, x + 8, y + 3);
        }
      });
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    let raf = 0;
    if (!reduce) {
      let last = performance.now();
      const frame = (now: number) => {
        const dt = Math.min(now - last, 50);
        last = now;
        draw(now, dt);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [theme]);

  return <canvas ref={ref} className={`pointer-events-none ${className}`} aria-hidden="true" />;
};
