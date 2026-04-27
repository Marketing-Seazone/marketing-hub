'use client';

import { useEffect, useState } from 'react';
import { TeamLayout } from '@/components/team-layout';
import { T } from '@/lib/constants';
import { FOLLOWERS_DATA, MONTH_KEYS } from '@/lib/followers-config';

const COR = '#7C3AED';

function getMetaMes(): number {
  const mes = new Date().getMonth() + 1;
  const key = MONTH_KEYS[mes];
  const conta = FOLLOWERS_DATA.find(d => d.label === '@destinoseazone' && d.platform === 'Instagram');
  return key && conta ? conta.goals[key] : 110000;
}

function getPeriodoLabel(periodo: 7 | 14 | 30 | 'mes'): string {
  const hoje = new Date();
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (periodo === 'mes') {
    const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return `${fmt(ini)} - ${fmt(hoje)}`;
  }
  const ini = new Date();
  ini.setDate(hoje.getDate() - (periodo as number));
  return `${fmt(ini)} - ${fmt(hoje)}`;
}

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('pt-BR');
}

type Periodo = 7 | 14 | 30;

export default function Page() {
  const [total, setTotal] = useState<number | null>(null);
  const [ganhoHoje, setGanhoHoje] = useState<number | null>(null);
  const [ganhoMes, setGanhoMes] = useState<number | null>(null);
  const [historico, setHistorico] = useState<{ data: string; total_seguidores: number; ganho_dia: number }[]>([]);
  const [loadingSeguidores, setLoadingSeguidores] = useState(true);
  const [erroSeguidores, setErroSeguidores] = useState<string | null>(null);
  const [periodoGrafico, setPeriodoGrafico] = useState<7 | 14 | 30 | 'mes'>('mes');
  const [tooltip, setTooltip] = useState<{ idx: number; x: number } | null>(null);
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
        setGanhoHoje(typeof data.ganho_hoje === 'number' ? data.ganho_hoje : null);
        setGanhoMes(typeof data.ganho_mes === 'number' ? data.ganho_mes : null);
        setHistorico(Array.isArray(data.historico) ? data.historico : []);
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

  const historicoFiltrado = (() => {
    if (periodoGrafico === 'mes') {
      const inicioMes = new Date().toISOString().slice(0, 7) + '-01';
      return historico.filter(d => d.data >= inicioMes);
    }
    const corte = new Date();
    corte.setDate(corte.getDate() - (periodoGrafico as number));
    return historico.filter(d => d.data >= corte.toISOString().split('T')[0]);
  })();

  const ganhoPeriodo = (() => {
    if (periodoGrafico === 'mes' && ganhoMes !== null) return ganhoMes;
    return historicoFiltrado.reduce((s, d) => s + (d.ganho_dia || 0), 0);
  })();

  const W = 680, H = 140, PL = 36, PB = 28, PT = 8, PR = 8;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxGanho = Math.max(...historicoFiltrado.map(d => d.ganho_dia || 0), 1);
  const n = historicoFiltrado.length;
  const barW = n > 1 ? Math.max(6, (cW / n) - 3) : 20;
  const xs = (i: number) => n > 1 ? PL + (i / (n - 1)) * cW : PL + cW / 2;
  const ys = (v: number) => PT + cH - (v / maxGanho) * cH;

  const periodosGrafico: { label: string; val: 7 | 14 | 30 | 'mes' }[] = [
    { label: 'Mes atual', val: 'mes' },
    { label: '7 dias', val: 7 },
    { label: '14 dias', val: 14 },
    { label: '30 dias', val: 30 },
  ];

  function MetCard({ label, value, color, icon }: { label: string; value: number | null; color: string; icon: string }) {
    return (
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
  }

  return (
    <TeamLayout teamId="social-midia">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: 1 }}>INSTAGRAM</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.cardFg, margin: 0 }}>@destinoseazone — Metricas</h2>
        </div>

        {/* Seguidores */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', boxShadow: T.elevSm }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: '0 0 16px' }}>Seguidores</p>
          {loadingSeguidores && <p style={{ color: T.mutedFg, fontSize: 13 }}>Carregando...</p>}
          {erroSeguidores && <p style={{ color: '#EF4444', fontSize: 13 }}>Erro: {erroSeguidores}</p>}
          {!loadingSeguidores && !erroSeguidores && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total de Seguidores', value: fmt(total), color: COR },
                  { label: 'Ganho Hoje', value: ganhoHoje != null ? `+${fmt(ganhoHoje)}` : '—', color: '#16A34A' },
                  { label: 'Meta Mensal', value: fmt(META_MES), color: '#D97706' },
                  { label: 'Ganho no Mes', value: ganhoMes != null ? `+${fmt(ganhoMes)}` : '—', color: COR },
                  { label: 'Falta para Meta', value: faltam != null ? (faltam > 0 ? fmt(faltam) : 'Batida!') : '—', color: faltam === 0 ? '#16A34A' : '#DC2626' },
                ].map(kpi => (
                  <div key={kpi.label} style={{ background: T.muted, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, margin: '0 0 6px', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{kpi.label}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: kpi.color, margin: 0 }}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>Progresso para meta de {fmt(META_MES)}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: progresso >= 100 ? '#16A34A' : COR, margin: 0 }}>{progresso.toFixed(1)}%</p>
                </div>
                <div style={{ background: T.border, borderRadius: 999, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${progresso}%`, height: '100%', background: progresso >= 100 ? '#16A34A' : `linear-gradient(90deg, ${COR}, #A855F7)`, borderRadius: 999, transition: 'width 0.6s ease' }} />
                </div>
              </div>

              {/* Grafico */}
              <div style={{ background: T.muted, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap' as const, gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.mutedFg, margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>Ganho diario</p>
                    <div style={{ background: `${COR}12`, border: `1px solid ${COR}30`, borderRadius: 8, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: T.mutedFg }}>{getPeriodoLabel(periodoGrafico)}:</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: COR }}>+{ganhoPeriodo.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {periodosGrafico.map(p => (
                      <button key={String(p.val)} onClick={() => { setPeriodoGrafico(p.val); setTooltip(null); }}
                        style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: `1px solid ${periodoGrafico === p.val ? COR : T.border}`, background: periodoGrafico === p.val ? COR : 'transparent', color: periodoGrafico === p.val ? '#fff' : T.mutedFg }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {historicoFiltrado.length === 0
                  ? <p style={{ fontSize: 12, color: T.mutedFg, fontStyle: 'italic', textAlign: 'center' as const, padding: '16px 0' }}>Sem dados. O historico e preenchido automaticamente ao abrir a pagina.</p>
                  : (
                    <div style={{ overflow: 'hidden', position: 'relative' }} onMouseLeave={() => setTooltip(null)}>
                      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}
                        onMouseMove={e => {
                          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                          const mx = ((e.clientX - rect.left) / rect.width) * W;
                          let closest = 0; let minD = Infinity;
                          historicoFiltrado.forEach((_, i) => { const d = Math.abs(xs(i) - mx); if (d < minD) { minD = d; closest = i; } });
                          if (minD < barW * 2) setTooltip({ idx: closest, x: xs(closest) });
                          else setTooltip(null);
                        }}>
                        <defs><clipPath id="seazone-clip"><rect x={PL} y={PT} width={cW} height={cH} /></clipPath></defs>
                        {[0, Math.round(maxGanho / 2), maxGanho].map(v => (
                          <g key={v}>
                            <line x1={PL} x2={W - PR} y1={ys(v)} y2={ys(v)} stroke={T.border} strokeWidth={0.5} />
                            <text x={PL - 4} y={ys(v) + 4} fontSize={9} fill={T.mutedFg ?? '#888'} textAnchor="end">{v}</text>
                          </g>
                        ))}
                        <g clipPath="url(#seazone-clip)">
                          {historicoFiltrado.map((d, i) => {
                            const ganho = d.ganho_dia || 0;
                            const bh = Math.max(2, (ganho / maxGanho) * cH);
                            const isHoje = d.data === new Date().toISOString().split('T')[0];
                            return (
                              <rect key={d.data} x={xs(i) - barW / 2} y={ys(ganho)} width={barW} height={bh}
                                fill={tooltip?.idx === i ? '#5B21B6' : isHoje ? COR : `${COR}60`} rx={2} style={{ transition: 'fill 0.1s' }} />
                            );
                          })}
                        </g>
                        {tooltip && <line x1={xs(tooltip.idx)} x2={xs(tooltip.idx)} y1={PT} y2={H - PB} stroke={COR} strokeWidth={1} strokeDasharray="3 2" opacity={0.5} />}
                        {historicoFiltrado.length <= 20
                          ? historicoFiltrado.map((d, i) => (
                            <text key={d.data} x={xs(i)} y={H - 6} fontSize={9} fill={tooltip?.idx === i ? COR : T.mutedFg ?? '#888'} fontWeight={tooltip?.idx === i ? 700 : 400} textAnchor="middle">{d.data.slice(8)}</text>
                          ))
                          : [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor(3 * n / 4), n - 1].map(i => (
                            <text key={i} x={xs(i)} y={H - 6} fontSize={9} fill={T.mutedFg ?? '#888'} textAnchor="middle">
                              {historicoFiltrado[i]?.data.slice(8)}/{historicoFiltrado[i]?.data.slice(5, 7)}
                            </text>
                          ))
                        }
                      </svg>
                      {tooltip && (() => {
                        const d = historicoFiltrado[tooltip.idx];
                        const ganho = d?.ganho_dia || 0;
                        const dataFmt = d?.data.split('-').reverse().join('/') ?? '';
                        const isHoje = d?.data === new Date().toISOString().split('T')[0];
                        return (
                          <div style={{ position: 'absolute', top: 4, left: `${(xs(tooltip.idx) / W) * 100}%`, transform: tooltip.idx > n * 0.65 ? 'translateX(-110%)' : 'translateX(10px)', background: T.card, border: `1.5px solid ${COR}50`, borderRadius: 10, padding: '10px 14px', pointerEvents: 'none' as const, zIndex: 10, boxShadow: '0 4px 20px rgba(124,58,237,0.15)', minWidth: 150 }}>
                            <p style={{ margin: '0 0 6px', fontSize: 11, color: T.mutedFg, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {dataFmt}
                              {isHoje && <span style={{ background: COR, color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>hoje</span>}
                            </p>
                            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: COR, lineHeight: 1 }}>+{ganho.toLocaleString('pt-BR')}</p>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: T.mutedFg }}>seguidores ganhos</p>
                          </div>
                        );
                      })()}
                    </div>
                  )
                }
              </div>
            </div>
          )}
        </div>

        {/* Metricas do Periodo */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', boxShadow: T.elevSm }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: 0 }}>Metricas do Periodo</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {([7, 14, 30] as Periodo[]).map(d => (
                <button key={d} onClick={() => setPeriodo(d)} style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${periodo === d ? COR : T.border}`, background: periodo === d ? COR : T.card, color: periodo === d ? '#fff' : T.mutedFg, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{d}d</button>
              ))}
            </div>
          </div>
          {metricas && (
            <p style={{ fontSize: 11, color: T.mutedFg, margin: '0 0 16px' }}>
              {metricas.periodo?.inicio} → {metricas.periodo?.fim}
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
            <MetCard label="Interacoes Posts"  value={metricas?.interacoes_posts ?? null} color="#10B981" icon="❤️" />
            <MetCard label="Alcance Reels"     value={metricas?.alcance_reels ?? null}    color="#F59E0B" icon="🎬" />
            <MetCard label="Views Stories"     value={metricas?.views_stories ?? null}    color="#EC4899" icon="📷" />
            <MetCard label="Visitas ao Perfil" value={metricas?.visitas_perfil ?? null}   color={COR}     icon="👁️" />
          </div>
        </div>

      </div>
    </TeamLayout>
  );
}