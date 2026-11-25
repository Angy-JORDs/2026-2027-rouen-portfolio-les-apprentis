import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';

/**
 * Fond "salle d'analyse de données" :
 *  - une matrice de corrélation (heatmap) qui évolue lentement et réagit au curseur,
 *  - une série temporelle qui défile, annotée avec des métriques de vos projets,
 *  - une grille de points discrète.
 * Canvas 2D, aucune dépendance. Image fixe si prefers-reduced-motion.
 */

interface Props {
  className?: string;
  /** Métriques affichées sur la courbe (ex: issues de vos projets) */
  annotations?: string[];
}

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

export const DataObservatoryBackground: React.FC<Props> = ({
  className = '',
  annotations = ['R² 0.70', 'F1 0.90', '40 000 lignes'],
}) => {
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
      ? { heatA: [59, 130, 246], heatB: [34, 211, 238], line: '34,211,238', line2: '129,140,248', dot: '148,163,184', text: '226,232,240', halo: '5,5,16' }
      : { heatA: [37, 99, 235], heatB: [8, 145, 178], line: '8,145,178', line2: '79,70,229', dot: '51,65,85', text: '30,41,59', halo: '248,250,252' };

    let w = 0;
    let h = 0;
    let mx = -999;
    let my = -999;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(0);
    };
    const onMove = (e: MouseEvent) => {
      const r = parent.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    const onLeave = () => {
      mx = -999;
      my = -999;
    };

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h);
      const wide = w >= 900;

      // ---- 1. Grille de points ----
      ctx!.fillStyle = `rgba(${C.dot},${dark ? 0.1 : 0.16})`;
      for (let x = 16; x < w; x += 32) for (let y = 16; y < h; y += 32) ctx!.fillRect(x, y, 1.2, 1.2);

      // ---- 2. Matrice de corrélation ----
      const cs = 24;
      const size = cs - 3;
      const x0 = wide ? w * 0.48 : 0;
      const cols = Math.ceil((w - x0) / cs);
      const rows = Math.ceil(h / cs);
      const alphaK = wide ? 1 : 0.4;
      for (let i = 0; i < cols; i++) {
        const x = x0 + i * cs;
        const u = (x - x0) / Math.max(w - x0, 1);
        const fadeX = wide ? Math.pow(Math.min(1, u * 1.7), 1.6) : 1;
        for (let j = 0; j < rows; j++) {
          const y = j * cs;
          const v =
            (Math.sin(i * 0.33 + t * 0.0006) + Math.sin(j * 0.41 - t * 0.0005) + Math.sin((i + j) * 0.21 + t * 0.0004) + 3) / 6;
          const vy = Math.sin(Math.PI * Math.min(Math.max(y / h, 0), 1));
          let a = (0.03 + 0.28 * v * v * v) * fadeX * (0.3 + 0.7 * vy) * alphaK;
          if (!reduce) {
            const d = Math.hypot(x + size / 2 - mx, y + size / 2 - my);
            if (d < 120) a += (1 - d / 120) * 0.35 * fadeX;
          }
          if (a < 0.012) continue;
          ctx!.fillStyle = `rgba(${lerp(C.heatA[0], C.heatB[0], v)},${lerp(C.heatA[1], C.heatB[1], v)},${lerp(C.heatA[2], C.heatB[2], v)},${Math.min(a, 0.7)})`;
          ctx!.fillRect(x, y, size, size);
        }
      }

      // ---- 3. Série temporelle ----
      const base = h * 0.86;
      const amp = h * 0.055;
      const f = (x: number, k: number) =>
        base +
        amp *
          (0.6 * Math.sin((x + t * 0.03) * 0.006 + k) +
            0.3 * Math.sin((x + t * 0.05) * 0.014 + k * 2) +
            0.2 * Math.sin((x - t * 0.02) * 0.031 + k * 3));

      // courbe secondaire
      ctx!.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = f(x, 2.2) - h * 0.03;
        x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      }
      const g2 = ctx!.createLinearGradient(0, 0, w, 0);
      g2.addColorStop(0, `rgba(${C.line2},0)`);
      g2.addColorStop(1, `rgba(${C.line2},0.4)`);
      ctx!.strokeStyle = g2;
      ctx!.lineWidth = 1.2;
      ctx!.stroke();

      // courbe principale + aire
      ctx!.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = f(x, 0);
        x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      }
      const gl = ctx!.createLinearGradient(0, 0, w, 0);
      gl.addColorStop(0, `rgba(${C.line},0)`);
      gl.addColorStop(0.4, `rgba(${C.line},0.35)`);
      gl.addColorStop(1, `rgba(${C.line},0.9)`);
      ctx!.strokeStyle = gl;
      ctx!.lineWidth = 1.8;
      ctx!.stroke();
      ctx!.lineTo(w, h);
      ctx!.lineTo(0, h);
      ctx!.closePath();
      const ga = ctx!.createLinearGradient(0, base - amp, 0, h);
      ga.addColorStop(0, `rgba(${C.line},0.13)`);
      ga.addColorStop(1, `rgba(${C.line},0)`);
      ctx!.fillStyle = ga;
      ctx!.fill();

      // ---- 4. Annotations de métriques ----
      if (wide) {
        ctx!.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx!.textAlign = 'center';
        annotations.forEach((label, i) => {
          const x = w * (0.66 + 0.135 * i);
          const y = f(x, 0);
          const pulse = reduce ? 0 : Math.sin(t / 420 + i * 1.7);
          ctx!.strokeStyle = `rgba(${C.line},0.35)`;
          ctx!.setLineDash([2, 3]);
          ctx!.beginPath();
          ctx!.moveTo(x, y - 6);
          ctx!.lineTo(x, y - 30);
          ctx!.stroke();
          ctx!.setLineDash([]);
          ctx!.fillStyle = `rgba(${C.line},0.16)`;
          ctx!.beginPath();
          ctx!.arc(x, y, 8 + pulse * 2, 0, 6.3);
          ctx!.fill();
          ctx!.fillStyle = `rgba(${C.line},1)`;
          ctx!.beginPath();
          ctx!.arc(x, y, 3.2, 0, 6.3);
          ctx!.fill();
          ctx!.lineWidth = 3;
          ctx!.strokeStyle = `rgba(${C.halo},0.85)`;
          ctx!.strokeText(label, x, y - 37);
          ctx!.fillStyle = `rgba(${C.text},0.85)`;
          ctx!.fillText(label, x, y - 37);
        });
      }
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    let raf = 0;
    if (!reduce) {
      parent.addEventListener('mousemove', onMove);
      parent.addEventListener('mouseleave', onLeave);
      const frame = (now: number) => {
        draw(now);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      parent.removeEventListener('mousemove', onMove);
      parent.removeEventListener('mouseleave', onLeave);
    };
  }, [theme, annotations]);

  return <canvas ref={ref} className={`pointer-events-none ${className}`} aria-hidden="true" />;
};
