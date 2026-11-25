import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { Competence } from '../../types/portfolio';

interface SkillsRadarChartProps {
  competences: Competence[];
}

const DOMAIN_LABELS: Record<string, string> = {
  langages: 'Langages (Python/SQL)',
  'big-data': 'Big Data (Spark/Hadoop)',
  'ia-ml': 'Machine Learning & IA',
  'bi-visualisation': 'BI & Data Viz',
  'data-engineering': 'Data Engineering & ETL',
  'bases-de-donnees': 'Bases de Données',
};

export const SkillsRadarChart: React.FC<SkillsRadarChartProps> = ({ competences }) => {
  const domainData = Object.entries(DOMAIN_LABELS).map(([key, label]) => {
    const items = competences.filter((c) => c.domaine === key && c.niveau !== null);
    const avg = items.length
      ? Number(((items.reduce((acc, cur) => acc + (cur.niveau || 0), 0) / items.length) * 20).toFixed(0))
      : 60;
    return {
      domain: label,
      score: avg,
      fullMark: 100,
    };
  });

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Cartographie des Domaines Data &amp; IA
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Indice de maîtrise consolidé par pôle d’expertise (%)
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-cyber-violet/10 text-cyber-violet">
          Radar Analytics
        </span>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={domainData}>
            <PolarGrid stroke="#475569" strokeOpacity={0.3} />
            <PolarAngleAxis
              dataKey="domain"
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Maîtrise"
              dataKey="score"
              stroke="#06B6D4"
              strokeWidth={2.5}
              fill="#3B82F6"
              fillOpacity={0.32}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B1120',
                borderColor: '#1E293B',
                borderRadius: '12px',
                color: '#F8FAFC',
              }}
              formatter={(value: number) => [`${value}%`, 'Indice de maîtrise']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
