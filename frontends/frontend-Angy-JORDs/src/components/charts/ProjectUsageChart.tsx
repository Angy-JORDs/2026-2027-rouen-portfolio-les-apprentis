import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { StatCompetence } from '../../types/portfolio';

interface ProjectUsageChartProps {
  stats: StatCompetence[];
}

const COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#6366F1', '#0EA5E9', '#A855F7'];

export const ProjectUsageChart: React.FC<ProjectUsageChartProps> = ({ stats }) => {
  const topStats = stats.filter((s) => s.nombre_projets > 0).slice(0, 8);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Technologies Mobilisées par Projet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Agrégation dynamique issue de la collection MongoDB <code className="font-mono">projets</code>
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-cyber-cyan/10 text-cyber-cyan">
          MongoDB Stats
        </span>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topStats} layout="vertical" margin={{ top: 5, right: 20, left: 25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" strokeOpacity={0.2} horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="nom"
              width={125}
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B1120',
                borderColor: '#1E293B',
                borderRadius: '12px',
                color: '#F8FAFC',
              }}
              formatter={(value: number) => [`${value} projet(s)`, 'Utilisation']}
            />
            <Bar dataKey="nombre_projets" radius={[0, 8, 8, 0]} barSize={22}>
              {topStats.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
