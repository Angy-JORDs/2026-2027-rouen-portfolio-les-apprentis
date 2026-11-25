import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useNavigate } from "react-router-dom";
import type { Graph, GraphNode } from "../types";

const COLORS: Record<GraphNode["type"], string> = {
  candidat: "#f0abfc",
  projet: "#a78bfa",
  competence: "#7dd3fc",
};

const LABELS: Record<GraphNode["type"], string> = {
  candidat: "Candidat",
  projet: "Projet",
  competence: "Compétence",
};

const ROUTES: Record<GraphNode["type"], string> = {
  candidat: "/candidats",
  projet: "/projets",
  competence: "/competences",
};

/** Graphe de compétences (R5) : l'API renvoie déjà {nodes, links}. Clic sur un nœud = navigation. */
export default function GraphView({ graph, height = 520 }: { graph: Graph; height?: number }) {
  const navigate = useNavigate();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // react-force-graph modifie les objets passés : on lui donne une copie.
  const data = useMemo(
    () => ({
      nodes: graph.nodes.map((n) => ({ ...n })),
      links: graph.links.map((l) => ({ ...l })),
    }),
    [graph],
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-4 text-sm">
        {(Object.keys(COLORS) as GraphNode["type"][]).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: COLORS[t] }} />
            {LABELS[t]}
          </span>
        ))}
        <span className="text-slate-500">Cliquer sur un nœud ouvre sa page.</span>
      </div>
      <div ref={box} className="overflow-hidden rounded-2xl border border-neon/30 bg-night">
        <ForceGraph2D
          width={width}
          height={height}
          graphData={data}
          nodeRelSize={6}
          nodeColor={(n) => COLORS[(n as GraphNode).type]}
          nodeLabel={(n) => `${LABELS[(n as GraphNode).type]} : ${(n as GraphNode).label}`}
          linkColor={() => "#6d5aa8"}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          nodeCanvasObjectMode={() => "after"}
          nodeCanvasObject={(node, ctx, scale) => {
            const n = node as GraphNode & { x?: number; y?: number };
            const size = 11 / scale;
            ctx.font = `${size}px sans-serif`;
            ctx.textAlign = "center";
            ctx.fillStyle = "#e9e3ff";
            ctx.fillText(n.label, n.x ?? 0, (n.y ?? 0) + 9 / scale + size / 2);
          }}
          onNodeClick={(n) => {
            const node = n as GraphNode;
            navigate(node.type === "candidat" ? "/" : `${ROUTES[node.type]}/${node.slug}`);
          }}
        />
      </div>
    </div>
  );
}