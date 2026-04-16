'use client';

import { useEffect, useState } from 'react';
import { TeamLayout } from '@/components/team-layout';
import { T } from '@/lib/constants';
import { FOLLOWERS_DATA, MONTH_KEYS } from '@/lib/followers-config';

function getMetaMes(): number {
  const mes = new Date().getMonth() + 1;
  const key = MONTH_KEYS[mes];
  const conta = FOLLOWERS_DATA.find(d => d.label === '@destinoseazone' && d.platform === 'Instagram');
  return key && conta ? conta.goals[key] : 110000;
}

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('pt-BR');
}

type Periodo = 7 | 14 | 30;

export default function Page() {
  const [total, setTotal] = useState<number | null>(null);
  const [ganho, setGanho] = useState<number | null>(null);
  const [loadingSeguidores, setLoadingSeguidores] = useState(true);
  const [erroSeguidores, setErroSeguidores] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>(7);
  const [metricas, setMetricas] = useState<any>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);

  const META_MES = getMetaMes();
  const faltam = total !== null ? Math.max(0, META_MES - total) : null;
  const progresso = total !== null ? Math.min(100, (total / META_MES) * 100) : 0;

  useEffect(() => {
    fetch('/api/seguidores-seazone')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErroSeguidores(data.error); return; }
        setTotal(typeof data.total_seguidores === 'number' ? data.total_seguidores : null);
        setGanho(typeof data.ganho_hoje === 'number' ? data.ganho_hoje : null);
      })
      .catch(e => setErroSeguidores(e.message))
      .finally(() => setLoadingSeguidores(false));
  }, []);

  useEffect(() => {
    setLoadingMetricas(true);
    fetch(`/api/metricas-seazone?dias=${periodo}`)
      .then(r => r.json())
      .then(data => setMetricas(data))
      .catch(() => setMetricas(null))
      .finally(() => setLoadingMetricas(false));
  }, [periodo]);

  const statCard = (label: string, value: string, color: string) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 140 }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, margin: '0 0 8px', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color, margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  );

  const metCard = (label: string, value: number | null, color: string, icon: string) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 150 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <p style={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, margin: 0, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{label}</p>
      </div>
      {loadingMetricas
        ? <p style={{ fontSize: 20, color: T.mutedFg, margin: 0 }}>...</p>
        : <p style={{ fontSize: 26, fontWeight: 700, color, margin: 0, lineHeight: 1 }}>{fmt(value)}</p>
      }
    </div>
  );

  return (
    <TeamLayout teamId="social-midia">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: 1 }}>INSTAGRAM</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.cardFg, margin: 0 }}>@destinoseazone — Métricas</h2>
        </div>

        {/* Seguidores */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', boxShadow: T.elevSm }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: '0 0 16px' }}>Seguidores</p>
          {loadingSeguidores && <p style={{ color: T.mutedFg, fontSize: 13 }}>Carregando...</p>}
          {erroSeguidores && <p style={{ color: '#EF4444', fontSize: 13 }}>Erro: {erroSeguidores}</p>}
          {!loadingSeguidores && !erroSeguidores && (
            <>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 20 }}>
                {statCard('Total de Seguidores', fmt(total), '#7C3AED')}
                {statCard('Ganho Hoje', ganho !== null ? `+${fmt(ganho)}` : '—', '#16A34A')}
                {statCard('Meta do Mês', fmt(META_MES), '#D97706')}
                {statCard('Faltam para a Meta', fmt(faltam), '#DC2626')}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>Progresso para meta de {fmt(META_MES)}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#7C3AED', margin: 0 }}>{progresso.toFixed(1)}%</p>
                </div>
                <div style={{ background: T.border, borderRadius: 999, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${progresso}%`, height: '100%', background: 'linear-gradient(90deg, #7C3AED, #A855F7)', borderRadius: 999, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Métricas do Período */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', boxShadow: T.elevSm }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: 0 }}>Métricas do Período</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {([7, 14, 30] as Periodo[]).map(d => (
                <button key={d} onClick={() => setPeriodo(d)} style={{
                  padding: '5px 14px', borderRadius: 20,
                  border: `1px solid ${periodo === d ? '#7C3AED' : T.border}`,
                  background: periodo === d ? '#7C3AED' : T.card,
                  color: periodo === d ? '#fff' : T.mutedFg,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>{d}d</button>
              ))}
            </div>
          </div>
          {metricas && (
            <p style={{ fontSize: 11, color: T.mutedFg, margin: '0 0 16px' }}>
              {metricas.periodo?.inicio} → {metricas.periodo?.fim}
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 12 }}>
            {metCard('Novos Seguidores',    metricas?.novos_seguidores ?? null,  '#7C3AED', '👥')}
            {metCard('Alcance Reels',       metricas?.alcance_reels ?? null,     '#F59E0B', '🎬')}
            {metCard('Interações Posts',    metricas?.interacoes_posts ?? null,  '#10B981', '❤️')}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
            {metCard('Views Stories',       metricas?.views_stories ?? null,     '#EC4899', '📸')}
          </div>
        </div>

        {/* Placeholder top posts */}
        <div style={{ background: T.card, border: `1px dashed ${T.border}`, borderRadius: 12, padding: '28px 24px', textAlign: 'center' as const }}>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>📊 Top Posts · Reels · Stories — em breve</p>
        </div>

      </div>
    </TeamLayout>
  );
}
