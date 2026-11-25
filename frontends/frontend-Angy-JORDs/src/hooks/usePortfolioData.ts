import { useEffect, useState } from 'react';
import { portfolioApi, localFallback } from '../services/api';
import type { CandidatProfile, Projet, StatCompetence, GraphData, DbHealth } from '../types/portfolio';

export function usePortfolioData() {
  const [candidat, setCandidat] = useState<CandidatProfile>(localFallback.candidat);
  const [projets, setProjets] = useState<Projet[]>(localFallback.projets);
  const [stats, setStats] = useState<StatCompetence[]>([]);
  const [graph, setGraph] = useState<GraphData>({nodes:[], links:[]});
  const [dataSource, setDataSource] = useState<'api'|'local'>('local');
  const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        // Les routes R1, R2, R3, R5 et le contrôle des connexions sont chargés ensemble.
        const [profile, projectPage, skillStats, knowledgeGraph, health] = await Promise.all([
          portfolioApi.getCandidatProfile(), portfolioApi.getProjets(), portfolioApi.getStatsCompetences(),
          portfolioApi.getKnowledgeGraph(), portfolioApi.getDatabaseHealth(),
        ]);
        if (!active) return;
        setCandidat(profile); setProjets(projectPage.items); setStats(skillStats); setGraph(knowledgeGraph);
        setDbHealth(health); setDataSource('api'); setApiError(null);
      } catch (error) {
        if (!active) return;
        setCandidat(localFallback.candidat); setProjets(localFallback.projets); setDataSource('local');
        setApiError(error instanceof Error ? error.message : 'API indisponible');
        try { setDbHealth(await portfolioApi.getDatabaseHealth()); } catch { setDbHealth(null); }
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  return { candidat, projets, stats, graph, dataSource, dbHealth, apiError, loading };
}
